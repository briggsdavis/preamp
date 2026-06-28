import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

/**
 * Scheduled jobs.
 *
 * Hourly, fold raw analytics events into per-day rollups (and prune raw events
 * past their retention window). See convex/analytics.ts → `rollup`.
 */
const crons = cronJobs();

crons.hourly(
  "roll up analytics",
  { minuteUTC: 5 },
  internal.analytics.rollup,
);

export default crons;
