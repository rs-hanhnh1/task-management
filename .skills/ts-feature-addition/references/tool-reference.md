# Tool Reference: GitNexus & Serena Parameters

Quick reference for tool parameters and usage patterns. Consult this when you need exact parameter names or want to chain tools together.

---

## GitNexus Tools

### `query` — Process-Grouped Hybrid Search
```
query({
  query: string,          // Required. Natural language or keywords
  task_context: string,   // What you're working on (improves ranking)
  goal: string,           // What you want to find (improves ranking)
  limit: number,          // Max processes to return (default: 5)
  max_symbols: number,    // Max symbols per process (default: 10)
  include_content: boolean // Include full source code (default: false)
})
```
Returns: `processes` (ranked execution flows), `process_symbols` (symbols in flows), `definitions` (standalone types).

### `context` — 360-Degree Symbol View
```
context({
  name: string,           // Symbol name (handles disambiguation)
  uid: string,            // Direct UID for zero-ambiguity
  file_path: string,      // Disambiguate by file
  include_content: boolean // Include full source code
})
```
Returns: Symbol location, all categorized edges (CALLS, IMPORTS, EXTENDS, IMPLEMENTS, HAS_METHOD, HAS_PROPERTY, ACCESSES, OVERRIDES), process participation.

### `impact` — Blast Radius Analysis
```
impact({
  target: string,         // Required. Symbol name
  direction: string,      // Required. "upstream" (what depends on this) or "downstream" (what this depends on)
  maxDepth: number,       // Max depth (default: 3)
  relationTypes: array,   // Filter: CALLS, IMPORTS, EXTENDS, IMPLEMENTS, HAS_METHOD, HAS_PROPERTY, OVERRIDES, ACCESSES
  includeTests: boolean,  // Include test files (default: false)
  minConfidence: number   // Minimum confidence 0-1 (default: 0.7)
})
```
Returns: `risk` (LOW/MEDIUM/HIGH/CRITICAL), `byDepth` (d=1 WILL BREAK, d=2 LIKELY AFFECTED, d=3 MAY NEED TESTING), `affected_processes`, `affected_modules`.

### `detect_changes` — Git Diff Impact
```
detect_changes({
  scope: string,          // "unstaged" (default), "staged", "all", "compare"
  base_ref: string        // Branch/commit for "compare" (e.g., "main")
})
```
Returns: `changed_symbols`, `affected_processes`, risk summary.

### `rename` — Multi-File Rename
```
rename({
  symbol_name: string,    // Current name
  symbol_uid: string,     // Direct UID
  new_name: string,       // Required. New name
  file_path: string,      // Disambiguate by file
  dry_run: boolean        // Preview only (default: true)
})
```
Returns: `files_affected`, `total_edits`, edits tagged `"graph"` (safe) or `"text_search"` (review).

### `cypher` — Raw Graph Queries
```
cypher({query: "MATCH (n:Function {name: 'X'}) RETURN n"})
```
Read `gitnexus://repo/{name}/schema` first for the complete node/edge schema.

Useful query patterns:
```cypher
-- All callers of a function
MATCH (caller)-[r:CodeRelation {type: 'CALLS'}]->(f:Function {name: "X"})
RETURN caller.name, caller.filePath, r.confidence

-- All methods of a class
MATCH (c:Class {name: "X"})-[:CodeRelation {type: 'HAS_METHOD'}]->(m:Method)
RETURN m.name

-- Transitive callers (blast chain)
MATCH path = (s)-[:CodeRelation*1..4 {type: 'CALLS'}]->(target:Function {name: "X"})
RETURN [n IN nodes(path) | n.name] AS chain

-- Find diamond inheritance
MATCH (child)-[:CodeRelation {type: 'EXTENDS'}]->(p1),
      (child)-[:CodeRelation {type: 'EXTENDS'}]->(p2),
      (p1)-[:CodeRelation {type: 'EXTENDS'}]->(ancestor),
      (p2)-[:CodeRelation {type: 'EXTENDS'}]->(ancestor)
WHERE p1 <> p2
RETURN child.name, p1.name, p2.name, ancestor.name
```

### `api_impact` — Pre-Change API Route Impact
```
api_impact({
  route: string,          // Route path (e.g., "/api/users")
  file: string            // Handler file path (alternative)
})
```

### `route_map` — API Route Mappings
```
route_map({route: string}) // Optional filter by route path
```

### `shape_check` — API Response Shape Validation
```
shape_check({route: string}) // Optional filter by route path
```

### `tool_map` — MCP/RPC Tool Definitions
```
tool_map({tool: string}) // Optional filter by tool name
```

---

## GitNexus Resources (Read-Only)

| URI | Purpose |
|-----|---------|
| `gitnexus://repos` | All indexed repos with stats |
| `gitnexus://setup` | AGENTS.md content |
| `gitnexus://repo/{name}/context` | Stats, staleness, tool list |
| `gitnexus://repo/{name}/clusters` | Functional areas (Leiden clusters) |
| `gitnexus://repo/{name}/cluster/{clusterName}` | Members of a cluster |
| `gitnexus://repo/{name}/processes` | All execution flows |
| `gitnexus://repo/{name}/process/{processName}` | Step-by-step trace |
| `gitnexus://repo/{name}/schema` | Graph schema for Cypher |

---

## Serena Tools

### Symbol Navigation

#### `get_symbols_overview`
Get all top-level symbols in a file. Use as the first step when exploring a file.
- `relative_path`: file to inspect
- `depth`: 0 = top-level only, 1+ = include children

#### `find_symbol`
```
find_symbol({
  name_path_pattern: string,  // e.g., "MyClass/method", "/MyClass/method" (absolute), "method[1]" (overload)
  relative_path: string,      // Scope to file or directory
  depth: number,              // Child depth (0 = self only)
  include_body: boolean,      // Include source code
  include_info: boolean,      // Include hover/docstring
  include_kinds: array,       // Filter by LSP symbol kind integers
  exclude_kinds: array,
  substring_matching: boolean, // Partial name matching
  max_matches: number         // Limit results
})
```

#### `find_referencing_symbols`
Find all symbols that reference a given symbol. Returns referencing symbol metadata plus code snippets.
- `name_path_pattern`: symbol to find references for
- Other params same as `find_symbol`

### Symbol Editing

#### `replace_symbol_body`
Replace the entire definition of a symbol. Requires the full new body.

#### `insert_after_symbol` / `insert_before_symbol`
Insert new code after/before a symbol. Ideal for adding functions, methods, or imports.

#### `rename_symbol`
LSP-powered rename across the entire codebase. Semantically accurate.

### File Operations

| Tool | Purpose |
|------|---------|
| `list_dir` | List directory (supports `recursive`, `skip_ignored_files`) |
| `find_file` | Glob search (e.g., `*.py`) |
| `read_file` | Read file content (optional `start_line`, `end_line`) |
| `create_text_file` | Create or overwrite a file |
| `replace_content` | Replace via literal or regex pattern |
| `search_for_pattern` | Regex project search with context lines, glob filters |

### Memory System

| Tool | Purpose |
|------|---------|
| `write_memory` | Save knowledge (use `/` for topics: `auth/login/logic`) |
| `read_memory` | Read a memory |
| `list_memories` | List available memories |
| `edit_memory` | Edit via find/replace |

### Thinking Tools (No API calls — prompt injections for structured reasoning)

| Tool | When to call |
|------|-------------|
| `think_about_collected_information` | After gathering data, before editing |
| `think_about_task_adherence` | Before any write operation |
| `think_about_whether_you_are_done` | After implementing changes |
| `summarize_changes` | At the end of a task |

### Other

| Tool | Purpose |
|------|---------|
| `execute_shell_command` | Run shell commands (tests, linting, git) |
| `check_onboarding_performed` | Check if project was onboarded |
| `onboarding` | Run onboarding flow |
| `activate_project` | Switch between projects |
| `get_current_config` | Show active tools, modes, project |

---

## Common Tool Chains

### Understanding: GitNexus→Serena flow
```
list_repos
→ READ gitnexus://repo/{name}/context
→ query({query: "concept"})
→ context({name: "key_symbol"})
→ READ gitnexus://repo/{name}/process/{name}
→ get_symbols_overview (on key files)
→ find_symbol({include_body: true, include_info: true})
→ think_about_collected_information
```

### Debugging: Error → Root Cause → Fix
```
query({query: "error symptom"})
→ context({name: "suspect"})
→ READ process/{name}
→ find_symbol({include_body: true}) on each suspect
→ find_referencing_symbols on error handler
→ think_about_collected_information
→ think_about_task_adherence
→ replace_symbol_body (fix)
→ execute_shell_command (test)
→ detect_changes (verify scope)
→ think_about_whether_you_are_done
```

### Impact Check: Pre-Change Safety
```
impact({target: "X", direction: "upstream", includeTests: true})
→ find_referencing_symbols on d=1 items
→ find_symbol({include_body: true}) on high-risk callers
→ api_impact (if API route involved)
→ think_about_collected_information
```

### Add Feature: Find Location → Implement → Verify
```
query({query: "related concept"})
→ READ clusters → identify module
→ context on entry points
→ read_memory (conventions)
→ find_symbol({include_body: true}) on similar implementations
→ impact({target: "extensionPoint", direction: "upstream"})
→ think_about_task_adherence
→ insert_after_symbol / replace_symbol_body
→ execute_shell_command (test)
→ detect_changes (verify scope)
→ summarize_changes
```

### Rename: Preview → Execute → Verify
```
rename({dry_run: true})
→ impact({direction: "upstream"})
→ rename_symbol (Serena, execute)
→ detect_changes
→ execute_shell_command (test)
```

### PR Review: Diff → Impact → Read → Report
```
detect_changes({scope: "compare", base_ref: "main"})
→ impact per changed symbol
→ impact({includeTests: true}) for coverage
→ find_symbol({include_body: true}) on changed symbols
→ shape_check (if API changes)
→ think_about_collected_information
→ summarize_changes
```
