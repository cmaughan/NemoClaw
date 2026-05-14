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

    .sandbox-table th:nth-child(1), .sandbox-table td:nth-child(1) { width: 20%; }
    .sandbox-table th:nth-child(2), .sandbox-table td:nth-child(2) { width: 19%; }
    .sandbox-table th:nth-child(3), .sandbox-table td:nth-child(3) { width: 12%; }
    .sandbox-table th:nth-child(4), .sandbox-table td:nth-child(4) { width: 25%; }
    .sandbox-table th:nth-child(5), .sandbox-table td:nth-child(5) { width: 12%; }
    .sandbox-table th:nth-child(6), .sandbox-table td:nth-child(6) { width: 12%; }

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
    }

    .tab {
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
      border-bottom-color: transparent;
      background: transparent;
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
      .sandbox-table th:nth-child(1), .sandbox-table td:nth-child(1) { width: 36%; }
      .sandbox-table th:nth-child(2), .sandbox-table td:nth-child(2) { width: 30%; }
      .sandbox-table th:nth-child(5), .sandbox-table td:nth-child(5) { width: 18%; }
      .sandbox-table th:nth-child(6), .sandbox-table td:nth-child(6) { width: 16%; }
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
        $("summary").innerHTML = parts.join("");
        $("updated").textContent = overview.generatedAt ? new Date(overview.generatedAt).toLocaleTimeString() : "";
      }

      function renderSandboxTable() {
        if (!overview || overview.sandboxes.length === 0) {
          $("sandboxes").innerHTML = '<div class="empty">No sandboxes registered.</div>';
          return;
        }
        var rows = overview.sandboxes.map(function (sandbox) {
          var warn = sandbox.warnings.length > 0 ? chip(sandbox.warnings.length + " warning" + (sandbox.warnings.length === 1 ? "" : "s"), "warn") : chip("ok", "good");
          var connected = sandbox.connected ? chip((sandbox.activeSessionCount || 1) + " connected", "good") : chip("idle", "");
          var endpoint = sandbox.dashboardUrl
            ? '<a href="' + esc(sandbox.dashboardUrl) + '" target="_blank" rel="noreferrer">' + esc(sandbox.endpointLabel) + '</a>'
            : '<span class="muted">none</span>';
          return [
            '<tr class="sandbox-row" data-name="' + esc(sandbox.name) + '" data-selected="' + String(sandbox.name === selectedName) + '">',
            '<td><div class="name-cell"><div class="name-line"><span class="truncate">' + esc(sandbox.name) + '</span>' + (sandbox.isDefault ? chip("default", "good") : "") + '</div><span class="muted">' + esc(sandbox.agent) + '</span></div></td>',
            '<td><div class="truncate">' + esc(sandbox.model || "unknown") + '</div><div class="muted truncate">' + esc(sandbox.provider || "unknown") + '</div></td>',
            '<td class="wide-only">' + connected + '</td>',
            '<td class="wide-only"><span class="wrap-text">' + esc(sandbox.policies.length ? sandbox.policies.join(", ") : "none") + '</span></td>',
            '<td>' + endpoint + '</td>',
            '<td class="state-cell">' + warn + '</td>',
            '</tr>'
          ].join("");
        }).join("");
        $("sandboxes").innerHTML = [
          '<table class="sandbox-table">',
          '<thead><tr><th>Sandbox</th><th>Inference</th><th class="wide-only">Session</th><th class="wide-only">Policy</th><th>Endpoint</th><th>State</th></tr></thead>',
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
          '<div>Model</div><div class="truncate">' + esc(sandbox.model || "unknown") + '</div>',
          '<div>Provider</div><div class="truncate">' + esc(sandbox.provider || "unknown") + '</div>',
          '<div>Gateway</div><div>' + esc(sandbox.gatewayHealth) + '</div>',
          '<div>Inference</div><div>' + esc(sandbox.inferenceHealth) + '</div>',
          '<div>Connected</div><div>' + esc(sandbox.connected ? String(sandbox.activeSessionCount || 1) : "no") + '</div>',
          '<div>Endpoint</div><div>' + (sandbox.dashboardUrl ? '<a href="' + esc(sandbox.dashboardUrl) + '" target="_blank" rel="noreferrer">' + esc(sandbox.dashboardUrl) + '</a>' : '<span class="muted">none</span>') + '</div>',
          '</div>',
          warnings,
          renderLiveHealth(sandbox),
          '<div class="actions">',
          '<button data-copy="' + esc(sandbox.commands.status) + '">Copy status command</button>',
          '<button data-copy="' + esc(sandbox.commands.doctor) + '">Copy doctor command</button>',
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
        return [
          '<div class="kv">',
          '<div>Applied</div><div><span class="wrap-text">' + esc(sandbox.policies.length ? sandbox.policies.join(", ") : "none") + '</span></div>',
          '<div>Live approvals</div><div><code class="mono">' + esc(overview.commands.openApprovals) + '</code></div>',
          '</div>',
          '<div class="actions">',
          '<button data-copy="' + esc(sandbox.commands.policyList) + '">Copy policy-list</button>',
          '<button data-copy="' + esc(overview.commands.openApprovals) + '">Copy approvals command</button>',
          '</div>'
        ].join("");
      }

      function renderChannels(sandbox) {
        var channels = sandbox.messagingChannels.length ? sandbox.messagingChannels.join(", ") : "none";
        var disabled = sandbox.disabledChannels.length ? sandbox.disabledChannels.join(", ") : "none";
        return [
          '<div class="kv">',
          '<div>Configured</div><div>' + esc(channels) + '</div>',
          '<div>Stopped</div><div>' + esc(disabled) + '</div>',
          '</div>',
          '<div class="actions">',
          '<button data-copy="' + esc(sandbox.commands.channelsList) + '">Copy channels list</button>',
          '<button data-copy="' + esc(sandbox.commands.rebuild) + '">Copy rebuild</button>',
          '</div>'
        ].join("");
      }

      function renderSnapshots(sandbox) {
        var snapshots = sandbox.snapshots || { count: 0, latest: null };
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
          : snapshots.count > 0
            ? "Run preflight, then copy the rebuild command when ready."
            : "Create a snapshot before copying the rebuild command.";
        return [
          '<div class="health-card">',
          '<div class="health-head"><strong>Rebuild Guard</strong>' + snapshotChip + '</div>',
          '<div class="health-grid">',
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
          '<input id="log-filter" placeholder="Filter logs" value="">',
          '<button id="start-logs" class="primary">Start</button>',
          '<button id="stop-logs">Stop</button>',
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
          })
          .catch(function (err) {
            commandOutputByName[sandbox.name] = { title: title, result: { ok: false, status: null, stdout: "", stderr: err.message } };
          })
          .finally(function () { renderDetail(); });
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

      function bindDetailActions(sandbox) {
        Array.prototype.forEach.call(document.querySelectorAll("[data-copy]"), function (button) {
          button.addEventListener("click", function () {
            navigator.clipboard.writeText(button.getAttribute("data-copy") || "");
          });
        });
        var checkLive = $("check-live");
        if (checkLive) checkLive.addEventListener("click", function () { loadLiveHealth(sandbox.name); });
        var repair = $("repair-forward");
        if (repair) repair.addEventListener("click", function () { repairForward(sandbox); });
        var runStatus = $("run-status");
        if (runStatus) runStatus.addEventListener("click", function () { runSandboxAction(sandbox, "status", "Status"); });
        var runDoctor = $("run-doctor");
        if (runDoctor) runDoctor.addEventListener("click", function () { runSandboxAction(sandbox, "doctor", "Doctor"); });
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
        var visible = needle ? logLines.filter(function (line) { return line.toLowerCase().indexOf(needle) !== -1; }) : logLines;
        output.textContent = visible.join("\n");
        output.scrollTop = output.scrollHeight;
      }

      function startLogStream(name) {
        stopLogs();
        logLines = [];
        renderLogOutput("");
        eventSource = new EventSource("/api/sandboxes/" + encodeURIComponent(name) + "/logs/stream?token=" + encodeURIComponent(token));
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

      function renderAll() {
        renderSummary();
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
