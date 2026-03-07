---
scorgix_code: 05_NORM
owner: gonz
owning_team: sanscourier
status: Active
sensitivity: Internal
retention: Permanent
system_of_record: Obsidian
related:
  - "[[05_NORM/ai-code-review-copilot]]"
  - "[[07_CNTR/02_project-daylight/applications/Application - Member of Technical Staff Backend Alma - 2026-02-11]]"
tags:
  - code-review
  - ai-generated-code
  - react
  - typescript
  - frontend
  - take-home
  - principal-engineer
  - lightsaber
date: 2026-02-26
---

# Glo's Lightsaber — React / TypeScript AI Code Review

**Purpose:** Personal review stack for AI-assisted React/TypeScript codebases. Frontend parallel to the backend copilot. Run tooling first, prompt second. Manual review only for what tooling can't reach.

**Principle (Armin Ronacher):** Tools catch the mechanical stuff. The prompt catches judgment. Don't grep for what ESLint can find.

---

## React-Specific AI Artifact Patterns

LLMs generate React code component-by-component, without seeing the full tree. The fingerprints are different from backend code but equally readable:

| Pattern | What it looks like | Why it's an artifact |
|---|---|---|
| **Multiple components per file** | `export function Button() {}` and `export function Modal() {}` in the same file | LLM adds helper components inline rather than creating files |
| **Inline handler definitions** | `onClick={() => doSomething(id)}` in JSX with non-trivial logic | LLM writes the minimal working unit; doesn't extract |
| **Missing or wrong `useCallback`/`useMemo`** | Expensive computations or callbacks recreated every render | LLM rarely reasons about render performance |
| **`useEffect` with missing/wrong deps** | Effects that should run once running on every render, or vice versa | One of the most common LLM React mistakes |
| **Prop drilling past 2 levels** | `<A prop={x}><B prop={x}><C prop={x} /></B></A>` | LLM doesn't see the component tree holistically |
| **`any` type everywhere** | `const data: any = ...` | LLM avoids type work when generating fast |
| **Hardcoded values in components** | Magic strings, pixel values, timeouts in JSX | LLM writes for the immediate case, not the system |
| **State that should be URL/server state** | `useState` for things that should be in React Query, Zustand, or URL params | LLM defaults to local state |
| **Missing error boundaries** | Async components with no fallback | LLM writes the happy path |
| **`key={index}` in lists** | `{items.map((item, i) => <Item key={i} />)}` | Classic LLM shortcut |

---

## Automated Gate (Pre-Commit Hook)

**The lightsaber fails if it isn't run. The hook runs whether you remember or not.**

A `.husky/pre-commit` hook runs ESLint on every staged `.ts`/`.tsx` file before the commit lands.
It blocks the commit if any rule fails — including `react/no-multi-comp`.

```bash
# Verify the hook is active
cat .git/config | grep hooksPath   # should show: hooksPath = .husky

# If cloning fresh, re-enable the hook path
git config core.hooksPath .husky
```

If you bypass the hook (`--no-verify`), you own the breakage. Don't.

---

## The Tooling Stack

### Step 1: Lint & Style
```bash
# ESLint with TypeScript and React rules
npx eslint . --ext .ts,.tsx

# Must-have rule sets:
# - @typescript-eslint/recommended
# - eslint-plugin-react
# - eslint-plugin-react-hooks  ← catches useEffect dep issues
# - eslint-plugin-jsx-a11y    ← accessibility (signals polish)

# One-component-per-file rule (add to .eslintrc):
# "react/no-multi-comp": ["error", { "ignoreStateless": false }]
```

**The one-component-per-file rule is Glo's rule.** Add it explicitly. ESLint will enforce it. LLMs violate it constantly.

```json
// .eslintrc snippet
{
  "rules": {
    "react/no-multi-comp": ["error", { "ignoreStateless": false }],
    "react-hooks/exhaustive-deps": "error",
    "react-hooks/rules-of-hooks": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

### Step 2: Type Checking
```bash
# Strict TypeScript — no any, no implicit any, no unchecked indexing
npx tsc --noEmit --strict

# If tsconfig doesn't have strict mode on, it's not a real type check
# strict: true enables: noImplicitAny, strictNullChecks, strictFunctionTypes, etc.
```

### Step 3: Dead Code
```bash
# knip — finds unused exports, components, types, and files
npx knip

# ts-prune — simpler dead export finder
npx ts-prune

# Catches: components defined but never used, exported types nobody imports,
# utility functions the LLM generated but never wired up
```

### Step 4: Bundle & Performance
```bash
# If using Vite:
npx vite build --report
# Check bundle size — LLMs import entire libraries when they should tree-shake

# If using Next.js:
npx next build
# @next/bundle-analyzer for visual treemap

# Check for:
# - Full lodash import instead of lodash/get
# - moment.js (should be date-fns or dayjs)
# - Unoptimized images (no next/image, no lazy loading)
```

### Step 5: React-Specific Performance
```bash
# React DevTools Profiler (browser)
# Record a render cycle and look for:
# - Components rendering when they shouldn't (missing memo)
# - Waterfall renders (data fetching not parallelized)
# - Expensive computations happening on every render

# why-did-you-render (dev dependency)
# npm install @welldone-software/why-did-you-render
# Logs unnecessary renders to console — add to dev entry point
```

### One-Command Presubmit
```bash
#!/bin/bash
set -e

echo "=== ESLint (lint + React rules) ==="
npx eslint . --ext .ts,.tsx

echo "=== TypeScript (strict type check) ==="
npx tsc --noEmit --strict

echo "=== Dead code (knip) ==="
npx knip

echo "=== Build check ==="
npx vite build 2>&1 | tail -20   # or: npx next build

echo "=== One component per file ==="
# Quick grep — ESLint catches it, but this is instant visual confirmation
grep -rn "^export function\|^export const\|^export default function" --include="*.tsx" . \
  | awk -F: '{print $1}' | sort | uniq -d | while read f; do
    echo "⚠️  Multiple exports in: $f"
  done

echo "=== key={index} anti-pattern ==="
grep -rn "key={index}\|key={i}\|key={idx}" --include="*.tsx" . && echo "⚠️  Found" || echo "✓ Clean"

echo "=== any type usage ==="
grep -rn ": any\|as any\|<any>" --include="*.ts" --include="*.tsx" . && echo "⚠️  Found" || echo "✓ Clean"

echo "=== All clear. Run copilot prompt for judgment layer. ==="
```

---

## The Copilot Prompt (React / TypeScript)

Paste this with your component files after tooling runs clean:

---

```
You are a senior frontend engineering reviewer helping me verify that this React/TypeScript code
is production-quality and signals principal engineer-level thinking. ESLint, tsc --strict, and
dead code analysis have already run clean. Focus on what tools can't catch.

Review across four dimensions. Be direct. Flag AI artifacts, lazy generation, and gaps in judgment.
Name the specific file/line, why it matters, and the fix.

---

1. EXECUTION FLOW & COMPONENT ARCHITECTURE
- Is each component in its own file? If not, is there a documented reason?
- Is data fetching colocated correctly — or are components fetching data they should receive as props?
- Are there any waterfall fetches that should be parallelized (Promise.all, React Query parallel queries)?
- Does the component tree make sense? Or is there prop drilling past 2 levels that signals missing context/state management?
- Are any components doing too many things (fetch + transform + render + handle submission in one component)?

2. CORRECTNESS & EDGE CASES
- Loading states: does every async operation have a loading state rendered?
- Error states: does every async operation have an error fallback? Are there missing error boundaries?
- Empty states: what renders when the data is empty/null/undefined?
- Are list keys stable and unique (not array index)?
- Are there any race conditions in useEffect (missing cleanup / missing AbortController)?
- Form validation: is it client-side only, or properly duplicated server-side?

3. NO DEAD WEIGHT
- Are there components, hooks, or utilities defined but not used?
- Are there props defined in the interface that are never passed?
- Are there useEffect or useMemo calls whose deps are wrong (over-specified or under-specified)?
- Is there commented-out JSX or console.log statements?
- Are there hardcoded values (magic strings, pixel values, timeouts) that should be constants or config?

4. PRINCIPAL SIGNAL
- Is state at the right level? (Local vs. lifted vs. global vs. URL vs. server)
- Are expensive computations memoized? Are callbacks stable across renders where it matters?
- Does the component API (props interface) reflect how a human would design it, or how an LLM would generate it function-by-function?
- Would a principal frontend engineer at a Series B be comfortable shipping this?
- What does this code NOT handle that a production React app would need to? (SSR, hydration, a11y, i18n, theming)
```

---

## The Four Dimensions (React)

| # | Dimension | Top tool | Top artifact |
|---|---|---|---|
| 1 | **Execution flow** | React Profiler / DevTools | Waterfall fetches, prop drilling, bloated components |
| 2 | **Correctness** | ESLint react-hooks | Missing loading/error/empty states, wrong useEffect deps, key={index} |
| 3 | **No dead weight** | knip + grep | Multi-component files, unused props, hardcoded values, console.logs |
| 4 | **Principal signal** | tsc --strict + code read | State at wrong level, unstable callbacks, missing memoization, no error boundaries |

---

## Glo's Standing Rules (Non-Negotiable)

1. **One component per file.** No exceptions without a documented reason. ESLint enforces it.
2. **No `any`.** If you can't type it, you don't understand it. tsc --strict catches it.
3. **`useEffect` deps must be correct.** `eslint-plugin-react-hooks` errors are errors, not warnings.
4. **Every async operation needs loading + error + empty state.** Three states, minimum.
5. **No `key={index}` in lists with dynamic data.** Use stable IDs.
6. **State lives at the right level.** Local → lifted → context → server. Don't skip levels.

---

## Quick Reference: AI Artifact → Fix

| Artifact | Grep / ESLint Rule | Fix |
|---|---|---|
| Multiple components in `.tsx` | `react/no-multi-comp` | Split into separate files |
| `useEffect` wrong deps | `react-hooks/exhaustive-deps` | Add missing deps or restructure |
| `: any` / `as any` | `@typescript-eslint/no-explicit-any` | Type it properly |
| `key={index}` | Custom ESLint rule or grep | Use stable ID from data |
| Unused component/export | `knip` | Delete it |
| Prop drilling >2 levels | Code read / prompt | Lift to context or state manager |
| Missing error boundary | Code read / prompt | Add `<ErrorBoundary>` wrapper |
| Inline handler with logic | Code read / prompt | Extract to named function / `useCallback` |
| Hardcoded magic value | grep for numbers/strings in JSX | Extract to constant or config |

---

*05_NORM — Glo's React Lightsaber — Sova 🦉 — 2026-02-26*
