/**
 * Auth provider configuration consumed by the Convex deployment.
 *
 * `CONVEX_SITE_URL` is provided automatically by Convex. This wiring lets the
 * backend validate the JWTs issued by Convex Auth.
 *
 * We read the env var via `globalThis` (rather than a bare `process`) so this
 * file passes the TypeScript typecheck even without Node type definitions; at
 * runtime in the Convex deployment `process.env` is populated as usual.
 */
const convexSiteUrl = (
  globalThis as {
    process?: { env?: Record<string, string | undefined> };
  }
).process?.env?.CONVEX_SITE_URL;

export default {
  providers: [
    {
      domain: convexSiteUrl,
      applicationID: "convex",
    },
  ],
};
