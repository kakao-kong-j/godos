import { TodoStore } from "./store/TodoStore.js";
import { GitService } from "./git/GitService.js";
import { godosRoot } from "./store/config.js";
import { generateId } from "./utils/id.js";
import { nowISO, formatDate } from "./utils/dates.js";
import { PRIORITY_LABELS, STATUS_ICONS } from "./utils/colors.js";
import type { Priority, Todo } from "./store/schema.js";

interface CliFlags {
  priority?: string;
  project?: string;
  tag?: string[];
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
        const tags = todo.tags.length > 0 ? ` #${todo.tags.join(" #")}` : "";
        const date = formatDate(todo.createdAt);
        console.log(`${icon} ${todo.title} (${pLabel})${project}${tags}  ${date}`);
      }
      return 0;
    }

    default:
      console.error(`Unknown command: ${command}. Run 'godos --help' for usage.`);
      return 1;
  }
}
