import { supabase } from "@/lib/supabase/browser-client"
import type { TablesInsert } from "@/supabase/types"

// قفل روی schema public برای جلوگیری از never / overload
const db = supabase.schema("public")

export const getAssistantCollectionsByAssistantId = async (
  assistantId: string
) => {
  const { data: assistantCollections, error } = await db
    .from("assistants")
    .select(
      `
        id, 
        name, 
        collections (*)
      `
    )
    .eq("id", assistantId)
    .single()

  if (!assistantCollections) {
    throw new Error(error?.message || "Assistant collections not found.")
  }

  return assistantCollections
}

export const createAssistantCollection = async (
  assistantCollection: TablesInsert<"assistant_collections">
) => {
  const { data: createdAssistantCollection, error } = await db
    .from("assistant_collections")
    .insert(assistantCollection) // insert تکی
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdAssistantCollection
}

export const createAssistantCollections = async (
  assistantCollections: TablesInsert<"assistant_collections">[]
) => {
  const { data: createdAssistantCollections, error } = await db
    .from("assistant_collections")
    .insert(assistantCollections)
    .select("*")

  if (!createdAssistantCollections) {
    throw new Error(error?.message || "Failed to create assistant collections.")
  }

  return createdAssistantCollections
}

export const deleteAssistantCollection = async (
  assistantId: string,
  collectionId: string
) => {
  const { error } = await db
    .from("assistant_collections")
    .delete()
    .eq("assistant_id", assistantId)
    .eq("collection_id", collectionId)

  if (error) throw new Error(error.message)

  return true
}
