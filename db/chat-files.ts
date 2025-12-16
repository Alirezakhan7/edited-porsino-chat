import { supabase } from "@/lib/supabase/browser-client"
import type { TablesInsert } from "@/supabase/types"

// قفل روی schema public برای جلوگیری از never / overload
const db = supabase.schema("public")

export const getChatFilesByChatId = async (chatId: string) => {
  const { data: chatFiles, error } = await db
    .from("chats")
    .select(
      `
      id, 
      name, 
      files (*)
    `
    )
    .eq("id", chatId)
    .single()

  if (!chatFiles) {
    throw new Error(error?.message || "Chat files not found.")
  }

  return chatFiles
}

export const createChatFile = async (chatFile: TablesInsert<"chat_files">) => {
  const { data: createdChatFile, error } = await db
    .from("chat_files")
    .insert(chatFile) // insert تکی
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdChatFile
}

export const createChatFiles = async (
  chatFiles: TablesInsert<"chat_files">[]
) => {
  const { data: createdChatFiles, error } = await db
    .from("chat_files")
    .insert(chatFiles)
    .select("*")

  if (!createdChatFiles) {
    throw new Error(error?.message || "Failed to create chat files.")
  }

  return createdChatFiles
}
