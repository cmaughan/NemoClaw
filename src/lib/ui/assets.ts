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
      min-height: 100vh;
      background: var(--bg);
      color: var(--text);
      overflow: hidden;
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
    button.inline-action {
      min-height: 24px;
      padding: 2px 7px;
      font-size: 12px;
    }
    button.subtle-action {
      background: transparent;
      color: var(--muted);
    }
    button:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }

    .app-shell {
      --console-height: 180px;
      display: flex;
      flex-direction: column;
      height: calc(100vh - 64px);
      min-height: 0;
    }

    main {
      --sandbox-pane-width: minmax(420px, 1fr);
      --detail-pane-width: minmax(360px, 520px);
      flex: 1 1 auto;
      display: grid;
      grid-template-columns: var(--sandbox-pane-width) 10px var(--detail-pane-width);
      gap: 8px;
      min-height: 0;
      padding: 16px;
    }

    section {
      min-width: 0;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: var(--shadow);
    }

    .column-splitter {
      min-height: 0;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: var(--panel-soft);
      cursor: col-resize;
      position: relative;
      touch-action: none;
    }

    .column-splitter::before {
      content: "";
      position: absolute;
      top: 14px;
      bottom: 14px;
      left: 50%;
      border-left: 1px solid #aeb8ac;
      transform: translateX(-50%);
    }

    .column-splitter:hover,
    .column-splitter.dragging,
    .column-splitter:focus-visible {
      border-color: var(--accent);
      background: #eaf3e5;
      outline: none;
    }

    body.resizing-columns {
      cursor: col-resize;
      user-select: none;
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

    .sandbox-list {
      display: grid;
      gap: 0;
    }

    .sandbox-row {
      display: grid;
      width: 100%;
      padding: 10px 12px;
      border: 0;
      border-bottom: 1px solid var(--line);
      border-radius: 0;
      background: transparent;
      cursor: pointer;
      text-align: left;
    }

    .sandbox-row[data-selected="true"] { background: #eef6e8; }
    .sandbox-row:hover { background: #f5f9f2; }

    .sandbox-name {
      display: flex;
      align-items: center;
      min-width: 0;
      padding: 0 0 6px;
      font-size: 14px;
      font-weight: 700;
    }

    .sandbox-kv {
      display: grid;
      grid-template-columns: 76px minmax(0, 1fr);
      gap: 0 10px;
      min-width: 0;
      font-size: 13px;
    }

    .sandbox-label {
      padding: 4px 0;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      line-height: 1.35;
    }

    .sandbox-value {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px 6px;
      min-width: 0;
      padding: 4px 0;
      line-height: 1.35;
    }

    .sandbox-value-stack {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .sandbox-value .truncate {
      max-width: 100%;
    }

    .readonly-check {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--text);
    }

    .readonly-check.can-change {
      cursor: pointer;
    }

    .readonly-check input {
      width: 14px;
      min-width: 14px;
      height: 14px;
      min-height: 0;
      margin: 0;
      padding: 0;
    }

    .readonly-check input:not(:disabled) {
      cursor: pointer;
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

    .muted { color: var(--muted); }
    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      font-size: 12px;
    }

    .detail {
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .detail-body {
      flex: 1 1 auto;
      min-height: 0;
      padding: 14px 16px;
      overflow: auto;
    }

    .tabs {
      flex: 0 0 44px;
      display: flex;
      gap: 4px;
      align-items: flex-end;
      min-height: 44px;
      height: 44px;
      padding: 8px 8px 0;
      border-bottom: 1px solid var(--line);
      background: #fbfcfb;
      overflow-x: auto;
      overflow-y: hidden;
    }

    .tab {
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      min-height: 36px;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
      border-bottom-color: transparent;
      background: transparent;
      white-space: nowrap;
    }

    .tab.active {
      background: #eef7e8;
      border-color: #a7d08c;
      border-bottom-color: #eef7e8;
      color: var(--accent-strong);
      font-weight: 700;
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

    .inline-row {
      display: inline-flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }

    .tab-stack {
      display: flex;
      flex-direction: column;
      min-height: 100%;
    }

    .health-stack .console-card {
      margin-top: auto;
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

    .console-card {
      display: flex;
      flex-direction: column;
      min-height: 0;
      margin-top: 14px;
      border: 1px solid var(--line);
      border-radius: 6px;
      overflow: hidden;
      background: #fbfcfb;
    }

    .console-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      min-height: 38px;
      padding: 8px 12px;
      border-bottom: 1px solid var(--line);
      background: #fbfcfb;
    }

    .console-head h2 {
      margin: 0;
      font-size: 14px;
    }

    .console-output {
      flex: 1 1 auto;
      min-height: 96px;
      overflow: auto;
      margin: 0;
      padding: 12px;
      background: var(--code);
      color: #e5e7eb;
      white-space: pre-wrap;
      word-break: break-word;
    }

    pre.log {
      flex: 1 1 auto;
      min-height: 0;
      overflow: auto;
      margin: 10px 0 0;
      padding: 12px;
      border-radius: 6px;
      background: var(--code);
      color: #e5e7eb;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .logs-detail {
      display: flex;
      flex-direction: column;
    }

    .log-tools {
      flex: 0 0 auto;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }

    .log-tools input {
      flex: 1 1 180px;
    }

    .log-stream-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .log-stream-actions button {
      min-width: 72px;
    }

    .log-stream-actions button.danger {
      color: #fff;
      border-color: #8f1f17;
      background: var(--bad);
    }

    .log-stream-actions button.danger:hover:not(:disabled) {
      border-color: #7c1b14;
      background: #9f2017;
    }

    .log-stream-actions button.danger:disabled {
      color: var(--bad);
      border-color: #e5bab6;
      background: var(--panel);
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

    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      min-height: 110px;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #cdd6ca;
      border-top-color: var(--accent);
      border-radius: 999px;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (prefers-reduced-motion: reduce) {
      .spinner { animation: none; }
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
      body { overflow: auto; }
      .app-shell { height: auto; min-height: calc(100vh - 64px); }
      main { grid-template-columns: 1fr; }
      .column-splitter { display: none; }
      .detail { height: auto; min-height: auto; }
      pre.log { min-height: min(70vh, 520px); }
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

  <div id="app-shell" class="app-shell">
    <main id="layout">
      <section id="sandbox-pane">
        <div class="section-head">
          <h2>Sandboxes</h2>
          <span id="updated" class="muted mono"></span>
        </div>
        <div id="sandboxes">
          <div class="empty loading-state"><span class="spinner" aria-hidden="true"></span><span>Loading sandboxes...</span></div>
        </div>
      </section>

      <div
        id="column-splitter"
        class="column-splitter"
        role="separator"
        aria-label="Resize sandbox and detail panes"
        aria-orientation="vertical"
        aria-valuemin="320"
        aria-valuemax="320"
        aria-valuenow="420"
        tabindex="0"
      ></div>

      <section class="detail">
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

  </div>

  <script>
    (function () {
      "use strict";

      var token = new URLSearchParams(window.location.search).get("token") || "";
      var overview = null;
      var overviewLoading = false;
      var selectedName = null;
      var activeTab = "health";
      var selectionSerial = 0;
      var eventSource = null;
      var logLines = [];
      var liveHealthByName = {};
      var liveHealthLoadingByName = {};
      var liveHealthAttemptedByName = {};
      var channelCheckByName = {};
      var channelCheckLoadingByName = {};
      var channelTestByName = {};
      var channelTestLoadingByName = {};
      var selectedChannelBySandbox = {};
      var consoleEntry = null;
      var defaultChangingByName = {};
      var SPLIT_STORAGE_KEY = "nemoclaw.ui.sandboxPaneWidth";
      var MIN_SANDBOX_PANE_WIDTH = 320;
      var MIN_DETAIL_PANE_WIDTH = 320;

      function $(id) { return document.getElementById(id); }

      function esc(value) {
        return String(value == null ? "" : value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      function storedPaneWidth() {
        try {
          var value = window.localStorage.getItem(SPLIT_STORAGE_KEY);
          var width = value ? Number(value) : NaN;
          return isFinite(width) && width > 0 ? width : null;
        } catch (_error) {
          return null;
        }
      }

      function savePaneWidth(width) {
        try {
          window.localStorage.setItem(SPLIT_STORAGE_KEY, String(Math.round(width)));
        } catch (_error) {
          /* ignore storage failures */
        }
      }

      function layoutMetrics() {
        var layout = $("layout");
        var splitter = $("column-splitter");
        if (!layout || !splitter) return null;
        var style = window.getComputedStyle(layout);
        var paddingLeft = parseFloat(style.paddingLeft) || 0;
        var paddingRight = parseFloat(style.paddingRight) || 0;
        var gap = parseFloat(style.columnGap || style.gap) || 0;
        var available = layout.clientWidth - paddingLeft - paddingRight;
        var splitterWidth = splitter.offsetWidth || 10;
        var maxLeft = available - splitterWidth - gap * 2 - MIN_DETAIL_PANE_WIDTH;
        if (maxLeft < MIN_SANDBOX_PANE_WIDTH) return null;
        return {
          layout: layout,
          splitter: splitter,
          paddingLeft: paddingLeft,
          minLeft: MIN_SANDBOX_PANE_WIDTH,
          maxLeft: maxLeft
        };
      }

      function clampPaneWidth(width) {
        var metrics = layoutMetrics();
        if (!metrics) return null;
        return Math.max(metrics.minLeft, Math.min(metrics.maxLeft, width));
      }

      function setPaneWidth(width, persist) {
        var metrics = layoutMetrics();
        var clamped = clampPaneWidth(width);
        if (!metrics || clamped == null) return;
        metrics.layout.style.setProperty("--sandbox-pane-width", Math.round(clamped) + "px");
        metrics.layout.style.setProperty("--detail-pane-width", "minmax(" + MIN_DETAIL_PANE_WIDTH + "px, 1fr)");
        metrics.splitter.setAttribute("aria-valuemin", String(Math.round(metrics.minLeft)));
        metrics.splitter.setAttribute("aria-valuemax", String(Math.round(metrics.maxLeft)));
        metrics.splitter.setAttribute("aria-valuenow", String(Math.round(clamped)));
        if (persist) savePaneWidth(clamped);
      }

      function restorePaneWidth() {
        var width = storedPaneWidth();
        if (width != null) setPaneWidth(width, false);
      }

      function bindColumnSplitter() {
        var splitter = $("column-splitter");
        var pane = $("sandbox-pane");
        if (!splitter || !pane) return;
        var dragging = false;

        function widthFromClientX(clientX) {
          var metrics = layoutMetrics();
          if (!metrics) return null;
          var rect = metrics.layout.getBoundingClientRect();
          return clientX - rect.left - metrics.paddingLeft;
        }

        function currentPaneWidth() {
          return pane.getBoundingClientRect().width;
        }

        function stopDrag(event) {
          if (!dragging) return;
          dragging = false;
          splitter.classList.remove("dragging");
          document.body.classList.remove("resizing-columns");
          if (event && typeof event.clientX === "number") {
            var width = widthFromClientX(event.clientX);
            if (width != null) setPaneWidth(width, true);
          }
          if (event && splitter.releasePointerCapture) {
            try { splitter.releasePointerCapture(event.pointerId); } catch (_error) { /* ignore */ }
          }
        }

        splitter.addEventListener("pointerdown", function (event) {
          if (event.button !== 0) return;
          var width = widthFromClientX(event.clientX);
          if (width == null) return;
          dragging = true;
          splitter.classList.add("dragging");
          document.body.classList.add("resizing-columns");
          if (splitter.setPointerCapture) splitter.setPointerCapture(event.pointerId);
          setPaneWidth(width, false);
          event.preventDefault();
        });
        splitter.addEventListener("pointermove", function (event) {
          if (!dragging) return;
          var width = widthFromClientX(event.clientX);
          if (width != null) setPaneWidth(width, false);
        });
        splitter.addEventListener("pointerup", stopDrag);
        splitter.addEventListener("pointercancel", stopDrag);
        splitter.addEventListener("keydown", function (event) {
          var direction = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
          if (!direction) return;
          var step = event.shiftKey ? 64 : 24;
          setPaneWidth(currentPaneWidth() + direction * step, true);
          event.preventDefault();
        });
        window.addEventListener("resize", restorePaneWidth);
        restorePaneWidth();
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

      function currentSelectionContext(sandbox) {
        return { sandboxName: sandbox.name, serial: selectionSerial };
      }

      function isCurrentSelection(name, serial) {
        return selectedName === name && selectionSerial === serial;
      }

      function commandOutputText(entry) {
        if (!entry) return "No command output yet.";
        if (entry.pending) return entry.title + "\nrunning...";
        var result = entry.result || {};
        var status = result.ok ? "ok" : "exit " + (result.status == null ? "unknown" : result.status);
        var body = [];
        if (Array.isArray(result.commands) && result.commands.length) {
          body.push("commands:\n" + result.commands.map(function (command) { return "$ " + command; }).join("\n"));
        }
        if (result.stdout) body.push(result.stdout);
        if (result.stderr) body.push(result.stderr);
        return entry.title + " (" + status + ")\n\n" + (body.join("\n\n") || "(no output)");
      }

      function renderConsole() {
        var output = $("console-output");
        if (!output) return;
        output.textContent = commandOutputText(consoleEntry);
        output.scrollTop = output.scrollHeight;
      }

      function renderConsoleCard() {
        return [
          '<div class="console-card">',
          '<div class="console-head">',
          '<h2>Console</h2>',
          '<button id="clear-console">Clear</button>',
          '</div>',
          '<pre id="console-output" class="console-output">' + esc(commandOutputText(consoleEntry)) + '</pre>',
          '</div>'
        ].join("");
      }

      function setConsolePending(title) {
        consoleEntry = { title: title, pending: true };
        renderConsole();
      }

      function setConsoleResult(title, result) {
        consoleEntry = { title: title, result: result };
        renderConsole();
      }

      function setConsoleError(title, err) {
        setConsoleResult(title, { ok: false, status: null, stdout: "", stderr: err.message || String(err) });
      }

      function setConsoleResultIfCurrent(context, title, result) {
        if (!isCurrentSelection(context.sandboxName, context.serial)) return;
        setConsoleResult(title, result);
      }

      function setConsoleErrorIfCurrent(context, title, err) {
        if (!isCurrentSelection(context.sandboxName, context.serial)) return;
        setConsoleError(title, err);
      }

      function renderDetailIfCurrent(context) {
        if (isCurrentSelection(context.sandboxName, context.serial)) renderDetail();
      }

      function resetSandboxTabState(name) {
        consoleEntry = null;
        delete liveHealthByName[name];
        delete liveHealthAttemptedByName[name];
        stopLogs(true);
      }

      function selectSandboxName(name) {
        if (!name || name === selectedName) return;
        selectedName = name;
        selectionSerial += 1;
        resetSandboxTabState(name);
        renderAll();
        load().catch(function () {});
      }

      function renderSummary() {
        if (!overview) return;
        $("updated").textContent = overviewLoading
          ? "Refreshing..."
          : overview.generatedAt ? new Date(overview.generatedAt).toLocaleTimeString() : "";
      }

      function renderLoadingState(message) {
        return '<div class="empty loading-state"><span class="spinner" aria-hidden="true"></span><span>' + esc(message) + '</span></div>';
      }

      function updateRefreshState() {
        var button = $("refresh");
        if (!button) return;
        button.disabled = overviewLoading;
        button.textContent = overviewLoading ? "Refreshing..." : "Refresh";
      }

      function renderSandboxTable() {
        if (overviewLoading && (!overview || overview.sandboxes.length === 0)) {
          $("sandboxes").innerHTML = renderLoadingState("Loading sandboxes...");
          return;
        }
        if (!overview || overview.sandboxes.length === 0) {
          $("sandboxes").innerHTML = '<div class="empty">No sandboxes registered.</div>';
          return;
        }
        function sandboxField(label, value) {
          return '<div class="sandbox-label">' + esc(label) + '</div><div class="sandbox-value">' + value + '</div>';
        }
        var rows = overview.sandboxes.map(function (sandbox) {
          var state = sandbox.warnings.length > 0 ? sandbox.warnings.length + " warning" + (sandbox.warnings.length === 1 ? "" : "s") : "ok";
          var connected = sandbox.connected ? (sandbox.activeSessionCount || 1) + " connected" : "idle";
          var policyCount = sandbox.policy && sandbox.policy.registryApplied ? sandbox.policy.registryApplied.length : sandbox.policies.length;
          var policyLabel = policyCount ? policyCount + " polic" + (policyCount === 1 ? "y" : "ies") : "none";
          var policyTitle = policyCount ? sandbox.policies.join(", ") : "none";
          var endpoint = sandbox.dashboardUrl
            ? sandbox.isDefault
              ? '<a class="truncate" href="' + esc(sandbox.dashboardUrl) + '" data-endpoint-open="' + esc(sandbox.name) + '" target="_blank" rel="noreferrer">' + esc(sandbox.dashboardUrl) + '</a>'
              : '<span class="truncate muted" title="Make this sandbox default to open its endpoint">' + esc(sandbox.dashboardUrl) + '</span>'
            : '<span class="muted">none</span>';
          var phase = sandbox.phase || "registered";
          var currentVersion = versionLabel(sandbox.version && sandbox.version.current);
          var targetVersion = versionLabel(sandbox.version && sandbox.version.target);
          var upgradeDisabled = !sandbox.version || sandbox.version.state !== "stale" ? " disabled" : "";
          var targetValue = '<span class="truncate">' + esc(targetVersion) + '</span><button class="inline-action" data-sandbox-action="upgrade"' + upgradeDisabled + '>Upgrade</button>';
          var defaultChanging = !!defaultChangingByName[sandbox.name];
          var defaultDisabled = sandbox.isDefault || defaultChanging ? " disabled" : "";
          var defaultChecked = sandbox.isDefault || defaultChanging ? " checked" : "";
          var defaultClass = sandbox.isDefault ? "readonly-check" : "readonly-check can-change";
          var defaultTitle = sandbox.isDefault ? "Current default sandbox" : "Make this sandbox the default";
          var defaultText = sandbox.isDefault ? "yes" : defaultChanging ? "setting" : "no";
          var defaultValue = '<label class="' + defaultClass + '" title="' + esc(defaultTitle) + '"><input type="checkbox" data-default-toggle="' + esc(sandbox.name) + '"' + defaultChecked + defaultDisabled + '><span>' + esc(defaultText) + '</span></label>';
          return [
            '<div class="sandbox-row" role="button" tabindex="0" data-name="' + esc(sandbox.name) + '" data-selected="' + String(sandbox.name === selectedName) + '">',
            '<div class="sandbox-name"><span class="truncate">' + esc(sandbox.name) + '</span></div>',
            '<div class="sandbox-kv">',
            sandboxField("Agent", '<span class="truncate">' + esc(sandbox.agent || "unknown") + '</span>'),
            sandboxField("Is Default", defaultValue),
            sandboxField("Gateway", esc(sandbox.gatewayHealth)),
            sandboxField("Phase", esc(phase)),
            sandboxField("Session", esc(connected)),
            sandboxField("Policy", '<span class="truncate" title="' + esc(policyTitle) + '">' + esc(policyLabel) + '</span>'),
            sandboxField("Endpoint", endpoint),
            sandboxField("Inference", '<span class="truncate">' + esc(sandbox.model || "unknown") + '</span>'),
            sandboxField("Provider", '<span class="truncate">' + esc(sandbox.provider || "unknown") + '</span>'),
            sandboxField("Current", esc(currentVersion)),
            sandboxField("Target", targetValue),
            sandboxField("State", esc(state)),
            '</div>',
            '</div>'
          ].join("");
        }).join("");
        $("sandboxes").innerHTML = [
          '<div class="sandbox-list">',
          rows,
          '</div>'
        ].join("");
        function selectRow(row) {
          selectSandboxName(row.getAttribute("data-name") || "");
        }
        Array.prototype.forEach.call(document.querySelectorAll(".sandbox-row"), function (row) {
          row.addEventListener("click", function (event) {
            if (event.target && event.target.closest && event.target.closest("a, button, input, label")) return;
            selectRow(row);
          });
          row.addEventListener("keydown", function (event) {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            selectRow(row);
          });
        });
        bindSandboxTableActions();
      }

      function bindSandboxTableActions() {
        var target = $("sandboxes");
        if (!target) return;
        Array.prototype.forEach.call(target.querySelectorAll("[data-endpoint-open]"), function (link) {
          link.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
            var name = link.getAttribute("data-endpoint-open") || "";
            var sandbox = overview && overview.sandboxes.find(function (entry) { return entry.name === name; });
            if (!sandbox || !sandbox.dashboardUrl) return;
            if (name !== selectedName) selectSandboxName(name);
            openEndpoint(sandbox);
          });
        });
        Array.prototype.forEach.call(target.querySelectorAll("[data-default-toggle]"), function (checkbox) {
          checkbox.addEventListener("click", function (event) {
            event.stopPropagation();
          });
          checkbox.addEventListener("change", function (event) {
            event.preventDefault();
            event.stopPropagation();
            var name = checkbox.getAttribute("data-default-toggle") || "";
            var sandbox = overview && overview.sandboxes.find(function (entry) { return entry.name === name; });
            if (!sandbox) return;
            if (sandbox.isDefault) {
              checkbox.checked = true;
              return;
            }
            if (name !== selectedName) selectSandboxName(name);
            if (!window.confirm("Make '" + name + "' the default sandbox?")) {
              checkbox.checked = false;
              return;
            }
            setDefaultSandbox(sandbox);
          });
        });
        Array.prototype.forEach.call(target.querySelectorAll("[data-sandbox-action]"), function (button) {
          button.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
            var row = button.closest(".sandbox-row");
            var name = row ? row.getAttribute("data-name") : selectedName;
            var sandbox = overview && overview.sandboxes.find(function (entry) { return entry.name === name; });
            if (!sandbox) return;
            if (name && name !== selectedName) selectSandboxName(name);
            var action = button.getAttribute("data-sandbox-action") || "";
            runSandboxAction(sandbox, action, actionLabel(action));
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

      function channelCheckText(check) {
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
        return lines.join("\n");
      }

      function channelTestText(test) {
        if (!test) return "";
        var lines = [
          "Test message for " + test.channel + " (" + test.status + ")",
          "checked: " + new Date(test.checkedAt).toLocaleTimeString(),
          "target: " + (test.target || "none"),
          "detail: " + test.detail
        ];
        if (test.error) lines.push("error: " + test.error);
        return lines.join("\n");
      }

      function checkCommandResult(check) {
        var command = check && check.command ? check.command : null;
        return {
          ok: !!(check && check.ok),
          status: command && command.status != null ? command.status : check && check.ok ? 0 : 1,
          commands: command && Array.isArray(command.commands) ? command.commands : [],
          stdout: channelCheckText(check),
          stderr: command && command.stderr ? command.stderr : ""
        };
      }

      function testCommandResult(test) {
        return {
          ok: !!(test && test.ok),
          status: test && test.ok ? 0 : 1,
          stdout: channelTestText(test),
          stderr: test && test.error ? test.error : ""
        };
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
          '<div>Checked</div><div><span class="inline-row"><span>' + esc(checked) + '</span><button id="check-live" class="inline-action subtle-action">Check</button></span></div>',
          '<div>Next</div><div><span class="wrap-text">' + esc(nextText) + '</span></div>',
          '</div>',
          '<div class="actions health-actions">',
          '<button class="primary" id="repair-forward"' + repairDisabled + '>Repair Forward</button>',
          '<button id="run-status">Run status</button>',
          '<button id="run-doctor">Run doctor</button>',
          '<button data-sandbox-action="share-status">Share status</button>',
          '</div>',
          '</div>'
        ].join("");
      }

      function renderHealth(sandbox) {
        var warnings = sandbox.warnings.length
          ? '<div class="warnings">' + sandbox.warnings.map(function (w) { return '<div class="warning">' + esc(w) + '</div>'; }).join("") + '</div>'
          : "";
        return [
          '<div class="tab-stack health-stack">',
          warnings,
          renderLiveHealth(sandbox),
          renderConsoleCard(),
          '</div>'
        ].join("");
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
              '<button data-policy-action="add" data-policy-preset="' + esc(preset.name) + '"' + (preset.appliedRegistry ? " disabled" : "") + '>Add</button>',
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
          '<div class="item-list">' + rows + '</div>'
        ].join("");
      }

      function renderChannelCard(sandbox, channel) {
        var key = channelKey(sandbox, channel);
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
          '</div>',
          '</div>'
        ].join("");
      }

      function renderChannels(sandbox) {
        var channels = sandbox.channelStatuses || [];
        if (channels.length === 0) {
          return [
            '<div class="empty">No channel metadata available.</div>',
            renderConsoleCard()
          ].join("");
        }
        var selectedChannel = selectedChannelBySandbox[sandbox.name];
        if (!channels.some(function (channel) { return channel.name === selectedChannel; })) {
          selectedChannel = channels[0].name;
          selectedChannelBySandbox[sandbox.name] = selectedChannel;
        }
        var channel = channels.find(function (entry) { return entry.name === selectedChannel; }) || channels[0];
        var options = channels.map(function (entry) {
          return '<option value="' + esc(entry.name) + '"' + (entry.name === channel.name ? " selected" : "") + '>' + esc(entry.name) + '</option>';
        }).join("");
        return [
          '<div class="tool-row">',
          '<select id="channel-select" aria-label="Channel">' + options + '</select>',
          '</div>',
          renderChannelCard(sandbox, channel),
          renderConsoleCard()
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
              ? "Use Upgrade from the sandbox table when ready; it will run preflight first."
              : "Create a snapshot before using Upgrade."
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
          '<button class="primary" id="create-snapshot">Create Snapshot</button>',
          '</div>',
          '</div>',
          '<div class="item-list">' + list + '</div>'
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
          '<div class="log-stream-actions">',
          '<button id="start-logs" class="primary">Start</button>',
          '<button id="stop-logs" class="danger" disabled>Stop</button>',
          '</div>',
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
        var serial = selectionSerial;
        liveHealthAttemptedByName[name] = true;
        liveHealthLoadingByName[name] = true;
        renderDetail();
        authFetch("/api/sandboxes/" + encodeURIComponent(name) + "/live")
          .then(function (data) {
            if (isCurrentSelection(name, serial)) liveHealthByName[name] = data;
          })
          .catch(function (err) {
            if (isCurrentSelection(name, serial)) setConsoleError("Live Health", err);
          })
          .finally(function () {
            delete liveHealthLoadingByName[name];
            if (selectedName === name) renderDetail();
          });
      }

      function actionLabel(action) {
        return action.split("-").map(function (part) {
          return part ? part.charAt(0).toUpperCase() + part.slice(1) : part;
        }).join(" ");
      }

      function runSandboxAction(sandbox, action, title) {
        if (action === "upgrade" && !window.confirm("Run upgrade for " + sandbox.name + "? This will run preflight checks and rebuild if they pass.")) return;
        var context = currentSelectionContext(sandbox);
        setConsolePending(title);
        authFetch("/api/sandboxes/" + encodeURIComponent(sandbox.name) + "/actions/" + action, { method: "POST" })
          .then(function (result) {
            setConsoleResultIfCurrent(context, title, result);
            if (action === "doctor" || action === "rebuild-preflight" || action === "upgrade") load().catch(function () {});
          })
          .catch(function (err) {
            setConsoleErrorIfCurrent(context, title, err);
          })
          .finally(function () { renderDetailIfCurrent(context); });
      }

      function openEndpoint(sandbox) {
        if (!sandbox.isDefault) {
          setConsoleResult("Open Endpoint", {
            ok: false,
            status: 1,
            commands: [],
            stdout: "",
            stderr: "Only the default sandbox endpoint can be opened from here. Make '" + sandbox.name + "' default first."
          });
          return;
        }
        var opened = window.open("about:blank", "_blank");
        if (opened) opened.opener = null;
        var context = currentSelectionContext(sandbox);
        setConsolePending("Open Endpoint");
        authFetch("/api/sandboxes/" + encodeURIComponent(sandbox.name) + "/endpoint")
          .then(function (data) {
            var nextUrl = data && data.url ? data.url : sandbox.dashboardUrl;
            if (data && data.result) setConsoleResultIfCurrent(context, "Open Endpoint", data.result);
            if (opened) {
              opened.location.href = nextUrl;
            } else {
              window.location.href = nextUrl;
            }
          })
          .catch(function (err) {
            setConsoleErrorIfCurrent(context, "Open Endpoint", err);
            if (opened) opened.close();
          });
      }

      function setDefaultSandbox(sandbox) {
        var context = currentSelectionContext(sandbox);
        defaultChangingByName[sandbox.name] = true;
        setConsolePending("Set Default Sandbox");
        renderSandboxTable();
        authFetch("/api/sandboxes/" + encodeURIComponent(sandbox.name) + "/default", { method: "POST" })
          .then(function (result) {
            setConsoleResultIfCurrent(context, "Set Default Sandbox", result);
            return load();
          })
          .catch(function (err) {
            setConsoleErrorIfCurrent(context, "Set Default Sandbox", err);
          })
          .finally(function () {
            delete defaultChangingByName[sandbox.name];
            renderDetailIfCurrent(context);
            renderSandboxTable();
          });
      }

      function repairForward(sandbox) {
        var context = currentSelectionContext(sandbox);
        setConsolePending("Repair Forward");
        authFetch("/api/sandboxes/" + encodeURIComponent(sandbox.name) + "/forward/repair", { method: "POST" })
          .then(function (data) {
            if (isCurrentSelection(context.sandboxName, context.serial)) {
              liveHealthByName[sandbox.name] = data;
              setConsoleResult("Repair Forward", data.result);
              renderDetail();
            }
            load().catch(function () {});
          })
          .catch(function (err) {
            setConsoleErrorIfCurrent(context, "Repair Forward", err);
            renderDetailIfCurrent(context);
          });
      }

      function createSnapshot(sandbox) {
        var context = currentSelectionContext(sandbox);
        setConsolePending("Create Snapshot");
        authFetch("/api/sandboxes/" + encodeURIComponent(sandbox.name) + "/actions/snapshot-create", { method: "POST" })
          .then(function (result) {
            setConsoleResultIfCurrent(context, "Create Snapshot", result);
            renderDetailIfCurrent(context);
            load().catch(function () {});
          })
          .catch(function (err) {
            setConsoleErrorIfCurrent(context, "Create Snapshot", err);
            renderDetailIfCurrent(context);
          });
      }

      function runPolicyAction(sandbox, preset, action) {
        var title = "Policy " + action.replace("-", " ") + " " + preset;
        if (action === "add" && !window.confirm("Add policy preset '" + preset + "' to sandbox '" + sandbox.name + "'?")) return;
        if (action === "remove" && !window.confirm("Remove policy preset '" + preset + "' from sandbox '" + sandbox.name + "'?")) return;
        var context = currentSelectionContext(sandbox);
        setConsolePending(title);
        authFetch(
          "/api/sandboxes/" + encodeURIComponent(sandbox.name) + "/policies/" + encodeURIComponent(preset) + "/" + encodeURIComponent(action),
          { method: "POST" }
        )
          .then(function (result) {
            setConsoleResultIfCurrent(context, title, result);
            load().catch(function () {});
          })
          .catch(function (err) {
            setConsoleErrorIfCurrent(context, title, err);
          })
          .finally(function () { renderDetailIfCurrent(context); });
      }

      function restoreSnapshot(sandbox, selector, targetSandbox) {
        var cloneText = targetSandbox ? " into " + targetSandbox : "";
        if (!window.confirm("Restore snapshot " + selector + cloneText + "?")) return;
        var context = currentSelectionContext(sandbox);
        setConsolePending("Restore Snapshot");
        authFetch("/api/sandboxes/" + encodeURIComponent(sandbox.name) + "/snapshot/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(targetSandbox ? { selector: selector, to: targetSandbox } : { selector: selector })
        })
          .then(function (result) {
            setConsoleResultIfCurrent(context, "Restore Snapshot", result);
            load().catch(function () {});
          })
          .catch(function (err) {
            setConsoleErrorIfCurrent(context, "Restore Snapshot", err);
          })
          .finally(function () { renderDetailIfCurrent(context); });
      }

      function runChannelCheck(sandbox, channelName) {
        var key = sandbox.name + ":" + channelName;
        var context = currentSelectionContext(sandbox);
        channelCheckLoadingByName[key] = true;
        setConsolePending("Channel Check: " + channelName);
        renderDetail();
        authFetch("/api/sandboxes/" + encodeURIComponent(sandbox.name) + "/channels/" + encodeURIComponent(channelName) + "/check", { method: "POST" })
          .then(function (result) {
            channelCheckByName[key] = result;
            setConsoleResultIfCurrent(context, "Channel Check: " + channelName, checkCommandResult(result));
          })
          .catch(function (err) {
            var result = {
              sandbox: sandbox.name,
              channel: channelName,
              ok: false,
              status: "fail",
              checkedAt: new Date().toISOString(),
              summary: {},
              checks: [{ label: "Check", status: "fail", detail: err.message }],
              command: { ok: false, status: null, stdout: "", stderr: err.message }
            };
            channelCheckByName[key] = result;
            setConsoleResultIfCurrent(context, "Channel Check: " + channelName, checkCommandResult(result));
          })
          .finally(function () {
            delete channelCheckLoadingByName[key];
            renderDetailIfCurrent(context);
          });
      }

      function runChannelTest(sandbox, channelName) {
        if (!window.confirm("Send a fixed NemoClaw test message via " + channelName + "?")) return;
        var key = sandbox.name + ":" + channelName;
        var context = currentSelectionContext(sandbox);
        var tokenInput = document.querySelector('[data-channel-token="' + CSS.escape(channelName) + '"]');
        var token = tokenInput && tokenInput.value ? tokenInput.value : "";
        if (tokenInput) tokenInput.value = "";
        channelTestLoadingByName[key] = true;
        setConsolePending("Test Message: " + channelName);
        renderDetail();
        authFetch("/api/sandboxes/" + encodeURIComponent(sandbox.name) + "/channels/" + encodeURIComponent(channelName) + "/test-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(token ? { token: token } : {})
        })
          .then(function (result) {
            channelTestByName[key] = result;
            setConsoleResultIfCurrent(context, "Test Message: " + channelName, testCommandResult(result));
          })
          .catch(function (err) {
            var result = {
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
            channelTestByName[key] = result;
            setConsoleResultIfCurrent(context, "Test Message: " + channelName, testCommandResult(result));
          })
          .finally(function () {
            delete channelTestLoadingByName[key];
            renderDetailIfCurrent(context);
          });
      }

      function bindDetailActions(sandbox) {
        var root = $("detail");
        if (!root) return;
        var clearConsole = $("clear-console");
        if (clearConsole) {
          clearConsole.addEventListener("click", function () {
            consoleEntry = null;
            renderConsole();
          });
        }
        Array.prototype.forEach.call(root.querySelectorAll("[data-channel-check]"), function (button) {
          button.addEventListener("click", function () {
            runChannelCheck(sandbox, button.getAttribute("data-channel-check") || "");
          });
        });
        Array.prototype.forEach.call(root.querySelectorAll("[data-channel-test]"), function (button) {
          button.addEventListener("click", function () {
            runChannelTest(sandbox, button.getAttribute("data-channel-test") || "");
          });
        });
        Array.prototype.forEach.call(root.querySelectorAll("[data-policy-action]"), function (button) {
          button.addEventListener("click", function () {
            runPolicyAction(sandbox, button.getAttribute("data-policy-preset") || "", button.getAttribute("data-policy-action") || "");
          });
        });
        Array.prototype.forEach.call(root.querySelectorAll("[data-snapshot-restore]"), function (button) {
          button.addEventListener("click", function () {
            restoreSnapshot(sandbox, button.getAttribute("data-snapshot-restore") || "", null);
          });
        });
        Array.prototype.forEach.call(root.querySelectorAll("[data-snapshot-clone]"), function (button) {
          button.addEventListener("click", function () {
            var target = window.prompt("Clone snapshot to sandbox name");
            if (target) restoreSnapshot(sandbox, button.getAttribute("data-snapshot-clone") || "", target);
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
        var channelSelect = $("channel-select");
        if (channelSelect) {
          channelSelect.addEventListener("change", function () {
            selectedChannelBySandbox[sandbox.name] = channelSelect.value;
            renderDetail();
          });
        }
        Array.prototype.forEach.call(root.querySelectorAll("[data-sandbox-action]"), function (button) {
          button.addEventListener("click", function () {
            var action = button.getAttribute("data-sandbox-action") || "";
            runSandboxAction(sandbox, action, actionLabel(action));
          });
        });
        var snapshotCreate = $("create-snapshot");
        if (snapshotCreate) snapshotCreate.addEventListener("click", function () { createSnapshot(sandbox); });
        var startLogs = $("start-logs");
        if (startLogs) {
          startLogs.addEventListener("click", function () { startLogStream(sandbox.name); });
        }
        var stopLogs = $("stop-logs");
        if (stopLogs) {
          stopLogs.addEventListener("click", function () { window.stopLogs(true); });
        }
        Array.prototype.forEach.call(root.querySelectorAll("[data-log-filter]"), function (button) {
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
        updateLogControls();
      }

      function renderDetail() {
        var sandbox = selectedSandbox();
        if (!sandbox) {
          $("detail").className = "detail-body empty";
          $("detail").innerHTML = "Select a sandbox.";
          return;
        }
        $("detail").className = activeTab === "logs" ? "detail-body logs-detail" : "detail-body";
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

      function updateLogControls() {
        var startButton = $("start-logs");
        var stopButton = $("stop-logs");
        var streamActive = !!eventSource;
        if (startButton) startButton.disabled = streamActive;
        if (stopButton) stopButton.disabled = !streamActive;
      }

      function startLogStream(name) {
        stopLogs();
        logLines = [];
        renderLogOutput("");
        var tail = $("log-tail") ? $("log-tail").value : "200";
        eventSource = new EventSource("/api/sandboxes/" + encodeURIComponent(name) + "/logs/stream?token=" + encodeURIComponent(token) + "&tail=" + encodeURIComponent(tail));
        updateLogControls();
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

      function stopLogs(clearOutput) {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        if (clearOutput) {
          logLines = [];
          renderLogOutput("");
        }
        updateLogControls();
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
        var loaded = false;
        overviewLoading = true;
        updateRefreshState();
        if (!overview) {
          $("sandboxes").innerHTML = renderLoadingState("Loading sandboxes...");
          $("detail").className = "detail-body empty";
          $("detail").innerHTML = renderLoadingState("Loading sandbox details...");
        } else {
          renderSummary();
        }
        return authFetch("/api/overview").then(function (data) {
          overview = data;
          loaded = true;
          if (!selectedName && overview.sandboxes.length) selectedName = overview.sandboxes[0].name;
        }).catch(function (err) {
          $("sandboxes").innerHTML = '<div class="empty">' + esc(err.message) + '</div>';
        }).finally(function () {
          overviewLoading = false;
          updateRefreshState();
          if (loaded) renderAll();
          else renderSummary();
        });
      }

      $("refresh").addEventListener("click", function () { load(); });
      bindColumnSplitter();
      load();
    }());
  </script>
</body>
</html>`;
