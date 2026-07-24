import { v } from "convex/values"
import type { Id } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"
import type { QueryCtx } from "./_generated/server"
import { requireAdmin } from "./admin"

const contentKey = v.union(
  v.literal("home"),
  v.literal("about"),
  v.literal("cold-brew"),
  v.literal("global"),
)

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

/** Add served URLs to every CMS image reference without changing stored data. */
async function resolveStorageUrls(ctx: QueryCtx, value: JsonValue): Promise<JsonValue> {
  if (Array.isArray(value)) {
    return await Promise.all(value.map((item) => resolveStorageUrls(ctx, item)))
  }
  if (!value || typeof value !== "object") return value

  const resolved: Record<string, JsonValue> = {}
  for (const [key, child] of Object.entries(value)) {
    resolved[key] = await resolveStorageUrls(ctx, child)
  }
  if (typeof value.storageId === "string") {
    resolved.url = await ctx.storage.getUrl(value.storageId as Id<"_storage">)
  }
  return resolved
}

/** Strip browser-only preview URLs before saving uploaded image references. */
function cleanForStorage(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(cleanForStorage)
  if (!value || typeof value !== "object") return value

  const clean: Record<string, JsonValue> = {}
  for (const [key, child] of Object.entries(value)) {
    if (key === "url" && typeof value.storageId === "string") continue
    clean[key] = cleanForStorage(child)
  }
  return clean
}

async function readContent(ctx: QueryCtx, key: string) {
  const row = await ctx.db
    .query("cmsContent")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique()
  if (!row) return null
  return {
    content: await resolveStorageUrls(ctx, row.content as JsonValue),
    version: row.version,
    updatedAt: row.updatedAt,
  }
}

/** Public content read. Missing rows intentionally return null for defaults. */
export const get = query({
  args: { key: contentKey },
  handler: async (ctx, { key }) => await readContent(ctx, key),
})

/** Admin read is separately guarded even though it currently returns the same shape. */
export const getForAdmin = query({
  args: { key: contentKey },
  handler: async (ctx, { key }) => {
    await requireAdmin(ctx)
    return await readContent(ctx, key)
  },
})

/** Save immediately publishes. A single row per key keeps updates atomic. */
export const save = mutation({
  args: { key: contentKey, content: v.any() },
  handler: async (ctx, { key, content }) => {
    await requireAdmin(ctx)
    const stored = cleanForStorage(content as JsonValue)
    const existing = await ctx.db
      .query("cmsContent")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique()
    const updatedAt = Date.now()
    if (existing) {
      await ctx.db.patch(existing._id, {
        content: stored,
        version: existing.version + 1,
        updatedAt,
      })
      return { version: existing.version + 1, updatedAt }
    }
    await ctx.db.insert("cmsContent", {
      key,
      content: stored,
      version: 1,
      updatedAt,
    })
    return { version: 1, updatedAt }
  },
})
