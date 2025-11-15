"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import { IconArrowRight, IconCheck } from "@tabler/icons-react"
import { createClient } from "@supabase/supabase-js"

import { findLessonByParams } from "@/lib/lessons/config"
import { getLessonContent } from "@/lib/lessons/content"
import { upsertActivityProgress } from "@/lib/progress/api"
import type { ActivityId } from "@/lib/lessons/types"

const ACTIVITY_ID: ActivityId = "reading"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function ReadingPage() {
  const router = useRouter()
  const params = useParams<{ chapterId: string; sectionId: string }>()

  const [userId, setUserId] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [lastAnsweredId, setLastAnsweredId] = useState<string | null>(null)

  const lessonConfig = useMemo(() => {
    return findLessonByParams(
      String(params.chapterId),
      String(params.sectionId)
    )
  }, [params.chapterId, params.sectionId])

  const content = useMemo(() => {
    if (!lessonConfig) return null
    return getLessonContent(lessonConfig.lessonKey)
  }, [lessonConfig])

  // گرفتن یوزر
  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
        error
      } = await supabase.auth.getUser()
      console.log("SUPABASE USER =>", user, "ERROR =>", error)
      if (error) {
        console.error("[ReadingPage] getUser error:", error)
      }

      setUserId(user?.id ?? null)
    }

    loadUser()
  }, [])

  if (!lessonConfig || !content || content.readingQuestions.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-slate-300">
          برای این گفتار هنوز سؤال‌های بخش مطالعه ثبت نشده است.
        </p>
      </div>
    )
  }

  const questions = content.readingQuestions
  const totalQuestions = questions.length
  const currentQuestion = questions[currentIndex]

  const answeredCount = Object.keys(answers).length
  const progressPercent =
    totalQuestions === 0
      ? 0
      : Math.round((answeredCount / totalQuestions) * 100)

  const handleAnswer = async (optionIndex: number) => {
    // اگر قبلاً برای این سؤال جوابی ثبت شده، هیچی نکن
    if (answers[currentQuestion.id] !== undefined) {
      return
    }

    const newAnswers = {
      ...answers,
      [currentQuestion.id]: optionIndex
    }
    setAnswers(newAnswers)
    setLastAnsweredId(currentQuestion.id)

    // اگر کاربر لاگین است، پیشرفت را در دیتابیس هم ذخیره کن
    if (userId) {
      const newAnsweredCount = Object.keys(newAnswers).length
      const newProgress =
        totalQuestions === 0
          ? 0
          : Math.round((newAnsweredCount / totalQuestions) * 100)

      try {
        setSaving(true)
        await upsertActivityProgress(supabase, {
          userId,
          lessonKey: lessonConfig.lessonKey,
          activityId: ACTIVITY_ID,
          progress: newProgress
        })
      } catch (e) {
        console.error("[ReadingPage] upsertActivityProgress error:", e)
      } finally {
        setSaving(false)
      }
    }
  }

  const isLastQuestion = currentIndex === totalQuestions - 1
  const selectedIndex = answers[currentQuestion.id]
  const isAnswered = selectedIndex !== undefined
  const isCorrect =
    selectedIndex !== undefined &&
    selectedIndex === currentQuestion.correctIndex

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 md:py-10">
        {/* دکمه بازگشت */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() =>
              router.push(`/lesson/${params.chapterId}/${params.sectionId}`)
            }
            className="inline-flex items-center gap-1 rounded-full bg-slate-900/70 px-3 py-1 text-xs text-slate-200 ring-1 ring-slate-700 hover:bg-slate-800"
          >
            <IconArrowRight className="size-4" />
            بازگشت به صفحه گفتار
          </button>
          <span className="text-[11px] text-slate-400">
            گفتار: {lessonConfig.title}
          </span>
        </div>

        {/* کارت سؤال و نوار پیشرفت */}
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-3xl bg-slate-900/70 p-5 shadow-xl ring-1 ring-white/5 backdrop-blur"
        >
          {/* پیشرفت */}
          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
              <span>پیشرفت مطالعه (reading)</span>
              <span className="font-semibold text-emerald-300">
                {progressPercent}٪
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            {saving && (
              <p className="mt-1 text-[11px] text-slate-400">
                در حال ذخیره‌سازی پیشرفت...
              </p>
            )}
          </div>

          {/* متن سؤال */}
          <h1 className="mb-4 text-base font-semibold text-slate-50">
            {currentQuestion.question}
          </h1>

          {/* گزینه‌ها */}
          <div className="space-y-2">
            {currentQuestion.options.map((opt, idx) => {
              const isSelected = selectedIndex === idx
              const isRightOption = idx === currentQuestion.correctIndex

              let optionClasses =
                "w-full rounded-xl border px-3 py-2 text-right text-sm transition-all"

              if (isSelected) {
                optionClasses += isCorrect
                  ? " border-emerald-500 bg-emerald-500/10"
                  : " border-rose-500 bg-rose-500/10"
              } else {
                optionClasses +=
                  " border-slate-700 bg-slate-900/60 hover:bg-slate-800"
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={isAnswered}
                  className={optionClasses}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>{opt}</span>
                    {isSelected && (
                      <IconCheck
                        className={`size-4 ${
                          isCorrect ? "text-emerald-400" : "text-rose-400"
                        }`}
                      />
                    )}
                    {!isSelected &&
                      isRightOption &&
                      lastAnsweredId === currentQuestion.id && (
                        <span className="text-[10px] text-emerald-300">
                          گزینه صحیح
                        </span>
                      )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* توضیح بعد از پاسخ */}
          {selectedIndex !== undefined && currentQuestion.explanation && (
            <div className="mt-4 rounded-2xl bg-slate-800/80 p-3 text-xs text-slate-200">
              <p className="mb-1 font-semibold">
                {isCorrect ? "✅ درست گفتی!" : "ℹ توضیح:"}
              </p>
              <p>{currentQuestion.explanation}</p>
            </div>
          )}

          {/* وضعیت سؤال و ناوبری ساده */}
          <div className="mt-5 flex items-center justify-between text-xs text-slate-300">
            <span>
              سؤال {currentIndex + 1} از {totalQuestions}
            </span>

            <div className="flex items-center gap-2">
              {!isLastQuestion && (
                <button
                  onClick={() => setCurrentIndex(i => i + 1)}
                  className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500"
                >
                  سؤال بعدی
                </button>
              )}

              {isLastQuestion && (
                <button
                  onClick={() =>
                    router.push(
                      `/lesson/${params.chapterId}/${params.sectionId}`
                    )
                  }
                  className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500"
                >
                  تمام! برگرد به صفحه گفتار
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
