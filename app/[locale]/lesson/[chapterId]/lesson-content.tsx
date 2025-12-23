// app/[locale]/lesson/[chapterId]/lesson-content.tsx

import { createClient } from "@/lib/supabase/server"
import LessonMap from "@/components/lessons/LessonMap"
import { IconChevronRight, IconMap2, IconInfoCircle } from "@tabler/icons-react"
import { MaterialCard } from "@/components/material/MaterialUI"
import { redirect } from "next/navigation"

// 1. تعریف دقیق تایپ‌ها
interface ChapterConfig {
  title: string
  grade: string
  totalSteps: number
  themeColor?: string // این اختیاری است
  sections: any[]
}

interface LessonContentProps {
  chapterId: string
  locale: string
  config: ChapterConfig
}

export default async function LessonContent({
  chapterId,
  locale,
  config
}: LessonContentProps) {
  const supabase = await createClient()

  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect(`/${locale}/login`)
  }

  // FIX 1: حل مشکل never با استفاده از select صریح و کست کردن (Type Casting)
  // ما نتیجه را در یک متغیر خام می‌ریزیم و پایین‌تر تایپش را مشخص می‌کنیم
  const { data: rawProgress, error: progressError } = await supabase
    .from("user_progress")
    .select("completed_steps")
    .eq("user_id", user.id)
    .eq("chapter_id", chapterId)
    .maybeSingle()

  if (progressError) {
    console.error("Error fetching progress:", progressError)
  }

  // FIX 1 (ادامه): اینجا به تایپ‌اسکریپت می‌گوییم این دیتا چه شکلی است
  const progress = rawProgress as { completed_steps: number } | null

  // محاسبات
  const completedSteps = progress?.completed_steps ?? 0
  const progressPercent = Math.round((completedSteps / config.totalSteps) * 100)

  // FIX 2: حل مشکل undefined با تعیین مقدار پیش‌فرض قطعی
  // اگر تم‌کالر نبود، حتما این استرینگ جایگزین شود
  const themeGradient = config.themeColor || "from-blue-500 to-indigo-500"

  return (
    <>
      {/* --- هدر شناور (فقط موبایل) --- */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-6 md:hidden">
        <div className="pointer-events-auto w-full max-w-md">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/40 bg-white/70 p-3 pr-4 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 dark:shadow-black/20">
            <div
              className={`absolute -right-6 -top-6 size-24 rounded-full bg-gradient-to-br ${themeGradient} opacity-20 blur-2xl`}
            />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <a
                  href={`/${locale}/path`}
                  className="group flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white/50 text-slate-500 transition-all hover:bg-white hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <IconChevronRight size={20} />
                </a>

                <div className="flex flex-col">
                  <h1 className="line-clamp-1 text-sm font-black text-slate-800 dark:text-white">
                    {config.title}
                  </h1>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span
                      className={`size-2 rounded-full bg-gradient-to-r ${themeGradient} animate-pulse`}
                    />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      پایه {config.grade} • {completedSteps} از{" "}
                      {config.totalSteps} پله
                    </span>
                  </div>
                </div>
              </div>

              {/* رینگ پیشرفت (موبایل) */}
              <div className="pl-1">
                <div className="relative flex size-10 items-center justify-center rounded-full border border-slate-100 bg-slate-50 shadow-inner dark:border-slate-700 dark:bg-slate-800">
                  <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200 dark:text-slate-700"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className="text-emerald-500 drop-shadow-sm transition-all duration-1000 ease-out"
                      strokeDasharray={`${progressPercent}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="url(#progressGradientMobile)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient
                        id="progressGradientMobile"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-700 dark:text-slate-300">
                    {progressPercent}
                    <span className="text-[8px]">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- چیدمان دسکتاپ --- */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <aside className="hidden space-y-6 lg:sticky lg:top-24 lg:col-span-4 lg:block lg:h-fit">
          <a
            href={`/${locale}/path`}
            className="mb-2 inline-flex items-center gap-2 font-bold text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            <IconChevronRight size={20} />
            بازگشت به لیست فصول
          </a>

          <MaterialCard className="relative overflow-hidden p-8" elevation={2}>
            <div
              className={`absolute left-0 top-0 h-2 w-full bg-gradient-to-r ${themeGradient}`}
            />
            <div
              className={`absolute -bottom-10 -right-10 size-40 rounded-full bg-gradient-to-br ${themeGradient} opacity-10 blur-3xl`}
            />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div
                className={`mb-4 rounded-2xl bg-gradient-to-br ${themeGradient} p-4 text-white shadow-lg`}
              >
                <IconMap2 size={32} />
              </div>
              <h1 className="mb-2 text-2xl font-black text-slate-900 dark:text-white">
                {config.title}
              </h1>
              <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                پایه {config.grade}
              </span>
              <div className="my-6 h-px w-full bg-slate-100 dark:bg-slate-800" />
              <div className="flex w-full items-center justify-between px-2">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-800 dark:text-white">
                    {config.totalSteps}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    کل مراحل
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-emerald-500">
                    {completedSteps}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    تکمیل شده
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-blue-500">
                    {progressPercent}٪
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    پیشرفت
                  </span>
                </div>
              </div>
            </div>
          </MaterialCard>

          <MaterialCard className="flex items-start gap-4 border-blue-100 bg-blue-50/50 p-5 dark:border-blue-800/30 dark:bg-blue-900/10">
            <IconInfoCircle className="shrink-0 text-blue-500" size={24} />
            <div>
              <h3 className="mb-1 text-sm font-bold text-blue-700 dark:text-blue-300">
                مسیر یادگیری
              </h3>
              <p className="text-xs leading-relaxed text-blue-600/80 dark:text-blue-400/80">
                با کلیک روی هر مرحله، وارد درس مربوطه می‌شوید. مراحل قفل شده پس
                از تکمیل مراحل قبلی باز می‌شوند.
              </p>
            </div>
          </MaterialCard>
        </aside>

        <section className="pb-32 pt-20 lg:col-span-8 lg:pt-0">
          <div className="relative w-full">
            {/* FIX 2: استفاده از themeGradient که مطمئنیم string است */}
            <LessonMap
              chapterId={chapterId}
              totalSteps={config.totalSteps}
              completedSteps={completedSteps}
              themeColor={themeGradient}
              locale={locale}
              sections={config.sections}
            />
          </div>
        </section>
      </div>
    </>
  )
}
