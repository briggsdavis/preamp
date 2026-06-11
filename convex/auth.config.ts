/**
 * Auth provider configuration consumed by the Convex deployment.
 *
 * `CONVEX_SITE_URL` is provided automatically by Convex. This wiring lets the
 * backend validate the JWTs issued by Convex Auth.
 */
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
