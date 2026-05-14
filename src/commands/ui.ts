// SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import Command from "../lib/commands/ui";
import { withCommandDisplay } from "../lib/cli/command-display";

export default withCommandDisplay(Command, [
  {
    usage: "nemoclaw ui",
    description: "Open the local NemoClaw control UI",
    flags: "[--port <port>] [--no-open]",
    group: "Services",
    scope: "global",
    order: 35.5,
  },
]);
