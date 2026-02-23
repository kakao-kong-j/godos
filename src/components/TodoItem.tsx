import React from "react";
import { Box, Text } from "ink";
import type { Todo } from "../store/schema.js";
import { STATUS_ICONS, STATUS_COLORS } from "../utils/colors.js";
import { PriorityBadge } from "./PriorityBadge.js";
import { TagList } from "./TagList.js";
import { formatDueDate } from "../utils/dates.js";

interface Props {
  todo: Todo;
  isSelected: boolean;
}

export function TodoItem({ todo, isSelected }: Props) {
  const icon = STATUS_ICONS[todo.status];
  const statusColor = STATUS_COLORS[todo.status];
  const isDone = todo.status === "done";

  return (
    <Box>
      <Text color={isSelected ? "white" : "gray"}>
        {isSelected ? "❯ " : "  "}
      </Text>
      <Text color={statusColor}>{icon} </Text>
      <Text
        color={isDone ? "gray" : "white"}
        strikethrough={isDone}
        bold={isSelected}
      >
        {todo.title}
      </Text>
      <Text> </Text>
      <PriorityBadge priority={todo.priority} />
      {todo.project && (
        <Text color="yellow"> [{todo.project}]</Text>
      )}
      {todo.jira && (
        <Text color="magenta"> {todo.jira}</Text>
      )}
      {todo.worktree && (
        <Text color="blue"> [{todo.worktree.split("/").pop() || todo.worktree}]</Text>
      )}
      {todo.tags.length > 0 && (
        <>
          <Text> </Text>
          <TagList tags={todo.tags} />
        </>
      )}
      {todo.dueDate && (
        <Text color={isDone ? "gray" : "yellow"}> | {formatDueDate(todo.dueDate)}</Text>
      )}
    </Box>
  );
}
