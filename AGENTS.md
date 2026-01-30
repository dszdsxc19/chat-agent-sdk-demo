# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Turborepo monorepo** for a **chat agent SDK** implementing a "Universal Bridge" pattern. The architecture enables dependency decoupling between the SDK, host applications (React/Vue), and Web Components, particularly around Zod schema validation.

**Key design principle**: The SDK uses duck typing and reference passing to avoid binding to specific Zod versions, allowing hosts to choose their own dependency versions while maintaining runtime compatibility.

## Commands

### Development
```bash
# Run all apps in development mode
pnpm dev

# Run specific playground
pnpm --filter react-playground dev
pnpm --filter vue-playground dev
```

### Building
```bash
# Build all packages and apps
pnpm build

# Build specific package
pnpm --filter sdk build
pnpm --filter web-component build
```

### Linting & Formatting
```bash
# Lint all packages
pnpm lint

# Format code
pnpm format
```

## Architecture

### Monorepo Structure
```
apps/playground/
  react-playground/    # React 19 + Vite test app
  vue-playground/      # Vue 3 + Vite test app
packages/
  sdk/                 # Core SDK (Universal Bridge)
  web-component/       # React-based web component (uses rolldown-vite)
```

### Universal Bridge Pattern (Core Architecture)

The SDK implements a **"Universal Bridge"** pattern to achieve dependency decoupling:

1. **Duck Typing Validation** (`packages/sdk/`): The SDK validates Zod schemas by checking for `.parse()` and `.safeParse()` methods rather than using `instanceof`. This allows compatibility across different Zod versions and bundler boundaries.

2. **Reference Passing**: Schema objects created by the host are passed by reference to the SDK and Web Components without cloning. The Web Component's UI library (e.g., assistant-ui) consumes these references directly.

3. **Peer Dependencies**: The SDK declares `zod` as a peer dependency, not a direct dependency. This avoids bundling Zod and allows hosts to use any Zod v4.x version.

### Data Flow

```
Host (Vue/React) → SDK (Bridge) → Web Component (React UI)
     │                  │                   │
  creates Zod       validates via      passes reference
  schema object     duck typing       to UI library
     │                  │                   │
  registers tool   stores reference   renders UI
```

See `产品技术方案.md` for detailed architecture documentation.

## Package Manager

This project uses **pnpm 8.15.6** as specified in `packageManager`. Always use `pnpm` commands, not `npm` or `yarn`.

## Build Tooling

- **Turborepo**: Task orchestration and caching
- **Vite**: Build tool for apps and SDK
- **rolldown-vite**: Used specifically in `packages/web-component/` as an alternative bundler

The web-component package overrides vite to use rolldown-vite via pnpm overrides.

## TypeScript Configuration

The monorepo uses shared TypeScript configs from `@repo/typescript-config`. There are separate configurations for:
- App targets (browser, DOM APIs)
- Node/library targets

All packages use strict mode with comprehensive type checking.

## Key Implementation Notes

When implementing the SDK bridge pattern:

1. **Never import/export Zod directly** from the SDK package
2. **Use duck typing checks** like `typeof schema.parse === 'function'`
3. **Store references** to schema objects, never clone or transform them
4. **Configure external dependencies** in vite.config.ts for the web-component build to prevent bundling peer dependencies

## Entry Points

| Package | Entry Point |
|---------|-------------|
| React Playground | `apps/playground/react-playground/src/main.tsx` |
| Vue Playground | `apps/playground/vue-playground/src/main.ts` |
| SDK | `packages/sdk/src/main.ts` (currently stub) |
| Web Component | `packages/web-component/src/main.tsx` |

## Current State

The project is in early development. The SDK currently contains only a placeholder `setupCounter` function. The actual Universal Bridge implementation needs to be built according to the architecture in `产品技术方案.md`.
