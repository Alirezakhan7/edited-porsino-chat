"use client"

import { motion } from "framer-motion"
import { IconCheck, IconLock, IconStar } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { clsx } from "clsx"
// 1. تغییر مهم: ایمپورت کردن تایپ اصلی از فایل کانفیگ برای هماهنگی ۱۰۰٪
import { ChapterSection } from "@/lib/lessons/config"

interface LessonMapProps {
  chapterId: string
  totalSteps: number
  completedSteps: number
  themeColor: string
  locale: string
  sections?: ChapterSection[]
}

// 2. تغییر مهم: اضافه کردن رنگ‌های جدید به استایل‌های ۳ بعدی
// تایپ کلید را string گذاشتیم تا با رنگ‌های جدید کانفیگ به مشکل نخورد
const theme3DStyles: Record<
  string,
  { bg: string; border: string; shadow: string }
> = {
  emerald: {
    bg: "bg-emerald-500",
    border: "border-emerald-700",
    shadow: "shadow-emerald-500/40"
  },
  blue: {
    bg: "bg-blue-500",
    border: "border-blue-700",
    shadow: "shadow-blue-500/40"
  },
  purple: {
    bg: "bg-violet-500",
    border: "border-violet-700",
    shadow: "shadow-violet-500/40"
  },
  pink: {
    bg: "bg-pink-500",
    border: "border-pink-700",
    shadow: "shadow-pink-500/40"
  },
  // --- رنگ‌های جدید اضافه شده ---
  amber: {
    bg: "bg-amber-400",
    border: "border-amber-600",
    shadow: "shadow-amber-400/40"
  },
  rose: {
    bg: "bg-rose-500",
    border: "border-rose-700",
    shadow: "shadow-rose-500/40"
  },
  cyan: {
    bg: "bg-cyan-500",
    border: "border-cyan-700",
    shadow: "shadow-cyan-500/40"
  }
}

export default function LessonMap({
  chapterId,
  totalSteps,
  completedSteps,
  sections,
  locale
}: LessonMapProps) {
  const router = useRouter()

  const handleStepClick = (stepIndex: number, status: string) => {
    if (status === "locked") return
    router.push(`/${locale}/lesson/${chapterId}/play?step=${stepIndex + 1}`)
  }

  return (
    <div className="relative flex w-full justify-center bg-gray-50 px-4 py-12">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
          backgroundSize: "32px 32px"
        }}
      ></div>

      <div className="relative flex w-full max-w-sm flex-col items-center space-y-12">
        {/* خط وسط */}
        <div className="absolute bottom-12 left-1/2 top-32 z-0 w-4 -translate-x-1/2 rounded-full border-x border-gray-300/50 bg-gray-200" />

        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1

          const currentSection = sections?.find(
            s => stepNumber >= s.startStep && stepNumber <= s.endStep
          )

          // دریافت تم رنگی سکشن (پیش‌فرض emerald)
          const themeKey = currentSection?.theme || "emerald"

          // پیدا کردن استایل ۳ بعدی مربوطه
          // اگر رنگی تعریف نشده بود، به عنوان فال‌بک از emerald استفاده می‌کند
          const current3D = theme3DStyles[themeKey] || theme3DStyles["emerald"]

          const isSectionStart = currentSection?.startStep === stepNumber

          let status: "completed" | "current" | "locked" = "locked"
          if (index < completedSteps) status = "completed"
          else if (index === completedSteps) status = "current"

          // زیگ‌زاگ
          const xOffset = (index % 2 === 0 ? 1 : -1) * 70

          return (
            <div
              key={index}
              className="relative z-10 flex w-full flex-col items-center"
            >
              {/* تیتر گفتار */}
              {isSectionStart && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className={`relative z-20 mb-16 mt-4 max-w-[90%] rounded-3xl border-2 bg-gray-50 px-8 py-4 text-center shadow-[0_10px_30px_rgba(0,0,0,0.04)]`}
                  style={{
                    borderColor: current3D.border
                      .replace("border-", "text-")
                      .replace("700", "500")
                  }} // هک رنگ بردر
                >
                  <h3 className={`text-lg font-black text-gray-700`}>
                    {currentSection?.title}
                  </h3>
                  <div
                    className="absolute -bottom-2.5 left-1/2 size-5 -translate-x-1/2 rotate-45 rounded-sm border-b-2 border-r-2 bg-gray-50"
                    style={{ borderColor: "inherit" }}
                  ></div>
                </motion.div>
              )}

              <div
                style={{ transform: `translateX(${xOffset}px)` }}
                className="group relative"
              >
                {/* دکمه اصلی */}
                <button
                  onClick={() => handleStepClick(index, status)}
                  className={clsx(
                    // استایل‌های پایه
                    "w-24 h-24 rounded-[2.5rem] flex flex-col items-center justify-center transition-all relative z-20 outline-none focus:outline-none tap-highlight-transparent",

                    // --- 1. حالت قفل ---
                    status === "locked" &&
                      "bg-gray-200 border-b-[6px] border-gray-300 text-gray-400 cursor-not-allowed",

                    // --- 2. حالت تکمیل شده (طلایی/زرد) ---
                    status === "completed" &&
                      "bg-amber-400 border-b-[6px] border-amber-600 text-white shadow-xl shadow-amber-500/30 active:border-b-0 active:translate-y-[6px] active:shadow-none",

                    // --- 3. حالت جاری (Current) ---
                    status === "current" &&
                      clsx(
                        current3D.bg,
                        current3D.border,
                        current3D.shadow,
                        "border-b-[6px] text-white shadow-2xl ring-4 ring-offset-4 ring-offset-gray-50 ring-white/50",
                        "active:border-b-0 active:translate-y-[6px] active:shadow-none"
                      )
                  )}
                >
                  {status === "completed" ? (
                    <IconCheck size={40} stroke={4} />
                  ) : status === "locked" ? (
                    <IconLock size={28} />
                  ) : (
                    <IconStar
                      size={44}
                      fill="currentColor"
                      className="animate-pulse text-yellow-300 drop-shadow-md"
                    />
                  )}

                  {/* تاج شروع */}
                  {status === "current" && (
                    <div className="absolute -top-14 left-1/2 z-30 -translate-x-1/2 animate-bounce whitespace-nowrap rounded-2xl border border-gray-100 bg-white px-4 py-2 text-sm font-black text-gray-800 shadow-xl">
                      شروع کنید!
                      <div className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 border-b border-r border-gray-100 bg-white"></div>
                    </div>
                  )}
                </button>

                {/* سایه تیره زیر دکمه */}
                <div
                  className={clsx(
                    "absolute -bottom-4 left-1/2 -translate-x-1/2 w-20 h-4 rounded-[100%] blur-md -z-10 transition-all",
                    status === "current"
                      ? "bg-black/20 scale-100"
                      : "bg-black/5 scale-90"
                  )}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
