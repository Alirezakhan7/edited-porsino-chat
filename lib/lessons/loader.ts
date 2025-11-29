// lib/lessons/loader.ts
import { chapters, ChapterConfig } from "./config"
import { GamifiedUnit } from "@/lib/lessons/types" // همان تایپی که قبلاً تعریف کردیم

export async function loadLessonData(
  chapterId: string
): Promise<GamifiedUnit[] | null> {
  const config = chapters.find(c => c.id === chapterId)

  if (!config) {
    console.error(`Chapter config not found for id: ${chapterId}`)
    return null
  }

  try {
    // ایمپورت پویا (Dynamic Import) بر اساس آدرس پوشه
    // نکته: آدرس دهی باید دقیق باشد. فرض بر این است که data در روت src است.
    // اگر از Next.js استفاده می‌کنی، این روش بهینه است چون فقط فایل مورد نیاز را لود می‌کند.

    let data

    if (config.grade === "10") {
      data = await import(`@/data/lessons/grade_10/${config.jsonFileName}`)
    } else if (config.grade === "11") {
      data = await import(`@/data/lessons/grade_11/${config.jsonFileName}`)
    } else {
      data = await import(`@/data/lessons/grade_12/${config.jsonFileName}`)
    }

    return data.default as GamifiedUnit[]
  } catch (error) {
    console.error(`Failed to load JSON for chapter ${chapterId}:`, error)
    return null
  }
}
