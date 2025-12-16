"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { IconMicroscope, IconAtom, IconDna } from "@tabler/icons-react"
import { motion } from "framer-motion"

import {
  MaterialTabs,
  ProgressCard,
  ChapterAccordion
} from "@/components/material/LearningComponents"

// اضافه کردن ایمپورت ColorKey
import type { ColorKey } from "@/components/material/MaterialUI"

// ایمپورت کردن داده‌های واقعی
import { getChaptersByGrade, GradeLevel } from "@/lib/lessons/config"

/* ------------------ تنظیمات صفحه ------------------ */

interface PageProps {
  params: Promise<{
    locale: string
  }>
}

export default function PathPage({ params }: PageProps) {
  const { locale } = React.use(params)
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<GradeLevel>("10")

  const realChapters = getChaptersByGrade(activeTab)

  const learningProgress = 0
  const masteryProgress = 0
  const overallProgress = 0

  const handleSectionClick = (chapterId: string) => {
    router.push(`/${locale}/lesson/${chapterId}`)
  }

  // ✅ تغییر مهم: اضافه کردن 'as ColorKey' برای رفع خطای تایپ
  const gradeInfo = {
    "10": {
      title: "زیست‌شناسی دهم",
      color: "emerald" as ColorKey,
      icon: IconMicroscope
    },
    "11": {
      title: "زیست‌شناسی یازدهم",
      color: "blue" as ColorKey,
      icon: IconAtom
    },
    "12": {
      title: "زیست‌شناسی دوازدهم",
      color: "purple" as ColorKey,
      icon: IconDna
    }
  }[activeTab]

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      {/* هدر گرادینت */}
      <div
        className={`from- h-48 w-full bg-gradient-to-bl${gradeInfo.color}-600 to-${gradeInfo.color}-800 relative shadow-lg`}
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="absolute -bottom-6 right-0 w-full px-4">
          <h1 className="text-3xl font-black text-white drop-shadow-md">
            مسیر یادگیری
          </h1>
          <p className="mt-1 text-white/90 opacity-90">
            قدم به قدم تا تسلط کامل
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pt-12">
        <MaterialTabs
          tabs={[
            { label: "پایه دهم", value: "10", color: "emerald" },
            { label: "پایه یازدهم", value: "11", color: "blue" },
            { label: "پایه دوازدهم", value: "12", color: "purple" }
          ]}
          active={activeTab}
          onChange={v => setActiveTab(v as GradeLevel)}
        />

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <ProgressCard
            title={gradeInfo.title}
            learning={learningProgress}
            mastery={masteryProgress}
            overall={overallProgress}
            color={gradeInfo.color}
          />

          <div className="mb-6 flex items-center gap-4 opacity-80">
            <span className="text-lg font-bold text-gray-700">
              فصل‌های آموزشی
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-gray-300 to-transparent" />
          </div>

          <div className="space-y-4 pb-20">
            {realChapters.length === 0 ? (
              <div className="py-10 text-center text-gray-400">
                هنوز درسی برای این پایه اضافه نشده است.
              </div>
            ) : (
              realChapters.map((chapter, i) => (
                <ChapterAccordion
                  key={chapter.id}
                  chapter={{
                    id: chapter.id,
                    title: chapter.title,
                    progress: 0,
                    icon: gradeInfo.icon,
                    sections: chapter.sections.map(sec => ({
                      id: sec.id,
                      title: sec.title,
                      progress: 0
                    }))
                  }}
                  index={i}
                  onSectionClick={() => handleSectionClick(chapter.id)}
                />
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
