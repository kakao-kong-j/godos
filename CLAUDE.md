# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kodo is a Git-based interactive TUI TodoList CLI built with Ink (React for terminals). Todo data is stored in `.kodo/todos/default/todos.json` and changes are auto-committed with `kodo:` prefix.

## Tech Stack

- **Runtime**: Node.js >=18, ESM (`"type": "module"`)
- **UI**: Ink 5.x + @inkjs/ui 2.x (React 18.3.x)
- **Language**: TypeScript 5.7+ (module: NodeNext, jsx: react-jsx)
- **Git**: simple-git 3.x
- **Validation**: zod 3.24.x
- **Dates**: date-fns 4.x
- **CLI Parser**: meow 13.x
- **Test**: vitest 4.x

## Build Commands

```bash
npm run build       # Compile TypeScript to dist/
npm run typecheck   # Type-check without emitting
npm run dev         # Watch mode compilation
npm run start       # Run the CLI (node dist/cli.js)
npm run test        # Run tests (vitest)
```

## Usage

```bash
node dist/cli.js                              # Interactive TUI
node dist/cli.js init                         # Initialize workspace
node dist/cli.js add "title" -P high -t bug   # Quick add with options
node dist/cli.js list                         # List todos (stdout)
```

## Architecture

- `src/cli.tsx` - CLI entry point (meow parser, routes to TUI, init, or non-interactive)
- `src/app.tsx` - Root component with NavigationContext → TodoContext → GitContext
- `src/screens/` - MainList, AddTodo, EditTodo, Filter, Help screens
- `src/components/` - TodoItem, TodoList, PriorityBadge, TagList, StatusBar, Header, FormField
- `src/hooks/` - useNavigation, useTodos (useReducer), useGit
- `src/store/` - Zod schema, TodoStore (file I/O), KodoConfig (config management)
- `src/git/` - GitService (simple-git wrapper with debounced auto-commit)
- `src/init/` - InitWizard (interactive workspace initialization)
- `src/utils/` - colors, dates, id generation helpers
- `src/nonInteractive.ts` - `kodo add` and `kodo list` commands

## Data

- Config: `.kodo/config.json` (version, dataPath)
- Todo data: `.kodo/todos/default/todos.json` (git tracked)
- Git commits use `kodo:` prefix, filterable with `git log --grep="kodo:"`
