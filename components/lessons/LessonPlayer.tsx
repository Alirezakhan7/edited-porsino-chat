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
import { saveUserProgress } from "@/lib/actions/progress"
import { useTextSelection } from "@/lib/hooks/use-text-selection"
import ActionMenu from "@/components/lessons/ActionMenu"
import FlashcardModal from "@/components/lessons/FlashcardModal"
import { toast } from "sonner"
import QuickAiModal from "@/components/lessons/QuickAiModal"

interface LessonPlayerProps {
  units: GamifiedUnit[]
  chapterId: string
  stepNumber: number
  userId: string
  locale: string
}

export default function LessonPlayer({
  units,
  chapterId,
  stepNumber,
  userId,
  locale
}: LessonPlayerProps) {
  const router = useRouter()
  const supabase = createClient()

  // استفاده از تم رنگی برای هماهنگی با سیستم
  const theme = colorThemes.blue
  const [userWorkspaceId, setUserWorkspaceId] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [viewState, setViewState] = useState<
    "story" | "interaction" | "feedback"
  >("story")
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean>(false)
  const [isTipsOpen, setIsTipsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { clientRect, isCollapsed, textContent } = useTextSelection()
  const handleCreateFlashcard = () => {
    // بستن منوی سلکشن با کلیک کردن (یک هک کوچک برای اینکه منوی مشکی بسته شود)
    document.getSelection()?.removeAllRanges()

    setSelectedTextForCard(textContent) // متنی که از هوک گرفتیم
    setIsFlashcardModalOpen(true)
  }
  const handleAskAI = () => {
    // بستن منوی سلکشن
    document.getSelection()?.removeAllRanges()

    setSelectedTextForAi(textContent) // ذخیره متن انتخاب شده
    setIsAiModalOpen(true) // باز کردن مدال
  }
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [selectedTextForAi, setSelectedTextForAi] = useState("")
  // ✅ دریافت ورک‌اسپیس پیش‌فرض (Home) کاربر برای استفاده در چت
  useEffect(() => {
    const fetchHomeWorkspace = async () => {
      if (!userId) return

      // تلاش برای پیدا کردن ورک‌اسپیس اصلی (Home)
      const { data } = await supabase
        .from("workspaces")
        .select("id")
        .eq("user_id", userId)
        .eq("is_home", true)
        .maybeSingle() // استفاده از maybeSingle امن‌تر است تا اگر نبود ارور ندهد

      if (data) {
        setUserWorkspaceId(data.id)
      } else {
        // اگر ورک‌اسپیس Home نداشت، اولین ورک‌اسپیس موجود را بگیر
        const { data: firstWs } = await supabase
          .from("workspaces")
          .select("id")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle()

        if (firstWs) setUserWorkspaceId(firstWs.id)
      }
    }

    fetchHomeWorkspace()
  }, [userId, supabase])
  const currentUnit = units[currentIndex]
  // جلوگیری از ارور اگر konkur_tips وجود نداشت
  const hasTips = currentUnit?.konkur_tips && currentUnit.konkur_tips.length > 0
  const progressPercent = ((currentIndex + 1) / units.length) * 100

  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false)
  const [selectedTextForCard, setSelectedTextForCard] = useState("")
  const onSaveFlashcard = async (front: string, back: string) => {
    try {
      const { error } = await supabase.from("leitner_box").insert({
        user_id: userId,
        flashcard_front: front,
        flashcard_back: back,
        source_chunk_uid: currentUnit.uid, // وصل کردن به همین اسلاید درس
        box_level: 1, // خانه اول لایتنر
        next_review_at: new Date().toISOString() // زمان مرور همین الان
      })

      if (error) throw error

      toast.success("به جعبه لایتنر اضافه شد")
    } catch (error) {
      console.error(error)
      toast.error("خطا در ذخیره فلش‌کارت")
    }
  }

  // این تابع بعداً به سرور پایتون وصل می‌شود
  // تابع اتصال به هوش مصنوعی سریع
  const handleAiRequest = async (question: string, context: string) => {
    // اگر هنوز ورک‌اسپیس لود نشده، خطا بده یا صبر کن
    if (!userWorkspaceId) {
      toast.error("در حال بارگذاری اطلاعات کاربر... لطفا مجدد تلاش کنید.")
      return "Not ready"
    }
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession()
      if (!session) {
        toast.error("لطفا ابتدا وارد حساب خود شوید.")
        return "خطای دسترسی"
      }

      // 2. آدرس سرور پایتون (لوکال یا پروداکشن)
      // اگر روی سرور هستید آدرس واقعی را بگذارید، مثلا: https://api.porsino.org/quick-ask
      const CHAT_URL = "https://api.porsino.org/chat"

      // 3. ارسال درخواست
      // 2. ارسال درخواست به صف
      // ما اینجا از مدل gpt-4o-mini استفاده می‌کنیم که سریع و ارزان است
      const startRes = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          message: question,
          context: context, // ارسال متن انتخاب شده
          customModelId: "gpt-4o-mini",
          workspaceId: userWorkspaceId, // یک ID فرضی یا واقعی
          // اگر chatId نداریم، نال می‌فرستیم تا چت جدید نسازد یا مدیریت کند
          chatId: null
        })
      })

      if (!startRes.ok) {
        const err = await startRes.json()
        throw new Error(err.detail || "خطا در ارسال درخواست")
      }

      const { job_id } = await startRes.json()

      // 3. انتظار برای نتیجه (Polling)
      // چون سرور ما استریم واقعی نمیکند و نتیجه را یکجا میدهد، باید صبر کنیم تا job تمام شود
      const RESULT_URL = `https://api.porsino.org/chat/result/${job_id}`

      while (true) {
        const res = await fetch(RESULT_URL, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })

        if (!res.ok) throw new Error("خطا در دریافت نتیجه")

        // سرور ما نتیجه را به صورت استریم کاراکتر برمی‌گرداند، ما آن را کامل می‌خوانیم
        const text = await res.text()

        try {
          const json = JSON.parse(text)
          if (json.status === "processing") {
            await new Promise(r => setTimeout(r, 1000))
            continue
          }

          if (json.answer) {
            return json.answer
          }
        } catch (e) {}
        break
      }
    } catch (error: any) {
      console.error("AI Error:", error)
      toast.error("مشکلی پیش آمد: " + error.message)
      return "متاسفانه ارتباط برقرار نشد."
    }
  }
  // اسکرول به بالا هنگام تغییر اسلاید
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
    setIsTipsOpen(false)
  }, [currentIndex, viewState])

  if (!units || units.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center font-bold text-slate-400">
        محتوایی یافت نشد! 🚫
      </div>
    )
  }

  // --- 1. رندر متن و عکس با استایل حرفه‌ای آموزشی ---
  const renderStoryContent = (text: string) => {
    // تقسیم متن بر اساس تگ تصویر
    const parts = text.split(/\[\[\[INSERT_IMAGE_HERE: (.*?)\]\]\]/g)

    return (
      <div className="w-full">
        {parts.map((part, i) => {
          // --- بخش تصاویر ---
          if (i % 2 === 1) {
            return (
              <motion.div
                key={i}
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="my-12 flex justify-center"
              >
                <img
                  src={`/images/lessons/${part.trim()}.jpg`}
                  alt="تصویر آموزشی"
                  className="w-full rounded-2xl shadow-lg transition-transform hover:shadow-xl md:max-w-lg dark:brightness-90"
                  onError={e =>
                    ((e.target as HTMLImageElement).style.display = "none")
                  }
                />
              </motion.div>
            )
          }

          // --- بخش متن (پاراگراف‌ها) ---
          if (!part.trim()) return null

          return (
            <p
              key={i}
              className="
                mb-8 whitespace-pre-line text-justify 
                text-lg font-medium leading-[2.2] tracking-normal text-slate-800 
                md:text-[1.25rem] md:leading-[2.5] 
                dark:text-slate-200
              "
            >
              {part}
            </p>
          )
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

    // ثبت فعالیت در دیتابیس
    await supabase.from("activity_logs").insert({
      user_id: userId,
      chunk_uid: currentUnit.uid,
      is_correct: correct,
      time_spent_seconds: 0
    })
  }

  // --- 3. هندل کردن دکمه بعدی (اصلاح شده) ---
  const handleNext = async () => {
    // اگر در حال لودینگ هستیم، اجازه کلیک مجدد نده (جلوگیری در سمت فرانت‌اند)
    if (loading) return
    setLoading(true)

    try {
      // 1. منطق ذخیره لایتنر (هوشمند و بدون تکرار)
      if (currentUnit.flashcards && currentUnit.flashcards.length > 0) {
        // قدم اول: چک کردن اینکه آیا قبلاً اضافه شده یا نه
        const { count } = await supabase
          .from("leitner_box")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("source_chunk_uid", currentUnit.uid)

        // قدم دوم: فقط اگر قبلاً وجود نداشت (count === 0) اضافه کن
        if (count === 0 || count === null) {
          const cardsData = currentUnit.flashcards.map(card => ({
            user_id: userId,
            flashcard_front: card.front,
            flashcard_back: card.back,
            source_chunk_uid: currentUnit.uid,
            box_level: 1
          }))

          await supabase.from("leitner_box").insert(cardsData)
        }
      }

      // 2. ادامه مسیر (رفتن به اسلاید بعد یا پایان)
      if (currentIndex < units.length - 1) {
        setViewState("story")
        setSelectedOption(null)
        setIsCorrect(false)
        setCurrentIndex(prev => prev + 1)
        // مهم: لودینگ را فقط وقتی به اسلاید بعد رفتیم خاموش می‌کنیم
        setLoading(false)
      } else {
        // پایان درس
        await saveUserProgress(chapterId, 20)
        router.refresh()
        router.push(`/${locale}/lesson/${chapterId}`)
        // اینجا لودینگ را فالس نمی‌کنیم چون داریم صفحه را عوض می‌کنیم
      }
    } catch (error) {
      console.error("خطا در عملیات:", error)
      setLoading(false) // اگر ارور داد، لودینگ را بردار تا کاربر دوباره تلاش کند
      toast.error("مشکلی پیش آمد. لطفا مجدد تلاش کنید.")
    }
  }

  return (
    <div
      // تغییر: حذف overflow-x-hidden تا sticky کار کند
      className="relative min-h-screen bg-slate-50 font-sans text-slate-900 transition-colors duration-500 dark:bg-slate-950 dark:text-slate-100"
      dir="rtl"
    >
      {/* پس‌زمینه متحرک */}
      <div className="pointer-events-none fixed inset-0 opacity-40">
        <div className="absolute right-[-10%] top-[-10%] size-[600px] animate-pulse rounded-full bg-blue-400/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] size-[500px] animate-pulse rounded-full bg-purple-400/20 blur-[100px] delay-1000" />
      </div>

      {/* هدر شناور */}
      <div className="pointer-events-none sticky top-0 z-50 flex justify-center px-4 pt-6">
        <div className="pointer-events-auto w-full max-w-3xl">
          <div className="relative flex items-center gap-3 overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 p-2 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
            <button
              onClick={() => router.back()}
              className="rounded-full border border-slate-100 bg-white p-3 text-slate-400 shadow-sm transition-all hover:bg-red-50 hover:text-red-500 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-red-900/20"
            >
              <IconX size={20} stroke={2.5} />
            </button>

            <div className="relative mx-2 h-4 flex-1 overflow-hidden rounded-full bg-slate-100 shadow-inner dark:bg-slate-800">
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
                  ? "animate-pulse cursor-pointer border-amber-200 bg-amber-100 text-amber-600 hover:bg-amber-200 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  : "cursor-default border-slate-100 bg-slate-100 text-slate-300 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-600"
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

      {/* کانتینر اصلی محتوا */}
      {/* تغییر: کاهش pt-32 به pt-4 چون هدر الان فضا می‌گیرد */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 pb-[250px] pt-4">
        <AnimatePresence mode="wait">
          {/* --- فاز ۱: داستان --- */}
          {viewState === "story" && (
            <motion.div
              key="story"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              // تغییر: flex flex-col برای اینکه mt-auto روی دکمه کار کند
              className="flex min-h-[60vh] flex-1 flex-col"
            >
              <MaterialCard className="!rounded-[3rem] !border-white/80 !bg-white/90 !p-8 !shadow-xl !backdrop-blur-2xl md:!p-12 dark:!border-slate-700 dark:!bg-slate-900/90">
                {currentUnit.is_start_of_lesson && (
                  <div className="mb-10 inline-flex -rotate-1 items-center rounded-3xl border-4 border-white/20 bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 text-sm font-black text-white shadow-xl shadow-indigo-500/20">
                    <span className="ml-3 animate-bounce text-2xl">🚀</span>
                    مبحث جدید: {currentUnit.lesson_title}
                  </div>
                )}
                {renderStoryContent(currentUnit.story)}
              </MaterialCard>

              {/* ✅ دکمه ادامه دقیقاً با تنظیمات قبلی */}
              <div className="sticky bottom-6 z-40 mt-auto flex w-full justify-center px-6 pb-6 pt-4 md:bottom-10">
                <motion.button
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  whileHover={{ scale: 1.05, translateY: -2 }}
                  whileTap={{ scale: 0.95, translateY: 2 }}
                  onClick={() => setViewState("interaction")}
                  className="pointer-events-auto flex w-full max-w-sm items-center justify-center gap-3 rounded-3xl border-b-[6px] border-blue-800 bg-gradient-to-b from-blue-500 to-blue-600 py-4 text-xl font-black text-white shadow-xl shadow-blue-500/30 transition-all active:translate-y-[6px] active:border-b-0"
                >
                  {loading ? "صبر کنید..." : "ادامه و چالش"}{" "}
                  <IconArrowLeft size={26} stroke={3} />
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
              <MaterialCard className="relative mb-8 overflow-hidden !rounded-[3rem] !border-blue-100 !bg-white/95 !p-10 !shadow-lg dark:!border-slate-800 dark:!bg-slate-900">
                <div className="absolute right-0 top-0 p-4 opacity-[0.03]">
                  <IconBook size={150} />
                </div>
                <h2 className="relative z-10 text-center text-xl font-black leading-loose text-slate-800 md:text-2xl dark:text-white">
                  {currentUnit.interaction.question}
                </h2>
              </MaterialCard>

              <div className="space-y-5">
                {currentUnit.interaction.options.map((option, idx) => {
                  let btnStyle =
                    "bg-white border-slate-200 text-slate-600 border-b-[5px] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"

                  if (viewState === "feedback") {
                    if (idx === currentUnit.interaction.correct_index) {
                      btnStyle =
                        "bg-emerald-500 border-emerald-700 text-white border-b-[5px] ring-4 ring-emerald-100 dark:ring-emerald-900"
                    } else if (idx === selectedOption) {
                      btnStyle =
                        "bg-rose-500 border-rose-700 text-white border-b-[5px] ring-4 ring-rose-100 dark:ring-rose-900"
                    } else {
                      btnStyle = "opacity-40 grayscale scale-95"
                    }
                  } else if (selectedOption === idx) {
                    btnStyle =
                      "bg-blue-500 border-blue-700 text-white border-b-[5px]"
                  } else {
                    btnStyle =
                      "bg-white border-slate-200 border-b-[5px] text-slate-700 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
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

              {/* ✅ باکس فیدبک دقیقاً در جایگاه قبلی */}
              <AnimatePresence>
                {viewState === "feedback" && (
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className={`
                      fixed inset-x-4 bottom-24 z-50 rounded-[3rem] border border-white/20 p-8 shadow-[0_10px_60px_rgba(0,0,0,0.3)] backdrop-blur-3xl
                      ${isCorrect ? "bg-emerald-50/95 dark:bg-emerald-900/95" : "bg-rose-50/95 dark:bg-rose-900/95"}
                      
                      {/* --- تغییرات دسکتاپ: تبدیل به پاپ‌آپ وسط صفحه --- */}
                      md:inset-0 md:m-auto md:h-fit md:max-w-xl
                    `}
                  >
                    <div className="mx-auto max-w-2xl">
                      <div className="mb-4 flex items-center gap-4">
                        <div
                          className={`rounded-full border border-white/50 p-4 shadow-sm ${isCorrect ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-800 dark:text-white" : "bg-rose-100 text-rose-600 dark:bg-rose-800 dark:text-white"}`}
                        >
                          {isCorrect ? (
                            <IconCheck size={36} stroke={3} />
                          ) : (
                            <IconX size={36} stroke={3} />
                          )}
                        </div>
                        <span
                          className={`text-3xl font-black ${isCorrect ? "text-emerald-800 dark:text-white" : "text-rose-800 dark:text-white"}`}
                        >
                          {isCorrect ? "عالی بود! 🎉" : "ای وای! 😅"}
                        </span>
                      </div>

                      <div className="mb-8 pr-2 text-lg font-medium leading-8 text-slate-800 dark:text-slate-100">
                        <span className="mb-1 block text-sm font-bold opacity-60">
                          توضیح:
                        </span>
                        {currentUnit.interaction.feedback}
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleNext}
                        disabled={loading}
                        className={`w-full rounded-3xl border-b-[6px] py-5 text-xl font-black text-white shadow-xl transition-all active:translate-y-[6px] active:border-b-0 ${isCorrect ? "border-emerald-700 bg-emerald-500 shadow-emerald-400/40 hover:bg-emerald-600" : "border-rose-700 bg-rose-500 shadow-rose-400/40 hover:bg-rose-600"}`}
                      >
                        {loading
                          ? "صبر کنید..."
                          : currentIndex < units.length - 1
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

        {/* ✅ مودال نکات کنکوری با پوزیشن قبلی */}
        <AnimatePresence>
          {isTipsOpen && hasTips && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsTipsOpen(false)}
                className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                // تغییرات جدید: در دسکتاپ (md) وسط‌چین می‌شود و عرضش محدود می‌گردد
                className="fixed inset-x-4 bottom-24 z-[70] max-h-[70vh] overflow-y-auto rounded-[3rem] border-4 border-[#FDE68A] bg-[#FFFBF0] shadow-2xl md:inset-0 md:m-auto md:h-fit md:max-w-2xl dark:border-amber-600 dark:bg-slate-900"
              >
                <div className="relative flex items-center justify-between border-b border-amber-100 bg-[#FFFBF0] p-6 pb-4 dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="flex items-center gap-2 text-2xl font-black text-amber-800 dark:text-amber-400">
                    <IconBulb
                      size={32}
                      className="fill-amber-500 text-amber-600"
                    />{" "}
                    نکات طلایی
                  </h3>
                  <button
                    onClick={() => setIsTipsOpen(false)}
                    className="rounded-full bg-amber-100 p-2 text-amber-700 transition-colors hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-400"
                  >
                    <IconX />
                  </button>
                </div>

                <div className="relative p-6 pb-8 pt-4">
                  <ul className="relative z-10 space-y-4">
                    {currentUnit.konkur_tips.map((tip, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-4 rounded-3xl border-2 border-amber-100/50 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                      >
                        <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-sm font-black text-white shadow-md shadow-amber-200">
                          {idx + 1}
                        </span>
                        <p className="text-right text-lg font-bold leading-8 text-slate-800 dark:text-slate-200">
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
      {/* منوی شناور انتخاب متن */}
      {!isCollapsed && clientRect && (
        <ActionMenu
          position={clientRect}
          onFlashcard={handleCreateFlashcard}
          onAskAI={handleAskAI}
        />
      )}
      {/* ✅ مودال ساخت فلش‌کارت (جدید) */}
      <FlashcardModal
        isOpen={isFlashcardModalOpen}
        onClose={() => setIsFlashcardModalOpen(false)}
        initialText={selectedTextForCard} // ✅ تغییر به initialText
        onSave={onSaveFlashcard}
      />
      {/* ✅ مدال چت هوشمند (جدید) */}
      <QuickAiModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        contextText={selectedTextForAi}
        onAsk={handleAiRequest}
      />
    </div>
  )
}
