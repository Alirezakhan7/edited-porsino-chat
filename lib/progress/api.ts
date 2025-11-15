// lib/progress/api.ts
import type { SupabaseClient } from "@supabase/supabase-js"
import type { ActivityId } from "@/lib/lessons/types"

export type ActivityProgressMap = Record<ActivityId, number>

const EMPTY_PROGRESS: ActivityProgressMap = {
  reading: 0,
  flashcard: 0,
  exam: 0,
  "speed-test": 0
}

export async function getLessonProgress(
  supabase: SupabaseClient,
  lessonKey: string,
  activityIds: ActivityId[]
): Promise<ActivityProgressMap> {
  if (!lessonKey) return { ...EMPTY_PROGRESS }

  const { data, error } = await supabase
    .from("study_progress")
    .select("activity_id, progress")
    .eq("lesson_key", lessonKey)

  if (error) {
    console.error("[getLessonProgress] error", error)
    return { ...EMPTY_PROGRESS }
  }

  const map: ActivityProgressMap = { ...EMPTY_PROGRESS }

  for (const row of data ?? []) {
    const id = row.activity_id as ActivityId
    if (activityIds.includes(id)) {
      map[id] = row.progress ?? 0
    }
  }

  return map
}

interface UpsertParams {
  userId: string
  lessonKey: string
  activityId: ActivityId
  progress: number
}

export async function upsertActivityProgress(
  supabase: SupabaseClient,
  params: UpsertParams
) {
  const { userId, lessonKey, activityId, progress } = params

  const clamped = Math.max(0, Math.min(100, Math.round(progress)))

  const { error } = await supabase.from("study_progress").upsert(
    {
      user_id: userId,
      lesson_key: lessonKey,
      activity_id: activityId,
      progress: clamped
    },
    {
      onConflict: "user_id,lesson_key,activity_id"
    }
  )

  if (error) {
    console.error("[upsertActivityProgress] error", error)
    throw error
  }
}
