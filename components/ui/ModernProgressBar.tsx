import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"

interface ModernProgressBarProps {
  isGenerating: boolean
  onComplete: () => void // تابعی که پس از پایان انیمیشن فراخوانی می‌شود
}

const ModernProgressBar: React.FC<ModernProgressBarProps> = ({
  isGenerating,
  onComplete
}) => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isGenerating) {
      setProgress(100) // اگر پاسخ دریافت شد، نوار را کامل کن
      const timer = setTimeout(() => {
        onComplete()
      }, 500) // یک تاخیر کوتاه برای نمایش کامل شدن نوار
      return () => clearTimeout(timer)
    }

    setProgress(0)
    // شبیه‌سازی پیشرفت در طول زمان
    // 95% پیشرفت در 18 ثانیه تا کاربر حس کند که کار در حال انجام است
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval)
          return 95
        }
        return prev + 5
      })
    }, 1000) // هر ثانیه ۵ درصد پر می‌شود

    return () => clearInterval(interval)
  }, [isGenerating, onComplete])

  return (
    <AnimatePresence>
      {isGenerating && (
        <div dir="rtl" className="mx-auto w-full max-w-sm rounded-lg p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              در حال آماده‌سازی پاسخ
            </span>
            <span className="font-mono text-xs text-blue-500">{`%${Math.round(progress)}`}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default ModernProgressBar
