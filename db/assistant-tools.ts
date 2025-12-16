import { supabase } from "@/lib/supabase/browser-client"
import type { TablesInsert } from "@/supabase/types"

// قفل روی schema public برای جلوگیری از never / overload
const db = supabase.schema("public")

export const getAssistantToolsByAssistantId = async (assistantId: string) => {
  const { data: assistantTools, error } = await db
    .from("assistants")
    .select(
      `
        id, 
        name, 
        tools (*)
      `
    )
    .eq("id", assistantId)
    .single()

  if (!assistantTools) {
    throw new Error(error?.message || "Assistant tools not found.")
  }

  return assistantTools
}

export const createAssistantTool = async (
  assistantTool: TablesInsert<"assistant_tools">
) => {
  const { data: createdAssistantTool, error } = await db
    .from("assistant_tools")
    .insert(assistantTool) // insert تکی
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdAssistantTool
}

export const createAssistantTools = async (
  assistantTools: TablesInsert<"assistant_tools">[]
) => {
  const { data: createdAssistantTools, error } = await db
    .from("assistant_tools")
    .insert(assistantTools)
    .select("*")

  if (!createdAssistantTools) {
    throw new Error(error?.message || "Failed to create assistant tools.")
  }

  return createdAssistantTools
}

export const deleteAssistantTool = async (
  assistantId: string,
  toolId: string
) => {
  const { error } = await db
    .from("assistant_tools")
    .delete()
    .eq("assistant_id", assistantId)
    .eq("tool_id", toolId)

  if (error) throw new Error(error.message)

  return true
}
