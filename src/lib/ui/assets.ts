// SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

export const UI_HTML = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>NemoClaw Control</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f4;
      --panel: #ffffff;
      --panel-soft: #f0f3f0;
      --line: #d7ddd5;
      --text: #18211b;
      --muted: #59645c;
      --accent: #4c8b18;
      --accent-strong: #2f6510;
      --warn: #a16207;
      --bad: #b42318;
      --code: #0f172a;
      --shadow: 0 8px 20px rgba(24, 33, 27, 0.08);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-width: 320px;
      background: var(--bg);
      color: var(--text);
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      min-height: 64px;
      padding: 14px 20px;
      border-bottom: 1px solid var(--line);
      background: var(--panel);
      position: sticky;
      top: 0;
      z-index: 4;
    }

    h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0;
    }

    h2 {
      margin: 0 0 12px;
      font-size: 16px;
      letter-spacing: 0;
    }

    button, select, input {
      font: inherit;
    }

    button {
      border: 1px solid var(--line);
      background: var(--panel);
      color: var(--text);
      border-radius: 6px;
      padding: 7px 10px;
      min-height: 34px;
      cursor: pointer;
      line-height: 1.25;
      overflow-wrap: anywhere;
    }

    button:hover { border-color: var(--accent); }
    button.primary {
      color: #fff;
      border-color: var(--accent-strong);
      background: var(--accent);
    }
    button.danger { color: var(--bad); }
    button:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }

    main {
      display: grid;
      grid-template-columns: minmax(420px, 1fr) minmax(360px, 520px);
      gap: 16px;
      padding: 16px;
    }

    section {
      min-width: 0;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: var(--shadow);
    }

    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--line);
    }

    .summary {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--line);
      background: var(--panel-soft);
    }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      max-width: 100%;
      min-height: 26px;
      padding: 3px 8px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: #fff;
      color: var(--muted);
      font-size: 12px;
      white-space: nowrap;
    }

    .chip.good { color: var(--accent-strong); border-color: #a7d08c; }
    .chip.warn { color: var(--warn); border-color: #e0c47b; }
    .chip.bad { color: var(--bad); border-color: #e8a29a; }

    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    .sandbox-table th:nth-child(1), .sandbox-table td:nth-child(1) { width: 18%; }
    .sandbox-table th:nth-child(2), .sandbox-table td:nth-child(2) { width: 12%; }
    .sandbox-table th:nth-child(3), .sandbox-table td:nth-child(3) { width: 18%; }
    .sandbox-table th:nth-child(4), .sandbox-table td:nth-child(4) { width: 9%; }
    .sandbox-table th:nth-child(5), .sandbox-table td:nth-child(5) { width: 8%; }
    .sandbox-table th:nth-child(6), .sandbox-table td:nth-child(6) { width: 15%; }
    .sandbox-table th:nth-child(7), .sandbox-table td:nth-child(7) { width: 12%; }
    .sandbox-table th:nth-child(8), .sandbox-table td:nth-child(8) { width: 8%; }

    th, td {
      min-width: 0;
      padding: 10px 12px;
      border-bottom: 1px solid var(--line);
      vertical-align: top;
      text-align: left;
      font-size: 13px;
    }

    th {
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      background: #fbfcfb;
    }

    tr[data-selected="true"] { background: #eef6e8; }
    tr.sandbox-row { cursor: pointer; }
    tr.sandbox-row:hover { background: #f5f9f2; }

    .name-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .name-line {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      font-weight: 700;
    }

    .truncate {
      display: block;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .wrap-text {
      display: block;
      min-width: 0;
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: normal;
      line-height: 1.35;
    }

    .state-cell .chip {
      display: block;
      width: 100%;
      min-width: 0;
      overflow: hidden;
      text-align: center;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .muted { color: var(--muted); }
    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      font-size: 12px;
    }

    .detail {
      display: flex;
      flex-direction: column;
      min-height: calc(100vh - 98px);
    }

    .detail-body {
      padding: 14px 16px;
      overflow: auto;
    }

    .tabs {
      display: flex;
      gap: 4px;
      padding: 8px 8px 0;
      border-bottom: 1px solid var(--line);
      background: #fbfcfb;
      overflow-x: auto;
    }

    .tab {
      flex: 0 0 auto;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
      border-bottom-color: transparent;
      background: transparent;
      white-space: nowrap;
    }

    .tab.active {
      background: var(--panel);
      border-color: var(--line);
      border-bottom-color: var(--panel);
      margin-bottom: -1px;
    }

    .kv {
      display: grid;
      grid-template-columns: 120px minmax(0, 1fr);
      gap: 8px 12px;
      font-size: 13px;
    }

    .kv div:nth-child(odd) {
      color: var(--muted);
      font-weight: 700;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 14px 0;
    }

    .health-card {
      display: grid;
      gap: 10px;
      min-width: 0;
      margin-top: 14px;
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #fbfcfb;
    }

    .health-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      min-width: 0;
    }

    .health-grid {
      display: grid;
      grid-template-columns: 96px minmax(0, 1fr);
      gap: 8px 12px;
      font-size: 13px;
    }

    .health-grid div:nth-child(odd) {
      color: var(--muted);
      font-weight: 700;
    }

    .health-actions {
      margin: 2px 0 0;
    }

    .channel-list {
      display: grid;
      gap: 12px;
    }

    .item-list {
      display: grid;
      gap: 10px;
    }

    .item-row {
      display: grid;
      gap: 8px;
      padding: 10px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #fff;
    }

    .item-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      min-width: 0;
    }

    .tool-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }

    .channel-description {
      margin: -2px 0 0;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.35;
    }

    .channel-token-input {
      flex: 1 1 220px;
    }

    .command-output {
      max-height: 260px;
      overflow: auto;
      margin: 0;
      padding: 10px;
      border-radius: 6px;
      background: var(--code);
      color: #e5e7eb;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    .command-list {
      display: grid;
      gap: 8px;
      margin-top: 12px;
    }

    .command {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
      align-items: center;
      padding: 8px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #fbfcfb;
    }

    pre.log {
      height: 420px;
      overflow: auto;
      margin: 10px 0 0;
      padding: 12px;
      border-radius: 6px;
      background: var(--code);
      color: #e5e7eb;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .log-tools {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto auto;
      gap: 8px;
      align-items: center;
    }

    input {
      min-height: 34px;
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 7px 10px;
      min-width: 0;
    }

    .empty {
      padding: 24px;
      color: var(--muted);
      text-align: center;
    }

    .warnings {
      display: grid;
      gap: 8px;
      margin-top: 12px;
    }

    .warning {
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid #e0c47b;
      color: #7c4a03;
      background: #fff8e6;
      font-size: 13px;
    }

    @media (max-width: 900px) {
      main { grid-template-columns: 1fr; }
      .detail { min-height: auto; }
      .wide-only { display: none; }
      .sandbox-table th:nth-child(1), .sandbox-table td:nth-child(1) { width: 32%; }
      .sandbox-table th:nth-child(2), .sandbox-table td:nth-child(2) { width: 20%; }
      .sandbox-table th:nth-child(3), .sandbox-table td:nth-child(3) { width: 28%; }
      .sandbox-table th:nth-child(8), .sandbox-table td:nth-child(8) { width: 20%; }
      .sandbox-table th, .sandbox-table td { padding: 8px 6px; }
      .sandbox-table a { overflow-wrap: anywhere; }
    }
  </style>
</head>
<body>
  <header>
    <h1>NemoClaw Control</h1>
    <div class="actions" style="margin:0">
      <button id="refresh" class="primary">Refresh</button>
    </div>
  </header>

  <main>
    <section>
      <div class="section-head">
        <h2>Sandboxes</h2>
        <span id="updated" class="muted mono"></span>
      </div>
      <div id="summary" class="summary"></div>
      <div id="global-output"></div>
      <div id="sandboxes"></div>
    </section>

    <section class="detail">
      <div class="section-head">
        <h2 id="detail-title">Details</h2>
        <button id="open-endpoint" disabled>Open</button>
      </div>
      <div class="tabs">
        <button class="tab active" data-tab="health">Health</button>
        <button class="tab" data-tab="logs">Logs</button>
        <button class="tab" data-tab="policy">Policy</button>
        <button class="tab" data-tab="channels">Channels</button>
        <button class="tab" data-tab="snapshots">Snapshots</button>
      </div>
      <div id="detail" class="detail-body empty">Select a sandbox.</div>
    </section>
  </main>

  <script>
    (function () {
      "use strict";

      var token = new URLSearchParams(window.location.search).get("token") || "";
      var overview = null;
      var selectedName = null;
      var activeTab = "health";
      var eventSource = null;
      var logLines = [];
      var liveHealthByName = {};
      var liveHealthLoadingByName = {};
      var liveHealthAttemptedByName = {};
      var channelCheckByName = {};
      var channelCheckLoadingByName = {};
      var channelTestByName = {};
      var channelTestLoadingByName = {};
      var commandOutputByName = {};

      function $(id) { return document.getElementById(id); }

      function esc(value) {
        return String(value == null ? "" : value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      function authFetch(path, options) {
        var next = options || {};
        next.headers = Object.assign({}, next.headers || {}, { Authorization: "Bearer " + token });
        return fetch(path, next).then(function (response) {
          if (!response.ok) {
            return response.text().then(function (text) {
              throw new Error(text || ("HTTP " + response.status));
            });
          }
          return response.json();
        });
      }

      function chip(label, kind) {
        return '<span class="chip ' + esc(kind || "") + '">' + esc(label) + '</span>';
      }

      function selectedSandbox() {
        if (!overview || !selectedName) return null;
        return overview.sandboxes.find(function (sandbox) { return sandbox.name === selectedName; }) || null;
      }

      function renderSummary() {
        if (!overview) return;
        var parts = [];
        parts.push(chip(overview.sandboxes.length + " sandbox" + (overview.sandboxes.length === 1 ? "" : "es"), ""));
        if (overview.gatewayHealth) {
          parts.push(chip("gateway " + overview.gatewayHealth.state, overview.gatewayHealth.healthy ? "good" : "bad"));
        } else {
          parts.push(chip("gateway unknown", "warn"));
        }
        if (overview.liveInference && overview.liveInference.model) {
          parts.push(chip("model " + overview.liveInference.model, ""));
        }
        parts.push(chip(overview.commands.openApprovals, "warn"));
        parts.push('<button data-global-action="inference-get">Inference</button>');
        parts.push('<button data-global-action="upgrade-check">Upgrade check</button>');
        $("summary").innerHTML = parts.join("");
        $("updated").textContent = overview.generatedAt ? new Date(overview.generatedAt).toLocaleTimeString() : "";
        renderGlobalOutput();
      }

      function renderGlobalOutput() {
        var target = $("global-output");
        if (!target) return;
        var entry = commandOutputByName.__global;
        if (!entry) {
          target.innerHTML = "";
          return;
        }
        target.innerHTML = renderCommandOutput({ name: "__global" });
      }

      function renderSandboxTable() {
        if (!overview || overview.sandboxes.length === 0) {
          $("sandboxes").innerHTML = '<div class="empty">No sandboxes registered.</div>';
          return;
        }
        var rows = overview.sandboxes.map(function (sandbox) {
          var warn = sandbox.warnings.length > 0 ? chip(sandbox.warnings.length + " warning" + (sandbox.warnings.length === 1 ? "" : "s"), "warn") : chip("ok", "good");
          var connected = sandbox.connected ? chip((sandbox.activeSessionCount || 1) + " connected", "good") : chip("idle", "");
          var port = sandbox.dashboardPort == null ? "none" : String(sandbox.dashboardPort);
          var policyCount = sandbox.policy && sandbox.policy.registryApplied ? sandbox.policy.registryApplied.length : sandbox.policies.length;
          var endpoint = sandbox.dashboardUrl
            ? '<a href="' + esc(sandbox.dashboardUrl) + '" target="_blank" rel="noreferrer">' + esc(sandbox.endpointLabel) + '</a>'
            : '<span class="muted">none</span>';
          return [
            '<tr class="sandbox-row" data-name="' + esc(sandbox.name) + '" data-selected="' + String(sandbox.name === selectedName) + '">',
            '<td><div class="name-cell"><div class="name-line"><span class="truncate">' + esc(sandbox.name) + '</span>' + (sandbox.isDefault ? chip("default", "good") : "") + '</div><span class="muted">' + esc(sandbox.agent) + '</span></div></td>',
            '<td>' + chip(sandbox.phase || "registered", sandbox.phase === "ready" || sandbox.phase === "connected" ? "good" : sandbox.phase === "attention" || sandbox.phase === "rebuild ready" ? "warn" : "") + '</td>',
            '<td><div class="truncate">' + esc(sandbox.model || "unknown") + '</div><div class="muted truncate">' + esc(sandbox.provider || "unknown") + '</div></td>',
            '<td class="wide-only">' + connected + '</td>',
            '<td class="wide-only">' + esc(port) + '</td>',
            '<td class="wide-only"><span class="wrap-text">' + esc(policyCount ? sandbox.policies.join(", ") : "none") + '</span></td>',
            '<td>' + endpoint + '</td>',
            '<td class="state-cell">' + warn + '</td>',
            '</tr>'
          ].join("");
        }).join("");
        $("sandboxes").innerHTML = [
          '<table class="sandbox-table">',
          '<thead><tr><th>Sandbox</th><th>Phase</th><th>Inference</th><th class="wide-only">Session</th><th class="wide-only">Port</th><th class="wide-only">Policy</th><th>Endpoint</th><th>State</th></tr></thead>',
          '<tbody>' + rows + '</tbody>',
          '</table>'
        ].join("");
        Array.prototype.forEach.call(document.querySelectorAll(".sandbox-row"), function (row) {
          row.addEventListener("click", function () {
            selectedName = row.getAttribute("data-name");
            stopLogs();
            renderAll();
          });
        });
      }

      function liveChipKind(live) {
        if (!live) return "warn";
        if (live.forward.healthy) return "good";
        if (live.forward.state === "not_configured") return "warn";
        return "bad";
      }

      function liveChipLabel(live) {
        if (!live) return "not checked";
        if (live.forward.healthy) return "forward live";
        if (live.forward.state === "not_configured") return "no port";
        if (live.forward.state === "invalid") return "invalid";
        return "unreachable";
      }

      function versionLabel(value) {
        if (!value) return "unknown";
        return /^v/i.test(value) ? value : "v" + value;
      }

      function versionChipKind(version) {
        if (!version) return "warn";
        if (version.state === "current") return "good";
        if (version.state === "stale") return "bad";
        if (version.state === "unmanaged") return "";
        return "warn";
      }

      function versionChipLabel(version) {
        if (!version) return "unknown";
        if (version.state === "current") return "current";
        if (version.state === "stale") return "upgrade ready";
        if (version.state === "unmanaged") return "unmanaged";
        return "check version";
      }

      function versionDetectionLabel(version) {
        if (!version) return "not checked";
        if (version.detectionMethod === "registry") return "cached";
        if (version.detectionMethod === "ssh-exec") return "live probe";
        return "not checked";
      }

      function versionNextText(version) {
        if (!version) return "Run doctor to inspect the sandbox version.";
        if (version.error) return "Version metadata unavailable: " + version.error;
        if (version.state === "stale") return "Rebuild when ready to pick up the pinned version.";
        if (version.state === "unknown") return "Run doctor to probe and cache the sandbox version.";
        if (version.state === "unmanaged") return "No pinned agent version is declared for this agent.";
        return "No version rebuild needed.";
      }

      function renderVersionReadiness(sandbox) {
        var version = sandbox.version || null;
        var command = version && version.command ? version.command : "";
        return [
          '<div class="health-card">',
          '<div class="health-head"><strong>Version Readiness</strong>' + chip(versionChipLabel(version), versionChipKind(version)) + '</div>',
          '<div class="health-grid">',
          '<div>Current</div><div>' + esc(versionLabel(version && version.current)) + '</div>',
          '<div>Target</div><div>' + esc(versionLabel(version && version.target)) + '</div>',
          '<div>Detected</div><div>' + esc(versionDetectionLabel(version)) + '</div>',
          '<div>Next</div><div><span class="wrap-text">' + esc(versionNextText(version)) + '</span></div>',
          '</div>',
          command
            ? '<div class="actions health-actions"><button data-copy="' + esc(command) + '">Copy ' + esc(version && version.state === "stale" ? "rebuild" : "doctor") + '</button></div>'
            : "",
          '</div>'
        ].join("");
      }

      function channelKey(sandbox, channel) {
        return sandbox.name + ":" + channel.name;
      }

      function channelChipKind(channel) {
        if (!channel) return "warn";
        if (channel.state === "active") return "good";
        if (channel.state === "conflict") return "bad";
        if (channel.state === "paused" || channel.state === "needs_policy") return "warn";
        return "";
      }

      function channelChipLabel(channel) {
        if (!channel) return "unknown";
        if (channel.state === "active") return "active";
        if (channel.state === "paused") return "stopped";
        if (channel.state === "needs_policy") return "needs policy";
        if (channel.state === "conflict") return "overlap";
        return "not configured";
      }

      function channelCredentialText(channel) {
        if (!channel.credentials || channel.credentials.length === 0) return "none";
        return channel.credentials.map(function (credential) {
          var state = credential.state === "recorded"
            ? "recorded"
            : credential.state === "unknown"
              ? "unknown"
              : "not configured";
          return credential.envKey + " " + state;
        }).join(", ");
      }

      function channelConfigText(channel) {
        if (!channel.config || channel.config.length === 0) return "default";
        return channel.config.map(function (item) {
          return item.label + ": " + item.value;
        }).join(", ");
      }

      function channelOverlapText(channel) {
        if (!channel.overlaps || channel.overlaps.length === 0) return "none";
        return channel.overlaps.map(function (overlap) {
          return overlap.sandbox + " (" + overlap.reason.replace("-", " ") + ")";
        }).join(", ");
      }

      function channelTokenEnv(channel) {
        if (!channel.credentials || channel.credentials.length === 0) return "token";
        return channel.credentials[0].envKey || "token";
      }

      function checkChipKind(status) {
        if (status === "ok") return "good";
        if (status === "fail") return "bad";
        if (status === "warn") return "warn";
        return "";
      }

      function renderChannelCheck(sandbox, channel) {
        var key = channelKey(sandbox, channel);
        var check = channelCheckByName[key];
        if (channelCheckLoadingByName[key]) {
          return '<pre class="command-output">Channel check for ' + esc(channel.name) + "\nrunning..." + '</pre>';
        }
        if (!check) return "";
        var lines = [
          "Channel check for " + check.channel + " (" + check.status + ")",
          "checked: " + new Date(check.checkedAt).toLocaleTimeString(),
          ""
        ];
        (check.checks || []).forEach(function (item) {
          lines.push(item.label + ": " + item.status + " - " + item.detail);
          if (item.hint) lines.push("  hint: " + item.hint);
        });
        return '<pre class="command-output">' + esc(lines.join("\n")) + '</pre>';
      }

      function renderChannelTest(sandbox, channel) {
        var key = channelKey(sandbox, channel);
        var test = channelTestByName[key];
        if (channelTestLoadingByName[key]) {
          return '<pre class="command-output">Test message for ' + esc(channel.name) + "\nsending..." + '</pre>';
        }
        if (!test) return "";
        var lines = [
          "Test message for " + test.channel + " (" + test.status + ")",
          "checked: " + new Date(test.checkedAt).toLocaleTimeString(),
          "target: " + (test.target || "none"),
          "detail: " + test.detail
        ];
        if (test.error) lines.push("error: " + test.error);
        return '<pre class="command-output">' + esc(lines.join("\n")) + '</pre>';
      }

      function renderCommandOutput(sandbox) {
        var entry = commandOutputByName[sandbox.name];
        if (!entry) return "";
        if (entry.pending) {
          return '<pre class="command-output">' + esc(entry.title + "\nrunning...") + '</pre>';
        }
        var result = entry.result || {};
        var status = result.ok ? "ok" : "exit " + (result.status == null ? "unknown" : result.status);
        var body = [];
        if (result.stdout) body.push(result.stdout);
        if (result.stderr) body.push(result.stderr);
        return '<pre class="command-output">' + esc(entry.title + " (" + status + ")\n\n" + (body.join("\n\n") || "(no output)")) + '</pre>';
      }

      function renderLiveHealth(sandbox) {
        var live = liveHealthByName[sandbox.name] || null;
        var forward = live ? live.forward : null;
        var forwardText = live
          ? (forward.url || "none") + (forward.httpStatus ? " returned HTTP " + forward.httpStatus : "")
          : "Not checked";
        if (forward && forward.error) forwardText += " - " + forward.error;
        var nextText = live && live.suggestedAction
          ? live.suggestedAction.label + ": " + live.suggestedAction.detail + (live.suggestedAction.command ? " " + live.suggestedAction.command : "")
          : "Check live health.";
        var checked = forward && forward.checkedAt ? new Date(forward.checkedAt).toLocaleTimeString() : "never";
        var repairDisabled = sandbox.dashboardUrl ? "" : " disabled";
        return [
          '<div class="health-card">',
          '<div class="health-head"><strong>Live Health</strong>' + chip(liveHealthLoadingByName[sandbox.name] ? "checking" : liveChipLabel(live), liveChipKind(live)) + '</div>',
          '<div class="health-grid">',
          '<div>Forward</div><div><span class="wrap-text">' + esc(forwardText) + '</span></div>',
          '<div>Checked</div><div>' + esc(checked) + '</div>',
          '<div>Next</div><div><span class="wrap-text">' + esc(nextText) + '</span></div>',
          '</div>',
          '<div class="actions health-actions">',
          '<button id="check-live">Check Live</button>',
          '<button class="primary" id="repair-forward"' + repairDisabled + '>Repair Forward</button>',
          '<button id="run-status">Run status</button>',
          '<button id="run-doctor">Run doctor</button>',
          '</div>',
          renderCommandOutput(sandbox),
          '</div>'
        ].join("");
      }

      function renderHealth(sandbox) {
        var warnings = sandbox.warnings.length
          ? '<div class="warnings">' + sandbox.warnings.map(function (w) { return '<div class="warning">' + esc(w) + '</div>'; }).join("") + '</div>'
          : "";
        return [
          '<div class="kv">',
          '<div>Agent</div><div>' + esc(sandbox.agent) + '</div>',
          '<div>Phase</div><div>' + esc(sandbox.phase || "registered") + '</div>',
          '<div>Model</div><div class="truncate">' + esc(sandbox.model || "unknown") + '</div>',
          '<div>Provider</div><div class="truncate">' + esc(sandbox.provider || "unknown") + '</div>',
          '<div>Gateway</div><div>' + esc(sandbox.gatewayHealth) + '</div>',
          '<div>Inference</div><div>' + esc(sandbox.inferenceHealth) + '</div>',
          '<div>Connected</div><div>' + esc(sandbox.connected ? String(sandbox.activeSessionCount || 1) : "no") + '</div>',
          '<div>Port</div><div>' + esc(sandbox.dashboardPort == null ? "none" : String(sandbox.dashboardPort)) + '</div>',
          '<div>Endpoint</div><div>' + (sandbox.dashboardUrl ? '<a href="' + esc(sandbox.dashboardUrl) + '" target="_blank" rel="noreferrer">' + esc(sandbox.dashboardUrl) + '</a>' : '<span class="muted">none</span>') + '</div>',
          '</div>',
          warnings,
          renderVersionReadiness(sandbox),
          renderLiveHealth(sandbox),
          '<div class="actions">',
          '<button data-copy="' + esc(sandbox.commands.status) + '">Copy status command</button>',
          '<button data-copy="' + esc(sandbox.commands.doctor) + '">Copy doctor command</button>',
          '<button data-sandbox-action="share-status">Share status</button>',
          '<button data-copy="' + esc(sandbox.commands.inferenceSet) + '">Copy inference set</button>',
          '</div>',
          renderCommands(sandbox)
        ].join("");
      }

      function renderCommands(sandbox) {
        return '<div class="command-list">' + Object.keys(sandbox.commands).map(function (key) {
          var command = sandbox.commands[key];
          return '<div class="command"><code class="mono truncate">' + esc(command) + '</code><button data-copy="' + esc(command) + '">Copy</button></div>';
        }).join("") + '</div>';
      }

      function renderPolicy(sandbox) {
        var policy = sandbox.policy || { available: [], registryApplied: sandbox.policies || [], gatewayApplied: null, liveState: "unchecked" };
        var rows = policy.available && policy.available.length
          ? policy.available.map(function (preset) {
            var state = preset.appliedRegistry
              ? preset.appliedGateway === false
                ? "registry only"
                : "applied"
              : preset.appliedGateway
                ? "gateway only"
                : "not applied";
            var kind = state === "applied" ? "good" : state.indexOf("only") !== -1 ? "warn" : "";
            return [
              '<div class="item-row">',
              '<div class="item-title"><strong class="truncate">' + esc(preset.name) + '</strong>' + chip(state, kind) + '</div>',
              '<div class="muted wrap-text">' + esc(preset.description || preset.source || "") + '</div>',
              '<div class="muted mono wrap-text">' + esc(preset.file || "") + '</div>',
              '<div class="actions health-actions">',
              '<button data-policy-action="add-dry-run" data-policy-preset="' + esc(preset.name) + '">Preview add</button>',
              '<button data-policy-action="add" data-policy-preset="' + esc(preset.name) + '"' + (preset.appliedRegistry ? " disabled" : "") + '>Add</button>',
              '<button data-policy-action="remove-dry-run" data-policy-preset="' + esc(preset.name) + '"' + (!preset.appliedRegistry ? " disabled" : "") + '>Preview remove</button>',
              '<button class="danger" data-policy-action="remove" data-policy-preset="' + esc(preset.name) + '"' + (!preset.appliedRegistry ? " disabled" : "") + '>Remove</button>',
              '</div>',
              '</div>'
            ].join("");
          }).join("")
          : '<div class="empty">No policy presets found.</div>';
        return [
          '<div class="kv">',
          '<div>Registry</div><div><span class="wrap-text">' + esc(policy.registryApplied.length ? policy.registryApplied.join(", ") : "none") + '</span></div>',
          '<div>Live state</div><div>' + esc(policy.liveState || "unchecked") + '</div>',
          '<div>Live approvals</div><div><code class="mono">' + esc(overview.commands.openApprovals) + '</code></div>',
          '<div>Custom preset</div><div><code class="mono wrap-text">' + esc(policy.customPresetCommand || "") + '</code></div>',
          '</div>',
          '<div class="actions">',
          '<button id="check-policy-live">Check live policy</button>',
          '<button data-copy="' + esc(sandbox.commands.policyList) + '">Copy policy-list</button>',
          '<button data-copy="' + esc(overview.commands.openApprovals) + '">Copy approvals command</button>',
          '<button data-copy="' + esc(policy.customPresetCommand || "") + '">Copy custom preset command</button>',
          '</div>',
          '<div class="item-list">' + rows + '</div>',
          renderCommandOutput(sandbox)
        ].join("");
      }

      function renderChannels(sandbox) {
        var channels = sandbox.channelStatuses || [];
        if (channels.length === 0) {
          return [
            '<div class="empty">No channel metadata available.</div>',
            '<div class="actions">',
            '<button data-copy="' + esc(sandbox.commands.channelsList) + '">Copy channels list</button>',
            '</div>'
          ].join("");
        }
        return [
          '<div class="channel-list">',
          channels.map(function (channel) {
            var key = channelKey(sandbox, channel);
            var primaryCommand = channel.state === "paused"
              ? channel.commands.start
              : channel.configured
                ? channel.commands.stop
                : channel.commands.add;
            var primaryLabel = channel.state === "paused" ? "Copy start" : channel.configured ? "Copy stop" : "Copy add";
            var testDisabled = !channel.test || !channel.test.available || channelTestLoadingByName[key] ? " disabled" : "";
            var testTitle = channel.test && channel.test.unavailableReason ? ' title="' + esc(channel.test.unavailableReason) + '"' : "";
            var tokenInput = channel.test && channel.test.available
              ? '<input class="channel-token-input mono" type="password" data-channel-token="' + esc(channel.name) + '" placeholder="Optional ' + esc(channelTokenEnv(channel)) + ' for this test" autocomplete="off" autocapitalize="off" spellcheck="false">'
              : "";
            return [
              '<div class="health-card">',
              '<div class="health-head"><strong>' + esc(channel.name) + '</strong>' + chip(channelChipLabel(channel), channelChipKind(channel)) + '</div>',
              '<div class="channel-description">' + esc(channel.description) + '</div>',
              '<div class="health-grid">',
              '<div>Bridge</div><div><span class="wrap-text">' + esc(channel.active ? "enabled" : channel.paused ? "paused" : "not configured") + '</span></div>',
              '<div>Policy</div><div>' + esc(channel.policyApplied ? "applied" : "not applied") + '</div>',
              '<div>Tokens</div><div><span class="wrap-text">' + esc(channelCredentialText(channel)) + '</span></div>',
              '<div>Access</div><div><span class="wrap-text">' + esc(channelConfigText(channel)) + '</span></div>',
              '<div>Overlap</div><div><span class="wrap-text">' + esc(channelOverlapText(channel)) + '</span></div>',
              '<div>Test</div><div><span class="wrap-text">' + esc(channel.test && channel.test.available ? channel.test.target : channel.test && channel.test.unavailableReason ? channel.test.unavailableReason : "unavailable") + '</span></div>',
              '<div>Next</div><div><span class="wrap-text">' + esc(channel.next) + '</span></div>',
              '</div>',
              '<div class="actions health-actions">',
              tokenInput,
              '<button data-channel-check="' + esc(channel.name) + '"' + (channelCheckLoadingByName[key] ? " disabled" : "") + '>Check</button>',
              '<button data-channel-test="' + esc(channel.name) + '"' + testDisabled + testTitle + '>Send test message</button>',
              '<button data-copy="' + esc(primaryCommand) + '">' + esc(primaryLabel) + '</button>',
              '<button data-copy="' + esc(channel.commands.remove) + '">Copy remove</button>',
              '<button data-copy="' + esc(channel.commands.rebuild) + '">Copy rebuild</button>',
              '</div>',
              renderChannelCheck(sandbox, channel),
              renderChannelTest(sandbox, channel),
              '</div>'
            ].join("");
          }).join(""),
          '</div>',
          '<div class="actions">',
          '<button data-copy="' + esc(sandbox.commands.channelsList) + '">Copy channels list</button>',
          '</div>'
        ].join("");
      }

      function renderSnapshots(sandbox) {
        var snapshots = sandbox.snapshots || { count: 0, latest: null, items: [] };
        var version = sandbox.version || null;
        var snapshotChip = snapshots.error
          ? chip("scan failed", "bad")
          : snapshots.count > 0
            ? chip(snapshots.count + " snapshot" + (snapshots.count === 1 ? "" : "s"), "good")
            : chip("no snapshots", "warn");
        var latest = snapshots.latest;
        var latestText = latest
          ? latest.version + (latest.name ? " " + latest.name : "") + " at " + latest.timestamp
          : "none";
        var pathText = latest ? latest.path : "none";
        var nextText = snapshots.error
          ? "Run snapshot list to inspect local backup metadata."
          : version && version.state === "stale"
            ? snapshots.count > 0
              ? "Run preflight, then copy the rebuild command to upgrade."
              : "Create a snapshot before copying the rebuild command to upgrade."
            : snapshots.count > 0
              ? "Run preflight before any manual rebuild."
              : "Create a snapshot before any manual rebuild.";
        var list = snapshots.items && snapshots.items.length
          ? snapshots.items.map(function (snapshot) {
            var title = snapshot.version + (snapshot.name ? " " + snapshot.name : "");
            return [
              '<div class="item-row">',
              '<div class="item-title"><strong class="truncate">' + esc(title) + '</strong>' + chip(snapshot.timestamp, "") + '</div>',
              '<div class="muted wrap-text">' + esc(snapshot.path) + '</div>',
              '<div class="actions health-actions">',
              '<button data-snapshot-restore="' + esc(snapshot.selector) + '">Restore</button>',
              '<button data-snapshot-clone="' + esc(snapshot.selector) + '">Clone to...</button>',
              '<button data-copy="' + esc(snapshot.restoreCommand) + '">Copy restore</button>',
              '<button data-copy="' + esc(snapshot.cloneCommand) + '">Copy clone</button>',
              '</div>',
              '</div>'
            ].join("");
          }).join("")
          : '<div class="empty">No snapshots recorded.</div>';
        return [
          '<div class="health-card">',
          '<div class="health-head"><strong>Rebuild Guard</strong>' + snapshotChip + '</div>',
          '<div class="health-grid">',
          '<div>Version</div><div>' + chip(versionChipLabel(version), versionChipKind(version)) + ' <span class="muted">' + esc(versionLabel(version && version.current)) + " -> " + esc(versionLabel(version && version.target)) + '</span></div>',
          '<div>Latest</div><div><span class="wrap-text">' + esc(latestText) + '</span></div>',
          '<div>Path</div><div><span class="wrap-text">' + esc(pathText) + '</span></div>',
          '<div>Next</div><div><span class="wrap-text">' + esc(nextText) + '</span></div>',
          '</div>',
          '<div class="actions">',
          '<button id="rebuild-preflight">Preflight Rebuild</button>',
          '<button class="primary" id="create-snapshot">Create Snapshot</button>',
          '<button id="run-snapshot-list">Run snapshot list</button>',
          '<button data-copy="' + esc(sandbox.commands.rebuild) + '">Copy rebuild</button>',
          '</div>',
          renderCommandOutput(sandbox),
          '</div>',
          '<div class="item-list">' + list + '</div>',
          '<div class="actions">',
          '<button data-copy="' + esc(sandbox.commands.snapshotList) + '">Copy snapshot list</button>',
          '<button data-copy="' + esc("nemoclaw " + sandbox.name + " snapshot create --name before-change") + '">Copy create snapshot</button>',
          '</div>',
          renderCommands({ commands: { snapshotList: sandbox.commands.snapshotList, rebuild: sandbox.commands.rebuild } })
        ].join("");
      }

      function renderLogs(sandbox) {
        return [
          '<div class="log-tools">',
          '<select id="log-tail" aria-label="Tail length">',
          '<option value="100">100</option>',
          '<option value="200" selected>200</option>',
          '<option value="500">500</option>',
          '<option value="1000">1000</option>',
          '</select>',
          '<input id="log-filter" placeholder="Filter logs" value="">',
          '<button id="start-logs" class="primary">Start</button>',
          '<button id="stop-logs">Stop</button>',
          '<button data-log-filter="policy|denied|blocked">Policy</button>',
          '<button data-log-filter="gateway|error|failed">Gateway</button>',
          '<button data-log-filter="inference|provider|model">Inference</button>',
          '<button data-log-filter="messaging|telegram|discord|slack|conflict">Messaging</button>',
          '</div>',
          '<pre id="log-output" class="log">' + esc(logLines.join("\n")) + '</pre>'
        ].join("");
      }

      function loadLiveHealth(name) {
        if (liveHealthLoadingByName[name]) return;
        liveHealthAttemptedByName[name] = true;
        liveHealthLoadingByName[name] = true;
        renderDetail();
        authFetch("/api/sandboxes/" + encodeURIComponent(name) + "/live")
          .then(function (data) {
            liveHealthByName[name] = data;
          })
          .catch(function (err) {
            commandOutputByName[name] = { title: "Live Health", result: { ok: false, status: null, stdout: "", stderr: err.message } };
          })
          .finally(function () {
            delete liveHealthLoadingByName[name];
            renderDetail();
          });
      }

      function runSandboxAction(sandbox, action, title) {
        commandOutputByName[sandbox.name] = { title: title, pending: true };
        renderDetail();
        authFetch("/api/sandboxes/" + encodeURIComponent(sandbox.name) + "/actions/" + action, { method: "POST" })
          .then(function (result) {
            commandOutputByName[sandbox.name] = { title: title, result: result };
            if (action === "doctor" || action === "rebuild-preflight") load().catch(function () {});
          })
          .catch(function (err) {
            commandOutputByName[sandbox.name] = { title: title, result: { ok: false, status: null, stdout: "", stderr: err.message } };
          })
          .finally(function () { renderDetail(); });
      }

      function runGlobalAction(action, title) {
        commandOutputByName.__global = { title: title, pending: true };
        renderGlobalOutput();
        authFetch("/api/actions/" + encodeURIComponent(action), { method: "POST" })
          .then(function (result) {
            commandOutputByName.__global = { title: title, result: result };
          })
          .catch(function (err) {
            commandOutputByName.__global = { title: title, result: { ok: false, status: null, stdout: "", stderr: err.message } };
          })
          .finally(function () {
            renderGlobalOutput();
            load().catch(function () {});
          });
      }

      function repairForward(sandbox) {
        commandOutputByName[sandbox.name] = { title: "Repair Forward", pending: true };
        renderDetail();
        authFetch("/api/sandboxes/" + encodeURIComponent(sandbox.name) + "/forward/repair", { method: "POST" })
          .then(function (data) {
            liveHealthByName[sandbox.name] = data;
            commandOutputByName[sandbox.name] = { title: "Repair Forward", result: data.result };
            renderDetail();
            load().catch(function () {});
          })
          .catch(function (err) {
            commandOutputByName[sandbox.name] = { title: "Repair Forward", result: { ok: false, status: null, stdout: "", stderr: err.message } };
            renderDetail();
          });
      }

      function createSnapshot(sandbox) {
        commandOutputByName[sandbox.name] = { title: "Create Snapshot", pending: true };
        renderDetail();
        authFetch("/api/sandboxes/" + encodeURIComponent(sandbox.name) + "/actions/snapshot-create", { method: "POST" })
          .then(function (result) {
            commandOutputByName[sandbox.name] = { title: "Create Snapshot", result: result };
            renderDetail();
            load().catch(function () {});
          })
          .catch(function (err) {
            commandOutputByName[sandbox.name] = { title: "Create Snapshot", result: { ok: false, status: null, stdout: "", stderr: err.message } };
            renderDetail();
          });
      }

      function runPolicyAction(sandbox, preset, action) {
        var title = "Policy " + action.replace("-", " ") + " " + preset;
        if ((action === "add" || action === "remove") && !window.confirm("Run " + title + " for " + sandbox.name + "?")) return;
        commandOutputByName[sandbox.name] = { title: title, pending: true };
        renderDetail();
        authFetch(
          "/api/sandboxes/" + encodeURIComponent(sandbox.name) + "/policies/" + encodeURIComponent(preset) + "/" + encodeURIComponent(action),
          { method: "POST" }
        )
          .then(function (result) {
            commandOutputByName[sandbox.name] = { title: title, result: result };
            load().catch(function () {});
          })
          .catch(function (err) {
            commandOutputByName[sandbox.name] = { title: title, result: { ok: false, status: null, stdout: "", stderr: err.message } };
          })
          .finally(function () { renderDetail(); });
      }

      function checkPolicyLive(sandbox) {
        commandOutputByName[sandbox.name] = { title: "Policy List", pending: true };
        renderDetail();
        authFetch("/api/sandboxes/" + encodeURIComponent(sandbox.name) + "/policies/check", { method: "POST" })
          .then(function (result) {
            commandOutputByName[sandbox.name] = { title: "Policy List", result: result };
          })
          .catch(function (err) {
            commandOutputByName[sandbox.name] = { title: "Policy List", result: { ok: false, status: null, stdout: "", stderr: err.message } };
          })
          .finally(function () { renderDetail(); });
      }

      function restoreSnapshot(sandbox, selector, targetSandbox) {
        var cloneText = targetSandbox ? " into " + targetSandbox : "";
        if (!window.confirm("Restore snapshot " + selector + cloneText + "?")) return;
        commandOutputByName[sandbox.name] = { title: "Restore Snapshot", pending: true };
        renderDetail();
        authFetch("/api/sandboxes/" + encodeURIComponent(sandbox.name) + "/snapshot/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(targetSandbox ? { selector: selector, to: targetSandbox } : { selector: selector })
        })
          .then(function (result) {
            commandOutputByName[sandbox.name] = { title: "Restore Snapshot", result: result };
            load().catch(function () {});
          })
          .catch(function (err) {
            commandOutputByName[sandbox.name] = { title: "Restore Snapshot", result: { ok: false, status: null, stdout: "", stderr: err.message } };
          })
          .finally(function () { renderDetail(); });
      }

      function runChannelCheck(sandbox, channelName) {
        var key = sandbox.name + ":" + channelName;
        channelCheckLoadingByName[key] = true;
        renderDetail();
        authFetch("/api/sandboxes/" + encodeURIComponent(sandbox.name) + "/channels/" + encodeURIComponent(channelName) + "/check", { method: "POST" })
          .then(function (result) {
            channelCheckByName[key] = result;
          })
          .catch(function (err) {
            channelCheckByName[key] = {
              sandbox: sandbox.name,
              channel: channelName,
              ok: false,
              status: "fail",
              checkedAt: new Date().toISOString(),
              summary: {},
              checks: [{ label: "Check", status: "fail", detail: err.message }],
              command: { ok: false, status: null, stdout: "", stderr: err.message }
            };
          })
          .finally(function () {
            delete channelCheckLoadingByName[key];
            renderDetail();
          });
      }

      function runChannelTest(sandbox, channelName) {
        if (!window.confirm("Send a fixed NemoClaw test message via " + channelName + "?")) return;
        var key = sandbox.name + ":" + channelName;
        var tokenInput = document.querySelector('[data-channel-token="' + CSS.escape(channelName) + '"]');
        var token = tokenInput && tokenInput.value ? tokenInput.value : "";
        if (tokenInput) tokenInput.value = "";
        channelTestLoadingByName[key] = true;
        renderDetail();
        authFetch("/api/sandboxes/" + encodeURIComponent(sandbox.name) + "/channels/" + encodeURIComponent(channelName) + "/test-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(token ? { token: token } : {})
        })
          .then(function (result) {
            channelTestByName[key] = result;
          })
          .catch(function (err) {
            channelTestByName[key] = {
              sandbox: sandbox.name,
              channel: channelName,
              ok: false,
              status: "failed",
              checkedAt: new Date().toISOString(),
              target: null,
              detail: "Test message failed.",
              providerStatus: null,
              error: err.message
            };
          })
          .finally(function () {
            delete channelTestLoadingByName[key];
            renderDetail();
          });
      }

      function bindDetailActions(sandbox) {
        Array.prototype.forEach.call(document.querySelectorAll("[data-copy]"), function (button) {
          button.addEventListener("click", function () {
            navigator.clipboard.writeText(button.getAttribute("data-copy") || "");
          });
        });
        Array.prototype.forEach.call(document.querySelectorAll("[data-channel-check]"), function (button) {
          button.addEventListener("click", function () {
            runChannelCheck(sandbox, button.getAttribute("data-channel-check") || "");
          });
        });
        Array.prototype.forEach.call(document.querySelectorAll("[data-channel-test]"), function (button) {
          button.addEventListener("click", function () {
            runChannelTest(sandbox, button.getAttribute("data-channel-test") || "");
          });
        });
        Array.prototype.forEach.call(document.querySelectorAll("[data-policy-action]"), function (button) {
          button.addEventListener("click", function () {
            runPolicyAction(sandbox, button.getAttribute("data-policy-preset") || "", button.getAttribute("data-policy-action") || "");
          });
        });
        Array.prototype.forEach.call(document.querySelectorAll("[data-snapshot-restore]"), function (button) {
          button.addEventListener("click", function () {
            restoreSnapshot(sandbox, button.getAttribute("data-snapshot-restore") || "", null);
          });
        });
        Array.prototype.forEach.call(document.querySelectorAll("[data-snapshot-clone]"), function (button) {
          button.addEventListener("click", function () {
            var target = window.prompt("Clone snapshot to sandbox name");
            if (target) restoreSnapshot(sandbox, button.getAttribute("data-snapshot-clone") || "", target);
          });
        });
        var checkLive = $("check-live");
        if (checkLive) checkLive.addEventListener("click", function () { loadLiveHealth(sandbox.name); });
        var checkPolicy = $("check-policy-live");
        if (checkPolicy) checkPolicy.addEventListener("click", function () { checkPolicyLive(sandbox); });
        var repair = $("repair-forward");
        if (repair) repair.addEventListener("click", function () { repairForward(sandbox); });
        var runStatus = $("run-status");
        if (runStatus) runStatus.addEventListener("click", function () { runSandboxAction(sandbox, "status", "Status"); });
        var runDoctor = $("run-doctor");
        if (runDoctor) runDoctor.addEventListener("click", function () { runSandboxAction(sandbox, "doctor", "Doctor"); });
        Array.prototype.forEach.call(document.querySelectorAll("[data-sandbox-action]"), function (button) {
          button.addEventListener("click", function () {
            var action = button.getAttribute("data-sandbox-action") || "";
            runSandboxAction(sandbox, action, action.replace("-", " "));
          });
        });
        var rebuildPreflight = $("rebuild-preflight");
        if (rebuildPreflight) rebuildPreflight.addEventListener("click", function () { runSandboxAction(sandbox, "rebuild-preflight", "Rebuild Preflight"); });
        var snapshotList = $("run-snapshot-list");
        if (snapshotList) snapshotList.addEventListener("click", function () { runSandboxAction(sandbox, "snapshot-list", "Snapshot List"); });
        var snapshotCreate = $("create-snapshot");
        if (snapshotCreate) snapshotCreate.addEventListener("click", function () { createSnapshot(sandbox); });
        var startLogs = $("start-logs");
        if (startLogs) {
          startLogs.addEventListener("click", function () { startLogStream(sandbox.name); });
        }
        var stopLogs = $("stop-logs");
        if (stopLogs) {
          stopLogs.addEventListener("click", function () { window.stopLogs(); });
        }
        Array.prototype.forEach.call(document.querySelectorAll("[data-log-filter]"), function (button) {
          button.addEventListener("click", function () {
            var filterInput = $("log-filter");
            if (!filterInput) return;
            filterInput.value = button.getAttribute("data-log-filter") || "";
            renderLogOutput(filterInput.value);
          });
        });
        var filter = $("log-filter");
        if (filter) {
          filter.addEventListener("input", function () { renderLogOutput(filter.value); });
        }
      }

      function renderDetail() {
        var sandbox = selectedSandbox();
        var openButton = $("open-endpoint");
        if (!sandbox) {
          $("detail-title").textContent = "Details";
          openButton.disabled = true;
          $("detail").className = "detail-body empty";
          $("detail").innerHTML = "Select a sandbox.";
          return;
        }
        $("detail-title").textContent = sandbox.name;
        openButton.disabled = !sandbox.dashboardUrl;
        openButton.onclick = function () {
          if (sandbox.dashboardUrl) window.open(sandbox.dashboardUrl, "_blank", "noreferrer");
        };
        $("detail").className = "detail-body";
        if (activeTab === "health") $("detail").innerHTML = renderHealth(sandbox);
        if (activeTab === "logs") $("detail").innerHTML = renderLogs(sandbox);
        if (activeTab === "policy") $("detail").innerHTML = renderPolicy(sandbox);
        if (activeTab === "channels") $("detail").innerHTML = renderChannels(sandbox);
        if (activeTab === "snapshots") $("detail").innerHTML = renderSnapshots(sandbox);
        bindDetailActions(sandbox);
        if (
          activeTab === "health" &&
          !liveHealthByName[sandbox.name] &&
          !liveHealthLoadingByName[sandbox.name] &&
          !liveHealthAttemptedByName[sandbox.name]
        ) {
          loadLiveHealth(sandbox.name);
        }
      }

      function renderLogOutput(filter) {
        var output = $("log-output");
        if (!output) return;
        var needle = String(filter || "").toLowerCase();
        var terms = needle.split("|").map(function (term) { return term.trim(); }).filter(Boolean);
        var visible = terms.length ? logLines.filter(function (line) {
          var lower = line.toLowerCase();
          return terms.some(function (term) { return lower.indexOf(term) !== -1; });
        }) : logLines;
        output.textContent = visible.join("\n");
        output.scrollTop = output.scrollHeight;
      }

      function startLogStream(name) {
        stopLogs();
        logLines = [];
        renderLogOutput("");
        var tail = $("log-tail") ? $("log-tail").value : "200";
        eventSource = new EventSource("/api/sandboxes/" + encodeURIComponent(name) + "/logs/stream?token=" + encodeURIComponent(token) + "&tail=" + encodeURIComponent(tail));
        eventSource.addEventListener("line", function (event) {
          var item = JSON.parse(event.data);
          logLines.push("[" + item.source + "] " + item.line);
          if (logLines.length > 1000) logLines.shift();
          var filter = $("log-filter");
          renderLogOutput(filter ? filter.value : "");
        });
        eventSource.addEventListener("done", function (event) {
          var item = JSON.parse(event.data);
          logLines.push("[exit] status " + item.status);
          renderLogOutput($("log-filter") ? $("log-filter").value : "");
          stopLogs();
        });
        eventSource.onerror = function () {
          logLines.push("[error] log stream disconnected");
          renderLogOutput($("log-filter") ? $("log-filter").value : "");
          stopLogs();
        };
      }

      function stopLogs() {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
      }
      window.stopLogs = stopLogs;

      function renderTabs() {
        Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (tab) {
          tab.classList.toggle("active", tab.getAttribute("data-tab") === activeTab);
          tab.onclick = function () {
            activeTab = tab.getAttribute("data-tab") || "health";
            if (activeTab !== "logs") stopLogs();
            renderDetail();
            renderTabs();
          };
        });
      }

      function bindGlobalActions() {
        Array.prototype.forEach.call(document.querySelectorAll("[data-global-action]"), function (button) {
          button.addEventListener("click", function () {
            var action = button.getAttribute("data-global-action") || "";
            runGlobalAction(action, action.replace("-", " "));
          });
        });
      }

      function renderAll() {
        renderSummary();
        bindGlobalActions();
        renderSandboxTable();
        renderDetail();
        renderTabs();
      }

      function load() {
        return authFetch("/api/overview").then(function (data) {
          overview = data;
          if (!selectedName && overview.sandboxes.length) selectedName = overview.sandboxes[0].name;
          renderAll();
        }).catch(function (err) {
          $("sandboxes").innerHTML = '<div class="empty">' + esc(err.message) + '</div>';
        });
      }

      $("refresh").addEventListener("click", function () { load(); });
      load();
    }());
  </script>
</body>
</html>`;
