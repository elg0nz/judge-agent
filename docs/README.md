# BARDD: Beads Assisted Requirement Driven Docs

**Core Principle:** Code must never exist without docs. Documentation is the Single Point of Truth (SPOT).

---

## Version Naming Convention

Folder name and version tag indicate development status:

| Format | Meaning | Status |
|--------|---------|--------|
| `v0.0.0` | Stable release | ✅ Complete, merged, released |
| `v0.0.1-pre` | Pre-release spec | 📝 Spec written, not yet implemented |
| `v0.0.2-pre` | Future feature spec | 📝 Placeholder, will be filled in |

A `-pre` suffix signals: **"Docs exist. Code does not."**

---

## The 6-Step BARDD Workflow

### Step 1: Create `-pre` Folder
Create `docs/v0.x.y-pre/README.md` with specification template (see below).

### Step 2: Write Complete Spec
Fill in all sections (Overview, Goals, Requirements, Implementation Approach, Acceptance Criteria) before writing any code.

### Step 3: Create Beads Issues
Create one or more Beads issues that:
- Reference the spec folder in the issue
- Link version tag: `[v0.x.y]`
- List acceptance criteria from the spec
- Establish dependency chain if parallelizing

### Step 4: Implement Against Spec
Write code that satisfies the acceptance criteria. Code follows docs, not the reverse.

### Step 5: Rename Folder
After merge to main, rename `v0.x.y-pre/` → `v0.x.y/` to signal release.

### Step 6: Update CHANGELOG
Add `[v0.x.y]` entry with date and all changes. Archive previous `[Unreleased]` section.

---

## Versioned README Template

Every spec folder contains a `README.md` following this structure:

```markdown
# v0.x.y[-pre] — [Feature Name]

**Status:** PRE-RELEASE (spec in progress) OR RELEASED YYYY-MM-DD

## Overview
One paragraph: what problem does this solve? Who benefits?

## Goals
Bullet list of specific, measurable goals.

## Requirements
Numbered list of must-haves. Be concrete.

## Implementation Approach
How will we build this? Architecture overview, key decisions.

## Acceptance Criteria
Checklist of conditions that confirm completion.

## Beads Issues
Link to all related Beads issues with status.

---

**Last Updated:** YYYY-MM-DD
**Spec Owner:** (name/team)
```

---

## How Beads Issues Reference Docs

Every Beads issue targeting a spec version must include:

1. **Spec Link** in the issue body:
   ```
   Spec: [docs/v0.0.1-pre/README.md](../../docs/v0.0.1-pre/README.md)
   ```

2. **Version Tag** in issue title or labels:
   ```
   Title: [v0.0.1] Feature name...
   Label: v0.0.1-pre
   ```

3. **Acceptance Criteria** copied from spec:
   ```
   - [ ] Requirement 1 implemented
   - [ ] Requirement 2 implemented
   - ...
   ```

4. **Dependency Chain** (if parallelizing):
   ```
   Blocked by: #2
   Blocks: #4
   ```

---

## Parallelizing Work with Beads Dependencies

### Example: Three Parallel Streams

**Spec Phase (Sequential):**
1. Write `v0.0.1-pre/README.md` (feature A spec)
2. Write `v0.0.2-pre/README.md` (feature B spec)
3. Write `v0.0.3-pre/README.md` (feature C spec)

**Implementation Phase (Parallel):**
- Issue #2 (Feature A) → no blockers → assign to Dev1, start immediately
- Issue #3 (Feature B) → no blockers → assign to Dev2, start immediately
- Issue #4 (Feature C) → blocked by #2 (depends on A) → assign to Dev3, waits for #2

Once #2 is done, #4 unblocks and Dev3 begins Feature C. Meanwhile, Dev1 and Dev2 work in parallel.

---

## 5 Guiding Principles

### 1. **Docs First**
Write the spec completely before touching code. Spec is the contract between stakeholders and implementers.

### 2. **One Spec, Many Issues**
A single spec version may spawn multiple Beads issues if work can be parallelized (e.g., backend + frontend + tests).

### 3. **Versioned Specs Are Immutable**
Once released (folder renamed from `-pre` to stable), the spec should not change. New changes → new version.

### 4. **CHANGELOG Is Truth**
All released versions documented in `CHANGELOG.md` in keepachangelog 1.1.0 format. Spec changes are tracked here.

### 5. **Transparency**
Every `-pre` folder exists in main branch so stakeholders can see what's planned. Nothing is hidden.

---

## Project Versions

### Released
- **[v0.0.0](v0.0.0/README.md)** — BARDD Scaffolding (2026-03-02)

### In Progress (Pre-Release)
- **[v0.0.1-pre](v0.0.1-pre/README.md)** — [Feature Name TBD]

---

**BARDD Methodology v1.0 — Effective 2026-03-02**
