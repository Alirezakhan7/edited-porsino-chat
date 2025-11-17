"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { motion, useTransform, useSpring } from "framer-motion"
import { IconChevronLeft, IconTargetArrow } from "@tabler/icons-react"

// ایمپورت طبق مسیر درخواستی شما
import {
  MaterialCard,
  IconWrapper,
  colorThemes
} from "@/components/material/MaterialUI"

export default function NewExamStep2Page() {
  const router = useRouter()
  const [score, setScore] = useState(75)

  // تنظیم تم رنگی (برای هدف‌گذاری رنگ سبز/زمردی مناسب است)
  const themeColor = "emerald"
  const theme = colorThemes[themeColor]

  // --- تنظیمات انیمیشن دایره ---
  const springScore = useSpring(score, {
    stiffness: 100,
    damping: 20
  })

  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = useTransform(
    springScore,
    [0, 100],
    [circumference, 0]
  )
  // -----------------------------

  const handleSliderChange = (value: number[]) => {
    setScore(value[0])
    springScore.set(value[0])
  }

  const handleNextStep = () => {
    router.push("/upload/new-exam-step-3")
  }

  const handleGoBack = () => {
    router.back()
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
        {/* استفاده از MaterialCard برای هماهنگی با سایر صفحات */}
        <MaterialCard elevation={4} className="overflow-hidden">
          {/* نوار رنگی بالای کارت */}
          <div className={`h-2 bg-gradient-to-r ${theme.gradient}`} />

          {/* ----- هدر ----- */}
          <div className="flex items-center justify-between p-6 pb-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              onClick={handleGoBack}
            >
              <IconChevronLeft size={24} />
            </Button>

            <div className="flex flex-col items-end">
              <div className="mb-1 flex items-center gap-3">
                <h1 className="text-lg font-bold text-slate-800">نمره هدف</h1>
                {/* آیکون با رپر جدید */}
                <div className="origin-right scale-75">
                  <IconWrapper icon={IconTargetArrow} color={themeColor} />
                </div>
              </div>
              <p className="mr-1 text-xs text-slate-500">
                چه نمره‌ای مد نظر شماست؟
              </p>
            </div>
          </div>

          {/* خط جداکننده */}
          <div className="mx-6 my-2 h-px bg-slate-100" />

          {/* ----- بدنه اصلی: دایره و اسلایدر ----- */}
          <div className="flex flex-col items-center p-6 py-8">
            {/* نمایشگر دایره‌ای */}
            <div className="relative mb-8 size-48">
              {/* متن درصد در مرکز */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  key={score}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-start text-5xl font-black text-slate-800"
                >
                  {score}
                  <span
                    className={`mr-1 mt-1 text-2xl font-bold ${theme.text}`}
                  >
                    ٪
                  </span>
                </motion.span>
                <span className="mt-1 text-xs font-medium text-slate-400">
                  هدف نهایی
                </span>
              </div>

              {/* SVG */}
              <svg
                className="size-full -rotate-90 drop-shadow-md"
                viewBox="0 0 100 100"
              >
                {/* حلقه پس‌زمینه */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  className="text-slate-100"
                  strokeWidth="8"
                  fill="transparent"
                />

                {/* حلقه پیشرفت متحرک */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="url(#themeGradient)" // ارجاع به گرادیانت تعریف شده در پایین
                  strokeWidth="8"
                  fill="transparent"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  style={{ strokeDashoffset: strokeDashoffset }}
                />

                {/* تعریف گرادیانت بر اساس تم Emerald */}
                <defs>
                  <linearGradient
                    id="themeGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    {/* رنگ‌های متناظر با emerald-500 و emerald-700 */}
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#047857" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* اسلایدر */}
            <div className="w-full px-4">
              <div className="mb-2 flex justify-between text-xs font-medium text-slate-400">
                <span>۰٪</span>
                <span>۱۰۰٪</span>
              </div>
              <Slider
                value={[score]}
                onValueChange={handleSliderChange}
                max={100}
                step={1}
                className="w-full cursor-pointer"
              />
            </div>
          </div>

          {/* ----- فوتر و دکمه ----- */}
          <div className="p-6 pt-0">
            <Button
              size="lg"
              onClick={handleNextStep}
              className={`
                    h-12 w-full rounded-xl bg-gradient-to-r text-base font-bold shadow-lg transition-all
                    duration-300 ${theme.gradient} 
                    text-white hover:-translate-y-0.5 hover:shadow-xl
                `}
            >
              ثبت هدف و ادامه
            </Button>
          </div>
        </MaterialCard>
      </motion.div>
    </div>
  )
}
