# Pre Amp Coffee Studio

Marketing site for **Pre Amp Coffee Studio** - a coffee-and-vinyl listening bar
in Squirrel Hill, Pittsburgh. Built with [Vite](https://vite.dev), React 19,
TypeScript, [Tailwind CSS v4](https://tailwindcss.com), and
[Framer Motion](https://www.framer.com/motion/) for animation.

Warm "sunset" palette (cream → gold → terracotta → maroon over espresso),
groovy retro display type (Monoton / Righteous), parallax scroll, hover
effects, and animated page transitions.

## Pages

- **Home** (`/`) - fully built. Hero with parallax, retro ticker, intro,
  featured-drinks carousel, parallax ambience banners, an interactive
  coffee-prediction quiz, an auto-advancing vertical testimonials carousel,
  and a location section with a Google Maps embed.
- **Everything else** (menu, about, contact, retail, events, gift cards, …):
  renders a themed "Not Brewed Yet" placeholder with a button back home.

## Tech stack

- **React 19** + **Vite** - fast SPA dev server and build
- **TypeScript** - end-to-end type safety
- **Tailwind CSS v4** - utility-first styling, theme tokens in `src/styles/index.css`
- **React Router** - client-side routing
- **Framer Motion** - page transitions, parallax, carousels, hover/scroll motion

## Project structure

```
src/
├── main.tsx                  # App entry: router mount
├── App.tsx                   # Route table + page transitions
├── data/site.ts              # Nav, drinks, testimonials, quiz content
├── components/
│   ├── site/                 # Navbar, Footer, Layout, RippleStripes, …
│   │   └── sections/         # Home-page sections (Hero, Quiz, etc.)
│   └── ui/                   # Generic primitives
├── pages/                    # Home, NotDeveloped
├── lib/                      # Framework-agnostic helpers
└── styles/                   # Global styles / Tailwind entry + design tokens
```

### Path aliases

- `@/` → `src/` (e.g. `import { Navbar } from "@/components/site/Navbar"`)

## Getting started

```bash
npm install
npm run dev:frontend   # Vite dev server
```

Then open the printed local URL.

> Note: this is a static marketing site - no backend is required. A Convex
> scaffold still lives in `convex/` but is not wired into the app.

## Scripts

| Script                 | Description                        |
| ---------------------- | ---------------------------------- |
| `npm run dev:frontend` | Vite dev server                    |
| `npm run build`        | Typecheck and build for production |
| `npm run preview`      | Preview the production build        |
| `npm run lint`         | Run ESLint                         |
| `npm run typecheck`    | Typecheck without emitting         |

## Customizing the vibe

- **Colors:** `@theme` block in `src/styles/index.css`
- **Content** (drinks, reviews, hours, nav, quiz): `src/data/site.ts`
- **Imagery:** hero/parallax photos are Unsplash URLs in `Hero.tsx` /
  `Home.tsx` - swap in real Pre Amp photos when ready.
