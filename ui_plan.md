<!-- SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved. -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Minimal Node UI Plan

## Summary

Add a small local **NemoClaw Control UI** for day-two sandbox operations.
It should not replace OpenClaw chat or the OpenShell TUI.
Its job is to answer the operator questions that currently require several commands:

- What sandboxes exist?
- Are they healthy?
- Which model, provider, policy presets, channels, and dashboard ports are active?
- What warnings need attention?
- Which safe recovery or maintenance action should I run next?

Launch it from the host:

```bash
nemoclaw ui
```

The command starts a loopback-only web server and opens a local URL:

```text
http://127.0.0.1:<port>/?token=<session-token>
```

## Why This Is Useful

NemoClaw currently spans several UI surfaces:

- `nemoclaw onboard` for setup.
- `nemoclaw` CLI commands for operations.
- OpenClaw browser UI for chat.
- OpenClaw CLI/TUI inside the sandbox for terminal chat.
- OpenShell TUI for live network approvals.
- Telegram, Discord, and Slack for optional external chat.
- Hermes API endpoint for the experimental Hermes path.

That split is reasonable architecturally, but it leaves a product gap.
There is no single lightweight place to see sandbox health, policy state, channels, logs, snapshots, inference, dashboard links, and likely next actions.

The Control UI should be that operator console.

## Non-Goals

- Do not build a replacement chat client for OpenClaw.
- Do not duplicate OpenShell's live network approval TUI in the first version.
- Do not expose credentials or gateway tokens by default.
- Do not add a remotely-bound management server.
- Do not introduce a large frontend framework unless the UI grows past the first version.

## MVP Surface

### Sandbox List

The first screen is a dense table of registered sandboxes.

Show:

- Sandbox name.
- Agent type, such as OpenClaw or Hermes.
- Sandbox phase.
- Connected session count.
- Provider, model, and inference health.
- Dashboard or API endpoint URL.
- Dashboard port.
- Applied policy preset summary.
- Messaging channel status and overlap warnings.
- Update or rebuild-needed state.

Actions:

- Open details.
- Open dashboard or API endpoint.
- Copy relevant command.
- Run `recover` for a degraded but alive sandbox.

### Sandbox Details

Each sandbox gets a detail page with compact tabs.

#### Health

Wrap the same data behind:

```bash
nemoclaw <name> status
nemoclaw <name> doctor
```

Show:

- Gateway health.
- Sandbox health.
- Agent version.
- Inference health.
- Messaging warnings.
- Update/rebuild hints.
- Suggested recovery action.

Actions:

- Run `recover`.
- Run `doctor`.
- Open dashboard.

#### Logs

Stream:

```bash
nemoclaw <name> logs --follow
```

Use Server-Sent Events for live output.

Features:

- Pause/resume.
- Tail length selector.
- Basic text filter.
- Quick filters for policy denials, gateway errors, inference failures, and messaging conflicts.

#### Policy

Show:

- Applied presets.
- Available presets.
- Registry state versus live OpenShell policy state when available.
- Custom preset entry point.

Actions:

- Dry-run a preset.
- Add a preset.
- Remove a preset.

Important copy:

```text
OpenShell live approvals are temporary. Use policy presets or custom policy files for persistent access.
```

The first version should link or point to:

```bash
openshell term
```

for live approval prompts instead of trying to implement approvals itself.

#### Channels

Show Telegram, Discord, and Slack state.

For each channel:

- Configured.
- Stopped.
- Missing credentials.
- Rebuild pending.
- Token overlap warning with another sandbox.

Actions:

- Add channel.
- Stop channel.
- Start channel.
- Remove channel.

The UI must make rebuild requirements explicit before channel-changing actions.

#### Snapshots

Show:

- Snapshot list.
- Version selector, such as `v1`, `v2`, latest.
- Human label.
- Timestamp.
- Path.

Actions:

- Create named snapshot.
- Restore snapshot.
- Clone snapshot to another sandbox.

Restores should require confirmation.

## Suggested Technical Design

Keep the first implementation boring and local.

- Add a new CLI command at `src/commands/ui.ts`.
- Put server orchestration under `src/lib/actions/ui.ts` or `src/lib/ui/server.ts`.
- Use Node's built-in `http` server or a very small dependency such as Fastify.
- Serve static HTML, CSS, and browser JavaScript from a repo-local assets directory.
- Use Server-Sent Events for log streaming.
- Bind to `127.0.0.1` only.
- Generate a random session token at startup.
- Require the token for all HTTP requests.
- Prefer existing `src/lib/actions/**`, `src/lib/state/**`, and `src/lib/adapters/**` helpers over shelling out and parsing CLI text.
- Use CLI subprocesses only as a compatibility bridge where no reusable library function exists yet.

## Security Requirements

- Bind only to loopback.
- Require a random per-session token.
- Do not print provider credentials.
- Do not print gateway tokens by default.
- Redact secrets in logs where possible, reusing existing redaction helpers.
- Mark destructive operations clearly.
- Require typed confirmation for destructive operations if they are added later.
- Treat `destroy`, credential reset, and raw policy replacement as out of scope for v1.

## Initial Command Set

The UI should wrap or surface these existing operations first:

```bash
nemoclaw list
nemoclaw <name> status
nemoclaw <name> doctor
nemoclaw <name> logs --follow
nemoclaw <name> recover
nemoclaw inference get
nemoclaw inference set --provider <provider> --model <model> --sandbox <name>
nemoclaw <name> policy-list
nemoclaw <name> policy-add <preset> --dry-run
nemoclaw <name> policy-add <preset> --yes
nemoclaw <name> policy-remove <preset> --dry-run
nemoclaw <name> policy-remove <preset> --yes
nemoclaw <name> channels list
nemoclaw <name> channels add <channel>
nemoclaw <name> channels stop <channel>
nemoclaw <name> channels start <channel>
nemoclaw <name> snapshot create --name <label>
nemoclaw <name> snapshot list
nemoclaw <name> snapshot restore <selector>
nemoclaw <name> share status
nemoclaw <name> rebuild
nemoclaw upgrade-sandboxes --check
```

## Deferred Features

- Live OpenShell approval handling.
- Full raw policy editor.
- Credential rotation UI.
- Destructive sandbox deletion.
- Remote bind mode.
- Multi-user auth.
- Plugin installation UI.
- Full onboarding wizard in the browser.
- React/Vite app shell.

## Known Product Holes This Addresses

- Users currently need to know which CLI owns each task.
- The distinction between temporary OpenShell approvals and persistent NemoClaw presets is easy to miss.
- Dashboard URLs, gateway tokens, logs, policy, channels, and snapshots are spread across separate commands.
- Messaging channel rebuild requirements are not visually obvious.
- Warnings from `status`, `doctor`, and logs are not gathered into one operator view.

## First Milestone

Build a read-mostly version:

1. `nemoclaw ui` starts a loopback server with token auth.
2. The sandbox list renders from existing registry and status helpers.
3. Each sandbox has Health and Logs tabs.
4. Logs stream over SSE.
5. The UI shows copyable commands for actions that are not wired yet.

This milestone is useful even before mutating actions are added.
