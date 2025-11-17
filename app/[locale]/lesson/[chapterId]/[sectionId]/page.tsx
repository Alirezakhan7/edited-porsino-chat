"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import {
  IconBook,
  IconCards,
  IconCertificate,
  IconClock,
  IconArrowLeft, // تغییر جهت فلش برای فارسی
  IconLock,
  IconCheck,
  IconStar,
  IconBulb // برای باکس راهنما
} from "@tabler/icons-react"

import { createClient } from "@/lib/supabase/client"
import { findLessonByParams } from "@/lib/lessons/config"
import type { ActivityId, LessonActivityConfig } from "@/lib/lessons/types"
import { getLessonProgress, type ActivityProgressMap } from "@/lib/progress/api"

// --- ایمپورت کامپوننت‌های دیزاین سیستم شما ---
import {
  MaterialCard,
  IconWrapper,
  colorThemes,
  type ColorKey
} from "@/components/material/MaterialUI"

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

const supabase = createClient()

// -------------------- صفحه گفتار --------------------

export default function LessonPage() {
  const router = useRouter()
  const params = useParams<{
    locale: string
    chapterId: string
    sectionId: string
  }>()

  const locale = params.locale ?? "fa"
  const [loadingProgress, setLoadingProgress] = useState<boolean>(true)
  const [activityProgress, setActivityProgress] = useState<ActivityProgressMap>(
    {
      reading: 0,
      flashcard: 0,
      exam: 0,
      "speed-test": 0
    }
  )

  // پیدا کردن درس از روی chapter/section
  const lessonConfig = useMemo(() => {
    const chapterId = String(params.chapterId)
    const sectionId = String(params.sectionId)
    return findLessonByParams(chapterId, sectionId)
  }, [params.chapterId, params.sectionId])

  // گرفتن یوزر + progress
  useEffect(() => {
    if (!lessonConfig) {
      setLoadingProgress(false)
      return
    }

    let cancelled = false
    const currentLesson = lessonConfig

    async function load() {
      try {
        setLoadingProgress(true)
        const {
          data: { user }
        } = await supabase.auth.getUser()

        if (!user || cancelled) {
          setLoadingProgress(false)
          return
        }

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

      if (activity.id === "exam" || activity.id === "speed-test") {
        const readingProgress = activityProgress.reading ?? 0
        const flashcardProgress = activityProgress.flashcard ?? 0
        isLocked =
          readingProgress < UNLOCK_THRESHOLD ||
          flashcardProgress < UNLOCK_THRESHOLD
      }

      return { ...activity, progress, isLocked }
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

  // --- هلپر برای رنگ‌بندی فعالیت‌ها ---
  const getActivityColor = (id: string): ColorKey => {
    switch (id) {
      case "reading":
        return "blue"
      case "flashcard":
        return "purple"
      case "exam":
        return "pink"
      case "speed-test":
        return "emerald"
      default:
        return "blue"
    }
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

  // --- هندلر کلیک ---
  const handleActivityClick = (activity: ActivityView) => {
    if (activity.isLocked) return
    router.push(
      `/${locale}/lesson/${params.chapterId}/${params.sectionId}/${activity.id}`
    )
  }

  if (!lessonData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gray-100 text-gray-500">
        این درس پیدا نشد.
      </div>
    )
  }

  return (
    // پس‌زمینه روشن و استایل کلی مشابه صفحه Path
    <div dir="rtl" className="min-h-screen bg-gray-100 py-8 pb-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 md:px-8 lg:flex-row">
        {/* ستون اصلی (راست) - لیست فعالیت‌ها */}
        <div className="flex-1 space-y-6">
          {/* هدر درس */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <MaterialCard className="relative overflow-hidden p-6 md:p-8">
              {/* نوار رنگی بالای کارت */}
              <div className="absolute right-0 top-0 h-2 w-full bg-gradient-to-r from-blue-500 to-purple-500" />

              <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                      زیست دهم
                    </span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                      فصل ۱
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
                    {lessonData.title}
                  </h1>
                </div>

                {/* بج پیشرفت */}
                <div className="flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 px-4 py-2 text-green-700">
                  <IconStar className="size-5 fill-green-500 text-green-500" />
                  <span className="font-bold">
                    ٪{lessonData.totalProgress} تکمیل شده
                  </span>
                </div>
              </div>

              <p className="leading-relaxed text-gray-600">
                {lessonData.description}
              </p>

              {/* نوار پیشرفت کلی */}
              <div className="mt-6">
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
                    style={{ width: `${lessonData.totalProgress}%` }}
                  />
                </div>
              </div>
            </MaterialCard>
          </motion.div>

          {/* کارت‌های فعالیت‌ها */}
          <div className="grid gap-5 md:grid-cols-2">
            {lessonData.activities.map((activity, index) => {
              const Icon = getActivityIcon(activity.id)
              const colorKey = getActivityColor(activity.id)
              const theme = colorThemes[colorKey]
              const isLocked = activity.isLocked

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <MaterialCard
                    onClick={() => handleActivityClick(activity)}
                    className={`
                      relative h-full border border-transparent p-5 transition-all
                      ${
                        isLocked
                          ? "cursor-not-allowed bg-gray-50 opacity-60 grayscale"
                          : "cursor-pointer hover:border-blue-200 hover:shadow-xl"
                      }
                    `}
                  >
                    {/* نمایش قفل */}
                    {isLocked && (
                      <div className="absolute left-4 top-4 rounded-lg bg-gray-200 p-1.5 text-gray-500">
                        <IconLock size={18} />
                      </div>
                    )}

                    {/* محتوا */}
                    <div className="flex items-start gap-4">
                      {/* آیکون با استایل MaterialUI */}
                      <div className={isLocked ? "opacity-50" : ""}>
                        <IconWrapper icon={Icon} color={colorKey} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="mb-1 text-lg font-bold text-gray-900">
                          {activity.title}
                        </h3>
                        <p className="mb-3 line-clamp-2 text-sm text-gray-500">
                          {activity.description}
                        </p>

                        {/* وضعیت پیشرفت */}
                        <div className="flex items-center justify-end text-xs">
                          {activity.progress === 100 ? (
                            <span className="flex items-center gap-1 font-bold text-green-600">
                              تکمیل
                              <IconCheck size={16} />
                            </span>
                          ) : (
                            <span className={`${theme.text} font-bold`}>
                              {activity.progress}٪ پیشرفت
                            </span>
                          )}
                        </div>

                        {/* نوار پیشرفت کوچک */}
                        <div
                          className={`mt-2 h-1.5 w-full rounded-full ${theme.light}`}
                        >
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${theme.gradient}`}
                            style={{ width: `${activity.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </MaterialCard>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* ستون کناری (چپ) - راهنما */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full space-y-6 lg:w-80"
        >
          <MaterialCard className="border border-yellow-100 bg-gradient-to-br from-yellow-50 to-orange-50 p-6">
            <div className="mb-4 flex items-center gap-2 text-yellow-700">
              <IconBulb size={24} className="fill-yellow-400 text-yellow-600" />
              <h3 className="text-lg font-bold">مسیر پیشنهادی</h3>
            </div>

            <ul className="relative space-y-4">
              {/* خط اتصال */}
              <div className="absolute inset-y-2 right-[7px] w-0.5 bg-yellow-200/50" />

              <li className="relative flex items-start gap-3 pr-4">
                <span className="absolute right-0 top-1.5 z-10 size-3.5 rounded-full border-2 border-white bg-blue-400 shadow-sm" />
                <p className="text-sm leading-relaxed text-gray-700">
                  ابتدا <span className="font-bold text-blue-600">مطالعه</span>{" "}
                  را کامل کن تا مفاهیم را یاد بگیری.
                </p>
              </li>
              <li className="relative flex items-start gap-3 pr-4">
                <span className="absolute right-0 top-1.5 z-10 size-3.5 rounded-full border-2 border-white bg-purple-400 shadow-sm" />
                <p className="text-sm leading-relaxed text-gray-700">
                  با <span className="font-bold text-purple-600">فلش‌کارت</span>{" "}
                  مرور کن تا فراموش نکنی.
                </p>
              </li>
              <li className="relative flex items-start gap-3 pr-4">
                <span className="absolute right-0 top-1.5 z-10 size-3.5 rounded-full border-2 border-white bg-pink-400 shadow-sm" />
                <p className="text-sm leading-relaxed text-gray-700">
                  در <span className="font-bold text-pink-600">امتحان</span>{" "}
                  شرکت کن تا قفل مرحله بعد باز شود.
                </p>
              </li>
            </ul>
          </MaterialCard>

          <div className="text-center text-xs text-gray-400">
            پیشرفت شما به صورت خودکار ذخیره می‌شود
          </div>
        </motion.div>
        <div className="h-20 w-full shrink-0 md:hidden" />
      </div>
    </div>
  )
}
