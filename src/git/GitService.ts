import { existsSync } from "node:fs";
import { simpleGit, type SimpleGit } from "simple-git";

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
}
