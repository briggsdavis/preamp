# Convex backend

This directory holds your Convex backend: the database schema, queries,
mutations, actions, HTTP routes, and auth configuration.

## Layout

| File              | Purpose                                                      |
| ----------------- | ----------------------------------------------------------- |
| `schema.ts`       | Database tables and indexes (includes Convex Auth tables).  |
| `auth.ts`         | Convex Auth setup and providers.                            |
| `auth.config.ts`  | Auth provider config consumed by the deployment.            |
| `http.ts`         | HTTP router (Convex Auth registers its routes here).        |
| `messages.ts`     | Example query + mutation. Replace with your own functions.  |
| `_generated/`     | Auto-generated types and API. **Do not edit by hand.**      |

## Getting started

Run the Convex dev server (also generates `_generated/`):

```bash
npx convex dev
```

This will prompt you to log in / create a deployment the first time, and will
write `VITE_CONVEX_URL` and `CONVEX_DEPLOYMENT` into your `.env.local`.

Add your application tables to `schema.ts`, then write queries and mutations in
new files here. Each export becomes part of the typed `api` available on the
client via `convex/react`.

Docs: https://docs.convex.dev
