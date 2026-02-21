import React, { useState } from "react";
import { Box, Text, useInput, useApp } from "ink";
import { useTodoContext } from "../hooks/useTodos.js";
import { useNavigation } from "../hooks/useNavigation.js";
import { useGitContext } from "../hooks/useGit.js";
import { Header } from "../components/Header.js";
import { TodoList } from "../components/TodoList.js";
import { StatusBar } from "../components/StatusBar.js";

const STATUS_FILTER_CYCLE = ["all", "pending", "in_progress", "done"] as const;

export function MainListScreen() {
  const { exit } = useApp();
  const nav = useNavigation();
  const { state, filteredTodos, toggleStatus, cyclePriority, deleteTodo, setFilter, resetFilter, setSelectedIndex } =
    useTodoContext();
  const git = useGitContext();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const selected = filteredTodos[state.selectedIndex];

  useInput((input, key) => {
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
      <Header title="Kodo" subtitle={subtitle} />
      <TodoList todos={filteredTodos} selectedIndex={state.selectedIndex} />
      {confirmDelete && selected && (
        <Box marginTop={1}>
          <Text color="red" bold>
            Delete &quot;{selected.title}&quot;? (y/n)
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
          { key: "/", label: "filter" },
          { key: "?", label: "help" },
          { key: "q", label: "quit" },
        ]}
      />
    </Box>
  );
}
