// lib/lessons/types.ts

export type ActivityId = "reading" | "flashcard" | "exam" | "speed-test"

export interface LessonActivityConfig {
  id: ActivityId
  title: string
  description: string
  icon: string // همون ایموجی که روی کارت می‌ذاریم
  color: string // کلاس گرادینت Tailwind مثل "from-sky-400 to-emerald-400"
}

export interface LessonConfig {
  lessonKey: string
  grade: string
  chapterId: string
  sectionId: string
  title: string
  description: string
  activities: LessonActivityConfig[]
}
