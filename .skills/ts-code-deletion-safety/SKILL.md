---
name: ts-code-deletion-safety
description: "Determine what breaks before modifying or removing existing TypeScript code (Node.js, NestJS, React.js, Next.js), using GitNexus and Serena MCP servers. Use this skill to: check deletion safety for functions, classes, hooks, components, services, controllers, providers, guards, interceptors, or modules; assess impact of removing functionality; find all dependents before removal; check if API routes, NestJS endpoints, React components/hooks, or Next.js pages/layouts/middleware can be safely deleted. Trigger for questions like 'is it safe to delete X?', 'what breaks if I remove Y?', 'can I deprecate this?', 'is this hook still used?', or 'can I remove this guard?'. Trigger even without GitNexus/Serena mentioned — any deletion, removal, deprecation, or modification safety task in TypeScript projects should use it."
---

# Code Deletion Safety — TypeScript: Node.js · NestJS · React.js · Next.js

This skill helps you determine what breaks before modifying or removing code in TypeScript projects, combining **GitNexus** (precomputed knowledge graph for deep dependency analysis) with **Serena** (live LSP for precise call-site inspection).

**Core principle**: Use GitNexus to map all dependents with deep traversal (deletions are irreversible), then use Serena to read each dependent and plan migration before touching anything.

---

## Before You Start

1. **GitNexus** — Call `list_repos` to see what's indexed. Read `gitnexus://repo/{name}/context` to check staleness. If the index is stale or missing, tell the user to run `gitnexus analyze` in the CLI first.
2. **Serena** — Call `check_onboarding_performed`. If not done, run `onboarding`. If done, call `list_memories` and read any relevant memories for the module being deleted.
3. **Serena** — Call `get_current_config` to confirm active tools and modes.

---

## Core Workflow

### Step 1 — Identify the deletion target precisely

Before running any impact query, make sure you know exactly what is being deleted:

- **Single symbol** (function, class, method, hook, component) → get its UID:
  ```
  find_symbol({ name_path_pattern: "SymbolName", include_body: true })
  ```
- **Entire module/file** → list all top-level exports first:
  ```
  get_symbols_overview({ relative_path: "path/to/file.ts", depth: 1 })
  ```
  Then run `impact` for each exported symbol.
- **NestJS provider/service** registered in a module → also check the `@Module` decorator to see which modules import it.
- **React component or hook** → check both named and default export references.
- **Next.js page or route handler** → check both the file system route and any `import` references in layouts, templates, and `Link` components.

---

### Step 2 — Full upstream blast radius (GitNexus)

Run impact with high depth — deletions are irreversible:

```
impact({
  target: "SymbolName",
  direction: "upstream",
  maxDepth: 5,
  includeTests: true,
  relationTypes: ["CALLS", "IMPORTS", "EXTENDS", "IMPLEMENTS", "HAS_METHOD", "OVERRIDES"]
})
```

Read the output carefully:
- `risk: CRITICAL` → stop and plan migration before proceeding
- `byDepth.d=1` → these **will break** immediately
- `byDepth.d=2` → these are **likely affected**
- `byDepth.d=3+` → **may need testing**
- `affected_processes` → execution flows that will be disrupted
- `affected_modules` → which NestJS modules / Next.js route groups / Node packages are involved

If the `impact` output is insufficient, run a Cypher query for the full transitive chain:

```cypher
MATCH path = (s)-[:CodeRelation*1..5 {type: 'CALLS'}]->(target {name: "SymbolName"})
RETURN [n IN nodes(path) | n.name] AS chain, length(path) AS depth
ORDER BY depth ASC
```

---

### Step 3 — Inspect each call site (Serena)

For every d=1 dependent from Step 2:

```
find_referencing_symbols({ name_path_pattern: "SymbolName" })
```

For each reference, use `find_symbol({ include_body: true })` on the caller to answer:
- Does the caller **only** use this symbol, or does it use other things too?
- Can the caller tolerate `undefined` / be updated to use a replacement?
- Is the caller a test file? (tests will break and may need deletion or rewriting)
- Is the caller itself exported? (it becomes a transitive dependent at d=2)

---

### Step 4 — Framework-specific checks

Jump to the section that matches what you're deleting.

---

#### NestJS — Services, Providers, Guards, Interceptors, Pipes

**If deleting a `@Injectable()` service or provider:**

1. Find all modules that declare or import it:
   ```cypher
   MATCH (m:Class)-[:CodeRelation {type: 'ACCESSES'}]->(s:Class {name: "MyService"})
   WHERE m.name ENDS WITH 'Module'
   RETURN m.name, m.filePath
   ```
2. Find all controllers and other services that inject it via constructor:
   ```
   find_referencing_symbols({ name_path_pattern: "MyService" })
   ```
   Look for constructor params: `constructor(private readonly myService: MyService)`.
3. Check if it is re-exported from a shared module (`exports: [MyService]`). If yes, all modules that import that shared module are affected.
4. Check if it is used in `app.module.ts` or registered as a global provider.

**If deleting a `@Guard()` / `@Interceptor()` / `@Pipe()`:**

1. Search for decorator usages at controller and method level:
   ```
   search_for_pattern({ pattern: "MyGuard|MyInterceptor|MyPipe", glob: "**/*.ts" })
   ```
2. Check if it is registered globally via `APP_GUARD`, `APP_INTERCEPTOR`, or `APP_PIPE` in any module — global registration means every route in the app is affected.
3. Check for controller-level and method-level decorators separately.

**If deleting a NestJS module:**

1. Find all modules that import it:
   ```
   find_referencing_symbols({ name_path_pattern: "MyModule" })
   ```
2. Read its `exports` array — everything exported becomes unavailable to importers.
3. Check if it re-exports other modules (transitive exports).

**If deleting a NestJS controller route (`@Get`, `@Post`, etc.):**

→ Continue to the **API route deletion** section.

---

#### React.js — Components, Hooks, Contexts, HOCs

**If deleting a React component:**

1. Run GitNexus impact:
   ```
   impact({ target: "MyComponent", direction: "upstream", maxDepth: 4, includeTests: true })
   ```
2. Search for JSX usages GitNexus may miss:
   ```
   search_for_pattern({ pattern: "<MyComponent", glob: "**/*.{tsx,jsx}" })
   ```
3. Check for lazy-loaded references:
   ```
   search_for_pattern({ pattern: "import.*MyComponent|lazy.*MyComponent", glob: "**/*.{ts,tsx}" })
   ```
4. Check for usage in Storybook stories (`*.stories.tsx`).
5. Check if the component is registered in a routing config (React Router `<Route component={MyComponent} />`).

**If deleting a custom hook (`useXxx`):**

1. Run impact:
   ```
   impact({ target: "useMyHook", direction: "upstream", maxDepth: 4, includeTests: true })
   ```
2. Search for direct call sites:
   ```
   search_for_pattern({ pattern: "useMyHook\\(", glob: "**/*.{ts,tsx}" })
   ```
3. Check if the hook is re-exported from a barrel file (`index.ts`). If yes, all importers of that barrel are potentially affected — read the barrel's exports and trace from there.
4. Check if the hook wraps a Context (`useContext(MyContext)`) — deleting it may leave context consumers orphaned.

**If deleting a React Context:**

1. Find all `useContext` and Provider usages:
   ```
   search_for_pattern({ pattern: "MyContext", glob: "**/*.{ts,tsx}" })
   ```
2. Find where the Provider wraps the tree — check if it's at root layout, a route boundary, or a specific subtree.
3. Components that call `useContext(MyContext)` without a Provider will silently receive the default value (or `undefined`) — these cause runtime bugs, not compile errors. Audit every consumer.

**If deleting a Higher-Order Component (HOC):**

1. Search for wrapping and compose patterns:
   ```
   search_for_pattern({ pattern: "withMyHoc\\(|withMyHoc,", glob: "**/*.{ts,tsx}" })
   ```
2. Check for usage in `connect()` patterns (Redux) or other composition utilities.

---

#### Next.js — Pages, Layouts, Middleware, Server Actions, API Routes

**If deleting a page or layout (`page.tsx`, `layout.tsx`, `template.tsx`):**

1. Derive the route from the file path (e.g., `app/dashboard/settings/page.tsx` → `/dashboard/settings`).
2. Search for `Link` components pointing to this route:
   ```
   search_for_pattern({ pattern: "href=['\"]?/dashboard/settings", glob: "**/*.{ts,tsx}" })
   ```
3. Search for programmatic navigation:
   ```
   search_for_pattern({ pattern: "push\\(['\"]?/dashboard/settings|redirect\\(['\"]?/dashboard/settings", glob: "**/*.{ts,tsx}" })
   ```
4. Check for a `layout.tsx` at this level — deleting it removes the layout for **all child routes** in the segment. Find all child pages:
   ```
   find_file({ pattern: "app/dashboard/settings/**/*.tsx" })
   ```
5. Check `next.config.js` for rewrites or redirects pointing to this route.

**If deleting `middleware.ts`:**

1. Read the middleware file to understand what it enforces (auth, redirects, locale, feature flags).
2. Read the `matcher` config — it explicitly lists the routes the middleware runs on.
3. All matched routes will lose that protection or transformation after deletion.
4. Check for `NextResponse.redirect` and `NextResponse.rewrite` calls — these affect downstream routes.

**If deleting a Server Action (`"use server"`):**

1. Find all `action={}` props and `startTransition` usages:
   ```
   search_for_pattern({ pattern: "myAction\\(|action=\\{myAction", glob: "**/*.{ts,tsx}" })
   ```
2. Check `<form action={myAction}>` usages in Server Components.
3. Server Actions can be called from Client Components too — check `"use client"` files as well.

**If deleting a Next.js API Route (`route.ts` / `pages/api/*.ts`):**

→ Continue to the **API route deletion** section, using the file-system path as the route identifier.

---

#### Node.js — Utility Modules, Shared Libraries, Event Emitters

**If deleting a utility function or shared module:**

1. Run impact across all packages (monorepo):
   ```
   impact({ target: "myUtil", direction: "upstream", maxDepth: 5, includeTests: true })
   ```
2. Check barrel re-exports — if `index.ts` re-exports this, every barrel importer is a transitive dependent:
   ```
   search_for_pattern({ pattern: "export.*myUtil|export.*from.*myUtil", glob: "**/index.ts" })
   ```
3. Check for dynamic `require()` calls that static analysis may miss:
   ```
   search_for_pattern({ pattern: "require\\(['\"].*myModule", glob: "**/*.{ts,js}" })
   ```

**If deleting an EventEmitter event or listener:**

1. Find all `emit`, `on`, and `once` call sites — these are **not tracked by the knowledge graph**:
   ```
   search_for_pattern({ pattern: "emit\\(['\"]eventName|on\\(['\"]eventName|once\\(['\"]eventName", glob: "**/*.ts" })
   ```
2. Always use `search_for_pattern` for event-based deletions — never rely on `impact` alone.

---

### Step 5 — API route deletion (all frameworks)

Use this for any HTTP endpoint deletion (NestJS controllers, Next.js route handlers, Express routes):

```
api_impact({ route: "/api/your-route" })
route_map({ route: "/api/your-route" })
shape_check({ route: "/api/your-route" })
```

Check for:
- **Internal consumers**: other backend services or BFF layers calling this route
- **Frontend consumers**: `fetch('/api/your-route')`, `axios.get(...)`, React Query / SWR cache keys referencing this path
- **External consumers**: check Swagger/OpenAPI docs and ask the team if external clients depend on this
- **Middleware and guards** attached to this specific route — they may need cleanup too
- **TypeScript response types**: check if any frontend type is inferred from this route's response shape

---

### Step 6 — Assess test breakage

From the `impact` result, identify all test files in the affected set. For each:

```
find_symbol({ name_path_pattern: "describe", relative_path: "path/to/spec.ts", include_body: true })
```

Decide for each test file:
- **Delete** — if the file tests only the deleted symbol
- **Update** — if the file tests a caller that needs to be updated
- **Keep** — if the test exercises a different code path not affected by the deletion

---

### Step 7 — Reason and plan before acting

```
think_about_collected_information()
```

Produce a migration checklist **before touching any code**:

```markdown
## Deletion Safety Checklist: <SymbolName>

### Risk Level: <LOW / MEDIUM / HIGH / CRITICAL>

### Direct dependents that WILL break (d=1)
- [ ] `path/to/file.ts` — <what needs to change>

### Indirect dependents that are LIKELY affected (d=2)
- [ ] `path/to/file.ts` — <what needs to change>

### Test files to update or delete
- [ ] `path/to/spec.ts` — <delete / rewrite>

### API consumers (if applicable)
- [ ] <frontend component or external service>

### Order of operations
1. Update/migrate all d=1 dependents
2. Update/migrate all d=2 dependents
3. Update or delete test files
4. Delete the target symbol/file
5. Run full test suite: `npx jest --passWithNoTests`
6. Run TypeScript compiler: `npx tsc --noEmit`
```

Save the checklist to memory for multi-session work:
```
write_memory({ path: "deletions/<SymbolName>", content: "..." })
```

---

### Step 8 — Execute and verify

Follow the checklist order strictly — update all dependents before deleting the target.

After deletion, run the TypeScript compiler:
```
execute_shell_command({ command: "npx tsc --noEmit" })
```

Then the test suite:
```
execute_shell_command({ command: "npx jest --passWithNoTests" })
```

Verify the diff is exactly what was planned:
```
detect_changes({ scope: "unstaged" })
```

```
think_about_whether_you_are_done()
summarize_changes()
```

---

## Quick Reference — Risk Signals

| Signal | What it means |
|--------|--------------|
| `risk: CRITICAL` | Many dependents or deep chains — full migration plan required |
| Re-exported from barrel `index.ts` | All barrel importers are transitive dependents; trace them all |
| `APP_GUARD` / `APP_INTERCEPTOR` / `APP_PIPE` | Global NestJS registration — every route is affected |
| NestJS shared module `exports: [...]` | All modules importing this shared module are affected |
| Next.js `layout.tsx` deletion | All child routes in the segment lose their layout |
| Next.js `middleware.ts` deletion | All matched routes lose auth/redirect/locale logic |
| React Context deletion | Silent runtime failures if consumers lack a Provider |
| `emit('event')` / `on('event')` | Dynamic — not tracked by static analysis; always use `search_for_pattern` |
| External API consumers | Cannot be caught by static analysis — check docs and ask the team |

---

## Important Guidelines

- **Go deeper for deletions.** Always use `maxDepth: 5` — one missed transitive dependent can cause a production incident.
- **Always include tests.** Use `includeTests: true` — tests will break and need deletion or rewriting.
- **Check barrel re-exports.** An `index.ts` re-export makes every barrel importer a transitive dependent. These don't always appear at d=1.
- **Use `search_for_pattern` for dynamic patterns.** `require()`, `emit()`, JSX `<Component>`, `Link href=`, `router.push`, `form action=` are not always tracked by the knowledge graph.
- **Plan migration before deleting.** Update all dependents first, then delete. Never delete first.
- **Run `tsc --noEmit` as the final check.** TypeScript's compiler is the ground truth for type-level breakage.
- **Save multi-session plans.** Use `write_memory` to persist your checklist if the migration spans multiple sessions.

For detailed tool parameters and Cypher query patterns, read `references/tool-reference.md`.
