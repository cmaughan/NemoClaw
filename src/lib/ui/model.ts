// SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

export interface UiSandboxSummary {
  name: string;
  agent: string;
  phase: string;
  isDefault: boolean;
  connected: boolean;
  activeSessionCount: number | null;
  model: string | null;
  provider: string | null;
  inferenceHealth: string;
  gatewayHealth: string;
  dashboardPort: number | null;
  dashboardUrl: string | null;
  endpointLabel: string;
  policies: string[];
  policy: UiPolicySummary;
  messagingChannels: string[];
  disabledChannels: string[];
  channelStatuses: UiChannelSummary[];
  warnings: string[];
  version: UiVersionSummary;
  snapshots: UiSnapshotSummary;
  commands: {
    connect: string;
    status: string;
    doctor: string;
    logs: string;
    recover: string;
    policyList: string;
    channelsList: string;
    snapshotList: string;
    shareStatus: string;
    rebuild: string;
    inferenceSet: string;
  };
}

export interface UiOverview {
  schemaVersion: 1;
  generatedAt: string;
  defaultSandbox: string | null;
  gatewayHealth: {
    healthy: boolean;
    state: string;
    reason?: string;
  } | null;
  liveInference: {
    provider: string | null;
    model: string | null;
  } | null;
  sandboxes: UiSandboxSummary[];
  services: Array<{
    name: string;
    running: boolean;
    pid: number | null;
  }>;
  commands: {
    openApprovals: string;
    inferenceGet: string;
    updateCheck: string;
    upgradeCheck: string;
  };
}

export interface UiCommandResult {
  ok: boolean;
  status: number | null;
  stdout: string;
  stderr: string;
}

export interface UiChannelSummary {
  name: string;
  description: string;
  configured: boolean;
  paused: boolean;
  active: boolean;
  policyApplied: boolean;
  state: "active" | "paused" | "not_configured" | "needs_policy" | "conflict";
  credentials: Array<{
    envKey: string;
    label: string;
    state: "recorded" | "unknown" | "not_configured";
  }>;
  config: Array<{
    label: string;
    value: string;
    state: "set" | "unset" | "default";
  }>;
  overlaps: Array<{
    sandbox: string;
    reason: "matching-token" | "unknown-token";
  }>;
  test: {
    available: boolean;
    target: string | null;
    unavailableReason: string | null;
  };
  next: string;
  commands: {
    add: string;
    stop: string;
    start: string;
    remove: string;
    rebuild: string;
  };
}

export interface UiChannelCheck {
  sandbox: string;
  channel: string;
  ok: boolean;
  status: "ok" | "warn" | "fail" | "info";
  checkedAt: string;
  summary: UiChannelSummary;
  checks: Array<{
    label: string;
    status: "ok" | "warn" | "fail" | "info";
    detail: string;
    hint?: string;
  }>;
  command: UiCommandResult;
}

export interface UiChannelTestResult {
  sandbox: string;
  channel: string;
  ok: boolean;
  status: "sent" | "unavailable" | "failed";
  checkedAt: string;
  target: string | null;
  detail: string;
  providerStatus: number | null;
  error?: string;
}

export interface UiPolicySummary {
  registryApplied: string[];
  gatewayApplied: string[] | null;
  liveState: "unchecked" | "matched" | "drift" | "unavailable";
  available: UiPolicyPresetSummary[];
  customPresetCommand: string;
}

export interface UiPolicyPresetSummary {
  name: string;
  description: string;
  source: "built-in" | "custom";
  file: string;
  appliedRegistry: boolean;
  appliedGateway: boolean | null;
  commands: {
    addDryRun: string;
    add: string;
    removeDryRun: string;
    remove: string;
  };
}

export interface UiSnapshotSummary {
  count: number;
  items: Array<{
    version: string;
    selector: string;
    name: string | null;
    timestamp: string;
    path: string;
    restoreCommand: string;
    cloneCommand: string;
  }>;
  latest: {
    version: string;
    name: string | null;
    timestamp: string;
    path: string;
  } | null;
  error?: string;
}

export interface UiVersionSummary {
  current: string | null;
  target: string | null;
  stale: boolean;
  state: "current" | "stale" | "unknown" | "unmanaged";
  detectionMethod: "registry" | "ssh-exec" | "unavailable";
  command: string | null;
  error?: string;
}

export interface UiForwardStatus {
  configured: boolean;
  healthy: boolean;
  state: "healthy" | "unreachable" | "not_configured" | "invalid";
  port: number | null;
  url: string | null;
  httpStatus: number | null;
  checkedAt: string;
  error?: string;
}

export interface UiLiveHealth {
  sandbox: string;
  forward: UiForwardStatus;
  suggestedAction: {
    severity: "ok" | "warn" | "bad";
    label: string;
    detail: string;
    command: string | null;
  };
}
