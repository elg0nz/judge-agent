# v0.0.1-pre — Project Structure Initialization (Backend + Frontend)

**Status:** PRE-RELEASE (spec ready for implementation)

---

## Overview

Initialize idiomatic, production-ready project structures for both backend (Python/FastAPI) and frontend (React/Next.js). This establishes the foundation for the judicial reasoning agent: backend API endpoints powered by DBOS workflows and Agno intelligence, frontend UI with Next.js SSR and optimized React patterns.

---

## Goals

1. **Backend ready for DBOS + Agno workflows** — FastAPI app with database layer, migration infrastructure, and agent integration points
2. **Frontend ready for production React patterns** — Next.js app with TypeScript strict mode, component structure, and layout scaffolding
3. **Both follow their respective community idioms** — PEP 8 & FastAPI patterns (backend), ESLint/Prettier & Next.js conventions (frontend)
4. **Development environment documented** — Clear setup instructions for both stacks
5. **Quality gates integrated** — Lightsabers ready to run on both backend and frontend code

---

## Requirements

### Backend (Python/FastAPI + DBOS + Agno)

1. **Project structure follows FastAPI conventions:**
   - `backend/` root with `main.py` entrypoint
   - `backend/app/` package with `__init__.py`
   - `backend/app/api/` for route modules
   - `backend/app/core/` for config, security, dependencies
   - `backend/app/models/` for Pydantic schemas
   - `backend/app/db/` for database initialization, migrations, DBOS workflows
   - `backend/app/agents/` for Agno agent definitions
   - `backend/tests/` for pytest-based tests

2. **Database layer:**
   - DBOS initialization in `app/db/dbos.py` with connection pooling
   - SQLAlchemy ORM models in `app/db/models.py`
   - Alembic migrations in `backend/alembic/` (scaffolded but empty)
   - Database config in `app/core/config.py`

3. **Configuration management:**
   - `.env` template in `backend/.env.example`
   - `app/core/config.py` using Pydantic Settings for environment variables
   - Support for dev/test/prod environments

4. **FastAPI app initialization:**
   - `app/main.py` with FastAPI instance, middleware setup, CORS, error handlers
   - Health check endpoint (`/health`)
   - Root endpoint returns API metadata

5. **Agno agent integration points:**
   - `app/agents/base.py` with agent registry
   - Example agent skeleton in `app/agents/judicial_reasoner.py`
   - Integration with FastAPI dependency injection

6. **Development requirements:**
   - `pyproject.toml` with dependencies: fastapi, uvicorn, sqlalchemy, alembic, dbos, agno
   - `scripts/dev.sh` to start the server with auto-reload
   - `scripts/presubmit.sh` (reference from lightsabers)

7. **Type hints throughout** — All functions have type annotations, ready for mypy --strict

### Frontend (React/Next.js + TypeScript)

1. **Project structure follows Next.js App Router conventions:**
   - `frontend/` root with `app/` directory
   - `frontend/app/layout.tsx` for root layout
   - `frontend/app/page.tsx` for home page
   - `frontend/app/components/` for shared components
   - `frontend/app/lib/` for utilities, hooks, types
   - `frontend/app/api/` for route handlers (optional, depending on architecture)
   - `frontend/public/` for static assets

2. **TypeScript configuration:**
   - `tsconfig.json` with `strict: true` and full type checking
   - `eslintrc.json` with React/Next.js best practices rules
   - `.prettierrc` for code formatting

3. **Component structure:**
   - One component per file (enforced by ESLint)
   - Example components: `Button.tsx`, `Card.tsx`, `Header.tsx`, `Footer.tsx`
   - All components have proper TypeScript interfaces/types
   - Example page structure with layout

4. **Styling:**
   - Tailwind CSS configured and ready (if preferred) OR standard CSS modules
   - `globals.css` for global styles

5. **Utilities and hooks:**
   - `lib/api.ts` for API client with fetch/axios wrapper
   - `lib/types.ts` for shared TypeScript types
   - `lib/constants.ts` for configuration values
   - Example custom hook skeleton

6. **Development requirements:**
   - `package.json` with dependencies: next, react, react-dom, typescript
   - `scripts/dev` to start Next.js dev server
   - `scripts/build` to build for production
   - `scripts/lint` to run ESLint
   - `scripts/type-check` to run tsc --strict

7. **Error handling:**
   - Global error boundary component
   - Error page at `app/error.tsx`
   - Not found page at `app/not-found.tsx`

8. **No `any` types** — All code strictly typed (enforced by tsc --strict)

---

## Implementation Approach

### Phase 1: Backend Scaffolding
1. Create `backend/` directory structure (see Requirements section)
2. Initialize `pyproject.toml` with FastAPI/DBOS/Agno dependencies
3. Write `app/main.py` with FastAPI app setup
4. Create `app/core/config.py` with environment-based config
5. Set up DBOS in `app/db/dbos.py` with example connection
6. Add health check endpoint and root metadata endpoint
7. Create Alembic migration infrastructure (empty migrations)
8. Add `.env.example` template
9. Write `scripts/dev.sh` and `scripts/presubmit.sh`

### Phase 2: Frontend Scaffolding
1. Create `frontend/` directory with Next.js App Router structure
2. Initialize `package.json` with Next.js, React, TypeScript
3. Set up `tsconfig.json` with strict mode
4. Configure ESLint with React/Next.js rules + one-component-per-file
5. Create root layout and home page
6. Add example components (Button, Card, Header, Footer)
7. Set up error boundary and error/not-found pages
8. Create `lib/` utilities (api.ts, types.ts, constants.ts)
9. Configure Tailwind CSS or CSS Modules
10. Add npm scripts for dev, build, lint, type-check

### Phase 3: Documentation & Testing
1. Update root `README.md` with backend and frontend setup instructions
2. Add `backend/README.md` with DBOS/Agno onboarding
3. Add `frontend/README.md` with component development guide
4. Verify lightsabers run successfully on scaffolded code (no errors)

---

## Acceptance Criteria

### Backend
- [ ] `backend/` directory exists with correct folder structure
- [ ] `pyproject.toml` lists all dependencies (FastAPI, DBOS, Agno, etc.)
- [ ] FastAPI app starts with `python -m uvicorn app.main:app --reload`
- [ ] Health check endpoint responds at `GET /health`
- [ ] Root endpoint returns API metadata at `GET /`
- [ ] DBOS initialized with test connection (pooling configured)
- [ ] Alembic migrations scaffold created and empty
- [ ] `.env.example` template exists
- [ ] `scripts/dev.sh` and `scripts/presubmit.sh` exist and are executable
- [ ] All code has type hints; mypy --strict passes with 0 errors
- [ ] Ruff, Bandit, Vulture pass with 0 errors
- [ ] README.md documents setup, running, and development workflow

### Frontend
- [ ] `frontend/` directory exists with Next.js App Router structure
- [ ] `package.json` lists Next.js, React, TypeScript dependencies
- [ ] `tsconfig.json` has `strict: true`
- [ ] ESLint config enforces one-component-per-file rule
- [ ] App starts with `npm run dev` and builds with `npm run build`
- [ ] Root layout and home page render without errors
- [ ] Example components (Button, Card, Header, Footer) exist and are properly typed
- [ ] Error boundary, error page, not-found page exist
- [ ] `lib/api.ts`, `lib/types.ts`, `lib/constants.ts` created with examples
- [ ] All code is strictly typed; tsc --strict passes with 0 errors
- [ ] ESLint, bundle analysis pass with 0 errors
- [ ] No `any` types in codebase
- [ ] README.md documents setup, running, and component development workflow

### Both
- [ ] All files committed and pushed to `main`
- [ ] Git history is clean (meaningful commit messages)
- [ ] Lightsabers can run on both stacks (no syntax errors)

---

## Beads Issues

Will be created after this spec is approved:

1. **Backend Scaffolding** — Initialize Python/FastAPI/DBOS/Agno structure
2. **Frontend Scaffolding** — Initialize React/Next.js/TypeScript structure
3. (Optional) **Documentation** — Write onboarding guides for both stacks

---

## Notes

- **DBOS Workflows:** Backend should have connection pooling configured and migration infrastructure ready. Actual workflows come in later features.
- **Agno Integration:** Backend should have agent registry and example agent skeleton. Actual reasoning logic comes later.
- **Next.js App Router:** Not Pages Router. App Router is the current standard and required for this project.
- **TypeScript Strict:** Non-negotiable. Both backend and frontend must pass strict type checking from day one.
- **No Magic Numbers:** Hardcoded values should be in `lib/constants.ts` (frontend) or `app/core/config.py` (backend).

---

**Last Updated:** 2026-03-02
**Spec Owner:** judge-agent team
**Status:** READY FOR IMPLEMENTATION
