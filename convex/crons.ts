import { cronJobs } from "convex/server"
import { components, internal } from "./_generated/api"
import { internalMutation } from "./_generated/server"

/**
 * Scheduled jobs.
 *
 * Hourly, fold raw analytics events into per-day rollups (and prune raw events
 * past their retention window). See convex/analytics.ts → `rollup`.
 */
const crons = cronJobs()

crons.hourly("roll up analytics", { minuteUTC: 5 }, internal.analytics.rollup)
crons.hourly("clean up Resend email records", { minuteUTC: 15 }, internal.crons.cleanupResend)

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

export const cleanupResend = internalMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(0, components.resend.lib.cleanupOldEmails, {
      olderThan: ONE_WEEK_MS,
    })
    await ctx.scheduler.runAfter(0, components.resend.lib.cleanupAbandonedEmails, {
      olderThan: 4 * ONE_WEEK_MS,
    })
  },
})

export default crons
