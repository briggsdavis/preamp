# Preamp

A React website built with [Vite](https://vite.dev), TypeScript, and
[Tailwind CSS](https://tailwindcss.com), backed by a [Convex](https://convex.dev)
realtime backend with [Convex Auth](https://labs.convex.dev/auth).

## Tech stack

- **React 19** + **Vite** — fast SPA dev server and build
- **TypeScript** — end-to-end type safety with Convex's generated API
- **Tailwind CSS v4** — utility-first styling (configured via `src/styles/index.css`)
- **React Router** — client-side routing
- **Convex** — database, server functions, and realtime queries
- **Convex Auth** — email/password auth (extensible to OAuth & magic links)

## Project structure

```
preamp/
├── convex/                 # Convex backend (see convex/README.md)
│   ├── schema.ts           # Database schema + auth tables
│   ├── auth.ts             # Convex Auth providers
│   ├── auth.config.ts      # Deployment auth config
│   ├── http.ts             # HTTP routes
│   ├── messages.ts         # Example query + mutation
│   └── _generated/         # Auto-generated API & types (created by convex dev)
│
├── public/                 # Static assets served as-is
│
├── src/
│   ├── main.tsx            # App entry: mounts providers + router
│   ├── App.tsx             # Route table
│   ├── components/         # Reusable presentational components
│   │   ├── auth/           # Auth-aware components (guards, buttons)
│   │   ├── layout/         # App shell: header, layout wrappers
│   │   └── ui/             # Generic design-system primitives
│   ├── features/           # Self-contained feature slices (UI + logic)
│   │   └── auth/           # Sign-in form
│   ├── pages/              # Route-level page components
│   ├── providers/          # Context providers (Convex client + auth)
│   ├── hooks/              # Reusable React hooks
│   ├── lib/                # Framework-agnostic helpers
│   ├── types/             # Shared TypeScript types
│   └── styles/             # Global styles / Tailwind entry
│
├── index.html              # Vite HTML entry
├── vite.config.ts          # Vite + React + Tailwind plugins, path aliases
├── eslint.config.js        # ESLint flat config
└── tsconfig*.json          # TypeScript project references
```

### Where things go

- **A reusable button/input/card?** → `src/components/ui`
- **A whole feature (form, flow, widget with its own state)?** → `src/features/<name>`
- **A full page mapped to a route?** → `src/pages`
- **A database table or server function?** → `convex/`

### Path aliases

- `@/` → `src/` (e.g. `import { Button } from "@/components/ui/Button"`)
- `@convex/` → `convex/` (e.g. `import { api } from "@convex/_generated/api"`)

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Start the Convex backend (first run prompts you to log in & create a
#    deployment, and writes VITE_CONVEX_URL into .env.local). This also
#    generates convex/_generated.
npx convex dev

# 3. In a second terminal, start the frontend
npm run dev:frontend

#    …or run both at once:
npm run dev
```

Then open the printed local URL.

## Scripts

| Script              | Description                                  |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Run frontend + Convex backend together       |
| `npm run dev:frontend` | Vite dev server only                      |
| `npm run dev:backend`  | `convex dev` only                         |
| `npm run build`     | Typecheck and build for production           |
| `npm run preview`   | Preview the production build                 |
| `npm run lint`      | Run ESLint                                   |
| `npm run typecheck` | Typecheck without emitting                   |

## Notes

- `convex/_generated/` is created by `npx convex dev`. Until you run it, imports
  from `@convex/_generated/*` won't resolve — that's expected on a fresh clone.
- Copy `.env.local.example` to `.env.local` if you need to set values manually.
