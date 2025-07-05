import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"

interface ModernProgressBarProps {
  isGenerating: boolean
  onComplete: () => void
}

// پیام‌های مختلف برای نمایش در هر ۵ ثانیه
const messages = [
  "در حال آماده‌سازی پاسخ...", // 0-4s
  "در حال جستجو در منابع... 🔎", // 5-9s
  "تقریباً آماده است، در حال جمع‌بندی... ✍️", // 10-14s
  "در حال بررسی اطلاعات مرتبط... 🧠", // 15-19s
  "در حال تحلیل دقیق سوال شما... 📊", // 20-24s
  "بازبینی نهایی در حال انجام است... 🔁", // 25-29s
  "در حال تهیه پاسخ نهایی... 📦", // 30-34s
  "آخرین لحظات تا تکمیل پاسخ... ⏳" // 35-39s
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
      // ریست کردن وضعیت
      setProgress(0)
      setLoadingMessage(messages[0])
      setBarClassName("from-cyan-400 to-blue-600")

      const interval = setInterval(() => {
        setProgress(prev => {
          const nextProgress = prev + 5

          // توقف در ۹۵٪
          if (nextProgress >= 95) {
            clearInterval(interval)
            return 95
          }

          // انتخاب پیام متناسب با مرحله
          const index = Math.floor(nextProgress / 12.5) // هر 12.5٪ ≈ ۵ ثانیه
          if (messages[index]) {
            setLoadingMessage(messages[index])
          }

          return nextProgress
        })
      }, 2000) // هر ۲ ثانیه ۵٪

      return () => clearInterval(interval)
    } else {
      // پایان و نمایش پیام نهایی
      setLoadingMessage("پاسخ آماده شد! ✅")
      setBarClassName("from-emerald-400 to-green-600")
      setProgress(100)

      const timer = setTimeout(() => {
        onComplete()
      }, 800)

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
            <span className="font-mono text-xs text-blue-500 dark:text-blue-400">
              %{Math.round(progress)}
            </span>
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
