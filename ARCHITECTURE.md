# Judge Agent — Architecture

## Problem Framing

Given a piece of content (text or video), produce four outputs:
1. **Origin prediction** — AI-generated vs. human-generated (with confidence)
2. **Virality score** — likelihood of strong social performance (0–100)
3. **Distribution analysis** — which audiences/communities it would resonate with and why
4. **Explanation** — traceable reasoning for each output

The spec is intentionally open. The design decisions below are explicit choices, not defaults.

---

## Build Sequence

Phased delivery — each phase is independently functional and shippable:

| Phase | Input | New Capability |
|---|---|---|
| **1 — Text** | Raw text string | Full judge pipeline: origin, virality, distribution, explanation |
| **2 — Transcripts** | Text file or SRT/VTT | Same pipeline applied to video transcript; audio-derived signals added |
| **3 — Video Frames** | Video file / URL | Keyframe extraction via ffmpeg; visual signals added to judge context |

Each phase extends the ingestion layer only — the judge prompt and output schema stay stable across all three.

---

## Core Design Decisions

### 1. Single Agno Agent, Structured Output (not multi-agent)

**Decision:** One Agno agent, one LLM call per content item. Agno handles model abstraction and tool binding; the agent produces all four outputs as structured JSON in a single reasoning pass.

**Rationale:**
- All four outputs are correlated — a single reasoning pass produces more internally consistent explanations than stitching independent sub-agent outputs
- Agno as abstraction layer means swapping models (Claude → GPT-4o → Gemini) requires no prompt rewrites
- Easier to trace: the explanation references the same signals used for all scores

**Natural next step:** Promote to multi-agent (one Agno agent per output type) for independent tuning and testability — but out of scope for this build.

---

### 2. Video Handling: Phased, Transcript-First

**Phase 2 — Transcripts:**
- Accept a plain text file, SRT, or VTT as input
- Strip timing metadata from SRT/VTT, pass clean transcript to judge
- Adds audio-derived signals: disfluency markers, pacing, filler words (visible in SRT timing gaps)

**Phase 3 — Video Frames:**
- Extract keyframes via ffmpeg (1 frame per N seconds, configurable)
- Pass frames to vision-capable model alongside transcript
- Adds visual signals: lighting uniformity, background complexity, text overlays, facial presence

**Rationale:**
- Transcript alone captures the majority of AI-detection and virality signal
- Frames add visual confirmation but are not required for a functional judge
- Phasing means Phase 2 is shippable before ffmpeg is wired up

**Out of scope (all phases):** Motion analysis, deepfake frame-interpolation detection, audio artifact detection (requires specialized models)

---

### 3. AI Detection Strategy: Heuristic Signal Bundle

No single reliable AI-detection signal exists. Instead, the judge evaluates a bundle:

**For text:**
- Structural uniformity (paragraph length variance, sentence rhythm)
- Vocabulary distribution (high-frequency "AI tells": "delve", "tapestry", "nuanced", hedge phrases)
- Logical coherence vs. hallucination markers
- Emotional register (AI tends toward neutral-positive)
- Specificity of claims (AI often gestures at specifics without grounding them)

**For video/transcript:**
- Same text signals applied to transcript
- Visual signals: lighting uniformity, background complexity, camera motion patterns
- Pacing: AI-generated voiceovers tend toward consistent cadence, no disfluencies
- Authenticity markers: ambient noise, stumbles, natural topic tangents

**Output:** confidence score (0–1) + top 3 signals that drove the prediction

---

### 4. Virality Score: Structure-Based Heuristics

No access to engagement data. Score is based on content structure signals correlated with social performance:

- **Hook strength** (first 3 seconds / first sentence)
- **Emotional valence** (high arousal → shares; low arousal → saves)
- **Controversy potential** (takes a position vs. reports neutrally)
- **Format fit** (does length/format match platform norms?)
- **Relatability vs. aspiration** balance
- **Narrative arc** (does it have one?)

Score is 0–100, not a probability. Explained as "estimated relative to average content in this format."

---

### 5. Distribution Analysis: Audience Persona Mapping

LLM-driven. Given the content + signals, identify 2–4 audience segments likely to engage:
- Defined by interest graph (what they follow/share), not demographics
- Each segment gets: name, why they'd engage, likely reaction (share/save/comment/ignore)
- Explicitly notes which platforms each segment indexes on

---

## System Architecture

```
Input
  Phase 1: text string
  Phase 2: text file | .srt | .vtt
  Phase 3: video file | URL
        │
        ▼
┌───────────────────────────────┐
│  Ingestion Layer              │
│  Phase 1: passthrough         │
│  Phase 2: transcript parser   │  ← strips SRT/VTT timing
│  Phase 3: ffmpeg keyframes    │  ← adds image context
└────────┬──────────────────────┘
         │
         ▼
┌───────────────────┐
│  Signal Extractor │  (lightweight preprocessing)
│  - Structural metrics
│  - Vocabulary flags
│  - Metadata
└────────┬──────────┘
         │
         ▼
┌────────────────────────┐
│  Judge LLM             │  (Claude claude-3-5-sonnet or GPT-4o)
│  System prompt:        │
│  - Signal bundle       │
│  - Scoring rubrics     │
│  - Output schema       │
└────────┬───────────────┘
         │
         ▼
┌───────────────────┐
│  Output Parser    │  → validates JSON schema
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Response         │
│  {                │
│    origin: {      │
│      prediction,  │
│      confidence,  │
│      signals[]    │
│    },             │
│    virality: {    │
│      score,       │
│      drivers[]    │
│    },             │
│    distribution: [│
│      { segment,   │
│        platforms, │
│        reaction } │
│    ],             │
│    explanation:   │
│      string       │
│  }                │
└───────────────────┘
```

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Language | Python 3.11+ | fastest path for LLM + media tooling |
| API framework | FastAPI | async, typed, auto-generates OpenAPI docs |
| Durable execution | DBOS | workflow resumability — if frame extraction or LLM call fails mid-pipeline, it resumes from last checkpoint without re-running completed steps |
| Agent framework | Agno | LLM abstraction + agent orchestration layer |
| LLM | Anthropic Claude (claude-3-5-sonnet) | vision support, structured output, available |
| Video processing | ffmpeg (keyframes) | keyframe extraction for Phase 3 |
| Frontend | Next.js + TypeScript + React | UI for submitting content + viewing judge output (stretch goal — core deliverable is the API) |
| Output | JSON via FastAPI response model | machine-readable, auto-documented |
| Tests | pytest + recorded fixtures | fast, no live API calls in CI |

---

## Explicit Assumptions

1. "Video" means a file path or URL to a video file — not a live stream
2. Virality is evaluated against general social media norms, not a specific platform (unless specified)
3. AI detection is probabilistic — the agent does not claim certainty
4. The judge is opinionated: it makes a call and explains it, rather than hedging into uselessness
5. Video processing is scoped to transcript + sampled frames — full temporal analysis is out of scope

---

## What I'd Improve With More Time

- **Multi-agent architecture** — promote from single Agno agent to one agent per output type (origin, virality, distribution); each independently tunable and testable
- **Specialized AI detection model** — fine-tuned classifier (e.g., trained on known AI vs. human datasets) for text; C2PA metadata check for images/video
- **Platform-specific virality models** — TikTok virality ≠ LinkedIn virality; separate scoring rubrics per platform
- **Retrieval-augmented distribution analysis** — pull actual community data (subreddits, X communities) to ground the audience segments
- **Streaming output** — for long videos, stream partial results as each stage completes via FastAPI StreamingResponse
- **Confidence calibration** — current confidence scores are LLM-estimated; a calibration layer against known examples would make them meaningful

---

## File Structure (planned)

```
judge-agent/
├── README.md
├── ARCHITECTURE.md             ← this file
├── backend/
│   ├── main.py                 ← FastAPI app + route definitions
│   ├── workflows/
│   │   └── judge_workflow.py   ← DBOS durable workflow (ingest → signals → judge → output)
│   ├── agents/
│   │   └── judge_agent.py      ← Agno agent definition + tool bindings
│   ├── ingest/
│   │   ├── text.py             ← Phase 1: raw text passthrough
│   │   ├── transcript.py       ← Phase 2: .srt / .vtt / .txt parser
│   │   └── video.py            ← Phase 3: ffmpeg keyframe extractor
│   ├── signals.py              ← structural signal extraction (all phases)
│   ├── output.py               ← Pydantic response models + validation
│   └── prompts/
│       ├── judge_text.txt      ← Phase 1 system prompt
│       ├── judge_transcript.txt← Phase 2 (text + audio signals)
│       └── judge_video.txt     ← Phase 3 (text + audio + visual)
├── frontend/                   ← Next.js + TypeScript (stretch goal)
│   ├── app/
│   │   └── page.tsx            ← submit form + results view
│   └── package.json
├── tests/
│   ├── fixtures/               ← recorded inputs + expected outputs
│   └── test_judge.py
├── requirements.txt
├── .env.example
└── docker-compose.yml          ← wires backend + DBOS together
```
