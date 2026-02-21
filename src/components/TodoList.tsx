import React from "react";
import { Box, Text } from "ink";
import type { Todo } from "../store/schema.js";
import { TodoItem } from "./TodoItem.js";

interface Props {
  todos: Todo[];
  selectedIndex: number;
}

export function TodoList({ todos, selectedIndex }: Props) {
  if (todos.length === 0) {
    return (
      <Box paddingY={1}>
        <Text color="gray">No todos found. Press 'a' to add one.</Text>
      </Box>
    );
  }

  // Show a window of items around the selected index
  const windowSize = 15;
  const half = Math.floor(windowSize / 2);
  let start = Math.max(0, selectedIndex - half);
  const end = Math.min(todos.length, start + windowSize);
  if (end - start < windowSize) {
    start = Math.max(0, end - windowSize);
  }

  const visible = todos.slice(start, end);

  return (
    <Box flexDirection="column">
      {start > 0 && <Text color="gray">  ↑ {start} more...</Text>}
      {visible.map((todo, i) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          isSelected={start + i === selectedIndex}
        />
      ))}
      {end < todos.length && (
        <Text color="gray">  ↓ {todos.length - end} more...</Text>
      )}
    </Box>
  );
}
