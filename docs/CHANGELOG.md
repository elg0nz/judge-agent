# Changelog

All notable changes to the judge-agent project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/) (v1.1.0) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Guiding Principles
- **Added:** New features or functionality
- **Changed:** Changes to existing functionality
- **Deprecated:** Soon-to-be removed features (with deprecation period noted)
- **Removed:** Deleted features or code
- **Fixed:** Bug fixes
- **Security:** Security vulnerability fixes

---

## [Unreleased]
### Added
- (Active work will be listed here as v0.0.2-pre development begins)

---

## [0.0.1] — 2026-03-02

### Added
- `POST /judge` API endpoint: accepts `{ content }`, returns `{ score, signals, explanation }`
- `DetectionOutput` schema: humanness score 0–100 (100=human, 0=AI), top signals, explanation
- AI detection prompt: structural, vocabulary, and coherence signal rubric
- Judge UI: textarea input, score display with color coding, signals list, explanation
- Eval fixtures: 5 AI samples + 5 human samples in `backend/tests/fixtures/`
- Eval script `backend/tests/eval_detection.py`: validates AI < 30, human > 70

### Changed
- Replaced broad `JudgeOutput` (origin, virality, distribution, explanation) with focused `DetectionOutput`
- Simplified agent prompt to AI detection only (removed virality and distribution analysis)

### Removed
- `JudgeOutput`, `ViralityAnalysis`, `AudienceSegment`, `AudienceReaction`, `OriginPrediction` models (deferred to v0.0.2)

---

## [0.0.0] — 2026-03-02

### Added
- Root `README.md` with project overview and documentation structure
- `docs/README.md` with complete BARDD methodology, 6-step workflow, and guiding principles
- `docs/CHANGELOG.md` (this file) in keepachangelog 1.1.0 format
- `docs/v0.0.0/README.md` documenting BARDD scaffolding completion
- `docs/v0.0.1-pre/README.md` as placeholder for first feature specification
- Foundation for requirements-driven development workflow with Beads issue tracking

---

**Legend:** `[version]` = released; `[version-pre]` = pre-release spec (not yet implemented)
