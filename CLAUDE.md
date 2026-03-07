# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**judge-agent** is a judicial reasoning and decision-making agent for the Feltsense platform. The project follows **BARDD** (Beads Assisted Requirement Driven Docs), a methodology where documentation is the Single Point of Truth and must be written before code.

**Current Status:** Scaffolded with BARDD framework. No code yet—v0.0.0 provides the testing harness (lightsabers), v0.0.1-pre placeholder waits for feature spec.

---

## BARDD Methodology

**Core principle:** Docs first, code second. Every feature follows this 6-step workflow:

1. **Create `-pre` spec folder** — `docs/v0.x.y-pre/README.md`
2. **Write complete spec** — Overview, Goals, Requirements, Implementation Approach, Acceptance Criteria
3. **Create Beads issues** — Reference the spec, list acceptance criteria
4. **Implement against spec** — Code satisfies acceptance criteria
5. **Rename folder** — After merge: `v0.x.y-pre/` → `v0.x.y/`
6. **Update CHANGELOG** — Add version entry in keepachangelog format

See [docs/README.md](docs/README.md) for full methodology guide.

---

## Key Commands

### Beads Issue Tracking

The `bd` (beads) command manages issues and work tracking:

```bash
bd ready              # Find available work (no blockers)
bd list --status=open # See all open issues
bd show <id>          # View issue details with full context
bd create --title="..." --type=task --priority=2  # Create new issue
bd update <id> --status=in_progress  # Claim work
bd close <id>         # Mark issue complete
bd sync               # Sync with git remote (run at session end)
```

### Landing the Plane: Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** — Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) — Run lightsabers (Python/React tools) or project-specific tests
3. **Update issue status** — Close finished work, update in-progress items
4. **PUSH TO REMOTE** — This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** — Clear stashes, prune remote branches
6. **Verify** — All changes committed AND pushed
7. **Hand off** — Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing — that leaves work stranded locally
- NEVER say "ready to push when you are" — YOU must push
- If push fails, resolve and retry until it succeeds

---

## Project Structure

```
judge-agent/
├── README.md                    # Project overview
├── AGENTS.md                    # AI agent workflow instructions
├── CLAUDE.md                    # This file
├── docs/
│   ├── README.md                # BARDD methodology guide
│   ├── CHANGELOG.md             # keepachangelog format
│   ├── v0.0.0/                  # Released BARDD scaffolding
│   │   ├── README.md            # Scaffolding completion spec
│   │   └── lightsabers/         # Test harness prompts
│   │       ├── ai-code-review-python.md
│   │       └── ai-code-review-react-lightsaber.md
│   └── v0.0.1-pre/              # Next feature placeholder
│       └── README.md            # Feature spec (TBD)
└── .beads/                      # Git-backed issue database
    ├── config.yaml              # Beads configuration
    └── beads.db                 # Issue store
```

No code directories yet—they will be created as specs are implemented.

---

## Development Workflow

### Starting a Feature

1. **Complete the spec** — Fill in `docs/v0.x.y-pre/README.md`:
   - Overview: Problem statement
   - Goals: Measurable outcomes
   - Requirements: Concrete must-haves
   - Implementation Approach: Architecture overview
   - Acceptance Criteria: Checklist for verification

2. **Create Beads issues** — One or more issues referencing the spec:
   ```bash
   bd create --title="[v0.0.1] Feature: ..." --type=task --priority=2 \
     --description="Spec: docs/v0.0.1-pre/README.md
     - [ ] Requirement 1
     - [ ] Requirement 2"
   ```

3. **Claim work** — Mark issue in progress:
   ```bash
   bd update <id> --status=in_progress
   ```

4. **Implement** — Write code satisfying acceptance criteria

5. **Close issue and land the plane** — See [AGENTS.md](AGENTS.md) for mandatory session completion steps

### Parallelizing Work

- Feature specs can be written independently (no blockers)
- Create Beads issues for each parallelizable work stream
- Use `bd dep add <issue> <depends-on>` to establish dependencies
- Issues with no blockers (`bd ready`) can start immediately

---

## Frontend Component Rules

**One component per file — no exceptions.**

- Every React component lives in its own file under `frontend/app/components/`
- `page.tsx` files contain only the page-level default export (routing shell, no UI logic)
- Pure helper functions go in `frontend/app/lib/helpers.ts`
- The `react/no-multi-comp` ESLint rule is set to `error` and enforces this automatically
- If you need a tiny presentational sub-component, it still gets its own file

**Enforcement:** A `.husky/pre-commit` hook runs ESLint on every staged `.ts`/`.tsx` file and blocks the commit on any violation. This is not optional. If you clone this repo, activate it:

```bash
git config core.hooksPath .husky
```

---

## Test Harness: Lightsabers

**Location:** `docs/v0.0.0/lightsabers/`

Before submitting code or merging AI-assisted work, run the test harness:

- **[AI Code Review — Python](docs/v0.0.0/lightsabers/ai-code-review-python.md)**
  - Tools: Ruff, Mypy, Bandit, Vulture, Radon, flamegraphs
  - Use for backend/Python code

- **[Glo's Lightsaber — React / TypeScript](docs/v0.0.0/lightsabers/ai-code-review-react-lightsaber.md)**
  - Tools: ESLint, tsc --strict, knip, bundle analysis, React DevTools Profiler
  - Use for frontend/TypeScript code

**Rule:** Linters before human review. Don't waste attention on things tools can find.

---

## Versioning & Releases

### Version Naming
- `v0.x.y` — Stable release (folder name, tag, CHANGELOG entry)
- `v0.x.y-pre` — Pre-release spec (docs exist, code does not)

### Release Process
1. Merge feature branch to `main`
2. Rename `docs/v0.x.y-pre/` → `docs/v0.x.y/`
3. Add `[v0.x.y]` entry to `CHANGELOG.md`
4. Tag commit with `v0.x.y`

See [CHANGELOG.md](docs/CHANGELOG.md) for keepachangelog 1.1.0 format.

---

## Key Decisions & Constraints

- **Documentation is the Single Point of Truth** — Specs must be complete and approved before implementing
- **No hidden work** — All planned features exist in `docs/v0.x.y-pre/` folders in `main` branch
- **Specs are immutable once released** — New changes require new version (v0.x.z)
- **Beads links all work to specs** — Every issue references a spec folder and version tag
- **Parallelization via dependencies** — Use Beads issue linking to manage work streams

---

## When Creating New Code

1. **Verify spec exists** — Feature should have `docs/v0.x.y-pre/README.md` or `docs/v0.x.y/README.md`
2. **Reference acceptance criteria** — Code implementation checklist from spec
3. **Run lightsabers before PR** — Use appropriate test harness
4. **Update CHANGELOG after merge** — Add version entry with "Added" / "Changed" / "Fixed" sections

---

## Context for Next Sessions

- **Project is in early spec phase** — No code exists yet (v0.0.0 is scaffolding only)
- **v0.0.1 feature spec is TBD** — Needs completion before implementation can start
- **Beads is central to workflow** — All work tracked via `bd` command; sync at session end
- **Lightsabers provide quality gates** — AI code review tooling (Python and React/TS)
- **BARDD methodology is non-negotiable** — Docs first, code second

---

**Last Updated:** 2026-03-02
**Relevant Docs:** [BARDD Methodology](docs/README.md) | [AGENTS.md](AGENTS.md) | [CHANGELOG](docs/CHANGELOG.md)
