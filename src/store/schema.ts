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
  jira: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
});
export type Todo = z.infer<typeof TodoSchema>;

export const GodosDataSchema = z.object({
  version: z.literal(1),
  todos: z.array(TodoSchema),
});
export type GodosData = z.infer<typeof GodosDataSchema>;

export const DEFAULT_GODOS_DATA: GodosData = {
  version: 1,
  todos: [],
};

// --- Archive ---

export const ArchiveBatchSchema = z.object({
  archivedAt: z.string().datetime(),
  todos: z.array(TodoSchema),
});
export type ArchiveBatch = z.infer<typeof ArchiveBatchSchema>;

export const ArchiveDataSchema = z.object({
  version: z.literal(1),
  batches: z.array(ArchiveBatchSchema),
});
export type ArchiveData = z.infer<typeof ArchiveDataSchema>;

export const DEFAULT_ARCHIVE_DATA: ArchiveData = {
  version: 1,
  batches: [],
};
