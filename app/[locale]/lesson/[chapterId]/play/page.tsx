import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { loadLessonData } from "@/lib/lessons/loader"
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

  // 1. تعیین شماره مرحله (اگر نبود پیش‌فرض ۱)
  const stepNumber = parseInt(step || "1")

  // 2. ساخت کلاینت سوپابیس
  const supabase = await createClient()

  // 3. چک کردن یوزر
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect(`/${locale}/login`)
  }

  // 4. لود کردن کل محتوای فصل
  // این تابع همه آیتم‌های فصل (مثلاً ۲۳ تا) را می‌آورد
  const allUnits = await loadLessonData(chapterId)

  if (!allUnits || allUnits.length === 0) {
    return (
      <div className="p-10 text-center font-bold text-red-500">
        محتوا بارگذاری نشد یا فصل خالی است 🚫
      </div>
    )
  }

  // 5. ✅ منطق جدید: انتخاب دقیقاً ۱ درس برای این مرحله
  // چون آرایه از ۰ شروع می‌شود ولی step از ۱، یکی کم می‌کنیم
  const unitIndex = stepNumber - 1

  // اگر مرحله‌ای که کاربر خواسته وجود ندارد (مثلاً مرحله ۳۰ در فصلی که ۲۰ درس دارد)
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

  // انتخاب همان تک درس خاص
  const targetUnit = allUnits[unitIndex]

  // 6. رندر پلیر
  return (
    <LessonPlayer
      // ⚠️ نکته مهم: LessonPlayer لیست می‌خواهد، پس این تک آیتم را در آرایه می‌گذاریم
      units={[targetUnit]}
      chapterId={chapterId}
      stepNumber={stepNumber}
      userId={user.id}
      locale={locale}
    />
  )
}
