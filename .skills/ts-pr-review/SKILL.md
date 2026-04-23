---
name: ts-pr-review
description: "Review pull requests for correctness, safety, and completeness using GitNexus and Serena MCP servers. Focused on TypeScript: Node.js, NestJS, React.js, and Next.js. Use this skill to: review a PR or merge request, assess merge safety, check for regressions, verify test coverage, audit security, review NestJS guards/pipes/DTOs, check React hook correctness, validate Next.js SSR/SSG/server-component boundaries, or answer questions like 'review this PR', 'is this safe to merge?', 'what does this diff change?'. Trigger this skill even if the user doesn't mention GitNexus or Serena — any PR review, branch diff review, code quality check, or merge safety assessment in a TypeScript/Node.js/NestJS/React/Next.js project should use it."
---

# PR Review with GitNexus + Serena

This skill guides you through reviewing a pull request for correctness, safety, and completeness in **TypeScript projects: Node.js, NestJS, React.js, and Next.js**. It combines GitNexus (precomputed knowledge graph for mapping changes and assessing blast radius) with Serena (live LSP for reading implementations and checking conventions), applying a structured code review methodology covering TypeScript type safety, framework-specific patterns, code quality, security, performance, testing, and documentation.

**The general principle**: Use GitNexus to map what changed and assess the blast radius of each change, then use Serena to read the actual implementations and verify correctness against the review checklist below.

## Before You Start

1. **GitNexus**: Call `list_repos` to see what's indexed. If the repo isn't indexed or is stale, index it first via the CLI (`gitnexus analyze`). Read `gitnexus://repo/{name}/context` to check index freshness.
2. **Serena**: Call `check_onboarding_performed`. If onboarding hasn't been done, run `onboarding`. If it has, read the relevant memories for the current task.
3. **Serena**: Call `get_current_config` to understand which tools and modes are active.

---

## Workflow Steps

### Step 1: Understand the Context

Before diving into code, understand what the PR is about:
- Read the PR description — what is the goal? Which issues does it address?
- Determine the change type: feature, bugfix, refactor, or infrastructure
- Note any special considerations the author called out

Run `detect_changes({scope: "compare", base_ref: "main"})` to get the full change map — how many files changed, which symbols were affected, and the overall risk summary. Always start here to get the complete picture before diving into individual symbols.

### Step 2: Assess Impact per Symbol (GitNexus)

For each changed symbol:
- `impact({target: "symbol", direction: "upstream"})` → blast radius (who depends on this?)
- `impact({target: "symbol", direction: "upstream", includeTests: true})` → check test coverage
- Don't skip impact analysis — a seemingly small change can have a wide blast radius

### Step 3: High-Level Architecture Review (Serena)

Use `find_symbol({include_body: true})` on each changed symbol to read the new implementations. Then evaluate:

- **Design**: Does the approach make sense? Is it consistent with existing patterns? Are there simpler alternatives? Is the code in the right place?
- **Organization**: Clear separation of concerns? Appropriate abstraction levels? Logical file/folder structure?
- **Conventions**: Compare against project conventions stored in Serena memories via `read_memory`

Use `find_referencing_symbols` to verify callers are still compatible with the changes.

### Step 4: Detailed Code Quality Review

Walk through each changed symbol and check:

**Naming**:
- Variables: descriptive, meaningful names — avoid abbreviations unless widely known
- Functions: verb-based, clear purpose
- Classes: noun-based, single responsibility
- Constants: UPPER_CASE for true constants

**Functions**:
- Single responsibility — does each function do one thing well?
- Reasonable length (< 50 lines ideally)
- Clear inputs and outputs, minimal side effects
- Proper error handling — no silent failures

**SOLID principles** (for class/object changes):
- Single Responsibility: each class has one reason to change
- Open/Closed: open for extension, closed for modification
- Liskov Substitution: subtypes are substitutable for their base types
- Interface Segregation: no client forced to depend on methods it doesn't use
- Dependency Inversion: depend on abstractions, not concretions

**Code smells to flag**:
- Code duplication (DRY violations)
- Dead code or commented-out code
- Magic numbers — extract to named constants
- Deep nesting — suggest early returns
- God classes that do too much


### Step 5: TypeScript & Framework-Specific Review

#### TypeScript Type Safety
- No untyped `any` — use `unknown` with type narrowing, or proper generics
- Return types explicitly declared on public functions and class methods
- Interfaces and types used consistently — prefer `interface` for object shapes, `type` for unions/intersections
- No type assertions (`as X`) without a comment justifying why it's safe
- `strictNullChecks` compliance — no implicit `null`/`undefined` holes
- Enums used correctly (prefer `const enum` or string union types over numeric enums)

#### Async / Promise Patterns
- No floating Promises — every `async` call is either `await`ed or explicitly handled
- No mixing of `.then()` and `await` in the same flow without good reason
- Error handling in async code: `try/catch` or `.catch()` on every rejected path
- No `async` functions returning `void` without intentional fire-and-forget justification

#### NestJS (if applicable)
- **Module structure**: each module exports only what consumers need — avoid over-exporting from barrel files
- **Dependency injection**: services injected via constructor, not instantiated manually
- **Guards / Pipes / Interceptors / Filters**: custom ones are properly scoped (global vs controller vs route) and tested in isolation
- **DTOs**: all incoming request bodies validated with `class-validator` decorators; no raw `body` usage without a typed DTO
- **Config**: environment variables accessed via `ConfigService`, not `process.env` directly
- **Lifecycle hooks**: `OnModuleInit`, `OnApplicationBootstrap` used correctly — no blocking work in constructors
- **Exception handling**: business errors use NestJS built-in exceptions (`BadRequestException`, etc.) or a custom filter — no raw `throw new Error()`

#### React.js (if applicable)
- **Rules of Hooks**: hooks called only at the top level, never inside conditionals or loops
- **`useEffect` dependencies**: dependency arrays are complete and correct — no missing deps, no suppressed lint warnings without explanation
- **Memoization**: `useMemo` / `useCallback` used only where there's a real performance reason, not cargo-culted everywhere
- **Component size**: large components broken into smaller, focused ones — single responsibility applies here too
- **State colocation**: state lives as close as possible to where it's used — no unnecessary lifting
- **Event handler cleanup**: timers, subscriptions, and event listeners cleaned up in `useEffect` return function
- **Key props**: proper stable keys in lists — never use array index as key unless the list is static and never reordered
- **No direct DOM mutation**: no `document.querySelector` or `innerHTML` — use refs and React patterns instead

#### Next.js (if applicable)
- **Data fetching strategy**: correct choice of `getServerSideProps` vs `getStaticProps` vs ISR (`revalidate`) vs React Server Components — justify if non-obvious
- **Server vs Client Components**: `"use client"` directive only where necessary; data fetching and heavy logic stays server-side
- **API routes**: proper method guards (`if (req.method !== 'POST') ...`), input validation, and no sensitive logic leaking to the client bundle
- **`next/image`**: images use `next/image` with explicit `width`/`height` or `fill` — no raw `<img>` tags for content images
- **`next/link`**: internal navigation uses `<Link>` — no raw `<a href>` for same-origin routes
- **Environment variables**: server-only secrets use non-`NEXT_PUBLIC_` prefix; client-safe vars use `NEXT_PUBLIC_`

### Step 6: Security Review

**Input validation**:
- All user inputs validated — type checking, range checking, format validation
- No unsanitized inputs reaching database queries or rendered output

**Authentication & Authorization**:
- Proper authentication checks on sensitive endpoints
- Authorization for sensitive operations
- Correct session management and password handling

**Data protection**:
- No hardcoded secrets (API keys, passwords, tokens) — use environment variables
- Sensitive data encrypted at rest and in transit
- SQL injection prevention (parameterized queries, not string interpolation)
- XSS prevention (use `textContent` over `innerHTML`, proper output encoding)
- CSRF protection where applicable

**Dependencies**:
- No vulnerable packages introduced — suggest running `npm audit` or `pnpm audit`
- Dependencies up-to-date, minimal dependency usage

### Step 7: Performance Review

**Algorithms & logic**:
- Appropriate algorithm choice with reasonable time/space complexity
- No unnecessary loops or redundant iterations

**Database** (if applicable):
- Efficient queries with proper indexing
- N+1 query prevention (use eager loading / `select_related` / `JOIN`)
- Connection pooling and proper resource management

**Resource management**:
- Files, connections, and handles properly closed
- No memory leaks — watch for unbounded caches or event listeners not cleaned up

### Step 8: API Safety (GitNexus)

If API routes were modified:
- `shape_check` → detect consumer mismatches (response shape changes that break clients)
- `route_map` → verify consumer awareness
- `api_impact` → pre-change impact on API routes
- Flag any breaking changes that need migration guides or versioning

### Step 9: Testing Review

**Test coverage**:
- Unit tests for new code? Integration tests if needed?
- Edge cases and error cases covered?
- Use `impact({includeTests: true})` results to flag untested changes

**Test quality**:
- Tests are readable and maintainable
- Tests are deterministic — no flaky behavior
- No test interdependencies
- Proper test data setup and teardown
- Descriptive test names that explain the scenario

### Step 10: Documentation Review

- Complex logic explained with comments
- No obvious comments that restate the code
- TODOs have associated tickets
- Function/method documentation for public APIs
- README updated if behavior changes
- Migration guide provided if there are breaking changes

### Step 11: Synthesize and Report

Use Serena's thinking tools to finalize:
- `think_about_collected_information` → is the review thorough? Anything missing?
- `summarize_changes` → generate a structured review summary

---

## Review Report Format

Structure your review output with prioritized findings:

**Issue severity levels**:
- 🔴 **Critical**: Security vulnerabilities, data loss risks, major bugs — must fix before merge
- 🟡 **Important**: Performance issues, maintainability concerns, missing tests — should fix
- 🟢 **Nice-to-have**: Style improvements, minor optimizations — consider fixing

For each finding, provide:
1. What the issue is (specific file and line/symbol)
2. Why it matters
3. A concrete suggestion or code example showing the fix

Acknowledge good work too — positive feedback matters. If you see a clean pattern, good abstraction, or well-structured test, call it out.

**Constructive feedback example**:
> Consider extracting this validation logic into a reusable, testable function:
> ```typescript
> function validateEmail(email: string): boolean { ... }
> ```
> This makes it independently testable and reusable across DTOs.

**Avoid vague feedback** like "Performance issues here" — instead point to the specific query, loop, or allocation and suggest an alternative.

---

## Review Checklist (Quick Reference)

Use this as a final sanity check before submitting your review:

- [ ] Code does what it's supposed to do — edge cases and error cases handled
- [ ] Blast radius assessed for every changed symbol — no unexpected breakage
- [ ] Naming is clear and descriptive throughout
- [ ] Functions are small, focused, with proper error handling
- [ ] No code duplication, dead code, or magic numbers
- [ ] Consistent with codebase style and conventions
- [ ] Input validation on all user-facing inputs
- [ ] No hardcoded secrets or injection vulnerabilities
- [ ] No obvious performance bottlenecks or N+1 queries
- [ ] Tests included with good coverage of changed code
- [ ] API compatibility verified (if API routes changed)
- [ ] TypeScript: no `any`, return types explicit, no unsafe type assertions
- [ ] Async: no floating Promises, proper error handling on every async path
- [ ] NestJS: DTOs validated with class-validator, DI used correctly, correct scope on guards/pipes (if applicable)
- [ ] React: hooks rules followed, effect deps complete, stable list keys, no DOM mutation (if applicable)
- [ ] Next.js: correct data-fetching strategy, server/client component boundaries correct, secrets not in NEXT_PUBLIC_ (if applicable)
- [ ] Documentation updated for behavior changes

---

## Tool Chain Summary

```
detect_changes({scope: "compare", base_ref: "main"})
→ impact per changed symbol (upstream + includeTests)
→ find_symbol({include_body: true}) on changed symbols
→ find_referencing_symbols → verify caller compatibility
→ read_memory → check project conventions
→ [Detailed review: code quality, security, performance, testing, docs]
→ shape_check / route_map / api_impact (if API changes)
→ think_about_collected_information
→ summarize_changes → structured review report
```

---

## Important Guidelines

- **Start with the full change map.** Always run `detect_changes` first to get the complete picture.
- **Check blast radius for every changed symbol.** A seemingly small change can have wide impact.
- **Verify test coverage.** Use `includeTests: true` — flag untested changes explicitly.
- **Check API compatibility.** If any API routes were modified, always run `shape_check` — consumer mismatches are a top source of production issues.
- **Read the actual code.** Don't rely solely on GitNexus impact data — use Serena to read the implementation and verify correctness against the review checklist.
- **Check GitNexus index freshness.** Read `gitnexus://repo/{name}/context` to see when the index was last built. If it's stale, reindex before relying on impact analysis.
- **Be specific and constructive.** Every finding should include what, why, and a suggested fix.
- **Prioritize issues.** Use 🔴/🟡/🟢 severity levels so the author knows what to fix first.
- **Acknowledge good work.** Call out clean patterns and good decisions — positive feedback reinforces quality.

For detailed tool parameters and chaining patterns, read `references/tool-reference.md`.
