import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { TodoStore } from "./store/TodoStore.js";
import { GitService } from "./git/GitService.js";
import { godosRoot } from "./store/config.js";
import { ArchiveStore, ArchiveContext } from "./store/ArchiveStore.js";
import { NavigationContext, useNavigationState } from "./hooks/useNavigation.js";
import { TodoContext, useTodos } from "./hooks/useTodos.js";
import { GitContext, useGitService } from "./hooks/useGit.js";
import { MainListScreen } from "./screens/MainListScreen.js";
import { AddTodoScreen } from "./screens/AddTodoScreen.js";
import { EditTodoScreen } from "./screens/EditTodoScreen.js";
import { FilterScreen } from "./screens/FilterScreen.js";
import { HelpScreen } from "./screens/HelpScreen.js";
import { StatsScreen } from "./screens/StatsScreen.js";

export function App() {
  const [store, setStore] = useState<TodoStore | null>(null);
  const [archiveStore, setArchiveStore] = useState<ArchiveStore | null>(null);
  const [gitService, setGitService] = useState<GitService | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    TodoStore.create()
      .then((s) => {
        setStore(s);
        const archivePath = TodoStore.archiveFilePathFor(s.dataFilePath);
        setArchiveStore(new ArchiveStore(archivePath));
        const gs = new GitService(godosRoot(), s.dataFilePath, [archivePath]);
        gs.isGitRepo().then((isRepo) => {
          if (isRepo) setGitService(gs);
        });
      })
      .catch((err) => {
        setInitError(err instanceof Error ? err.message : String(err));
      });
  }, []);

  const nav = useNavigationState();
  const todoCtx = useTodos(store);
  const gitCtx = useGitService(gitService);

  if (initError) {
    return (
      <Box>
        <Text color="red">Failed to load: {initError}</Text>
      </Box>
    );
  }

  if (!store || !todoCtx.state.loaded) {
    return (
      <Box>
        <Text color="gray">Loading...</Text>
      </Box>
    );
  }

  const renderScreen = () => {
    switch (nav.screen) {
      case "add":
        return <AddTodoScreen />;
      case "edit":
        return <EditTodoScreen />;
      case "filter":
        return <FilterScreen />;
      case "help":
        return <HelpScreen />;
      case "stats":
        return <StatsScreen />;
      default:
        return <MainListScreen />;
    }
  };

  return (
    <NavigationContext.Provider value={nav}>
      <TodoContext.Provider value={todoCtx}>
        <GitContext.Provider value={gitCtx}>
          <ArchiveContext.Provider value={archiveStore}>
            {renderScreen()}
          </ArchiveContext.Provider>
        </GitContext.Provider>
      </TodoContext.Provider>
    </NavigationContext.Provider>
  );
}
