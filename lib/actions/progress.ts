// lib/actions/progress.ts
"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// 1. تعریف دستی ساختار جدول
interface UserProgressTable {
  id?: string
  user_id: string
  chapter_id: string
  completed_steps: number
  total_xp: number
  last_played_at?: string
}

export async function saveUserProgress(
  chapterId: string,
  xpEarned: number,
  isLevelUp: boolean = true
) {
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) return { error: "User not found" }

  // 2. دریافت اطلاعات فعلی
  const { data: rawProgress, error: fetchError } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("chapter_id", chapterId)
    .single()

  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("Error fetching progress:", fetchError)
    return { error: "Database error" }
  }

  // 3. محاسبات
  const currentProgress = rawProgress as unknown as UserProgressTable | null
  const currentSteps = currentProgress?.completed_steps || 0
  const currentXP = currentProgress?.total_xp || 0

  const newSteps = isLevelUp ? currentSteps + 1 : currentSteps
  const newXP = currentXP + xpEarned

  // 4. آپدیت کردن با تنظیمات دقیق (FIXED)
  const { error: upsertError } = await supabase.from("user_progress").upsert(
    {
      user_id: user.id,
      chapter_id: chapterId,
      completed_steps: newSteps,
      total_xp: newXP,
      last_played_at: new Date().toISOString()
    } as any,
    // --- تغییر حیاتی اینجاست ---
    // به سوپابیس می‌گوییم اگر ترکیب این دو ستون تکراری بود، به جای ارور دادن، آپدیت کن
    { onConflict: "user_id, chapter_id" }
  )

  if (upsertError) {
    console.error("Error saving progress:", upsertError)
    return { error: "Save failed" }
  }

  // 5. تازه‌سازی کش
  revalidatePath("/lesson/[chapterId]", "page")
  revalidatePath("/path", "page")

  return { success: true }
}
