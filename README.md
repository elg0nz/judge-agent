# judge-agent

A judge agent that evaluates text and video content for AI vs. human origin, virality potential, audience distribution, and produces a traceable explanation for each output.

---

## 🗂 Start Here

Two documents define this project — read these before touching code:

- **[ASSIGNMENT.md](docs/ASSIGNMENT.md)** — Original Feltsense take-home spec. The problem statement, constraints, and what success looks like.
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — Design decisions, build sequence (text → transcripts → video frames), tech stack rationale, and file structure.

---

## 📚 Documentation

This project follows **BARDD** (Beads Assisted Requirement Driven Docs) — specs are written before code, and docs are the Single Point of Truth.

- **[BARDD Methodology](docs/README.md)** — How we work: 6-step workflow, versioning, Beads integration
- **[CHANGELOG](docs/CHANGELOG.md)** — What changed: released versions in keepachangelog format
- **Versioned Specs:**
  - ✅ [v0.0.0 — BARDD Scaffolding](docs/v0.0.0/README.md) (Released 2026-03-02)
  - 📝 [v0.0.1-pre — Next Feature](docs/v0.0.1-pre/README.md) (Spec in progress)

---

## 🚀 Quick Start

**To add a new feature:**
1. Complete the spec in `docs/v0.x.y-pre/README.md`
2. Create Beads issues referencing the spec
3. Implement code against acceptance criteria
4. Rename folder from `-pre` to stable after merge
5. Update CHANGELOG

→ See [BARDD Methodology](docs/README.md) for full details.

---

## 📖 Project Structure

```
judge-agent/
├── README.md              ← You are here
├── docs/
│   ├── README.md          ← BARDD methodology guide
│   ├── CHANGELOG.md       ← All releases documented
│   ├── v0.0.0/            ← Released scaffolding spec
│   │   └── README.md
│   ├── v0.0.1-pre/        ← Next feature (spec in progress)
│   │   └── README.md
│   └── [more versions...]
└── [code directory structure - comes after specs]
```

---

**Status:** Scaffolded with BARDD, ready for first feature spec.
**Last Updated:** 2026-03-02
