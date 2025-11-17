"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { IconChevronLeft, IconCalendarPlus } from "@tabler/icons-react"
// ایمپورت کامپوننت‌های سیستم دیزاین جدید
import {
  MaterialCard,
  IconWrapper,
  colorThemes
} from "@/components/material/MaterialUI"

export default function NewExamStep1Page() {
  const router = useRouter()
  const [date, setDate] = useState<Date | undefined>(new Date())

  // تنظیم تم رنگی صفحه (می‌توانید به 'blue', 'pink', 'emerald' تغییر دهید)
  const themeColor = "purple"
  const theme = colorThemes[themeColor]

  const handleNextStep = () => {
    router.push("/upload/new-exam-step-2")
  }

  const handleSkip = () => {
    router.push("/upload/new-exam-step-2")
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
        {/* بدنه اصلی با استایل متریال */}
        <MaterialCard elevation={4} className="overflow-hidden">
          {/* نوار رنگی بالای کارت برای زیبایی */}
          <div className={`h-2 bg-gradient-to-r ${theme.gradient}`} />

          {/* ----- هدر ----- */}
          <div className="flex items-center justify-between p-6 pb-2">
            {/* دکمه بازگشت */}
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              onClick={handleGoBack}
            >
              <IconChevronLeft size={24} />
            </Button>

            {/* عنوان و آیکون */}
            <div className="flex flex-col items-end">
              <div className="mb-1 flex items-center gap-3">
                <h1 className="text-lg font-bold text-slate-800">
                  تاریخ آزمون
                </h1>
                {/* آیکون با پس‌زمینه گرادیانت */}
                <div className="origin-right scale-75">
                  <IconWrapper icon={IconCalendarPlus} color={themeColor} />
                </div>
              </div>
              <p className="mr-1 text-xs text-slate-500">
                زمان برگزاری را مشخص کنید
              </p>
            </div>
          </div>

          {/* خط جداکننده ظریف */}
          <div className="mx-6 my-2 h-px bg-slate-100" />

          {/* ----- تقویم ----- */}
          <div className="flex justify-center p-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md bg-white shadow-sm"
                dir="rtl"
              />
            </div>
          </div>

          {/* ----- دکمه‌های پایین ----- */}
          <div className="mt-2 flex w-full items-center justify-between p-6 pt-2">
            <Button
              variant="ghost"
              className="text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              onClick={handleSkip}
            >
              بعداً تنظیم می‌کنم
            </Button>

            <Button
              size="lg"
              onClick={handleNextStep}
              disabled={!date}
              // استایل شرطی دکمه: اگر تاریخ انتخاب شده باشد، گرادیانت می‌گیرد
              className={`
                rounded-xl px-8 shadow-lg transition-all duration-300
                ${
                  !date
                    ? "cursor-not-allowed bg-slate-100 text-slate-400 shadow-none"
                    : `bg-gradient-to-r ${theme.gradient} text-white hover:-translate-y-0.5 hover:shadow-xl`
                }
              `}
            >
              ادامه
            </Button>
          </div>
        </MaterialCard>
      </motion.div>
    </div>
  )
}
