import { supabase } from "@/lib/supabase/browser-client"
import type { TablesInsert, TablesUpdate } from "@/supabase/types"

// قفل روی schema public برای جلوگیری از never / overload
const db = supabase.schema("public")

export const getCollectionById = async (collectionId: string) => {
  const { data: collection, error } = await db
    .from("collections")
    .select("*")
    .eq("id", collectionId)
    .single()

  if (!collection) {
    throw new Error(error?.message || "Collection not found.")
  }

  return collection
}

export const getCollectionWorkspacesByWorkspaceId = async (
  workspaceId: string
) => {
  const { data: workspace, error } = await db
    .from("workspaces")
    .select(
      `
      id,
      name,
      collections (*)
    `
    )
    .eq("id", workspaceId)
    .single()

  if (!workspace) {
    throw new Error(error?.message || "Workspace not found.")
  }

  return workspace
}

export const getCollectionWorkspacesByCollectionId = async (
  collectionId: string
) => {
  const { data: collection, error } = await db
    .from("collections")
    .select(
      `
      id, 
      name, 
      workspaces (*)
    `
    )
    .eq("id", collectionId)
    .single()

  if (!collection) {
    throw new Error(error?.message || "Collection not found.")
  }

  return collection
}

export const createCollection = async (
  collection: TablesInsert<"collections">,
  workspace_id: string
) => {
  const { data: createdCollection, error } = await db
    .from("collections")
    .insert(collection) // ✅ insert تکی بدون آرایه
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  await createCollectionWorkspace({
    user_id: createdCollection.user_id,
    collection_id: createdCollection.id,
    workspace_id
  })

  return createdCollection
}

export const createCollections = async (
  collections: TablesInsert<"collections">[],
  workspace_id: string
) => {
  const { data: createdCollections, error } = await db
    .from("collections")
    .insert(collections)
    .select("*")

  if (error) {
    throw new Error(error.message)
  }

  await createCollectionWorkspaces(
    createdCollections.map(collection => ({
      user_id: collection.user_id,
      collection_id: collection.id,
      workspace_id
    }))
  )

  return createdCollections
}

export const createCollectionWorkspace = async (item: {
  user_id: string
  collection_id: string
  workspace_id: string
}) => {
  const { data: createdCollectionWorkspace, error } = await db
    .from("collection_workspaces")
    .insert(item) // ✅ insert تکی بدون آرایه
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdCollectionWorkspace
}

export const createCollectionWorkspaces = async (
  items: { user_id: string; collection_id: string; workspace_id: string }[]
) => {
  const { data: createdCollectionWorkspaces, error } = await db
    .from("collection_workspaces")
    .insert(items)
    .select("*")

  if (error) throw new Error(error.message)

  return createdCollectionWorkspaces
}

export const updateCollection = async (
  collectionId: string,
  collection: TablesUpdate<"collections">
) => {
  const { data: updatedCollection, error } = await db
    .from("collections")
    .update(collection)
    .eq("id", collectionId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedCollection
}

export const deleteCollection = async (collectionId: string) => {
  const { error } = await db.from("collections").delete().eq("id", collectionId)

  if (error) {
    throw new Error(error.message)
  }

  return true
}

export const deleteCollectionWorkspace = async (
  collectionId: string,
  workspaceId: string
) => {
  const { error } = await db
    .from("collection_workspaces")
    .delete()
    .eq("collection_id", collectionId)
    .eq("workspace_id", workspaceId)

  if (error) throw new Error(error.message)

  return true
}
