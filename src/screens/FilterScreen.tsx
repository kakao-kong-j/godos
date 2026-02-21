import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput } from "@inkjs/ui";
import { useTodoContext } from "../hooks/useTodos.js";
import { useNavigation } from "../hooks/useNavigation.js";
import { Header } from "../components/Header.js";
import { FormField } from "../components/FormField.js";
import { StatusBar } from "../components/StatusBar.js";
import type { Priority, TodoStatus } from "../store/schema.js";

const STATUSES = ["all", "pending", "in_progress", "done"] as const;
const PRIORITIES = ["all", "low", "medium", "high"] as const;

type Field = "search" | "status" | "priority";
const FIELDS: Field[] = ["search", "status", "priority"];

export function FilterScreen() {
  const nav = useNavigation();
  const { state, setFilter, resetFilter } = useTodoContext();

  const [activeField, setActiveField] = useState<Field>("search");
  const [search, setSearch] = useState(state.filter.search);
  const [statusIdx, setStatusIdx] = useState(
    STATUSES.indexOf(state.filter.status as typeof STATUSES[number])
  );
  const [priorityIdx, setPriorityIdx] = useState(
    PRIORITIES.indexOf(state.filter.priority as typeof PRIORITIES[number])
  );

  const activeIdx = FIELDS.indexOf(activeField);

  useInput((input, key) => {
    if (key.escape) {
      nav.goBack();
      return;
    }

    if (key.tab) {
      const next = FIELDS[(activeIdx + 1) % FIELDS.length]!;
      setActiveField(next);
      return;
    }

    if (activeField === "status" && (key.leftArrow || key.rightArrow)) {
      setStatusIdx((prev) => {
        if (key.rightArrow) return (prev + 1) % STATUSES.length;
        return (prev - 1 + STATUSES.length) % STATUSES.length;
      });
    }

    if (activeField === "priority" && (key.leftArrow || key.rightArrow)) {
      setPriorityIdx((prev) => {
        if (key.rightArrow) return (prev + 1) % PRIORITIES.length;
        return (prev - 1 + PRIORITIES.length) % PRIORITIES.length;
      });
    }

    // Apply with Ctrl+S or Enter on last field
    if ((input === "s" && key.ctrl) || (key.return && activeField === "priority")) {
      setFilter({
        search,
        status: STATUSES[statusIdx] as TodoStatus | "all",
        priority: PRIORITIES[priorityIdx] as Priority | "all",
      });
      nav.goBack();
    }

    // Reset with Ctrl+R
    if (input === "r" && key.ctrl) {
      resetFilter();
      nav.goBack();
    }
  });

  return (
    <Box flexDirection="column">
      <Header title="Filter Todos" subtitle="Set filters and press Enter to apply" />

      <FormField label="Search">
        {activeField === "search" ? (
          <TextInput
            defaultValue={search}
            placeholder="Search by title, description, or tag..."
            onChange={setSearch}
            onSubmit={() => setActiveField("status")}
          />
        ) : (
          <Text>{search || <Text color="gray">none</Text>}</Text>
        )}
      </FormField>

      <FormField label="Status">
        <Text>
          {STATUSES.map((s, i) => (
            <Text
              key={s}
              color={activeField === "status" && i === statusIdx ? "cyan" : "gray"}
              bold={activeField === "status" && i === statusIdx}
            >
              {activeField === "status" && i === statusIdx ? `[${s}]` : ` ${s} `}
              {" "}
            </Text>
          ))}
        </Text>
      </FormField>

      <FormField label="Priority">
        <Text>
          {PRIORITIES.map((p, i) => (
            <Text
              key={p}
              color={activeField === "priority" && i === priorityIdx ? "cyan" : "gray"}
              bold={activeField === "priority" && i === priorityIdx}
            >
              {activeField === "priority" && i === priorityIdx ? `[${p}]` : ` ${p} `}
              {" "}
            </Text>
          ))}
        </Text>
      </FormField>

      <StatusBar
        hints={[
          { key: "Tab", label: "next field" },
          { key: "←/→", label: "change option" },
          { key: "Enter", label: "apply" },
          { key: "Ctrl+R", label: "reset" },
          { key: "Esc", label: "cancel" },
        ]}
      />
    </Box>
  );
}
