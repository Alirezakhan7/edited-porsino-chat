import { supabase } from "@/lib/supabase/browser-client"
import type { TablesInsert, TablesUpdate } from "@/supabase/types"

// قفل روی schema public برای جلوگیری از overload/never
const db = supabase.schema("public")

export const getPresetById = async (presetId: string) => {
  const { data: preset, error } = await db
    .from("presets")
    .select("*")
    .eq("id", presetId)
    .single()

  if (!preset) {
    throw new Error(error?.message || "Preset not found.")
  }

  return preset
}

export const getPresetWorkspacesByWorkspaceId = async (workspaceId: string) => {
  const { data: workspace, error } = await db
    .from("workspaces")
    .select(
      `
      id,
      name,
      presets (*)
    `
    )
    .eq("id", workspaceId)
    .single()

  if (!workspace) {
    throw new Error(error?.message || "Workspace not found.")
  }

  return workspace
}

export const getPresetWorkspacesByPresetId = async (presetId: string) => {
  const { data: preset, error } = await db
    .from("presets")
    .select(
      `
      id, 
      name, 
      workspaces (*)
    `
    )
    .eq("id", presetId)
    .single()

  if (!preset) {
    throw new Error(error?.message || "Preset not found.")
  }

  return preset
}

export const createPreset = async (
  preset: TablesInsert<"presets">,
  workspace_id: string
) => {
  const { data: createdPreset, error } = await db
    .from("presets")
    .insert(preset) // ✅ insert تکی بدون آرایه
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  await createPresetWorkspace({
    user_id: createdPreset.user_id, // ✅ از رکورد برگشتی
    preset_id: createdPreset.id,
    workspace_id
  })

  return createdPreset
}

export const createPresets = async (
  presets: TablesInsert<"presets">[],
  workspace_id: string
) => {
  const { data: createdPresets, error } = await db
    .from("presets")
    .insert(presets) // ✅ چندتایی: آرایه درست است
    .select("*")

  if (error) {
    throw new Error(error.message)
  }

  await createPresetWorkspaces(
    createdPresets.map(preset => ({
      user_id: preset.user_id,
      preset_id: preset.id,
      workspace_id
    }))
  )

  return createdPresets
}

export const createPresetWorkspace = async (item: {
  user_id: string
  preset_id: string
  workspace_id: string
}) => {
  const { data: createdPresetWorkspace, error } = await db
    .from("preset_workspaces")
    .insert(item) // ✅ insert تکی بدون آرایه
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdPresetWorkspace
}

export const createPresetWorkspaces = async (
  items: { user_id: string; preset_id: string; workspace_id: string }[]
) => {
  const { data: createdPresetWorkspaces, error } = await db
    .from("preset_workspaces")
    .insert(items)
    .select("*")

  if (error) throw new Error(error.message)

  return createdPresetWorkspaces
}

export const updatePreset = async (
  presetId: string,
  preset: TablesUpdate<"presets">
) => {
  const { data: updatedPreset, error } = await db
    .from("presets")
    .update(preset)
    .eq("id", presetId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedPreset
}

export const deletePreset = async (presetId: string) => {
  const { error } = await db.from("presets").delete().eq("id", presetId)

  if (error) {
    throw new Error(error.message)
  }

  return true
}

export const deletePresetWorkspace = async (
  presetId: string,
  workspaceId: string
) => {
  const { error } = await db
    .from("preset_workspaces")
    .delete()
    .eq("preset_id", presetId)
    .eq("workspace_id", workspaceId)

  if (error) throw new Error(error.message)

  return true
}
