# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kodo is a Git-based interactive TUI TodoList CLI built with Ink (React for terminals). Todo data is stored in `.kodo/todos.json` and changes are auto-committed with `kodo:` prefix.

## Tech Stack

- **Runtime**: Node.js >=18, ESM (`"type": "module"`)
- **UI**: Ink 5.x + @inkjs/ui 2.x (React 18.3.x)
- **Language**: TypeScript 5.7+ (module: NodeNext, jsx: react-jsx)
- **Git**: simple-git 3.x
- **Validation**: zod 3.24.x
- **Dates**: date-fns 4.x
- **CLI Parser**: meow 13.x

## Build Commands

```bash
npm run build       # Compile TypeScript to dist/
npm run typecheck   # Type-check without emitting
npm run dev         # Watch mode compilation
npm run start       # Run the CLI (node dist/cli.js)
```

## Usage

```bash
node dist/cli.js              # Interactive TUI
node dist/cli.js add "title"  # Quick add
node dist/cli.js list         # List todos (stdout)
```

## Architecture

- `src/cli.tsx` - CLI entry point (meow parser, routes to TUI or non-interactive)
- `src/app.tsx` - Root component with NavigationContext → TodoContext → GitContext
- `src/screens/` - MainList, AddTodo, EditTodo, Filter, Help screens
- `src/components/` - TodoItem, TodoList, PriorityBadge, TagList, StatusBar, Header, FormField
- `src/hooks/` - useNavigation, useTodos (useReducer), useGit
- `src/store/` - Zod schema + TodoStore (file I/O)
- `src/git/` - GitService (simple-git wrapper with debounced auto-commit)
- `src/nonInteractive.ts` - `kodo add` and `kodo list` commands

## Data

- Todo data: `.kodo/todos.json` (git tracked)
- Git commits use `kodo:` prefix, filterable with `git log --grep="kodo:"`
