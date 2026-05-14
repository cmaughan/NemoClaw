// SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { CLI_NAME } from "../cli/branding";
import { redactFull } from "../security/redact";
import * as registry from "../state/registry";
import * as sandboxState from "../state/sandbox";
import type { UiOverview, UiSandboxSummary, UiSnapshotSummary } from "./model";

function clean(value: string | null | undefined): string | null {
  if (!value) return null;
  return redactFull(value);
}

function endpointForSandbox(agent: string, dashboardPort: number | null) {
  if (dashboardPort === null) {
    return { endpointLabel: agent === "hermes" ? "API" : "Dashboard", dashboardUrl: null };
  }

  if (agent === "hermes") {
    return {
      endpointLabel: "API",
      dashboardUrl: `http://127.0.0.1:${dashboardPort}/v1`,
    };
  }

  return {
    endpointLabel: "Dashboard",
    dashboardUrl: `http://127.0.0.1:${dashboardPort}/`,
  };
}

function inferGatewayHealth(
  globalGatewayHealth: UiOverview["gatewayHealth"],
  sandboxName: string,
  isDefault: boolean,
): string {
  if (!globalGatewayHealth) return "unknown";
  if (!isDefault) return "not default";
  if (globalGatewayHealth.healthy) return "healthy";
  return globalGatewayHealth.reason
    ? `${globalGatewayHealth.state}: ${globalGatewayHealth.reason}`
    : globalGatewayHealth.state;
}

function warningsForSandbox(input: {
  agent: string;
  dashboardPort: number | null;
  gatewayHealth: UiOverview["gatewayHealth"];
  isDefault: boolean;
  policies: string[];
  messagingChannels: string[];
  disabledChannels: string[];
}): string[] {
  const warnings: string[] = [];
  if (input.isDefault && input.gatewayHealth && !input.gatewayHealth.healthy) {
    warnings.push(
      input.gatewayHealth.reason
        ? `Gateway ${input.gatewayHealth.state}: ${input.gatewayHealth.reason}`
        : `Gateway ${input.gatewayHealth.state}`,
    );
  }
  if (input.dashboardPort === null) {
    warnings.push(input.agent === "hermes" ? "No API port recorded" : "No dashboard port recorded");
  }
  if (input.policies.length === 0) {
    warnings.push("No policy presets recorded");
  }
  for (const channel of input.disabledChannels) {
    warnings.push(`${channel} channel stopped`);
  }
  if (input.messagingChannels.length > 0 && input.policies.length > 0) {
    const missing = input.messagingChannels.filter((channel) => !input.policies.includes(channel));
    for (const channel of missing) {
      warnings.push(`${channel} channel may need matching policy preset`);
    }
  }
  return warnings;
}

function commandsForSandbox(name: string): UiSandboxSummary["commands"] {
  return {
    connect: `${CLI_NAME} ${name} connect`,
    status: `${CLI_NAME} ${name} status`,
    doctor: `${CLI_NAME} ${name} doctor`,
    logs: `${CLI_NAME} ${name} logs --follow`,
    recover: `${CLI_NAME} ${name} recover`,
    policyList: `${CLI_NAME} ${name} policy-list`,
    channelsList: `${CLI_NAME} ${name} channels list`,
    snapshotList: `${CLI_NAME} ${name} snapshot list`,
    rebuild: `${CLI_NAME} ${name} rebuild`,
  };
}

function snapshotsForSandbox(name: string): UiSnapshotSummary {
  try {
    const backups = sandboxState.listBackups(name);
    const latest = backups.at(-1);
    return {
      count: backups.length,
      latest: latest
        ? {
            version: `v${latest.snapshotVersion}`,
            name: clean(latest.name) || null,
            timestamp: latest.timestamp,
            path: redactFull(latest.backupPath),
          }
        : null,
    };
  } catch (error) {
    return {
      count: 0,
      latest: null,
      error: redactFull(error instanceof Error ? error.message : String(error)),
    };
  }
}

export async function buildUiOverview(_rootDir: string): Promise<UiOverview> {
  // Deliberately registry-first. The UI server must stay alive even when
  // OpenShell is missing, down, or wedged. CLI status helpers are allowed to
  // process.exit() for command UX, so the dashboard avoids them in v1.
  const registered = registry.listSandboxes();
  const gatewayHealth = null;

  const sandboxes = registered.sandboxes.map((sandbox): UiSandboxSummary => {
    const agent = clean(sandbox.agent || "openclaw") || "openclaw";
    const normalizedAgent = agent.toLowerCase();
    const dashboardPort =
      typeof sandbox.dashboardPort === "number" && Number.isFinite(sandbox.dashboardPort)
        ? sandbox.dashboardPort
        : null;
    const endpoint = endpointForSandbox(normalizedAgent, dashboardPort);
    const policies = (sandbox.policies || []).map((policy) => clean(policy) || policy);
    const messagingChannels = Array.isArray(sandbox.messagingChannels)
      ? sandbox.messagingChannels.map((channel) => clean(channel) || channel)
      : [];
    const disabledChannels = Array.isArray(sandbox.disabledChannels)
      ? sandbox.disabledChannels.map((channel) => clean(channel) || channel)
      : [];
    const isDefault = sandbox.name === registered.defaultSandbox;

    return {
      name: sandbox.name,
      agent,
      isDefault,
      connected: false,
      activeSessionCount: null,
      model: clean(sandbox.model),
      provider: clean(sandbox.provider),
      inferenceHealth: "stored",
      gatewayHealth: inferGatewayHealth(gatewayHealth, sandbox.name, isDefault),
      dashboardPort,
      dashboardUrl: endpoint.dashboardUrl,
      endpointLabel: endpoint.endpointLabel,
      policies,
      messagingChannels,
      disabledChannels,
      warnings: warningsForSandbox({
        agent: normalizedAgent,
        dashboardPort,
        gatewayHealth,
        isDefault,
        policies,
        messagingChannels,
        disabledChannels,
      }),
      snapshots: snapshotsForSandbox(sandbox.name),
      commands: commandsForSandbox(sandbox.name),
    };
  });

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    defaultSandbox: registered.defaultSandbox,
    gatewayHealth,
    liveInference: null,
    sandboxes,
    services: [],
    commands: {
      openApprovals: "openshell term",
      updateCheck: `${CLI_NAME} update --check`,
      upgradeCheck: `${CLI_NAME} upgrade-sandboxes --check`,
    },
  };
}
