// app/[locale]/path/path-client.tsx

"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  IconMicroscope,
  IconDna,
  IconPlant,
  IconAtom,
  IconStethoscope,
  IconBook // اضافه شد
} from "@tabler/icons-react"
import { AnimatePresence, motion } from "framer-motion"
import {
  MaterialTabs,
  ProgressCard,
  ChapterAccordion
} from "@/components/material/LearningComponents"
import { colorThemes, type ColorKey } from "@/components/material/MaterialUI"
import { getChaptersByGrade, GradeLevel } from "@/lib/lessons/config"

interface PathClientProps {
  locale: string
  initialUserSteps: Record<string, number>
}

export default function PathClient({
  locale,
  initialUserSteps
}: PathClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<GradeLevel>("10")

  const realChapters = getChaptersByGrade(activeTab)

  const { overallPercentage, processedChapters } = useMemo(() => {
    let totalGradeSteps = 0
    let totalUserSteps = 0

    const processed = realChapters.map(chapter => {
      const userSteps = initialUserSteps[chapter.id] || 0
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
  }, [realChapters, initialUserSteps])

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

            {/* بازگردانی بخش توضیحات "درباره این پایه" که حذف شده بود */}
            <div className="mt-4 rounded-2xl border border-white/20 bg-white/5 p-4 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/40">
              <h4 className="flex items-center gap-2 text-sm font-bold opacity-80">
                <IconBook size={18} />
                درباره این پایه
              </h4>
              <p className="text-muted-foreground mt-2 text-xs italic leading-relaxed">
                {currentInfo.description}. در این بخش شما{" "}
                {processedChapters.length} فصل و ده‌ها زیرمجموعه آموزشی را پشت
                سر خواهید گذاشت.
              </p>
            </div>
          </motion.div>
        </div>
      </aside>

      <section className="lg:col-span-8">
        {/* تب‌ها در دسکتاپ */}
        <div className="mb-6 hidden md:block">
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

        {/* بازگردانی تیتر "سرفصل‌های آموزشی" و خط جداکننده (نوار) */}
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
              initial={{ opacity: 1, x: 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "circOut" }}
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
  )
}
