import type { Priority, TodoStatus } from "../store/schema.js";

export const PRIORITY_COLORS: Record<Priority, string> = {
  high: "red",
  medium: "yellow",
  low: "blue",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: "HIGH",
  medium: "MED",
  low: "LOW",
};

export const STATUS_COLORS: Record<TodoStatus, string> = {
  pending: "gray",
  in_progress: "cyan",
  done: "green",
};

export const STATUS_ICONS: Record<TodoStatus, string> = {
  pending: "○",
  in_progress: "◐",
  done: "●",
};
