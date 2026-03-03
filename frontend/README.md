# Judge Agent — Frontend

Next.js 15 frontend for judge-agent. Provides the judge UI: login, text analysis, video upload, run history, and thumbs-up/down feedback.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| npm | bundled with Node.js |

Check:
```bash
node --version
# v18.x.x or higher
npm --version
# 9.x.x or higher
```

The backend must be running at `http://localhost:8000` for analysis to work. See [backend/README.md](../backend/README.md).

---

## Setup

### 1. Install dependencies

```bash
cd frontend
npm install
```

Expected output ends with:
```
added NNN packages, and audited NNN packages in Xs
```

### 2. Configure the API URL (optional)

By default the frontend talks to `http://localhost:8000`. If your backend is on a different address, create a `.env.local` file:

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

`NEXT_PUBLIC_` prefix means this value is embedded in the browser bundle — do not put secrets here.

### 3. Start the dev server

```bash
npm run dev
```

Expected output:
```
▲ Next.js 15.x.x
- Local:        http://localhost:3000
- Environments: .env.local
✓ Ready in 2.8s
```

Open [http://localhost:3000](http://localhost:3000).

---

## Using the app

1. Enter any username on the login screen. No password. This is a PoC.
2. Choose **Text** or **Video** mode.
3. **Text mode:** paste content, click Analyze. Results appear below.
4. **Video mode:** drop or select a `.mp4`, `.mov`, or `.webm` file. Optionally attach a `.srt` or `.vtt` subtitle file — if you don't, ElevenLabs generates one automatically (requires `ELEVENLABS_API_KEY` in the backend `.env`).
5. Click thumbs up or down to rate each result.
6. Your previous runs appear below the analyze button (requires backend to be up).

---

## Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload at [localhost:3000](http://localhost:3000) |
| `npm run build` | Build for production |
| `npm start` | Start production server (run `build` first) |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint and auto-fix issues |
| `npm run type-check` | Run TypeScript strict type check (no emitted files) |
| `npm run format` | Format all `.ts`, `.tsx`, `.json`, `.md` with Prettier |
| `npm run format:check` | Check formatting without making changes |

---

## Project structure

```
frontend/
├── app/
│   ├── page.tsx              — Full UI: login, mode selector, text analysis, video upload, history
│   ├── layout.tsx            — Root layout (Inter font, metadata)
│   ├── error.tsx             — Global error boundary
│   ├── not-found.tsx         — 404 page
│   ├── components/
│   │   ├── Button.tsx        — Button component
│   │   ├── Card.tsx          — Card component
│   │   ├── Header.tsx        — Header/nav component
│   │   └── Footer.tsx        — Footer component
│   └── lib/
│       ├── api.ts            — All API calls (judge, signup, history, upload, feedback, frames)
│       ├── types.ts          — Shared TypeScript types (JudgeResponse, UserProfile, etc.)
│       ├── constants.ts      — API_BASE_URL and other config constants
│       ├── hooks.ts          — Custom React hooks (useAsync, useForm, useLocalStorage, useFetch)
│       └── utils.ts          — Utility functions (cn for className merging)
├── globals.css               — Global styles (Tailwind CSS v4 import)
├── package.json              — Dependencies and scripts
├── tsconfig.json             — TypeScript strict mode config
├── next.config.js            — Next.js config
└── .env.local                — Your local env overrides (not committed)
```

---

## Environment variables

All frontend env vars are optional — defaults work for local development.

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API base URL. Change this if your backend runs on a different host or port. |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | `false` | Enables analytics (not wired to any service by default). |
| `NEXT_PUBLIC_DEBUG_MODE` | `false` | Enables debug logging in the browser console. |

Create `frontend/.env.local` to override:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Variables prefixed with `NEXT_PUBLIC_` are visible in the browser. Never put API keys or secrets here.

---

## Dependencies

**Runtime:**
- `next` 15 — React framework with App Router
- `react` / `react-dom` 19 — UI library
- `tailwindcss` v4 — Utility CSS
- `lucide-react` — Icons
- `clsx` / `tailwind-merge` / `class-variance-authority` — className utilities

**Dev:**
- `typescript` 5 — Type checking
- `eslint` + plugins — Linting
- `prettier` — Formatting
- `@tailwindcss/postcss` — Tailwind v4 PostCSS integration

---

## Code quality

Type-check before committing:
```bash
npm run type-check
# No output = all good.
```

Lint before committing:
```bash
npm run lint
# No output = all good.
```

Fix lint issues automatically:
```bash
npm run lint:fix
```

Key rules enforced:
- No `any` types
- One component per file
- All props and function return types must be typed
- Unused variables are errors

---

## Troubleshooting

**`npm run dev` fails with `Cannot find module 'next'`**

You skipped the install step:
```bash
cd frontend && npm install
```

**Page loads but "Analyze" returns a network error or "Failed to fetch"**

The backend is not running. In a separate terminal:
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Page loads at a port other than 3000 (e.g. 3001)**

Next.js picks the next available port if 3000 is taken. Update `CORS_ORIGINS` in `backend/.env` to include the new port, then restart the backend:
```
CORS_ORIGINS=["http://localhost:3001","http://localhost:8000"]
```

**`npm run type-check` fails after pulling new changes**

Run `npm install` first — a dependency may have been added:
```bash
cd frontend && npm install && npm run type-check
```

**Video upload works but analysis fails**

Video analysis requires `ELEVENLABS_API_KEY` in `backend/.env` unless you provide a subtitle file. Add your key and restart the backend.
