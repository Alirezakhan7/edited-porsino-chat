"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  IconArrowRight,
  IconCheck,
  IconX,
  IconCertificate,
  IconTrophy
} from "@tabler/icons-react"

import { createClient } from "@/lib/supabase/client"
import { findLessonByParams } from "@/lib/lessons/config"
import { getLessonContent } from "@/lib/lessons/content"
import { upsertActivityProgress } from "@/lib/progress/api"
import type { ActivityId } from "@/lib/lessons/types"

// --- کامپوننت‌های متریال ---
import { MaterialCard, colorThemes } from "@/components/material/MaterialUI"

const ACTIVITY_ID: ActivityId = "exam"
// تم صورتی برای آزمون
const THEME = colorThemes.pink

const supabase = createClient()

export default function ExamPage() {
  const router = useRouter()
  const params = useParams<{
    locale: string
    chapterId: string
    sectionId: string
  }>()
  const locale = params.locale ?? "fa"

  const [userId, setUserId] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [showSummary, setShowSummary] = useState(false)

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

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)
    }
    loadUser()
  }, [])

  if (!lessonConfig || !content || content.examQuestions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-500">
        برای این گفتار هنوز سوال‌های امتحان نهایی ثبت نشده است.
      </div>
    )
  }

  const questions = content.examQuestions
  const totalQuestions = questions.length
  const currentQuestion = questions[currentIndex]

  const answeredCount = Object.keys(answers).length
  const progressPercent =
    totalQuestions === 0
      ? 0
      : Math.round((answeredCount / totalQuestions) * 100)

  const selectedIndex = answers[currentQuestion.id]
  const isAnswered = selectedIndex !== undefined
  const isLastQuestion = currentIndex === totalQuestions - 1

  // محاسبه تعداد درست‌ها برای صفحه پایان
  const correctCount = questions.reduce((sum, q) => {
    const a = answers[q.id]
    if (a === undefined) return sum
    return a === q.correctIndex ? sum + 1 : sum
  }, 0)

  const handleAnswer = async (optionIndex: number) => {
    if (answers[currentQuestion.id] !== undefined) return

    const newAnswers = { ...answers, [currentQuestion.id]: optionIndex }
    setAnswers(newAnswers)

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
        console.error(e)
      } finally {
        setSaving(false)
      }
    }

    // تاخیر کوتاه برای دیدن نتیجه قبل از رفتن به سوال بعد
    if (isLastQuestion) {
      setTimeout(() => setShowSummary(true), 800)
    } else {
      setTimeout(() => {
        setCurrentIndex(i => i + 1)
      }, 1000) // 1 ثانیه مکث برای دیدن رنگ سبز/قرمز
    }
  }

  const handleBackToLesson = () => {
    router.push(`/${locale}/lesson/${params.chapterId}/${params.sectionId}`)
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-100 py-8 pb-20">
      <div className="mx-auto w-full max-w-3xl px-4 md:px-8">
        {/* هدر صفحه */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={handleBackToLesson}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-gray-600 shadow-sm transition-colors hover:text-pink-600 hover:shadow-md"
          >
            <IconArrowRight size={18} />
            <span className="text-sm font-bold">بازگشت</span>
          </button>

          <div className="flex items-center gap-2 rounded-full bg-pink-50 px-4 py-2 text-pink-600">
            <IconCertificate size={20} />
            <span className="text-sm font-bold">امتحان نهایی</span>
          </div>
        </div>

        {/* نوار پیشرفت (فقط وقتی در حال آزمون هستیم نشان داده شود) */}
        {!showSummary && (
          <div className="mb-10">
            <div className="mb-2 flex justify-between text-xs font-bold text-gray-500">
              <span>
                سوال {currentIndex + 1} از {totalQuestions}
              </span>
              <span>{progressPercent}٪</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-pink-500 transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {showSummary ? (
            // --- صفحه نتیجه (Summary) ---
            <motion.div
              key="summary"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full"
            >
              <MaterialCard className="relative flex flex-col items-center overflow-hidden p-8 text-center md:p-12">
                {/* افکت پس‌زمینه */}
                <div className="absolute left-0 top-0 h-2 w-full bg-gradient-to-r from-pink-400 to-rose-500" />

                <div className="mb-6 flex size-24 items-center justify-center rounded-full bg-pink-100 text-pink-600 shadow-inner">
                  <IconTrophy size={48} strokeWidth={1.5} />
                </div>

                <h2 className="mb-2 text-2xl font-bold text-gray-800 md:text-3xl">
                  آزمون به پایان رسید!
                </h2>
                <p className="mb-8 text-gray-500">
                  نتیجه عملکرد شما در این گفتار
                </p>

                <div className="mb-8 w-full max-w-sm rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium text-gray-600">
                      تعداد پاسخ صحیح
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      {correctCount}
                    </span>
                  </div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium text-gray-600">
                      تعداد کل سوالات
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {totalQuestions}
                    </span>
                  </div>
                  <div className="my-3 h-px w-full bg-gray-200" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800">نمره نهایی</span>
                    <span className="text-xl font-bold text-pink-600">
                      {Math.round((correctCount / totalQuestions) * 20)}{" "}
                      <span className="text-sm font-normal text-gray-400">
                        از ۲۰
                      </span>
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleBackToLesson}
                  className="w-full max-w-xs rounded-xl bg-pink-600 px-8 py-3 font-bold text-white shadow-lg shadow-pink-200 transition-all hover:-translate-y-1 hover:bg-pink-700"
                >
                  بازگشت به درس
                </button>
              </MaterialCard>
            </motion.div>
          ) : (
            // --- کارت سوال ---
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <MaterialCard className="relative overflow-hidden p-6 md:p-8">
                {/* برچسب سوال */}
                <div className="absolute left-0 top-0 rounded-br-2xl bg-pink-50 px-4 py-2 text-sm font-bold text-pink-600 shadow-inner">
                  نمره دار
                </div>

                <h2 className="mb-8 mt-6 text-xl font-bold leading-relaxed text-gray-800 md:text-2xl">
                  {currentQuestion.question}
                </h2>

                <div className="space-y-3">
                  {currentQuestion.options.map((opt, idx) => {
                    const isSelected = selectedIndex === idx
                    const isRightOption = idx === currentQuestion.correctIndex

                    let statusClass =
                      "border-gray-200 bg-white hover:border-pink-300 hover:bg-pink-50"
                    let icon = null

                    if (isAnswered) {
                      if (isSelected && isRightOption) {
                        // انتخاب درست
                        statusClass =
                          "border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500"
                        icon = <IconCheck className="text-green-600" />
                      } else if (isSelected && !isRightOption) {
                        // انتخاب غلط
                        statusClass =
                          "border-red-500 bg-red-50 text-red-700 ring-1 ring-red-500"
                        icon = <IconX className="text-red-600" />
                      } else if (isRightOption) {
                        // گزینه صحیح (وقتی غلط زدیم نشان داده شود)
                        statusClass =
                          "border-green-500 bg-green-50 text-green-700 opacity-70"
                        icon = <IconCheck className="text-green-600" />
                      } else {
                        statusClass = "opacity-40 bg-gray-50 border-gray-100"
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(idx)}
                        disabled={isAnswered}
                        className={`
                                            group flex w-full items-center justify-between rounded-xl border-2 p-4
                                            text-right text-base transition-all duration-200
                                            ${statusClass}
                                        `}
                      >
                        <span className="font-medium">{opt}</span>
                        {icon}
                      </button>
                    )
                  })}
                </div>
              </MaterialCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
