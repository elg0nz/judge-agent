# Judge Agent - Frontend

A production-ready React/Next.js frontend for the Feltsense judicial reasoning agent platform.

## Features

- **Next.js App Router** — Modern React framework with file-based routing
- **TypeScript Strict Mode** — Full type safety with no `any` types
- **Component Architecture** — One component per file, fully typed with React best practices
- **Custom Hooks** — Reusable hooks for async data, forms, local storage, and more
- **API Client** — Typed fetch wrapper with retry logic and error handling
- **ESLint & Prettier** — Automated code quality and formatting
- **Error Handling** — Global error boundary and 404 page
- **Tailwind CSS** — Utility-first CSS for rapid UI development

## Quick Start

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
cd frontend
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Scripts

- `npm run dev` — Start development server with hot reload
- `npm run build` — Build for production
- `npm start` — Start production server
- `npm run lint` — Run ESLint
- `npm run lint:fix` — Run ESLint and fix issues
- `npm run type-check` — Run TypeScript type checking (strict mode)
- `npm run format` — Format code with Prettier
- `npm run format:check` — Check code formatting without changes

## Project Structure

```
frontend/
├── app/
│   ├── components/           # Reusable React components
│   │   ├── Button.tsx        # Button component
│   │   ├── Card.tsx          # Card component
│   │   ├── Header.tsx        # Header/navigation component
│   │   └── Footer.tsx        # Footer component
│   ├── lib/                  # Utilities and helpers
│   │   ├── api.ts            # API client with fetch wrapper
│   │   ├── constants.ts      # Configuration constants
│   │   ├── hooks.ts          # Custom React hooks
│   │   └── types.ts          # Shared TypeScript types
│   ├── layout.tsx            # Root layout component
│   ├── page.tsx              # Home page
│   ├── error.tsx             # Global error boundary
│   └── not-found.tsx         # 404 page
├── public/                   # Static assets
├── globals.css               # Global styles
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration (strict: true)
├── next.config.js            # Next.js configuration
├── .eslintrc.json            # ESLint rules
├── .prettierrc                # Prettier configuration
└── .gitignore                # Git ignore rules
```

## Component Development

### Creating a New Component

1. Create a new file in `app/components/YourComponent.tsx`
2. Define a TypeScript interface for props
3. Export the component as default (one component per file)
4. Use proper TypeScript types (no `any`)

Example:

```typescript
interface MyComponentProps {
  title: string;
  onClick: () => void;
}

export default function MyComponent({ title, onClick }: MyComponentProps): React.ReactElement {
  return (
    <div onClick={onClick}>
      {title}
    </div>
  );
}
```

### Component Rules

- **One component per file** — Enforced by ESLint rule `react/no-multi-comp`
- **Fully typed** — All props and returns must be typed
- **No `any` types** — Will fail ESLint and type checking
- **Return types** — All components should return `React.ReactElement`
- **Prop interfaces** — Define an interface for all props

## API Integration

Use the `apiClient` from `lib/api.ts` to make API calls:

```typescript
import { apiClient } from '@/app/lib/api';

const data = await apiClient.get('/endpoint');
const result = await apiClient.post('/endpoint', { body: 'data' });
```

Or use the `useFetch` hook for React components:

```typescript
import { useFetch } from '@/app/lib/hooks';

export default function MyComponent(): React.ReactElement {
  const { data, loading, error } = useFetch('/endpoint');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{data}</div>;
}
```

## Type Safety

This project uses TypeScript in strict mode. All code must:

- Pass `npm run type-check` (runs `tsc --noEmit --strict`)
- Have explicit type annotations on all functions
- Use interfaces for all object shapes
- Avoid `any` types
- Use proper union types instead of optional properties

## Environment Variables

Create a `.env.local` file in the `frontend/` directory for local development:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Feature flags
NEXT_PUBLIC_ANALYTICS_ENABLED=false
NEXT_PUBLIC_DEBUG_MODE=true
```

Note: Variables prefixed with `NEXT_PUBLIC_` are available in the browser.

## Code Quality

### ESLint

Run linter:

```bash
npm run lint
```

Fix issues automatically:

```bash
npm run lint:fix
```

Key rules:
- No `any` types
- One component per file
- Unused variables/params are errors
- Explicit function return types

### Prettier

Format code:

```bash
npm run format
```

Check formatting:

```bash
npm run format:check
```

### Type Checking

Run type checker:

```bash
npm run type-check
```

This runs `tsc --noEmit --strict` and validates all code before deployment.

## Error Handling

### Error Boundary (app/error.tsx)

Catches client-side errors and displays a fallback UI.

### 404 Page (app/not-found.tsx)

Automatically serves when a route is not found.

### API Errors

The `ApiClient` class throws `ApiError` with:

```typescript
class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: unknown
  ) { ... }
}
```

Handle errors in hooks:

```typescript
const { data, error } = useFetch('/endpoint');
if (error) {
  console.error(`API Error ${error.status}: ${error.message}`);
}
```

## Custom Hooks

### useAsync

Manage async operations with loading and error states:

```typescript
const { data, loading, error, execute } = useAsync(
  () => apiClient.get('/endpoint')
);
```

### useForm

Manage form state with validation:

```typescript
const form = useForm(
  { name: '', email: '' },
  async (values) => {
    await apiClient.post('/submit', values);
  }
);
```

### useLocalStorage

Persist state in browser local storage:

```typescript
const [theme, setTheme] = useLocalStorage('theme', 'light');
```

### useFetch

Fetch data with automatic retry and caching:

```typescript
const { data, loading, error, refetch } = useFetch('/endpoint');
```

## Testing

The project is ready for testing with:

- Jest (unit and integration tests)
- React Testing Library (component tests)
- E2E tests with Cypress or Playwright

## Deployment

The Next.js app can be deployed to:

- **Vercel** (recommended) — Zero-config deployment
- **Docker** — Containerized deployment
- **Traditional hosting** — `npm run build && npm start`

## Debugging

Enable debug mode in `.env.local`:

```bash
NEXT_PUBLIC_DEBUG_MODE=true
```

Check browser console for detailed logs.

## Contributing

1. Create a feature branch
2. Follow component and code quality rules
3. Run `npm run lint` and `npm run type-check` before committing
4. Ensure all tests pass
5. Submit a pull request

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [ESLint Rules](https://eslint.org/docs/rules/)

## License

Part of the Feltsense judge-agent project.

---

**Status:** v0.0.1 — Production scaffolding complete
**Last Updated:** 2026-03-02
