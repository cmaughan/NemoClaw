// SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import type { CaptureOpenshellOptions, CaptureOpenshellResult } from "../adapters/openshell/client";
import { captureOpenshellCommand, stripAnsi } from "../adapters/openshell/client";
import { resolveOpenshell } from "../adapters/openshell/resolve";
import { OPENSHELL_PROBE_TIMEOUT_MS } from "../adapters/openshell/timeouts";
import type { UiOverview } from "./model";

type UiGatewayHealth = UiOverview["gatewayHealth"];

interface UiGatewayHealthDeps {
  resolveOpenshell?: () => string | null;
  captureOpenshell?: (
    binary: string,
    args: string[],
    options: CaptureOpenshellOptions,
  ) => CaptureOpenshellResult;
}

function hasNamedGateway(output = ""): boolean {
  return stripAnsi(output).includes("Gateway: nemoclaw");
}

function activeGatewayName(output = ""): string | null {
  const match = stripAnsi(output).match(/^\s*Gateway:\s+(.+?)\s*$/m);
  return match ? match[1].trim() : null;
}

function reasonForState(state: string, activeGateway: string | null): string | undefined {
  const reasons: Record<string, string> = {
    named_unreachable: "host port held or container not running",
    named_unhealthy: "named gateway present but not Connected",
    connected_other: `connected to '${activeGateway ?? "unknown"}', not 'nemoclaw'`,
    missing_named: "named gateway not configured",
  };
  return reasons[state];
}

function probeError(error: unknown): UiGatewayHealth {
  const message = error instanceof Error ? error.message : String(error || "unknown error");
  return { healthy: false, state: "probe_error", reason: message };
}

export function probeUiGatewayHealth(
  rootDir: string,
  deps: UiGatewayHealthDeps = {},
): UiGatewayHealth {
  const openshell = (deps.resolveOpenshell ?? resolveOpenshell)();
  if (!openshell) {
    return { healthy: false, state: "openshell_missing", reason: "OpenShell CLI not found" };
  }

  const capture = deps.captureOpenshell ?? captureOpenshellCommand;
  try {
    const options: CaptureOpenshellOptions = {
      cwd: rootDir,
      ignoreError: true,
      timeout: OPENSHELL_PROBE_TIMEOUT_MS,
      exit: (code: number): never => {
        throw new Error(`openshell exited before probe completed (${code})`);
      },
    };
    const status = capture(openshell, ["status"], options);
    const gatewayInfo = capture(openshell, ["gateway", "info", "-g", "nemoclaw"], options);
    if (status.error) return probeError(status.error);
    if (gatewayInfo.error) return probeError(gatewayInfo.error);
    const cleanStatus = stripAnsi(status.output);
    const activeGateway = activeGatewayName(status.output);
    const connected = /^\s*Status:\s*Connected\b/im.test(cleanStatus);
    const named = hasNamedGateway(gatewayInfo.output);
    const refusing = /Connection refused|client error \(Connect\)|tcp connect error/i.test(
      cleanStatus,
    );
    let state = "missing_named";

    if (connected && activeGateway === "nemoclaw" && named) {
      state = "healthy_named";
    } else if (activeGateway === "nemoclaw" && named && refusing) {
      state = "named_unreachable";
    } else if (activeGateway === "nemoclaw" && named) {
      state = "named_unhealthy";
    } else if (connected) {
      state = "connected_other";
    }

    return {
      healthy: state === "healthy_named",
      state,
      ...(reasonForState(state, activeGateway)
        ? { reason: reasonForState(state, activeGateway) }
        : {}),
    };
  } catch (error) {
    return probeError(error);
  }
}
