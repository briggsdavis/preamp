import type { Id } from "./_generated/dataModel"

type StorageReader = { storage: { getUrl: (id: Id<"_storage">) => Promise<string | null> } }

type Process = { env: Record<string, string | undefined> }

// Public URL for a stored file. When MEDIA_BASE_URL is set, the file is served
// through the R2-backed media domain instead of directly from Convex.
// Managed by github.com/ntedvs/media; update it there.
export async function mediaUrl(ctx: StorageReader, id: Id<"_storage">) {
  const url = await ctx.storage.getUrl(id)
  const base = (globalThis as { process?: Process }).process?.env.MEDIA_BASE_URL
  return url && base ? url.replace(/^https:\/\/[^/]+/, base) : url
}
