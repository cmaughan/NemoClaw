// SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from "vitest";

import { probeUiGatewayHealth } from "./gateway-health";

describe("probeUiGatewayHealth", () => {
  it("reports a healthy named gateway", () => {
    const health = probeUiGatewayHealth("/tmp/nemoclaw", {
      resolveOpenshell: () => "/usr/local/bin/openshell",
      captureOpenshell: (_binary, args) => ({
        status: 0,
        output:
          args[0] === "status"
            ? "Status: Connected\nGateway: nemoclaw"
            : "Gateway: nemoclaw\nGateway endpoint: http://127.0.0.1:30051",
      }),
    });

    expect(health).toEqual({ healthy: true, state: "healthy_named" });
  });

  it("reports a foreign active gateway", () => {
    const health = probeUiGatewayHealth("/tmp/nemoclaw", {
      resolveOpenshell: () => "/usr/local/bin/openshell",
      captureOpenshell: (_binary, args) => ({
        status: 0,
        output:
          args[0] === "status"
            ? "Status: Connected\nGateway: other"
            : "Gateway: nemoclaw\nGateway endpoint: http://127.0.0.1:30051",
      }),
    });

    expect(health).toEqual({
      healthy: false,
      state: "connected_other",
      reason: "connected to 'other', not 'nemoclaw'",
    });
  });

  it("reports missing OpenShell without throwing or exiting", () => {
    const captureOpenshell = vi.fn();

    const health = probeUiGatewayHealth("/tmp/nemoclaw", {
      resolveOpenshell: () => null,
      captureOpenshell,
    });

    expect(health).toEqual({
      healthy: false,
      state: "openshell_missing",
      reason: "OpenShell CLI not found",
    });
    expect(captureOpenshell).not.toHaveBeenCalled();
  });

  it("downgrades unexpected probe failures into probe_error", () => {
    const health = probeUiGatewayHealth("/tmp/nemoclaw", {
      resolveOpenshell: () => "/usr/local/bin/openshell",
      captureOpenshell: () => {
        throw new Error("spawn exploded");
      },
    });

    expect(health).toEqual({
      healthy: false,
      state: "probe_error",
      reason: "spawn exploded",
    });
  });

  it("downgrades captured probe errors into probe_error", () => {
    const timeout = new Error("openshell status timed out");

    const health = probeUiGatewayHealth("/tmp/nemoclaw", {
      resolveOpenshell: () => "/usr/local/bin/openshell",
      captureOpenshell: (_binary, args) => ({
        status: args[0] === "status" ? null : 0,
        output: "",
        ...(args[0] === "status" ? { error: timeout } : {}),
      }),
    });

    expect(health).toEqual({
      healthy: false,
      state: "probe_error",
      reason: "openshell status timed out",
    });
  });
});
