"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  IconArrowRight,
  IconCheck,
  IconX,
  IconClock,
  IconBolt,
  IconPlayerPlay,
  IconTrophy
} from "@tabler/icons-react"

import { createClient } from "@/lib/supabase/client"
import { findLessonByParams } from "@/lib/lessons/config"
import { getLessonContent } from "@/lib/lessons/content"
import { upsertActivityProgress } from "@/lib/progress/api"
import type { ActivityId } from "@/lib/lessons/types"

// --- کامپوننت‌های متریال ---
import { MaterialCard, colorThemes } from "@/components/material/MaterialUI"

const ACTIVITY_ID: ActivityId = "speed-test"
// تم سبز برای تست سرعت
const THEME = colorThemes.emerald

const supabase = createClient()

export default function SpeedTestPage() {
  const router = useRouter()
  const params = useParams<{
    locale: string
    chapterId: string
    sectionId: string
  }>()
  const locale = params.locale ?? "fa"

  const [userId, setUserId] = useState<string | null>(null)

  // وضعیت بازی: intro (شروع)، playing (در حال بازی)، summary (پایان)
  const [gameState, setGameState] = useState<"intro" | "playing" | "summary">(
    "intro"
  )

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [saving, setSaving] = useState(false)

  // رفرنس برای تایمر
  const timerRef = useRef<NodeJS.Timeout | null>(null)

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

  // مدیریت تایمر (شمارش زمان سپری شده)
  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [gameState])

  if (!lessonConfig || !content || content.speedQuestions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-500">
        برای این گفتار هنوز تست سرعتی ثبت نشده است.
      </div>
    )
  }

  const questions = content.speedQuestions
  const totalQuestions = questions.length
  const currentQuestion = questions[currentIndex]

  const answeredCount = Object.keys(answers).length
  const progressPercent =
    totalQuestions === 0
      ? 0
      : Math.round((answeredCount / totalQuestions) * 100)

  // محاسبه تعداد پاسخ‌های صحیح
  const correctCount = questions.reduce((sum, q) => {
    const a = answers[q.id]
    if (a === undefined) return sum
    return a === q.correctIndex ? sum + 1 : sum
  }, 0)

  const startGame = () => {
    setGameState("playing")
    setElapsedSeconds(0)
    setAnswers({})
    setCurrentIndex(0)
  }

  const handleAnswer = async (optionIndex: number) => {
    // جلوگیری از پاسخ تکراری
    if (answers[currentQuestion.id] !== undefined) return

    const newAnswers = { ...answers, [currentQuestion.id]: optionIndex }
    setAnswers(newAnswers)

    const isLastQuestion = currentIndex === totalQuestions - 1

    // ذخیره پیشرفت در دیتابیس (هر بار که جوابی داده می‌شود)
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

    // رفتن به سوال بعدی با کمی تاخیر برای دیدن نتیجه
    if (isLastQuestion) {
      setTimeout(() => setGameState("summary"), 500)
    } else {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1)
      }, 500)
    }
  }

  const selectedIndex = answers[currentQuestion.id]
  const isAnswered = selectedIndex !== undefined

  return (
    <div dir="rtl" className="min-h-screen bg-gray-100 py-8 pb-20">
      <div className="mx-auto w-full max-w-3xl px-4 md:px-8">
        {/* هدر صفحه */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-gray-600 shadow-sm transition-colors hover:text-emerald-600 hover:shadow-md"
          >
            <IconArrowRight size={18} />
            <span className="text-sm font-bold">بازگشت</span>
          </button>

          <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-emerald-600">
            <IconBolt size={20} />
            <span className="text-sm font-bold">تست سرعت</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* --- حالت ۱: شروع (Intro) --- */}
          {gameState === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <MaterialCard className="flex flex-col items-center p-8 text-center md:p-12">
                <div className="mb-6 flex size-24 animate-pulse items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <IconClock size={48} strokeWidth={1.5} />
                </div>
                <h1 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">
                  تست سرعت
                </h1>
                <p className="mb-8 max-w-md leading-relaxed text-gray-500">
                  در این بخش باید سعی کنی در کمترین زمان ممکن به تمام سوالات
                  پاسخ صحیح بدهی. زمان شما ثبت خواهد شد!
                </p>
                <button
                  onClick={startGame}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-12 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:-translate-y-1 hover:bg-emerald-700"
                >
                  <IconPlayerPlay size={24} />
                  شروع تایمر
                </button>
              </MaterialCard>
            </motion.div>
          )}

          {/* --- حالت ۲: در حال بازی (Playing) --- */}
          {gameState === "playing" && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full"
            >
              {/* اطلاعات بالا: تایمر و پیشرفت */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-1 font-mono text-lg font-bold text-emerald-700">
                  <IconClock size={20} />
                  <span>
                    {Math.floor(elapsedSeconds / 60)
                      .toString()
                      .padStart(2, "0")}
                    :{(elapsedSeconds % 60).toString().padStart(2, "0")}
                  </span>
                </div>

                <div className="text-xs font-bold text-gray-500">
                  سوال {currentIndex + 1} از {totalQuestions}
                </div>
              </div>

              {/* نوار پیشرفت */}
              <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <MaterialCard className="relative overflow-hidden p-6 md:p-8">
                {/* برچسب سوال */}
                <div className="absolute left-0 top-0 rounded-br-2xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-600 shadow-inner">
                  سرعتی
                </div>

                <h2 className="mb-8 mt-6 text-xl font-bold leading-relaxed text-gray-800 md:text-2xl">
                  {currentQuestion.question}
                </h2>

                <div className="space-y-3">
                  {currentQuestion.options.map((opt, idx) => {
                    const isSelected = selectedIndex === idx
                    const isCorrect = idx === currentQuestion.correctIndex

                    let statusClass =
                      "border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50"
                    let icon = null

                    if (isAnswered) {
                      if (isSelected && isCorrect) {
                        // انتخاب درست
                        statusClass =
                          "border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500"
                        icon = <IconCheck className="text-emerald-600" />
                      } else if (isSelected && !isCorrect) {
                        // انتخاب غلط
                        statusClass =
                          "border-red-500 bg-red-50 text-red-700 ring-1 ring-red-500"
                        icon = <IconX className="text-red-600" />
                      } else if (isCorrect) {
                        // گزینه صحیح (وقتی غلط زدیم) - اختیاری: می‌توانید این را حذف کنید اگر می‌خواهید سخت‌تر باشد
                        statusClass =
                          "border-emerald-500 bg-emerald-50 text-emerald-700 opacity-70"
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
                                        text-right text-base transition-all duration-150
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

          {/* --- حالت ۳: پایان (Summary) --- */}
          {gameState === "summary" && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full"
            >
              <MaterialCard className="relative flex flex-col items-center overflow-hidden p-8 text-center md:p-12">
                <div className="absolute left-0 top-0 h-2 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />

                <div className="mb-6 flex size-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
                  <IconTrophy size={48} strokeWidth={1.5} />
                </div>

                <h2 className="mb-2 text-2xl font-bold text-gray-800 md:text-3xl">
                  تست سرعت تکمیل شد!
                </h2>

                {/* کارت آمار */}
                <div className="my-8 grid w-full max-w-sm grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="mb-1 text-sm text-gray-500">تعداد درست</div>
                    <div className="text-2xl font-bold text-emerald-600">
                      {correctCount}{" "}
                      <span className="text-sm font-normal text-gray-400">
                        از {totalQuestions}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="mb-1 text-sm text-gray-500">زمان کل</div>
                    <div className="dir-ltr text-2xl font-bold text-amber-500">
                      {elapsedSeconds}{" "}
                      <span className="text-sm font-normal text-gray-400">
                        ثانیه
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex w-full max-w-md flex-col gap-4 md:flex-row">
                  <button
                    onClick={startGame}
                    className="flex-1 rounded-xl border-2 border-emerald-100 bg-white py-3 font-bold text-emerald-600 transition-all hover:bg-emerald-50"
                  >
                    تلاش مجدد
                  </button>
                  <button
                    onClick={() => router.back()}
                    className="flex-1 rounded-xl bg-emerald-600 py-3 font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700"
                  >
                    بازگشت به درس
                  </button>
                </div>
              </MaterialCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
