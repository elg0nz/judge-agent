"""Evaluation script for AI detection accuracy.

Runs the judge agent against known AI and human samples.
Expected: AI samples predict 'AI-generated' with confidence > 0.7,
          human samples predict 'human-generated' with confidence > 0.7.

Usage: uv run --env-file .env python tests/eval_detection.py
(Must be run from backend/ directory with ANTHROPIC_API_KEY set)

Rate limiting: Tier 1 allows 50 RPM / 30K ITPM for Sonnet 4.x.
MAX_CONCURRENT caps burst size; retries handle 429s with exponential backoff.
"""

from __future__ import annotations

import asyncio
import json
import random
import time
from pathlib import Path

import anthropic

from app.agents.judge_agent import run_judge


FIXTURES_DIR = Path(__file__).parent / "fixtures"
CONFIDENCE_THRESHOLD = 0.7  # Both AI and human samples must exceed this confidence

# Tier 1 = 50 RPM. Keep concurrent requests well below that to avoid
# triggering the acceleration limit on sharp bursts.
MAX_CONCURRENT = 5
MAX_RETRIES = 4


def _is_rate_limit_error(exc: BaseException) -> bool:
    """Return True if the exception is a 429 / rate-limit error."""
    if isinstance(exc, anthropic.RateLimitError):
        return True
    if isinstance(exc, anthropic.APIStatusError) and exc.status_code == 429:
        return True
    msg = str(exc).lower()
    return "rate limit" in msg or "429" in msg or "overloaded" in msg


async def judge_with_backoff(
    content: str,
    semaphore: asyncio.Semaphore,
) -> object:
    """Call run_judge with semaphore-gated concurrency and retry logic."""
    async with semaphore:
        for attempt in range(MAX_RETRIES + 1):
            try:
                return await run_judge(content=content)
            except Exception as exc:  # noqa: BLE001
                if _is_rate_limit_error(exc) and attempt < MAX_RETRIES:
                    # Exponential backoff with full jitter
                    delay = (2 ** attempt) + random.uniform(0, 1)
                    print(f"    [RATE LIMIT] retry {attempt + 1}/{MAX_RETRIES} in {delay:.1f}s…")
                    await asyncio.sleep(delay)
                else:
                    raise


async def eval_one(
    i: int,
    sample: dict[str, str],
    expected_label: str,
    threshold: float,
    expected_prediction: str,
    semaphore: asyncio.Semaphore,
) -> tuple[bool, str]:
    """Evaluate a single sample. Returns (passed, formatted line)."""
    text = sample["text"]
    source = sample.get("source", "unknown")
    result = await judge_with_backoff(text, semaphore)
    prediction = result.origin.prediction  # type: ignore[union-attr]
    confidence = result.origin.confidence  # type: ignore[union-attr]

    ok = prediction == expected_prediction and confidence > threshold
    status = "PASS" if ok else "FAIL"
    preview = text[:60].replace("\n", " ") + "..."
    line = f"  [{status}] {expected_label} #{i} ({source}): prediction={prediction} conf={confidence:.2f} — {preview}"
    return ok, line


async def eval_samples(
    samples: list[dict[str, str]],
    expected_label: str,
    threshold: float,
    expected_prediction: str,
    semaphore: asyncio.Semaphore,
) -> tuple[int, int]:
    """Evaluate all samples concurrently (bounded by semaphore) and print results.

    Returns (passed, total).
    """
    tasks = [
        eval_one(i, sample, expected_label, threshold, expected_prediction, semaphore)
        for i, sample in enumerate(samples, 1)
    ]
    results = await asyncio.gather(*tasks)

    passed = sum(1 for ok, _ in results if ok)
    for _, line in results:
        print(line)
    return passed, len(samples)


async def main() -> None:
    """Run all evals concurrently and print summary."""
    print(f"=== Content Judge Eval (max {MAX_CONCURRENT} concurrent) ===\n")

    ai_samples: list[dict[str, str]] = json.loads(
        (FIXTURES_DIR / "ai_samples.json").read_text()
    )
    human_samples: list[dict[str, str]] = json.loads(
        (FIXTURES_DIR / "human_samples.json").read_text()
    )

    semaphore = asyncio.Semaphore(MAX_CONCURRENT)
    t0 = time.monotonic()

    print(f"AI samples (expect prediction='AI-generated', confidence > {CONFIDENCE_THRESHOLD}):")
    print(f"Human samples (expect prediction='human-generated', confidence > {CONFIDENCE_THRESHOLD}):")
    (ai_passed, ai_total), (human_passed, human_total) = await asyncio.gather(
        eval_samples(ai_samples, "ai", CONFIDENCE_THRESHOLD, "AI-generated", semaphore),
        eval_samples(human_samples, "human", CONFIDENCE_THRESHOLD, "human-generated", semaphore),
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
