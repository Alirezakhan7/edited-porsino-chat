// lib/types.ts

// ساختار هر آیتم در فایل JSON
export interface GamifiedUnit {
  uid: string
  chunk_index: number
  lesson_title: string
  is_start_of_lesson: boolean
  type: "gamified_unit"

  story: string // متن داستانی (حاوی تگ عکس)
  konkur_tips: string[] // نکات کنکوری

  interaction: {
    question: string
    options: string[]
    correct_index: number
    feedback: string
  }

  flashcard: {
    front: string
    back: string
  }
}

// ساختار دیتابیس برای پیشرفت کاربر
export interface UserProgressDB {
  id: string
  user_id: string
  chapter_id: string
  current_chunk_index: number
  completed_steps: number
  total_xp: number
}
