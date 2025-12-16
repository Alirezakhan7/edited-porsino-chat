import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getChapterConfig } from "@/lib/lessons/config"
import LessonMap from "@/components/lessons/LessonMap"
import { IconChevronRight } from "@tabler/icons-react"

interface PageProps {
  params: Promise<{
    chapterId: string
    locale: string
  }>
}

export default async function MapPage({ params }: PageProps) {
  const { chapterId, locale } = await params

  const config = getChapterConfig(chapterId)
  if (!config) {
    return (
      <div className="p-10 text-center font-bold text-red-500">
        فصل پیدا نشد 🚫
      </div>
    )
  }

  const supabase = await createClient()
  const db = supabase.schema("public")

  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect(`/${locale}/login`)
  }

  const { data: progress, error: progressError } = await db
    .from("user_progress")
    .select("completed_steps")
    .eq("user_id", user.id)
    .eq("chapter_id", chapterId)
    .maybeSingle()

  if (progressError) {
    // اگر می‌خواهی صفحه در هر صورت بالا بیاید، این را به جای throw نگه دار.
    // در حالت فعلی، خطای دیتابیس را جدی می‌گیریم:
    throw new Error(progressError.message)
  }

  const completedSteps = progress?.completed_steps ?? 0
  const progressPercent = Math.round((completedSteps / config.totalSteps) * 100)

  return (
    <div
      className="min-h-screen w-full bg-gray-50 font-sans text-gray-900 selection:bg-purple-200"
      dir="rtl"
    >
      {/* --- هدر شناور مدرن --- */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-6">
        <div className="pointer-events-auto w-full max-w-md">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/75 p-3 pr-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-2xl transition-all">
            {/* افکت درخشش رنگی در پس‌زمینه هدر */}
            <div
              className={`absolute -right-6 -top-6 size-24 rounded-full bg-gradient-to-br ${config.themeColor} opacity-20 blur-2xl`}
            />

            <div className="relative flex items-center justify-between">
              {/* سمت راست: دکمه برگشت و عنوان */}
              <div className="flex items-center gap-4">
                <a
                  href={`/${locale}/path`}
                  className="group flex size-12 items-center justify-center rounded-2xl border border-white/80 bg-white shadow-sm transition-all hover:scale-105 hover:shadow-md active:scale-95"
                >
                  <IconChevronRight
                    className="text-gray-400 transition-colors group-hover:text-gray-800"
                    size={24}
                  />
                </a>

                <div className="flex flex-col">
                  <h1 className="line-clamp-1 text-base font-black leading-tight text-gray-800">
                    {config.title}
                  </h1>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span
                      className={`size-2 rounded-full bg-gradient-to-r ${config.themeColor} animate-pulse`}
                    />
                    <span className="text-[11px] font-bold text-gray-400">
                      پایه {config.grade}
                    </span>
                  </div>
                </div>
              </div>

              {/* سمت چپ: کپسول پیشرفت */}
              <div className="flex items-center gap-3 pl-1">
                <div className="hidden text-right sm:block">
                  <div className="text-[10px] font-bold text-gray-400">
                    پیشرفت
                  </div>
                  <div className="text-xs font-black text-gray-800">
                    {progressPercent}%
                  </div>
                </div>

                {/* رینگ پیشرفت مینیاتوری */}
                <div className="relative flex size-10 items-center justify-center rounded-full border border-white/50 bg-white shadow-inner">
                  <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                    {/* پس‌زمینه رینگ */}
                    <path
                      className="text-gray-100"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    {/* نوار رنگی پیشرفت */}
                    <path
                      className={`text-emerald-500 drop-shadow-sm transition-all duration-1000 ease-out`}
                      strokeDasharray={`${progressPercent}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="url(#progressGradient)"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient
                        id="progressGradient"
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
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-600">
                    {completedSteps}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="pb-32 pt-12">
        <LessonMap
          chapterId={chapterId}
          totalSteps={config.totalSteps}
          completedSteps={completedSteps}
          themeColor={config.themeColor}
          locale={locale}
          sections={config.sections}
        />
      </main>
    </div>
  )
}
