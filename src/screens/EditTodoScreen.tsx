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

export function EditTodoScreen() {
  const nav = useNavigation();
  const { state, updateTodo } = useTodoContext();
  const git = useGitContext();

  const todoId = nav.params["todoId"];
  const todo = state.todos.find((t) => t.id === todoId);

  const [activeField, setActiveField] = useState<Field>("title");
  const [title, setTitle] = useState(todo?.title ?? "");
  const [description, setDescription] = useState(todo?.description ?? "");
  const [priorityIdx, setPriorityIdx] = useState(
    todo ? PRIORITIES.indexOf(todo.priority) : 1
  );
  const [project, setProject] = useState(todo?.project ?? "");
  const [jira, setJira] = useState(todo?.jira ?? "");
  const [worktree, setWorktree] = useState(todo?.worktree ?? "");
  const [tags, setTags] = useState(todo?.tags.join(", ") ?? "");

  const activeIdx = FIELDS.indexOf(activeField);

  useInput((input, key) => {
    if (key.escape) {
      nav.goBack();
      return;
    }

    if (key.tab && !key.shift) {
      const next = FIELDS[(activeIdx + 1) % FIELDS.length]!;
      setActiveField(next);
      return;
    }

    if (activeField === "priority" && (key.leftArrow || key.rightArrow)) {
      setPriorityIdx((prev) => {
        if (key.rightArrow) return (prev + 1) % PRIORITIES.length;
        return (prev - 1 + PRIORITIES.length) % PRIORITIES.length;
      });
    }

    if ((input === "s" && key.ctrl) || (key.return && activeField === "tags")) {
      if (!title.trim() || !todoId) return;
      updateTodo(todoId, {
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
      git.commit(`edit "${title.trim()}"`);
      nav.goBack();
    }
  });

  if (!todo) {
    return (
      <Box>
        <Text color="red">Todo not found.</Text>
      </Box>
    );
  }

  const priority = PRIORITIES[priorityIdx]!;

  return (
    <Box flexDirection="column">
      <Header title="Edit Todo" subtitle={`Editing: ${todo.title}`} />

      <FormField label="Title">
        {activeField === "title" ? (
          <TextInput defaultValue={title} onChange={setTitle} onSubmit={() => setActiveField("description")} />
        ) : (
          <Text>{title || <Text color="gray">empty</Text>}</Text>
        )}
      </FormField>

      <FormField label="Description">
        {activeField === "description" ? (
          <TextInput defaultValue={description} placeholder="Optional details..." onChange={setDescription} onSubmit={() => setActiveField("priority")} />
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
          <TextInput defaultValue={project} placeholder="Project name" onChange={setProject} onSubmit={() => setActiveField("jira")} />
        ) : (
          <Text>{project || <Text color="gray">empty</Text>}</Text>
        )}
      </FormField>

      <FormField label="Jira">
        {activeField === "jira" ? (
          <TextInput defaultValue={jira} placeholder="Jira issue key" onChange={setJira} onSubmit={() => setActiveField("worktree")} />
        ) : (
          <Text>{jira || <Text color="gray">empty</Text>}</Text>
        )}
      </FormField>

      <FormField label="Worktree">
        {activeField === "worktree" ? (
          <TextInput defaultValue={worktree} placeholder="Worktree path" onChange={setWorktree} onSubmit={() => setActiveField("tags")} />
        ) : (
          <Text>{worktree || <Text color="gray">empty</Text>}</Text>
        )}
      </FormField>

      <FormField label="Tags">
        {activeField === "tags" ? (
          <TextInput defaultValue={tags} placeholder="Comma-separated" onChange={setTags} />
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
