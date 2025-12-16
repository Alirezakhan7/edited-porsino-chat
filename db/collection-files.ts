import { supabase } from "@/lib/supabase/browser-client"
import type { TablesInsert } from "@/supabase/types"

// قفل روی schema public برای جلوگیری از never / overload
const db = supabase.schema("public")

export const getCollectionFilesByCollectionId = async (
  collectionId: string
) => {
  const { data: collectionFiles, error } = await db
    .from("collections")
    .select(
      `
        id, 
        name, 
        files ( id, name, type )
      `
    )
    .eq("id", collectionId)
    .single()

  if (!collectionFiles) {
    throw new Error(error?.message || "Collection files not found.")
  }

  return collectionFiles
}

export const createCollectionFile = async (
  collectionFile: TablesInsert<"collection_files">
) => {
  const { data: createdCollectionFile, error } = await db
    .from("collection_files")
    .insert(collectionFile)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdCollectionFile
}

export const createCollectionFiles = async (
  collectionFiles: TablesInsert<"collection_files">[]
) => {
  const { data: createdCollectionFiles, error } = await db
    .from("collection_files")
    .insert(collectionFiles)
    .select("*")

  if (!createdCollectionFiles) {
    throw new Error(error?.message || "Failed to create collection files.")
  }

  return createdCollectionFiles
}

export const deleteCollectionFile = async (
  collectionId: string,
  fileId: string
) => {
  const { error } = await db
    .from("collection_files")
    .delete()
    .eq("collection_id", collectionId)
    .eq("file_id", fileId)

  if (error) throw new Error(error.message)

  return true
}
