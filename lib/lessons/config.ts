// lib/lessons/config.ts
import type { LessonConfig, ActivityId } from "./types"

export const lessons: LessonConfig[] = [
  {
    lessonKey: "bio10-ch1-10-s1", // هر اسمی دوست داری، فقط یکتا باشه
    grade: "bio10",
    chapterId: "ch1-10", // 👈 دقیقا همونی که در URL داری
    sectionId: "s1", // 👈 دقیقا همونی که در URL داری
    title: "گفتار ۱: گستره حیات",
    description:
      "در این گفتار با محدوده حیات و ویژگی‌های موجودات زنده آشنا می‌شوید.",
    activities: [
      {
        id: "reading",
        title: "متن درسی",
        description:
          "با چند سؤال مفهومی، متن درس را عمیق و مرحله‌به‌مرحله می‌خوانی.",
        icon: "📖",
        color: "from-sky-400 to-emerald-400"
      },
      {
        id: "flashcard",
        title: "فلش‌کارت‌ها",
        description: "مفاهیم و واژه‌های کلیدی را با فلش‌کارت مرور کن.",
        icon: "🧠",
        color: "from-violet-400 to-fuchsia-400"
      },
      {
        id: "exam",
        title: "امتحان نهایی",
        description: "چند تست شبیه امتحان از همین گفتار برای سنجش تسلط.",
        icon: "✅",
        color: "from-emerald-400 to-lime-400"
      },
      {
        id: "speed-test",
        title: "تست سرعتی",
        description: "چند تست زمان‌دار برای تمرین سرعت و دقت.",
        icon: "⚡",
        color: "from-amber-400 to-orange-500"
      }
    ]
  }

  // بعداً گفتارهای دیگه رو هم به همین آرایه اضافه می‌کنی
]

export function findLessonByParams(
  chapterId: string,
  sectionId: string
): LessonConfig | undefined {
  return lessons.find(
    lesson => lesson.chapterId === chapterId && lesson.sectionId === sectionId
  )
}
