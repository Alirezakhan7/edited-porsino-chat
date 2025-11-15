"use client"

import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import {
  IconStar,
  IconCheck,
  IconSparkles,
  IconCards,
  IconFileText,
  IconPencil
} from "@tabler/icons-react"

// --- داده‌های موقت (Mock Data) ---
// TODO: This data should be fetched from Supabase using the `examId` param
const examDetails = {
  id: "abc-123-xyz",
  name: "آزمون جامع فصل ۱ و ۲ دوازدهم",
  date: "2025-11-25T09:00:00",
  targetScore: 90,
  topics: ["فصل ۱: مولکول‌های اطلاعاتی", "فصل ۲: جریان اطلاعات در یاخته"],
  nextSteps: [
    {
      id: "flashcards",
      title: "فلش‌کارت‌های هوشمند",
      description: "بر اساس مفاهیم کلیدی امتحان",
      icon: IconCards
    },
    {
      id: "summary",
      title: "خلاصه‌سازی AI",
      description: "مرور سریع تمام گفتارهای مهم",
      icon: IconFileText
    },
    {
      id: "practice-test",
      title: "آزمون تمرینی",
      description: "شبیه‌سازی سوالات تستی و تشریحی",
      icon: IconPencil
    }
  ]
}
// ---------------------------------

export default function ExamReadyPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.examId as string

  // TODO: Add a loading state and fetch real data using examId

  const handleStart = () => {
    // TODO: Redirect to the first activity, maybe the learning path or flashcards
    router.push(`/path?examId=${examId}`)
  }

  // Format the date for display
  const formattedDate = new Date(examDetails.date).toLocaleDateString("fa-IR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  })

  return (
    <div
      dir="rtl"
      // Using a muted background to make the "soft glow" card pop
      className="animate-fade-down bg-muted/50 size-full overflow-y-auto
                 px-4 pb-8 pt-6 md:px-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="mx-auto max-w-lg"
      >
        {/* ----- هدر ----- */}
        <div className="mb-6 text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-4 flex size-16 items-center justify-center
                       rounded-full bg-gradient-to-br from-blue-500 to-purple-600
                       text-white shadow-lg shadow-blue-500/30"
          >
            <IconSparkles size={32} />
          </motion.div>
          <h1 className="mb-2 text-3xl font-bold">امتحانت رو قراره بترکونی!</h1>
          <p className="text-muted-foreground">
            برنامه مطالعاتی شخصی‌سازی شده شما آماده است.
          </p>
        </div>

        {/* ----- کارت خلاصه آزمون (Soft Glow / Neumorphic-inspired) ----- */}
        <Card
          className="border-primary/10 bg-background relative overflow-hidden
                     border-2 shadow-xl
                     [box-shadow:0_10px_30px_-15px_rgba(0,0,0,0.1),_0_0_60px_-20px_rgba(60,80,255,0.2)]"
        >
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              {examDetails.name}
            </CardTitle>
            <CardDescription>خلاصه‌ی آزمون شما</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* --- جزئیات --- */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/80 rounded-lg p-3">
                <p className="text-muted-foreground text-xs font-semibold">
                  تاریخ امتحان
                </p>
                <p className="font-bold">{formattedDate}</p>
              </div>
              <div className="bg-muted/80 rounded-lg p-3">
                <p className="text-muted-foreground text-xs font-semibold">
                  نمره هدف
                </p>
                <p className="font-bold text-green-500">
                  {examDetails.targetScore}٪
                </p>
              </div>
            </div>

            {/* --- مباحث --- */}
            <div>
              <p className="mb-2 text-sm font-semibold">مباحث کلیدی</p>
              <ul className="space-y-2">
                {examDetails.topics.map((topic, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <IconStar
                      size={16}
                      className="text-yellow-500"
                      fill="currentColor"
                    />
                    <span className="text-sm">{topic}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* ----- بخش "چه کار هایی باید انجام بدی؟" ----- */}
        <section className="mt-8">
          <h2 className="mb-4 text-xl font-semibold">
            چه کار هایی باید انجام بدی؟
          </h2>
          <div className="space-y-3">
            {examDetails.nextSteps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="bg-background flex cursor-pointer items-center
                           gap-4 rounded-xl p-4 shadow-md
                           transition-all hover:scale-[1.02] hover:shadow-lg"
              >
                <div
                  className="flex size-12 items-center justify-center
                             rounded-lg bg-blue-500/10 text-blue-500"
                >
                  <step.icon size={24} />
                </div>
                <div>
                  <h3 className="font-bold">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ----- دکمه "شروع کن" ----- */}
        <div className="mt-8 flex w-full justify-center">
          <Button
            size="lg"
            className="w-full max-w-xs rounded-full bg-blue-600 px-8 py-6 text-base
                       font-bold text-white shadow-lg shadow-blue-500/30
                       hover:bg-blue-700"
            onClick={handleStart}
          >
            شروع کن
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
