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
      messagingChannels: [],
      disabledChannels: [],
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
        rebuild: "nemoclaw alpha rebuild",
      },
    },
  ],
  services: [],
  commands: {
    openApprovals: "openshell term",
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
