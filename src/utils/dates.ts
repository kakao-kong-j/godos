import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from "date-fns";

export function nowISO(): string {
  return new Date().toISOString();
}

export function formatDate(iso: string): string {
  return format(new Date(iso), "yyyy-MM-dd");
}

export function formatRelative(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

export function formatDueDate(iso: string): string {
  const date = new Date(iso);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  if (isPast(date)) return `Overdue (${formatDate(iso)})`;
  return formatDate(iso);
}
