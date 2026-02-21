import { describe, it, expect } from "vitest";
import {
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_COLORS,
  STATUS_ICONS,
} from "../colors.js";

describe("color/label maps", () => {
  const priorities = ["high", "medium", "low"] as const;
  const statuses = ["pending", "in_progress", "done"] as const;

  it("PRIORITY_COLORS has a value for every priority", () => {
    for (const p of priorities) {
      expect(PRIORITY_COLORS[p]).toBeTruthy();
    }
  });

  it("PRIORITY_LABELS has a value for every priority", () => {
    for (const p of priorities) {
      expect(PRIORITY_LABELS[p]).toBeTruthy();
    }
  });

  it("STATUS_COLORS has a value for every status", () => {
    for (const s of statuses) {
      expect(STATUS_COLORS[s]).toBeTruthy();
    }
  });

  it("STATUS_ICONS has a value for every status", () => {
    for (const s of statuses) {
      expect(STATUS_ICONS[s]).toBeTruthy();
    }
  });
});
