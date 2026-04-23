---
name: ts-feature-addition
description: "Add new functionality to an existing TypeScript codebase following existing patterns and conventions, using GitNexus and Serena MCP servers. Focused on Node.js, NestJS, React.js, and Next.js projects. Use this skill whenever you need to: add a new feature to an existing project, implement new functionality, extend existing code, create new REST or GraphQL endpoints, add NestJS modules/services/controllers/guards/pipes/interceptors, add React components/hooks/contexts/providers, add Next.js pages/layouts/API routes/server components/middleware, integrate new components into an existing architecture, or answer questions like 'where should I add feature Y?', 'how do I extend X?', 'add a new endpoint for Z', 'create a new module for W'. Trigger this skill even if the user doesn't mention GitNexus or Serena by name — any task that involves adding or implementing new functionality in an existing Node.js, NestJS, React, or Next.js codebase should use it."
---

# Feature Addition — TypeScript: Node.js · NestJS · React.js · Next.js

This skill guides you through adding a feature in the right place following existing patterns, combining **GitNexus** (precomputed knowledge graph for location discovery and impact analysis) with **Serena** (live LSP for reading conventions and making precise edits).

**Core principle**: GitNexus finds *where* the feature belongs and assesses the integration surface. Serena reads *how* the codebase works and makes the actual edits. Together they ensure the new feature fits naturally without breaking existing behaviour.

For detailed tool parameters, see `references/tool-reference.md`.

---

## Before You Start

1. **GitNexus**: Call `list_repos` — verify the repo is indexed and not stale. If stale, re-index via CLI (`gitnexus analyze`).
2. **Serena**: Call `check_onboarding_performed`. If not done, run `onboarding`. If done, call `read_memory` to load relevant context for the current task.
3. **Serena**: Call `get_current_config` — confirm active tools and modes.

---

## Workflow

### Step 1 — Discover where the feature belongs (GitNexus)

```
query({ query: "<feature concept>", task_context: "adding new feature", goal: "find similar implementations" })
```

- Read `gitnexus://repo/{name}/clusters` → identify the functional module or domain area.
- `context` on entry points of the relevant area → understand the integration surface (what calls what, what implements what).

### Step 2 — Read existing patterns (Serena)

- `read_memory` → load code conventions, naming rules, architectural decisions.
- `get_symbols_overview` on relevant files → understand file/module structure.
- `find_symbol({ include_body: true })` on 1–2 similar existing implementations → mirror exact patterns.

> **Never write code without first reading similar code in the same codebase.**

### Step 3 — Assess impact before touching anything (GitNexus)

```
impact({ target: "symbolToExtend", direction: "upstream" })
```

- Risk levels: `LOW / MEDIUM / HIGH / CRITICAL` — escalate caution accordingly.
- If modifying an interface or base class: use `context` or `cypher` to find all `EXTENDS` / `IMPLEMENTS` relationships first.

### Step 4 — Think before implementing (Serena)

- `think_about_collected_information` → do you have enough context? Missing anything?
- `think_about_task_adherence` → is this approach consistent with existing patterns?

### Step 5 — Implement (Serena)

Prefer **symbolic edits** over raw file writes:

| Need | Serena tool |
|---|---|
| Add new function/class to an existing file | `insert_after_symbol` or `insert_before_symbol` |
| Modify an existing function/method body | `replace_symbol_body` |
| Create a new file | `create_text_file` |
| Rename a symbol across the codebase | Use GitNexus `rename` instead |

### Step 6 — Verify (Both)

```
execute_shell_command  → run tests + linting (e.g. pnpm test, pnpm lint)
detect_changes         → verify scope matches plan (no unintended drift)
think_about_whether_you_are_done
summarize_changes      → generate change summary
```

---

## Framework-Specific Patterns

### Node.js (Express / Fastify / plain Node)

**Adding a new route handler**
1. `query` for existing route files (e.g., `router`, `routes`, `handlers`) → find the routing layer.
2. `find_symbol({ include_body: true })` on an existing handler → mirror the same middleware stack, error handling style (try/catch vs error-first callback vs async wrapper), and response format.
3. If adding a new route file: check how existing route files are registered (usually in `app.ts` or `index.ts`). Match the same registration pattern.
4. `impact` on any shared middleware or utility the new handler will call.

**Adding a new service / utility module**
1. `query` for similar services → identify folder convention (`services/`, `lib/`, `utils/`).
2. Check export style: named exports vs default export, barrel files (`index.ts`).
3. `insert_after_symbol` to add to an existing barrel, or `create_text_file` for a new module.

---

### NestJS

NestJS follows a strict module/provider/controller architecture. Always respect module boundaries.

**Adding a new endpoint to an existing Controller**
1. `query({ query: "controller endpoint", task_context: "adding endpoint" })` → find the target controller.
2. `find_symbol({ include_body: true })` on the controller class → read decorator patterns (`@Get`, `@Post`, `@Body`, `@Param`, `@UseGuards`, `@Roles`, `@ApiOperation`, etc.).
3. `find_symbol` on the matching Service → understand what methods are available to call.
4. `insert_after_symbol` to add the new handler method, following exact decorator and DTO patterns.
5. If a new DTO is needed: check existing DTOs in the same module for `class-validator` / `class-transformer` decorator style and `@ApiProperty` Swagger annotations.

**Adding a new Module (feature module)**
1. `query` for an existing feature module of similar complexity → use it as the structural template.
2. Standard files to create: `<feature>.module.ts`, `<feature>.controller.ts`, `<feature>.service.ts`. Check if there's also a `<feature>.repository.ts` pattern (TypeORM custom repo or Prisma service).
3. Register the new module in the nearest parent module's `imports` array — `replace_symbol_body` on the `@Module` decorator metadata.
4. Check the parent module for `forwardRef` patterns if circular dependencies are possible.
5. Check if the project uses a `SharedModule` or `CoreModule` that should be imported.

**Adding a Guard / Interceptor / Pipe**
1. `query` for existing guards/interceptors/pipes → find the conventions folder (`common/guards/`, `shared/interceptors/`, `core/pipes/`).
2. `find_symbol({ include_body: true })` on an existing one → match the `canActivate` / `intercept` / `transform` signature and error-throwing style (`UnauthorizedException`, `ForbiddenException`, `BadRequestException`, etc.).
3. Decide scope: method-level `@UseGuards`, controller-level, or global via `APP_GUARD` / `APP_INTERCEPTOR` provider in `AppModule`. Match existing scope pattern.
4. `impact` on the symbol where the guard/interceptor will be attached before applying it.

**Testing in NestJS**
- Match test file location: co-located `<n>.spec.ts` or in a `test/` directory for E2E.
- Use `Test.createTestingModule` — check existing specs for mock provider patterns (`jest.fn()` vs `createMock` from `@golevelup/ts-jest`).
- Run: `execute_shell_command("pnpm test <file>")` or `jest --testPathPattern=<n>`.

---

### React.js

**Adding a new Component**
1. `query` for components in the same feature area → identify folder convention (`components/`, `features/<n>/components/`, `ui/`).
2. `find_symbol({ include_body: true })` on a similar component → mirror: FC vs named function declaration, prop types (interface vs `type`), CSS approach (CSS Modules / styled-components / Tailwind), export style (named vs default).
3. Check if a Storybook story is expected (`*.stories.tsx`) alongside the component.
4. `create_text_file` for the new component; `insert_after_symbol` in the barrel `index.ts` if one exists.

**Adding a new Custom Hook**
1. `query` for existing hooks (`use*` files) → find the hooks folder and naming convention.
2. `find_symbol({ include_body: true })` on a similar hook → check: return shape (tuple vs object), error/loading state pattern (`isLoading`, `isPending`), cleanup in `useEffect`, dependencies array discipline.
3. Check if hooks are tested — if so, match the test setup (`renderHook` from `@testing-library/react`).

**Adding a new Context / Provider**
1. `query` for existing contexts → find the providers folder and wrapping pattern.
2. Read how existing providers are composed in the app root (`App.tsx`, `Providers.tsx`, or `_app.tsx`).
3. `impact` on the component tree above the injection point before wrapping with a new Provider.
4. Match the `createContext` + custom access hook pattern (e.g., `useMyContext` with null-check guard) if already established.
5. Check if the project uses Zustand, Jotai, or another state library instead of Context for shared state.

**Testing in React**
- Co-located test: `<Component>.test.tsx` or `__tests__/<Component>.test.tsx`.
- Match testing library imports and `render` / `screen` / `userEvent` / `waitFor` patterns from existing tests.
- Run: `execute_shell_command("pnpm test <component>")`.

---

### Next.js

**Adding a new Page (App Router)**
1. `query` for existing pages (`.tsx` files under `app/`) → understand the routing structure and segment conventions.
2. Check if the page is a Server Component (default) or needs `'use client'` — match existing pages at the same nesting level.
3. Check for co-located `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx` — create them if the route segment requires it.
4. `find_symbol({ include_body: true })` on a similar page → mirror data-fetching approach (`fetch` with `cache: 'force-cache'` / `'no-store'`, `unstable_cache`, or a server action call).
5. Check if the project uses a `generateMetadata` pattern for SEO — match it.

**Adding a new API Route (App Router)**
1. `query` for existing `route.ts` files → find how they export method handlers (`GET`, `POST`, `PATCH`, `DELETE`).
2. `find_symbol({ include_body: true })` on a similar `route.ts` → mirror: `NextRequest`/`NextResponse` usage, auth check pattern, error response shape (`{ error: string }` vs a shared error class).
3. Check if there's a shared response helper (e.g., `apiResponse`, `withAuth`, `withValidation` wrapper) — use it consistently.

**Adding Middleware**
1. Read `middleware.ts` at the project root — `find_symbol({ include_body: true })`.
2. Understand the `matcher` config — ensure the new route pattern is correctly included/excluded.
3. `impact` on all matched routes before modifying middleware logic. Middleware bugs affect every matched request.

**Adding a Server Action**
1. `query` for existing server actions (`'use server'` directive at file or function level, or an `actions/` folder).
2. `find_symbol({ include_body: true })` on a similar action → match: input validation (Zod schema shape), return type (`{ success: true, data: T } | { success: false, error: string }`), revalidation calls (`revalidatePath`, `revalidateTag`).
3. Check how the action is invoked from the client — `useFormState` / `useActionState`, `useTransition`, or direct async call.

**Testing in Next.js**
- Check for both unit tests (`jest` + `@testing-library/react`) and E2E tests (`playwright` or `cypress`).
- For Server Components, check if the project has a custom `jest.config.ts` with `moduleNameMapper` for Next.js internals.
- Run unit: `execute_shell_command("pnpm test")`. Run E2E: `execute_shell_command("pnpm e2e")`.

---

## Important Guidelines

- **Follow existing patterns.** Read before you write. Consistency with the codebase trumps personal style preferences.
- **Never edit code without reading it first.** Always `find_symbol(include_body: true)` or `get_symbols_overview` before modifying anything.
- **Check impact before extending interfaces.** Use `context` or `cypher` to find all `EXTENDS`/`IMPLEMENTS` before touching a base class or interface.
- **Use Serena's thinking tools.** `think_about_collected_information` before editing, `think_about_task_adherence` before writing, `think_about_whether_you_are_done` after implementing.
- **Prefer symbolic edits.** `replace_symbol_body`, `insert_after_symbol`, `insert_before_symbol` over raw file writes.
- **Verify every change.** Run tests + linting via `execute_shell_command`. Check scope via `detect_changes`.
- **Save new conventions to memory.** If you discover a new pattern during implementation, `write_memory` to persist it for future tasks.
- **TypeScript strictness.** Check `tsconfig.json` for `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` — match the existing type discipline exactly. Never introduce `any` unless the codebase already uses it in similar contexts.
