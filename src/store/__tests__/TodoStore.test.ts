import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { existsSync } from "node:fs";
import { TodoStore } from "../TodoStore.js";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "godos-test-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("TodoStore", () => {
  it("creates default data file on first load", async () => {
    const store = new TodoStore(join(tempDir, "todos.json"));
    const data = await store.load();
    expect(data.version).toBe(1);
    expect(data.todos).toEqual([]);
    expect(existsSync(store.dataFilePath)).toBe(true);
  });

  it("round-trips save and load", async () => {
    const store = new TodoStore(join(tempDir, "todos.json"));
    const todo = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      title: "Persisted",
      description: "",
      status: "pending" as const,
      priority: "medium" as const,
      tags: [],
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
    };

    await store.saveTodos([todo]);
    const loaded = await store.getTodos();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]!.title).toBe("Persisted");
  });

  it("returns empty array for getTodos on fresh store", async () => {
    const store = new TodoStore(join(tempDir, "todos.json"));
    const todos = await store.getTodos();
    expect(todos).toEqual([]);
  });
});
