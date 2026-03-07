---
scorgix_code: 05_NORM
owner: gonz
owning_team: sanscourier
status: Active
sensitivity: Internal
retention: Permanent
system_of_record: Obsidian
related:
  - "[[07_CNTR/02_project-daylight/applications/Application - Member of Technical Staff Backend Alma - 2026-02-11]]"
tags:
  - code-review
  - ai-generated-code
  - take-home
  - principal-engineer
  - checklist
  - copilot-prompt
date: 2026-02-26
---

# AI-Generated Code Review — Copilot Prompt

**Purpose:** A review protocol for AI-assisted codebases. Run this before submitting any take-home, before merging a PR, or any time you want to verify that generated code reads like Glo wrote it — not like an LLM generated it function-by-function.

**Origin:** Distilled from the Alma take-home postmortem (2026-02-26). Two issues — `init_db()` in every function and inline imports — were the literal rejection reason. Both would have been caught in 20 minutes with this protocol.

---

## The Prompt

Copy and paste this into your AI assistant (Claude, Copilot, Cursor, etc.) with the relevant code:

---

```
You are a senior engineering reviewer helping me verify that this code is production-quality and signals principal engineer-level thinking. Review it across four dimensions. Be direct — flag anything that looks like an AI artifact, lazy generation, or a gap in judgment.

---

**1. EXECUTION FLOW**
Trace the code's actual runtime path.
- Where does initialization happen? DB connections, engines, clients, ML models — does it happen once at startup or per-call?
- Are there any functions that call setup/init logic they shouldn't own?
- Is the lifecycle correct? (startup → handle requests → shutdown — not setup-per-request)
- Are there any N+1 patterns, redundant calls, or repeated work in hot paths?
- Flag anything that would be inefficient or wrong at scale.

**2. CORRECTNESS**
- Does the logic actually do what it claims?
- Are edge cases handled (empty inputs, missing keys, null values, failed external calls)?
- Is error handling consistent and intentional — or scattered and copy-pasted?
- Are HTTP status codes, return types, and response shapes consistent?
- Are there any silent failures (empty `except` blocks, swallowed errors, missing `.raise_for_status()`)?

**3. NO EXTRA CODE**
- Are there inline imports inside function bodies that should be at the top of the file?
- Is there dead code — commented-out blocks, unused variables, unreachable branches?
- Are there duplicated patterns that should be extracted into a shared utility?
- Is anything being initialized or instantiated that's already available in scope?
- Would a human maintaining this codebase in 6 months be confused by anything that's here?

**4. PRINCIPAL ENGINEER SIGNAL**
- Does the architecture reflect deliberate tradeoffs, or just defaults?
- Is shared state managed intentionally (singletons, module-level, dependency injection)?
- Are abstractions at the right level — not too granular, not over-engineered?
- Does the code reflect understanding of the full system (startup, teardown, failure modes) — or just the happy path?
- Would a principal engineer at a Series B startup be comfortable shipping this?

---

For each issue found: name it, show the specific line or pattern, explain why it matters, and give the fix. Don't soften anything.
```

---

## Automated Gate (Pre-Commit Hook)

**The lightsaber fails if it isn't run. The hook runs whether you remember or not.**

A `.husky/pre-commit` hook runs Ruff on every staged `.py` file before the commit lands.
Activate it after cloning:

```bash
git config core.hooksPath .husky
```

---

## Tooling First (Armin Ronacher Principle)

> "Use tooling as much as possible. Minimize manual review."

Tools catch the mechanical issues. The copilot prompt above is for the judgment layer — architecture, tradeoffs, signal. Don't waste human attention on things a linter can find.

Run this stack **before** the prompt. If tooling is clean, the prompt focuses on what actually requires thinking.

---

### Python Stack

**Linting & Style**
```bash
# Ruff — fast, catches unused imports, inline imports, dead code, style
pip install ruff
ruff check .

# Ruff auto-fix (safe transforms)
ruff check --fix .

# Catches: inline imports, unused variables, shadowed names, bare excepts
```

**Static Analysis & Type Checking**
```bash
# Mypy — type errors, unreachable code, missing return types
pip install mypy
mypy . --ignore-missing-imports

# Pyright (stricter, better for AI-generated code)
pip install pyright
pyright .

# Both catch: wrong types passed to DB functions, missing None checks,
# functions that claim to return X but sometimes return None
```

**Security & Anti-patterns**
```bash
# Bandit — security issues, but also catches structural anti-patterns
pip install bandit
bandit -r . -ll

# Vulture — dead code detection
pip install vulture
vulture . --min-confidence 80
```

**Complexity**
```bash
# Radon — cyclomatic complexity. Flag anything > 10.
pip install radon
radon cc . -a -nb

# High complexity = AI wrote a function that does too many things
```

---

### Performance: Flamegraphs

For take-homes with any non-trivial execution (DB calls, API endpoints, pipelines):

```bash
# py-spy — production-safe profiler, no code changes needed
pip install py-spy
py-spy record -o flamegraph.svg -- python -m uvicorn app.main:app

# Then hit your endpoint a few times and Ctrl+C
# Open flamegraph.svg in browser
```

What flamegraphs catch that linters miss:
- `init_db()` per-call shows up as a tall, repeated stack frame under every handler
- N+1 queries show as repeated DB call stacks
- Slow imports (module-level or inline) show as startup cost
- Unexpected work happening in hot paths

For DB-heavy code:
```bash
# SQLAlchemy query logging — set in your app config
import logging
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

# Or for SQLite, enable query logging directly
# Shows you exactly how many times init_db ran
```

---

### One-Command Pre-Submit Sweep (Python)

Add this as `scripts/presubmit.sh`:

```bash
#!/bin/bash
set -e

echo "=== Ruff (lint + style) ==="
ruff check .

echo "=== Mypy (types) ==="
mypy . --ignore-missing-imports

echo "=== Bandit (security) ==="
bandit -r . -ll -q

echo "=== Vulture (dead code) ==="
vulture . --min-confidence 80

echo "=== Complexity (flag >10) ==="
radon cc . -nb --min B

echo "=== Inline imports ==="
grep -rn "^    import\|^        import\|^    from " --include="*.py" . && echo "⚠️  Inline imports found" || echo "✓ Clean"

echo "=== Repeated init calls ==="
grep -rn "init_db\|setup_db\|create_engine(" --include="*.py" . | grep -v "^Binary\|def init_db\|def setup_db"

echo "=== All clear. Run the copilot prompt for judgment layer. ==="
```

```bash
chmod +x scripts/presubmit.sh && ./scripts/presubmit.sh
```

---

### What Tooling Catches vs. What the Prompt Catches

| Issue | Tool | Prompt |
|---|---|---|
| Inline imports | Ruff `E401`/`PLC0415` | — |
| `init_db()` per call | Flamegraph + grep | Execution flow |
| Dead code | Vulture | No extra code |
| Type mismatches | Mypy/Pyright | Correctness |
| Cyclomatic complexity | Radon | Principal signal |
| Silent exceptions | Bandit `B110` | Correctness |
| Architectural tradeoffs | — | Principal signal |
| Right abstraction level | — | Principal signal |
| System-level thinking | — | Principal signal |

**Rule:** If a tool can catch it, the tool catches it. The prompt only sees what's left.

---

## Usage Notes

**When to use this:**
- Before any take-home submission — non-negotiable
- Before opening a PR on AI-assisted code
- When you want a second pair of eyes on a generated module

**How to use it:**
1. Run `scripts/presubmit.sh` (or the individual tool commands) — fix everything tooling catches first
2. Run a flamegraph if there's any non-trivial execution path
3. Once tooling is clean, paste the copilot prompt with the code for the judgment layer
4. For large codebases, run per-file on the highest-risk files first: DB layer, API routes, auth

---

## The Four Things Glo Cares About

| # | Dimension | What it catches |
|---|---|---|
| 1 | **Execution flow** | `init_db()` per function, N+1s, wrong lifecycle |
| 2 | **Correctness** | Edge cases, silent failures, inconsistent error handling |
| 3 | **No extra code** | Inline imports, dead code, duplication |
| 4 | **Principal engineer signal** | Intentional architecture, right abstractions, system thinking |

---

*05_NORM — Sova 🦉 — 2026-02-26*
