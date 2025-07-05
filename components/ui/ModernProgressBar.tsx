import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"

interface ModernProgressBarProps {
  isGenerating: boolean
  onComplete: () => void
}

// پیام‌های مختلف برای نمایش در هر مرحله
const messages = [
  "در حال آماده‌سازی پاسخ...", // 0-4 ثانیه
  "در حال جستجو در منابع... 🔎", // 5-9 ثانیه
  "تقریباً آماده است، در حال جمع‌بندی... ✍️" // 10+ ثانیه
]

const ModernProgressBar: React.FC<ModernProgressBarProps> = ({
  isGenerating,
  onComplete
}) => {
  const [progress, setProgress] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState(messages[0])
  const [barClassName, setBarClassName] = useState("from-cyan-400 to-blue-600")

  useEffect(() => {
    if (isGenerating) {
      // ریست کردن وضعیت برای هر بار اجرا
      setProgress(0)
      setLoadingMessage(messages[0])
      setBarClassName("from-cyan-400 to-blue-600") // رنگ اولیه

      const interval = setInterval(() => {
        setProgress(prev => {
          const nextProgress = prev + 5

          // توقف در ۹۵ درصد تا زمان دریافت پاسخ
          if (nextProgress >= 95) {
            clearInterval(interval)
            return 95
          }

          // تغییر پیام بر اساس پیشرفت (هر ۵ ثانیه)
          if (nextProgress >= 50) {
            setLoadingMessage(messages[2])
          } else if (nextProgress >= 25) {
            setLoadingMessage(messages[1])
          }

          return nextProgress
        })
      }, 1000) // هر ثانیه ۵ درصد

      return () => clearInterval(interval)
    } else {
      // پاسخ دریافت شده است
      setLoadingMessage("پاسخ آماده شد! ✅")
      setBarClassName("from-emerald-400 to-green-600") // تغییر رنگ به گرادیانت سبز
      setProgress(100)

      const timer = setTimeout(() => {
        onComplete()
      }, 800) // تاخیر بیشتر برای نمایش کامل شدن و پیام نهایی

      return () => clearTimeout(timer)
    }
  }, [isGenerating, onComplete])

  return (
    <AnimatePresence>
      {isGenerating && (
        <div
          dir="rtl"
          className="mx-auto w-full max-w-sm rounded-lg p-4 transition-all duration-300"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {loadingMessage}
            </span>
            <span className="font-mono text-xs text-blue-500 dark:text-blue-400">{`%${Math.round(progress)}`}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${barClassName}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default ModernProgressBar
