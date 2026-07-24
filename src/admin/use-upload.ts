import { api } from "@convex/_generated/api"
import type { Id } from "@convex/_generated/dataModel"
import { useMutation } from "convex/react"

/**
 * Returns an `upload(file)` helper that uploads a file straight to Convex file
 * storage and resolves to its `storageId`. Admin-only (the upload URL mutation
 * checks auth server-side).
 */
export function useUpload() {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)

  return async function upload(file: File): Promise<Id<"_storage">> {
    const postUrl = await generateUploadUrl()
    const res = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    })
    if (!res.ok) {
      throw new Error(`Upload failed (${res.status}).`)
    }
    const { storageId } = (await res.json()) as { storageId: Id<"_storage"> }
    return storageId
  }
}
