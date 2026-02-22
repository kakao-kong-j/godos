import { existsSync } from "node:fs";
import { simpleGit, type SimpleGit } from "simple-git";

export interface RemoteInfo {
  name: string;
  url: string;
}

export class GitService {
  private git: SimpleGit;
  private dataFilePath: string;
  private extraFilePaths: string[];
  private commitTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingMessage: string | null = null;
  private debounceMs: number;

  constructor(rootDir: string, dataFilePath: string, extraFilePaths: string[] = [], debounceMs = 500) {
    this.git = simpleGit(rootDir);
    this.dataFilePath = dataFilePath;
    this.extraFilePaths = extraFilePaths;
    this.debounceMs = debounceMs;
  }

  private get stagableFilePaths(): string[] {
    return this.allFilePaths.filter(existsSync);
  }

  private get allFilePaths(): string[] {
    return [this.dataFilePath, ...this.extraFilePaths];
  }

  async isGitRepo(): Promise<boolean> {
    try {
      await this.git.revparse(["--is-inside-work-tree"]);
      return true;
    } catch {
      return false;
    }
  }

  async autoCommit(message: string): Promise<void> {
    if (this.commitTimer) {
      clearTimeout(this.commitTimer);
    }

    this.pendingMessage = message;

    return new Promise<void>((resolve) => {
      this.commitTimer = setTimeout(async () => {
        try {
          const msg = this.pendingMessage ?? message;
          this.pendingMessage = null;
          this.commitTimer = null;

          const files = this.stagableFilePaths;
          if (files.length === 0) return;
          await this.git.add(files);
          await this.git.commit(`godos: ${msg}`, files);
        } catch {
          // Git failures are non-blocking; silently ignore
        }
        resolve();
      }, this.debounceMs);
    });
  }

  async commitNow(message: string): Promise<void> {
    if (this.commitTimer) {
      clearTimeout(this.commitTimer);
      this.commitTimer = null;
      this.pendingMessage = null;
    }

    try {
      const files = this.stagableFilePaths;
      if (files.length === 0) return;
      await this.git.add(files);
      await this.git.commit(`godos: ${message}`, files);
    } catch {
      // Git failures are non-blocking
    }
  }

  async flush(): Promise<void> {
    if (this.pendingMessage) {
      await this.commitNow(this.pendingMessage);
    }
  }

  // --- Remote operations ---

  async addRemote(name: string, url: string): Promise<void> {
    await this.git.addRemote(name, url);
  }

  async removeRemote(name: string): Promise<void> {
    await this.git.removeRemote(name);
  }

  async getRemotes(): Promise<RemoteInfo[]> {
    const remotes = await this.git.getRemotes(true);
    return remotes.map((r) => ({
      name: r.name,
      url: r.refs.push || r.refs.fetch || "",
    }));
  }

  async push(remote = "origin"): Promise<string> {
    await this.git.push(["-u", remote, "HEAD"]);
    return `Pushed to ${remote} successfully.`;
  }

  async pull(remote = "origin"): Promise<string> {
    const result = await this.git.pull(remote);
    if (result.summary.changes === 0 && result.summary.insertions === 0 && result.summary.deletions === 0) {
      return "Already up to date.";
    }
    return `Pulled from ${remote}: ${result.summary.changes} file(s) changed.`;
  }
}

export function gitErrorHint(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes("src refspec") || msg.includes("does not match any")) {
    return "Nothing to push yet. Add a todo first to create an initial commit.";
  }
  if (msg.includes("No such remote") || msg.includes("does not appear to be a git repository")) {
    return "No remote configured. Run 'godos remote add <name> <url>' first.";
  }
  if (msg.includes("Could not read from remote") || msg.includes("repository not found")) {
    return "Cannot reach remote. Check the URL with 'godos remote'.";
  }
  if (msg.includes("non-fast-forward") || msg.includes("rejected")) {
    return "Remote has new changes. Pull first with 'godos pull'.";
  }
  if (msg.includes("CONFLICT") || msg.includes("Merge conflict")) {
    return "Merge conflict. Resolve manually in ~/.godos/ then commit.";
  }
  if (msg.includes("Authentication") || msg.includes("Permission denied") || msg.includes("fatal: could not read Username")) {
    return "Authentication failed. Check your credentials or SSH keys.";
  }
  return msg;
}
