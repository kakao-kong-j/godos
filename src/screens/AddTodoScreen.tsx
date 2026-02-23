import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput } from "@inkjs/ui";
import { useTodoContext } from "../hooks/useTodos.js";
import { useNavigation } from "../hooks/useNavigation.js";
import { useGitContext } from "../hooks/useGit.js";
import { Header } from "../components/Header.js";
import { FormField } from "../components/FormField.js";
import { StatusBar } from "../components/StatusBar.js";
import type { Priority } from "../store/schema.js";

type Field = "title" | "description" | "priority" | "project" | "jira" | "worktree" | "tags";
const FIELDS: Field[] = ["title", "description", "priority", "project", "jira", "worktree", "tags"];
const PRIORITIES: Priority[] = ["low", "medium", "high"];

export function AddTodoScreen() {
  const nav = useNavigation();
  const { addTodo } = useTodoContext();
  const git = useGitContext();

  const [activeField, setActiveField] = useState<Field>("title");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priorityIdx, setPriorityIdx] = useState(1); // medium
  const [project, setProject] = useState("");
  const [jira, setJira] = useState("");
  const [worktree, setWorktree] = useState("");
  const [tags, setTags] = useState("");

  const activeIdx = FIELDS.indexOf(activeField);

  useInput((input, key) => {
    if (key.escape) {
      nav.goBack();
      return;
    }

    // Tab / Shift+Tab to move between fields
    if (key.tab && !key.shift) {
      const next = FIELDS[(activeIdx + 1) % FIELDS.length]!;
      setActiveField(next);
      return;
    }

    // Priority cycling when on priority field
    if (activeField === "priority" && (key.leftArrow || key.rightArrow)) {
      setPriorityIdx((prev) => {
        if (key.rightArrow) return (prev + 1) % PRIORITIES.length;
        return (prev - 1 + PRIORITIES.length) % PRIORITIES.length;
      });
    }

    // Ctrl+S or Enter on last field to submit
    if ((input === "s" && key.ctrl) || (key.return && activeField === "tags")) {
      if (!title.trim()) return;
      const todo = addTodo({
        title: title.trim(),
        description: description.trim(),
        priority: PRIORITIES[priorityIdx],
        project: project.trim() || undefined,
        jira: jira.trim() || undefined,
        worktree: worktree.trim() || undefined,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      git.commit(`add "${todo.title}"`);
      nav.goBack();
    }
  });

  const priority = PRIORITIES[priorityIdx]!;

  return (
    <Box flexDirection="column">
      <Header title="Add Todo" subtitle="Fill in the details below" />

      <FormField label="Title">
        {activeField === "title" ? (
          <TextInput placeholder="What needs to be done?" onChange={setTitle} onSubmit={() => setActiveField("description")} />
        ) : (
          <Text>{title || <Text color="gray">empty</Text>}</Text>
        )}
      </FormField>

      <FormField label="Description">
        {activeField === "description" ? (
          <TextInput placeholder="Optional details..." onChange={setDescription} onSubmit={() => setActiveField("priority")} />
        ) : (
          <Text>{description || <Text color="gray">empty</Text>}</Text>
        )}
      </FormField>

      <FormField label="Priority">
        {activeField === "priority" ? (
          <Text>
            {PRIORITIES.map((p, i) => (
              <Text key={p} color={i === priorityIdx ? "cyan" : "gray"} bold={i === priorityIdx}>
                {i === priorityIdx ? `[${p}]` : ` ${p} `}
                {" "}
              </Text>
            ))}
            <Text color="gray">(←/→ to change, Enter to next)</Text>
          </Text>
        ) : (
          <Text>{priority}</Text>
        )}
      </FormField>

      <FormField label="Project">
        {activeField === "project" ? (
          <TextInput placeholder="Project name (optional)" onChange={setProject} onSubmit={() => setActiveField("jira")} />
        ) : (
          <Text>{project || <Text color="gray">empty</Text>}</Text>
        )}
      </FormField>

      <FormField label="Jira">
        {activeField === "jira" ? (
          <TextInput placeholder="Jira issue key (optional)" onChange={setJira} onSubmit={() => setActiveField("worktree")} />
        ) : (
          <Text>{jira || <Text color="gray">empty</Text>}</Text>
        )}
      </FormField>

      <FormField label="Worktree">
        {activeField === "worktree" ? (
          <TextInput placeholder="Worktree path (optional)" onChange={setWorktree} onSubmit={() => setActiveField("tags")} />
        ) : (
          <Text>{worktree || <Text color="gray">empty</Text>}</Text>
        )}
      </FormField>

      <FormField label="Tags">
        {activeField === "tags" ? (
          <TextInput placeholder="Comma-separated tags (optional)" onChange={setTags} />
        ) : (
          <Text>{tags || <Text color="gray">empty</Text>}</Text>
        )}
      </FormField>

      <StatusBar
        hints={[
          { key: "Tab", label: "next field" },
          { key: "Enter", label: "next/submit" },
          { key: "Esc", label: "cancel" },
          { key: "Ctrl+S", label: "save" },
        ]}
      />
    </Box>
  );
}
