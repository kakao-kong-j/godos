import React from "react";
import { Box, Text, useInput } from "ink";
import { useNavigation } from "../hooks/useNavigation.js";
import { Header } from "../components/Header.js";

const SHORTCUTS = [
  { key: "↑ / ↓ or j / k", desc: "Navigate todo list" },
  { key: "Enter / Space", desc: "Toggle todo status (done/pending)" },
  { key: "a", desc: "Add new todo" },
  { key: "e", desc: "Edit selected todo" },
  { key: "d", desc: "Delete selected todo (with confirmation)" },
  { key: "p", desc: "Cycle priority (low → medium → high)" },
  { key: "A (shift+a)", desc: "Clear all completed todos (with confirmation)" },
  { key: "P (shift+p)", desc: "Push to remote (origin)" },
  { key: "L (shift+l)", desc: "Pull from remote (origin)" },
  { key: "w", desc: "Open worktree in Terminal (macOS)" },
  { key: "s", desc: "Open stats screen" },
  { key: "Tab", desc: "Cycle status filter" },
  { key: "/", desc: "Open filter/search screen" },
  { key: "?", desc: "Show this help screen" },
  { key: "Esc", desc: "Reset filter / go back" },
  { key: "q", desc: "Quit" },
];

export function HelpScreen() {
  const nav = useNavigation();

  useInput((_input, key) => {
    if (key.escape || _input === "?" || _input === "q") {
      nav.goBack();
    }
  });

  return (
    <Box flexDirection="column">
      <Header title="Keyboard Shortcuts" subtitle="Press Esc to go back" />
      {SHORTCUTS.map((s) => (
        <Box key={s.key}>
          <Box width={24}>
            <Text color="cyan" bold>
              {s.key}
            </Text>
          </Box>
          <Text>{s.desc}</Text>
        </Box>
      ))}
      <Box marginTop={1}>
        <Text color="gray">
          Git: All changes are automatically committed with &quot;godos:&quot; prefix.
          {"\n"}Use: git log --grep=&quot;godos:&quot; to view godos history.
        </Text>
      </Box>
    </Box>
  );
}
