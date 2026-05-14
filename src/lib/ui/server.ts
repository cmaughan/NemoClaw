// SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { type ChildProcessByStdio, execFile, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import http, { type IncomingMessage, type ServerResponse } from "node:http";
import path from "node:path";
import type { Readable } from "node:stream";

import { CLI_NAME } from "../cli/branding";
import { isErrnoException } from "../core/errno";
import { sendMessagingTestMessage } from "../messaging/test-send";
import { NAME_ALLOWED_FORMAT } from "../name-validation";
import { redactFull } from "../security/redact";
import * as registry from "../state/registry";
import { UI_HTML } from "./assets";
import type {
  UiChannelCheck,
  UiChannelSummary,
  UiChannelTestResult,
  UiCommandResult,
  UiForwardStatus,
  UiLiveHealth,
  UiOverview,
  UiSandboxSummary,
} from "./model";

const JSON_BODY_LIMIT_BYTES = 16 * 1024;
const COMMAND_TIMEOUT_MS = 120_000;
const FORWARD_PROBE_TIMEOUT_MS = 2_500;
const PREFLIGHT_OUTPUT_LIMIT = 6_000;
const DEFAULT_ROOT = path.resolve(__dirname, "..", "..", "..");
const POLICY_ACTIONS = new Set(["add-dry-run", "add", "remove-dry-run", "remove"]);
type LogChildProcess = ChildProcessByStdio<null, Readable, Readable>;

export interface UiServerOptions {
  rootDir?: string;
  host?: string;
  port?: number;
  token?: string;
  openBrowser?: boolean;
  overviewProvider?: () => Promise<UiOverview>;
  sandboxExists?: (sandboxName: string) => boolean;
  runCliAction?: (args: string[]) => Promise<UiCommandResult>;
  probeForward?: (sandbox: UiSandboxSummary) => Promise<UiForwardStatus>;
  sendChannelTest?: (
    sandbox: UiSandboxSummary,
    channel: UiChannelSummary,
    tokenOverride?: string | null,
  ) => Promise<UiChannelTestResult>;
  spawnLogProcess?: (sandboxName: string, options: { tail: number }) => LogChildProcess;
}

export interface RunningUiServer {
  server: http.Server;
  host: string;
  port: number;
  token: string;
  url: string;
  close: () => Promise<void>;
}

function makeToken(): string {
  return randomBytes(32).toString("base64url");
}

function contentSecurityPolicy(): string {
  return [
    "default-src 'self'",
    "connect-src 'self'",
    "img-src 'self' data:",
    "style-src 'unsafe-inline'",
    "script-src 'unsafe-inline'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join("; ");
}

function setSecurityHeaders(res: ServerResponse): void {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Security-Policy", contentSecurityPolicy());
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
}

function sendText(res: ServerResponse, status: number, text: string): void {
  setSecurityHeaders(res);
  res.statusCode = status;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end(text);
}

function sendJson(res: ServerResponse, status: number, value: unknown): void {
  setSecurityHeaders(res);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(`${JSON.stringify(value)}\n`);
}

function sendHtml(res: ServerResponse): void {
  setSecurityHeaders(res);
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(UI_HTML);
}

function requestToken(req: IncomingMessage, url: URL): string | null {
  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice("bearer ".length).trim();
  }
  const header = req.headers["x-nemoclaw-ui-token"];
  if (typeof header === "string") return header.trim();
  return url.searchParams.get("token");
}

function isAuthorized(req: IncomingMessage, url: URL, token: string): boolean {
  return requestToken(req, url) === token;
}

function parsePath(url: URL): string[] | null {
  try {
    return url.pathname
      .split("/")
      .filter(Boolean)
      .map((segment) => decodeURIComponent(segment));
  } catch {
    return null;
  }
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0;
    let body = "";
    req.setEncoding("utf-8");
    req.on("data", (chunk: string) => {
      size += Buffer.byteLength(chunk);
      if (size > JSON_BODY_LIMIT_BYTES) {
        reject(new Error("Request body too large"));
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on("end", () => {
      if (!body.trim()) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function cliPath(rootDir: string): string {
  return path.join(rootDir, "bin", "nemoclaw.js");
}

function validateSandboxName(name: string): string {
  if (!name || typeof name !== "string") {
    throw new Error(`sandbox name is required. Allowed format: ${NAME_ALLOWED_FORMAT}.`);
  }
  if (name.length > 63) {
    throw new Error(
      `sandbox name too long (max 63 chars): '${name.slice(0, 20)}...'. Allowed format: ${NAME_ALLOWED_FORMAT}.`,
    );
  }
  if (!/^[a-z]([a-z0-9-]*[a-z0-9])?$/.test(name)) {
    throw new Error(`Invalid sandbox name: '${name}'. Allowed format: ${NAME_ALLOWED_FORMAT}.`);
  }
  return name;
}

function validatePresetName(name: string): string {
  if (!name || typeof name !== "string" || name.length > 63) {
    throw new Error("Invalid policy preset name.");
  }
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(name)) {
    throw new Error("Invalid policy preset name.");
  }
  return name;
}

export function runCliAction(rootDir: string, args: string[]): Promise<UiCommandResult> {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [cliPath(rootDir), ...args],
      {
        cwd: rootDir,
        env: process.env,
        timeout: COMMAND_TIMEOUT_MS,
        maxBuffer: 1024 * 1024,
      },
      (error, stdout, stderr) => {
        const status =
          error && typeof (error as { code?: unknown }).code === "number"
            ? ((error as { code: number }).code as number)
            : error
              ? 1
              : 0;
        resolve({
          ok: status === 0,
          status,
          stdout: redactFull(stdout || ""),
          stderr: redactFull(stderr || ""),
        });
      },
    );
  });
}

export function spawnLogProcess(
  rootDir: string,
  sandboxName: string,
  options: { tail: number },
): LogChildProcess {
  return spawn(
    process.execPath,
    [
      cliPath(rootDir),
      sandboxName,
      "logs",
      "--follow",
      "--tail",
      String(options.tail),
    ],
    {
      cwd: rootDir,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
}

function isLoopbackHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return normalized === "127.0.0.1" || normalized === "localhost" || normalized === "::1" || normalized === "[::1]";
}

function safeForwardProbeUrl(sandbox: UiSandboxSummary): URL | null {
  if (!sandbox.dashboardUrl) return null;
  try {
    const url = new URL(sandbox.dashboardUrl);
    if (url.protocol !== "http:" || !isLoopbackHost(url.hostname)) return null;
    if (sandbox.dashboardPort !== null && Number.parseInt(url.port, 10) !== sandbox.dashboardPort) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

export async function probeForward(sandbox: UiSandboxSummary): Promise<UiForwardStatus> {
  const checkedAt = new Date().toISOString();
  const port =
    typeof sandbox.dashboardPort === "number" && Number.isFinite(sandbox.dashboardPort)
      ? sandbox.dashboardPort
      : null;

  if (port === null || !sandbox.dashboardUrl) {
    return {
      configured: false,
      healthy: false,
      state: "not_configured",
      port,
      url: sandbox.dashboardUrl,
      httpStatus: null,
      checkedAt,
    };
  }

  const url = safeForwardProbeUrl(sandbox);
  if (!url) {
    return {
      configured: true,
      healthy: false,
      state: "invalid",
      port,
      url: sandbox.dashboardUrl,
      httpStatus: null,
      checkedAt,
      error: "Recorded endpoint is not a local HTTP URL for the registered port.",
    };
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(FORWARD_PROBE_TIMEOUT_MS),
    });
    return {
      configured: true,
      healthy: true,
      state: "healthy",
      port,
      url: sandbox.dashboardUrl,
      httpStatus: response.status,
      checkedAt,
    };
  } catch (error) {
    return {
      configured: true,
      healthy: false,
      state: "unreachable",
      port,
      url: sandbox.dashboardUrl,
      httpStatus: null,
      checkedAt,
      error: redactFull(error instanceof Error ? error.message : String(error)),
    };
  }
}

function liveHealthForSandbox(sandbox: UiSandboxSummary, forward: UiForwardStatus): UiLiveHealth {
  if (forward.healthy) {
    return {
      sandbox: sandbox.name,
      forward,
      suggestedAction: {
        severity: "ok",
        label: "Forward reachable",
        detail: `${sandbox.endpointLabel} responded${forward.httpStatus ? ` with HTTP ${forward.httpStatus}` : ""}.`,
        command: null,
      },
    };
  }

  if (forward.state === "not_configured") {
    return {
      sandbox: sandbox.name,
      forward,
      suggestedAction: {
        severity: "warn",
        label: "Confirm sandbox metadata",
        detail: "No dashboard/API port is recorded for this sandbox.",
        command: sandbox.commands.status,
      },
    };
  }

  if (forward.state === "invalid") {
    return {
      sandbox: sandbox.name,
      forward,
      suggestedAction: {
        severity: "bad",
        label: "Run doctor",
        detail: "The recorded endpoint is not a local HTTP URL for the registered port.",
        command: sandbox.commands.doctor,
      },
    };
  }

  return {
    sandbox: sandbox.name,
    forward,
    suggestedAction: {
      severity: "bad",
      label: "Repair Forward",
      detail: "Restart the gateway and host-side dashboard/API forward for this sandbox.",
      command: sandbox.commands.recover,
    },
  };
}

function truncateOutput(value: string, limit = PREFLIGHT_OUTPUT_LIMIT): string {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit)}\n...[truncated ${value.length - limit} chars]`;
}

function preflightSnapshotName(): string {
  return `ui-preflight-${new Date().toISOString().replace(/[:.]/g, "-")}`;
}

function commandSummaryLine(label: string, result: UiCommandResult): string {
  return `${label}: ${result.ok ? "ok" : `exit ${result.status ?? "unknown"}`}`;
}

function hasNoSnapshots(result: UiCommandResult): boolean {
  return /No snapshots found/i.test(`${result.stdout}\n${result.stderr}`);
}

function rebuildPreflightResult(input: {
  sandbox: UiSandboxSummary;
  status: UiCommandResult;
  doctor: UiCommandResult;
  snapshotList: UiCommandResult;
}): UiCommandResult {
  const { sandbox, status, doctor, snapshotList } = input;
  const noSnapshots = hasNoSnapshots(snapshotList);
  const ok = status.ok && doctor.ok && snapshotList.ok && !noSnapshots;
  let next = `Copy rebuild command when ready: ${sandbox.commands.rebuild}`;
  if (!status.ok) {
    next = "Fix the status failure before rebuilding.";
  } else if (!doctor.ok) {
    next = "Review doctor output before rebuilding.";
  } else if (noSnapshots) {
    next = "Create Snapshot before copying the rebuild command.";
  }

  const sections = [
    `Rebuild preflight for '${sandbox.name}'`,
    commandSummaryLine("status", status),
    commandSummaryLine("doctor", doctor),
    noSnapshots ? "snapshots: none recorded" : commandSummaryLine("snapshots", snapshotList),
    `next: ${next}`,
  ];
  const stderrSections = [
    !status.ok && status.stdout ? `[status stdout]\n${truncateOutput(status.stdout)}` : "",
    status.stderr ? `[status stderr]\n${truncateOutput(status.stderr)}` : "",
    !doctor.ok && doctor.stdout ? `[doctor stdout]\n${truncateOutput(doctor.stdout)}` : "",
    doctor.stderr ? `[doctor stderr]\n${truncateOutput(doctor.stderr)}` : "",
    !snapshotList.ok && snapshotList.stdout
      ? `[snapshot stdout]\n${truncateOutput(snapshotList.stdout)}`
      : "",
    snapshotList.stderr ? `[snapshot stderr]\n${truncateOutput(snapshotList.stderr)}` : "",
  ].filter(Boolean);

  return {
    ok,
    status: ok ? 0 : 1,
    stdout: sections.join("\n"),
    stderr: stderrSections.join("\n\n"),
  };
}

function parseDoctorMessagingCheck(result: UiCommandResult):
  | { status: "ok" | "warn" | "fail" | "info"; detail: string; hint?: string }
  | null {
  try {
    const parsed = JSON.parse(result.stdout) as {
      checks?: Array<{
        group?: unknown;
        label?: unknown;
        status?: unknown;
        detail?: unknown;
        hint?: unknown;
      }>;
    };
    const check = Array.isArray(parsed.checks)
      ? parsed.checks.find((item) => item.group === "Messaging" && item.label === "Channels")
      : null;
    if (
      !check ||
      (check.status !== "ok" &&
        check.status !== "warn" &&
        check.status !== "fail" &&
        check.status !== "info") ||
      typeof check.detail !== "string"
    ) {
      return null;
    }
    return {
      status: check.status,
      detail: redactFull(check.detail),
      ...(typeof check.hint === "string" ? { hint: redactFull(check.hint) } : {}),
    };
  } catch {
    return null;
  }
}

function statusRank(status: "ok" | "warn" | "fail" | "info"): number {
  return { fail: 3, warn: 2, info: 1, ok: 0 }[status];
}

function summarizeCredentialState(channel: UiChannelSummary): {
  status: "ok" | "warn" | "fail" | "info";
  detail: string;
} {
  if (!channel.configured) {
    return { status: "info", detail: "channel is not configured" };
  }
  const recorded = channel.credentials.filter((credential) => credential.state === "recorded");
  if (recorded.length === channel.credentials.length) {
    return { status: "ok", detail: "required credential hashes are recorded" };
  }
  return {
    status: "info",
    detail: "credential presence is unknown for this older registry entry",
  };
}

function channelCheckResult(input: {
  sandbox: UiSandboxSummary;
  channel: UiChannelSummary;
  doctor: UiCommandResult;
}): UiChannelCheck {
  const checks: UiChannelCheck["checks"] = [];
  const { sandbox, channel, doctor } = input;

  checks.push({
    label: "Registry",
    status: !channel.configured ? "info" : channel.paused ? "warn" : "ok",
    detail: !channel.configured
      ? "channel is not configured for this sandbox"
      : channel.paused
        ? "channel is configured but paused"
        : "channel is configured and enabled in the registry",
    hint: channel.paused ? channel.commands.start : undefined,
  });

  if (channel.configured) {
    checks.push({
      label: "Policy",
      status: channel.policyApplied ? "ok" : "warn",
      detail: channel.policyApplied
        ? `${channel.name} policy preset is applied`
        : `${channel.name} policy preset is not applied`,
      hint: channel.policyApplied ? undefined : `${CLI_NAME} ${sandbox.name} policy-add ${channel.name}`,
    });
    checks.push({
      label: "Credentials",
      ...summarizeCredentialState(channel),
    });
    checks.push({
      label: "Overlap",
      status: channel.overlaps.length > 0 ? "fail" : "ok",
      detail:
        channel.overlaps.length > 0
          ? channel.overlaps
              .map((overlap) => `${overlap.sandbox} (${overlap.reason.replace("-", " ")})`)
              .join(", ")
          : "no registry token overlap detected",
    });
  }

  const doctorCheck = parseDoctorMessagingCheck(doctor);
  if (doctorCheck) {
    checks.push({
      label: "Doctor",
      status: doctorCheck.status,
      detail: doctorCheck.detail,
      ...(doctorCheck.hint ? { hint: doctorCheck.hint } : {}),
    });
  } else {
    checks.push({
      label: "Doctor",
      status: doctor.ok ? "info" : "warn",
      detail: doctor.ok
        ? "doctor did not return a messaging check"
        : "doctor output could not be parsed for messaging status",
      hint: sandbox.commands.doctor,
    });
  }

  const status = checks
    .map((check) => check.status)
    .sort((left, right) => statusRank(right) - statusRank(left))[0] || "info";

  return {
    sandbox: sandbox.name,
    channel: channel.name,
    ok: status === "ok",
    status,
    checkedAt: new Date().toISOString(),
    summary: channel,
    checks,
    command: doctor,
  };
}

function parseTail(value: string | null): number {
  if (!value) return 200;
  if (!/^\d+$/.test(value)) return 200;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 200;
  return Math.min(1000, Math.max(10, parsed));
}

function sendSseEvent(res: ServerResponse, event: string, data: unknown): void {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function streamLines(
  stream: NodeJS.ReadableStream,
  source: string,
  res: ServerResponse,
): void {
  let buffer = "";
  stream.setEncoding("utf-8");
  stream.on("data", (chunk: string) => {
    buffer += chunk;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      sendSseEvent(res, "line", {
        source,
        line: redactFull(line).slice(0, 4096),
      });
    }
  });
  stream.on("end", () => {
    if (buffer) {
      sendSseEvent(res, "line", {
        source,
        line: redactFull(buffer).slice(0, 4096),
      });
    }
  });
}

async function handleLogsStream(
  req: IncomingMessage,
  res: ServerResponse,
  sandboxName: string,
  url: URL,
  deps: Required<Pick<UiServerOptions, "spawnLogProcess" | "sandboxExists">>,
): Promise<void> {
  if (!validateSandboxForRequest(sandboxName, res, deps.sandboxExists)) return;

  setSecurityHeaders(res);
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const child = deps.spawnLogProcess(sandboxName, { tail: parseTail(url.searchParams.get("tail")) });
  let closed = false;
  const closeChild = () => {
    if (closed) return;
    closed = true;
    if (!child.killed && child.exitCode === null && child.signalCode === null) {
      child.kill("SIGTERM");
      setTimeout(() => {
        if (!child.killed && child.exitCode === null && child.signalCode === null) {
          child.kill("SIGKILL");
        }
      }, 2000).unref?.();
    }
  };
  req.on("close", closeChild);
  streamLines(child.stdout, "stdout", res);
  streamLines(child.stderr, "stderr", res);
  child.on("error", (error) => {
    sendSseEvent(res, "line", { source: "error", line: redactFull(error.message) });
  });
  child.on("exit", (code, signal) => {
    sendSseEvent(res, "done", { status: code, signal });
    res.end();
  });
}

function validateSandboxForRequest(
  sandboxName: string,
  res: ServerResponse,
  sandboxExists: (sandboxName: string) => boolean,
): boolean {
  try {
    validateSandboxName(sandboxName);
  } catch (error) {
    sendJson(res, 400, { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
  if (!sandboxExists(sandboxName)) {
    sendJson(res, 404, { error: `Sandbox '${sandboxName}' is not registered.` });
    return false;
  }
  return true;
}

function oneShotTokenFromBody(body: unknown): string | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
  const raw = (body as { token?: unknown }).token;
  if (typeof raw !== "string") return null;
  const normalized = raw.replace(/\r/g, "").trim();
  return normalized.length > 0 && normalized.length <= 4096 ? normalized : null;
}

function bodyString(body: unknown, key: string): string | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
  const raw = (body as Record<string, unknown>)[key];
  if (typeof raw !== "string") return null;
  const normalized = raw.replace(/\r/g, "").trim();
  return normalized.length > 0 && normalized.length <= 256 ? normalized : null;
}

function restoreSnapshotArgs(sandboxName: string, body: unknown): string[] {
  const selector = bodyString(body, "selector");
  const to = bodyString(body, "to");
  const args = [sandboxName, "snapshot", "restore"];
  if (selector) args.push(selector);
  if (to) args.push("--to", validateSandboxName(to));
  return args;
}

function policyMutationArgs(sandboxName: string, presetName: string, action: string): string[] {
  const preset = validatePresetName(presetName);
  if (!POLICY_ACTIONS.has(action)) throw new Error("Unsupported policy action.");
  if (action === "add-dry-run") return [sandboxName, "policy-add", preset, "--dry-run"];
  if (action === "add") return [sandboxName, "policy-add", preset, "--yes"];
  if (action === "remove-dry-run") return [sandboxName, "policy-remove", preset, "--dry-run"];
  return [sandboxName, "policy-remove", preset, "--yes"];
}

async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  opts: {
    overviewProvider: () => Promise<UiOverview>;
    sandboxExists: (sandboxName: string) => boolean;
    runCliAction: (args: string[]) => Promise<UiCommandResult>;
    probeForward: (sandbox: UiSandboxSummary) => Promise<UiForwardStatus>;
    sendChannelTest: (
      sandbox: UiSandboxSummary,
      channel: UiChannelSummary,
      tokenOverride?: string | null,
    ) => Promise<UiChannelTestResult>;
    spawnLogProcess: (sandboxName: string, options: { tail: number }) => LogChildProcess;
  },
): Promise<void> {
  const parts = parsePath(url);
  if (!parts) {
    sendJson(res, 400, { error: "Invalid URL path." });
    return;
  }

  if (req.method === "GET" && parts.length === 2 && parts[0] === "api" && parts[1] === "overview") {
    sendJson(res, 200, await opts.overviewProvider());
    return;
  }

  if (parts[0] === "api" && parts[1] === "actions" && req.method === "POST" && parts.length === 3) {
    await readJsonBody(req);
    const action = parts[2];
    if (action === "inference-get") {
      sendJson(res, 200, await opts.runCliAction(["inference", "get"]));
      return;
    }
    if (action === "upgrade-check") {
      sendJson(res, 200, await opts.runCliAction(["upgrade-sandboxes", "--check"]));
      return;
    }
    if (action === "update-check") {
      sendJson(res, 200, await opts.runCliAction(["update", "--check"]));
      return;
    }
    sendJson(res, 404, { error: "Unsupported global action." });
    return;
  }

  if (parts[0] === "api" && parts[1] === "sandboxes" && typeof parts[2] === "string") {
    const sandboxName = parts[2];

    if (req.method === "GET" && parts.length === 4 && parts[3] === "status") {
      if (!validateSandboxForRequest(sandboxName, res, opts.sandboxExists)) return;
      const overview = await opts.overviewProvider();
      const sandbox = overview.sandboxes.find((entry) => entry.name === sandboxName);
      sendJson(res, 200, { sandbox });
      return;
    }

    if (req.method === "GET" && parts.length === 4 && parts[3] === "live") {
      if (!validateSandboxForRequest(sandboxName, res, opts.sandboxExists)) return;
      const overview = await opts.overviewProvider();
      const sandbox = overview.sandboxes.find((entry) => entry.name === sandboxName);
      if (!sandbox) {
        sendJson(res, 404, { error: `Sandbox '${sandboxName}' is not in the UI overview.` });
        return;
      }
      const forward = await opts.probeForward(sandbox);
      sendJson(res, 200, liveHealthForSandbox(sandbox, forward));
      return;
    }

    if (
      req.method === "GET" &&
      parts.length === 5 &&
      parts[3] === "logs" &&
      parts[4] === "stream"
    ) {
      await handleLogsStream(req, res, sandboxName, url, opts);
      return;
    }

    if (
      req.method === "POST" &&
      parts.length === 6 &&
      parts[3] === "channels" &&
      typeof parts[4] === "string" &&
      parts[5] === "check"
    ) {
      if (!validateSandboxForRequest(sandboxName, res, opts.sandboxExists)) return;
      await readJsonBody(req);
      const channelName = parts[4];
      const overview = await opts.overviewProvider();
      const sandbox = overview.sandboxes.find((entry) => entry.name === sandboxName);
      if (!sandbox) {
        sendJson(res, 404, { error: `Sandbox '${sandboxName}' is not in the UI overview.` });
        return;
      }
      const channel = sandbox.channelStatuses.find((entry) => entry.name === channelName);
      if (!channel) {
        sendJson(res, 404, { error: "Unsupported channel." });
        return;
      }
      const doctor = await opts.runCliAction([sandboxName, "doctor", "--json"]);
      sendJson(res, 200, channelCheckResult({ sandbox, channel, doctor }));
      return;
    }

    if (
      req.method === "POST" &&
      parts.length === 5 &&
      parts[3] === "policies" &&
      parts[4] === "check"
    ) {
      if (!validateSandboxForRequest(sandboxName, res, opts.sandboxExists)) return;
      await readJsonBody(req);
      sendJson(res, 200, await opts.runCliAction([sandboxName, "policy-list"]));
      return;
    }

    if (
      req.method === "POST" &&
      parts.length === 6 &&
      parts[3] === "policies" &&
      typeof parts[4] === "string" &&
      typeof parts[5] === "string"
    ) {
      if (!validateSandboxForRequest(sandboxName, res, opts.sandboxExists)) return;
      await readJsonBody(req);
      try {
        const args = policyMutationArgs(sandboxName, parts[4], parts[5]);
        sendJson(res, 200, await opts.runCliAction(args));
      } catch (error) {
        sendJson(res, 400, { error: error instanceof Error ? error.message : String(error) });
      }
      return;
    }

    if (
      req.method === "POST" &&
      parts.length === 5 &&
      parts[3] === "snapshot" &&
      parts[4] === "restore"
    ) {
      if (!validateSandboxForRequest(sandboxName, res, opts.sandboxExists)) return;
      const body = await readJsonBody(req);
      try {
        sendJson(res, 200, await opts.runCliAction(restoreSnapshotArgs(sandboxName, body)));
      } catch (error) {
        sendJson(res, 400, { error: error instanceof Error ? error.message : String(error) });
      }
      return;
    }

    if (
      req.method === "POST" &&
      parts.length === 6 &&
      parts[3] === "channels" &&
      typeof parts[4] === "string" &&
      parts[5] === "test-message"
    ) {
      if (!validateSandboxForRequest(sandboxName, res, opts.sandboxExists)) return;
      const body = await readJsonBody(req);
      const channelName = parts[4];
      const overview = await opts.overviewProvider();
      const sandbox = overview.sandboxes.find((entry) => entry.name === sandboxName);
      if (!sandbox) {
        sendJson(res, 404, { error: `Sandbox '${sandboxName}' is not in the UI overview.` });
        return;
      }
      const channel = sandbox.channelStatuses.find((entry) => entry.name === channelName);
      if (!channel) {
        sendJson(res, 404, { error: "Unsupported channel." });
        return;
      }
      const result = await opts.sendChannelTest(sandbox, channel, oneShotTokenFromBody(body));
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "POST" && parts.length === 5 && parts[3] === "actions") {
      if (!validateSandboxForRequest(sandboxName, res, opts.sandboxExists)) return;
      await readJsonBody(req);
      const action = parts[4];
      if (
        action !== "status" &&
        action !== "doctor" &&
        action !== "share-status" &&
        action !== "snapshot-list" &&
        action !== "snapshot-create" &&
        action !== "rebuild-preflight"
      ) {
        sendJson(res, 404, { error: "Unsupported sandbox action." });
        return;
      }
      if (action === "snapshot-list") {
        const result = await opts.runCliAction([sandboxName, "snapshot", "list"]);
        sendJson(res, 200, result);
        return;
      }
      if (action === "snapshot-create") {
        const result = await opts.runCliAction([
          sandboxName,
          "snapshot",
          "create",
          "--name",
          preflightSnapshotName(),
        ]);
        sendJson(res, 200, result);
        return;
      }
      if (action === "share-status") {
        const result = await opts.runCliAction([sandboxName, "share", "status"]);
        sendJson(res, 200, result);
        return;
      }
      if (action === "rebuild-preflight") {
        const overview = await opts.overviewProvider();
        const sandbox = overview.sandboxes.find((entry) => entry.name === sandboxName);
        if (!sandbox) {
          sendJson(res, 404, { error: `Sandbox '${sandboxName}' is not in the UI overview.` });
          return;
        }
        const status = await opts.runCliAction([sandboxName, "status"]);
        const doctor = await opts.runCliAction([sandboxName, "doctor"]);
        const snapshotList = await opts.runCliAction([sandboxName, "snapshot", "list"]);
        sendJson(res, 200, rebuildPreflightResult({ sandbox, status, doctor, snapshotList }));
        return;
      }
      const result = await opts.runCliAction([sandboxName, action]);
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "POST" && parts.length === 5 && parts[3] === "forward" && parts[4] === "repair") {
      if (!validateSandboxForRequest(sandboxName, res, opts.sandboxExists)) return;
      await readJsonBody(req);
      const result = await opts.runCliAction([sandboxName, "recover"]);
      const overview = await opts.overviewProvider();
      const sandbox = overview.sandboxes.find((entry) => entry.name === sandboxName);
      if (!sandbox) {
        sendJson(res, 404, { error: `Sandbox '${sandboxName}' is not in the UI overview.`, result });
        return;
      }
      const forward = await opts.probeForward(sandbox);
      sendJson(res, 200, {
        ok: result.ok && forward.healthy,
        action: "recover",
        result,
        ...liveHealthForSandbox(sandbox, forward),
      });
      return;
    }

    if (req.method === "POST" && parts.length === 4 && parts[3] === "recover") {
      if (!validateSandboxForRequest(sandboxName, res, opts.sandboxExists)) return;
      await readJsonBody(req);
      const result = await opts.runCliAction([sandboxName, "recover"]);
      sendJson(res, result.ok ? 200 : 500, result);
      return;
    }
  }

  sendJson(res, 404, { error: "Not found." });
}

function createRequestHandler(token: string, opts: Required<UiServerOptions>) {
  return async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || "/", `http://${opts.host}`);

    if (!isAuthorized(req, url, token)) {
      sendText(res, 401, "Unauthorized.");
      return;
    }

    try {
      if (req.method === "GET" && url.pathname === "/") {
        sendHtml(res);
        return;
      }
      if (url.pathname === "/favicon.ico") {
        sendText(res, 404, "Not found.");
        return;
      }
      await handleApiRequest(req, res, url, opts);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendJson(res, 500, { error: redactFull(message) });
    }
  };
}

function normalizeOptions(options: UiServerOptions): Required<UiServerOptions> {
  const rootDir = options.rootDir ?? DEFAULT_ROOT;
  return {
    rootDir,
    host: options.host ?? "127.0.0.1",
    port: options.port ?? 0,
    token: options.token ?? makeToken(),
    openBrowser: options.openBrowser ?? true,
    overviewProvider:
      options.overviewProvider ??
      (async () => {
        const { buildUiOverview } = await import("./overview");
        return buildUiOverview(rootDir);
      }),
    sandboxExists: options.sandboxExists ?? ((sandboxName) => registry.getSandbox(sandboxName) !== null),
    runCliAction: options.runCliAction ?? ((args) => runCliAction(rootDir, args)),
    probeForward: options.probeForward ?? probeForward,
    sendChannelTest:
      options.sendChannelTest ??
      ((sandbox, channel, tokenOverride) =>
        sendMessagingTestMessage({
          sandboxName: sandbox.name,
          channel: channel.name,
          config: registry.getSandbox(sandbox.name)?.messagingChannelConfig || null,
          ...(tokenOverride ? { tokenResolver: () => tokenOverride } : {}),
        })),
    spawnLogProcess:
      options.spawnLogProcess ?? ((sandboxName, logOptions) => spawnLogProcess(rootDir, sandboxName, logOptions)),
  };
}

export function startUiServer(options: UiServerOptions = {}): Promise<RunningUiServer> {
  const opts = normalizeOptions(options);
  const server = http.createServer(createRequestHandler(opts.token, opts));

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(opts.port, opts.host, () => {
      server.off("error", reject);
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : opts.port;
      const url = `http://${opts.host}:${port}/?token=${encodeURIComponent(opts.token)}`;
      resolve({
        server,
        host: opts.host,
        port,
        token: opts.token,
        url,
        close: () =>
          new Promise<void>((closeResolve, closeReject) => {
            server.close((error) => {
              if (error && !isErrnoException(error)) {
                closeReject(error);
                return;
              }
              closeResolve();
            });
          }),
      });
    });
  });
}

export async function runUiServerUntilClosed(options: UiServerOptions = {}): Promise<void> {
  const running = await startUiServer(options);
  console.log("");
  console.log(`  ${CLI_NAME} UI listening on ${running.url}`);
  console.log("  Bound to 127.0.0.1; press Ctrl-C to stop.");
  console.log("");

  if (options.openBrowser !== false) {
    openBrowser(running.url);
  }

  await new Promise<void>((resolve) => {
    const stop = () => {
      running.close().finally(resolve);
    };
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
    running.server.once("close", resolve);
  });
}

export function openBrowser(url: string): void {
  let command: string;
  let args: string[];
  if (process.platform === "darwin") {
    command = "open";
    args = [url];
  } else if (process.platform === "win32") {
    command = "cmd";
    args = ["/c", "start", "", url];
  } else {
    command = "xdg-open";
    args = [url];
  }
  const child = spawn(command, args, {
    detached: true,
    stdio: "ignore",
  });
  child.on("error", () => {
    /* best effort */
  });
  child.unref();
}
