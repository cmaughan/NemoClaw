// SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from "vitest";

import { resolveMessagingTestTarget, sendMessagingTestMessage } from "./test-send";

function jsonResponse(body: unknown, init: { status?: number; statusText?: string } = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status || 200,
    statusText: init.statusText || "OK",
    headers: { "Content-Type": "application/json" },
  });
}

describe("messaging test send", () => {
  it("resolves configured test targets without exposing raw IDs", () => {
    expect(
      resolveMessagingTestTarget("discord", {
        DISCORD_USER_ID: "123456789",
      }),
    ).toEqual({ available: true, label: "Discord DM", unavailableReason: null });
    expect(resolveMessagingTestTarget("slack", {})).toEqual({
      available: false,
      label: null,
      unavailableReason: "SLACK_ALLOWED_USERS is required for a test DM.",
    });
  });

  it("sends a fixed Telegram message to the first configured target", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ ok: true, result: { message_id: 1 } }));

    const result = await sendMessagingTestMessage({
      sandboxName: "alpha",
      channel: "telegram",
      config: { TELEGRAM_ALLOWED_IDS: "111,222" },
      now: new Date("2026-05-14T12:00:00.000Z"),
      tokenResolver: (key) => (key === "TELEGRAM_BOT_TOKEN" ? "123:secret-token" : null),
      fetchImpl,
    });

    expect(result).toMatchObject({
      ok: true,
      status: "sent",
      target: "Telegram DM",
      providerStatus: 200,
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.telegram.org/bot123%3Asecret-token/sendMessage",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          chat_id: "111",
          text: "NemoClaw test message from sandbox 'alpha' at 2026-05-14T12:00:00.000Z.",
          disable_web_page_preview: true,
        }),
      }),
    );
  });

  it("does not send when the token is unavailable to the UI process", async () => {
    const fetchImpl = vi.fn();

    const result = await sendMessagingTestMessage({
      sandboxName: "alpha",
      channel: "discord",
      config: { DISCORD_USER_ID: "123456789" },
      tokenResolver: () => null,
      fetchImpl,
    });

    expect(result).toMatchObject({
      ok: false,
      status: "unavailable",
      target: "Discord DM",
      detail: "DISCORD_BOT_TOKEN is not available to the UI process.",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("creates a Discord DM and sends with mentions disabled", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ id: "channel-1" }, { status: 200 }))
      .mockResolvedValueOnce(jsonResponse({ id: "message-1" }, { status: 200 }));

    const result = await sendMessagingTestMessage({
      sandboxName: "alpha",
      channel: "discord",
      config: { DISCORD_USER_ID: "123456789" },
      now: new Date("2026-05-14T12:00:00.000Z"),
      tokenResolver: (key) => (key === "DISCORD_BOT_TOKEN" ? "discord-secret" : null),
      fetchImpl,
    });

    expect(result.ok).toBe(true);
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      "https://discord.com/api/v10/channels/channel-1/messages",
      expect.objectContaining({
        body: JSON.stringify({
          content: "NemoClaw test message from sandbox 'alpha' at 2026-05-14T12:00:00.000Z.",
          allowed_mentions: { parse: [] },
        }),
      }),
    );
  });

  it("opens a Slack DM before posting", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ ok: true, channel: { id: "D123" } }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, ts: "1.2" }));

    const result = await sendMessagingTestMessage({
      sandboxName: "alpha",
      channel: "slack",
      config: { SLACK_ALLOWED_USERS: "U123,U456" },
      now: new Date("2026-05-14T12:00:00.000Z"),
      tokenResolver: (key) => (key === "SLACK_BOT_TOKEN" ? "xoxb-secret" : null),
      fetchImpl,
    });

    expect(result.ok).toBe(true);
    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      "https://slack.com/api/conversations.open",
      expect.objectContaining({
        body: JSON.stringify({ users: "U123" }),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      "https://slack.com/api/chat.postMessage",
      expect.objectContaining({
        body: JSON.stringify({
          channel: "D123",
          text: "NemoClaw test message from sandbox 'alpha' at 2026-05-14T12:00:00.000Z.",
        }),
      }),
    );
  });
});
