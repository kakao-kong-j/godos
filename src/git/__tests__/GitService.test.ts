import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { GitService } from "../GitService.js";

let tempDir: string;
let dataFilePath: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "kodo-git-test-"));
  dataFilePath = join(tempDir, ".kodo", "todos.json");

  // Initialize a git repo with an initial commit
  execSync("git init", { cwd: tempDir });
  execSync('git config user.email "test@test.com"', { cwd: tempDir });
  execSync('git config user.name "Test"', { cwd: tempDir });
  execSync("mkdir -p .kodo", { cwd: tempDir });
  await writeFile(dataFilePath, '{"version":1,"todos":[]}');
  execSync("git add -A && git commit -m 'init'", { cwd: tempDir });
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("GitService", () => {
  it("isGitRepo returns true inside a git repository", async () => {
    const svc = new GitService(tempDir, dataFilePath, 0);
    expect(await svc.isGitRepo()).toBe(true);
  });

  it("isGitRepo returns false outside a git repository", async () => {
    const nonGitDir = await mkdtemp(join(tmpdir(), "kodo-nogit-"));
    const svc = new GitService(nonGitDir, join(nonGitDir, "x"), 0);
    const result = await svc.isGitRepo();
    await rm(nonGitDir, { recursive: true, force: true });
    expect(result).toBe(false);
  });

  it("commitNow creates a commit with kodo: prefix", async () => {
    const svc = new GitService(tempDir, dataFilePath, 0);

    // Modify the data file
    await writeFile(dataFilePath, '{"version":1,"todos":[{"changed":true}]}');

    await svc.commitNow('add "Test item"');

    const log = execSync("git log --oneline -1", { cwd: tempDir })
      .toString()
      .trim();
    expect(log).toContain('kodo: add "Test item"');
  });
});
