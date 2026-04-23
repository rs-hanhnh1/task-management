---
name: ts-code-understanding
description: "Understand how source code works — trace execution flows, explore features, and map symbol relationships using GitNexus and Serena MCP servers. Focused on TypeScript: Node.js, NestJS, React.js, and Next.js. Use this skill whenever you need to: understand how a feature, module, or symbol works end-to-end, trace execution paths through a codebase, explore how NestJS providers/guards/interceptors/pipes connect, understand React component trees and hook lifecycles, trace Next.js SSR/SSG/server-component data flows, answer questions like 'how does X work?', 'what calls Y?', 'who handles this route?', 'how is this hook used?', or map the full relationship graph around a piece of code. Trigger this skill even if the user doesn't mention GitNexus or Serena by name — any request to understand, trace, or explain how code works in a TypeScript/Node.js/NestJS/React/Next.js project should use it."
---

# Understanding TypeScript Source Code with GitNexus + Serena

This skill helps you understand how code works end-to-end in TypeScript projects (Node.js, NestJS, React.js, Next.js) by combining GitNexus (precomputed knowledge graph for architectural analysis) with Serena (live LSP for precise symbol navigation).

**The general principle**: Use GitNexus to understand the big picture (execution flows, clusters, relationships), then use Serena to read specific implementations. Never start by reading files blindly — always orient with GitNexus first.

---

## Before You Start

1. **GitNexus**: Call `list_repos` to see what's indexed. If the repo isn't indexed or is stale, ask the user to run `gitnexus analyze` via the CLI.
2. **Serena**: Call `check_onboarding_performed`. If onboarding hasn't been done, run `onboarding`. If it has, call `list_memories` and read memories relevant to the current task.
3. **Serena**: Call `get_current_config` to understand which tools and modes are active.

---

## Workflow Steps

### 1. Map the Landscape (GitNexus)

Start here — always. This prevents tunnel vision on a single file.

- `query({query: "<feature or concept>", include_content: false})` → find relevant execution flows and symbols
- Read `gitnexus://repo/{name}/clusters` → identify which functional area the concept belongs to
- Read `gitnexus://repo/{name}/processes` → see all named execution flows
- Read `gitnexus://repo/{name}/process/{processName}` → trace a specific flow step-by-step

### 2. Dive into Symbols (Serena)

- `get_symbols_overview({relative_path: "..."})` on key files identified by GitNexus → understand the file's class/function structure before reading bodies
- `find_symbol({name_path_pattern: "ClassName/methodName", include_body: true, include_info: true})` → read the actual implementation with docstrings
- `find_referencing_symbols({name_path_pattern: "SymbolName"})` → see how and where a symbol is used

### 3. Connect the Dots (GitNexus)

- `context({name: "symbolName"})` → get the 360-degree view: all callers, callees, field accesses, process participation, confidence scores
- Follow up with `context` on related symbols to trace the full call chain

### 4. Reflect Before Answering (Serena)

- Call `think_about_collected_information` → verify you have sufficient context before writing your answer

---

## Framework-Specific Patterns

### Node.js

**Tracing a request through a Node.js/Express service:**
1. `query({query: "route handler <endpoint>"})` → find the route definition and handler
2. `context({name: "routeHandler"})` → see middleware chain and downstream calls
3. `find_symbol({name_path_pattern: "routeHandler", include_body: true})` → read the implementation
4. Follow `context` on any service or utility it calls to trace the full request lifecycle

**Understanding a module's public API:**
1. `get_symbols_overview({relative_path: "src/module/index.ts"})` → see all exports
2. `find_symbol({name_path_pattern: "ExportedFunction", include_body: true, include_info: true})` → read each export

---

### NestJS

NestJS has a dependency injection container, decorators, and lifecycle hooks that GitNexus's relationship graph is well-suited for.

**Tracing a request through a NestJS controller → service:**
1. `query({query: "<endpoint or feature name>"})` → find the controller method
2. `context({name: "ControllerMethod"})` → see what services it calls (CALLS edges) and what guards/interceptors are applied (look for IMPORTS of guard/interceptor classes)
3. `find_symbol({name_path_pattern: "ControllerClass/method", include_body: true})` → read the full handler
4. `context({name: "ServiceClass"})` → see all methods and what repositories/external services it calls
5. `find_symbol({name_path_pattern: "ServiceClass/method", include_body: true})` → read the service method

**Understanding a Guard or Interceptor:**
1. `find_symbol({name_path_pattern: "GuardName", include_body: true, include_info: true})` → read `canActivate` implementation
2. `find_referencing_symbols({name_path_pattern: "GuardName"})` → see which controllers/methods use this guard
3. `context({name: "GuardName"})` → see all dependencies injected into the guard

**Understanding a NestJS module's wiring:**
1. `find_symbol({name_path_pattern: "SomeModule", include_body: true})` → read the `@Module({})` decorator to see `providers`, `imports`, `exports`
2. For each provider: `context({name: "ProviderClass"})` → understand its dependencies and dependents

**Tracing DTO validation flow:**
1. `query({query: "validation <endpoint>"})` → find where ValidationPipe is applied
2. `find_symbol({name_path_pattern: "DtoClass", include_body: true})` → read class-validator decorators
3. `find_referencing_symbols({name_path_pattern: "DtoClass"})` → see which handlers accept this DTO

---

### React.js

**Tracing a component's data flow:**
1. `query({query: "<component name or feature>"})` → find the component and related hooks
2. `context({name: "ComponentName"})` → see all hooks it uses (CALLS), contexts it reads (IMPORTS), and child components it renders
3. `find_symbol({name_path_pattern: "ComponentName", include_body: true})` → read the render logic
4. For custom hooks: `context({name: "useHookName"})` → see all state, effects, and what calls this hook
5. `find_symbol({name_path_pattern: "useHookName", include_body: true})` → read the full hook implementation

**Understanding a Context Provider:**
1. `find_symbol({name_path_pattern: "SomeContext", include_body: true})` → read the context definition and default value
2. `find_referencing_symbols({name_path_pattern: "SomeContext"})` → find all consumers and the Provider location
3. `find_symbol({name_path_pattern: "SomeProvider", include_body: true})` → read state management logic in the provider

**Tracing a state management flow (Zustand/Redux/Context):**
1. `query({query: "store <feature>"})` → find the store/slice definition
2. `context({name: "storeOrSliceName"})` → see all actions and selectors
3. `find_referencing_symbols({name_path_pattern: "useStoreName"})` → see all components consuming this store
4. `find_symbol({include_body: true})` on key actions to read mutation logic

---

### Next.js

Next.js has a hybrid architecture (Server Components, Client Components, API routes, middleware) that requires careful tracing.

**Understanding a page's data fetching:**
1. `query({query: "page <route>"})` → find the page component
2. `find_symbol({name_path_pattern: "PageComponent", include_body: true})` → read the component — look for `async` (Server Component) or `"use client"` directive
3. If Server Component: trace `fetch()` calls or direct DB/service calls
4. If it uses `generateStaticParams` or `generateMetadata`: `find_symbol({include_body: true})` on those functions
5. `context({name: "PageComponent"})` → see all imported server actions, components, and utilities

**Tracing a Server Action:**
1. `query({query: "server action <feature>"})` → find the `"use server"` file or inline action
2. `find_symbol({name_path_pattern: "actionName", include_body: true})` → read the action
3. `find_referencing_symbols({name_path_pattern: "actionName"})` → see which Client Components call this action
4. `context({name: "actionName"})` → see all service/DB calls the action makes

**Tracing an API Route handler:**
1. `query({query: "API route <path>"})` → find the `route.ts` or `pages/api/*.ts` file
2. `get_symbols_overview({relative_path: "app/api/..."})` → see all HTTP method handlers (GET, POST, etc.)
3. `find_symbol({name_path_pattern: "GET", include_body: true})` (or POST/PUT/DELETE) → read the handler
4. `context({name: "handlerFunction"})` → trace downstream service/DB calls

**Understanding middleware:**
1. `find_file({pattern: "middleware.ts"})` → locate Next.js middleware
2. `find_symbol({include_body: true})` → read the `middleware` export
3. `context({name: "middleware"})` → see all utilities it imports

---

## When to Use Which Tool for "Find References"

| Goal | Tool | Why |
|------|------|-----|
| Full relationship graph (callers, callees, imports, extends, implements) | GitNexus `context` | Architectural view with confidence scores and process participation |
| Precise file locations with code snippets | Serena `find_referencing_symbols` | Reads actual usage code with line numbers |
| Raw graph queries (transitive callers, inheritance chains) | GitNexus `cypher` | Power queries when `context` isn't enough |

**Best practice**: Use GitNexus `context` first to get the full map, then Serena `find_referencing_symbols` to read specific call sites that matter.

---

## Tool Chain Summary

```
check_onboarding_performed → list_memories (read relevant ones)
→ list_repos → READ gitnexus://repo/{name}/context
→ query({query: "concept", task_context: "...", goal: "..."})
→ READ gitnexus://repo/{name}/clusters (identify functional area)
→ READ gitnexus://repo/{name}/process/{name} (trace flow)
→ context({name: "key_symbol"}) (360-degree view)
→ get_symbols_overview (on key files)
→ find_symbol({include_body: true, include_info: true})
→ find_referencing_symbols (on symbols you need usages for)
→ think_about_collected_information
→ [answer the user]
```

---

## Important Guidelines

- **Never skip the landscape step.** Always start with GitNexus `query` and `clusters` before reading code. This prevents spending time reading wrong files.
- **Orient before reading.** Use `get_symbols_overview` before `find_symbol` — understand a file's structure before reading individual bodies.
- **Use task context in queries.** Pass `task_context` and `goal` to GitNexus `query` for better ranking.
- **Follow the TypeScript module boundary.** In NestJS, start from the Module. In Next.js, start from the page/layout. In React, start from the component tree root.
- **Use Serena's thinking tools.** Call `think_about_collected_information` before answering — it helps surface gaps in your understanding.
- **Check GitNexus index freshness.** Read `gitnexus://repo/{name}/context` to see when the index was last built. If stale, note this in your answer.
- **Save important discoveries.** If you learn something significant about the codebase (architecture patterns, non-obvious conventions, gotchas), use `write_memory` so it's available in future sessions.
- **Disambiguate aggressively.** If `context` or `find_symbol` returns multiple matches, use `file_path` or `uid` to be precise.

For detailed tool parameters and all GitNexus resources, see `references/tool-reference.md`.
