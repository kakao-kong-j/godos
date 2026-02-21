import { z } from "zod";

export const PrioritySchema = z.enum(["high", "medium", "low"]);
export type Priority = z.infer<typeof PrioritySchema>;

export const TodoStatusSchema = z.enum(["pending", "in_progress", "done"]);
export type TodoStatus = z.infer<typeof TodoStatusSchema>;

export const TodoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).default(""),
  status: TodoStatusSchema.default("pending"),
  priority: PrioritySchema.default("medium"),
  tags: z.array(z.string()).default([]),
  project: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
});
export type Todo = z.infer<typeof TodoSchema>;

export const KodoDataSchema = z.object({
  version: z.literal(1),
  todos: z.array(TodoSchema),
});
export type KodoData = z.infer<typeof KodoDataSchema>;

export const DEFAULT_KODO_DATA: KodoData = {
  version: 1,
  todos: [],
};
