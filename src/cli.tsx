#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import meow from "meow";
import { App } from "./app.js";
import { InitWizard } from "./init/InitWizard.js";
import { isInitialized } from "./store/config.js";
import { runNonInteractive } from "./nonInteractive.js";
import { runDoctor } from "./doctor.js";

const cli = meow(
  `
  Usage
    $ godos                          Interactive TUI
    $ godos init                     Initialize a godos workspace
    $ godos add <title>              Quick add a todo
    $ godos list                     List todos (non-interactive)
    $ godos remote                   List git remotes
    $ godos remote add <name> <url>  Add a git remote
    $ godos remote remove <name>     Remove a git remote
    $ godos push [remote]            Push to remote (default: origin)
    $ godos pull [remote]            Pull from remote (default: origin)
    $ godos doctor                   Check and fix data file issues

  Options
    --priority, -P  Priority: high, medium, low (default: medium)
    --project, -p   Project name
    --tag, -t       Tag (can be repeated)
    --jira, -j      Jira issue key (e.g. PROJ-123)
    --worktree, -w  Worktree path

  Examples
    $ godos
    $ godos add "Fix login bug" -P high -p myapp -t bug -j PROJ-123
    $ godos list
    $ godos remote add origin git@github.com:user/godos-data.git
    $ godos push
    $ godos pull
`,
  {
    importMeta: import.meta,
    flags: {
      priority: { type: "string", shortFlag: "P", default: "medium" },
      project: { type: "string", shortFlag: "p" },
      tag: { type: "string", shortFlag: "t", isMultiple: true },
      jira: { type: "string", shortFlag: "j" },
      worktree: { type: "string", shortFlag: "w" },
    },
  }
);

const [command, ...args] = cli.input;

if (command === "doctor") {
  runDoctor().then((code) => process.exit(code));
} else if (command === "init") {
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
