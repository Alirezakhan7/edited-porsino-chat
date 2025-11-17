"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import {
  IconChevronLeft,
  IconSparkles,
  IconFileAnalytics,
  IconBrain,
  IconChecklist,
  IconCpu
} from "@tabler/icons-react"

// ایمپورت طبق مسیر درخواستی شما
import {
  MaterialCard,
  IconWrapper,
  colorThemes
} from "@/components/material/MaterialUI"

// لیست مراحل پردازش
const loadingSteps = [
  { text: "در حال آنالیز ساختار کتاب...", icon: IconFileAnalytics },
  { text: "استخراج مفاهیم کلیدی فصل‌ها...", icon: IconBrain },
  { text: "طراحی سوالات بر اساس سطح شما...", icon: IconChecklist },
  { text: "نهایی‌سازی برنامه مطالعاتی...", icon: IconSparkles }
]

export default function NewExamStep4Page() {
  const router = useRouter()

  // تنظیم تم رنگی (بنفش برای AI و پردازش)
  const themeColor = "purple"
  const theme = colorThemes[themeColor]

  const [currentStep, setCurrentStep] = useState(0)
  // محاسبه درصد پیشرفت بر اساس مرحله فعلی
  const progressPercent = ((currentStep + 1) / loadingSteps.length) * 100

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= loadingSteps.length - 1) {
          clearInterval(interval)
          setTimeout(() => {
            // هدایت به صفحه بعد
            router.push("/upload/exam-ready/some-exam-id")
          }, 1000)
          return prev
        }
        return prev + 1
      })
    }, 2000) // سرعت تعویض مراحل

    return () => clearInterval(interval)
  }, [router])

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
        <MaterialCard elevation={4} className="overflow-hidden">
          {/* نوار رنگی بالای کارت */}
          <div className={`h-2 bg-gradient-to-r ${theme.gradient}`} />

          {/* ----- هدر ----- */}
          <div className="flex items-center justify-between p-6 pb-2">
            <Button
              variant="ghost"
              size="icon"
              disabled={true} // دکمه بازگشت در حین پردازش غیرفعال است
              className="cursor-not-allowed text-slate-300"
            >
              <IconChevronLeft size={24} />
            </Button>

            <div className="flex flex-col items-end">
              <div className="mb-1 flex items-center gap-3">
                <h1 className="text-lg font-bold text-slate-800">هوش مصنوعی</h1>
                {/* آیکون با رپر جدید */}
                <div className="origin-right scale-75">
                  <IconWrapper icon={IconCpu} color={themeColor} />
                </div>
              </div>
              <p className="mr-1 text-xs text-slate-500">
                درحال آماده‌سازی آزمون...
              </p>
            </div>
          </div>

          {/* خط جداکننده */}
          <div className="mx-6 my-2 h-px bg-slate-100" />

          {/* ----- بدنه اصلی انیمیشن ----- */}
          <div className="flex flex-col items-center p-8 pb-12 pt-10">
            {/* آیکون مرکزی با افکت تپش */}
            <div className="relative mb-10">
              {/* حلقه‌های متحرک پشت آیکون */}
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className={`absolute inset-0 rounded-full bg-purple-200 opacity-50 blur-xl`}
              />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className={`relative z-10 flex size-24 items-center justify-center rounded-full bg-gradient-to-br ${theme.gradient} shadow-xl shadow-purple-200`}
              >
                <IconSparkles size={48} className="text-white" />
              </motion.div>
            </div>

            {/* تایتل وضعیت */}
            <h2 className="mb-6 animate-pulse text-lg font-bold text-slate-700">
              لطفاً شکیبا باشید...
            </h2>

            {/* نوار پیشرفت */}
            <div className="mb-6 w-full">
              <div className="mb-2 flex justify-between text-xs font-semibold text-slate-500">
                <span>پیشرفت</span>
                <span>{Math.round(progressPercent)}٪</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  className={`h-full bg-gradient-to-r ${theme.gradient}`}
                  initial={{ width: "0%" }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* توضیحات مرحله (با انیمیشن تغییر متن) */}
            <div className="flex h-8 w-full justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-center gap-2 text-sm font-medium ${theme.text}`}
                >
                  {React.createElement(loadingSteps[currentStep].icon, {
                    size: 18
                  })}
                  <span>{loadingSteps[currentStep].text}</span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </MaterialCard>
      </motion.div>
    </div>
  )
}
