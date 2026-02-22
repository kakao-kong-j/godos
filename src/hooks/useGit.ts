import { createContext, useContext, useCallback } from "react";
import { GitService, gitErrorHint } from "../git/GitService.js";

export interface SyncResult {
  ok: boolean;
  message: string;
}

export interface GitContextType {
  commit: (message: string) => void;
  flush: () => Promise<void>;
  push: (remote?: string) => Promise<SyncResult>;
  pull: (remote?: string) => Promise<SyncResult>;
}

const noop: SyncResult = { ok: false, message: "Git is not available." };

export const GitContext = createContext<GitContextType>({
  commit: () => {},
  flush: async () => {},
  push: async () => noop,
  pull: async () => noop,
});

export function useGitContext() {
  return useContext(GitContext);
}

export function useGitService(gitService: GitService | null) {
  const commit = useCallback(
    (message: string) => {
      if (gitService) {
        gitService.autoCommit(message).catch(() => {});
      }
    },
    [gitService]
  );

  const flush = useCallback(async () => {
    if (gitService) {
      await gitService.flush();
    }
  }, [gitService]);

  const push = useCallback(
    async (remote?: string): Promise<SyncResult> => {
      if (!gitService) return noop;
      try {
        await gitService.flush();
        const message = await gitService.push(remote);
        return { ok: true, message };
      } catch (err) {
        return { ok: false, message: gitErrorHint(err) };
      }
    },
    [gitService]
  );

  const pull = useCallback(
    async (remote?: string): Promise<SyncResult> => {
      if (!gitService) return noop;
      try {
        await gitService.flush();
        const message = await gitService.pull(remote);
        return { ok: true, message };
      } catch (err) {
        return { ok: false, message: gitErrorHint(err) };
      }
    },
    [gitService]
  );

  return { commit, flush, push, pull };
}
