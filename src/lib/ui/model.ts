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
