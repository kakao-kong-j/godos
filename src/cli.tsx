#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import meow from "meow";
import { App } from "./app.js";
import { InitWizard } from "./init/InitWizard.js";
import { isInitialized } from "./store/config.js";
import { runNonInteractive } from "./nonInteractive.js";

const cli = meow(
  `
  Usage
    $ godos                  Interactive TUI
    $ godos init             Initialize a godos workspace
    $ godos add <title>      Quick add a todo
    $ godos list             List todos (non-interactive)

  Options
    --priority, -P  Priority: high, medium, low (default: medium)
    --project, -p   Project name
    --tag, -t       Tag (can be repeated)

  Examples
    $ godos
    $ godos add "Fix login bug" -P high -p myapp -t bug
    $ godos list
`,
  {
    importMeta: import.meta,
    flags: {
      priority: { type: "string", shortFlag: "P", default: "medium" },
      project: { type: "string", shortFlag: "p" },
      tag: { type: "string", shortFlag: "t", isMultiple: true },
    },
  }
);

const [command, ...args] = cli.input;

if (command === "init") {
  const { waitUntilExit } = render(<InitWizard />);
  waitUntilExit().catch(() => process.exit(1));
} else if (!isInitialized()) {
  console.error("godos is not initialized. Run 'godos init' first.");
  process.exit(1);
} else if (command) {
  runNonInteractive(command, args, cli.flags).then((code) => {
    process.exit(code);
  });
} else {
  const { waitUntilExit } = render(<App />);
  waitUntilExit().catch(() => process.exit(1));
}
