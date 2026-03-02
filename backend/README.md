# Judge Agent Backend

Judicial reasoning agent backend built with FastAPI, DBOS, and Agno.

## Overview

The backend provides REST API endpoints for legal case analysis powered by the Judge Agent, an intelligent judicial reasoning system. It integrates DBOS for efficient database workflows and Agno for AI-driven legal reasoning.

## Prerequisites

- Python 3.11+
- PostgreSQL 14+
- pip or uv for package management

## Setup

### 1. Environment Configuration

Copy the environment template and update with your settings:

```bash
cp .env.example .env
```

Edit `.env` to configure:
- Database connection URL
- Server host and port
- CORS origins
- Logging level
- API keys and secrets

### 2. Install Dependencies

```bash
# Core dependencies only
pip install -e .

# With development tools (mypy, ruff, pytest, etc.)
pip install -e ".[dev]"
```

### 3. Database Setup

Set up your PostgreSQL database and update the `DATABASE_URL` in `.env`.

Create database tables (development only):

```bash
python -c "from app.db.dbos import db_manager; db_manager.create_all_tables()"
```

For production, use Alembic migrations:

```bash
# Create initial migration
alembic revision --autogenerate -m "Initial schema"

# Run migrations
alembic upgrade head
```

## Running the Server

### Development Mode

Start the development server with auto-reload:

```bash
./scripts/dev.sh
```

Server runs at `http://localhost:8000`

- API docs: `http://localhost:8000/docs` (Swagger UI)
- ReDoc: `http://localhost:8000/redoc`

### Production Mode

Set `ENVIRONMENT=production` in `.env` and run with a production ASGI server:

```bash
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

## API Endpoints

### Health Check

```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy",
  "environment": "development"
}
```

### API Metadata

```bash
curl http://localhost:8000/
```

Response:
```json
{
  "name": "Judge Agent API",
  "version": "0.0.1",
  "environment": "development",
  "docs_url": "/docs",
  "openapi_url": "/openapi.json"
}
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py              # App factory
│   ├── main.py                  # FastAPI setup and routes
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py            # Pydantic Settings
│   ├── db/
│   │   ├── __init__.py
│   │   ├── models.py            # SQLAlchemy ORM models
│   │   └── dbos.py              # Database initialization and pooling
│   ├── api/
│   │   └── __init__.py          # Route modules go here
│   ├── models/
│   │   └── __init__.py          # Pydantic schemas go here
│   └── agents/
│       ├── __init__.py
│       ├── base.py              # Agent registry and base class
│       └── judicial_reasoner.py # Example agent skeleton
├── tests/
│   └── __init__.py
├── alembic/
│   ├── env.py                   # Alembic configuration
│   ├── script.py.mako           # Migration template
│   └── versions/                # Migration scripts
├── scripts/
│   ├── dev.sh                   # Development server
│   └── presubmit.sh             # Quality gates
├── .env.example                 # Environment template
├── alembic.ini                  # Alembic config
├── pyproject.toml               # Dependencies and tool config
└── README.md                    # This file
```

## Development Workflow

### Quality Gates

Run presubmit checks before committing:

```bash
./scripts/presubmit.sh
```

This runs:
- **mypy** — Type checking (strict mode)
- **ruff** — Linting and import sorting
- **bandit** — Security checks
- **vulture** — Dead code detection
- **pytest** — Unit tests

### Type Checking

Type hints are required throughout. Verify with mypy:

```bash
mypy app --strict
```

### Testing

Run tests with pytest:

```bash
pytest tests -v
```

Run with coverage:

```bash
pytest tests --cov=app --cov-report=html
```

## Architecture

### Database Layer (`app/db/`)

- **models.py** — SQLAlchemy ORM models with `Base` declarative class and `TimestampedMixin`
- **dbos.py** — Connection pooling, session management, and DBOS initialization

Example query:

```python
from fastapi import Depends
from app.db.dbos import get_db
from app.db.models import Case
from sqlalchemy.orm import Session

@app.get("/cases")
def list_cases(db: Session = Depends(get_db)):
    return db.query(Case).all()
```

### Agent System (`app/agents/`)

- **base.py** — `Agent` abstract base class and `AgentRegistry`
- **judicial_reasoner.py** — Example judicial reasoning agent

Extend the `Agent` class to create new reasoning agents:

```python
from app.agents.base import Agent, agent_registry

class MyAgent(Agent):
    async def reason(self, context):
        # Reasoning logic here
        return result

    async def validate_input(self, context):
        # Input validation
        return is_valid

# Register agent
agent_registry.register(MyAgent())
```

### Configuration (`app/core/config.py`)

Pydantic Settings loads configuration from `.env`:

```python
from app.core.config import settings

# Access settings
db_url = settings.DATABASE_URL
cors_origins = settings.CORS_ORIGINS
is_debug = settings.DEBUG
```

## Database Migrations (Alembic)

### Creating Migrations

Auto-generate migration from model changes:

```bash
alembic revision --autogenerate -m "Add new column"
```

Manually create migration:

```bash
alembic revision -m "Custom migration"
```

Edit the generated file in `alembic/versions/` and update `upgrade()` and `downgrade()` functions.

### Running Migrations

Apply pending migrations:

```bash
alembic upgrade head
```

Rollback to specific revision:

```bash
alembic downgrade <revision>
```

View migration history:

```bash
alembic history
```

## DBOS Integration (Future)

DBOS (Database OS) primitives for transactional workflows will be integrated in upcoming releases. The database layer is structured to support:

- Durable workflows with automatic recovery
- Transactional operations with at-least-once semantics
- Connection pooling and resource management

See [DBOS documentation](https://dbos.dev/) for more details.

## Agno Integration (Future)

Agno agents for AI-driven reasoning will be integrated in future releases. The agent registry and base classes are ready for:

- Flexible agent definitions
- Agent chaining and composition
- Integration with reasoning workflows

## Troubleshooting

### Database Connection Errors

1. Verify PostgreSQL is running
2. Check `DATABASE_URL` in `.env`
3. Ensure database exists: `createdb judge_agent`
4. Test connection: `psql $DATABASE_URL`

### Import Errors

1. Install dependencies: `pip install -e ".[dev]"`
2. Verify Python path includes `backend/` directory
3. Run from backend root: `cd backend && python -m pytest`

### Type Checking Failures

1. Review mypy errors: `mypy app --strict --show-error-codes`
2. Add type annotations to offending functions
3. Use `# type: ignore` only as last resort with explanation

## Contributing

1. Create feature branch from `main`
2. Make changes following PEP 8 and FastAPI conventions
3. Run `./scripts/presubmit.sh` — all checks must pass
4. Commit with descriptive messages
5. Submit pull request with test coverage

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy 2.0](https://docs.sqlalchemy.org/)
- [Alembic Migrations](https://alembic.sqlalchemy.org/)
- [Pydantic Settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
- [DBOS](https://dbos.dev/)
- [Agno](https://agno.ai/)

## License

Proprietary — Feltsense Platform
