import { supabase } from "@/lib/supabase/browser-client"
import type { TablesInsert, TablesUpdate } from "@/supabase/types"

// قفل روی schema public برای جلوگیری از never / overload
const db = supabase.schema("public")

export const getFoldersByWorkspaceId = async (workspaceId: string) => {
  const { data: folders, error } = await db
    .from("folders")
    .select("*")
    .eq("workspace_id", workspaceId)

  if (!folders) {
    throw new Error(error?.message || "Folders not found.")
  }

  return folders
}

export const createFolder = async (folder: TablesInsert<"folders">) => {
  const { data: createdFolder, error } = await db
    .from("folders")
    .insert(folder) // ✅ insert تکی بدون آرایه
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdFolder
}

export const updateFolder = async (
  folderId: string,
  folder: TablesUpdate<"folders">
) => {
  const { data: updatedFolder, error } = await db
    .from("folders")
    .update(folder)
    .eq("id", folderId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedFolder
}

export const deleteFolder = async (folderId: string) => {
  const { error } = await db.from("folders").delete().eq("id", folderId)

  if (error) {
    throw new Error(error.message)
  }

  return true
}
