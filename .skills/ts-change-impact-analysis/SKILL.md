---
name: ts-change-impact-analysis
description: "Assess the blast radius and impact of code changes before making or committing them, using GitNexus and Serena MCP servers. Focused on TypeScript: Node.js, NestJS, React.js, and Next.js. Use this skill whenever you need to: check what will break if you change a symbol, assess the risk of a code change, analyze blast radius before editing, verify API/endpoint change safety, check NestJS provider/guard/pipe/interceptor impact, assess React component/hook/context change risk, validate Next.js page/layout/server-component change safety, compare pre-change vs post-change impact, or answer questions like 'what breaks if I change X?', 'is this change safe?', 'who depends on this hook?', 'what consumers use this API?'. Trigger this skill even if the user doesn't mention GitNexus or Serena by name — any pre-change impact assessment, blast radius check, or change safety analysis in a TypeScript/Node.js/NestJS/React/Next.js project should use it."
---

# Change Impact Analysis with GitNexus + Serena

Assess blast radius before making changes — combining GitNexus (precomputed knowledge graph) with Serena (live LSP for actual call sites). Focused on TypeScript: **Node.js**, **NestJS**, **React.js**, **Next.js**.

**The general principle**: Use GitNexus to map the impact graph and risk levels, then use Serena to verify high-risk dependencies by reading the actual code.

---

## Before You Start

1. **GitNexus**: Call `list_repos` to see what's indexed. If the repo isn't indexed or stale, index it first (`gitnexus analyze`). Read `gitnexus://repo/{name}/context` to check freshness.
2. **Serena**: Call `check_onboarding_performed`. If not done, run `onboarding`. Then call `get_current_config`.
3. **Identify change type**: What kind of symbol are you changing? Pick the matching section below.

---

## Workflow Steps

### 1. Pre-Change Blast Radius (GitNexus)

Always run this first, regardless of change type:

```
impact({
  target: "SymbolToChange",
  direction: "upstream",       // What depends on this symbol
  includeTests: true,
  minConfidence: 0.7
})
```

Interpret results:
- `risk: CRITICAL / HIGH` → must read every d=1 caller before touching anything
- `d=1` (`byDepth[1]`) → **WILL BREAK** — direct dependents
- `d=2` (`byDepth[2]`) → **LIKELY AFFECTED** — indirect dependents
- `d=3` (`byDepth[3]`) → **MAY NEED TESTING** — transitive dependents
- `affected_processes` → which execution flows are hit
- `affected_modules` → which functional clusters are hit

### 2. Verify High-Risk Callers (Serena)

For every d=1 symbol with HIGH or CRITICAL risk:

```
find_referencing_symbols({ name_path_pattern: "SymbolToChange" })
→ find_symbol({ name_path_pattern: "CallerName", include_body: true, include_info: true })
```

Read the actual call sites. Understand how tightly coupled each caller is before editing.

### 3. Post-Change Verification (GitNexus + Serena)

After making changes, verify you didn't exceed your intended blast radius:

```
detect_changes({ scope: "unstaged" })   // or "staged"
detect_changes({ scope: "compare", base_ref: "main" })
execute_shell_command({ command: "npx tsc --noEmit" })
execute_shell_command({ command: "npm test -- --passWithNoTests" })
```

Compare `changed_symbols` and `affected_processes` against your pre-change analysis. Any unexpected symbols? Investigate before committing.

---

## TypeScript-Specific Workflows

### NestJS — Provider / Service Change

Services are injected everywhere. A signature or behavior change in a `@Injectable()` service can silently break any consumer.

```
impact({ target: "UserService", direction: "upstream", includeTests: true })
→ inspect d=1: look for Controllers, other Services, Guards, Interceptors
→ find_referencing_symbols({ name_path_pattern: "UserService" })
→ find_symbol({ name_path_pattern: "UserController/createUser", include_body: true })
→ check if method signature, return type, or thrown exceptions changed
→ api_impact({ route: "/users" })   // if controller route is involved
```

Key things to check:
- Did you change a method's return type or add/remove parameters?
- Did you change what errors are thrown? (Guards and Interceptors catch these)
- Does the module still export this service? Check the owning module's `exports` array.

### NestJS — Guard / Pipe / Interceptor Change

These are cross-cutting. A single Guard applied at the module level can affect dozens of routes.

```
impact({ target: "AuthGuard", direction: "upstream" })
→ find_referencing_symbols({ name_path_pattern: "AuthGuard" })
→ look for @UseGuards() call sites in controllers AND module metadata
→ find_symbol({ name_path_pattern: "AppModule", include_body: true })
```

Key things to check:
- Is this Guard applied globally via `APP_GUARD`? If yes, risk is CRITICAL — every route is affected.
- Does `canActivate()` return type or shape change?
- For Pipes: does `transform()` throw differently? Any DTO validation shape changes?
- For Interceptors: does the observable chain change response shape or timing?

### NestJS — DTO / Validation Schema Change

DTOs are the contract between client and server. Any field rename, type change, or validation rule change is a breaking change.

```
impact({ target: "CreateUserDto", direction: "upstream" })
→ find_referencing_symbols({ name_path_pattern: "CreateUserDto" })
→ shape_check({ route: "/users" })   // detect consumer mismatches
→ find_symbol({ name_path_pattern: "CreateUserDto", include_body: true })
→ check @IsString(), @IsOptional(), @Transform(), @Type() decorators
```

Key things to check:
- Did you rename or remove a field? Frontend consumers will break silently at runtime.
- Did you make an optional field required? Existing API calls will start failing validation.
- Did you change a `@Transform()` or `@Type()` decorator? Serialization behavior changes.

### NestJS — Module Boundary Change

Adding/removing imports or exports from a module affects what's injectable across the app.

```
find_symbol({ name_path_pattern: "AuthModule", include_body: true })
→ check `exports` array — removing an export breaks any module that imports AuthModule
→ impact({ target: "AuthModule", direction: "upstream" })
→ find_referencing_symbols({ name_path_pattern: "AuthModule" })
```

### React — Component Prop Change

Changing a component's props interface is the most common source of React breakage.

```
impact({ target: "UserCard", direction: "upstream", includeTests: true })
→ find_referencing_symbols({ name_path_pattern: "UserCard" })
→ for each call site: find_symbol({ include_body: true }) → check JSX usage
→ look for spread props ({ ...props }) — these are invisible to static analysis
```

Key things to check:
- Did you add a required prop? Every usage must be updated.
- Did you change a prop type (e.g., `string` → `string | null`)? Check downstream rendering.
- Are there `forwardRef` wrappers or HOCs that re-export this component? Find them with `find_referencing_symbols`.
- Did you change the component's ref type? Any `useRef<UserCard>` usages will break.

### React — Custom Hook Change

Hooks are consumed silently — broken hooks don't throw at import time.

```
impact({ target: "useAuth", direction: "upstream", includeTests: true })
→ find_referencing_symbols({ name_path_pattern: "useAuth" })
→ find_symbol({ name_path_pattern: "useAuth", include_body: true })
→ check return shape: adding/removing fields breaks destructuring consumers
```

Key things to check:
- Did the hook's return type change shape? Any `const { user, logout } = useAuth()` will break.
- Did you add new required parameters? Every call site must be updated.
- Did you change when/how side effects fire? Check `useEffect` dependency arrays in consumers.
- Does the hook wrap a Context? Run the Context workflow below too.

### React — Context / Provider Change

Context is globally consumed. Changing the context shape or value type affects every component that reads from it.

```
impact({ target: "AuthContext", direction: "upstream" })
→ find_referencing_symbols({ name_path_pattern: "AuthContext" })
→ cypher({ query: "MATCH (n)-[:CodeRelation {type: 'IMPORTS'}]->(c {name: 'AuthContext'}) RETURN n.name, n.filePath" })
→ find_symbol on each consumer with include_body: true
```

Key things to check:
- Did the context value shape change? All `useContext(AuthContext)` consumers are affected.
- Is there a custom hook (`useAuth`) wrapping this context? Impact that hook too.
- Did `defaultValue` change? Components rendered outside a Provider will see a different default.

### Next.js — Layout Change

Next.js layouts cascade down to all child routes. A layout change is high-blast-radius by nature.

```
find_symbol({ relative_path: "app/layout.tsx", include_body: true })
→ impact({ target: "RootLayout", direction: "upstream" })
→ check metadata exports, font loading, global providers
→ find_referencing_symbols({ name_path_pattern: "RootLayout" })
```

Key things to check:
- `app/layout.tsx` changes affect **every page in the app** — treat as CRITICAL.
- Nested layouts (e.g., `app/dashboard/layout.tsx`) affect all pages under that segment.
- Adding/removing a global Provider (e.g., `<AuthProvider>`) breaks any hook that depends on it.
- Changing `metadata` exports affects SEO across all child pages.

### Next.js — Page / Route Change

```
find_symbol({ relative_path: "app/users/page.tsx", include_body: true })
→ check data fetching: async server component, fetch() calls, revalidate settings
→ impact({ target: "UsersPage", direction: "upstream" })
→ check generateStaticParams if it's a dynamic route
```

Key things to check:
- Changing `revalidate` or `dynamic` export changes caching behavior.
- Removing `generateStaticParams` converts a static page to dynamic — CDN/performance impact.
- Server Component → Client Component conversion (`"use client"`): loses server-side data access, DB calls must move.

### Next.js — API Route Handler Change

```
api_impact({ route: "/api/users" })
→ shape_check({ route: "/api/users" })
→ find_symbol({ relative_path: "app/api/users/route.ts", include_body: true })
→ find_referencing_symbols on the handler
```

Key things to check:
- Did the response shape change? Frontend `fetch()` callers will receive unexpected data.
- Did you change error response format? Frontend error handling will break silently.
- Did you add/remove authentication? Check `middleware.ts` matcher config.
- Did you change which HTTP methods are handled?

### Next.js — Middleware Change

Middleware runs on every matched request. Even a small logic change has high blast radius.

```
find_symbol({ relative_path: "middleware.ts", include_body: true })
→ check `matcher` config — which routes are affected?
→ impact({ target: "middleware", direction: "upstream" })
→ for each matched route: find_symbol on the route handler with include_body: true
```

Key things to check:
- `matcher` determines scope — a broad pattern means CRITICAL blast radius.
- Authentication/redirect logic changes affect entire matched route groups.
- Adding `matcher` patterns can accidentally apply middleware to previously exempt routes.

### Node.js — Shared Utility / Library Change

```
impact({ target: "parseJwt", direction: "upstream", includeTests: true })
→ find_referencing_symbols({ name_path_pattern: "parseJwt" })
→ for d=1 callers: find_symbol({ include_body: true })
→ check if function signature, return type, or thrown errors changed
→ execute_shell_command({ command: "npx tsc --noEmit" })
```

### TypeScript Interface / Type Change

Types are erased at runtime, but their change radius is tracked in the graph.

```
impact({ target: "UserPayload", direction: "upstream", relationTypes: ["IMPORTS", "IMPLEMENTS", "EXTENDS"] })
→ find_referencing_symbols({ name_path_pattern: "UserPayload" })
→ look for: interfaces that extend it, classes that implement it, functions that accept/return it
→ execute_shell_command({ command: "npx tsc --noEmit" })
```

---

## Tool Chain Summary

```
# Standard pre-change check
impact({ target: "X", direction: "upstream", includeTests: true })
→ find_referencing_symbols on d=1 items
→ find_symbol({ include_body: true }) on high-risk callers
→ api_impact + shape_check (if API route involved)
→ think_about_collected_information

# Post-change verification
detect_changes({ scope: "unstaged" })
→ compare against pre-change analysis
→ execute_shell_command({ command: "npx tsc --noEmit" })
→ execute_shell_command({ command: "npm test -- --passWithNoTests" })
→ think_about_whether_you_are_done
```

---

## Important Guidelines

- **Always run `impact` before editing.** Even a small change in a shared utility can cascade across dozens of consumers.
- **TypeScript types give false confidence.** `tsc --noEmit` catches type errors, but not runtime behavior changes (e.g., changed exception shapes, reordered return tuples, changed side effects).
- **Pay attention to depth.** d=1 WILL break. d=2 is LIKELY affected. d=3 MAY need testing. Don't skip d=2 for HIGH/CRITICAL risk.
- **NestJS DI is invisible to naive grep.** Use `find_referencing_symbols` + GitNexus graph — constructor injection doesn't look like a function call in plain text.
- **React spread props hide consumers.** `<UserCard {...props} />` patterns are invisible to static analysis. Check for HOCs and wrapper components explicitly.
- **Next.js layouts cascade silently.** Changing `app/layout.tsx` affects every single page. Always treat root layout changes as CRITICAL.
- **Always run `api_impact` + `shape_check` for API route changes.** Consumer mismatches are silent at deploy time and only surface as runtime failures.
- **Check index freshness.** Read `gitnexus://repo/{name}/context` before relying on impact results. Stale index = unreliable analysis.
- **Save risk insights to memory.** Use `write_memory` to persist findings (e.g., `change-impact/auth-service` → "AuthService has 12 direct consumers, most sensitive: PaymentModule").

For full tool parameters and cypher patterns, read `references/tool-reference.md`.
