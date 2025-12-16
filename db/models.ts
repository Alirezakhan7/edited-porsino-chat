import { supabase } from "@/lib/supabase/browser-client"
import type { TablesInsert, TablesUpdate } from "@/supabase/types"

// قفل کردن روی schema public برای جلوگیری از never/overload ambiguity
const db = supabase.schema("public")

export const getModelById = async (modelId: string) => {
  const { data: model, error } = await db
    .from("models")
    .select("*")
    .eq("id", modelId)
    .single()

  if (!model) {
    throw new Error(error?.message || "Model not found.")
  }

  return model
}

export const getModelWorkspacesByWorkspaceId = async (workspaceId: string) => {
  const { data: workspace, error } = await db
    .from("workspaces")
    .select(
      `
      id,
      name,
      models (*)
    `
    )
    .eq("id", workspaceId)
    .single()

  if (!workspace) {
    throw new Error(error?.message || "Workspace not found.")
  }

  return workspace
}

export const getModelWorkspacesByModelId = async (modelId: string) => {
  const { data: model, error } = await db
    .from("models")
    .select(
      `
      id, 
      name, 
      workspaces (*)
    `
    )
    .eq("id", modelId)
    .single()

  if (!model) {
    throw new Error(error?.message || "Model not found.")
  }

  return model
}

export const createModel = async (
  model: TablesInsert<"models">,
  workspace_id: string
) => {
  const { data: createdModel, error } = await db
    .from("models")
    .insert(model) // ✅ insert تکی بدون آرایه
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  await createModelWorkspace({
    user_id: createdModel.user_id,
    model_id: createdModel.id,
    workspace_id
  })

  return createdModel
}

export const createModels = async (
  models: TablesInsert<"models">[],
  workspace_id: string
) => {
  const { data: createdModels, error } = await db
    .from("models")
    .insert(models) // ✅ اینجا چون چندتایی است آرایه درست است
    .select("*")

  if (error) {
    throw new Error(error.message)
  }

  await createModelWorkspaces(
    createdModels.map(model => ({
      user_id: model.user_id,
      model_id: model.id,
      workspace_id
    }))
  )

  return createdModels
}

export const createModelWorkspace = async (item: {
  user_id: string
  model_id: string
  workspace_id: string
}) => {
  const { data: createdModelWorkspace, error } = await db
    .from("model_workspaces")
    .insert(item) // ✅ insert تکی بدون آرایه
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdModelWorkspace
}

export const createModelWorkspaces = async (
  items: { user_id: string; model_id: string; workspace_id: string }[]
) => {
  const { data: createdModelWorkspaces, error } = await db
    .from("model_workspaces")
    .insert(items)
    .select("*")

  if (error) throw new Error(error.message)

  return createdModelWorkspaces
}

export const updateModel = async (
  modelId: string,
  model: TablesUpdate<"models">
) => {
  const { data: updatedModel, error } = await db
    .from("models")
    .update(model)
    .eq("id", modelId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedModel
}

export const deleteModel = async (modelId: string) => {
  const { error } = await db.from("models").delete().eq("id", modelId)

  if (error) {
    throw new Error(error.message)
  }

  return true
}

export const deleteModelWorkspace = async (
  modelId: string,
  workspaceId: string
) => {
  const { error } = await db
    .from("model_workspaces")
    .delete()
    .eq("model_id", modelId)
    .eq("workspace_id", workspaceId)

  if (error) throw new Error(error.message)

  return true
}
