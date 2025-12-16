import { supabase } from "@/lib/supabase/browser-client"
import type { TablesInsert } from "@/supabase/types"

// قفل روی schema public برای جلوگیری از never / overload
const db = supabase.schema("public")

export const getAssistantFilesByAssistantId = async (assistantId: string) => {
  const { data: assistantFiles, error } = await db
    .from("assistants")
    .select(
      `
        id, 
        name, 
        files (*)
      `
    )
    .eq("id", assistantId)
    .single()

  if (!assistantFiles) {
    throw new Error(error?.message || "Assistant files not found.")
  }

  return assistantFiles
}

export const createAssistantFile = async (
  assistantFile: TablesInsert<"assistant_files">
) => {
  const { data: createdAssistantFile, error } = await db
    .from("assistant_files")
    .insert(assistantFile) // insert تکی
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdAssistantFile
}

export const createAssistantFiles = async (
  assistantFiles: TablesInsert<"assistant_files">[]
) => {
  const { data: createdAssistantFiles, error } = await db
    .from("assistant_files")
    .insert(assistantFiles)
    .select("*")

  if (!createdAssistantFiles) {
    throw new Error(error?.message || "Failed to create assistant files.")
  }

  return createdAssistantFiles
}

export const deleteAssistantFile = async (
  assistantId: string,
  fileId: string
) => {
  const { error } = await db
    .from("assistant_files")
    .delete()
    .eq("assistant_id", assistantId)
    .eq("file_id", fileId)

  if (error) throw new Error(error.message)

  return true
}
