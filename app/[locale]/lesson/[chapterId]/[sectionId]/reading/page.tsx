"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  IconArrowRight,
  IconCheck,
  IconX,
  IconBook,
  IconBulb
} from "@tabler/icons-react"
import { createClient } from "@/lib/supabase/client"

import { findLessonByParams } from "@/lib/lessons/config"
import { getLessonContent } from "@/lib/lessons/content"
import { upsertActivityProgress } from "@/lib/progress/api"
import type { ActivityId } from "@/lib/lessons/types"

// --- کامپوننت‌های متریال ---
import { MaterialCard, colorThemes } from "@/components/material/MaterialUI"

const ACTIVITY_ID: ActivityId = "reading"
const THEME = colorThemes.blue // تم آبی برای مطالعه

const supabase = createClient()

export default function ReadingPage() {
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
        data: { user }
      } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)
    }
    loadUser()
  }, [])

  if (!lessonConfig || !content || content.readingQuestions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-500">
        محتوای مطالعه برای این بخش یافت نشد.
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
    if (answers[currentQuestion.id] !== undefined) return

    const newAnswers = { ...answers, [currentQuestion.id]: optionIndex }
    setAnswers(newAnswers)

    if (userId) {
      const newProgress = Math.round(
        (Object.keys(newAnswers).length / totalQuestions) * 100
      )
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
  }

  const selectedIndex = answers[currentQuestion.id]
  const isAnswered = selectedIndex !== undefined
  const isCorrect = isAnswered && selectedIndex === currentQuestion.correctIndex
  const isLastQuestion = currentIndex === totalQuestions - 1

  return (
    <div dir="rtl" className="min-h-screen bg-gray-100 py-8 pb-20">
      <div className="mx-auto w-full max-w-3xl px-4 md:px-8">
        {/* هدر صفحه */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-gray-600 shadow-sm transition-colors hover:text-blue-600 hover:shadow-md"
          >
            <IconArrowRight size={18} />
            <span className="text-sm font-bold">بازگشت</span>
          </button>

          <div className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-blue-600">
            <IconBook size={20} />
            <span className="text-sm font-bold">بخش مطالعه</span>
          </div>
        </div>

        {/* نوار پیشرفت */}
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-xs font-bold text-gray-500">
            <span>پیشرفت شما</span>
            <span>{progressPercent}٪</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* کارت سوال */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <MaterialCard className="relative overflow-hidden p-6 md:p-8">
              {/* شمارنده سوال */}
              <div className="absolute left-0 top-0 rounded-br-2xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600 shadow-inner">
                سوال {currentIndex + 1} از {totalQuestions}
              </div>

              <h2 className="mb-8 mt-6 text-xl font-bold leading-relaxed text-gray-800 md:text-2xl">
                {currentQuestion.question}
              </h2>

              {/* گزینه‌ها */}
              <div className="space-y-3">
                {currentQuestion.options.map((opt, idx) => {
                  const isSelected = selectedIndex === idx
                  const isRightOption = idx === currentQuestion.correctIndex

                  // تعیین استایل دکمه بر اساس وضعیت پاسخ
                  let statusClass =
                    "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                  let icon = null

                  if (isAnswered) {
                    if (isSelected && isRightOption) {
                      statusClass =
                        "border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500"
                      icon = <IconCheck className="text-green-600" />
                    } else if (isSelected && !isRightOption) {
                      statusClass =
                        "border-red-500 bg-red-50 text-red-700 ring-1 ring-red-500"
                      icon = <IconX className="text-red-600" />
                    } else if (!isSelected && isRightOption) {
                      statusClass =
                        "border-green-500 bg-green-50 text-green-700 opacity-70" // گزینه صحیح که انتخاب نشده
                      icon = <IconCheck className="text-green-600" />
                    } else {
                      statusClass = "opacity-50 border-gray-100 bg-gray-50" // گزینه‌های غلط دیگر
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

              {/* باکس توضیحات (بعد از پاسخ) */}
              <AnimatePresence>
                {isAnswered && currentQuestion.explanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4"
                  >
                    <div className="flex items-start gap-3 text-blue-800">
                      <IconBulb className="mt-0.5 shrink-0" />
                      <div>
                        <span className="mb-1 block font-bold">
                          نکته آموزشی:
                        </span>
                        <p className="text-sm leading-relaxed opacity-90">
                          {currentQuestion.explanation}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* دکمه بعدی */}
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 flex justify-end"
                >
                  <button
                    onClick={() => {
                      if (isLastQuestion) {
                        router.push(
                          `/${locale}/lesson/${params.chapterId}/${params.sectionId}`
                        )
                      } else {
                        setCurrentIndex(prev => prev + 1)
                      }
                    }}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700"
                  >
                    {isLastQuestion ? "پایان و بازگشت" : "سوال بعدی"}
                    <IconArrowRight size={20} className="rotate-180" />{" "}
                    {/* آیکون فلش برعکس برای دکمه بعدی */}
                  </button>
                </motion.div>
              )}
            </MaterialCard>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
