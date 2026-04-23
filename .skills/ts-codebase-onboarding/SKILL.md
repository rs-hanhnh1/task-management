---
name: ts-codebase-onboarding
description: "Quickly build a mental model of an unfamiliar TypeScript codebase using GitNexus and Serena MCP servers. Focused on Node.js, NestJS, React.js, and Next.js projects. Use this skill whenever you need to: onboard to a new or unfamiliar TypeScript project, explore a codebase for the first time, understand the architecture and structure of a project, map out API surfaces and execution flows, generate architecture documentation, or answer questions like 'what does this project do?', 'help me understand this codebase', 'explore this repo', 'onboard me to this project', 'walk me through this repo', or 'generate an architecture diagram'. Trigger this skill even if the user doesn't mention GitNexus or Serena by name — any request to explore, understand, or onboard to an unfamiliar Node.js, NestJS, React, or Next.js project should use it."
---

# Onboarding to a TypeScript Codebase with GitNexus + Serena

Systematically analyze an unfamiliar TypeScript codebase and produce a structured onboarding guide. This skill combines GitNexus (precomputed knowledge graph for architectural overview) with Serena (live LSP for exploring code and persisting knowledge) to go far beyond what file-browsing alone can achieve.

Focused on four TypeScript ecosystems: **Node.js**, **NestJS**, **React.js**, and **Next.js**.

**The general principle**: Use GitNexus to get the big picture (clusters, flows, API surface), then Serena to explore key files, detect conventions, and save what you learn for future sessions.

## Before You Start

1. **GitNexus**: Call `list_repos` to see what's indexed. If the repo isn't there, run `gitnexus analyze` via CLI first.
2. **Serena**: Call `check_onboarding_performed` → if not done, run `onboarding` to create structured memories (purpose, tech stack, conventions, test commands).

---

## Workflow: Four Phases

### Phase 1: Reconnaissance

Gather raw signals about the project without reading every file. Use Grep, Glob, and directory listing — not Read on every file. Read selectively only for ambiguous signals.

**1a. Directory structure snapshot**
- Serena: `list_dir({recursive: false})` → top-level structure
- Ignore: node_modules, dist, build, .next, .turbo, coverage, .git

**1b. Package manifest analysis**
Read `package.json` (root and any workspace packages) to extract:
- `dependencies` and `devDependencies` → framework and library fingerprinting
- `scripts` → dev server, build, test, lint commands
- `workspaces` → monorepo detection (also check for `pnpm-workspace.yaml`, `turbo.json`, `nx.json`, `lerna.json`)

**1c. Framework fingerprinting**
Detect which ecosystem(s) the project uses — a project may combine multiple:

| Signal | Framework |
|--------|-----------|
| `@nestjs/core` in deps, `nest-cli.json`, `src/app.module.ts` | **NestJS** |
| `next` in deps, `next.config.*`, `app/` or `pages/` directory | **Next.js** |
| `react` in deps, `src/App.tsx`, `vite.config.ts` or CRA setup | **React.js** (standalone SPA) |
| `express`/`fastify`/`koa` in deps, no framework-specific config | **Node.js** (vanilla server) |

**1d. Entry point identification**
- **NestJS**: `src/main.ts` → bootstrap function, `src/app.module.ts` → root module
- **Next.js**: `app/layout.tsx` (App Router) or `pages/_app.tsx` (Pages Router), `next.config.*`
- **React.js**: `src/main.tsx` or `src/index.tsx` → ReactDOM render root
- **Node.js**: `src/index.ts`, `src/server.ts`, `src/app.ts`, or `main` field in package.json

**1e. TypeScript configuration**
Read `tsconfig.json` (and any extended configs like `tsconfig.build.json`):
- `paths` aliases → how imports are resolved (`@/`, `@app/`, `@modules/`)
- `strict` mode and key compiler options
- `references` → project references in monorepos

**1f. Config and tooling detection**
Look for: `.eslintrc*` / `eslint.config.*`, `.prettierrc*`, `Dockerfile`, `docker-compose*`, `.github/workflows/`, `.env.example`, `jest.config.*`, `vitest.config.*`, `.husky/`, `lint-staged` in package.json

**1g. Test structure detection**
- **NestJS**: `*.spec.ts` files colocated with source, `test/` for e2e tests, `jest` or `vitest` config
- **Next.js**: `__tests__/`, `*.test.tsx`, `cypress/` or `playwright/` for e2e
- **React.js**: `*.test.tsx`, `*.spec.tsx`, `@testing-library/react` in deps
- **Node.js**: `*.test.ts`, `*.spec.ts`, `jest` or `vitest` or `mocha` in deps

### Phase 2: Architecture Mapping

Combine reconnaissance findings with GitNexus's knowledge graph for deeper insight.

**2a. GitNexus overview**
- Read `gitnexus://repo/{name}/context` → stats, file count, symbol count
- Read `gitnexus://repo/{name}/clusters` → functional areas with cohesion scores
- Read `gitnexus://repo/{name}/processes` → execution flows
- Read top 3–5 `process/{name}` resources → trace core flows step by step

**2b. Framework-specific architecture detection**

For **NestJS** projects:
- Module graph: find all `@Module()` decorators → map imports/exports/providers/controllers
- Dependency injection tree: identify services, repositories, guards, interceptors, pipes
- API style: REST controllers (`@Controller`) vs GraphQL resolvers (`@Resolver`) vs microservices (`@MessagePattern`)
- Middleware/guard/interceptor chain: global vs module-scoped vs route-scoped
- Database layer: TypeORM (`*.entity.ts`), Prisma (`schema.prisma`), Mongoose (`*.schema.ts`), or MikroORM

For **Next.js** projects:
- Router type: App Router (`app/` with `layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`) vs Pages Router (`pages/` with `_app.tsx`, `_document.tsx`)
- Rendering strategies: Server Components vs Client Components (`'use client'`), SSR (`getServerSideProps`), SSG (`getStaticProps`), ISR
- API routes: `app/api/` route handlers or `pages/api/` handlers
- Middleware: `middleware.ts` at root
- Data fetching: server actions, `fetch` with cache/revalidation, tRPC, React Query/SWR

For **React.js** (standalone SPA) projects:
- State management: Redux/RTK (`store.ts`, `*Slice.ts`), Zustand, Jotai, MobX, or Context API
- Routing: React Router (`routes.tsx`, `<BrowserRouter>`), TanStack Router
- Component organization: feature-based (`features/`) vs type-based (`components/`, `hooks/`, `utils/`)
- Data fetching: React Query/TanStack Query, SWR, RTK Query, Apollo Client (GraphQL)
- Styling: Tailwind, CSS Modules, styled-components, Emotion, Sass

For **Node.js** (vanilla server) projects:
- HTTP framework: Express, Fastify, Koa, Hono
- Routing structure: file-based routes, centralized router, controller pattern
- Middleware stack: auth, logging, CORS, rate limiting, error handling
- Database access pattern: raw queries, query builder (Knex), ORM (Prisma, TypeORM, Drizzle)

**2c. Architecture pattern**
- Monolith, monorepo (Turborepo, Nx, Lerna), or microservices
- Frontend/backend split or full-stack (Next.js, NestJS + React)
- API style: REST, GraphQL (Apollo, Nexus, type-graphql), tRPC, gRPC

**2d. Key directory mapping**
Map top-level directories to their purpose. Use framework-appropriate terminology:
```
# NestJS example
src/modules/      → Feature modules (auth, users, orders)
src/common/       → Shared guards, pipes, interceptors, decorators
src/config/       → Configuration module and env validation
prisma/           → Prisma schema and migrations

# Next.js App Router example
app/              → Route segments (layout, page, loading, error)
app/api/          → API route handlers
components/       → Shared React components
lib/              → Server utilities, DB clients, auth helpers

# React SPA example
src/features/     → Feature slices (auth, dashboard, settings)
src/components/   → Shared/reusable UI components
src/hooks/        → Custom React hooks
src/store/        → State management (Redux store, slices)
src/api/          → API client and endpoint definitions
```
Don't describe obvious directory names — `src/` doesn't need an explanation.

**2e. API surface (GitNexus)**
- `route_map()` → all API routes, handlers, consumers, and middleware
- `tool_map()` → all MCP/RPC tool definitions

**2f. Data flow — trace one request**
Using GitNexus processes and Serena symbol exploration, trace one request from entry to response. Use framework-specific terminology:

- **NestJS**: Request → Guard → Interceptor (before) → Pipe → Controller → Service → Repository → Response → Interceptor (after) → Exception Filter
- **Next.js**: Request → Middleware → Route Handler/Server Component → Data fetch (cache/revalidate) → Render → Response
- **React SPA**: User action → Event handler → State update (dispatch/mutation) → API call → Response → State update → Re-render
- **Node.js**: Request → Middleware chain → Route handler → Service/business logic → DB query → Response

### Phase 3: Convention Detection

Identify patterns the codebase already follows, using Serena's symbol overview and file reading.

**Naming conventions**
- File naming: kebab-case (`user-service.ts`), camelCase, PascalCase (`UserService.ts`)
- NestJS conventions: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.guard.ts`, `*.dto.ts`, `*.entity.ts`
- Next.js conventions: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `route.ts`
- React conventions: PascalCase components (`UserCard.tsx`), camelCase hooks (`useAuth.ts`)
- Barrel exports: `index.ts` re-exporting from directories

**Code patterns**
- Error handling: NestJS exception filters vs try/catch vs Result/Either types
- Validation: class-validator DTOs (NestJS), Zod schemas, Yup, io-ts
- Dependency injection: NestJS DI container vs manual wiring vs React Context
- Async patterns: async/await everywhere, RxJS Observables (NestJS), React Suspense
- Type strategy: strict types vs liberal `any`, branded types, discriminated unions, Zod inference

**Git conventions** (skip if history is unavailable or too shallow)
- Branch naming from recent branches
- Commit message style from recent commits
- PR workflow (squash, merge, rebase)

### Phase 4: Generate Outputs + Persist Knowledge

Produce artifacts and persist what you learned.

#### Output 1: Onboarding Guide

Print directly in the conversation. Keep it scannable in 2 minutes — details belong in the code, not the guide.

```markdown
# Onboarding Guide: [Project Name]

## Overview
[2–3 sentences: what this project does and who it serves]

## Tech Stack
| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | ... |
| Language | TypeScript | ... |
| Framework | NestJS / Next.js / React / Express | ... |
| Database | PostgreSQL / MongoDB / ... | ... |
| ORM | Prisma / TypeORM / Drizzle / ... | ... |
| Testing | Jest / Vitest / Playwright / ... | ... |
| Package Manager | npm / pnpm / yarn | ... |
| Monorepo | Turborepo / Nx / none | ... |

## Architecture
[Diagram or description of how components connect]
[For NestJS: module dependency graph]
[For Next.js: routing structure + rendering strategy map]
[For React SPA: component tree + state flow]

## Key Entry Points
- **[category]**: `path/` — description
- ...

## Directory Map
[Top-level directory → purpose mapping]

## Request Lifecycle
[Trace one API request from entry to response, framework-specific]

## Conventions
- [File naming pattern]
- [Error handling approach]
- [Validation strategy]
- [Type patterns]
- [Testing patterns]
- [Git workflow]

## Common Tasks
- **Run dev server**: `command`
- **Run tests**: `command`
- **Run linter**: `command`
- **Build for production**: `command`
- **Generate migration**: `command` (if applicable)
- **Generate NestJS resource**: `command` (if NestJS)

## Where to Look
| I want to... | Look at... |
|--------------|-----------|
| Add an API endpoint | `path/` |
| Add a UI page/route | `path/` |
| Add a new module/feature | `path/` |
| Add a shared component | `path/` |
| Add a custom hook | `path/` |
| Add a test | `path/` |
| Add middleware/guard | `path/` |
| Change config/env | `path/` |
| Add a DB migration | `path/` |
```

#### Output 2: Architecture Documentation (GitNexus)

Use the `generate_map` prompt to auto-generate a Mermaid architecture diagram and `ARCHITECTURE.md`.

#### Persist Knowledge (Serena)

- `write_memory` → persist architectural insights, key patterns, conventions, and gotchas
- These memories will be available in future sessions — save aggressively
- Especially persist: module graph, DI wiring, path aliases, rendering strategies, state management approach

---

## Important Guidelines

- **Don't read everything.** Reconnaissance should use Glob and Grep, not Read on every file. Read selectively only for ambiguous signals.
- **Start with the big picture.** Read clusters and processes before diving into individual files. This gives you the right mental framework.
- **Trace core flows end-to-end.** Read the top 3–5 processes to understand the main execution paths.
- **Verify, don't guess.** If a framework is detected from config but the code uses something different, trust the code.
- **Flag unknowns.** If a convention can't be confidently detected, say so. "Could not determine test runner" is better than a wrong answer.
- **Save everything important.** Use `write_memory` aggressively — architectural insights, conventions, key patterns, and gotchas.
- **Detect hybrid setups.** Next.js projects often embed API routes alongside React components. NestJS monorepos may include a React or Next.js frontend. Identify all the ecosystems at play, not just the primary one.

## Anti-Patterns to Avoid

- Listing every npm dependency — highlight only the ones that shape how you write code
- Describing obvious directory names — `src/` doesn't need an explanation
- Copying the README — the onboarding guide adds structural insight the README lacks
- Reading every file during reconnaissance — use targeted search
- Assuming a single framework — monorepos and full-stack projects often mix NestJS backend with React/Next.js frontend
- Ignoring `tsconfig.json` path aliases — these are critical for understanding import resolution

## Examples

### Example 1: Full onboarding of a NestJS monorepo

**User**: "Onboard me to this codebase" or "Help me understand this project"
**Action**: Run full 4-phase workflow → detect NestJS + React frontend in monorepo → map module graph, DI tree, API routes, frontend component structure → produce Onboarding Guide + Architecture docs
**Output**: Onboarding Guide in conversation, architecture diagram generated

### Example 2: Architecture documentation for a Next.js app

**User**: "Generate an architecture diagram for this project"
**Action**: Run Phases 1–2 → detect App Router vs Pages Router, rendering strategies, data fetching patterns → produce architecture docs via `generate_map`
**Output**: Mermaid architecture diagram and ARCHITECTURE.md

### Example 3: Quick exploration of a React SPA

**User**: "Walk me through this repo"
**Action**: Run full workflow → detect state management (Redux/Zustand), routing, component organization, API client setup → produce scannable guide
**Output**: Onboarding Guide focused on component tree, state flow, and data fetching

---

For detailed tool parameters and chaining patterns, read `references/tool-reference.md`.
