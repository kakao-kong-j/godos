import { useReducer, useEffect, useCallback, useRef, createContext, useContext } from "react";
import type { Todo, Priority, TodoStatus } from "../store/schema.js";
import { TodoStore } from "../store/TodoStore.js";
import { generateId } from "../utils/id.js";
import { nowISO } from "../utils/dates.js";

// --- State ---

export interface TodoFilter {
  status: TodoStatus | "all";
  priority: Priority | "all";
  search: string;
  project: string | "all";
}

export interface TodoState {
  todos: Todo[];
  filter: TodoFilter;
  selectedIndex: number;
  loaded: boolean;
}

const initialFilter: TodoFilter = {
  status: "all",
  priority: "all",
  search: "",
  project: "all",
};

const initialState: TodoState = {
  todos: [],
  filter: initialFilter,
  selectedIndex: 0,
  loaded: false,
};

// --- Actions ---

export type TodoAction =
  | { type: "LOAD"; todos: Todo[] }
  | { type: "ADD"; todo: Todo }
  | { type: "UPDATE"; id: string; updates: Partial<Omit<Todo, "id" | "createdAt">> }
  | { type: "DELETE"; id: string }
  | { type: "TOGGLE_STATUS"; id: string }
  | { type: "CYCLE_PRIORITY"; id: string }
  | { type: "SET_FILTER"; filter: Partial<TodoFilter> }
  | { type: "RESET_FILTER" }
  | { type: "SET_SELECTED"; index: number }
  | { type: "ARCHIVE_DONE" };

// --- Reducer ---

const PRIORITY_CYCLE: Priority[] = ["low", "medium", "high"];
const STATUS_TOGGLE: Record<TodoStatus, TodoStatus> = {
  pending: "done",
  in_progress: "done",
  done: "pending",
};

export function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case "LOAD":
      return { ...state, todos: action.todos, loaded: true, selectedIndex: 0 };

    case "ADD":
      return { ...state, todos: [...state.todos, action.todo] };

    case "UPDATE": {
      const todos = state.todos.map((t) =>
        t.id === action.id ? { ...t, ...action.updates, updatedAt: nowISO() } : t
      );
      return { ...state, todos };
    }

    case "DELETE": {
      const todos = state.todos.filter((t) => t.id !== action.id);
      const maxIdx = Math.max(0, todos.length - 1);
      return {
        ...state,
        todos,
        selectedIndex: Math.min(state.selectedIndex, maxIdx),
      };
    }

    case "TOGGLE_STATUS": {
      const todos = state.todos.map((t) => {
        if (t.id !== action.id) return t;
        const newStatus = STATUS_TOGGLE[t.status];
        return {
          ...t,
          status: newStatus,
          updatedAt: nowISO(),
          completedAt: newStatus === "done" ? nowISO() : undefined,
        };
      });
      return { ...state, todos };
    }

    case "CYCLE_PRIORITY": {
      const todos = state.todos.map((t) => {
        if (t.id !== action.id) return t;
        const idx = PRIORITY_CYCLE.indexOf(t.priority);
        const next = PRIORITY_CYCLE[(idx + 1) % PRIORITY_CYCLE.length]!;
        return { ...t, priority: next, updatedAt: nowISO() };
      });
      return { ...state, todos };
    }

    case "SET_FILTER":
      return {
        ...state,
        filter: { ...state.filter, ...action.filter },
        selectedIndex: 0,
      };

    case "RESET_FILTER":
      return { ...state, filter: initialFilter, selectedIndex: 0 };

    case "SET_SELECTED":
      return { ...state, selectedIndex: action.index };

    case "ARCHIVE_DONE": {
      const remaining = state.todos.filter((t) => t.status !== "done");
      const maxIdx = Math.max(0, remaining.length - 1);
      return {
        ...state,
        todos: remaining,
        selectedIndex: Math.min(state.selectedIndex, maxIdx),
      };
    }

    default:
      return state;
  }
}

// --- Filtered todos helper ---

export function getFilteredTodos(state: TodoState): Todo[] {
  let result = state.todos;

  if (state.filter.status !== "all") {
    result = result.filter((t) => t.status === state.filter.status);
  }
  if (state.filter.priority !== "all") {
    result = result.filter((t) => t.priority === state.filter.priority);
  }
  if (state.filter.project !== "all") {
    result = result.filter((t) => t.project === state.filter.project);
  }
  if (state.filter.search) {
    const q = state.filter.search.toLowerCase();
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }

  // Sort: done at bottom, then by priority (high > medium > low), then by createdAt
  const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
  result.sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (a.status !== "done" && b.status === "done") return -1;
    const pa = priorityOrder[a.priority];
    const pb = priorityOrder[b.priority];
    if (pa !== pb) return pa - pb;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return result;
}

// --- Context ---

export interface TodoContextType {
  state: TodoState;
  filteredTodos: Todo[];
  addTodo: (input: {
    title: string;
    description?: string;
    priority?: Priority;
    tags?: string[];
    project?: string;
    jira?: string;
    dueDate?: string;
  }) => Todo;
  updateTodo: (id: string, updates: Partial<Omit<Todo, "id" | "createdAt">>) => void;
  deleteTodo: (id: string) => void;
  toggleStatus: (id: string) => void;
  cyclePriority: (id: string) => void;
  setFilter: (filter: Partial<TodoFilter>) => void;
  resetFilter: () => void;
  setSelectedIndex: (index: number) => void;
  archiveDone: () => Todo[];
  reload: () => Promise<void>;
}

export const TodoContext = createContext<TodoContextType>(null!);

export function useTodoContext() {
  return useContext(TodoContext);
}

// --- Hook ---

export function useTodos(store: TodoStore | null) {
  const [state, dispatch] = useReducer(todoReducer, initialState);

  useEffect(() => {
    if (!store) return;
    store.getTodos().then((todos) => dispatch({ type: "LOAD", todos }));
  }, [store]);

  const persist = useCallback(
    (todos: Todo[]) => {
      store?.saveTodos(todos).catch(() => {});
    },
    [store]
  );

  const addTodo = useCallback(
    (input: {
      title: string;
      description?: string;
      priority?: Priority;
      tags?: string[];
      project?: string;
      jira?: string;
      dueDate?: string;
    }): Todo => {
      const now = nowISO();
      const todo: Todo = {
        id: generateId(),
        title: input.title,
        description: input.description ?? "",
        status: "pending",
        priority: input.priority ?? "medium",
        tags: input.tags ?? [],
        project: input.project,
        jira: input.jira,
        dueDate: input.dueDate,
        createdAt: now,
        updatedAt: now,
      };
      dispatch({ type: "ADD", todo });
      return todo;
    },
    []
  );

  const updateTodo = useCallback(
    (id: string, updates: Partial<Omit<Todo, "id" | "createdAt">>) => {
      dispatch({ type: "UPDATE", id, updates });
    },
    []
  );

  const deleteTodo = useCallback((id: string) => {
    dispatch({ type: "DELETE", id });
  }, []);

  const toggleStatus = useCallback((id: string) => {
    dispatch({ type: "TOGGLE_STATUS", id });
  }, []);

  const cyclePriority = useCallback((id: string) => {
    dispatch({ type: "CYCLE_PRIORITY", id });
  }, []);

  const setFilter = useCallback((filter: Partial<TodoFilter>) => {
    dispatch({ type: "SET_FILTER", filter });
  }, []);

  const resetFilter = useCallback(() => {
    dispatch({ type: "RESET_FILTER" });
  }, []);

  const setSelectedIndex = useCallback((index: number) => {
    dispatch({ type: "SET_SELECTED", index });
  }, []);

  const archiveDone = useCallback((): Todo[] => {
    const doneTodos = state.todos.filter((t) => t.status === "done");
    dispatch({ type: "ARCHIVE_DONE" });
    return doneTodos;
  }, [state.todos]);

  const reloadingRef = useRef(false);

  const reload = useCallback(async () => {
    if (store) {
      reloadingRef.current = true;
      const todos = await store.getTodos();
      dispatch({ type: "LOAD", todos });
      reloadingRef.current = false;
    }
  }, [store]);

  // Persist on todo changes (skip during reload to avoid overwriting pulled data)
  useEffect(() => {
    if (state.loaded && !reloadingRef.current) {
      persist(state.todos);
    }
  }, [state.todos, state.loaded, persist]);

  const filteredTodos = getFilteredTodos(state);

  return {
    state,
    filteredTodos,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleStatus,
    cyclePriority,
    setFilter,
    resetFilter,
    setSelectedIndex,
    archiveDone,
    reload,
  };
}
