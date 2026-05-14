// SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { afterEach, describe, expect, it, vi } from "vitest";

import type { UiForwardStatus, UiOverview } from "./model";
import type { RunningUiServer } from "./server";
import { startUiServer } from "./server";

const overview: UiOverview = {
  schemaVersion: 1,
  generatedAt: "2026-05-14T12:00:00.000Z",
  defaultSandbox: "alpha",
  gatewayHealth: { healthy: true, state: "healthy_named" },
  liveInference: { provider: "nvidia-prod", model: "nvidia/nemotron" },
  sandboxes: [
    {
      name: "alpha",
      agent: "openclaw",
      phase: "ready",
      isDefault: true,
      connected: false,
      activeSessionCount: 0,
      model: "nvidia/nemotron",
      provider: "nvidia-prod",
      inferenceHealth: "configured",
      gatewayHealth: "healthy",
      dashboardPort: 18789,
      dashboardUrl: "http://127.0.0.1:18789/",
      endpointLabel: "Dashboard",
      policies: ["npm"],
      policy: {
        registryApplied: ["npm"],
        gatewayApplied: null,
        liveState: "unchecked",
        customPresetCommand: "nemoclaw alpha policy-add --from-file <path> --dry-run",
        available: [
          {
            name: "npm",
            description: "Node package registry access",
            source: "built-in",
            file: "npm.yaml",
            appliedRegistry: true,
            appliedGateway: null,
            commands: {
              addDryRun: "nemoclaw alpha policy-add npm --dry-run",
              add: "nemoclaw alpha policy-add npm --yes",
              removeDryRun: "nemoclaw alpha policy-remove npm --dry-run",
              remove: "nemoclaw alpha policy-remove npm --yes",
            },
          },
        ],
      },
      messagingChannels: [],
      disabledChannels: [],
      channelStatuses: [
        {
          name: "telegram",
          description: "Telegram bot messaging",
          configured: true,
          paused: false,
          active: true,
          policyApplied: true,
          state: "active",
          credentials: [
            {
              envKey: "TELEGRAM_BOT_TOKEN",
              label: "Telegram Bot Token",
              state: "recorded",
            },
          ],
          config: [
            {
              label: "Reply mode",
              value: "mentions only",
              state: "set",
            },
          ],
          overlaps: [],
          test: {
            available: true,
            target: "Telegram DM",
            unavailableReason: null,
          },
          next: "Bridge is configured. Run a check to inspect live health signals.",
          commands: {
            add: "nemoclaw alpha channels add telegram",
            stop: "nemoclaw alpha channels stop telegram",
            start: "nemoclaw alpha channels start telegram",
            remove: "nemoclaw alpha channels remove telegram",
            rebuild: "nemoclaw alpha rebuild",
          },
        },
      ],
      warnings: [],
      version: {
        current: "2026.4.24",
        target: "2026.4.24",
        stale: false,
        state: "current",
        detectionMethod: "registry",
        command: null,
      },
      snapshots: {
        count: 1,
        items: [
          {
            version: "v1",
            selector: "v1",
            name: "before-upgrade",
            timestamp: "2026-05-14T11-00-00-000Z",
            path: "/tmp/nemoclaw/rebuild-backups/alpha/2026-05-14T11-00-00-000Z",
            restoreCommand: "nemoclaw alpha snapshot restore v1",
            cloneCommand: "nemoclaw alpha snapshot restore v1 --to <sandbox>",
          },
        ],
        latest: {
          version: "v1",
          name: "before-upgrade",
          timestamp: "2026-05-14T11-00-00-000Z",
          path: "/tmp/nemoclaw/rebuild-backups/alpha/2026-05-14T11-00-00-000Z",
        },
      },
      commands: {
        connect: "nemoclaw alpha connect",
        status: "nemoclaw alpha status",
        doctor: "nemoclaw alpha doctor",
        logs: "nemoclaw alpha logs --follow",
        recover: "nemoclaw alpha recover",
        policyList: "nemoclaw alpha policy-list",
        channelsList: "nemoclaw alpha channels list",
        snapshotList: "nemoclaw alpha snapshot list",
        shareStatus: "nemoclaw alpha share status",
        rebuild: "nemoclaw alpha rebuild",
        inferenceSet: "nemoclaw inference set --sandbox alpha --provider <provider> --model <model>",
      },
    },
  ],
  services: [],
  commands: {
    openApprovals: "openshell term",
    inferenceGet: "nemoclaw inference get",
    updateCheck: "nemoclaw update --check",
    upgradeCheck: "nemoclaw upgrade-sandboxes --check",
  },
};

let running: RunningUiServer | null = null;

async function startTestServer(overrides: Parameters<typeof startUiServer>[0] = {}) {
  running = await startUiServer({
    token: "test-token",
    overviewProvider: async () => overview,
    sandboxExists: (name) => name === "alpha",
    openBrowser: false,
    ...overrides,
  });
  return running;
}

afterEach(async () => {
  if (running) {
    await running.close();
    running = null;
  }
});

describe("NemoClaw UI server", () => {
  it("requires the session token for API requests", async () => {
    const server = await startTestServer();

    const unauthorized = await fetch(`http://${server.host}:${server.port}/api/overview`);
    expect(unauthorized.status).toBe(401);

    const authorized = await fetch(`http://${server.host}:${server.port}/api/overview`, {
      headers: { Authorization: "Bearer test-token" },
    });
    expect(authorized.status).toBe(200);
    await expect(authorized.json()).resolves.toMatchObject({
      schemaVersion: 1,
      defaultSandbox: "alpha",
    });
  });

  it("serves the embedded app shell with security headers", async () => {
    const server = await startTestServer();

    const response = await fetch(server.url);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    await expect(response.text()).resolves.toContain("NemoClaw Control");
  });

  it("rejects invalid sandbox names before running an action", async () => {
    const runCliAction = vi.fn();
    const server = await startTestServer({ runCliAction });

    const response = await fetch(
      `http://${server.host}:${server.port}/api/sandboxes/..%2Falpha/recover?token=test-token`,
      { method: "POST" },
    );

    expect(response.status).toBe(400);
    expect(runCliAction).not.toHaveBeenCalled();
  });

  it("runs the recover action only for registered sandboxes", async () => {
    const runCliAction = vi.fn().mockResolvedValue({
      ok: true,
      status: 0,
      stdout: "ok",
      stderr: "",
    });
    const server = await startTestServer({ runCliAction });

    const missing = await fetch(
      `http://${server.host}:${server.port}/api/sandboxes/bravo/recover?token=test-token`,
      { method: "POST" },
    );
    expect(missing.status).toBe(404);

    const response = await fetch(
      `http://${server.host}:${server.port}/api/sandboxes/alpha/recover?token=test-token`,
      { method: "POST" },
    );

    expect(response.status).toBe(200);
    expect(runCliAction).toHaveBeenCalledWith(["alpha", "recover"]);
  });

  it("reports live forward health for a registered sandbox", async () => {
    const forward: UiForwardStatus = {
      configured: true,
      healthy: true,
      state: "healthy",
      port: 18789,
      url: "http://127.0.0.1:18789/",
      httpStatus: 401,
      checkedAt: "2026-05-14T12:01:00.000Z",
    };
    const probeForward = vi.fn().mockResolvedValue(forward);
    const server = await startTestServer({ probeForward });

    const response = await fetch(
      `http://${server.host}:${server.port}/api/sandboxes/alpha/live?token=test-token`,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      sandbox: "alpha",
      forward: { healthy: true, httpStatus: 401 },
      suggestedAction: { severity: "ok", label: "Forward reachable" },
    });
    expect(probeForward).toHaveBeenCalledWith(expect.objectContaining({ name: "alpha" }));
  });

  it("runs fixed status and doctor actions without accepting arbitrary commands", async () => {
    const runCliAction = vi.fn().mockResolvedValue({
      ok: false,
      status: 2,
      stdout: "",
      stderr: "doctor failed",
    });
    const server = await startTestServer({ runCliAction });

    const doctor = await fetch(
      `http://${server.host}:${server.port}/api/sandboxes/alpha/actions/doctor?token=test-token`,
      { method: "POST" },
    );
    expect(doctor.status).toBe(200);
    await expect(doctor.json()).resolves.toMatchObject({ ok: false, status: 2 });
    expect(runCliAction).toHaveBeenCalledWith(["alpha", "doctor"]);

    const arbitrary = await fetch(
      `http://${server.host}:${server.port}/api/sandboxes/alpha/actions/destroy?token=test-token`,
      { method: "POST" },
    );
    expect(arbitrary.status).toBe(404);
    expect(runCliAction).toHaveBeenCalledTimes(1);
  });

  it("runs fixed global actions without accepting arbitrary commands", async () => {
    const runCliAction = vi.fn().mockResolvedValue({
      ok: true,
      status: 0,
      stdout: "provider: nvidia-prod",
      stderr: "",
    });
    const server = await startTestServer({ runCliAction });

    const inference = await fetch(
      `http://${server.host}:${server.port}/api/actions/inference-get?token=test-token`,
      { method: "POST" },
    );
    expect(inference.status).toBe(200);
    expect(runCliAction).toHaveBeenCalledWith(["inference", "get"]);

    const arbitrary = await fetch(
      `http://${server.host}:${server.port}/api/actions/destroy?token=test-token`,
      { method: "POST" },
    );
    expect(arbitrary.status).toBe(404);
    expect(runCliAction).toHaveBeenCalledTimes(1);
  });

  it("runs fixed policy checks and preset mutations", async () => {
    const runCliAction = vi.fn().mockResolvedValue({
      ok: true,
      status: 0,
      stdout: "policy output",
      stderr: "",
    });
    const server = await startTestServer({ runCliAction });

    const check = await fetch(
      `http://${server.host}:${server.port}/api/sandboxes/alpha/policies/check?token=test-token`,
      { method: "POST" },
    );
    expect(check.status).toBe(200);
    expect(runCliAction).toHaveBeenCalledWith(["alpha", "policy-list"]);

    const add = await fetch(
      `http://${server.host}:${server.port}/api/sandboxes/alpha/policies/npm/add-dry-run?token=test-token`,
      { method: "POST" },
    );
    expect(add.status).toBe(200);
    expect(runCliAction).toHaveBeenCalledWith(["alpha", "policy-add", "npm", "--dry-run"]);

    const invalid = await fetch(
      `http://${server.host}:${server.port}/api/sandboxes/alpha/policies/..%2Fbad/add?token=test-token`,
      { method: "POST" },
    );
    expect(invalid.status).toBe(400);
  });

  it("runs a fixed channel check through doctor json", async () => {
    const runCliAction = vi.fn().mockResolvedValue({
      ok: true,
      status: 0,
      stdout: JSON.stringify({
        schemaVersion: 1,
        sandbox: "alpha",
        status: "ok",
        checks: [
          {
            group: "Messaging",
            label: "Channels",
            status: "ok",
            detail: "telegram enabled; no recent conflict signatures",
          },
        ],
      }),
      stderr: "",
    });
    const server = await startTestServer({ runCliAction });

    const response = await fetch(
      `http://${server.host}:${server.port}/api/sandboxes/alpha/channels/telegram/check?token=test-token`,
      { method: "POST" },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      sandbox: "alpha",
      channel: "telegram",
      ok: true,
      status: "ok",
      checks: expect.arrayContaining([
        expect.objectContaining({ label: "Registry", status: "ok" }),
        expect.objectContaining({ label: "Doctor", status: "ok" }),
      ]),
    });
    expect(runCliAction).toHaveBeenCalledWith(["alpha", "doctor", "--json"]);
  });

  it("rejects unsupported channel checks before running doctor", async () => {
    const runCliAction = vi.fn();
    const server = await startTestServer({ runCliAction });

    const response = await fetch(
      `http://${server.host}:${server.port}/api/sandboxes/alpha/channels/matrix/check?token=test-token`,
      { method: "POST" },
    );

    expect(response.status).toBe(404);
    expect(runCliAction).not.toHaveBeenCalled();
  });

  it("sends fixed channel test messages only for known channels", async () => {
    const sendChannelTest = vi.fn().mockResolvedValue({
      sandbox: "alpha",
      channel: "telegram",
      ok: true,
      status: "sent",
      checkedAt: "2026-05-14T12:03:00.000Z",
      target: "Telegram DM",
      detail: "Telegram accepted the test message.",
      providerStatus: 200,
    });
    const server = await startTestServer({ sendChannelTest });

    const response = await fetch(
      `http://${server.host}:${server.port}/api/sandboxes/alpha/channels/telegram/test-message?token=test-token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "one-shot-token" }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      sandbox: "alpha",
      channel: "telegram",
      ok: true,
      status: "sent",
      target: "Telegram DM",
    });
    expect(sendChannelTest).toHaveBeenCalledWith(
      expect.objectContaining({ name: "alpha" }),
      expect.objectContaining({ name: "telegram" }),
      "one-shot-token",
    );

    const unsupported = await fetch(
      `http://${server.host}:${server.port}/api/sandboxes/alpha/channels/matrix/test-message?token=test-token`,
      { method: "POST" },
    );
    expect(unsupported.status).toBe(404);
    expect(sendChannelTest).toHaveBeenCalledTimes(1);
  });

  it("runs fixed snapshot and rebuild preflight actions", async () => {
    const runCliAction = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 0,
        stdout: "Snapshot v2 created",
        stderr: "",
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 0,
        stdout: "Status OK",
        stderr: "",
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 0,
        stdout: "Doctor OK",
        stderr: "",
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 0,
        stdout: "Snapshots for alpha",
        stderr: "",
      });
    const server = await startTestServer({ runCliAction });

    const create = await fetch(
      `http://${server.host}:${server.port}/api/sandboxes/alpha/actions/snapshot-create?token=test-token`,
      { method: "POST" },
    );
    expect(create.status).toBe(200);
    expect(runCliAction).toHaveBeenCalledWith([
      "alpha",
      "snapshot",
      "create",
      "--name",
      expect.stringMatching(/^ui-preflight-\d{4}-\d{2}-\d{2}T/),
    ]);

    const preflight = await fetch(
      `http://${server.host}:${server.port}/api/sandboxes/alpha/actions/rebuild-preflight?token=test-token`,
      { method: "POST" },
    );
    expect(preflight.status).toBe(200);
    await expect(preflight.json()).resolves.toMatchObject({
      ok: true,
      status: 0,
      stdout: expect.stringContaining("Copy rebuild command when ready"),
    });
    expect(runCliAction).toHaveBeenCalledWith(["alpha", "status"]);
    expect(runCliAction).toHaveBeenCalledWith(["alpha", "doctor"]);
    expect(runCliAction).toHaveBeenCalledWith(["alpha", "snapshot", "list"]);
  });

  it("runs snapshot restore with selector and validated clone target", async () => {
    const runCliAction = vi.fn().mockResolvedValue({
      ok: true,
      status: 0,
      stdout: "restored",
      stderr: "",
    });
    const server = await startTestServer({ runCliAction });

    const restore = await fetch(
      `http://${server.host}:${server.port}/api/sandboxes/alpha/snapshot/restore?token=test-token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selector: "v1", to: "bravo" }),
      },
    );
    expect(restore.status).toBe(200);
    expect(runCliAction).toHaveBeenCalledWith([
      "alpha",
      "snapshot",
      "restore",
      "v1",
      "--to",
      "bravo",
    ]);

    const invalid = await fetch(
      `http://${server.host}:${server.port}/api/sandboxes/alpha/snapshot/restore?token=test-token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selector: "v1", to: "../bad" }),
      },
    );
    expect(invalid.status).toBe(400);
  });

  it("marks rebuild preflight incomplete when no snapshot is recorded", async () => {
    const runCliAction = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 0, stdout: "Status OK", stderr: "" })
      .mockResolvedValueOnce({ ok: true, status: 0, stdout: "Doctor OK", stderr: "" })
      .mockResolvedValueOnce({
        ok: true,
        status: 0,
        stdout: "No snapshots found for 'alpha'.",
        stderr: "",
      });
    const server = await startTestServer({ runCliAction });

    const preflight = await fetch(
      `http://${server.host}:${server.port}/api/sandboxes/alpha/actions/rebuild-preflight?token=test-token`,
      { method: "POST" },
    );

    expect(preflight.status).toBe(200);
    await expect(preflight.json()).resolves.toMatchObject({
      ok: false,
      status: 1,
      stdout: expect.stringContaining("Create Snapshot before copying the rebuild command"),
    });
  });

  it("repairs the forward through recover and returns the post-repair probe", async () => {
    const runCliAction = vi.fn().mockResolvedValue({
      ok: true,
      status: 0,
      stdout: "recovered",
      stderr: "",
    });
    const probeForward = vi.fn().mockResolvedValue({
      configured: true,
      healthy: false,
      state: "unreachable",
      port: 18789,
      url: "http://127.0.0.1:18789/",
      httpStatus: null,
      checkedAt: "2026-05-14T12:02:00.000Z",
      error: "connection refused",
    } satisfies UiForwardStatus);
    const server = await startTestServer({ runCliAction, probeForward });

    const response = await fetch(
      `http://${server.host}:${server.port}/api/sandboxes/alpha/forward/repair?token=test-token`,
      { method: "POST" },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      action: "recover",
      result: { ok: true, stdout: "recovered" },
      forward: { healthy: false, state: "unreachable" },
      suggestedAction: { label: "Repair Forward" },
    });
    expect(runCliAction).toHaveBeenCalledWith(["alpha", "recover"]);
    expect(probeForward).toHaveBeenCalledWith(expect.objectContaining({ name: "alpha" }));
  });
});
