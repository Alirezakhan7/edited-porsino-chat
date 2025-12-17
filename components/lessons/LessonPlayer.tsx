"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import {
  IconArrowLeft,
  IconCheck,
  IconX,
  IconBulb,
  IconBook
} from "@tabler/icons-react"
import confetti from "canvas-confetti"
import { MaterialCard, colorThemes } from "@/components/material/MaterialUI"
import type { GamifiedUnit } from "@/lib/lessons/types"

interface LessonPlayerProps {
  units: GamifiedUnit[]
  chapterId: string
  stepNumber: number
  userId: string
  locale: string
}
import { saveUserProgress } from "@/lib/actions/progress"

export default function LessonPlayer({
  units,
  chapterId,
  stepNumber,
  userId,
  locale
}: LessonPlayerProps) {
  const router = useRouter()
  const supabase = createClient()
  const theme = colorThemes.blue

  const [currentIndex, setCurrentIndex] = useState(0)
  const [viewState, setViewState] = useState<
    "story" | "interaction" | "feedback"
  >("story")
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean>(false)

  const [isTipsOpen, setIsTipsOpen] = useState(false)

  const currentUnit = units[currentIndex]
  const hasTips = currentUnit.konkur_tips && currentUnit.konkur_tips.length > 0

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
    setIsTipsOpen(false)
  }, [currentIndex, viewState])

  if (!units || units.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center font-bold text-gray-400">
        محتوایی یافت نشد! 🚫
      </div>
    )
  }
  // --- 1. رندر متن و عکس ---
  const renderStoryContent = (text: string) => {
    const parts = text.split(/\[\[\[INSERT_IMAGE_HERE: (.*?)\]\]\]/g)
    return (
      <div className="space-y-8 text-right text-lg font-medium leading-[2.2] text-gray-700 md:text-[1.1rem]">
        {parts.map((part, i) => {
          if (i % 2 === 1) {
            return (
              <motion.div
                key={i}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="my-10 flex justify-center"
              >
                <img
                  src={`/images/lessons/${part.trim()}.jpg`}
                  alt="تصویر آموزشی"
                  className="w-full max-w-xl rounded-[2rem] border-[6px] border-white shadow-2xl ring-1 ring-gray-200/50 transition-transform duration-500 hover:scale-[1.01]"
                  onError={e =>
                    ((e.target as HTMLImageElement).style.display = "none")
                  }
                />
              </motion.div>
            )
          }
          if (!part.trim()) return null
          return <p key={i}>{part}</p>
        })}
      </div>
    )
  }

  // --- 2. انتخاب گزینه ---
  const handleOptionClick = async (index: number) => {
    setSelectedOption(index)
    const correct = index === currentUnit.interaction.correct_index
    setIsCorrect(correct)
    setViewState("feedback")

    if (correct) {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.65 },
        colors: ["#34D399", "#10B981", "#F59E0B"]
      })
    }

    supabase
      .from("activity_logs")
      .insert({
        user_id: userId,
        chunk_uid: currentUnit.uid,
        is_correct: correct,
        time_spent_seconds: 0
      })
      .then()
  }

  // --- 3. هندل کردن دکمه بعدی ---
  const handleNext = async () => {
    // منطق لایتنر (بدون تغییر)
    if (currentUnit.flashcards && currentUnit.flashcards.length > 0) {
      // ساخت آرایه برای ذخیره گروهی
      const cardsData = currentUnit.flashcards.map(card => ({
        user_id: userId,
        flashcard_front: card.front,
        flashcard_back: card.back,
        source_chunk_uid: currentUnit.uid,
        box_level: 1
      }))

      // ذخیره در دیتابیس
      supabase
        .from("leitner_box")
        .insert(cardsData)
        .then(({ error }) => {
          if (error) console.error("Error saving flashcards:", error)
        })
    }

    if (currentIndex < units.length - 1) {
      // رفتن به اسلاید بعدی (بدون تغییر)
      setViewState("story")
      setSelectedOption(null)
      setIsCorrect(false)
      setCurrentIndex(prev => prev + 1)
    } else {
      // 🏁 رسیدن به پایان درس (اینجا را تغییر می‌دهیم)
      try {
        // ✅ استفاده از سرور اکشن جدید برای ذخیره امن و باز کردن قفل مرحله بعد
        // عدد 20 مقدار XP است که برای پایان درس در نظر گرفتیم
        await saveUserProgress(chapterId, 20)

        // رفرش کردن کش نکست (خیلی مهم برای اینکه وقتی برگشتید قفل باز شده باشد)
        router.refresh()

        // بازگشت به نقشه
        router.push(`/${locale}/lesson/${chapterId}`)
      } catch (error) {
        console.error("خطا در ذخیره پیشرفت:", error)
        // حتی اگر خطا داد، کاربر را به نقشه برگردان تا گیر نکند
        router.push(`/${locale}/lesson/${chapterId}`)
      }
    }
  }
  const progressPercent = (currentIndex / units.length) * 100

  return (
    // ✅ تغییر ۱: overflow-hidden به overflow-x-hidden تبدیل شد تا اسکرول عمودی کار کند
    <div
      className="relative min-h-screen overflow-x-hidden bg-[#F8FAFC] font-sans text-gray-900"
      dir="rtl"
    >
      {/* پس‌زمینه متحرک */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute right-[-10%] top-[-10%] size-[600px] animate-pulse rounded-full bg-blue-400/10 mix-blend-multiply blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] size-[500px] animate-pulse rounded-full bg-purple-400/10 mix-blend-multiply blur-[100px] delay-1000" />
      </div>

      {/* هدر شناور */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-6">
        <div className="pointer-events-auto w-full max-w-3xl">
          <div className="relative flex items-center gap-3 overflow-hidden rounded-[2rem] border border-white/60 bg-white/70 p-2 shadow-[0_8px_30px_rgb(0,0,0,0.03)] backdrop-blur-xl">
            <button
              onClick={() => router.back()}
              className="rounded-full border border-gray-100 bg-white p-3 text-gray-400 shadow-sm transition-all hover:bg-red-50 hover:text-red-500 active:scale-95"
            >
              <IconX size={20} stroke={2.5} />
            </button>

            <div className="relative mx-2 h-4 flex-1 overflow-hidden rounded-full bg-gray-100/80 shadow-inner">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>

            <button
              onClick={() => hasTips && setIsTipsOpen(true)}
              disabled={!hasTips}
              className={`rounded-full border p-3 shadow-sm transition-all active:scale-95 ${
                hasTips
                  ? "animate-pulse cursor-pointer border-amber-200 bg-amber-100 text-amber-600 hover:bg-amber-200"
                  : "cursor-default border-gray-100 bg-gray-100 text-gray-300"
              }`}
            >
              <IconBulb
                size={20}
                stroke={2.5}
                className={hasTips ? "fill-amber-500" : ""}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ✅ تغییر ۲: افزایش پدینگ پایین (pb) به ۲۵۰ پیکسل تا متن‌ها از زیر دکمه‌ها بیرون بیایند */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col px-4 pb-[250px] pt-32">
        <AnimatePresence mode="wait">
          {/* --- فاز ۱: داستان --- */}
          {viewState === "story" && (
            <motion.div
              key="story"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="flex-1" // پدینگ را به والد اصلی دادیم
            >
              <MaterialCard className="!rounded-[3rem] !border-white/80 !bg-white/80 !p-8 !shadow-[0_20px_60px_rgba(0,0,0,0.04)] !backdrop-blur-2xl md:!p-12">
                {currentUnit.is_start_of_lesson && (
                  <div className="mb-10 inline-flex -rotate-1 items-center rounded-3xl border-4 border-white/20 bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 text-sm font-black text-white shadow-xl shadow-indigo-500/20">
                    <span className="ml-3 animate-bounce text-2xl">🚀</span>
                    مبحث جدید: {currentUnit.lesson_title}
                  </div>
                )}
                {renderStoryContent(currentUnit.story)}
              </MaterialCard>

              {/* دکمه ادامه شناور (بالای داشبورد) */}
              <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-6">
                <motion.button
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  whileHover={{ scale: 1.05, translateY: -2 }}
                  whileTap={{ scale: 0.95, translateY: 2 }}
                  onClick={() => setViewState("interaction")}
                  className="pointer-events-auto flex w-full max-w-sm items-center justify-center gap-3 rounded-3xl border-b-[6px] border-blue-800 bg-gradient-to-b from-blue-500 to-blue-600 py-4 text-xl font-black text-white shadow-xl shadow-blue-500/30 transition-all active:translate-y-[6px] active:border-b-0"
                >
                  ادامه و چالش <IconArrowLeft size={26} stroke={3} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* --- فاز ۲: سوال و بازخورد --- */}
          {(viewState === "interaction" || viewState === "feedback") && (
            <motion.div
              key="interaction"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-1 flex-col"
            >
              <MaterialCard className="relative mb-8 overflow-hidden !rounded-[3rem] !border-blue-100 !bg-white/90 !p-10 !shadow-[0_10px_40px_rgba(59,130,246,0.08)]">
                <div className="absolute right-0 top-0 p-4 opacity-[0.03]">
                  <IconBook size={150} />
                </div>
                <h2 className="relative z-10 text-center text-xl font-black leading-loose text-gray-800 md:text-2xl">
                  {currentUnit.interaction.question}
                </h2>
              </MaterialCard>

              <div className="space-y-5">
                {currentUnit.interaction.options.map((option, idx) => {
                  let btnStyle =
                    "bg-white border-gray-200 text-gray-600 border-b-[5px]"
                  if (viewState === "feedback") {
                    if (idx === currentUnit.interaction.correct_index) {
                      btnStyle =
                        "bg-emerald-500 border-emerald-700 text-white border-b-[5px] ring-4 ring-emerald-100"
                    } else if (idx === selectedOption) {
                      btnStyle =
                        "bg-rose-500 border-rose-700 text-white border-b-[5px] ring-4 ring-rose-100"
                    } else {
                      btnStyle = "opacity-40 grayscale scale-95"
                    }
                  } else if (selectedOption === idx) {
                    btnStyle =
                      "bg-blue-500 border-blue-700 text-white border-b-[5px]"
                  } else {
                    btnStyle =
                      "bg-white border-gray-200 border-b-[5px] text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                  }

                  return (
                    <motion.button
                      key={idx}
                      whileTap={
                        viewState !== "feedback"
                          ? { scale: 0.98, translateY: 5 }
                          : {}
                      }
                      disabled={viewState === "feedback"}
                      onClick={() => handleOptionClick(idx)}
                      className={`relative flex w-full items-center justify-between rounded-3xl p-5 text-right text-lg font-bold shadow-sm transition-all duration-200 md:text-xl ${btnStyle} ${viewState !== "feedback" ? "active:translate-y-[5px] active:border-b-0" : ""}`}
                    >
                      {option}
                      {viewState === "feedback" &&
                        idx === currentUnit.interaction.correct_index && (
                          <div className="rounded-full bg-white/20 p-1.5">
                            <IconCheck stroke={3} />
                          </div>
                        )}
                      {viewState === "feedback" &&
                        idx === selectedOption &&
                        idx !== currentUnit.interaction.correct_index && (
                          <div className="rounded-full bg-white/20 p-1.5">
                            <IconX stroke={3} />
                          </div>
                        )}
                    </motion.button>
                  )
                })}
              </div>

              {/* فیدبک (بالای داشبورد) */}
              <AnimatePresence>
                {viewState === "feedback" && (
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    // ✅ تغییر ۳: فیدبک هم در bottom-24 قرار گرفت
                    className={`fixed inset-x-4 bottom-24 z-50 rounded-[3rem] border border-white/20 p-8 shadow-[0_10px_60px_rgba(0,0,0,0.3)] backdrop-blur-3xl ${isCorrect ? "bg-[#ECFDF5]" : "bg-[#FFF1F2]"}`}
                  >
                    <div className="mx-auto max-w-2xl">
                      <div className="mb-4 flex items-center gap-4">
                        <div
                          className={`rounded-full border border-white/50 p-4 shadow-sm ${isCorrect ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}
                        >
                          {isCorrect ? (
                            <IconCheck size={36} stroke={3} />
                          ) : (
                            <IconX size={36} stroke={3} />
                          )}
                        </div>
                        <span
                          className={`text-3xl font-black ${isCorrect ? "text-emerald-800" : "text-rose-800"}`}
                        >
                          {isCorrect ? "عالی بود! 🎉" : "ای وای! 😅"}
                        </span>
                      </div>

                      <div className="mb-8 pr-2 text-lg font-medium leading-8 text-gray-800">
                        <span className="mb-1 block text-sm font-bold opacity-60">
                          توضیح:
                        </span>
                        {currentUnit.interaction.feedback}
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleNext}
                        className={`w-full rounded-3xl border-b-[6px] py-5 text-xl font-black text-white shadow-xl transition-all active:translate-y-[6px] active:border-b-0 ${
                          isCorrect
                            ? "border-emerald-700 bg-emerald-500 shadow-emerald-400/40 hover:bg-emerald-600"
                            : "border-rose-700 bg-rose-500 shadow-rose-400/40 hover:bg-rose-600"
                        }`}
                      >
                        {currentIndex < units.length - 1
                          ? "ادامه بده"
                          : "پایان درس"}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ✅ مادال (کشو) نکات کنکوری - اصلاح شده */}
        <AnimatePresence>
          {isTipsOpen && hasTips && (
            <>
              {/* پس‌زمینه تیره (Backdrop) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsTipsOpen(false)}
                // z-[60] باعث می‌شود روی هدر و دکمه‌ها بیاید
                className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
              />

              {/* باکس اصلی نکات */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                // 👇 تغییرات مهم اینجاست:
                // 1. bottom-24: فاصله از کف برای اینکه روی داشبورد نیفتد
                // 2. z-[70]: بالاترین لایه
                // 3. left-4 right-4: کمی فاصله از بغل‌ها برای زیبایی
                // 4. rounded-[3rem]: گرد کردن تمام گوشه‌ها
                className="fixed inset-x-4 bottom-24 z-[70] max-h-[70vh] overflow-y-auto rounded-[3rem] border-4 border-[#FDE68A] bg-[#FFFBF0] shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
              >
                {/* هدرِ باکس نکات (چسبنده) */}
                <div className="relative flex items-center justify-between border-b border-amber-100 bg-[#FFFBF0] p-6 pb-4">
                  <h3 className="flex items-center gap-2 text-2xl font-black text-amber-800">
                    <IconBulb
                      size={32}
                      className="fill-amber-500 text-amber-600"
                    />
                    نکات طلایی
                  </h3>
                  <button
                    onClick={() => setIsTipsOpen(false)}
                    className="rounded-full bg-amber-100 p-2 text-amber-700 transition-colors hover:bg-amber-200"
                  >
                    <IconX />
                  </button>
                </div>

                {/* محتوای اسکرول‌خور */}
                <div className="relative p-6 pb-8 pt-4">
                  <div className="pointer-events-none absolute left-0 top-0 size-full bg-[url('/images/paper-pattern.png')] opacity-5"></div>

                  <ul className="relative z-10 space-y-4">
                    {currentUnit.konkur_tips.map((tip, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-4 rounded-3xl border-2 border-amber-100/50 bg-white/80 p-5 shadow-sm"
                      >
                        <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-sm font-black text-white shadow-md shadow-amber-200">
                          {idx + 1}
                        </span>
                        <p className="text-right text-lg font-bold leading-8 text-gray-800">
                          {tip}
                        </p>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => setIsTipsOpen(false)}
                    className="mt-8 w-full rounded-2xl border-b-[6px] border-amber-700 bg-amber-500 py-4 text-xl font-black text-white shadow-xl shadow-amber-200 transition-all active:translate-y-[6px] active:scale-95 active:border-b-0"
                  >
                    یاد گرفتم! 👍
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
