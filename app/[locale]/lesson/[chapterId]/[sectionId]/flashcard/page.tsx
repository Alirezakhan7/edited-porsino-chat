"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  IconArrowRight,
  IconThumbUp,
  IconThumbDown,
  IconCards,
  IconClick,
  IconHelp
} from "@tabler/icons-react"

import { createClient } from "@/lib/supabase/client"
import { findLessonByParams } from "@/lib/lessons/config"
import { getLessonContent } from "@/lib/lessons/content"
import { upsertActivityProgress } from "@/lib/progress/api"
import { recordFlashcardMistake } from "@/lib/flashcards/api"
import type { ActivityId } from "@/lib/lessons/types"

const ACTIVITY_ID: ActivityId = "flashcard"
const supabase = createClient()

export default function FlashcardPage() {
  const router = useRouter()
  const params = useParams<{
    locale: string
    chapterId: string
    sectionId: string
  }>()
  const locale = params.locale ?? "fa"

  const [userId, setUserId] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showBack, setShowBack] = useState(false)
  const [seenCards, setSeenCards] = useState<Record<string, boolean>>({})
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

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)
    }
    loadUser()
  }, [])

  if (!lessonConfig || !content || content.flashcards.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-500">
        برای این گفتار هنوز فلش‌کارت ثبت نشده است.
      </div>
    )
  }

  const cards = content.flashcards
  const totalCards = cards.length
  const currentCard = cards[currentIndex]

  const seenCount = Object.keys(seenCards).length
  const progressPercent =
    totalCards === 0 ? 0 : Math.round((seenCount / totalCards) * 100)
  const isLastCard = currentIndex === totalCards - 1

  const handleMark = async (isCorrect: boolean) => {
    const alreadySeen = seenCards[currentCard.id] === true
    const newSeen = alreadySeen
      ? seenCards
      : { ...seenCards, [currentCard.id]: true }
    setSeenCards(newSeen)

    if (!isCorrect && userId) {
      try {
        await recordFlashcardMistake(supabase, {
          userId,
          lessonKey: lessonConfig!.lessonKey,
          cardId: currentCard.id
        })
      } catch (e) {
        console.error(e)
      }
    }

    if (!alreadySeen && userId) {
      const newSeenCount = Object.keys(newSeen).length
      const newProgress =
        totalCards === 0 ? 0 : Math.round((newSeenCount / totalCards) * 100)
      try {
        setSaving(true)
        await upsertActivityProgress(supabase, {
          userId,
          lessonKey: lessonConfig!.lessonKey,
          activityId: ACTIVITY_ID,
          progress: newProgress
        })
      } catch (e) {
        console.error(e)
      } finally {
        setSaving(false)
      }
    }

    // رفتن به کارت بعدی
    if (!isLastCard) {
      setShowBack(false) // کارت بعدی را به رو نشان بده
      setTimeout(() => setCurrentIndex(i => i + 1), 300)
    } else {
      router.push(`/${locale}/lesson/${params.chapterId}/${params.sectionId}`)
    }
  }

  return (
    <div
      dir="rtl"
      className="flex min-h-screen flex-col bg-gray-100 py-8 pb-20"
    >
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6">
        {/* هدر ساده */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-gray-500 transition-colors hover:text-gray-900"
          >
            <div className="rounded-full bg-white p-2 shadow-sm transition-all group-hover:shadow-md">
              <IconArrowRight size={18} />
            </div>
            <span className="text-sm font-medium">بازگشت</span>
          </button>

          <div className="flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold tracking-wide text-purple-600">
            <IconCards size={16} />
            <span>
              {currentIndex + 1} / {totalCards}
            </span>
          </div>
        </div>

        {/* نوار پیشرفت باریک */}
        <div className="mb-12 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* --- کانتینر سه‌بعدی کارت (استایل مدرن) --- */}
        <div className="perspective-1000 relative flex min-h-[400px] w-full flex-1 flex-col justify-center">
          {/* نور پس‌زمینه نرم پشت کارت */}
          <div className="pointer-events-none absolute inset-x-0 top-6 mx-auto h-64 max-w-md rounded-full bg-gradient-to-r from-purple-400/40 via-indigo-400/30 to-sky-400/40 blur-3xl" />

          <motion.div
            className="relative aspect-[4/5] w-full cursor-pointer md:aspect-[16/10]"
            onClick={() => setShowBack(prev => !prev)}
            initial={false}
            animate={{ rotateY: showBack ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 26 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* ============ روی کارت (سوال) ============ */}
            <div
              className="absolute inset-0 flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 via-slate-950 to-black px-6 py-5 text-right shadow-[0_18px_45px_rgba(15,23,42,0.55)] md:px-8 md:py-7"
              style={{ backfaceVisibility: "hidden" }}
            >
              {/* نوار بالا */}
              <div className="flex items-center justify-between text-xs text-slate-300/70">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1">
                  <IconCards size={16} />
                  کارت تمرین
                </span>

                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                  <IconHelp size={16} />
                  پرسش
                </span>
              </div>

              {/* متن سوال */}
              <div className="flex flex-1 items-center">
                <p className="w-full select-none text-lg font-semibold leading-relaxed text-slate-50 md:text-2xl">
                  {currentCard.front}
                </p>
              </div>

              {/* راهنما پایین کارت */}
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400/80 md:text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <IconClick size={14} />
                  برای دیدن پاسخ روی کارت کلیک کنید
                </span>
                <span className="rounded-full border border-white/10 px-2 py-0.5">
                  رو
                </span>
              </div>
            </div>

            {/* ============ پشت کارت (جواب) ============ */}
            <div
              className="absolute inset-0 flex flex-col overflow-hidden rounded-3xl border border-purple-300/40 bg-gradient-to-br from-purple-700 via-indigo-700 to-sky-600 px-6 py-5 text-right text-white shadow-[0_20px_50px_rgba(99,102,241,0.4)] md:px-8 md:py-7"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)"
              }}
            >
              {/* پترن شیشه‌ای روی جواب */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10 opacity-30 mix-blend-screen" />

              {/* نوار بالا */}
              <div className="relative z-10 flex items-center justify-between text-xs text-slate-100/90">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
                  <IconCards size={16} />
                  پاسخ کارت
                </span>
                <span className="rounded-full border border-white/40 px-2 py-0.5 text-[11px]">
                  پشت
                </span>
              </div>

              {/* متن پاسخ */}
              <div className="relative z-10 flex flex-1 items-center">
                <p className="w-full select-none text-lg font-semibold leading-relaxed text-slate-50 md:text-2xl">
                  {currentCard.back}
                </p>
              </div>

              <div className="relative z-10 mt-1 text-[11px] text-slate-100/85 md:text-xs">
                اگر هنوز مطمئن نیستی، یک بار دیگر این کارت را مرور کن.
              </div>
            </div>
          </motion.div>
        </div>

        {/* دکمه‌های فیدبک (خارج از فضای چرخش) */}
        <div className="mt-8 flex h-24 w-full items-center justify-center">
          <AnimatePresence mode="wait">
            {showBack ? (
              <motion.div
                key="buttons"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex w-full max-w-sm gap-6"
              >
                <button
                  onClick={e => {
                    e.stopPropagation()
                    handleMark(false)
                  }}
                  className="flex flex-1 flex-col items-center gap-2 rounded-2xl border border-red-100 bg-white p-4 text-red-500 shadow-sm transition-all hover:scale-105 hover:border-red-200 hover:bg-red-50"
                >
                  <IconThumbDown size={24} />
                  <span className="text-xs font-bold">بلد نبودم</span>
                </button>

                <button
                  onClick={e => {
                    e.stopPropagation()
                    handleMark(true)
                  }}
                  className="flex flex-1 flex-col items-center gap-2 rounded-2xl border border-green-100 bg-white p-4 text-green-500 shadow-sm transition-all hover:scale-105 hover:border-green-200 hover:bg-green-50"
                >
                  <IconThumbUp size={24} />
                  <span className="text-xs font-bold">یاد گرفتم</span>
                </button>
              </motion.div>
            ) : (
              <motion.p
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 rounded-xl border border-dashed border-gray-300/70 bg-white/80 px-4 py-2.5 text-sm font-medium text-gray-400"
              >
                <IconClick size={16} />
                برای دیدن پاسخ، روی کارت کلیک کن.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
