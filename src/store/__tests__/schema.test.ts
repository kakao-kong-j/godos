import { describe, it, expect } from "vitest";
import { TodoSchema, KodoDataSchema } from "../schema.js";

const validTodo = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  title: "Test todo",
  description: "",
  status: "pending",
  priority: "medium",
  tags: [],
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};

describe("TodoSchema", () => {
  it("accepts valid todo data", () => {
    const result = TodoSchema.parse(validTodo);
    expect(result.id).toBe(validTodo.id);
  });

  it("applies defaults for optional fields", () => {
    const minimal = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      title: "Minimal",
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
    };
    const result = TodoSchema.parse(minimal);
    expect(result.status).toBe("pending");
    expect(result.priority).toBe("medium");
    expect(result.description).toBe("");
    expect(result.tags).toEqual([]);
  });

  it("rejects empty title", () => {
    expect(() =>
      TodoSchema.parse({ ...validTodo, title: "" })
    ).toThrow();
  });

  it("rejects invalid UUID", () => {
    expect(() =>
      TodoSchema.parse({ ...validTodo, id: "not-a-uuid" })
    ).toThrow();
  });

  it("rejects invalid status", () => {
    expect(() =>
      TodoSchema.parse({ ...validTodo, status: "unknown" })
    ).toThrow();
  });

  it("rejects invalid priority", () => {
    expect(() =>
      TodoSchema.parse({ ...validTodo, priority: "critical" })
    ).toThrow();
  });
});

describe("KodoDataSchema", () => {
  it("accepts valid data with version 1", () => {
    const data = { version: 1, todos: [validTodo] };
    const result = KodoDataSchema.parse(data);
    expect(result.version).toBe(1);
    expect(result.todos).toHaveLength(1);
  });

  it("rejects wrong version number", () => {
    expect(() =>
      KodoDataSchema.parse({ version: 2, todos: [] })
    ).toThrow();
  });
});
