import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useMemo, useRef, useState } from "react"

interface ModernProgressBarProps {
  isGenerating: boolean
  phase: "idle" | "connecting" | "streaming" | "stalled" | "offline" | "done"
  startedAt?: number | null
  lastByteAt?: number | null
  softSlaMs?: number
  onComplete: () => void
  onRetry?: () => void
}

const baseMessages = {
  connecting: "در حال اتصال به سرور...",
  streaming: "در حال تولید پاسخ...",
  stalled: "سرعت دریافت پایین است؛ همچنان در حال دریافت...",
  offline: "اتصال به سرور قطع شد",
  done: "پاسخ آماده شد! ✅"
}

// پیام‌های مرحله‌ای قبلی‌ات را هم نگه می‌داریم
const stagedMessages = [
  "در حال آماده‌سازی پاسخ...",
  "در حال جستجو در منابع... 🔎",
  "تقریباً آماده است، در حال جمع‌بندی... ✍️",
  "در حال بررسی اطلاعات مرتبط... 🧠",
  "در حال تحلیل دقیق سوال شما... 📊",
  "بازبینی نهایی در حال انجام است... 🔁",
  "در حال تهیه پاسخ نهایی... 📦",
  "آخرین لحظات تا تکمیل پاسخ... ⏳"
]

export default function ModernProgressBar({
  isGenerating,
  phase,
  startedAt,
  lastByteAt,
  softSlaMs = 40000,
  onComplete,
  onRetry
}: ModernProgressBarProps) {
  const [progress, setProgress] = useState(0)
  const [msg, setMsg] = useState(baseMessages.connecting)
  const [barClassName, setBarClassName] = useState("from-cyan-400 to-blue-600")
  const tickRef = useRef<number | null>(null)

  const elapsedMs = useMemo(() => {
    if (!startedAt) return 0
    return Date.now() - startedAt
  }, [startedAt, phase, lastByteAt, isGenerating]) // هر تغییر فاز/داده باعث رندر می‌شود

  useEffect(() => {
    if (!isGenerating && phase !== "offline") {
      setMsg(baseMessages.done)
      setBarClassName("from-emerald-400 to-green-600")
      setProgress(100)
      const t = setTimeout(onComplete, 800)
      return () => clearTimeout(t)
    }

    // ریست زمانی سناریو جدید شروع می‌شود
    setMsg(baseMessages.connecting)
    setBarClassName("from-cyan-400 to-blue-600")
    setProgress(0)

    // تیک متناوب برای آپدیت پیشرفت
    const id = window.setInterval(() => {
      setProgress(prev => {
        // منطق پیشرفت بر اساس فاز
        if (phase === "connecting") {
          // از 0 تا 20%
          const next = Math.min(prev + 1.5, 20)
          return next
        }

        if (phase === "streaming") {
          // اگر طولانی شد، پیام اضافه بده
          if (elapsedMs > softSlaMs) {
            setMsg("هنوز در حال تولید پاسخ هستم؛ کمی بیشتر زمان می‌برد…")
          } else {
            // پیام‌های مرحله‌ای‌ات بر اساس زمان
            const idx = Math.min(
              Math.floor(elapsedMs / 5000),
              stagedMessages.length - 1
            )
            setMsg(stagedMessages[idx] ?? baseMessages.streaming)
          }
          // تا 95%
          const next = Math.min(prev + 2.5, 95)
          return next
        }

        if (phase === "stalled") {
          setMsg(baseMessages.stalled)
          // خیلی کند جلو بره تا 95%
          const next = Math.min(prev + 0.3, 95)
          return next
        }

        if (phase === "offline") {
          setMsg(baseMessages.offline)
          // حرکت نکنه
          return prev
        }

        // done → این بلاک عملاً توسط isGenerating=false هندل می‌شود
        return prev
      })
    }, 800)

    tickRef.current = id
    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [isGenerating, phase, elapsedMs, softSlaMs, onComplete])

  return (
    <AnimatePresence>
      {(isGenerating || phase === "offline") && (
        <div dir="rtl" className="mx-auto w-full max-w-sm rounded-lg p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {msg}
            </span>

            {phase === "offline" && onRetry ? (
              <button
                onClick={onRetry}
                className="rounded-md border px-2 py-1 text-xs text-red-600 dark:text-red-400"
              >
                تلاش مجدد
              </button>
            ) : (
              <span className="font-mono text-xs text-blue-500 dark:text-blue-400">
                %{Math.round(progress)}
              </span>
            )}
          </div>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${barClassName}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
          </div>

          {phase === "offline" && (
            <p className="mt-2 text-right text-xs text-red-600 dark:text-red-400">
              اینترنت یا سرور در دسترس نیست.
              {onRetry ? " روی «تلاش مجدد» بزنید." : ""}
            </p>
          )}
        </div>
      )}
    </AnimatePresence>
  )
}
