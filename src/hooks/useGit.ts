import { createContext, useContext, useCallback } from "react";
import { GitService } from "../git/GitService.js";

export interface GitContextType {
  commit: (message: string) => void;
  flush: () => Promise<void>;
}

export const GitContext = createContext<GitContextType>({
  commit: () => {},
  flush: async () => {},
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

  return { commit, flush };
}
