// SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { resolveProviderCredential } from "../credentials/store";
import { redactFull } from "../security/redact";

const TEST_SEND_TIMEOUT_MS = 10_000;

export interface MessagingTestTarget {
  available: boolean;
  label: string | null;
  unavailableReason: string | null;
}

export interface MessagingTestResult {
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

type FetchLike = typeof fetch;
type TokenResolver = (envKey: string) => string | null;

interface TargetValue {
  value: string | null;
  label: string | null;
  unavailableReason: string | null;
}

interface SendOptions {
  sandboxName: string;
  channel: string;
  config?: Record<string, string> | null;
  fetchImpl?: FetchLike;
  now?: Date;
  tokenResolver?: TokenResolver;
}

function firstListValue(value: string | null | undefined): string | null {
  if (!value) return null;
  return value
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)[0] || null;
}

function targetValue(channel: string, config?: Record<string, string> | null): TargetValue {
  if (channel === "telegram") {
    return {
      value: firstListValue(config?.TELEGRAM_ALLOWED_IDS),
      label: "Telegram DM",
      unavailableReason: "TELEGRAM_ALLOWED_IDS is required for a test DM.",
    };
  }
  if (channel === "discord") {
    return {
      value: firstListValue(config?.DISCORD_USER_ID),
      label: "Discord DM",
      unavailableReason: "DISCORD_USER_ID is required for a test DM.",
    };
  }
  if (channel === "slack") {
    return {
      value: firstListValue(config?.SLACK_ALLOWED_USERS),
      label: "Slack DM",
      unavailableReason: "SLACK_ALLOWED_USERS is required for a test DM.",
    };
  }
  return {
    value: null,
    label: null,
    unavailableReason: "Unsupported messaging channel.",
  };
}

export function resolveMessagingTestTarget(
  channel: string,
  config?: Record<string, string> | null,
): MessagingTestTarget {
  const target = targetValue(channel, config);
  return {
    available: !!target.value,
    label: target.value ? target.label : null,
    unavailableReason: target.value ? null : target.unavailableReason,
  };
}

function fixedMessage(sandboxName: string, now: Date): string {
  return `NemoClaw test message from sandbox '${sandboxName}' at ${now.toISOString()}.`;
}

function unavailable(input: {
  sandboxName: string;
  channel: string;
  checkedAt: string;
  target: string | null;
  detail: string;
}): MessagingTestResult {
  return {
    sandbox: input.sandboxName,
    channel: input.channel,
    ok: false,
    status: "unavailable",
    checkedAt: input.checkedAt,
    target: input.target,
    detail: input.detail,
    providerStatus: null,
  };
}

function failed(input: {
  sandboxName: string;
  channel: string;
  checkedAt: string;
  target: string | null;
  detail: string;
  providerStatus: number | null;
  error?: string;
}): MessagingTestResult {
  return {
    sandbox: input.sandboxName,
    channel: input.channel,
    ok: false,
    status: "failed",
    checkedAt: input.checkedAt,
    target: input.target,
    detail: redactFull(input.detail),
    providerStatus: input.providerStatus,
    ...(input.error ? { error: redactFull(input.error) } : {}),
  };
}

function sent(input: {
  sandboxName: string;
  channel: string;
  checkedAt: string;
  target: string | null;
  detail: string;
  providerStatus: number;
}): MessagingTestResult {
  return {
    sandbox: input.sandboxName,
    channel: input.channel,
    ok: true,
    status: "sent",
    checkedAt: input.checkedAt,
    target: input.target,
    detail: input.detail,
    providerStatus: input.providerStatus,
  };
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  if (!text.trim()) return {};
  try {
    const parsed = JSON.parse(text);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return { error: redactFull(text.slice(0, 240)) };
  }
}

function providerDetail(response: Response, body: Record<string, unknown>): string {
  for (const key of ["description", "error", "message"]) {
    const value = body[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return response.statusText || `HTTP ${response.status}`;
}

async function postJson(
  fetchImpl: FetchLike,
  url: string,
  headers: Record<string, string>,
  body: unknown,
): Promise<{ response: Response; json: Record<string, unknown> }> {
  const response = await fetchImpl(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TEST_SEND_TIMEOUT_MS),
  });
  return { response, json: await readJson(response) };
}

async function sendTelegram(options: Required<SendOptions>, target: TargetValue): Promise<MessagingTestResult> {
  const checkedAt = options.now.toISOString();
  const token = options.tokenResolver("TELEGRAM_BOT_TOKEN");
  if (!token) {
    return unavailable({
      sandboxName: options.sandboxName,
      channel: options.channel,
      checkedAt,
      target: target.label,
      detail: "TELEGRAM_BOT_TOKEN is not available to the UI process.",
    });
  }
  const { response, json } = await postJson(
    options.fetchImpl,
    `https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`,
    {},
    {
      chat_id: target.value,
      text: fixedMessage(options.sandboxName, options.now),
      disable_web_page_preview: true,
    },
  );
  if (response.ok && json.ok === true) {
    return sent({
      sandboxName: options.sandboxName,
      channel: options.channel,
      checkedAt,
      target: target.label,
      detail: "Telegram accepted the test message.",
      providerStatus: response.status,
    });
  }
  return failed({
    sandboxName: options.sandboxName,
    channel: options.channel,
    checkedAt,
    target: target.label,
    detail: providerDetail(response, json),
    providerStatus: response.status,
  });
}

async function sendDiscord(options: Required<SendOptions>, target: TargetValue): Promise<MessagingTestResult> {
  const checkedAt = options.now.toISOString();
  const token = options.tokenResolver("DISCORD_BOT_TOKEN");
  if (!token) {
    return unavailable({
      sandboxName: options.sandboxName,
      channel: options.channel,
      checkedAt,
      target: target.label,
      detail: "DISCORD_BOT_TOKEN is not available to the UI process.",
    });
  }
  const auth = { Authorization: `Bot ${token}` };
  const dm = await postJson(options.fetchImpl, "https://discord.com/api/v10/users/@me/channels", auth, {
    recipient_id: target.value,
  });
  const channelId = typeof dm.json.id === "string" ? dm.json.id : null;
  if (!dm.response.ok || !channelId) {
    return failed({
      sandboxName: options.sandboxName,
      channel: options.channel,
      checkedAt,
      target: target.label,
      detail: providerDetail(dm.response, dm.json),
      providerStatus: dm.response.status,
    });
  }
  const message = await postJson(
    options.fetchImpl,
    `https://discord.com/api/v10/channels/${encodeURIComponent(channelId)}/messages`,
    auth,
    {
      content: fixedMessage(options.sandboxName, options.now),
      allowed_mentions: { parse: [] },
    },
  );
  if (message.response.ok && typeof message.json.id === "string") {
    return sent({
      sandboxName: options.sandboxName,
      channel: options.channel,
      checkedAt,
      target: target.label,
      detail: "Discord accepted the test message.",
      providerStatus: message.response.status,
    });
  }
  return failed({
    sandboxName: options.sandboxName,
    channel: options.channel,
    checkedAt,
    target: target.label,
    detail: providerDetail(message.response, message.json),
    providerStatus: message.response.status,
  });
}

async function sendSlack(options: Required<SendOptions>, target: TargetValue): Promise<MessagingTestResult> {
  const checkedAt = options.now.toISOString();
  const token = options.tokenResolver("SLACK_BOT_TOKEN");
  if (!token) {
    return unavailable({
      sandboxName: options.sandboxName,
      channel: options.channel,
      checkedAt,
      target: target.label,
      detail: "SLACK_BOT_TOKEN is not available to the UI process.",
    });
  }
  const auth = { Authorization: `Bearer ${token}` };
  let channelId = target.value;
  const opened = await postJson(options.fetchImpl, "https://slack.com/api/conversations.open", auth, {
    users: target.value,
  });
  if (opened.response.ok && opened.json.ok === true) {
    const channel = opened.json.channel;
    if (typeof channel === "object" && channel !== null && typeof (channel as { id?: unknown }).id === "string") {
      channelId = (channel as { id: string }).id;
    }
  }
  const message = await postJson(options.fetchImpl, "https://slack.com/api/chat.postMessage", auth, {
    channel: channelId,
    text: fixedMessage(options.sandboxName, options.now),
  });
  if (message.response.ok && message.json.ok === true) {
    return sent({
      sandboxName: options.sandboxName,
      channel: options.channel,
      checkedAt,
      target: target.label,
      detail: "Slack accepted the test message.",
      providerStatus: message.response.status,
    });
  }
  return failed({
    sandboxName: options.sandboxName,
    channel: options.channel,
    checkedAt,
    target: target.label,
    detail: providerDetail(message.response, message.json),
    providerStatus: message.response.status,
  });
}

export async function sendMessagingTestMessage(options: SendOptions): Promise<MessagingTestResult> {
  const normalized: Required<SendOptions> = {
    sandboxName: options.sandboxName,
    channel: options.channel.trim().toLowerCase(),
    config: options.config || {},
    fetchImpl: options.fetchImpl || fetch,
    now: options.now || new Date(),
    tokenResolver: options.tokenResolver || resolveProviderCredential,
  };
  const checkedAt = normalized.now.toISOString();
  const target = targetValue(normalized.channel, normalized.config);
  if (!target.value) {
    return unavailable({
      sandboxName: normalized.sandboxName,
      channel: normalized.channel,
      checkedAt,
      target: target.label,
      detail: target.unavailableReason || "No test target is configured.",
    });
  }

  try {
    if (normalized.channel === "telegram") return await sendTelegram(normalized, target);
    if (normalized.channel === "discord") return await sendDiscord(normalized, target);
    if (normalized.channel === "slack") return await sendSlack(normalized, target);
    return unavailable({
      sandboxName: normalized.sandboxName,
      channel: normalized.channel,
      checkedAt,
      target: target.label,
      detail: "Unsupported messaging channel.",
    });
  } catch (error) {
    return failed({
      sandboxName: normalized.sandboxName,
      channel: normalized.channel,
      checkedAt,
      target: target.label,
      detail: "Provider request failed.",
      providerStatus: null,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
