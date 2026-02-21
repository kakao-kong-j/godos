import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { KodoDataSchema, DEFAULT_KODO_DATA } from "./schema.js";
import { KODO_DIR, loadConfig, resolveDataPath } from "./config.js";
import type { KodoData, Todo } from "./schema.js";

const LEGACY_DATA_FILE = "todos.json";

export class TodoStore {
  private filePath: string;

  constructor(rootDir: string = process.cwd(), dataFilePath?: string) {
    this.filePath = dataFilePath ?? join(rootDir, KODO_DIR, LEGACY_DATA_FILE);
  }

  static async create(rootDir: string = process.cwd()): Promise<TodoStore> {
    const config = await loadConfig(rootDir);
    if (config) {
      return new TodoStore(rootDir, resolveDataPath(config, rootDir));
    }
    return new TodoStore(rootDir);
  }

  get dataFilePath(): string {
    return this.filePath;
  }

  async load(): Promise<KodoData> {
    if (!existsSync(this.filePath)) {
      await this.save(DEFAULT_KODO_DATA);
      return { ...DEFAULT_KODO_DATA };
    }

    const raw = await readFile(this.filePath, "utf-8");
    const json = JSON.parse(raw);
    return KodoDataSchema.parse(json);
  }

  async save(data: KodoData): Promise<void> {
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
}
