import { describe, it, expect } from "vitest";
import { formatDate, formatDueDate } from "../dates.js";

describe("formatDate", () => {
  it("formats an ISO string to yyyy-MM-dd", () => {
    expect(formatDate("2025-03-15T10:30:00.000Z")).toBe("2025-03-15");
  });
});

describe("formatDueDate", () => {
  it('returns "Today" for today\'s date', () => {
    const today = new Date();
    today.setHours(23, 59, 0, 0);
    expect(formatDueDate(today.toISOString())).toBe("Today");
  });

  it('returns "Tomorrow" for tomorrow\'s date', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    expect(formatDueDate(tomorrow.toISOString())).toBe("Tomorrow");
  });

  it('returns "Overdue (yyyy-MM-dd)" for past dates', () => {
    const past = "2020-01-01T00:00:00.000Z";
    const result = formatDueDate(past);
    expect(result).toMatch(/^Overdue \(\d{4}-\d{2}-\d{2}\)$/);
  });

  it("returns yyyy-MM-dd for future dates beyond tomorrow", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const result = formatDueDate(future.toISOString());
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
