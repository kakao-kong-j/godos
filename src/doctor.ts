import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createInterface } from "node:readline";
import { randomUUID } from "node:crypto";
import { godosRoot, GodosConfigSchema, loadConfig, resolveDataPath } from "./store/config.js";
import { join, dirname } from "node:path";

interface Issue {
  file: string;
  path: string;
  message: string;
  fix: string;
}

const VALID_STATUSES = ["pending", "in_progress", "done"];
const VALID_PRIORITIES = ["high", "medium", "low"];

function isValidISO(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const d = new Date(value);
  return !isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2}T/.test(value);
}

function isValidUUID(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function nowISO(): string {
  return new Date().toISOString();
}

function fixTodo(todo: Record<string, unknown>, index: number, issues: Issue[], fileName: string): Record<string, unknown> {
  const fixed = { ...todo };
  const prefix = `todos[${index}]`;

  // id
  if (!isValidUUID(fixed.id)) {
    const oldVal = JSON.stringify(fixed.id);
    fixed.id = randomUUID();
    issues.push({ file: fileName, path: `${prefix}.id`, message: `Invalid UUID: ${oldVal}`, fix: `Generate new UUID` });
  }

  // title
  if (typeof fixed.title !== "string" || fixed.title.length === 0) {
    const oldVal = JSON.stringify(fixed.title);
    fixed.title = "Untitled";
    issues.push({ file: fileName, path: `${prefix}.title`, message: `Invalid title: ${oldVal}`, fix: `Set to "Untitled"` });
  } else if ((fixed.title as string).length > 200) {
    issues.push({ file: fileName, path: `${prefix}.title`, message: `Title too long (${(fixed.title as string).length} chars)`, fix: `Truncate to 200 chars` });
    fixed.title = (fixed.title as string).slice(0, 200);
  }

  // description
  if (typeof fixed.description !== "string") {
    issues.push({ file: fileName, path: `${prefix}.description`, message: `Invalid type: ${typeof fixed.description}`, fix: `Set to ""` });
    fixed.description = "";
  } else if ((fixed.description as string).length > 1000) {
    issues.push({ file: fileName, path: `${prefix}.description`, message: `Description too long (${(fixed.description as string).length} chars)`, fix: `Truncate to 1000 chars` });
    fixed.description = (fixed.description as string).slice(0, 1000);
  }

  // status
  if (!VALID_STATUSES.includes(fixed.status as string)) {
    const oldVal = JSON.stringify(fixed.status);
    fixed.status = "pending";
    issues.push({ file: fileName, path: `${prefix}.status`, message: `Invalid status: ${oldVal}`, fix: `Set to "pending"` });
  }

  // priority
  if (!VALID_PRIORITIES.includes(fixed.priority as string)) {
    const oldVal = JSON.stringify(fixed.priority);
    fixed.priority = "medium";
    issues.push({ file: fileName, path: `${prefix}.priority`, message: `Invalid priority: ${oldVal}`, fix: `Set to "medium"` });
  }

  // tags
  if (!Array.isArray(fixed.tags)) {
    if (typeof fixed.tags === "string") {
      issues.push({ file: fileName, path: `${prefix}.tags`, message: `Tags is a string instead of array`, fix: `Wrap in array` });
      fixed.tags = [fixed.tags];
    } else {
      issues.push({ file: fileName, path: `${prefix}.tags`, message: `Invalid tags: ${JSON.stringify(fixed.tags)}`, fix: `Set to []` });
      fixed.tags = [];
    }
  }

  // createdAt
  if (!isValidISO(fixed.createdAt)) {
    const oldVal = JSON.stringify(fixed.createdAt);
    fixed.createdAt = nowISO();
    issues.push({ file: fileName, path: `${prefix}.createdAt`, message: `Invalid datetime: ${oldVal}`, fix: `Set to current time` });
  }

  // updatedAt
  if (!isValidISO(fixed.updatedAt)) {
    const oldVal = JSON.stringify(fixed.updatedAt);
    fixed.updatedAt = nowISO();
    issues.push({ file: fileName, path: `${prefix}.updatedAt`, message: `Invalid datetime: ${oldVal}`, fix: `Set to current time` });
  }

  // completedAt (optional, but must be valid if present)
  if (fixed.completedAt !== undefined && fixed.completedAt !== null && !isValidISO(fixed.completedAt)) {
    const oldVal = JSON.stringify(fixed.completedAt);
    fixed.completedAt = fixed.status === "done" ? nowISO() : undefined;
    issues.push({ file: fileName, path: `${prefix}.completedAt`, message: `Invalid datetime: ${oldVal}`, fix: fixed.status === "done" ? `Set to current time` : `Remove` });
  }

  // dueDate (optional, but must be valid if present)
  if (fixed.dueDate !== undefined && fixed.dueDate !== null && !isValidISO(fixed.dueDate)) {
    const oldVal = JSON.stringify(fixed.dueDate);
    delete fixed.dueDate;
    issues.push({ file: fileName, path: `${prefix}.dueDate`, message: `Invalid datetime: ${oldVal}`, fix: `Remove` });
  }

  return fixed;
}

async function readJSON(filePath: string): Promise<{ data: unknown; error?: string }> {
  if (!existsSync(filePath)) {
    return { data: null, error: "File not found" };
  }
  try {
    const raw = await readFile(filePath, "utf-8");
    return { data: JSON.parse(raw) };
  } catch {
    return { data: null, error: "Invalid JSON" };
  }
}

async function confirm(message: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

export async function runDoctor(): Promise<number> {
  const issues: Issue[] = [];
  const fixes: Array<{ filePath: string; content: string }> = [];

  console.log("Checking godos data files...\n");

  // --- 1. config.json ---
  const configPath = join(godosRoot(), "config.json");
  const configResult = await readJSON(configPath);

  if (configResult.error === "File not found") {
    console.log(`  config.json: not found (skipped)`);
  } else if (configResult.error) {
    issues.push({ file: "config.json", path: "(root)", message: configResult.error, fix: "Reset to default config" });
    const defaultConfig = { version: 1, dataPath: "todos/default/todos.json" };
    fixes.push({ filePath: configPath, content: JSON.stringify(defaultConfig, null, 2) + "\n" });
  } else {
    const result = GodosConfigSchema.safeParse(configResult.data);
    if (result.success) {
      console.log(`  config.json: OK`);
    } else {
      for (const err of result.error.issues) {
        issues.push({ file: "config.json", path: err.path.join("."), message: err.message, fix: "Reset to default config" });
      }
      const defaultConfig = { version: 1, dataPath: "todos/default/todos.json" };
      fixes.push({ filePath: configPath, content: JSON.stringify(defaultConfig, null, 2) + "\n" });
    }
  }

  // --- Resolve data path ---
  const config = await loadConfig();
  const todosPath = config ? resolveDataPath(config) : join(godosRoot(), "todos/default/todos.json");
  const completedPath = join(dirname(todosPath), "completed.json");

  // --- 2. todos.json ---
  const todosResult = await readJSON(todosPath);

  if (todosResult.error === "File not found") {
    console.log(`  todos.json: not found (will be created on first use)`);
  } else if (todosResult.error) {
    issues.push({ file: "todos.json", path: "(root)", message: todosResult.error, fix: "Reset to empty todos" });
    fixes.push({ filePath: todosPath, content: JSON.stringify({ version: 1, todos: [] }, null, 2) + "\n" });
  } else {
    const data = todosResult.data as Record<string, unknown>;

    // Check wrapper
    if (typeof data !== "object" || data === null || !("version" in data) || !("todos" in data)) {
      issues.push({ file: "todos.json", path: "(root)", message: "Missing version or todos field", fix: "Wrap in proper structure" });
      const todosArray = Array.isArray(data) ? data : [];
      const fixedTodos = todosArray.map((t, i) => fixTodo(t as Record<string, unknown>, i, issues, "todos.json"));
      fixes.push({ filePath: todosPath, content: JSON.stringify({ version: 1, todos: fixedTodos }, null, 2) + "\n" });
    } else {
      if (data.version !== 1) {
        issues.push({ file: "todos.json", path: "version", message: `Invalid version: ${JSON.stringify(data.version)}`, fix: "Set to 1" });
      }

      if (!Array.isArray(data.todos)) {
        issues.push({ file: "todos.json", path: "todos", message: `Not an array: ${typeof data.todos}`, fix: "Reset to empty array" });
        fixes.push({ filePath: todosPath, content: JSON.stringify({ version: 1, todos: [] }, null, 2) + "\n" });
      } else {
        const fixedTodos = (data.todos as Record<string, unknown>[]).map((t, i) =>
          fixTodo(t, i, issues, "todos.json")
        );
        const beforeCount = issues.length;
        if (issues.length > beforeCount || issues.some((iss) => iss.file === "todos.json")) {
          fixes.push({ filePath: todosPath, content: JSON.stringify({ version: 1, todos: fixedTodos }, null, 2) + "\n" });
        } else {
          // Always push fixed version in case version field needs fixing
          fixes.push({ filePath: todosPath, content: JSON.stringify({ version: 1, todos: fixedTodos }, null, 2) + "\n" });
        }
      }
    }

    if (!issues.some((iss) => iss.file === "todos.json")) {
      console.log(`  todos.json: OK (${(data as { todos?: unknown[] }).todos?.length ?? 0} todos)`);
    }
  }

  // --- 3. completed.json ---
  const completedResult = await readJSON(completedPath);

  if (completedResult.error === "File not found") {
    console.log(`  completed.json: not found (no completed todos yet)`);
  } else if (completedResult.error) {
    issues.push({ file: "completed.json", path: "(root)", message: completedResult.error, fix: "Reset to empty array" });
    fixes.push({ filePath: completedPath, content: "[]\n" });
  } else {
    let todos: Record<string, unknown>[];

    // Handle legacy archive format
    const parsed = completedResult.data;
    if (Array.isArray(parsed)) {
      todos = parsed;
    } else if (
      typeof parsed === "object" &&
      parsed !== null &&
      "batches" in parsed &&
      Array.isArray((parsed as Record<string, unknown>).batches)
    ) {
      issues.push({ file: "completed.json", path: "(root)", message: "Legacy archive format detected", fix: "Migrate to flat array" });
      todos = ((parsed as Record<string, unknown>).batches as Array<{ todos?: unknown[] }>).flatMap(
        (b) => (b.todos ?? []) as Record<string, unknown>[]
      );
    } else {
      issues.push({ file: "completed.json", path: "(root)", message: `Invalid format: ${typeof parsed}`, fix: "Reset to empty array" });
      todos = [];
    }

    const fixedTodos = todos.map((t, i) => fixTodo(t, i, issues, "completed.json"));

    if (issues.some((iss) => iss.file === "completed.json")) {
      fixes.push({ filePath: completedPath, content: JSON.stringify(fixedTodos, null, 2) + "\n" });
    } else {
      console.log(`  completed.json: OK (${todos.length} completed)`);
    }
  }

  // --- Report ---
  console.log("");

  if (issues.length === 0) {
    console.log("All files are valid. No issues found.");
    return 0;
  }

  console.log(`Found ${issues.length} issue(s):\n`);
  for (const issue of issues) {
    console.log(`  ${issue.file} > ${issue.path}`);
    console.log(`    Problem: ${issue.message}`);
    console.log(`    Fix:     ${issue.fix}`);
    console.log("");
  }

  const ok = await confirm(`Apply ${issues.length} fix(es)? (y/n) `);
  if (!ok) {
    console.log("Aborted. No changes made.");
    return 0;
  }

  // Deduplicate fixes by filePath (keep last)
  const fixMap = new Map<string, string>();
  for (const f of fixes) {
    fixMap.set(f.filePath, f.content);
  }

  for (const [filePath, content] of fixMap) {
    await writeFile(filePath, content, "utf-8");
    const name = filePath.split("/").pop();
    console.log(`  Fixed: ${name}`);
  }

  console.log("\nDone. All issues have been fixed.");
  return 0;
}
