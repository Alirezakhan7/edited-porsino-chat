"use client"

import { useState, useEffect, useContext } from "react"
import { useRouter } from "next/navigation"
import {
  IconPlus,
  IconChecklist,
  IconLoader2,
  IconClock,
  IconCalendarEvent,
  IconHistory,
  IconTrophy,
  IconTrendingUp
} from "@tabler/icons-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChatbotUIContext } from "@/context/context"

// ایمپورت طبق مسیر درخواستی شما
import {
  MaterialCard,
  IconWrapper,
  RippleButton,
  colorThemes
} from "@/components/material/MaterialUI"

// --- داده‌های موقت (Mock Data) ---
const mockUpcomingExams = [
  {
    id: "exam1",
    title: "آزمون میان‌ترم زیست",
    subtitle: "فصل ۱ تا ۳ • پایه دهم",
    date: "2025-11-25T09:00:00" // تاریخ آزمون در آینده
  }
]

const mockPastExams = [
  {
    id: "exam2",
    title: "آزمون جامع فصل ۱",
    date: "2025-11-10T14:00:00",
    score: 85,
    totalQuestions: 20,
    status: "completed"
  },
  {
    id: "exam3",
    title: "آزمون گفتار ۲",
    date: "2025-11-05T08:00:00",
    score: 45,
    totalQuestions: 15,
    status: "completed"
  }
]
// ---------------------------------

// کامپوننت شمارش معکوس با استایل جدید
function CountdownTimer({ targetDate }: { targetDate: string }) {
  const calculateTimeLeft = () => {
    const difference = +new Date(targetDate) - +new Date()
    let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 }

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      }
    }
    return timeLeft
  }

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000) // هر ثانیه آپدیت

    return () => clearInterval(timer)
  }, [])

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="mb-1 flex size-14 items-center justify-center rounded-xl border border-white/50 bg-white/60 shadow-sm backdrop-blur-sm sm:size-16">
        <span className="text-xl font-black text-pink-600 sm:text-2xl">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-xs font-medium text-pink-800/70">{label}</span>
    </div>
  )

  return (
    <div className="flex items-start justify-center gap-3 sm:gap-4" dir="rtl">
      <TimeUnit value={timeLeft.days} label="روز" />
      <span className="mt-4 text-2xl font-bold text-pink-400">:</span>
      <TimeUnit value={timeLeft.hours} label="ساعت" />
      <span className="mt-4 text-2xl font-bold text-pink-400">:</span>
      <TimeUnit value={timeLeft.minutes} label="دقیقه" />
      <span className="mt-4 hidden text-2xl font-bold text-pink-400 sm:block">
        :
      </span>
      <TimeUnit value={timeLeft.seconds} label="ثانیه" />
    </div>
  )
}

export default function ExamPrepPage() {
  const router = useRouter()
  const { profile } = useContext(ChatbotUIContext)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [profile])

  const handleCreateNewExam = () => {
    router.push("/upload/new-exam-step-1")
  }

  if (loading) {
    return (
      <div className="flex size-full flex-col items-center justify-center gap-4">
        <IconLoader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-sm font-medium text-slate-500">درحال بارگذاری...</p>
      </div>
    )
  }

  return (
    <div
      dir="rtl"
      className="animate-fade-down size-full overflow-y-auto px-4 pb-8 pt-6 md:px-8"
    >
      {/* ----- بخش هدر و CTA ----- */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 flex flex-col items-center text-center"
      >
        {/* آیکون بزرگ */}
        <div className="mb-6 scale-125">
          <IconWrapper icon={IconChecklist} color="blue" />
        </div>

        <h1 className="mb-3 text-3xl font-black text-slate-800">
          آماده سازی برای آزمون
        </h1>
        <p className="mb-8 max-w-md px-4 text-sm leading-6 text-slate-500">
          یک آزمون جدید تعریف کن تا پرسینو برات یک مسیر یادگیری شخصی‌سازی شده و
          سوالات مرتبط بسازه.
        </p>

        <RippleButton
          onClick={handleCreateNewExam}
          className="group rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-white shadow-xl shadow-blue-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
        >
          <span className="flex items-center gap-3 text-lg font-bold">
            <IconPlus
              strokeWidth={3}
              size={20}
              className="transition-transform group-hover:rotate-90"
            />
            شروع آزمون جدید
          </span>
        </RippleButton>
      </motion.section>

      {/* ----- بخش آزمون بعدی (Countdown) ----- */}
      {mockUpcomingExams.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto mb-10 max-w-2xl"
        >
          <div className="mb-4 flex items-center gap-2 px-2">
            <IconCalendarEvent className="text-pink-600" size={24} />
            <h2 className="text-xl font-bold text-slate-800">رویداد پیش‌رو</h2>
          </div>

          <MaterialCard elevation={4} className="relative overflow-hidden">
            {/* پس‌زمینه تزئینی */}
            <div className="absolute left-0 top-0 -z-10 size-full bg-gradient-to-br from-pink-50 to-rose-50 opacity-50"></div>
            <div className="h-2 bg-gradient-to-r from-pink-500 to-rose-600" />

            <div className="relative z-10 p-6 text-center sm:p-8">
              <h3 className="mb-1 text-2xl font-black text-slate-800">
                {mockUpcomingExams[0].title}
              </h3>
              <p className="mb-8 inline-block rounded-full bg-pink-100 px-3 py-1 text-sm font-medium text-pink-600">
                {mockUpcomingExams[0].subtitle}
              </p>

              <CountdownTimer targetDate={mockUpcomingExams[0].date} />

              <div className="mt-8 flex justify-center border-t border-pink-100 pt-6">
                {/* اصلاح شده: استفاده از کلاس‌های دستی به جای variant="outline" */}
                <Button className="border border-pink-200 bg-transparent text-pink-600 shadow-none transition-colors hover:bg-pink-50 hover:text-pink-700">
                  جزئیات و منابع آزمون
                </Button>
              </div>
            </div>
          </MaterialCard>
        </motion.section>
      )}

      {/* ----- بخش تاریخچه آزمون‌ها ----- */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mx-auto max-w-2xl"
      >
        <div className="mb-4 flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <IconHistory className="text-slate-600" size={24} />
            <h2 className="text-xl font-bold text-slate-800">
              تاریخچه آزمون‌ها
            </h2>
          </div>
          {/* اصلاح شده: استفاده از کلاس‌های دستی به جای variant="ghost" و size="sm" */}
          <Button className="h-8 bg-transparent px-3 text-xs text-slate-400 shadow-none hover:bg-slate-100 hover:text-slate-600">
            مشاهده همه
          </Button>
        </div>

        <div className="space-y-4">
          {mockPastExams.map((exam, index) => {
            const isGoodScore = exam.score >= 50
            return (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <MaterialCard
                  elevation={1}
                  className="group flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-blue-50/30"
                >
                  <div className="flex items-center gap-4">
                    {/* آیکون وضعیت نمره */}
                    <div
                      className={`
                                flex size-12 items-center justify-center rounded-xl shadow-sm
                                ${isGoodScore ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"}
                            `}
                    >
                      {isGoodScore ? (
                        <IconTrophy size={24} />
                      ) : (
                        <IconTrendingUp size={24} />
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 transition-colors group-hover:text-blue-700">
                        {exam.title}
                      </h4>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <IconClock size={14} />
                          {new Date(exam.date).toLocaleDateString("fa-IR")}
                        </span>
                        <span className="size-1 rounded-full bg-slate-300"></span>
                        <span>{exam.totalQuestions} سوال</span>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-[80px] text-left">
                    <div className="mb-1 flex items-center justify-end gap-1">
                      <span
                        className={`text-xl font-black ${isGoodScore ? "text-emerald-600" : "text-orange-500"}`}
                      >
                        {exam.score}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        ٪
                      </span>
                    </div>
                    {/* نوار پیشرفت کوچک */}
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${isGoodScore ? "bg-emerald-500" : "bg-orange-500"}`}
                        style={{ width: `${exam.score}%` }}
                      />
                    </div>
                  </div>
                </MaterialCard>
              </motion.div>
            )
          })}

          {mockPastExams.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
              <IconHistory className="mx-auto mb-2 text-slate-300" size={48} />
              <p className="font-medium text-slate-500">
                هنوز هیچ آزمونی ندادی.
              </p>
              <p className="mt-1 text-sm text-slate-400">
                اولین آزمون خودت رو بساز!
              </p>
            </div>
          )}
        </div>
      </motion.section>
    </div>
  )
}
