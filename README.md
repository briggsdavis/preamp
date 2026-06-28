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
npm run dev            # Vite dev server + `convex dev` together
```

Then open the printed local URL. `npm run dev:frontend` runs only Vite;
`npm run dev:backend` runs only `convex dev`.

## Backend & Admin (Convex)

The site is backed by [Convex](https://convex.dev): the menu, inquiry inboxes,
announcement bars, and pop-ups are all stored in Convex and edited from an
admin dashboard at **`/admin`**.

### One-time setup

1. **Deploy the functions.** Run `npx convex dev` (or `npm run dev`). The first
   time, it logs you in / creates a deployment and writes `VITE_CONVEX_URL` and
   `CONVEX_DEPLOYMENT` into `.env.local`.
2. **Set the admin secrets** in the Convex dashboard (Settings → Environment
   Variables) or via the CLI:
   - `JWT_PRIVATE_KEY`, `JWKS`, `SITE_URL` — from Convex Auth setup.
   - `ADMIN_EMAILS` — a comma-separated allowlist of emails permitted to
     create an admin account (e.g. `you@shop.com, manager@shop.com`).
3. **Create your admin account** at `/admin` → "Sign up" using an email on the
   allowlist. Sign-ups from other emails are rejected.
4. **Seed the menu** (optional): in the admin, the menu manager exposes a one-
   time seed of the original coffee/food items. You can also call `menu.seed`
   from the Convex dashboard. It's idempotent and no-ops if data already exists.

### Admin sections

- **Analytics** - first-party traffic & engagement dashboard (the default admin
  landing). Page views, visitors, order-button clicks, menu clicks, a
  visit→menu→order funnel, top pages, and traffic sources, each across seven
  timeframes (Today → 2 Years). Tracking is cookieless and excludes signed-in
  staff; events are written by the public site (`src/lib/analytics.ts`) and
  rolled into daily aggregates by an hourly cron (`convex/crons.ts`). To preview
  the dashboard before real traffic arrives, run `analytics:seedDemo` from the
  Convex dashboard's function runner.
- **Page Editor** (Home / About / Global) - placeholders, not yet built.
- **Menu** (Coffee / Food) - sections, items, item images, section moves, and a
  per-menu PDF. Edits go live on `/menu/coffee` and `/menu/food` immediately.
- **Inquiries** - contact-form submissions, hiring applications (with resume
  downloads), and pop-up email captures, each searchable/filterable.
- **Marketing** - announcement bars (one active at a time) and pop-ups (media,
  position, trigger, frequency, optional email capture; one active per spot).

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
