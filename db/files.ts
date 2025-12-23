import { supabase } from "@/lib/supabase/browser-client"
import type { TablesInsert, TablesUpdate } from "@/supabase/types"
import { toast } from "sonner"
import { uploadFile } from "./storage/files"

// قفل روی schema public
const db = supabase.schema("public")

export const getFileById = async (fileId: string) => {
  const { data: file, error } = await db
    .from("files")
    .select("*")
    .eq("id", fileId)
    .single()

  if (!file) {
    throw new Error(error?.message || "File not found.")
  }

  return file
}

export const getFileWorkspacesByWorkspaceId = async (workspaceId: string) => {
  const { data: workspace, error } = await db
    .from("workspaces")
    .select(
      `
      id,
      name,
      files (*)
    `
    )
    .eq("id", workspaceId)
    .single()

  if (!workspace) {
    throw new Error(error?.message || "Workspace not found.")
  }

  return workspace
}

export const getFileWorkspacesByFileId = async (fileId: string) => {
  const { data: file, error } = await db
    .from("files")
    .select(
      `
      id, 
      name, 
      workspaces (*)
    `
    )
    .eq("id", fileId)
    .single()

  if (!file) {
    throw new Error(error?.message || "File not found.")
  }

  return file
}

// تغییر: حذف منطق خاص Docx چون کتابخانه آن حذف شده است
export const createFileBasedOnExtension = async (
  file: File,
  fileRecord: TablesInsert<"files">,
  workspace_id: string
) => {
  return createFile(file, fileRecord, workspace_id)
}

export const createFile = async (
  file: File,
  fileRecord: TablesInsert<"files">,
  workspace_id: string
) => {
  let validFilename = fileRecord.name.replace(/[^a-z0-9.]/gi, "_").toLowerCase()
  const extension = file.name.split(".").pop()
  const extensionIndex = validFilename.lastIndexOf(".")
  const baseName = validFilename.substring(
    0,
    extensionIndex < 0 ? undefined : extensionIndex
  )
  const maxBaseNameLength = 100 - (extension?.length || 0) - 1
  if (baseName.length > maxBaseNameLength) {
    fileRecord.name = baseName.substring(0, maxBaseNameLength) + "." + extension
  } else {
    fileRecord.name = baseName + "." + extension
  }

  const { data: createdFile, error } = await db
    .from("files")
    .insert(fileRecord)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  await createFileWorkspace({
    user_id: createdFile.user_id,
    file_id: createdFile.id,
    workspace_id
  })

  const filePath = await uploadFile(file, {
    name: createdFile.name,
    user_id: createdFile.user_id,
    file_id: createdFile.name
  })

  await updateFile(createdFile.id, {
    file_path: filePath
  })

  // نکته: درخواست پردازش فایل را حذف نکردیم تا ساختار حفظ شود،
  // اما چون API Route آن را در مرحله بعد خنثی می‌کنیم، مشکلی پیش نمی‌آید.
  // اگر بخواهید می‌توانید این بخش fetch را هم حذف کنید.

  const fetchedFile = await getFileById(createdFile.id)
  return fetchedFile
}

// تابع createDocXFile به طور کامل حذف شد چون mammoth نداریم

export const createFiles = async (
  files: TablesInsert<"files">[],
  workspace_id: string
) => {
  const { data: createdFiles, error } = await db
    .from("files")
    .insert(files)
    .select("*")

  if (error) {
    throw new Error(error.message)
  }

  await createFileWorkspaces(
    createdFiles.map(file => ({
      user_id: file.user_id,
      file_id: file.id,
      workspace_id
    }))
  )

  return createdFiles
}

export const createFileWorkspace = async (item: {
  user_id: string
  file_id: string
  workspace_id: string
}) => {
  const { data: createdFileWorkspace, error } = await db
    .from("file_workspaces")
    .insert(item)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdFileWorkspace
}

export const createFileWorkspaces = async (
  items: { user_id: string; file_id: string; workspace_id: string }[]
) => {
  const { data: createdFileWorkspaces, error } = await db
    .from("file_workspaces")
    .insert(items)
    .select("*")

  if (error) throw new Error(error.message)

  return createdFileWorkspaces
}

export const updateFile = async (
  fileId: string,
  file: TablesUpdate<"files">
) => {
  const { data: updatedFile, error } = await db
    .from("files")
    .update(file)
    .eq("id", fileId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedFile
}

export const deleteFile = async (fileId: string) => {
  const { error } = await db.from("files").delete().eq("id", fileId)

  if (error) {
    throw new Error(error.message)
  }

  return true
}

export const deleteFileWorkspace = async (
  fileId: string,
  workspaceId: string
) => {
  const { error } = await db
    .from("file_workspaces")
    .delete()
    .eq("file_id", fileId)
    .eq("workspace_id", workspaceId)

  if (error) throw new Error(error.message)

  return true
}
