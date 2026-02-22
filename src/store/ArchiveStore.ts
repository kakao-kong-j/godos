import { createContext, useContext } from "react";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname } from "node:path";
import {
  ArchiveDataSchema,
  DEFAULT_ARCHIVE_DATA,
} from "./schema.js";
import type { ArchiveData, Todo } from "./schema.js";
import { nowISO } from "../utils/dates.js";

export class ArchiveStore {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  get archiveFilePath(): string {
    return this.filePath;
  }

  async load(): Promise<ArchiveData> {
    if (!existsSync(this.filePath)) {
      return { ...DEFAULT_ARCHIVE_DATA, batches: [] };
    }
    const raw = await readFile(this.filePath, "utf-8");
    return ArchiveDataSchema.parse(JSON.parse(raw));
  }

  private async save(data: ArchiveData): Promise<void> {
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    await writeFile(this.filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  }

  async append(todos: Todo[]): Promise<void> {
    if (todos.length === 0) return;
    const data = await this.load();
    data.batches.push({ archivedAt: nowISO(), todos });
    await this.save(data);
  }

  async count(): Promise<number> {
    const data = await this.load();
    return data.batches.reduce((sum, b) => sum + b.todos.length, 0);
  }
}

// --- Context ---

export const ArchiveContext = createContext<ArchiveStore | null>(null);

export function useArchiveStore() {
  return useContext(ArchiveContext);
}
