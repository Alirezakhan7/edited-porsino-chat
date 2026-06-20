// app/[locale]/lesson/[chapterId]/play/play-content.tsx

import { loadLessonData } from "@/lib/lessons/loader"
import { MOCK_USER_ID } from "@/lib/mock/data"
import LessonPlayer from "@/components/lessons/LessonPlayer"

interface PlayContentProps {
  chapterId: string
  locale: string
  stepNumber: number
}

export default async function PlayContent({
  chapterId,
  locale,
  stepNumber
}: PlayContentProps) {
  const allUnits = await loadLessonData(chapterId)

  if (!allUnits || allUnits.length === 0) {
    return (
      <div className="p-10 text-center font-bold text-red-500">
        محتوا بارگذاری نشد یا فصل خالی است 🚫
      </div>
    )
  }

  const unitIndex = stepNumber - 1

  if (unitIndex < 0 || unitIndex >= allUnits.length) {
    return (
      <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center px-4">
        <div className="mb-4 text-xl font-bold">🎉 تبریک! این فصل تمام شد.</div>

        <a
          href={`/${locale}/lesson/${chapterId}`}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 py-3 shadow-lg transition"
        >
          بازگشت به نقشه
        </a>
      </div>
    )
  }

  const targetUnit = allUnits[unitIndex]

  return (
    <LessonPlayer
      units={[targetUnit]}
      chapterId={chapterId}
      stepNumber={stepNumber}
      userId={MOCK_USER_ID}
      locale={locale}
    />
  )
}
