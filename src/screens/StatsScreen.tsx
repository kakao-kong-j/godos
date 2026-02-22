import React, { useEffect, useState } from "react";
import { Box, Text, useInput } from "ink";
import { useNavigation } from "../hooks/useNavigation.js";
import { useTodoContext } from "../hooks/useTodos.js";
import { useArchiveStore } from "../store/ArchiveStore.js";
import { Header } from "../components/Header.js";
import { StatusBar } from "../components/StatusBar.js";
import type { TodoStatus } from "../store/schema.js";

export function StatsScreen() {
  const nav = useNavigation();
  const { state } = useTodoContext();
  const archiveStore = useArchiveStore();
  const [archivedCount, setArchivedCount] = useState<number | null>(null);

  useEffect(() => {
    archiveStore
      ?.count()
      .then(setArchivedCount)
      .catch(() => setArchivedCount(0));
  }, [archiveStore]);

  useInput((_input, key) => {
    if (key.escape || _input === "q" || _input === "s") {
      nav.goBack();
    }
  });

  const todos = state.todos;
  const counts: Record<TodoStatus, number> = {
    pending: 0,
    in_progress: 0,
    done: 0,
  };
  for (const t of todos) counts[t.status]++;

  const total = todos.length;
  const totalWithArchived = total + (archivedCount ?? 0);
  const totalDone = counts.done + (archivedCount ?? 0);
  const completionRate =
    archivedCount === null
      ? null
      : totalWithArchived > 0
        ? Math.round((totalDone / totalWithArchived) * 100)
        : 0;

  return (
    <Box flexDirection="column">
      <Header title="Stats" subtitle="Todo completion overview" />

      <Box flexDirection="column" marginBottom={1}>
        <StatRow label="Total (active)" value={String(total)} />
        <StatRow label="  Pending" value={String(counts.pending)} color="yellow" />
        <StatRow label="  In Progress" value={String(counts.in_progress)} color="blue" />
        <StatRow label="  Done" value={String(counts.done)} color="green" />
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <StatRow
          label="Archived"
          value={archivedCount === null ? "…" : String(archivedCount)}
          color="gray"
        />
        <StatRow
          label="Completion rate"
          value={completionRate === null ? "…" : `${completionRate}%`}
          color="cyan"
        />
      </Box>

      <StatusBar hints={[{ key: "Esc / s", label: "go back" }]} />
    </Box>
  );
}

function StatRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <Box>
      <Box width={20}>
        <Text color="gray">{label}</Text>
      </Box>
      <Text color={color} bold>
        {value}
      </Text>
    </Box>
  );
}
