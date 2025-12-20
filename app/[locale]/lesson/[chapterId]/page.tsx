import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getChapterConfig } from "@/lib/lessons/config"
import LessonMap from "@/components/lessons/LessonMap"
import {
  IconChevronRight,
  IconMap2,
  IconTrophy,
  IconInfoCircle
} from "@tabler/icons-react"
import { MaterialCard } from "@/components/material/MaterialUI" // اطمینان از مسیر ایمپورت

interface PageProps {
  params: Promise<{
    chapterId: string
    locale: string
  }>
}

export default async function MapPage({ params }: PageProps) {
  const { chapterId, locale } = await params

  // دریافت کانفیگ فصل
  const config = getChapterConfig(chapterId)

  if (!config) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-3xl font-black text-slate-800 dark:text-white">
          فصل پیدا نشد 🚫
        </h1>
        <a href={`/${locale}/path`} className="text-blue-500 hover:underline">
          بازگشت به مسیر
        </a>
      </div>
    )
  }

  // اتصال به دیتابیس
  const supabase = await createClient()
  const db = supabase.schema("public")

  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect(`/${locale}/login`)
  }

  // دریافت پیشرفت کاربر
  const { data: progress, error: progressError } = await db
    .from("user_progress")
    .select("completed_steps")
    .eq("user_id", user.id)
    .eq("chapter_id", chapterId)
    .maybeSingle()

  if (progressError) {
    console.error("Error fetching progress:", progressError)
  }

  const completedSteps = progress?.completed_steps ?? 0
  const progressPercent = Math.round((completedSteps / config.totalSteps) * 100)

  // استخراج رنگ تم برای استفاده در UI
  // فرض بر این است که config.themeColor رشته‌ای مثل "from-blue-500 to-indigo-500" است
  const themeGradient = config.themeColor || "from-blue-500 to-indigo-500"

  return (
    <div
      className="bg-background text-foreground relative min-h-screen w-full font-sans transition-colors duration-500"
      dir="rtl"
    >
      {/* --- پس‌زمینه هوشمند (مشترک با سایر صفحات) --- */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div
          className={`absolute -left-[10%] -top-[10%] size-[600px] rounded-full bg-gradient-to-br opacity-20 blur-[130px] ${themeGradient} animate-pulse`}
        />
        <div className="absolute -bottom-[10%] right-[10%] size-[500px] rounded-full bg-purple-400/10 blur-[100px] dark:bg-purple-900/5" />
        <div className="bg-grid-black/[0.02] dark:bg-grid-white/[0.02] absolute inset-0" />
      </div>

      <main className="container mx-auto max-w-7xl px-4 py-6 md:py-12">
        {/* --- هدر شناور (فقط موبایل) --- */}
        <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-6 md:hidden">
          <div className="pointer-events-auto w-full max-w-md">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/40 bg-white/70 p-3 pr-4 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 dark:shadow-black/20">
              {/* افکت نورانی پس‌زمینه هدر */}
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

        {/* --- چیدمان دسکتاپ (Grid System) --- */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* سایدبار اطلاعات (فقط دسکتاپ) */}
          <aside className="hidden space-y-6 lg:sticky lg:top-24 lg:col-span-4 lg:block lg:h-fit">
            {/* دکمه بازگشت */}
            <a
              href={`/${locale}/path`}
              className="mb-2 inline-flex items-center gap-2 font-bold text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            >
              <IconChevronRight size={20} />
              بازگشت به لیست فصول
            </a>

            {/* کارت اصلی اطلاعات فصل */}
            <MaterialCard
              className="relative overflow-hidden p-8"
              elevation={2}
            >
              {/* پس‌زمینه رنگی محو */}
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

            {/* کارت راهنما */}
            <MaterialCard className="flex items-start gap-4 border-blue-100 bg-blue-50/50 p-5 dark:border-blue-800/30 dark:bg-blue-900/10">
              <IconInfoCircle className="shrink-0 text-blue-500" size={24} />
              <div>
                <h3 className="mb-1 text-sm font-bold text-blue-700 dark:text-blue-300">
                  مسیر یادگیری
                </h3>
                <p className="text-xs leading-relaxed text-blue-600/80 dark:text-blue-400/80">
                  با کلیک روی هر مرحله، وارد درس مربوطه می‌شوید. مراحل قفل شده
                  پس از تکمیل مراحل قبلی باز می‌شوند.
                </p>
              </div>
            </MaterialCard>
          </aside>

          {/* محتوای اصلی (نقشه) */}
          <section className="pb-32 pt-20 lg:col-span-8 lg:pt-0">
            {/* این بخش کامپوننت نقشه شما را رندر می‌کند */}
            <div className="relative w-full">
              <LessonMap
                chapterId={chapterId}
                totalSteps={config.totalSteps}
                completedSteps={completedSteps}
                themeColor={config.themeColor}
                locale={locale}
                sections={config.sections}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
