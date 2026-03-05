import React, { useState, useRef } from "react";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { Box, Text, useInput, useApp } from "ink";
import { useTodoContext } from "../hooks/useTodos.js";
import { useNavigation } from "../hooks/useNavigation.js";
import { useGitContext } from "../hooks/useGit.js";
import { Header } from "../components/Header.js";
import { TodoList } from "../components/TodoList.js";
import { StatusBar } from "../components/StatusBar.js";

const STATUS_FILTER_CYCLE = ["all", "pending", "in_progress", "done"] as const;

interface SyncStatus {
  type: "pushing" | "pulling" | "success" | "error";
  message: string;
}

export function MainListScreen() {
  const { exit } = useApp();
  const nav = useNavigation();
  const { state, filteredTodos, toggleStatus, cyclePriority, deleteTodo, clearCompleted, setFilter, resetFilter, setSelectedIndex, reload } =
    useTodoContext();
  const git = useGitContext();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const syncingRef = useRef(false);

  const selected = filteredTodos[state.selectedIndex];

  useInput((input, key) => {
    // Dismiss sync status on any key
    if (syncStatus?.type === "error" || syncStatus?.type === "success") {
      setSyncStatus(null);
      return;
    }

    // Block input while syncing
    if (syncStatus?.type === "pushing" || syncStatus?.type === "pulling") {
      return;
    }

    if (confirmDelete) {
      if (input === "y" && selected) {
        const title = selected.title;
        deleteTodo(selected.id);
        git.commit(`delete "${title}"`);
        setConfirmDelete(false);
      } else {
        setConfirmDelete(false);
      }
      return;
    }

    if (confirmClear) {
      if (input === "y") {
        const cleared = clearCompleted();
        if (cleared.length > 0) {
          git.commit(`clear ${cleared.length} completed todo(s)`);
        }
        setConfirmClear(false);
      } else {
        setConfirmClear(false);
      }
      return;
    }

    // Navigation
    if (key.upArrow || input === "k") {
      setSelectedIndex(Math.max(0, state.selectedIndex - 1));
    }
    if (key.downArrow || input === "j") {
      setSelectedIndex(Math.min(filteredTodos.length - 1, state.selectedIndex + 1));
    }

    // Toggle status
    if ((key.return || input === " ") && selected) {
      const wasDone = selected.status === "done";
      toggleStatus(selected.id);
      git.commit(wasDone ? `reopen "${selected.title}"` : `complete "${selected.title}"`);
    }

    // Cycle priority
    if (input === "p" && selected) {
      cyclePriority(selected.id);
      git.commit(`change priority of "${selected.title}"`);
    }

    // Add
    if (input === "a") {
      nav.navigate("add");
    }

    // Edit
    if (input === "e" && selected) {
      nav.navigate("edit", { todoId: selected.id });
    }

    // Delete
    if (input === "d" && selected) {
      setConfirmDelete(true);
    }

    // Filter
    if (input === "/") {
      nav.navigate("filter");
    }

    // Help
    if (input === "?") {
      nav.navigate("help");
    }

    // Clear completed
    if (input === "A") {
      const hasDone = state.todos.some((t) => t.status === "done");
      if (hasDone) {
        setConfirmClear(true);
      } else {
        setSyncStatus({ type: "error", message: "No completed todos to clear. Toggle with Enter/Space first." });
      }
    }

    // Stats
    if (input === "s") {
      nav.navigate("stats");
    }

    // Open worktree in terminal (macOS only)
    if (input === "w" && selected?.worktree) {
      const dir = selected.worktree;
      if (process.platform === "darwin" && existsSync(dir)) {
        execFile("open", ["-a", "Terminal", dir], (err) => {
          if (err) {
            setSyncStatus({ type: "error", message: `Failed to open terminal: ${err.message}` });
          }
        });
      }
    }

    // Push
    if (input === "P" && !syncingRef.current) {
      syncingRef.current = true;
      setSyncStatus({ type: "pushing", message: "Pushing..." });
      git.push().then((result) => {
        setSyncStatus({ type: result.ok ? "success" : "error", message: result.message });
      }).catch((err) => {
        setSyncStatus({ type: "error", message: String(err) });
      }).finally(() => {
        syncingRef.current = false;
      });
    }

    // Pull
    if (input === "L" && !syncingRef.current) {
      syncingRef.current = true;
      setSyncStatus({ type: "pulling", message: "Pulling..." });
      git.pull().then((result) => {
        if (result.ok) {
          return reload().then(() => {
            setSyncStatus({ type: "success", message: result.message });
          });
        } else {
          setSyncStatus({ type: "error", message: result.message });
        }
      }).catch((err) => {
        setSyncStatus({ type: "error", message: String(err) });
      }).finally(() => {
        syncingRef.current = false;
      });
    }

    // Tab: cycle status filter
    if (key.tab) {
      const currentIdx = STATUS_FILTER_CYCLE.indexOf(state.filter.status as typeof STATUS_FILTER_CYCLE[number]);
      const nextIdx = (currentIdx + 1) % STATUS_FILTER_CYCLE.length;
      setFilter({ status: STATUS_FILTER_CYCLE[nextIdx]! });
    }

    // Escape: reset filter
    if (key.escape) {
      resetFilter();
    }

    // Quit
    if (input === "q") {
      git.flush().then(() => exit());
    }
  });

  const filterLabel =
    state.filter.status !== "all" || state.filter.priority !== "all" || state.filter.search
      ? ` [filtered: ${[
          state.filter.status !== "all" ? `status=${state.filter.status}` : "",
          state.filter.priority !== "all" ? `priority=${state.filter.priority}` : "",
          state.filter.search ? `search="${state.filter.search}"` : "",
        ]
          .filter(Boolean)
          .join(", ")}]`
      : "";

  const subtitle = `${filteredTodos.length}/${state.todos.length} todos${filterLabel}`;

  return (
    <Box flexDirection="column">
      <Header title="Godos" subtitle={subtitle} />
      <TodoList todos={filteredTodos} selectedIndex={state.selectedIndex} />
      {confirmDelete && selected && (
        <Box marginTop={1}>
          <Text color="red" bold>
            Delete &quot;{selected.title}&quot;? (y/n)
          </Text>
        </Box>
      )}
      {confirmClear && (
        <Box marginTop={1}>
          <Text color="yellow" bold>
            Remove all completed todos? (y/n)
          </Text>
        </Box>
      )}
      {syncStatus && (
        <Box marginTop={1}>
          <Text
            color={
              syncStatus.type === "error"
                ? "red"
                : syncStatus.type === "success"
                  ? "green"
                  : "yellow"
            }
            bold={syncStatus.type !== "success"}
          >
            {syncStatus.message}
            {(syncStatus.type === "success" || syncStatus.type === "error") && (
              <Text color="gray"> (press any key)</Text>
            )}
          </Text>
        </Box>
      )}
      <StatusBar
        hints={[
          { key: "↑↓/jk", label: "navigate" },
          { key: "Enter", label: "toggle" },
          { key: "a", label: "add" },
          { key: "e", label: "edit" },
          { key: "d", label: "delete" },
          { key: "p", label: "priority" },
          { key: "A", label: "clear done" },
          { key: "w", label: "worktree" },
          { key: "s", label: "stats" },
          { key: "P", label: "push" },
          { key: "L", label: "pull" },
          { key: "/", label: "filter" },
          { key: "?", label: "help" },
          { key: "q", label: "quit" },
        ]}
      />
    </Box>
  );
}
