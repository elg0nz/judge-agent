"""Dump positive user feedback into eval fixtures.

Usage:
    cd backend
    python -m cli.dump_fixtures --user glo
    python -m cli.dump_fixtures          # all users
"""

import argparse
import json
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Feedback, JudgeRun, User

FIXTURES_DIR = Path(__file__).resolve().parent.parent / "tests" / "fixtures"
AI_FIXTURES = FIXTURES_DIR / "ai_samples.json"
HUMAN_FIXTURES = FIXTURES_DIR / "human_samples.json"

# Maps agent prediction strings to the label format used in fixture files.
_PREDICTION_TO_LABEL: dict[str, str] = {
    "AI-generated": "ai",
    "human-generated": "human",
}


def load_fixtures(path: Path) -> list[dict]:
    """Load existing fixtures from JSON file."""
    if not path.exists():
        return []
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_fixtures(path: Path, fixtures: list[dict]) -> None:
    """Save fixtures to JSON file."""
    with open(path, "w", encoding="utf-8") as f:
        json.dump(fixtures, f, indent=2, ensure_ascii=False)
        f.write("\n")


def dump_fixtures(username: str | None = None) -> None:
    """Dump positive feedback into eval fixtures."""
    engine = create_engine(settings.DATABASE_URL)

    with Session(engine) as db:
        # Build query: feedback with rating=up, joined to judge_runs and users
        query = (
            db.query(Feedback, JudgeRun, User)
            .join(JudgeRun, Feedback.judge_request_id == JudgeRun.id)
            .join(User, JudgeRun.user_uuid == User.uuid)
            .filter(Feedback.rating == "up")
        )

        if username:
            query = query.filter(User.username == username)

        results = query.all()

    if not results:
        print("No positive feedback found.")
        return

    # Load existing fixtures
    ai_fixtures = load_fixtures(AI_FIXTURES)
    human_fixtures = load_fixtures(HUMAN_FIXTURES)

    # Track existing texts for deduplication
    existing_ai_texts = {f["text"] for f in ai_fixtures}
    existing_human_texts = {f["text"] for f in human_fixtures}

    ai_added = 0
    human_added = 0

    for _feedback, run, user in results:
        output = run.output if isinstance(run.output, dict) else json.loads(run.output)
        prediction = output.get("origin", {}).get("prediction", "")
        label = _PREDICTION_TO_LABEL.get(prediction)

        if label is None:
            # Unknown prediction value; skip rather than corrupt fixtures.
            continue

        fixture_entry = {
            "text": run.input_text,
            "label": label,
            "source": f"user:{user.username}",
        }

        if label == "ai":
            if run.input_text not in existing_ai_texts:
                ai_fixtures.append(fixture_entry)
                existing_ai_texts.add(run.input_text)
                ai_added += 1
        elif label == "human":
            if run.input_text not in existing_human_texts:
                human_fixtures.append(fixture_entry)
                existing_human_texts.add(run.input_text)
                human_added += 1

    # Save updated fixtures
    if ai_added > 0:
        save_fixtures(AI_FIXTURES, ai_fixtures)
    if human_added > 0:
        save_fixtures(HUMAN_FIXTURES, human_fixtures)

    print(f"Added {ai_added} AI samples, {human_added} human samples.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Dump positive feedback into eval fixtures")
    parser.add_argument(
        "--user",
        type=str,
        default=None,
        help="Username to filter by (default: all users)",
    )
    args = parser.parse_args()
    dump_fixtures(args.user)


if __name__ == "__main__":
    main()
