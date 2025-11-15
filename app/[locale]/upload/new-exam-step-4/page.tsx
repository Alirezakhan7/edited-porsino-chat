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
  IconChecklist
} from "@tabler/icons-react"

// لیست مراحل پردازش که به کاربر نمایش داده می‌شود
const loadingSteps = [
  { text: "در حال آنالیز امتحان شما...", icon: IconFileAnalytics },
  { text: "استخراج مفاهیم کلیدی از فصل‌ها...", icon: IconBrain },
  { text: "طراحی سوالات تستی و تشریحی...", icon: IconChecklist },
  { text: "آماده‌سازی برنامه مطالعاتی...", icon: IconSparkles }
]

export default function NewExamStep4Page() {
  const router = useRouter()
  // State برای نگهداری مرحله فعلی پردازش
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // یک تایمر می‌سازیم که مراحل پردازش را عوض کند
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= loadingSteps.length - 1) {
          clearInterval(interval) // تایمر را متوقف کن
          // شبیه‌سازی اتمام کار و هدایت به صفحه نتیجه
          setTimeout(() => {
            // TODO: کاربر را به صفحه آزمون آماده شده هدایت کنید
            router.push("/upload/exam-ready/some-exam-id")
          }, 1500)
          return prev
        }
        return prev + 1
      })
    }, 2500) // هر 2.5 ثانیه یک مرحله را عوض کن

    return () => clearInterval(interval) // پاکسازی تایمر
  }, [router])

  const handleGoBack = () => {
    router.back() // بازگشت به صفحه قبلی
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
              disabled // در حین پردازش، دکمه بازگشت غیرفعال است
            >
              <IconChevronLeft size={20} />
            </Button>
            <h1 className="text-lg font-bold">در حال ساختن برنامه...</h1>
            <div className="size-8" /> {/* (Placeholder for alignment) */}
          </div>

          {/* ----- بدنه اصلی انیمیشن ----- */}
          <div className="flex flex-col items-center p-8 pt-10">
            {/* آیکون AI انیمیشنی */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="mb-8 flex size-20 items-center justify-center 
                         rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg"
            >
              <IconSparkles size={40} />
            </motion.div>

            {/* عنوان اصلی */}
            <h2 className="mb-6 text-xl font-semibold">
              در حال ساختن برنامه مطالعاتی...
            </h2>

            {/* نوار پیشرفت انیمیشنی (Indeterminate) */}
            <div
              className="bg-muted-foreground/20 relative h-2.5 w-full 
                         overflow-hidden rounded-full"
            >
              <motion.div
                className="via-primary absolute inset-y-0 
                           h-full bg-gradient-to-r from-transparent to-transparent"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </div>

            {/* توضیحات مرحله (که عوض می‌شود) */}
            <div className="mt-6 h-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-muted-foreground flex items-center gap-2 text-sm"
                >
                  <motion.div
                    key={`${currentStep}-icon`}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                  >
                    {/* آیکون مرحله فعلی */}
                    {React.createElement(loadingSteps[currentStep].icon, {
                      size: 16
                    })}
                  </motion.div>
                  <span>{loadingSteps[currentStep].text}</span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
