"use client"

import { motion } from "framer-motion"
import { IconCheck, IconLock, IconStar } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { clsx } from "clsx"
import { ChapterSection } from "@/lib/lessons/config"

interface LessonMapProps {
  chapterId: string
  totalSteps: number
  completedSteps: number
  themeColor: string
  locale: string
  sections?: ChapterSection[]
}

const theme3DStyles: Record<
  string,
  { bg: string; border: string; shadow: string; glow: string }
> = {
  emerald: {
    bg: "bg-emerald-500",
    border: "border-emerald-700 dark:border-emerald-800",
    shadow: "shadow-emerald-500/40",
    glow: "ring-emerald-400/50"
  },
  blue: {
    bg: "bg-blue-500",
    border: "border-blue-700 dark:border-blue-800",
    shadow: "shadow-blue-500/40",
    glow: "ring-blue-400/50"
  },
  purple: {
    bg: "bg-violet-500",
    border: "border-violet-700 dark:border-violet-800",
    shadow: "shadow-violet-500/40",
    glow: "ring-violet-400/50"
  },
  pink: {
    bg: "bg-pink-500",
    border: "border-pink-700 dark:border-pink-800",
    shadow: "shadow-pink-500/40",
    glow: "ring-pink-400/50"
  },
  amber: {
    bg: "bg-amber-400",
    border: "border-amber-600 dark:border-amber-700",
    shadow: "shadow-amber-400/40",
    glow: "ring-amber-300/50"
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
    <div className="relative flex w-full justify-center px-4 py-12 transition-colors duration-500">
      {/* --- بافت نقطه‌ای هوشمند (تغییر رنگ در شب) --- */}
      <div
        className="pointer-events-none fixed inset-0 opacity-5 dark:opacity-[0.07]"
        style={{
          backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
          color: "inherit" // در روز سیاه و در شب سفید محو می‌شود
        }}
      />

      <div className="relative flex w-full max-w-sm flex-col items-center space-y-16">
        {/* --- خط مرکزی (تغییر رنگ در شب) --- */}
        <div className="absolute bottom-12 left-1/2 top-32 z-0 w-3 -translate-x-1/2 rounded-full bg-slate-200 shadow-inner dark:bg-slate-800" />

        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1
          const currentSection = sections?.find(
            s => stepNumber >= s.startStep && stepNumber <= s.endStep
          )
          const themeKey = currentSection?.theme || "emerald"
          const current3D = theme3DStyles[themeKey] || theme3DStyles["emerald"]
          const isSectionStart = currentSection?.startStep === stepNumber

          let status: "completed" | "current" | "locked" | "open" = "locked"

          if (index < completedSteps) {
            status = "completed"
          } else if (index === completedSteps) {
            status = "current"
          } else if (isSectionStart) {
            // اگر شروع گفتار باشد، باز می‌شود
            status = "open"
          }

          const xOffset = (index % 2 === 0 ? 1 : -1) * 75

          return (
            <div
              key={index}
              className="relative z-10 flex w-full flex-col items-center"
            >
              {/* --- عنوان گفتار (اصلاح شده برای شب) --- */}
              {isSectionStart && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="relative z-20 mb-16 mt-4 max-w-[90%] rounded-[2rem] border-2 border-slate-200 bg-white/80 px-8 py-4 text-center shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/80"
                >
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                    {currentSection?.title}
                  </h3>
                  <div className="absolute -bottom-2 left-1/2 size-4 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900" />
                </motion.div>
              )}

              <div
                style={{ transform: `translateX(${xOffset}px)` }}
                className="group relative"
              >
                {/* --- دکمه مرحله --- */}
                <button
                  onClick={() => handleStepClick(index, status)}
                  className={clsx(
                    "w-24 h-24 rounded-[2.5rem] flex flex-col items-center justify-center transition-all relative z-20 outline-none",

                    // ۱. حالت قفل
                    status === "locked" &&
                      "bg-slate-200 border-b-[6px] border-slate-300 text-slate-400 dark:bg-slate-800 dark:border-slate-900 dark:text-slate-600 cursor-not-allowed",

                    // ۲. حالت تکمیل شده (طلایی)
                    status === "completed" &&
                      "bg-amber-400 border-b-[6px] border-amber-600 text-white shadow-lg shadow-amber-500/20 active:border-b-0 active:translate-y-[6px]",

                    // ۳. حالت جاری (Current)
                    // ۳. حالت جاری (Current)
                    status === "current" &&
                      clsx(
                        current3D.bg,
                        current3D.border,
                        current3D.shadow,
                        "border-b-[6px] text-white shadow-2xl ring-4 ring-white/50 dark:ring-slate-800/50",
                        "active:border-b-0 active:translate-y-[6px]"
                      ),

                    // ۴. (جدید) حالت باز برای شروع گفتار
                    status === "open" &&
                      clsx(
                        current3D.bg,
                        current3D.border,
                        "opacity-90 hover:opacity-100 border-b-[6px] text-white shadow-md cursor-pointer",
                        "active:border-b-0 active:translate-y-[6px]"
                      )
                  )}
                >
                  {status === "completed" ? (
                    <IconCheck size={42} stroke={4} />
                  ) : status === "locked" ? (
                    <IconLock size={30} />
                  ) : status === "open" ? (
                    // آیکون برای حالت باز شده (ستاره کوچک)
                    <IconStar size={32} fill="white" className="opacity-80" />
                  ) : (
                    <IconStar
                      size={46}
                      fill="currentColor"
                      className="animate-pulse text-yellow-200 drop-shadow-md"
                    />
                  )}

                  {/* --- نشان "شروع کنید" --- */}
                  {status === "current" && (
                    <div className="absolute -top-14 left-1/2 z-30 -translate-x-1/2 animate-bounce whitespace-nowrap rounded-2xl border border-slate-100 bg-white px-5 py-2 text-sm font-black text-slate-800 shadow-2xl dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                      شروع کنید!
                      <div className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 border-b border-r border-slate-100 bg-white dark:border-slate-700 dark:bg-slate-800" />
                    </div>
                  )}
                </button>

                {/* سایه تیره زیر دکمه */}
                <div
                  className={clsx(
                    "absolute -bottom-5 left-1/2 -translate-x-1/2 w-20 h-5 rounded-[100%] blur-xl -z-10 opacity-30 dark:opacity-50 transition-all",
                    status === "current" ? "bg-black" : "bg-black/10"
                  )}
                />
              </div>
            </div>
          )
        })}
      </div>

      <style jsx global>{`
        .tap-highlight-transparent {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
    </div>
  )
}
