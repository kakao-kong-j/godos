import { TodoStore } from "./store/TodoStore.js";
import { GitService, gitErrorHint } from "./git/GitService.js";
import { godosRoot } from "./store/config.js";
import { generateId } from "./utils/id.js";
import { nowISO, formatDate } from "./utils/dates.js";
import { PRIORITY_LABELS, STATUS_ICONS } from "./utils/colors.js";
import type { Priority, Todo } from "./store/schema.js";

interface CliFlags {
  priority?: string;
  project?: string;
  tag?: string[];
  jira?: string;
  worktree?: string;
}

export async function runNonInteractive(
  command: string,
  args: string[],
  flags: CliFlags
): Promise<number> {
  const store = await TodoStore.create();

  switch (command) {
    case "add": {
      const title = args.join(" ").trim();
      if (!title) {
        console.error("Error: title is required. Usage: godos add <title>");
        return 1;
      }

      const now = nowISO();
      const priority = (flags.priority ?? "medium") as Priority;
      const todo: Todo = {
        id: generateId(),
        title,
        description: "",
        status: "pending",
        priority,
        tags: flags.tag ?? [],
        project: flags.project,
        jira: flags.jira,
        worktree: flags.worktree,
        createdAt: now,
        updatedAt: now,
      };

      const data = await store.load();
      data.todos.push(todo);
      await store.save(data);

      // Git commit
      const gitService = new GitService(godosRoot(), store.dataFilePath, [], 0);
      await gitService.commitNow(`add "${title}"`);

      console.log(`Added: ${title} [${PRIORITY_LABELS[priority]}]`);
      return 0;
    }

    case "list": {
      const data = await store.load();
      if (data.todos.length === 0) {
        console.log("No todos yet. Use 'godos add <title>' or run 'godos' for interactive mode.");
        return 0;
      }

      for (const todo of data.todos) {
        const icon = STATUS_ICONS[todo.status];
        const pLabel = PRIORITY_LABELS[todo.priority];
        const project = todo.project ? ` [${todo.project}]` : "";
        const jira = todo.jira ? ` ${todo.jira}` : "";
        const wt = todo.worktree ? ` 📂${todo.worktree}` : "";
        const tags = todo.tags.length > 0 ? ` #${todo.tags.join(" #")}` : "";
        const date = formatDate(todo.createdAt);
        console.log(`${icon} ${todo.title} (${pLabel})${project}${jira}${wt}${tags}  ${date}`);
      }
      return 0;
    }

    case "remote": {
      const gitService = new GitService(godosRoot(), store.dataFilePath, [], 0);
      const [subCmd, ...subArgs] = args;

      if (!subCmd || subCmd === "list") {
        const remotes = await gitService.getRemotes();
        if (remotes.length === 0) {
          console.log("No remotes configured. Use 'godos remote add <name> <url>' to add one.");
        } else {
          for (const r of remotes) {
            console.log(`${r.name}\t${r.url}`);
          }
        }
        return 0;
      }

      if (subCmd === "add") {
        const [name, url] = subArgs;
        if (!name || !url) {
          console.error("Usage: godos remote add <name> <url>");
          return 1;
        }
        try {
          await gitService.addRemote(name, url);
          console.log(`Remote '${name}' added: ${url}`);
          return 0;
        } catch (err) {
          console.error(`Error: ${gitErrorHint(err)}`);
          return 1;
        }
      }

      if (subCmd === "remove") {
        const [name] = subArgs;
        if (!name) {
          console.error("Usage: godos remote remove <name>");
          return 1;
        }
        try {
          await gitService.removeRemote(name);
          console.log(`Remote '${name}' removed.`);
          return 0;
        } catch (err) {
          console.error(`Error: ${gitErrorHint(err)}`);
          return 1;
        }
      }

      console.error(`Unknown remote command: ${subCmd}. Use 'add', 'remove', or 'list'.`);
      return 1;
    }

    case "push": {
      const remote = args[0] || "origin";
      const gitService = new GitService(godosRoot(), store.dataFilePath, [], 0);
      try {
        const message = await gitService.push(remote);
        console.log(message);
        return 0;
      } catch (err) {
        console.error(`Push failed: ${gitErrorHint(err)}`);
        return 1;
      }
    }

    case "pull": {
      const remote = args[0] || "origin";
      const gitService = new GitService(godosRoot(), store.dataFilePath, [], 0);
      try {
        const message = await gitService.pull(remote);
        console.log(message);
        return 0;
      } catch (err) {
        console.error(`Pull failed: ${gitErrorHint(err)}`);
        return 1;
      }
    }

    default:
      console.error(`Unknown command: ${command}. Run 'godos --help' for usage.`);
      return 1;
  }
}
