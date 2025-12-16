import { supabase } from "@/lib/supabase/browser-client"
import type { TablesInsert, TablesUpdate } from "@/supabase/types"

// قفل روی schema public برای جلوگیری از never / overload
const db = supabase.schema("public")

export const getAssistantById = async (assistantId: string) => {
  const { data: assistant, error } = await db
    .from("assistants")
    .select("*")
    .eq("id", assistantId)
    .single()

  if (!assistant) {
    throw new Error(error?.message || "Assistant not found.")
  }

  return assistant
}

export const getAssistantWorkspacesByWorkspaceId = async (
  workspaceId: string
) => {
  const { data: workspace, error } = await db
    .from("workspaces")
    .select(
      `
      id,
      name,
      assistants (*)
    `
    )
    .eq("id", workspaceId)
    .single()

  if (!workspace) {
    throw new Error(error?.message || "Workspace not found.")
  }

  return workspace
}

export const getAssistantWorkspacesByAssistantId = async (
  assistantId: string
) => {
  const { data: assistant, error } = await db
    .from("assistants")
    .select(
      `
      id, 
      name, 
      workspaces (*)
    `
    )
    .eq("id", assistantId)
    .single()

  if (!assistant) {
    throw new Error(error?.message || "Assistant not found.")
  }

  return assistant
}

export const createAssistant = async (
  assistant: TablesInsert<"assistants">,
  workspace_id: string
) => {
  const { data: createdAssistant, error } = await db
    .from("assistants")
    .insert(assistant) // ✅ insert تکی بدون آرایه
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  await createAssistantWorkspace({
    user_id: createdAssistant.user_id,
    assistant_id: createdAssistant.id,
    workspace_id
  })

  return createdAssistant
}

export const createAssistants = async (
  assistants: TablesInsert<"assistants">[],
  workspace_id: string
) => {
  const { data: createdAssistants, error } = await db
    .from("assistants")
    .insert(assistants)
    .select("*")

  if (error) {
    throw new Error(error.message)
  }

  await createAssistantWorkspaces(
    createdAssistants.map(assistant => ({
      user_id: assistant.user_id,
      assistant_id: assistant.id,
      workspace_id
    }))
  )

  return createdAssistants
}

export const createAssistantWorkspace = async (item: {
  user_id: string
  assistant_id: string
  workspace_id: string
}) => {
  const { data: createdAssistantWorkspace, error } = await db
    .from("assistant_workspaces")
    .insert(item) // ✅ insert تکی بدون آرایه
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdAssistantWorkspace
}

export const createAssistantWorkspaces = async (
  items: { user_id: string; assistant_id: string; workspace_id: string }[]
) => {
  const { data: createdAssistantWorkspaces, error } = await db
    .from("assistant_workspaces")
    .insert(items)
    .select("*")

  if (error) throw new Error(error.message)

  return createdAssistantWorkspaces
}

export const updateAssistant = async (
  assistantId: string,
  assistant: TablesUpdate<"assistants">
) => {
  const { data: updatedAssistant, error } = await db
    .from("assistants")
    .update(assistant)
    .eq("id", assistantId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedAssistant
}

export const deleteAssistant = async (assistantId: string) => {
  const { error } = await db.from("assistants").delete().eq("id", assistantId)

  if (error) {
    throw new Error(error.message)
  }

  return true
}

export const deleteAssistantWorkspace = async (
  assistantId: string,
  workspaceId: string
) => {
  const { error } = await db
    .from("assistant_workspaces")
    .delete()
    .eq("assistant_id", assistantId)
    .eq("workspace_id", workspaceId)

  if (error) throw new Error(error.message)

  return true
}
