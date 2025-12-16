import { supabase } from "@/lib/supabase/browser-client"
import type { TablesInsert, TablesUpdate } from "@/supabase/types"

// قفل روی schema public برای جلوگیری از never / overload
const db = supabase.schema("public")

export const getPromptById = async (promptId: string) => {
  const { data: prompt, error } = await db
    .from("prompts")
    .select("*")
    .eq("id", promptId)
    .single()

  if (!prompt) {
    throw new Error(error?.message || "Prompt not found.")
  }

  return prompt
}

export const getPromptWorkspacesByWorkspaceId = async (workspaceId: string) => {
  const { data: workspace, error } = await db
    .from("workspaces")
    .select(
      `
      id,
      name,
      prompts (*)
    `
    )
    .eq("id", workspaceId)
    .single()

  if (!workspace) {
    throw new Error(error?.message || "Workspace not found.")
  }

  return workspace
}

export const getPromptWorkspacesByPromptId = async (promptId: string) => {
  const { data: prompt, error } = await db
    .from("prompts")
    .select(
      `
      id, 
      name, 
      workspaces (*)
    `
    )
    .eq("id", promptId)
    .single()

  if (!prompt) {
    throw new Error(error?.message || "Prompt not found.")
  }

  return prompt
}

export const createPrompt = async (
  prompt: TablesInsert<"prompts">,
  workspace_id: string
) => {
  const { data: createdPrompt, error } = await db
    .from("prompts")
    .insert(prompt) // ✅ insert تکی بدون آرایه
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  await createPromptWorkspace({
    user_id: createdPrompt.user_id, // ✅ از رکورد برگشتی
    prompt_id: createdPrompt.id,
    workspace_id
  })

  return createdPrompt
}

export const createPrompts = async (
  prompts: TablesInsert<"prompts">[],
  workspace_id: string
) => {
  const { data: createdPrompts, error } = await db
    .from("prompts")
    .insert(prompts) // چندتایی درست است
    .select("*")

  if (error) {
    throw new Error(error.message)
  }

  await createPromptWorkspaces(
    createdPrompts.map(prompt => ({
      user_id: prompt.user_id,
      prompt_id: prompt.id,
      workspace_id
    }))
  )

  return createdPrompts
}

export const createPromptWorkspace = async (item: {
  user_id: string
  prompt_id: string
  workspace_id: string
}) => {
  const { data: createdPromptWorkspace, error } = await db
    .from("prompt_workspaces")
    .insert(item) // ✅ insert تکی بدون آرایه
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdPromptWorkspace
}

export const createPromptWorkspaces = async (
  items: { user_id: string; prompt_id: string; workspace_id: string }[]
) => {
  const { data: createdPromptWorkspaces, error } = await db
    .from("prompt_workspaces")
    .insert(items)
    .select("*")

  if (error) throw new Error(error.message)

  return createdPromptWorkspaces
}

export const updatePrompt = async (
  promptId: string,
  prompt: TablesUpdate<"prompts">
) => {
  const { data: updatedPrompt, error } = await db
    .from("prompts")
    .update(prompt)
    .eq("id", promptId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedPrompt
}

export const deletePrompt = async (promptId: string) => {
  const { error } = await db.from("prompts").delete().eq("id", promptId)

  if (error) {
    throw new Error(error.message)
  }

  return true
}

export const deletePromptWorkspace = async (
  promptId: string,
  workspaceId: string
) => {
  const { error } = await db
    .from("prompt_workspaces")
    .delete()
    .eq("prompt_id", promptId)
    .eq("workspace_id", workspaceId)

  if (error) throw new Error(error.message)

  return true
}
