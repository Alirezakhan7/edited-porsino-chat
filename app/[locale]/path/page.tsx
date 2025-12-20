"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  IconMicroscope,
  IconDna,
  IconPlant,
  IconAtom,
  IconStethoscope,
  IconLayoutDashboard,
  IconBook
} from "@tabler/icons-react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import {
  MaterialTabs,
  ProgressCard,
  ChapterAccordion
} from "@/components/material/LearningComponents"
import { colorThemes, type ColorKey } from "@/components/material/MaterialUI" // ایمپورت تم‌ها برای استفاده مستقیم
import { getChaptersByGrade, GradeLevel } from "@/lib/lessons/config"

export default function PathPage() {
  const router = useRouter()
  const params = useParams()
  const locale = params && "locale" in params ? params.locale : "fa"
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<GradeLevel>("10")
  const [userStepsMap, setUserStepsMap] = useState<Record<string, number>>({})

  const realChapters = getChaptersByGrade(activeTab)

  useEffect(() => {
    async function fetchProgress() {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (!user) return

      const chapterIds = realChapters.map(c => c.id)
      const { data, error } = await supabase
        .from("user_progress")
        .select("chapter_id, completed_steps")
        .eq("user_id", user.id)
        .in("chapter_id", chapterIds)

      if (error) return

      const newMap: Record<string, number> = {}
      data.forEach(item => {
        newMap[item.chapter_id] = item.completed_steps
      })
      setUserStepsMap(newMap)
    }
    fetchProgress()
  }, [activeTab])

  const { overallPercentage, processedChapters } = useMemo(() => {
    let totalGradeSteps = 0
    let totalUserSteps = 0

    const processed = realChapters.map(chapter => {
      const userSteps = userStepsMap[chapter.id] || 0
      totalGradeSteps += chapter.totalSteps
      totalUserSteps += Math.min(userSteps, chapter.totalSteps)

      const chapterPercent = Math.round((userSteps / chapter.totalSteps) * 100)
      const safeChapterPercent = chapterPercent > 100 ? 100 : chapterPercent

      const sectionsWithProgress = chapter.sections.map(sec => {
        let secProgress = 0
        if (userSteps >= sec.endStep) secProgress = 100
        else if (userSteps < sec.startStep) secProgress = 0
        else {
          const stepsInThisSection = sec.endStep - sec.startStep + 1
          const stepsDoneInThisSection = userSteps - sec.startStep + 1
          secProgress = Math.round(
            (stepsDoneInThisSection / stepsInThisSection) * 100
          )
        }
        return { ...sec, progress: secProgress }
      })

      return {
        ...chapter,
        calculatedProgress: safeChapterPercent,
        sections: sectionsWithProgress
      }
    })

    const overall =
      totalGradeSteps > 0
        ? Math.round((totalUserSteps / totalGradeSteps) * 100)
        : 0
    return { overallPercentage: overall, processedChapters: processed }
  }, [realChapters, userStepsMap])

  const gradeInfo: Record<
    GradeLevel,
    { title: string; color: ColorKey; description: string }
  > = {
    "10": {
      title: "زیست‌شناسی دهم",
      color: "blue",
      description: "پایه و اساس دنیای زنده"
    },
    "11": {
      title: "زیست‌شناسی یازدهم",
      color: "purple",
      description: "سازوکارهای پیچیده بدن"
    },
    "12": {
      title: "زیست‌شناسی دوازدهم",
      color: "pink",
      description: "مولکول‌های اطلاعاتی و وراثت"
    }
  }

  const currentInfo = gradeInfo[activeTab]
  const icons = [IconMicroscope, IconDna, IconPlant, IconAtom, IconStethoscope]

  return (
    <div
      className="bg-background text-foreground relative min-h-screen w-full transition-colors duration-500"
      dir="rtl"
    >
      {/* --- ۱. اصلاح پس‌زمینه هوشمند برای حالت شب --- */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* لایه رنگی اول (داینامیک) */}
        <div
          className={`bg- absolute -left-[10%] -top-[10%] size-[600px] rounded-full 
          blur-[130px]${currentInfo.color}-400/20 dark:bg-${currentInfo.color}-600/10 animate-pulse`}
        />
        {/* لایه رنگی دوم (ثابت) */}
        <div
          className="absolute -bottom-[10%] right-[10%] size-[500px] rounded-full bg-purple-400/10 
          blur-[100px] dark:bg-purple-900/5"
        />
        {/* لایه بافت (Grid) برای عمق دادن به حالت شب */}
        <div className="bg-grid-black/[0.02] dark:bg-grid-white/[0.02] absolute inset-0" />
      </div>

      <main className="container mx-auto max-w-7xl px-4 py-8 md:py-12">
        {/* --- هدر صفحه --- */}
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-black md:text-4xl">
              <IconLayoutDashboard
                className={colorThemes[currentInfo.color].text}
                size={36}
              />
              مسیر یادگیری هوشمند
            </h1>
            <p className="text-muted-foreground mt-2">
              پیشرفت خود را در دروس زیست‌شناسی دنبال کنید
            </p>
          </div>

          <div className="hidden md:block">
            <MaterialTabs
              tabs={[
                { label: "پایه دهم", value: "10", color: "blue" },
                { label: "پایه یازدهم", value: "11", color: "purple" },
                { label: "پایه دوازدهم", value: "12", color: "pink" }
              ]}
              active={activeTab}
              onChange={v => setActiveTab(v as GradeLevel)}
            />
          </div>
        </div>

        {/* --- چیدمان اصلی --- */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <aside className="lg:sticky lg:top-24 lg:col-span-4 lg:h-fit">
            <div className="space-y-6">
              <div className="md:hidden">
                <MaterialTabs
                  tabs={[
                    { label: "دهم", value: "10", color: "blue" },
                    { label: "یازدهم", value: "11", color: "purple" },
                    { label: "دوازدهم", value: "12", color: "pink" }
                  ]}
                  active={activeTab}
                  onChange={v => setActiveTab(v as GradeLevel)}
                />
              </div>

              <motion.div
                key={activeTab + "card"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ProgressCard
                  title={currentInfo.title}
                  learning={overallPercentage}
                  mastery={overallPercentage}
                  overall={overallPercentage}
                  color={currentInfo.color}
                />

                {/* ۲. اصلاح کارت کناری برای حالت شب */}
                <div className="mt-4 rounded-2xl border border-white/20 bg-white/5 p-4 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/40">
                  <h4 className="flex items-center gap-2 text-sm font-bold opacity-80">
                    <IconBook size={18} />
                    درباره این پایه
                  </h4>
                  <p className="text-muted-foreground mt-2 text-xs italic leading-relaxed">
                    {currentInfo.description}. در این بخش شما{" "}
                    {processedChapters.length} فصل و ده‌ها زیرمجموعه آموزشی را
                    پشت سر خواهید گذاشت.
                  </p>
                </div>
              </motion.div>
            </div>
          </aside>

          <section className="lg:col-span-8">
            <div className="mb-6 flex items-center gap-4">
              <span className="whitespace-nowrap text-lg font-extrabold tracking-tight">
                سرفصل‌های آموزشی
              </span>
              <div className="from-border via-border/50 h-[2px] w-full bg-gradient-to-l to-transparent" />
            </div>

            <div className="space-y-4 pb-24">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4, ease: "circOut" }}
                  className="grid gap-4"
                >
                  {processedChapters.length === 0 ? (
                    <div className="border-border text-muted-foreground rounded-3xl border border-dashed py-20 text-center">
                      محتوایی برای این بخش آماده نشده است.
                    </div>
                  ) : (
                    processedChapters.map((chapter, i) => (
                      <ChapterAccordion
                        key={chapter.id}
                        chapter={{
                          id: chapter.id,
                          title: chapter.title,
                          icon: icons[i % icons.length],
                          progress: chapter.calculatedProgress,
                          sections: chapter.sections.map(sec => ({
                            id: sec.id,
                            title: sec.title,
                            progress: sec.progress
                          }))
                        }}
                        index={i}
                        onSectionClick={sectionId =>
                          router.push(
                            `/${locale}/lesson/${chapter.id}?section=${sectionId}`
                          )
                        }
                      />
                    ))
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
