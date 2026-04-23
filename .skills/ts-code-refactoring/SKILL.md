---
name: ts-code-refactoring
description: "Safely rename or restructure TypeScript code across a codebase using GitNexus and Serena MCP servers. Focused on Node.js, NestJS, React.js, and Next.js. Use this skill to: rename functions, classes, hooks, components, services, controllers, or providers, refactor structure, extract methods or components, remove duplication, apply SOLID principles, refactor React hooks, restructure NestJS modules, reorganize Next.js routes. Triggers: 'rename X to Y', 'refactor this module', 'this component is too long', 'clean up this code', 'reduce duplication', 'extract into a custom hook', 'split this NestJS service', 'reorganize routes'. Trigger even without mentioning GitNexus or Serena — any rename, refactoring, or restructuring task in TypeScript projects should use it."
---

# TypeScript Refactoring with GitNexus + Serena

This skill guides you through safe code refactoring in **TypeScript** projects — Node.js, NestJS, React.js, and Next.js — combining GitNexus (precomputed knowledge graph) with Serena (live LSP).

**Core principle**: Understand behavior first, refactor in small steps, verify preservation after each change. Never refactor and add features at the same time.

## Before You Start

1. **GitNexus**: Call `list_repos` to see what's indexed. If the repo isn't indexed or is stale, index it first via the CLI (`gitnexus analyze`).
2. **Serena**: Call `check_onboarding_performed`. If onboarding hasn't been done, run `onboarding`. If it has, read the relevant memories for the current task.
3. **Serena**: Call `get_current_config` to understand which tools and modes are active.
4. **Identify the framework**: Determine if this is a Node.js, NestJS, React, or Next.js project (or a combination). This determines which refactoring patterns and verification steps apply.

---

## Phase 1: Understand Current Behavior

Before touching any code, build a complete picture. Refactoring that changes behavior is a bug, not an improvement.

### Analyze the target code

- **GitNexus**: `context({name: "targetSymbol"})` → see all edges (callers, callees, implementors, overrides)
- **GitNexus**: `impact({target: "targetSymbol", direction: "upstream"})` → who depends on this code
- **Serena**: `find_referencing_symbols({name_path_pattern: "targetSymbol"})` → live reference check
- **Serena**: `find_symbol({name_path_pattern: "targetSymbol", include_body: true, include_info: true})` → read the full source and types

### Document what you find

Before any edits, note:
- **Types**: interfaces, type aliases, generics, return types, parameter types
- **Exports**: named exports, default exports, re-exports via barrel files (`index.ts`)
- **Side effects**: DB writes, API calls, event emitters, state mutations, context updates
- **Invariants**: conditions that must always hold (e.g., "returns `undefined`, never throws")
- **Dependencies**: injected services (NestJS), imported hooks (React), middleware chains (Next.js/Express)

### Framework-specific analysis

**NestJS** — Check the module dependency tree. A service or controller might be `@Injectable()` and provided across multiple modules. Use `find_referencing_symbols` on the class to find all `providers`, `imports`, and `exports` arrays that reference it.

**React / Next.js** — Trace component usage across JSX/TSX files. Components may be referenced as JSX elements (`<MyComponent />`) and as values (passed as props, stored in maps). Check both patterns. For hooks, trace all components that call the hook — changing a hook's return type ripples through every consumer.

**Node.js (Express/Fastify)** — Trace middleware chains and route registrations. A refactored middleware or handler may be registered in multiple routers.

### Ensure test coverage exists

Run existing tests via `execute_shell_command`:
- **NestJS**: `npx jest --passWithNoTests` or `npm test`
- **React/Next.js**: `npx jest` or `npx vitest run`
- **Node.js**: `npm test`

If coverage is thin for the code you're about to change, write tests first — refactoring without tests is flying blind.

---

## Phase 2: Identify What to Refactor

### General TypeScript Smells

| Smell | What to look for |
|-------|-----------------|
| **`any` abuse** | Casts to `any`, parameters typed as `any`, suppressing type safety |
| **Long function** | Function doing multiple distinct things; hard to name precisely |
| **Duplication** | Same logic in multiple places with minor variations |
| **Long parameter list** | More than 3-4 parameters, especially of the same type |
| **Deep nesting** | if/else chains nested 3+ levels deep, deeply nested `.then()` chains |
| **Barrel file bloat** | `index.ts` re-exporting everything, causing circular dependencies |
| **God class/module** | Class or module with too many responsibilities |
| **Magic values** | Unexplained literals scattered through code |
| **Improper error handling** | Swallowed errors, `catch(e: any)`, missing error boundaries |

### NestJS-Specific Smells

| Smell | What to look for |
|-------|-----------------|
| **Fat controller** | Controller methods containing business logic instead of delegating to services |
| **God service** | A single service handling too many concerns (e.g., auth + users + notifications) |
| **Circular module deps** | Two modules importing each other; use `forwardRef()` as a temporary fix but extract shared logic as the real fix |
| **Raw SQL in services** | Database queries mixed into business logic; extract into a repository layer |
| **Missing DTOs** | Accepting raw `any` or `object` in controller methods instead of validated DTOs with `class-validator` |
| **Overloaded providers** | A provider doing too many things; split into focused services |

### React / Next.js-Specific Smells

| Smell | What to look for |
|-------|-----------------|
| **Mega component** | Component over 200 lines with mixed rendering, data-fetching, and state logic |
| **Prop drilling** | Passing props through 3+ levels instead of using context or composition |
| **Hook spaghetti** | Component with 5+ `useState`/`useEffect` calls — consolidate into custom hooks |
| **Duplicated fetch logic** | Same API call patterns in multiple components; extract to a shared hook or service |
| **Inline styles / mixed concerns** | Styles, logic, and markup tangled together in one file |
| **Stale closure bugs** | `useEffect` or `useCallback` with missing or incorrect dependency arrays |
| **Server/Client boundary violations** (Next.js) | Using hooks in server components, or heavy computation in client components |

---

## Phase 3: Refactoring Patterns

### Universal TypeScript Patterns

**Extract Function** — Pull distinct responsibilities into named functions. The parent becomes a readable sequence of well-named calls.

**Introduce Type / Interface** — Replace inline type annotations or `any` with named interfaces. Group related fields into typed objects.

**Replace Conditional with Polymorphism** — When a switch dispatches on a type discriminator, use a discriminated union with exhaustive handlers, or an interface with implementations.

**Remove Duplication via Generics** — When similar functions differ only by type, parameterize with generics instead of duplicating.

**Replace `any` with Proper Types** — Audit all `any` usage. Replace with `unknown` (for genuinely unknown inputs that require narrowing) or the correct concrete type.

**Extract Constants / Enums** — Move magic strings and numbers into `const` objects or TypeScript enums. Co-locate with the domain they describe.

### NestJS Patterns

**Extract Service from Fat Controller** — Move business logic from controller methods into dedicated service methods. The controller should only handle HTTP concerns (validation, status codes, response shaping).

```typescript
// Before: logic in controller
@Post()
async create(@Body() dto: CreateUserDto) {
  const exists = await this.userRepo.findByEmail(dto.email);
  if (exists) throw new ConflictException();
  const user = await this.userRepo.save(dto);
  await this.mailer.sendWelcome(user.email);
  return user;
}

// After: controller delegates to service
@Post()
async create(@Body() dto: CreateUserDto) {
  return this.usersService.create(dto);
}
```

**Split God Service** — When a service has multiple responsibilities, split it into focused services. Each service should map to a single bounded context. Update the module's `providers` and any consuming services' constructor injections.

**Extract Repository Layer** — Move database queries from services into `@Injectable()` repository classes. Services express business rules; repositories express data access.

**Introduce DTOs with Validation** — Replace `any` or plain objects in controller parameters with class-validator DTOs. Use `ValidationPipe` globally or per-route.

### React / Next.js Patterns

**Extract Custom Hook** — When a component has complex state + effect logic, extract it into a `useXxx` hook. The component handles rendering; the hook handles behavior.

```typescript
// Before: tangled in component
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
useEffect(() => { fetchData().then(setData).finally(() => setLoading(false)); }, []);

// After: clean separation
const { data, loading } = useFetchData();
```

**Decompose Mega Component** — Split into presentational components (receive data via props, render UI) and container components or hooks (manage state, handle effects).

**Replace Prop Drilling with Composition** — Instead of passing props through intermediate layers, use React composition (children, render props) or context for truly global state.

**Extract Server Actions / API Route Handlers** (Next.js App Router) — Move inline server action logic into separate files in a `lib/` or `actions/` directory. Keep page components focused on layout and composition.

**Consolidate State with `useReducer`** — When a component has 3+ related `useState` calls that update together, consolidate into `useReducer` with typed actions.

---

## Phase 4: Execute the Refactoring

### For Renames (symbol-level)

1. **Preview**: `rename({symbol_name: "oldName", new_name: "newName", dry_run: true})` → see all files and edits
2. **Review tags**: `graph`-tagged edits are high-confidence; `text_search`-tagged edits need manual review (may catch JSX usages, string references, comments)
3. **Check blast radius**: `impact({target: "oldName", direction: "upstream"})` → ensure no hidden dependents
4. **Check barrel files**: If the symbol is re-exported through `index.ts`, the rename must update the barrel too
5. **Execute** — choose based on scope:
   - **Serena `rename_symbol`**: LSP-powered, respects TypeScript scoping. Preferred for most TS renames.
   - **GitNexus `rename`** (`dry_run: false`): graph + text search. Better when the name appears in strings, comments, or config files (e.g., NestJS metadata strings, Next.js route paths).
   - For critical renames, preview with GitNexus first, then execute with Serena for precision.

### For Structural Refactoring (extract, split, reorganize)

Work in small, verifiable steps. Each step should pass tests and type-checking before moving to the next.

1. **Read the code**: `find_symbol({include_body: true})` on the target
2. **Think before editing**: Use `think_about_task_adherence` to confirm the change preserves behavior
3. **Make one change**: Use `replace_symbol_body`, `insert_after_symbol`, or `insert_before_symbol`
4. **Fix imports**: After extracting code to a new file, update import/export statements in both the source and all consumers
5. **Verify immediately**:
   - `execute_shell_command` → `npx tsc --noEmit` (type check)
   - `execute_shell_command` → `npm test` or `npx jest --bail` (run tests)
6. **Repeat** for the next extraction or restructuring step

The key discipline: resist the urge to make multiple changes before verifying. One change, one test run.

### Framework-Specific Execution Notes

**NestJS** — When splitting a service, update the `@Module()` decorator's `providers` and `exports` arrays. If the new service is used by other modules, add it to `exports`. Run `npx tsc --noEmit` after each module change — circular dependency errors surface here.

**React** — When extracting components, ensure prop types are defined with interfaces (not `any`). When extracting hooks, keep the hook's return type stable to avoid ripple effects. If the hook manages side effects, verify `useEffect` cleanup is preserved.

**Next.js** — When reorganizing pages or API routes, verify the routing still works. Check `next.config.js` for any rewrites/redirects that reference old paths. For App Router, ensure `'use client'` / `'use server'` directives are correct after splitting components.

### Choosing Between GitNexus and Serena

| Scenario | Use | Reason |
|----------|-----|--------|
| Rename a TS symbol (function, class, interface) | Serena `rename_symbol` | LSP understands TS scoping and generics |
| Rename including JSX usages + string references | GitNexus `rename` | Text search catches `<Component />` in strings/comments |
| Critical rename (public API, widely used) | Both | Preview with GitNexus, execute with Serena |
| Extract method / split class / extract hook | Serena | Need precise symbol editing tools |
| Find all duplicated logic across codebase | GitNexus `query` | Find duplication across the codebase |
| Rename a NestJS injectable that appears in decorators | Both | Decorators may reference names as strings |

---

## Phase 5: Verify Behavior Preservation

After completing the refactoring:

1. **Type check**: `execute_shell_command` → `npx tsc --noEmit` — catch type errors from refactoring
2. **Run tests**: `execute_shell_command` → `npm test` or `npx jest` — full test suite, check for regressions
3. **Lint**: `execute_shell_command` → `npx eslint .` — catch style issues and unused imports
4. **Diff check**: `detect_changes` → confirm only expected files were modified; no accidental scope creep
5. **Reference check**: `find_referencing_symbols({symbol: "newOrChangedSymbol"})` → verify references resolve correctly
6. **Impact review**: `impact` on any changed public API — confirm downstream consumers aren't broken
7. **Build check** (Next.js): `execute_shell_command` → `npx next build` — verify SSR/SSG still works if pages were restructured

If any step fails, revert the last change and try a smaller step. Don't debug a failing refactoring — undo it and approach differently.

---

## Phase 6: Document and Commit

1. **Save context**: Use Serena's `write_memory` to document what was refactored and why, for future reference
2. **Summarize**: Use `summarize_changes` to generate a clear description of what changed
3. **Commit guidance**: Each refactoring step should be its own commit. Keep refactoring commits separate from feature or bugfix commits. Use descriptive messages:
   - `refactor(nestjs): extract payment validation into PaymentValidationService`
   - `refactor(react): extract useAuth hook from LoginPage component`
   - `refactor(next): reorganize API routes under /api/v2 namespace`

---

## Troubleshooting

**Tests fail after refactoring** — You've accidentally changed behavior. Revert the last change, isolate which step broke things, and try a smaller transformation. Don't try to "fix forward" by adjusting the test.

**Circular dependency in NestJS** — Use `forwardRef(() => ModuleName)` as a temporary measure, then extract the shared dependency into its own module to break the cycle properly.

**`Cannot find module` after file moves** — Update path aliases in `tsconfig.json` (`paths` field) and barrel files (`index.ts`). Check for hardcoded relative imports that need updating.

**React hook order errors** — After extracting hooks, ensure they're called unconditionally at the top level. Conditional hook calls break React's rules of hooks.

**Next.js build fails after page restructuring** — Check `'use client'` directives, dynamic imports, and metadata exports. Server components cannot import client-only hooks.

**GitNexus index is stale** — Read `gitnexus://repo/{name}/context` to check when the index was last built. Re-index if the codebase has changed significantly since the last analysis.

---

## Tool Chain Summary

### Rename flow
```
rename({dry_run: true})
→ impact({direction: "upstream"})
→ rename_symbol (Serena) or rename({dry_run: false}) (GitNexus)
→ detect_changes
→ execute_shell_command (npx tsc --noEmit)
→ execute_shell_command (npm test)
```

### Structural refactoring flow
```
context({name: "target"}) + find_symbol({include_body: true})
→ impact({direction: "upstream"})
→ think_about_task_adherence
→ replace_symbol_body / insert_after_symbol (one change)
→ execute_shell_command (npx tsc --noEmit)
→ execute_shell_command (npm test)
→ repeat until done
→ detect_changes (verify scope)
→ summarize_changes
```

For detailed tool parameters and chaining patterns, read `references/tool-reference.md`.
