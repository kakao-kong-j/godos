import React, { useEffect, useState } from "react";
import { Box, Text, useInput } from "ink";
import { useNavigation } from "../hooks/useNavigation.js";
import { useTodoContext } from "../hooks/useTodos.js";
import { Header } from "../components/Header.js";
import { StatusBar } from "../components/StatusBar.js";
import type { TodoStatus } from "../store/schema.js";

export function StatsScreen() {
  const nav = useNavigation();
  const { state, getCompletedCount } = useTodoContext();
  const [completedCount, setCompletedCount] = useState<number | null>(null);

  useEffect(() => {
    getCompletedCount()
      .then(setCompletedCount)
      .catch(() => setCompletedCount(0));
  }, [getCompletedCount]);

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
  const totalCompleted = counts.done + (completedCount ?? 0);
  const totalAll = total + (completedCount ?? 0);
  const completionRate =
    completedCount === null
      ? null
      : totalAll > 0
        ? Math.round((totalCompleted / totalAll) * 100)
        : 0;

  return (
    <Box flexDirection="column">
      <Header title="Stats" subtitle="Todo overview" />

      <Box flexDirection="column" marginBottom={1}>
        <StatRow label="Active" value={String(total)} />
        <StatRow label="  Pending" value={String(counts.pending)} color="yellow" />
        <StatRow label="  In Progress" value={String(counts.in_progress)} color="blue" />
        <StatRow label="  Done" value={String(counts.done)} color="green" />
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <StatRow
          label="Cleared"
          value={completedCount === null ? "..." : String(completedCount)}
          color="gray"
        />
        <StatRow
          label="Completion rate"
          value={completionRate === null ? "..." : `${completionRate}%`}
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
