// lib/flashcards/api.ts
import type { SupabaseClient } from "@supabase/supabase-js"

export interface FlashcardMistakeInput {
  userId: string
  lessonKey: string
  cardId: string
}

// ثبت این‌که این کارت برای این کاربر اشتباه بوده
export async function recordFlashcardMistake(
  supabase: SupabaseClient,
  input: FlashcardMistakeInput
) {
  const { userId, lessonKey, cardId } = input

  const { error } = await supabase.from("flashcard_mistakes").upsert(
    {
      user_id: userId,
      lesson_key: lessonKey,
      card_id: cardId
    },
    {
      onConflict: "user_id,lesson_key,card_id"
    }
  )

  if (error) {
    console.error("[recordFlashcardMistake] error:", error)
    throw error
  }
}
