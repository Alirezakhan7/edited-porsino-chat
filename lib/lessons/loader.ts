// lib/lessons/loader.ts
import { getChapterConfig } from "./config"
import { GamifiedUnit } from "@/lib/lessons/types"
import fs from "fs"
import path from "path"

export async function loadLessonData(
  chapterId: string
): Promise<GamifiedUnit[] | null> {
  const config = getChapterConfig(chapterId)

  if (!config) {
    console.error(`Chapter config not found for id: ${chapterId}`)
    return null
  }

  const localPath = path.join(
    process.cwd(),
    "data",
    "lessons",
    `grade_${config.grade}`,
    `${chapterId}.json`
  )

  if (fs.existsSync(localPath)) {
    try {
      const raw = fs.readFileSync(localPath, "utf-8")
      const units = JSON.parse(raw) as GamifiedUnit[]
      return units
    } catch (error) {
      console.error(`Failed to read local lesson file for ${chapterId}:`, error)
    }
  }

  console.warn(
    `[Demo mode] No local lesson file for ${chapterId}. Returning empty lesson.`
  )
  return []
}
