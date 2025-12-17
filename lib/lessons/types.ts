// lib/lessons/types.ts

// 1. تعریف ساختار محتوای یک فلش‌کارت
export interface FlashcardContent {
  front: string
  back: string
}

// 2. ساختار هر آیتم در فایل JSON (GamifiedUnit)
export interface GamifiedUnit {
  uid: string
  chunk_index: number // یا group_index بسته به نام‌گذاری جیسون شما

  lesson_title: string
  lesson_number?: number // اختیاری: اگر در جیسون باشد
  chapter_number?: number // اختیاری: اگر در جیسون باشد

  is_start_of_lesson: boolean
  type: "gamified_unit"

  story: string // متن داستانی (حاوی تگ عکس)
  konkur_tips: string[] // آرایه نکات کنکوری

  interaction: {
    question: string
    options: string[]
    correct_index: number
    feedback: string
  }

  // ✅ تغییر مهم: تبدیل آبجکت تکی به آرایه (Array)
  // نام آن دقیقا flashcards شد تا با JSON یکی باشد
  flashcards?: FlashcardContent[]
}

// 3. ساختار دیتابیس برای پیشرفت کاربر (بدون تغییر)
export interface UserProgressDB {
  id: string
  user_id: string
  chapter_id: string
  current_chunk_index: number
  completed_steps: number
  total_xp: number
}
