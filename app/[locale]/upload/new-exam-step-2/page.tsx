"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Slider } from "@/components/ui/slider" // اسلایدر خطی
import { Button } from "@/components/ui/button"
import { motion, useTransform, useSpring } from "framer-motion"
import { IconChevronLeft, IconTargetArrow } from "@tabler/icons-react"

export default function NewExamStep2Page() {
  const router = useRouter()
  // state برای نمره. پیش‌فرض را روی 75% می‌گذاریم
  const [score, setScore] = useState(75)

  // --- تنظیمات انیمیشن دایره ---
  // یک motion value می‌سازیم که انیمیشن نرمی داشته باشد
  const springScore = useSpring(score, {
    stiffness: 100,
    damping: 20
  })

  // این متغیر، مقدار 0 تا 100 را به محیط دایره (حدود 283) مپ می‌کند
  const circumference = 2 * Math.PI * 45 // (2 * pi * radius)
  const strokeDashoffset = useTransform(
    springScore,
    [0, 100],
    [circumference, 0] // از محیط کامل به 0
  )
  // -----------------------------

  // وقتی کاربر اسلایدر را حرکت می‌دهد، هر دو state را آپدیت می‌کنیم
  const handleSliderChange = (value: number[]) => {
    setScore(value[0])
    springScore.set(value[0])
  }

  const handleNextStep = () => {
    // TODO: نمره انتخاب شده را به مرحله بعد ارسال کنید
    router.push("/upload/new-exam-step-3") // (آدرس مرحله بعد)
  }

  const handleGoBack = () => {
    router.back() // بازگشت به صفحه انتخاب تاریخ
  }

  return (
    <div
      dir="rtl"
      className="animate-fade-down flex size-full flex-col items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="relative w-full max-w-md"
      >
        {/*
          ❄️ المان شیشه مات (Frosted Glass) ❄️
        */}
        <div
          className="border-muted-foreground/30 bg-muted/20 w-full overflow-hidden rounded-2xl 
                     border shadow-xl backdrop-blur-lg"
        >
          {/* ----- هدر ----- */}
          <div className="border-muted-foreground/30 flex items-center justify-between border-b p-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
              onClick={handleGoBack}
            >
              <IconChevronLeft size={20} />
            </Button>
            <h1 className="text-lg font-bold">هدفت اینه چه نمره ای بگیری؟</h1>
            <IconTargetArrow size={24} className="text-primary" />
          </div>

          {/* ----- بخش دایره و اسلایدر ----- */}
          <div className="flex flex-col items-center p-6 pt-10">
            {/* نمایشگر دایره‌ای */}
            <div className="relative size-48">
              {/* متن درصد در مرکز */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.span
                  key={score} // این باعث انیمیشن مجدد با هر تغییر می‌شود
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-5xl font-bold text-white"
                >
                  {score}
                  <span className="text-3xl text-green-400">%</span>
                </motion.span>
              </div>

              {/* SVG برای حلقه‌ها */}
              <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                {/* حلقه پس‌زمینه (خاکستری) */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  className="text-muted-foreground/20"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* حلقه پیشرفت (Neon Green) */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="url(#neonGreenGradient)" // استفاده از گرادینت
                  strokeWidth="8"
                  fill="transparent"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  style={{ strokeDashoffset: strokeDashoffset }}
                />
                {/* تعریف گرادینت Neon Green */}
                <defs>
                  <linearGradient id="neonGreenGradient">
                    <stop offset="0%" stopColor="#34d399" /> {/* emerald-500 */}
                    <stop offset="100%" stopColor="#a7f3d0" />{" "}
                    {/* emerald-200 */}
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* اسلایدر خطی */}
            <Slider
              value={[score]}
              onValueChange={handleSliderChange}
              max={100}
              step={1}
              className="mt-10 w-full"
            />
          </div>
        </div>

        {/* ----- دکمه ادامه ----- */}
        <div className="mt-6 flex w-full justify-center">
          <Button
            size="lg"
            className="w-full max-w-xs rounded-full bg-blue-600 px-8 py-6 text-base 
                       font-bold text-white shadow-lg shadow-blue-500/30
                       hover:bg-blue-700"
            onClick={handleNextStep}
          >
            ادامه
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
