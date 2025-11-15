"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { IconChevronLeft, IconCalendarPlus } from "@tabler/icons-react"

export default function NewExamStep1Page() {
  const router = useRouter()
  // یک state برای نگهداری تاریخ انتخابی
  const [date, setDate] = useState<Date | undefined>(new Date())

  const handleNextStep = () => {
    // TODO: تاریخ انتخاب شده را به مرحله بعد ارسال کنید
    // مثلا: router.push(`/upload/new-exam-step-2?date=${date?.toISOString()}`)
    router.push("/upload/new-exam-step-2") // (آدرس مرحله بعد)
  }

  const handleSkip = () => {
    // اگر کاربر رد کرد، بدون تاریخ به مرحله بعد می‌رویم
    router.push("/upload/new-exam-step-2") // (آدرس مرحله بعد)
  }

  const handleGoBack = () => {
    router.back() // بازگشت به صفحه هاب آزمون (/upload)
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
          - backdrop-blur-lg: برای افکت مات‌شدن پس‌زمینه
          - bg-muted/20: یک پس‌زمینه نیمه‌شفاف (20% opacity)
          - border border-muted-foreground/30: یک نوار مرزی ظریف
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
            <h1 className="text-lg font-bold">تاریخ امتحان رو مشخص کن</h1>
            <IconCalendarPlus size={24} className="text-primary" />
          </div>

          {/* ----- تقویم ----- */}
          <div className="p-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md"
              dir="rtl" // اطمینان از راست‌چین بودن خود تقویم
            />
          </div>
        </div>

        {/* ----- دکمه‌های پایین ----- */}
        <div className="mt-6 flex w-full items-center justify-between">
          <Button
            variant="link"
            className="text-muted-foreground"
            onClick={handleSkip}
          >
            رد کردن
          </Button>

          <Button
            size="lg"
            className="shadow-primary/30 rounded-full px-8 shadow-lg"
            onClick={handleNextStep}
            disabled={!date} // اگر تاریخی انتخاب نشده، دکمه غیرفعال است
          >
            ادامه
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
