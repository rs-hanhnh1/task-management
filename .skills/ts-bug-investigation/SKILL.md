---
name: ts-bug-investigation
description: "Investigate bugs, trace errors to root causes, and implement fixes using GitNexus and Serena MCP servers. Focused on TypeScript: Node.js, NestJS, React.js, and Next.js. Use this skill whenever you need to: debug an error or unexpected behavior, trace an error message back to its source, find the root cause of a bug, understand why something is failing, fix a bug after diagnosis, investigate test failures (Jest/Vitest), debug NestJS dependency injection errors, trace React hook bugs, debug Next.js SSR/hydration issues, investigate async/Promise failures, or track down memory leaks. Trigger this skill even if the user doesn't mention GitNexus or Serena by name — any serious debugging, error investigation, root cause analysis, or test failure investigation task in a TypeScript/Node.js/NestJS/React/Next.js project should use it."
---

# Bug Investigation: Root Cause Analysis & Fix — TypeScript / Node.js / NestJS / React / Next.js

This skill guides you through tracing an error to its source and implementing a fix, combining:
- **GitNexus** — precomputed knowledge graph for tracing execution flows and blast radius
- **Serena** — live LSP for reading code and making precise edits
- **Context7** — live library documentation for diagnosing third-party errors

**Core principle**: Use GitNexus to find suspicious symbols and trace execution flows, Serena to read implementations and apply fixes, and Context7 to look up library-specific behavior when the error involves an external dependency.

---

## Before You Start

1. **GitNexus**: Call `list_repos` — if repo isn't indexed or is stale, index it first via `gitnexus analyze`.
2. **Serena**: Call `check_onboarding_performed` — if not done, run `onboarding`. If done, read relevant memories for the current task.
3. **Serena**: Call `get_current_config` to understand active tools/modes.
4. **Context7** (if error involves a library): Call `resolve-library-id` with the library name before diving into code.

---

## Workflow Steps

### 1. Classify the bug

Before searching, classify the error type — it determines your entry point:

| Error type | Entry point |
|---|---|
| Runtime exception with stack trace | Step 2 → search error message |
| Wrong behavior, no exception | Step 2 → search symptom / affected feature |
| TypeScript compile error | Step 2 → search symbol name |
| Test failure | → See [Test Failures](#test-failures) |
| Framework-specific error | → See [Framework Patterns](#framework-specific-patterns) |
| External library error | → Start with Context7 |
| Performance / memory | → See [Performance Bugs](#performance-bugs) |

---

### 2. Search for the error (GitNexus)

```
query({query: "<error message or symptom>", task_context: "debugging"})
→ context({name: "suspectedSymbol"})
```

**Tips:**
- Strip dynamic parts from error messages: `"Cannot read properties of undefined (reading 'id')"` → search `"read properties undefined"`
- For TypeScript errors: search the type name, not the full error
- For NestJS DI errors: search the provider/module name — see [NestJS Patterns](#nestjs)

---

### 3. Trace the execution path (GitNexus + Serena)

```
READ gitnexus://repo/{name}/process/{processName}   ← full execution flow
→ find_symbol({include_body: true})                 ← read each suspect
→ find_referencing_symbols                           ← check callers
```

For deep call chains:
```
cypher({query: "MATCH path = (s)-[:CodeRelation*1..4 {type:'CALLS'}]->(t:Function {name:'X'}) RETURN ..."})
impact({target: "suspectedSymbol", direction: "downstream"})
```

---

### 4. Look up library behavior if needed (Context7)

If the error stack trace points to a third-party library (NestJS, Prisma, React Query, Next.js, etc.):

```
resolve-library-id({libraryName: "nestjs"})
→ get-library-docs({context7CompatibleLibraryID: "/nestjs/nest", topic: "dependency injection"})
```

Use this to understand whether the behavior is a bug in your code, a misconfiguration, or an undocumented library constraint.

---

### 5. Verify your understanding (Serena)

```
think_about_collected_information   ← do you have enough to diagnose?
think_about_task_adherence          ← are you solving the right problem?
```

---

### 6. Implement the fix (Serena)

```
find_symbol({include_body: true})   ← always read before editing
→ replace_symbol_body               ← apply fix
→ execute_shell_command             ← run tests
→ think_about_whether_you_are_done
```

**Test commands by framework:**
```bash
# Node.js / NestJS
npx jest --testPathPattern="<file>" --verbose
npx jest --coverage

# React (Vite / CRA)
npx vitest run <file>
npx jest --testEnvironment=jsdom

# Next.js
npx jest --testPathPattern="<file>"
npx next build   # catch SSR/build-time errors
```

---

### 7. Verify fix scope (GitNexus)

```
detect_changes({scope: "unstaged"})
```

Confirm the fix only touches expected symbols. If the scope is wider than expected, reconsider the approach.

---

## Framework-Specific Patterns

### NestJS

**Dependency Injection errors** (`Nest can't resolve dependencies of X`)
- Search: provider class name → `context({name: "ProviderClass"})`
- Check: is it decorated with `@Injectable()`? Is it in the correct module's `providers`?
- Check: circular dependency → use `forwardRef(() => X)` if needed
- Context7: `get-library-docs({topic: "providers module imports"})`

**Guard / Interceptor / Pipe not firing**
- Search: guard/interceptor class → check `find_referencing_symbols` to verify it's registered
- Is it registered at controller level, module level, or globally?
- Check execution order: Guards → Interceptors → Pipes → Handler

**Module not found / incorrect scope**
- Read `gitnexus://repo/{name}/processes` to find module boundaries
- Use `query({query: "module imports providers"})` to trace which modules expose which providers

**Common shell commands:**
```bash
npx nest start --watch
npx jest --verbose
```

---

### React.js

**Hook rule violations** (`Invalid hook call`)
- Hooks must be called at top level, not inside conditions/loops/callbacks
- Search: component name → `find_symbol({include_body: true})` → check hook call sites

**Stale closure bugs**
- `useEffect` / `useCallback` with missing deps → stale values inside handlers
- Look for `[]` dependency arrays on effects that reference state/props
- Fix: add to deps, or use `useRef` for values you want to capture without re-running

**Infinite re-render loops**
- Search symptom: `query({query: "setState useEffect re-render"})`
- Trace: which state update triggers which effect which triggers the same state update
- Fix: add condition inside effect, stabilize object/array deps with `useMemo`/`useCallback`

**Context value causing all consumers to re-render**
- `find_referencing_symbols` on the Context object → find all consumers
- Fix: split context, memoize value object

**Common shell commands:**
```bash
npx vitest run --reporter=verbose
npx react-scripts test --watchAll=false
```

---

### Next.js

**Hydration mismatch** (`Hydration failed because the server rendered HTML didn't match`)
- Root cause: code that differs between server and client (e.g., `window`, `Date.now()`, `Math.random()`, browser-only APIs)
- Search: component in error → `find_symbol({include_body: true})` → look for client-only APIs used at render time
- Fix: wrap in `useEffect`, use `dynamic(() => import(...), {ssr: false})`, or guard with `typeof window !== 'undefined'`

**Server Component / Client Component boundary errors**
- `"use client"` missing when using hooks or browser APIs
- `"use server"` actions misused as regular functions
- Search: component name → check file for `"use client"` directive

**`getServerSideProps` / `getStaticProps` errors**
- These run only on the server — `window`, `localStorage`, etc. are not available
- Check: are you importing a client-only module at the top of a page?

**API route errors (App Router)**
- Search: route handler file → `find_symbol({include_body: true})`
- Check: correct HTTP method export (`GET`, `POST`...), correct `NextRequest`/`NextResponse` usage

**Common shell commands:**
```bash
npx next build              # catches SSR/RSC errors at build time
npx next dev                # dev server with detailed error overlay
npx jest --testPathPattern="__tests__"
```

---

### Node.js (general)

**Unhandled Promise rejections**
- Search: `query({query: "async await unhandled rejection"})` → trace which async function isn't awaited
- Look for fire-and-forget calls (`someAsync()` without `await`)
- Fix: add `await`, or `.catch()` handler

**Event loop blocking**
- Symptom: requests queue up, server becomes unresponsive
- Look for CPU-heavy sync operations (large JSON.parse, complex loops) in request handlers
- Fix: offload to worker thread or break with `setImmediate`

**Memory leaks**
- Look for event listener accumulation: `on(...)` in request handlers without `off(...)`
- Global caches / Maps that grow unboundedly
- Closures holding references to large objects

---

## Test Failures

### Jest / Vitest

**Test fails with wrong value**
1. `find_symbol({include_body: true})` on the test → understand setup
2. `find_symbol` on the function under test → check actual implementation
3. Check: is the mock correct? Does it match the real interface?

**"Cannot find module" in tests**
- Check `jest.config.ts` moduleNameMapper / moduleDirectories
- NestJS: check that `@nestjs/testing` and all providers are properly imported

**Tests pass in isolation but fail together**
- Shared state: global variables, uncleaned DB state, module-level mocks
- Check `beforeEach`/`afterEach` cleanup
- NestJS: ensure `app.close()` is called in `afterAll`

**Async test timeouts**
- Increase `jest.setTimeout(10000)` for integration tests
- Check: is `done()` callback called? Is the returned Promise resolving?

**Common shell commands:**
```bash
npx jest --testPathPattern="auth" --verbose --no-coverage
npx jest --watch
npx vitest run --reporter=verbose
npx jest --runInBand   # run serially to debug shared state
```

---

## Performance Bugs

### React
- **Unnecessary re-renders**: use React DevTools Profiler → find components that re-render without prop changes → add `React.memo`, `useMemo`, `useCallback`
- **Large bundle**: dynamic imports (`next/dynamic`, `React.lazy`) for heavy components

### Node.js / NestJS
- **Slow DB queries**: check N+1 patterns (loop with individual queries) → use batch queries or `include` in Prisma/TypeORM
- **Memory growth**: look for event listener leaks, unbounded caches

---

## Tool Chain Summary

```
classify bug type
→ [if library error] resolve-library-id → get-library-docs (Context7)
→ query({query: "error symptom", task_context: "debugging"})
→ context({name: "suspect"})
→ READ gitnexus://repo/{name}/process/{processName}
→ find_symbol({include_body: true}) on each suspect
→ find_referencing_symbols on error handler
→ think_about_collected_information
→ think_about_task_adherence
→ replace_symbol_body (fix)
→ execute_shell_command (run tests)
→ detect_changes (verify scope)
→ think_about_whether_you_are_done
```

---

## Important Guidelines

- **Never edit code without reading it first.** Always use `find_symbol(include_body: true)` before modifying anything.
- **Use Serena's thinking tools.** Call `think_about_collected_information` before editing, `think_about_task_adherence` before writing, and `think_about_whether_you_are_done` after implementing.
- **Use Context7 for library errors.** Don't guess at framework behavior — look it up.
- **Check GitNexus index freshness.** Read `gitnexus://repo/{name}/context` to see when the index was last built. Reindex if stale.
- **Prefer symbolic edits over file-level edits.** Use Serena's `replace_symbol_body`, `insert_after_symbol`, `insert_before_symbol`.
- **Verify every change.** After any edit, run tests via `execute_shell_command` and check scope via `detect_changes`.
- **Save discoveries to memory.** Use Serena's `write_memory` for important findings (e.g., `debug/auth/jwt-expiry-issue`).

For detailed tool parameters and chaining patterns, read `references/tool-reference.md`.
