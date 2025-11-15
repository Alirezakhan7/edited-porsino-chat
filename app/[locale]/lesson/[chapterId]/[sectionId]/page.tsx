"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import {
  IconBook,
  IconCards,
  IconCertificate,
  IconClock,
  IconArrowRight,
  IconLock,
  IconCheck,
  IconStar
} from "@tabler/icons-react"

import { createClient, SupabaseClient } from "@supabase/supabase-js"

import { findLessonByParams } from "@/lib/lessons/config"
import type { ActivityId, LessonActivityConfig } from "@/lib/lessons/types"
import { getLessonProgress, type ActivityProgressMap } from "@/lib/progress/api"

// -------------------- انواع نمایشی --------------------

type ActivityView = LessonActivityConfig & {
  progress: number
  isLocked: boolean
}

interface LessonViewData {
  lessonKey: string
  title: string
  description: string
  totalProgress: number
  activities: ActivityView[]
}

// -------------------- Supabase --------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// -------------------- صفحه گفتار --------------------

export default function LessonPage() {
  const router = useRouter()
  const params = useParams<{
    locale: string
    chapterId: string
    sectionId: string
  }>()

  const locale = params.locale ?? "fa"

  const [userId, setUserId] = useState<string | null>(null)
  const [activityProgress, setActivityProgress] = useState<ActivityProgressMap>(
    {
      reading: 0,
      flashcard: 0,
      exam: 0,
      "speed-test": 0
    }
  )
  const [loadingProgress, setLoadingProgress] = useState<boolean>(true)

  // پیدا کردن درس از روی chapter/section
  const lessonConfig = useMemo(() => {
    const chapterId = String(params.chapterId)
    const sectionId = String(params.sectionId)
    return findLessonByParams(chapterId, sectionId)
  }, [params.chapterId, params.sectionId])

  // گرفتن یوزر + progress
  useEffect(() => {
    if (!lessonConfig) {
      setUserId(null)
      setActivityProgress({
        reading: 0,
        flashcard: 0,
        exam: 0,
        "speed-test": 0
      })
      setLoadingProgress(false)
      return
    }

    let cancelled = false
    const currentLesson = lessonConfig

    async function load() {
      try {
        setLoadingProgress(true)

        const {
          data: { user },
          error
        } = await supabase.auth.getUser()

        if (error) {
          console.error("[LessonPage] getUser error:", error)
        }

        if (!user || cancelled) {
          setUserId(null)
          setActivityProgress({
            reading: 0,
            flashcard: 0,
            exam: 0,
            "speed-test": 0
          })
          setLoadingProgress(false)
          return
        }

        setUserId(user.id)

        const activityIds = currentLesson.activities.map(a => a.id)
        const map = await getLessonProgress(
          supabase,
          currentLesson.lessonKey,
          activityIds
        )

        if (cancelled) return

        setActivityProgress(map)
        setLoadingProgress(false)
      } catch (e) {
        console.error("[LessonPage] unexpected error:", e)
        setLoadingProgress(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [lessonConfig])

  // ساخت داده نهایی برای UI
  const lessonData: LessonViewData | null = useMemo(() => {
    if (!lessonConfig) return null

    const UNLOCK_THRESHOLD = 80

    const activities: ActivityView[] = lessonConfig.activities.map(activity => {
      const progress = activityProgress[activity.id] ?? 0

      let isLocked = false

      // امتحان نهایی و تست سرعتی، تا وقتی reading و flashcard هر دو زیر ۸۰ باشن، قفل‌اند
      if (activity.id === "exam" || activity.id === "speed-test") {
        const readingProgress = activityProgress.reading ?? 0
        const flashcardProgress = activityProgress.flashcard ?? 0

        isLocked =
          readingProgress < UNLOCK_THRESHOLD ||
          flashcardProgress < UNLOCK_THRESHOLD
      }

      return {
        ...activity,
        progress,
        isLocked
      }
    })

    const totalProgress =
      activities.length === 0
        ? 0
        : Math.round(
            activities.reduce((sum, a) => sum + a.progress, 0) /
              activities.length
          )

    return {
      lessonKey: lessonConfig.lessonKey,
      title: lessonConfig.title,
      description: lessonConfig.description,
      totalProgress,
      activities
    }
  }, [lessonConfig, activityProgress])

  if (!lessonData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-slate-300">
          این درس پیدا نشد. لطفاً از منوی قبلی یک درس معتبر انتخاب کن.
        </p>
      </div>
    )
  }

  // کلیک روی کارت فعالیت
  const handleActivityClick = (activity: ActivityView) => {
    if (activity.isLocked) return

    router.push(
      `/${locale}/lesson/${params.chapterId}/${params.sectionId}/${activity.id}`
    )
  }

  const getActivityIcon = (id: ActivityId) => {
    switch (id) {
      case "reading":
        return IconBook
      case "flashcard":
        return IconCards
      case "exam":
        return IconCertificate
      case "speed-test":
        return IconClock
      default:
        return IconBook
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6 md:flex-row md:py-10">
        {/* ستون اصلی - کارت‌ها */}
        <div className="flex-1 space-y-6">
          {/* هدر درس */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-3xl bg-gradient-to-r from-sky-500/10 via-emerald-500/10 to-violet-500/10 p-6 shadow-xl ring-1 ring-white/5 backdrop-blur"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-emerald-400">
                  زیست دهم • فصل ۱
                </div>
                <h1 className="text-xl font-bold md:text-2xl">
                  {lessonData.title}
                </h1>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-slate-900/60 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/30">
                <IconStar className="size-4 text-amber-400" />
                <span>در حال یادگیری</span>
              </div>
            </div>

            <p className="text-sm text-slate-200/80 md:text-[15px]">
              {lessonData.description}
            </p>

            {/* پیشرفت کلی */}
            <div className="mx-auto mt-6 max-w-md">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">پیشرفت کلی</span>
                <span className="font-bold text-emerald-400">
                  {lessonData.totalProgress}٪
                </span>
              </div>
              <Progress value={lessonData.totalProgress} className="h-3" />
              {loadingProgress && (
                <p className="mt-2 text-xs text-slate-300/70">
                  در حال همگام‌سازی با سرور...
                </p>
              )}
            </div>
          </motion.div>

          {/* کارت‌های فعالیت‌ها */}
          <div className="grid gap-6 md:grid-cols-2">
            {lessonData.activities.map((activity, index) => {
              const Icon = getActivityIcon(activity.id)

              return (
                <motion.button
                  key={activity.id}
                  onClick={() => handleActivityClick(activity)}
                  disabled={activity.isLocked}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.25 }}
                  className={`
                    group relative flex flex-col items-start justify-between rounded-2xl 
                    bg-slate-900/60 p-4 text-right shadow-lg ring-1 ring-white/5 
                    backdrop-blur transition-all duration-200
                    hover:-translate-y-1 hover:bg-slate-900/80 hover:ring-emerald-500/40
                    ${activity.isLocked ? "opacity-60 hover:translate-y-0 hover:ring-white/5" : ""}
                  `}
                >
                  <div className="flex w-full items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`
                            inline-flex size-8 items-center justify-center rounded-xl bg-gradient-to-br ${activity.color}
                            text-lg
                          `}
                        >
                          {activity.icon}
                        </span>
                        {activity.isLocked && (
                          <span className="flex items-center gap-1 rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                            <IconLock className="size-3" />
                            قفل شده
                          </span>
                        )}
                      </div>
                      <h2 className="text-sm font-semibold text-slate-50 md:text-[15px]">
                        {activity.title}
                      </h2>
                      <p className="text-xs text-slate-300/80">
                        {activity.description}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1 text-xs text-slate-300/90">
                        {activity.progress === 100 ? (
                          <>
                            <IconCheck className="size-4 text-emerald-400" />
                            <span className="font-semibold text-emerald-300">
                              تکمیل شد
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="font-semibold">
                              {activity.progress}٪
                            </span>
                            <span className="text-[11px] text-slate-400">
                              پیشرفت
                            </span>
                          </>
                        )}
                      </div>
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`
                            h-full rounded-full bg-gradient-to-r ${activity.color}
                            transition-all duration-300
                          `}
                          style={{ width: `${activity.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex w-full items-center justify-between text-[11px] text-slate-300/80">
                    <span>
                      {activity.id === "reading" && "از اینجا شروع کن"}
                      {activity.id === "flashcard" && "برای تثبیت مفاهیم"}
                      {activity.id === "exam" && "شبیه‌ساز امتحان واقعی"}
                      {activity.id === "speed-test" && "برای چالش سرعت و دقت"}
                    </span>
                    <IconArrowRight
                      className={`
                        size-4 transition-all
                        ${activity.isLocked ? "text-slate-500" : "text-emerald-400 group-hover:translate-x-0.5"}
                      `}
                    />
                  </div>

                  <div
                    className={`
                      pointer-events-none absolute inset-x-0 bottom-0 h-0.5 
                      bg-gradient-to-r ${activity.color} opacity-70
                    `}
                  />
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* ستون راهنما */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm space-y-4 rounded-3xl bg-slate-950/70 p-5 shadow-xl ring-1 ring-white/5 backdrop-blur"
        >
          <h3 className="mb-2 text-sm font-semibold text-slate-50">
            این گفتار را چطور بخوانی؟
          </h3>
          <ul className="space-y-3 text-xs text-slate-300/90">
            <li className="flex items-start gap-2">
              <span className="mt-1 text-sky-400">•</span>
              <span>اول متن درسی را به دقت بخوان و نکات مهم را علامت بزن.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-emerald-400">•</span>
              <span>بعد با فلش‌کارت‌ها، مفاهیم کلیدی را چند بار مرور کن.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-violet-400">•</span>
              <span>
                وقتی احساس کردی مسلطی، امتحان نهایی را بده تا تسلط خودت را
                بسنجی.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-amber-400">•</span>
              <span>در نهایت با تست سرعتی، روی زمان و دقت خودت کار کن.</span>
            </li>
          </ul>

          <div className="mt-4 rounded-2xl bg-slate-900/80 p-3 text-xs text-slate-200">
            <p className="mb-1 font-semibold text-emerald-300">نکته‌ی مهم:</p>
            <p>
              درصدهای این صفحه برای هر دانش‌آموز در سرور ذخیره می‌شود و هربار
              وارد شوی، از همان‌جایی که بودی ادامه می‌دهی.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
