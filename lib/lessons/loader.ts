// lib/lessons/loader.ts
import { createClient } from "@/lib/supabase/server"
import { getChapterConfig } from "./config"
import { GamifiedUnit } from "@/lib/lessons/types"

export async function loadLessonData(
  chapterId: string
): Promise<GamifiedUnit[] | null> {
  // 1. پیدا کردن تنظیمات فصل از روی آدرس URL
  const config = getChapterConfig(chapterId)

  if (!config) {
    console.error(`Chapter config not found for id: ${chapterId}`)
    return null
  }

  // 2. ساخت کلاینت دیتابیس
  const supabase = await createClient()

  // 3. دریافت محتوا از دیتابیس
  // منطق: برو درس‌هایی را بیار که grade و chapter_number شان با کانفیگ ما یکی است
  const { data, error } = await supabase
    .from("lesson_contents")
    .select(
      `
      content,
      sequence_order,
      lessons!inner (
        grade,
        chapter_number
      )
    `
    )
    .eq("lessons.grade", parseInt(config.grade)) // تبدیل رشته "12" به عدد 12
    .eq("lessons.chapter_number", config.chapterNumber) // شماره فصل (1)
    .order("sequence_order", { ascending: true })

  if (error) {
    console.error(`Database error fetching chapter ${chapterId}:`, error)
    return null
  }

  if (!data || data.length === 0) {
    console.warn(`No content found in DB for chapter ${chapterId}`)
    return null
  }

  // 4. استخراج محتوای اصلی از دل پاسخ دیتابیس
  // دیتابیس آرایه‌ای از { content: {...} } برمی‌گرداند، ما فقط داخل content را می‌خواهیم
  const units = data.map((row: any) => row.content as GamifiedUnit)

  return units
}
