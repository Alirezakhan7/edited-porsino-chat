import { supabase } from "@/lib/supabase/browser-client"
import type { TablesInsert } from "@/supabase/types"

// قفل روی schema public برای جلوگیری از never / overload
const db = supabase.schema("public")

export const getMessageFileItemsByMessageId = async (messageId: string) => {
  const { data: messageFileItems, error } = await db
    .from("messages")
    .select(
      `
      id,
      file_items (*)
    `
    )
    .eq("id", messageId)
    .single()

  if (!messageFileItems) {
    throw new Error(error?.message || "Message file items not found.")
  }

  return messageFileItems
}

export const createMessageFileItems = async (
  messageFileItems: TablesInsert<"message_file_items">[]
) => {
  const { data: createdMessageFileItems, error } = await db
    .from("message_file_items")
    .insert(messageFileItems)
    .select("*")

  if (!createdMessageFileItems) {
    throw new Error(error?.message || "Failed to create message file items.")
  }

  return createdMessageFileItems
}
