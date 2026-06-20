// lib/actions/progress.ts
"use server"

import { revalidatePath } from "next/cache"

export async function saveUserProgress(
  chapterId: string,
  xpEarned: number,
  isLevelUp: boolean = true
) {
  console.log("[Demo mode] saveUserProgress", {
    chapterId,
    xpEarned,
    isLevelUp
  })

  revalidatePath("/lesson/[chapterId]", "page")
  revalidatePath("/path", "page")

  return { success: true }
}
