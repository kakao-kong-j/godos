import { describe, it, expect, vi } from "vitest";
import { todoReducer, getFilteredTodos } from "../useTodos.js";
import type { TodoState } from "../useTodos.js";
import type { Todo } from "../../store/schema.js";

// Mock nowISO to return a deterministic value
vi.mock("../../utils/dates.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../utils/dates.js")>();
  return {
    ...actual,
    nowISO: () => "2025-06-01T00:00:00.000Z",
  };
});

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    title: "Test",
    description: "",
    status: "pending",
    priority: "medium",
    tags: [],
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeState(overrides: Partial<TodoState> = {}): TodoState {
  return {
    todos: [],
    filter: { status: "all", priority: "all", search: "", project: "all" },
    selectedIndex: 0,
    loaded: false,
    ...overrides,
  };
}

describe("todoReducer", () => {
  it("LOAD sets todos and loaded flag", () => {
    const todos = [makeTodo()];
    const next = todoReducer(makeState(), { type: "LOAD", todos });
    expect(next.todos).toEqual(todos);
    expect(next.loaded).toBe(true);
    expect(next.selectedIndex).toBe(0);
  });

  it("ADD appends a todo", () => {
    const todo = makeTodo();
    const next = todoReducer(makeState(), { type: "ADD", todo });
    expect(next.todos).toHaveLength(1);
    expect(next.todos[0]).toBe(todo);
  });

  it("UPDATE modifies a matching todo and sets updatedAt", () => {
    const todo = makeTodo();
    const state = makeState({ todos: [todo] });
    const next = todoReducer(state, {
      type: "UPDATE",
      id: todo.id,
      updates: { title: "Updated" },
    });
    expect(next.todos[0]!.title).toBe("Updated");
    expect(next.todos[0]!.updatedAt).toBe("2025-06-01T00:00:00.000Z");
  });

  it("DELETE removes the todo and clamps selectedIndex", () => {
    const todos = [
      makeTodo({ id: "550e8400-e29b-41d4-a716-446655440001" }),
      makeTodo({ id: "550e8400-e29b-41d4-a716-446655440002" }),
    ];
    const state = makeState({ todos, selectedIndex: 1 });
    const next = todoReducer(state, { type: "DELETE", id: todos[1]!.id });
    expect(next.todos).toHaveLength(1);
    expect(next.selectedIndex).toBe(0);
  });

  it("TOGGLE_STATUS toggles pending→done with completedAt", () => {
    const todo = makeTodo({ status: "pending" });
    const state = makeState({ todos: [todo] });
    const next = todoReducer(state, { type: "TOGGLE_STATUS", id: todo.id });
    expect(next.todos[0]!.status).toBe("done");
    expect(next.todos[0]!.completedAt).toBe("2025-06-01T00:00:00.000Z");
  });

  it("TOGGLE_STATUS toggles done→pending and clears completedAt", () => {
    const todo = makeTodo({
      status: "done",
      completedAt: "2025-01-01T00:00:00.000Z",
    });
    const state = makeState({ todos: [todo] });
    const next = todoReducer(state, { type: "TOGGLE_STATUS", id: todo.id });
    expect(next.todos[0]!.status).toBe("pending");
    expect(next.todos[0]!.completedAt).toBeUndefined();
  });

  it("CYCLE_PRIORITY cycles low→medium→high→low", () => {
    const todo = makeTodo({ priority: "low" });
    let state = makeState({ todos: [todo] });

    state = todoReducer(state, { type: "CYCLE_PRIORITY", id: todo.id });
    expect(state.todos[0]!.priority).toBe("medium");

    state = todoReducer(state, { type: "CYCLE_PRIORITY", id: todo.id });
    expect(state.todos[0]!.priority).toBe("high");

    state = todoReducer(state, { type: "CYCLE_PRIORITY", id: todo.id });
    expect(state.todos[0]!.priority).toBe("low");
  });

  it("SET_FILTER merges partial filter and resets selectedIndex", () => {
    const state = makeState({ selectedIndex: 5 });
    const next = todoReducer(state, {
      type: "SET_FILTER",
      filter: { status: "done" },
    });
    expect(next.filter.status).toBe("done");
    expect(next.filter.priority).toBe("all"); // unchanged
    expect(next.selectedIndex).toBe(0);
  });

  it("RESET_FILTER restores default filter", () => {
    const state = makeState({
      filter: { status: "done", priority: "high", search: "x", project: "p" },
      selectedIndex: 3,
    });
    const next = todoReducer(state, { type: "RESET_FILTER" });
    expect(next.filter).toEqual({
      status: "all",
      priority: "all",
      search: "",
      project: "all",
    });
    expect(next.selectedIndex).toBe(0);
  });
});

describe("getFilteredTodos", () => {
  const todos: Todo[] = [
    makeTodo({
      id: "550e8400-e29b-41d4-a716-446655440001",
      title: "High task",
      priority: "high",
      status: "pending",
      tags: ["work"],
      project: "alpha",
      createdAt: "2025-01-02T00:00:00.000Z",
    }),
    makeTodo({
      id: "550e8400-e29b-41d4-a716-446655440002",
      title: "Low done",
      priority: "low",
      status: "done",
      tags: [],
      project: "beta",
      createdAt: "2025-01-03T00:00:00.000Z",
    }),
    makeTodo({
      id: "550e8400-e29b-41d4-a716-446655440003",
      title: "Medium task",
      priority: "medium",
      status: "in_progress",
      tags: ["urgent"],
      createdAt: "2025-01-01T00:00:00.000Z",
    }),
  ];

  it("returns all todos when filter is 'all'", () => {
    const state = makeState({ todos });
    const result = getFilteredTodos(state);
    expect(result).toHaveLength(3);
  });

  it("filters by status", () => {
    const state = makeState({
      todos,
      filter: { status: "done", priority: "all", search: "", project: "all" },
    });
    const result = getFilteredTodos(state);
    expect(result.every((t) => t.status === "done")).toBe(true);
  });

  it("filters by priority", () => {
    const state = makeState({
      todos,
      filter: { status: "all", priority: "high", search: "", project: "all" },
    });
    const result = getFilteredTodos(state);
    expect(result.every((t) => t.priority === "high")).toBe(true);
  });

  it("filters by project", () => {
    const state = makeState({
      todos,
      filter: { status: "all", priority: "all", search: "", project: "alpha" },
    });
    const result = getFilteredTodos(state);
    expect(result).toHaveLength(1);
    expect(result[0]!.project).toBe("alpha");
  });

  it("filters by search across title, description, and tags", () => {
    const state = makeState({
      todos,
      filter: { status: "all", priority: "all", search: "urgent", project: "all" },
    });
    const result = getFilteredTodos(state);
    expect(result).toHaveLength(1);
    expect(result[0]!.tags).toContain("urgent");
  });

  it("sorts done items to the bottom, then by priority, then by createdAt desc", () => {
    const state = makeState({ todos });
    const result = getFilteredTodos(state);
    // Non-done first: high (createdAt Jan 2) then medium (Jan 1), then done: low
    expect(result.map((t) => t.priority)).toEqual(["high", "medium", "low"]);
    expect(result[2]!.status).toBe("done");
  });
});
