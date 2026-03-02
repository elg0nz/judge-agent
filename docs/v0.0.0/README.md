# v0.0.0 — Project Setup & Test Harness

**Status:** RELEASED 2026-03-02

## Quick Start (once Beads is installed)

1. **Activate the lightsabers** — Run the tooling stack before any PR/take-home
2. **Create Beads issues for v0.0.1 feature work** — Use the spec template in `docs/v0.0.1-pre/README.md`
3. **Start building in parallel** — No blockers between harness improvements and feature work

---

## Lightsabers (Test Harness)

The two files below are your project's test harness. Use them before any take-home submission, before merging AI-assisted code, or anytime you want to verify code quality.

- **[AI Code Review — Python](lightsabers/ai-code-review-python.md)**
  - Copilot prompt for backend/Python code
  - Tooling stack: Ruff, Mypy, Bandit, Vulture, Radon, flamegraphs
  - Judgment layer: execution flow, correctness, no extra code, principal engineer signal

- **[Glo's Lightsaber — React / TypeScript](lightsabers/ai-code-review-react-lightsaber.md)**
  - Frontend parallel: React/TypeScript AI artifact detection
  - Tooling stack: ESLint, tsc --strict, knip, bundle analysis, React DevTools Profiler
  - Judgment layer: execution flow, correctness, no dead weight, principal signal

**Rule:** Tooling first, then copilot prompt. Don't waste human attention on things linters can find.

---

## Parallel Work Strategy

Once Beads is initialized:

- **Create issue for v0.0.1 feature spec** (no blockers) — Write spec in `docs/v0.0.1-pre/README.md`, create Beads issue
- **Create issue for any harness improvements** (no blockers) — Enhance lightsabers, tooling stack, or review prompts
- **Both can start immediately** — Feature work and harness improvements don't depend on each other

---

## Reference: Original Scaffolding Spec

### What Was Delivered
- Root `README.md` with project overview and doc links
- `docs/README.md` with complete BARDD methodology guide
- `docs/CHANGELOG.md` in keepachangelog 1.1.0 format
- `docs/v0.0.0/` (this folder) with scaffolding spec and lightsabers
- `docs/v0.0.1-pre/` placeholder for first feature spec

### Acceptance Criteria
- [x] `README.md` exists at project root with overview and doc links
- [x] `docs/README.md` contains BARDD methodology and 6-step workflow
- [x] `docs/CHANGELOG.md` exists in keepachangelog format with [0.0.0] entry
- [x] `docs/v0.0.0/README.md` (this file) documents scaffolding completion
- [x] `docs/v0.0.0/lightsabers/` contains test harness files
- [x] `docs/v0.0.1-pre/README.md` exists as placeholder for next feature
- [x] All internal relative links are correct
- [x] Beads issue #1 tracks this scaffolding work

### Beads Issues
| Issue | Title | Status |
|-------|-------|--------|
| [#1](../../../.beads/issues/1.md) | BARDD Scaffolding for judge-agent | ✅ DONE |

---

**Released:** 2026-03-02
**Spec Owner:** judge-agent team
