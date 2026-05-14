// SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

export interface UiSandboxSummary {
  name: string;
  agent: string;
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
  messagingChannels: string[];
  disabledChannels: string[];
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
    rebuild: string;
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

export interface UiSnapshotSummary {
  count: number;
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
