// SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from "@oclif/core";

import { runUiServerUntilClosed } from "../ui/server";

export default class UiCommand extends Command {
  static id = "ui";
  static strict = true;
  static summary = "Open the local NemoClaw control UI";
  static description =
    "Start a loopback-only local dashboard for sandbox health, logs, and safe recovery actions.";
  static usage = ["ui [--port <port>] [--no-open]"];
  static examples = ["<%= config.bin %> ui", "<%= config.bin %> ui --port 19010 --no-open"];
  static flags = {
    help: Flags.help({ char: "h" }),
    port: Flags.integer({
      description: "Local UI port to bind; defaults to a random free port",
      max: 65535,
      min: 1024,
    }),
    "no-open": Flags.boolean({
      description: "Print the URL without opening a browser",
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(UiCommand);
    await runUiServerUntilClosed({
      port: flags.port,
      openBrowser: flags["no-open"] !== true,
    });
  }
}
