"""Evaluation script for AI detection accuracy.

Runs the judge agent against known AI and human samples.
Expected thresholds: AI samples < 30, human samples > 70.

Usage: python tests/eval_detection.py
(Must be run from backend/ directory with ANTHROPIC_API_KEY set)
"""

from __future__ import annotations

import asyncio
import json
from pathlib import Path

from app.agents.judge_agent import judge_content


FIXTURES_DIR = Path(__file__).parent / "fixtures"
AI_THRESHOLD = 30   # AI samples should score below this
HUMAN_THRESHOLD = 70  # Human samples should score above this


async def eval_samples(
    samples: list[dict[str, str]],
    expected_label: str,
    threshold: int,
    direction: str,
) -> tuple[int, int]:
    """Evaluate a batch of samples and print results.

    Returns (passed, total).
    """
    passed = 0
    total = len(samples)

    for i, sample in enumerate(samples, 1):
        text = sample["text"]
        source = sample.get("source", "unknown")
        result = await judge_content(content=text)
        score = result.score

        if direction == "below":
            ok = score < threshold
        else:
            ok = score > threshold

        status = "PASS" if ok else "FAIL"
        if ok:
            passed += 1

        preview = text[:60].replace("\n", " ") + "..."
        print(f"  [{status}] {expected_label} #{i} ({source}): score={score} — {preview}")

    return passed, total


async def main() -> None:
    """Run all evals and print summary."""
    print("=== AI Detection Eval ===\n")

    ai_path = FIXTURES_DIR / "ai_samples.json"
    human_path = FIXTURES_DIR / "human_samples.json"

    ai_samples: list[dict[str, str]] = json.loads(ai_path.read_text())
    human_samples: list[dict[str, str]] = json.loads(human_path.read_text())

    print(f"AI samples (expect score < {AI_THRESHOLD}):")
    ai_passed, ai_total = await eval_samples(ai_samples, "ai", AI_THRESHOLD, "below")

    print(f"\nHuman samples (expect score > {HUMAN_THRESHOLD}):")
    human_passed, human_total = await eval_samples(human_samples, "human", HUMAN_THRESHOLD, "above")

    total_passed = ai_passed + human_passed
    total = ai_total + human_total

    print(f"\n=== Summary ===")
    print(f"AI samples:    {ai_passed}/{ai_total} passed")
    print(f"Human samples: {human_passed}/{human_total} passed")
    print(f"Overall:       {total_passed}/{total} passed ({100 * total_passed // total}%)")


if __name__ == "__main__":
    asyncio.run(main())
