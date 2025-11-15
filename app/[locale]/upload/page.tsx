"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  IconPlus,
  IconChecklist,
  IconLoader2,
  IconClock,
  IconCalendarEvent,
  IconHistory
} from "@tabler/icons-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { ChatbotUIContext } from "@/context/context" // برای لودینگ
import { useContext } from "react"

// --- داده‌های موقت (Mock Data) ---
// TODO: این داده‌ها باید بعداً از Supabase خوانده شوند
const mockUpcomingExams = [
  {
    id: "exam1",
    title: "آزمون میان‌ترم زیست (فصل ۱-۳)",
    date: "2025-11-20T09:00:00" // تاریخ آزمون در آینده
  }
]

const mockPastExams = [
  {
    id: "exam2",
    title: "آزمون جامع فصل ۱ دوازدهم",
    date: "2025-11-10T14:00:00",
    score: 85, // نمره از ۱۰۰
    status: "completed"
  },
  {
    id: "exam3",
    title: "آزمون تستی (گفتار ۲)",
    date: "2025-11-05T08:00:00",
    score: 72,
    status: "completed"
  }
]
// ---------------------------------

// کامپوننت کوچک برای شمارش معکوس
function CountdownTimer({ targetDate }: { targetDate: string }) {
  const calculateTimeLeft = () => {
    const difference = +new Date(targetDate) - +new Date()
    let timeLeft = { days: 0, hours: 0, minutes: 0 }

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60)
      }
    }
    return timeLeft
  }

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft())
    }, 60000) // هر دقیقه آپدیت می‌شه

    return () => clearTimeout(timer)
  }, [timeLeft])

  return (
    <div className="flex justify-center gap-4 text-center">
      <div>
        <div className="text-primary text-3xl font-bold">{timeLeft.days}</div>
        <div className="text-muted-foreground text-xs">روز</div>
      </div>
      <div className="text-primary text-3xl font-bold">:</div>
      <div>
        <div className="text-primary text-3xl font-bold">{timeLeft.hours}</div>
        <div className="text-muted-foreground text-xs">ساعت</div>
      </div>
      <div className="text-primary text-3xl font-bold">:</div>
      <div>
        <div className="text-primary text-3xl font-bold">
          {timeLeft.minutes}
        </div>
        <div className="text-muted-foreground text-xs">دقیقه</div>
      </div>
    </div>
  )
}

export default function ExamPrepPage() {
  const router = useRouter()
  // TODO: از context برای چک کردن لودینگ استفاده کنید (مثل صفحه پروفایل)
  const { profile } = useContext(ChatbotUIContext)
  const [loading, setLoading] = useState(true) // لودینگ موقت

  useEffect(() => {
    // TODO: داده‌های واقعی آزمون‌ها را از Supabase فچ کنید
    // fetchExams(profile.id).then(() => setLoading(false))
    const timer = setTimeout(() => setLoading(false), 500) // شبیه‌سازی لودینگ
    return () => clearTimeout(timer)
  }, [profile])

  const handleCreateNewExam = () => {
    // TODO: این آدرس را به صفحه "ایجاد آزمون" تغییر دهید
    // مثلا: router.push("/upload/new")
    router.push("/upload/new-exam-step-1") // آدرس مثال
  }

  if (loading) {
    return (
      <div className="flex size-full items-center justify-center">
        <IconLoader2 className="animate-spin" size={32} />
      </div>
    )
  }

  return (
    <div
      dir="rtl"
      className="animate-fade-down size-full overflow-y-auto px-4 pb-8 pt-6 md:px-8"
    >
      {/* ----- بخش هدر و دکمه اصلی ----- */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col items-center text-center"
      >
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
          <IconChecklist size={32} />
        </div>
        <h1 className="mb-2 text-3xl font-bold">آماده سازی برای آزمون</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          یک آزمون جدید تعریف کن تا پرسینو برات یک مسیر یادگیری شخصی‌سازی شده و
          سوالات مرتبط بسازه.
        </p>
        <Button
          size="lg"
          className="shadow-primary/30 rounded-full px-8 py-6 text-base font-bold shadow-lg"
          onClick={handleCreateNewExam}
        >
          <IconPlus className="ml-2" size={20} />
          شروع آزمون جدید
        </Button>
      </motion.section>

      {/* ----- بخش آزمون بعدی (شمارش معکوس) ----- */}
      {/* TODO: این بخش فقط اگر آزمون زمان‌بندی شده‌ای وجود داشت نشان داده شود */}
      {mockUpcomingExams.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-primary/30 bg-primary/5 overflow-hidden shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <IconCalendarEvent size={20} className="text-primary" />
                <span>آزمون بعدی شما</span>
              </CardTitle>
              <CardDescription>{mockUpcomingExams[0].title}</CardDescription>
            </CardHeader>
            <CardContent>
              <CountdownTimer targetDate={mockUpcomingExams[0].date} />
            </CardContent>
          </Card>
        </motion.section>
      )}

      {/* ----- بخش تاریخچه آزمون‌ها ----- */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
          <IconHistory size={24} />
          <span>تاریخچه آزمون‌ها</span>
        </h2>
        <div className="space-y-3">
          {/* TODO: این بخش را به داده‌های واقعی از سوپابیس وصل کنید */}
          {mockPastExams.map(exam => (
            <Card
              key={exam.id}
              className="bg-muted/50 hover:bg-muted cursor-pointer transition-all"
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-background flex size-10 items-center justify-center rounded-full">
                    <IconClock size={20} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">{exam.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(exam.date).toLocaleDateString("fa-IR")}
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-primary text-lg font-bold">
                    {exam.score}٪
                  </p>
                  <p className="text-muted-foreground text-xs">نمره کسب شده</p>
                </div>
              </CardContent>
            </Card>
          ))}
          {mockPastExams.length === 0 && (
            <p className="text-muted-foreground text-center">
              هنوز هیچ آزمونی ندادی.
            </p>
          )}
        </div>
      </motion.section>
    </div>
  )
}
