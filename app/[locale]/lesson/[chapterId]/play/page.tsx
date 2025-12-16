import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { loadLessonData } from "@/lib/lessons/loader"
import { getChapterConfig } from "@/lib/lessons/config"
import LessonPlayer from "@/components/lessons/LessonPlayer"

interface PlayPageProps {
  params: Promise<{
    chapterId: string
    locale: string
  }>
  searchParams: Promise<{
    step?: string
  }>
}

export default async function PlayPage({
  params,
  searchParams
}: PlayPageProps) {
  const { chapterId, locale } = await params
  const { step } = await searchParams
  const stepNumber = parseInt(step || "1")
  // 1. ساخت کلاینت سوپابیس سمت سرور
  const supabase = await createClient()

  // 2. چک کردن یوزر (امن‌ترین روش سمت سرور)
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) {
    // اگر یوزر نبود، بفرست لاگین
    redirect(`/${locale}/login`)
  }

  // 3. لود کردن تنظیمات و فایل جیسون
  const config = getChapterConfig(chapterId)
  if (!config)
    return <div className="p-10 text-center text-red-500">فصل پیدا نشد 🚫</div>

  const allUnits = await loadLessonData(chapterId)
  if (!allUnits)
    return (
      <div className="p-10 text-center text-red-500">محتوا بارگذاری نشد 🚫</div>
    )

  // 4. برش زدن چانک‌ها (Slicing)
  const CHUNKS_PER_STEP = 5
  const startIndex = (stepNumber - 1) * CHUNKS_PER_STEP
  const endIndex = startIndex + CHUNKS_PER_STEP

  const stepUnits = allUnits.slice(startIndex, endIndex)

  if (stepUnits.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <div className="mb-4 text-xl font-bold text-gray-700">
          🎉 تبریک! این فصل تمام شد.
        </div>
        <a
          href={`/${locale}/lesson/${chapterId}`}
          className="rounded-xl bg-blue-600 px-6 py-2 text-white"
        >
          بازگشت به نقشه
        </a>
      </div>
    )
  }

  // 5. رندر پلیر
  return (
    <LessonPlayer
      units={stepUnits}
      chapterId={chapterId}
      stepNumber={stepNumber}
      userId={user.id}
      locale={locale}
    />
  )
}
