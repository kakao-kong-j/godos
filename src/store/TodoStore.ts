import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { GodosDataSchema, DEFAULT_GODOS_DATA } from "./schema.js";
import { godosRoot, loadConfig, resolveDataPath } from "./config.js";
import type { GodosData, Todo } from "./schema.js";

export class TodoStore {
  private filePath: string;

  constructor(dataFilePath: string) {
    this.filePath = dataFilePath;
  }

  static async create(): Promise<TodoStore> {
    const config = await loadConfig();
    if (config) {
      return new TodoStore(resolveDataPath(config));
    }
    return new TodoStore(join(godosRoot(), "todos/default/todos.json"));
  }

  get dataFilePath(): string {
    return this.filePath;
  }

  async load(): Promise<GodosData> {
    if (!existsSync(this.filePath)) {
      await this.save(DEFAULT_GODOS_DATA);
      return { ...DEFAULT_GODOS_DATA };
    }

    const raw = await readFile(this.filePath, "utf-8");
    const json = JSON.parse(raw);
    return GodosDataSchema.parse(json);
  }

  async save(data: GodosData): Promise<void> {
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    await writeFile(this.filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  }

  async getTodos(): Promise<Todo[]> {
    const data = await this.load();
    return data.todos;
  }

  async saveTodos(todos: Todo[]): Promise<void> {
    const data = await this.load();
    data.todos = todos;
    await this.save(data);
  }

  get completedFilePath(): string {
    return join(dirname(this.filePath), "completed.json");
  }

  async saveCompleted(todos: Todo[]): Promise<void> {
    if (todos.length === 0) return;
    const filePath = this.completedFilePath;
    let existing: Todo[] = [];
    if (existsSync(filePath)) {
      const raw = await readFile(filePath, "utf-8");
      existing = JSON.parse(raw);
    }
    const merged = [...existing, ...todos];
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    await writeFile(filePath, JSON.stringify(merged, null, 2) + "\n", "utf-8");
  }

  async getCompleted(): Promise<Todo[]> {
    const filePath = this.completedFilePath;
    if (!existsSync(filePath)) return [];
    const raw = await readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    // Migrate from old archive format { version, batches: [{ todos }] }
    if (parsed?.batches && Array.isArray(parsed.batches)) {
      const todos = parsed.batches.flatMap((b: { todos?: Todo[] }) => b.todos ?? []);
      await writeFile(filePath, JSON.stringify(todos, null, 2) + "\n", "utf-8");
      return todos;
    }
    return [];
  }
}
