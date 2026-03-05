import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { TodoStore } from "../store/TodoStore.js";
import { GitService } from "../git/GitService.js";
import { godosRoot } from "../store/config.js";
import { generateId } from "../utils/id.js";
import { nowISO } from "../utils/dates.js";
import { getHtml } from "./template.js";
import type { Todo, Priority, TodoStatus } from "../store/schema.js";

const PRIORITY_CYCLE: Priority[] = ["low", "medium", "high"];
const STATUS_TOGGLE: Record<TodoStatus, TodoStatus> = {
  pending: "done",
  in_progress: "done",
  done: "pending",
};

export async function startWebServer(port: number): Promise<void> {
  const store = await TodoStore.create();
  const gitService = new GitService(godosRoot(), store.dataFilePath, [store.completedFilePath], 0);

  const app = new Hono();

  // --- HTML ---
  app.get("/", (c) => c.html(getHtml()));

  // --- API: Todos ---

  app.get("/api/todos", async (c) => {
    const data = await store.load();
    return c.json(data.todos);
  });

  app.post("/api/todos", async (c) => {
    const body = await c.req.json<{
      title: string;
      description?: string;
      priority?: Priority;
      tags?: string[];
      project?: string;
      jira?: string;
      worktree?: string;
    }>();

    if (!body.title?.trim()) {
      return c.json({ error: "Title is required" }, 400);
    }

    const now = nowISO();
    const todo: Todo = {
      id: generateId(),
      title: body.title.trim(),
      description: body.description?.trim() ?? "",
      status: "pending",
      priority: body.priority ?? "medium",
      tags: body.tags ?? [],
      project: body.project?.trim() || undefined,
      jira: body.jira?.trim() || undefined,
      worktree: body.worktree?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    const data = await store.load();
    data.todos.push(todo);
    await store.save(data);
    await gitService.commitNow(`add "${todo.title}"`);
    return c.json(todo, 201);
  });

  app.patch("/api/todos/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json<Partial<Omit<Todo, "id" | "createdAt">>>();
    const data = await store.load();
    const idx = data.todos.findIndex((t) => t.id === id);
    if (idx === -1) return c.json({ error: "Todo not found" }, 404);

    const todo = data.todos[idx]!;
    const updated = { ...todo, ...body, updatedAt: nowISO() };
    data.todos[idx] = updated;
    await store.save(data);
    await gitService.commitNow(`edit "${updated.title}"`);
    return c.json(updated);
  });

  app.delete("/api/todos/:id", async (c) => {
    const id = c.req.param("id");
    const data = await store.load();
    const todo = data.todos.find((t) => t.id === id);
    if (!todo) return c.json({ error: "Todo not found" }, 404);

    data.todos = data.todos.filter((t) => t.id !== id);
    await store.save(data);
    await gitService.commitNow(`delete "${todo.title}"`);
    return c.json({ ok: true });
  });

  app.post("/api/todos/:id/toggle", async (c) => {
    const id = c.req.param("id");
    const data = await store.load();
    const idx = data.todos.findIndex((t) => t.id === id);
    if (idx === -1) return c.json({ error: "Todo not found" }, 404);

    const todo = data.todos[idx]!;
    const newStatus = STATUS_TOGGLE[todo.status];
    const updated: Todo = {
      ...todo,
      status: newStatus,
      updatedAt: nowISO(),
      completedAt: newStatus === "done" ? nowISO() : undefined,
    };
    data.todos[idx] = updated;
    await store.save(data);
    const action = newStatus === "done" ? "complete" : "reopen";
    await gitService.commitNow(`${action} "${todo.title}"`);
    return c.json(updated);
  });

  app.post("/api/todos/:id/priority", async (c) => {
    const id = c.req.param("id");
    const data = await store.load();
    const idx = data.todos.findIndex((t) => t.id === id);
    if (idx === -1) return c.json({ error: "Todo not found" }, 404);

    const todo = data.todos[idx]!;
    const curIdx = PRIORITY_CYCLE.indexOf(todo.priority);
    const next = PRIORITY_CYCLE[(curIdx + 1) % PRIORITY_CYCLE.length]!;
    const updated = { ...todo, priority: next, updatedAt: nowISO() };
    data.todos[idx] = updated;
    await store.save(data);
    await gitService.commitNow(`change priority of "${todo.title}"`);
    return c.json(updated);
  });

  app.post("/api/todos/clear-completed", async (c) => {
    const data = await store.load();
    const doneTodos = data.todos.filter((t) => t.status === "done");
    if (doneTodos.length === 0) {
      return c.json({ cleared: 0 });
    }
    data.todos = data.todos.filter((t) => t.status !== "done");
    await store.save(data);
    await store.saveCompleted(doneTodos);
    await gitService.commitNow(`clear ${doneTodos.length} completed todo(s)`);
    return c.json({ cleared: doneTodos.length });
  });

  // --- API: Completed ---

  app.get("/api/completed", async (c) => {
    const completed = await store.getCompleted();
    return c.json(completed);
  });

  // --- API: Stats ---

  app.get("/api/stats", async (c) => {
    const data = await store.load();
    const completed = await store.getCompleted();
    const counts = { pending: 0, in_progress: 0, done: 0 };
    for (const t of data.todos) counts[t.status]++;
    const total = data.todos.length;
    const completedCount = completed.length;
    const totalAll = total + completedCount;
    const totalDone = counts.done + completedCount;
    const rate = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;
    return c.json({ total, ...counts, completedCount, rate });
  });

  // --- Start ---

  serve({ fetch: app.fetch, port }, () => {
    console.log(`Godos web server running at http://localhost:${port}`);
    console.log("Press Ctrl+C to stop.");
  });
}
