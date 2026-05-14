// SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { CLI_NAME } from "../cli/branding";
import { resolveMessagingTestTarget } from "../messaging/test-send";
import { findAllOverlaps } from "../messaging-conflict";
import * as policiesModule from "../policy/index";
import { getChannelTokenKeys, listChannels } from "../sandbox/channels";
import * as sandboxVersion from "../sandbox/version";
import { redactFull } from "../security/redact";
import * as registry from "../state/registry";
import * as sandboxState from "../state/sandbox";
import * as sandboxSession from "../state/sandbox-session";
import type {
  UiChannelSummary,
  UiOverview,
  UiPolicySummary,
  UiPolicyPresetSummary,
  UiSandboxSummary,
  UiSnapshotSummary,
  UiVersionSummary,
} from "./model";

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
    shareStatus: `${CLI_NAME} ${name} share status`,
    rebuild: `${CLI_NAME} ${name} rebuild`,
    inferenceSet: `${CLI_NAME} inference set --sandbox ${name} --provider <provider> --model <model>`,
  };
}

function policyCommands(sandboxName: string, presetName: string): UiPolicyPresetSummary["commands"] {
  return {
    addDryRun: `${CLI_NAME} ${sandboxName} policy-add ${presetName} --dry-run`,
    add: `${CLI_NAME} ${sandboxName} policy-add ${presetName} --yes`,
    removeDryRun: `${CLI_NAME} ${sandboxName} policy-remove ${presetName} --dry-run`,
    remove: `${CLI_NAME} ${sandboxName} policy-remove ${presetName} --yes`,
  };
}

function policyForSandbox(sandboxName: string): UiPolicySummary {
  const registryApplied = policiesModule.getAppliedPresets(sandboxName).map((name) => clean(name) || name);
  const appliedSet = new Set(registryApplied);
  const available = policiesModule
    .listSetupPolicyPresets(sandboxName)
    .map((preset): UiPolicyPresetSummary => {
      const name = clean(preset.name) || preset.name;
      return {
        name,
        description: clean(preset.description) || "",
        source: preset.description === "custom preset" ? "custom" : "built-in",
        file: clean(preset.file) || preset.file,
        appliedRegistry: appliedSet.has(name),
        appliedGateway: null,
        commands: policyCommands(sandboxName, name),
      };
    });

  return {
    registryApplied,
    gatewayApplied: null,
    liveState: "unchecked",
    available,
    customPresetCommand: `${CLI_NAME} ${sandboxName} policy-add --from-file <path> --dry-run`,
  };
}

function snapshotsForSandbox(name: string): UiSnapshotSummary {
  try {
    const backups = sandboxState.listBackups(name);
    const items = backups.map((backup) => {
      const version = `v${backup.snapshotVersion}`;
      return {
        version,
        selector: version,
        name: clean(backup.name) || null,
        timestamp: backup.timestamp,
        path: redactFull(backup.backupPath),
        restoreCommand: `${CLI_NAME} ${name} snapshot restore ${version}`,
        cloneCommand: `${CLI_NAME} ${name} snapshot restore ${version} --to <sandbox>`,
      };
    });
    const latest = items[0] || null;
    return {
      count: backups.length,
      items,
      latest,
    };
  } catch (error) {
    return {
      count: 0,
      items: [],
      latest: null,
      error: redactFull(error instanceof Error ? error.message : String(error)),
    };
  }
}

function sessionCountForSandbox(name: string): number | null {
  const result = sandboxSession.getActiveSandboxSessions(
    name,
    sandboxSession.createSystemDeps(process.env.NEMOCLAW_OPENSHELL_BIN || "openshell"),
  );
  return result.detected ? result.sessions.length : null;
}

function phaseForSandbox(input: {
  connected: boolean;
  dashboardPort: number | null;
  version: UiVersionSummary;
  warnings: string[];
}): string {
  if (input.connected) return "connected";
  if (input.version.state === "stale") return "rebuild ready";
  if (input.dashboardPort === null) return "needs endpoint";
  if (input.warnings.length > 0) return "attention";
  return "ready";
}

function latestSnapshotForDisplay(snapshot: UiSnapshotSummary): UiSnapshotSummary["latest"] {
  const latest = snapshot.items[0] || null;
  return latest
        ? {
            version: latest.version,
            name: latest.name,
            timestamp: latest.timestamp,
            path: latest.path,
          }
        : null;
}

function commandSetForChannel(sandboxName: string, channelName: string): UiChannelSummary["commands"] {
  return {
    add: `${CLI_NAME} ${sandboxName} channels add ${channelName}`,
    stop: `${CLI_NAME} ${sandboxName} channels stop ${channelName}`,
    start: `${CLI_NAME} ${sandboxName} channels start ${channelName}`,
    remove: `${CLI_NAME} ${sandboxName} channels remove ${channelName}`,
    rebuild: `${CLI_NAME} ${sandboxName} rebuild`,
  };
}

function channelConfigItems(
  channel: ReturnType<typeof listChannels>[number],
  config: Record<string, string> | undefined,
): UiChannelSummary["config"] {
  const items: UiChannelSummary["config"] = [];
  const valueFor = (key: string | undefined): string | null =>
    key && typeof config?.[key] === "string" ? config[key] : null;

  if (channel.serverIdEnvKey) {
    const value = valueFor(channel.serverIdEnvKey);
    items.push({
      label: channel.serverIdLabel || channel.serverIdEnvKey,
      value: value ? "set" : "not set",
      state: value ? "set" : "unset",
    });
  }
  if (channel.userIdEnvKey) {
    const value = valueFor(channel.userIdEnvKey);
    const emptyValue =
      channel.allowIdsMode === "guild" ? "open to configured server" : "not restricted";
    items.push({
      label: channel.userIdLabel || channel.userIdEnvKey,
      value: value ? "set" : emptyValue,
      state: value ? "set" : "unset",
    });
  }
  if (channel.requireMentionEnvKey) {
    const value = valueFor(channel.requireMentionEnvKey);
    items.push({
      label: "Reply mode",
      value: value === "1" ? "mentions only" : value === "0" ? "all messages" : "default",
      state: value ? "set" : "default",
    });
  }

  return items;
}

function channelState(input: {
  configured: boolean;
  paused: boolean;
  policyApplied: boolean;
  overlaps: UiChannelSummary["overlaps"];
}): UiChannelSummary["state"] {
  if (!input.configured) return "not_configured";
  if (input.paused) return "paused";
  if (input.overlaps.length > 0) return "conflict";
  if (!input.policyApplied) return "needs_policy";
  return "active";
}

function channelNextText(state: UiChannelSummary["state"], channelName: string): string {
  if (state === "active") return "Bridge is configured. Run a check to inspect live health signals.";
  if (state === "paused") return "Start the channel and rebuild when you want messages to flow again.";
  if (state === "needs_policy") {
    return `Apply the ${channelName} policy preset before expecting outbound messaging to work.`;
  }
  if (state === "conflict") return "Resolve the token overlap before relying on this bridge.";
  return "Add the channel, then rebuild so the sandbox image picks it up.";
}

function channelsForSandbox(input: {
  sandbox: registry.SandboxEntry;
  policies: string[];
  messagingChannels: string[];
  disabledChannels: string[];
  overlaps: ReturnType<typeof findAllOverlaps>;
}): UiChannelSummary[] {
  const configured = new Set(input.messagingChannels);
  const paused = new Set(input.disabledChannels);
  const policySet = new Set(input.policies);
  const credentialHashes = input.sandbox.providerCredentialHashes || {};
  const channelConfig = input.sandbox.messagingChannelConfig;

  return listChannels().map((channel): UiChannelSummary => {
    const channelOverlaps = input.overlaps
      .filter(
        (overlap) =>
          overlap.channel === channel.name && overlap.sandboxes.includes(input.sandbox.name),
      )
      .map((overlap) => ({
        sandbox: overlap.sandboxes.find((name) => name !== input.sandbox.name) || input.sandbox.name,
        reason: overlap.reason,
      }));
    const isConfigured = configured.has(channel.name);
    const isPaused = paused.has(channel.name);
    const policyApplied = policySet.has(channel.name);
    const state = channelState({
      configured: isConfigured,
      paused: isPaused,
      policyApplied,
      overlaps: channelOverlaps,
    });
    const testTarget = resolveMessagingTestTarget(channel.name, channelConfig);
    const testAvailable = isConfigured && !isPaused && testTarget.available;

    return {
      name: channel.name,
      description: channel.description,
      configured: isConfigured,
      paused: isPaused,
      active: isConfigured && !isPaused,
      policyApplied,
      state,
      credentials: getChannelTokenKeys(channel).map((envKey) => ({
        envKey,
        label:
          envKey === channel.envKey
            ? channel.label
            : channel.appTokenLabel || envKey,
        state: isConfigured
          ? credentialHashes[envKey]
            ? "recorded"
            : "unknown"
          : "not_configured",
      })),
      config: channelConfigItems(channel, channelConfig),
      overlaps: channelOverlaps,
      test: {
        available: testAvailable,
        target: testAvailable ? testTarget.label : null,
        unavailableReason: testAvailable
          ? null
          : !isConfigured
            ? "Channel is not configured."
            : isPaused
              ? "Channel is stopped."
              : testTarget.unavailableReason,
      },
      next: channelNextText(state, channel.name),
      commands: commandSetForChannel(input.sandbox.name, channel.name),
    };
  });
}

function versionForSandbox(name: string): UiVersionSummary {
  try {
    const version = sandboxVersion.checkAgentVersion(name, { skipProbe: true });
    const current = clean(version.sandboxVersion);
    const target = clean(version.expectedVersion);
    const state: UiVersionSummary["state"] = !target
      ? "unmanaged"
      : version.isStale
        ? "stale"
        : current
          ? "current"
          : "unknown";

    return {
      current,
      target,
      stale: state === "stale",
      state,
      detectionMethod: version.detectionMethod,
      command:
        state === "stale"
          ? `${CLI_NAME} ${name} rebuild`
          : state === "unknown"
            ? `${CLI_NAME} ${name} doctor`
            : null,
    };
  } catch (error) {
    return {
      current: null,
      target: null,
      stale: false,
      state: "unknown",
      detectionMethod: "unavailable",
      command: `${CLI_NAME} ${name} doctor`,
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
  const channelOverlaps = findAllOverlaps(registry);

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
    const version = versionForSandbox(sandbox.name);
    const snapshots = snapshotsForSandbox(sandbox.name);
    snapshots.latest = latestSnapshotForDisplay(snapshots);
    const warnings = warningsForSandbox({
      agent: normalizedAgent,
      dashboardPort,
      gatewayHealth,
      isDefault,
      policies,
      messagingChannels,
      disabledChannels,
    });
    const activeSessionCount = sessionCountForSandbox(sandbox.name);
    const connected = activeSessionCount !== null && activeSessionCount > 0;

    return {
      name: sandbox.name,
      agent,
      phase: phaseForSandbox({ connected, dashboardPort, version, warnings }),
      isDefault,
      connected,
      activeSessionCount,
      model: clean(sandbox.model),
      provider: clean(sandbox.provider),
      inferenceHealth: "stored",
      gatewayHealth: inferGatewayHealth(gatewayHealth, sandbox.name, isDefault),
      dashboardPort,
      dashboardUrl: endpoint.dashboardUrl,
      endpointLabel: endpoint.endpointLabel,
      policies,
      policy: policyForSandbox(sandbox.name),
      messagingChannels,
      disabledChannels,
      channelStatuses: channelsForSandbox({
        sandbox,
        policies,
        messagingChannels,
        disabledChannels,
        overlaps: channelOverlaps,
      }),
      warnings,
      version,
      snapshots,
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
      inferenceGet: `${CLI_NAME} inference get`,
      updateCheck: `${CLI_NAME} update --check`,
      upgradeCheck: `${CLI_NAME} upgrade-sandboxes --check`,
    },
  };
}
