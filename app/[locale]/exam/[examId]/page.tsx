"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Progress } from "@/components/ui/progress"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  IconLayoutDashboard,
  IconChartBar,
  IconLock,
  IconPlayerPlay,
  IconCheck,
  IconCalendarEvent,
  IconTargetArrow,
  IconFlame,
  IconBook
} from "@tabler/icons-react"
import Image from "next/image" // برای آواتار

// --- داده‌های موقت (Mock Data) ---
// TODO: این داده‌ها باید از Supabase بر اساس `params.examId` فچ شوند
const examData = {
  title: "زیست شناسی دوازدهم",
  testDate: "2025-11-25T09:00:00",
  targetScore: 90,
  masteryPercent: 15,
  streak: 0,
  completedLessons: 2,
  totalLessons: 16,
  topics: [
    {
      id: "t1",
      title: "فصل ۱: مولکول‌های اطلاعاتی",
      status: "active",
      icon: IconPlayerPlay
    },
    {
      id: "t2",
      title: "فصل ۲: جریان اطلاعات",
      status: "locked",
      icon: IconLock
    },
    {
      id: "t3",
      title: "فصل ۳: انتقال اطلاعات",
      status: "locked",
      icon: IconLock
    },
    { id: "t4", title: "فصل ۴: مهندسی ژنتیک", status: "locked", icon: IconLock }
  ]
}

// TODO: آواتار کاربر باید از `ChatbotUIContext` خوانده شود
const userAvatar = "/default-avatar.png" // (آدرس آواتار پیش‌فرض)
// ---------------------------------

// کامپوننت کوچک انتخابگر روز (شبیه‌سازی شده)
function WeekDaySelector() {
  const days = ["شنبه", "۱ش", "۲ش", "۳ش", "۴ش", "۵ش", "جمعه"]
  const todayIndex = new Date().getDay() + 1 // (شنبه=0, جمعه=6) -> (شنبه=1, جمعه=7)
  return (
    <div className="flex justify-between gap-2">
      {days.map((day, index) => (
        <Button
          key={day}
          variant={index === todayIndex - 1 ? "default" : "outline"}
          className={`border-muted-foreground/30 bg-muted/20 flex h-12 w-full flex-col gap-1
                     rounded-lg backdrop-blur-sm
                     ${
                       index === todayIndex - 1
                         ? "border-primary/50 bg-primary/20 text-primary"
                         : ""
                     }`}
        >
          <span className="text-xs">{day}</span>
          <span className="font-bold">
            {new Date().getDate() + index - (todayIndex - 1)}
          </span>
        </Button>
      ))}
    </div>
  )
}

// ##########################################
// ##           کامپوننت اصلی           ##
// ##########################################
export default function ExamDashboardPage() {
  const [activeView, setActiveView] = useState("topics")
  const params = useParams()
  const [today, setToday] = useState(new Date())

  // TODO: `profile` را از `useContext(ChatbotUIContext)` بگیرید
  const profile = { image_url: userAvatar } // موقت

  // محاسبه روزهای باقی‌مانده
  const calculateDaysLeft = () => {
    const difference = +new Date(examData.testDate) - +new Date()
    if (difference <= 0) return 0
    return Math.ceil(difference / (1000 * 60 * 60 * 24))
  }
  const daysLeft = calculateDaysLeft()

  // انیمیشن برای جابجایی بین نماها
  const viewVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  }

  return (
    <div
      dir="rtl"
      className="animate-fade-down size-full overflow-y-auto px-4 pb-8 pt-6 md:px-8"
    >
      <div className="mx-auto max-w-2xl">
        {/* ----- دکمه‌های جابجایی نما (Switcher) ----- */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-4 z-50 mb-6"
        >
          <ToggleGroup
            type="single"
            value={activeView}
            onValueChange={view => (view ? setActiveView(view) : null)}
            className="border-muted-foreground/30 bg-muted/20 grid w-full grid-cols-2
                       rounded-xl border p-1
                       shadow-lg backdrop-blur-lg"
          >
            <ToggleGroupItem
              value="topics"
              className="data-[state=on]:bg-background rounded-lg
                         data-[state=on]:shadow-md"
            >
              <IconLayoutDashboard className="ml-2" size={16} />
              Study Topics
            </ToggleGroupItem>
            <ToggleGroupItem
              value="progress"
              className="data-[state=on]:bg-background rounded-lg
                         data-[state=on]:shadow-md"
            >
              <IconChartBar className="ml-2" size={16} />
              Progress
            </ToggleGroupItem>
          </ToggleGroup>
        </motion.div>

        {/* ----- محتوای اصلی (بر اساس نما) ----- */}
        <AnimatePresence mode="wait">
          {activeView === "topics" ? (
            // ####################
            // ##  نمای Study Topics ##
            // ####################
            <motion.div
              key="topics"
              variants={viewVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <WeekDaySelector />
              <div className="my-6 text-center">
                <h1 className="text-2xl font-bold">{examData.title}</h1>
                <p className="text-primary font-semibold">
                  امتحان تا {daysLeft} روز دیگر
                </p>
              </div>

              {/* کارت‌های مباحث */}
              <div className="space-y-4">
                {examData.topics.map((topic, index) => (
                  <Card
                    key={topic.id}
                    className={`border-muted-foreground/30 bg-muted/20 relative overflow-hidden
                                border backdrop-blur-sm transition-all
                                ${
                                  topic.status === "locked"
                                    ? "opacity-50 grayscale"
                                    : "cursor-pointer hover:shadow-xl"
                                }
                                ${
                                  topic.status === "active"
                                    ? "border-primary/50" // هایلایت نئونی
                                    : ""
                                }`}
                  >
                    {/* برچسب "Start Here" */}
                    {topic.status === "active" && (
                      <div
                        className="absolute left-0 top-0 rounded-br-lg
                                   bg-gradient-to-r from-blue-500 to-purple-600
                                   px-3 py-1 text-xs font-bold text-white shadow-lg"
                      >
                        Start Here
                      </div>
                    )}
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex size-12 items-center justify-center
                                      rounded-lg ${
                                        topic.status === "active"
                                          ? "bg-primary/20 text-primary"
                                          : "bg-muted-foreground/20 text-muted-foreground"
                                      }`}
                        >
                          <topic.icon size={24} />
                        </div>
                        <h3 className="font-semibold">{topic.title}</h3>
                      </div>
                      {topic.status === "locked" && (
                        <IconLock size={20} className="text-muted-foreground" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          ) : (
            // ####################
            // ##   نمای Progress   ##
            // ####################
            <motion.div
              key="progress"
              variants={viewVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* --- کارت Mastery و آمار --- */}
              <Card className="border-muted-foreground/30 bg-muted/20 overflow-hidden border backdrop-blur-sm">
                <CardContent className="flex flex-col gap-4 p-4 md:flex-row">
                  {/* سمت چپ: Mastery */}
                  <div
                    className="border-muted-foreground/30 bg-muted/30 flex flex-col
                               items-center justify-center rounded-lg
                               border p-4 md:w-1/3"
                  >
                    <Image
                      src={profile.image_url || userAvatar}
                      width={64}
                      height={64}
                      alt="Avatar"
                      className="border-primary/50 mb-2 size-16 rounded-full border-2"
                    />
                    <p className="mb-2 text-sm font-semibold">میزان تسلط</p>
                    <Progress
                      value={examData.masteryPercent}
                      className="h-3 w-full"
                    />
                    <p className="text-primary mt-2 text-xl font-bold">
                      {examData.masteryPercent}٪
                    </p>
                  </div>

                  {/* سمت راست: آمار */}
                  <div className="grid flex-1 grid-cols-2 gap-3">
                    <StatCard
                      title="تاریخ امتحان"
                      value={new Date(examData.testDate).toLocaleDateString(
                        "fa-IR"
                      )}
                      icon={IconCalendarEvent}
                    />
                    <StatCard
                      title="نمره هدف"
                      value={`${examData.targetScore}٪`}
                      icon={IconTargetArrow}
                    />
                    <StatCard
                      title="روزهای پیوسته"
                      value={`${examData.streak} روز`}
                      icon={IconFlame}
                    />
                    <StatCard
                      title="درس‌های تکمیل شده"
                      value={`${examData.completedLessons}/${examData.totalLessons}`}
                      icon={IconBook}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* --- کارت تقویم و Streak --- */}
              <Card className="border-muted-foreground/30 bg-muted/20 overflow-hidden border backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>تقویم مطالعه</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4 md:flex-row">
                  <Calendar
                    mode="single"
                    selected={today}
                    onSelect={date => date && setToday(date)}
                    className="border-muted-foreground/30 bg-muted/30 rounded-md
                               border p-2"
                    dir="rtl"
                  />
                  <div
                    className="border-muted-foreground/30 bg-muted/30 flex h-32 w-full
                               flex-col items-center justify-center
                               rounded-lg border p-4
                               md:w-1/3"
                  >
                    <p className="text-4xl font-bold">{examData.streak}</p>
                    <p className="text-muted-foreground text-sm">
                      روز مطالعه پیوسته
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// کامپوننت کمکی برای کارت‌های آمار
function StatCard({
  title,
  value,
  icon: Icon
}: {
  title: string
  value: string
  icon: React.ElementType
}) {
  return (
    <div
      className="border-muted-foreground/30 bg-muted/30 rounded-lg
                 border p-3"
    >
      <div className="mb-2 flex items-center gap-2">
        <Icon size={16} className="text-primary" />
        <p className="text-muted-foreground text-xs font-semibold">{title}</p>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  )
}
