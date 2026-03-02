"""Evaluation script for AI detection accuracy.

Runs the judge agent against known AI and human samples.

Pass criteria:
  - AI samples:    derived humanness score < 30
  - Human samples: derived humanness score > 70

Humanness score (0–100) is derived from JudgeOutput.origin:
  human-generated → round(confidence * 100)
  AI-generated    → round((1 - confidence) * 100)

Usage: uv run --env-file .env python tests/eval_detection.py
(Must be run from the backend/ directory)

Rate limiting: Tier 1 = 50 RPM / 30K ITPM for Sonnet 4.x.
MAX_CONCURRENT caps burst size; retries handle 429s with exponential backoff.
"""

from __future__ import annotations

import asyncio
import json
import random
import time
from pathlib import Path

import anthropic

from app.agents.judge_agent import create_judge_agent
from app.agents.output import ContentInput, ContentType, JudgeOutput


FIXTURES_DIR = Path(__file__).parent / "fixtures"
AI_THRESHOLD = 30    # AI samples: humanness score must be below this
HUMAN_THRESHOLD = 70  # Human samples: humanness score must be above this

MAX_CONCURRENT = 5
MAX_RETRIES = 4


def humanness_score(result: JudgeOutput) -> int:
    """Derive a 0–100 humanness score from origin prediction + confidence."""
    if result.origin.prediction == "human-generated":
        return round(result.origin.confidence * 100)
    return round((1 - result.origin.confidence) * 100)


def _is_rate_limit_error(exc: BaseException) -> bool:
    if isinstance(exc, anthropic.RateLimitError):
        return True
    if isinstance(exc, anthropic.APIStatusError) and exc.status_code == 429:
        return True
    msg = str(exc).lower()
    return "rate limit" in msg or "429" in msg or "overloaded" in msg


async def _judge_direct(content: str) -> JudgeOutput:
    """Call the judge agent directly, bypassing DBOS (eval harness only)."""
    agent = create_judge_agent()
    content_input = ContentInput(content=content, content_type=ContentType.TEXT)
    response = await agent.arun(content_input.to_prompt())
    if not isinstance(response.content, JudgeOutput):
        raise TypeError(f"Expected JudgeOutput, got {type(response.content).__name__}")
    return response.content


async def _judge_with_backoff(content: str, semaphore: asyncio.Semaphore) -> JudgeOutput:
    """Semaphore-gated call with exponential backoff on rate limit errors."""
    async with semaphore:
        for attempt in range(MAX_RETRIES + 1):
            try:
                return await _judge_direct(content)
            except Exception as exc:  # noqa: BLE001
                if _is_rate_limit_error(exc) and attempt < MAX_RETRIES:
                    delay = (2 ** attempt) + random.uniform(0, 1)
                    print(f"    [RATE LIMIT] retry {attempt + 1}/{MAX_RETRIES} in {delay:.1f}s…")
                    await asyncio.sleep(delay)
                else:
                    raise
    raise RuntimeError("unreachable")


async def eval_one(
    i: int,
    sample: dict[str, str],
    expected_label: str,
    threshold: int,
    direction: str,
    semaphore: asyncio.Semaphore,
) -> tuple[bool, str]:
    """Evaluate a single sample. Returns (passed, formatted line)."""
    text = sample["text"]
    source = sample.get("source", "unknown")
    result = await _judge_with_backoff(text, semaphore)

    score = humanness_score(result)
    prediction = result.origin.prediction
    confidence_pct = round(result.origin.confidence * 100)

    ok = score < threshold if direction == "below" else score > threshold
    status = "PASS" if ok else "FAIL"
    preview = text[:60].replace("\n", " ") + "..."
    line = (
        f"  [{status}] {expected_label} #{i} ({source}): "
        f"score={score} | {prediction} ({confidence_pct}%) — {preview}"
    )
    return ok, line


async def eval_samples(
    samples: list[dict[str, str]],
    expected_label: str,
    threshold: int,
    direction: str,
    semaphore: asyncio.Semaphore,
) -> tuple[int, int]:
    """Evaluate all samples concurrently (bounded by semaphore) and print results."""
    tasks = [
        eval_one(i, sample, expected_label, threshold, direction, semaphore)
        for i, sample in enumerate(samples, 1)
    ]
    results = await asyncio.gather(*tasks)

    passed = sum(1 for ok, _ in results if ok)
    for _, line in results:
        print(line)
    return passed, len(samples)


async def main() -> None:
    print(f"=== AI Detection Eval (max {MAX_CONCURRENT} concurrent) ===\n")

    ai_samples: list[dict[str, str]] = json.loads(
        (FIXTURES_DIR / "ai_samples.json").read_text()
    )
    human_samples: list[dict[str, str]] = json.loads(
        (FIXTURES_DIR / "human_samples.json").read_text()
    )

    semaphore = asyncio.Semaphore(MAX_CONCURRENT)
    t0 = time.monotonic()

    print(f"AI samples     (expect humanness score < {AI_THRESHOLD}):")
    print(f"Human samples  (expect humanness score > {HUMAN_THRESHOLD}):")
    (ai_passed, ai_total), (human_passed, human_total) = await asyncio.gather(
        eval_samples(ai_samples, "ai", AI_THRESHOLD, "below", semaphore),
        eval_samples(human_samples, "human", HUMAN_THRESHOLD, "above", semaphore),
    )

    elapsed = time.monotonic() - t0
    total_passed = ai_passed + human_passed
    total = ai_total + human_total

    print(f"\n=== Summary ({elapsed:.1f}s) ===")
    print(f"AI samples:    {ai_passed}/{ai_total} passed")
    print(f"Human samples: {human_passed}/{human_total} passed")
    print(f"Overall:       {total_passed}/{total} passed ({100 * total_passed // total}%)")


if __name__ == "__main__":
    asyncio.run(main())
