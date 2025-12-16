import { supabase } from "@/lib/supabase/browser-client"
import type { TablesInsert, TablesUpdate } from "@/supabase/types"

// قفل روی schema public برای جلوگیری از never / overload
const db = supabase.schema("public")

export const getMessageById = async (messageId: string) => {
  const { data: message, error } = await db
    .from("messages")
    .select("*")
    .eq("id", messageId)
    .single()

  if (!message) {
    throw new Error(error?.message || "Message not found")
  }

  return message
}

export const getMessagesByChatId = async (chatId: string) => {
  const { data: messages, error } = await db
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)

  if (!messages) {
    throw new Error(error?.message || "Messages not found")
  }

  return messages
}

export const createMessage = async (message: TablesInsert<"messages">) => {
  const { data: createdMessage, error } = await db
    .from("messages")
    .insert(message) // ✅ insert تکی بدون آرایه
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdMessage
}

export const createMessages = async (messages: TablesInsert<"messages">[]) => {
  const { data: createdMessages, error } = await db
    .from("messages")
    .insert(messages)
    .select("*")

  if (error) {
    throw new Error(error.message)
  }

  return createdMessages
}

export const updateMessage = async (
  messageId: string,
  message: TablesUpdate<"messages">
) => {
  const { data: updatedMessage, error } = await db
    .from("messages")
    .update(message)
    .eq("id", messageId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedMessage
}

export const deleteMessage = async (messageId: string) => {
  const { error } = await db.from("messages").delete().eq("id", messageId)

  if (error) {
    throw new Error(error.message)
  }

  return true
}

export async function deleteMessagesIncludingAndAfter(
  userId: string,
  chatId: string,
  sequenceNumber: number
) {
  const { error } = await db.rpc("delete_messages_including_and_after", {
    p_user_id: userId,
    p_chat_id: chatId,
    p_sequence_number: sequenceNumber
  })

  if (error) {
    return {
      error: "Failed to delete messages."
    }
  }

  return true
}
