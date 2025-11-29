"use client"

import React, { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  IconMicroscope,
  IconRun,
  IconDna,
  IconPlant
} from "@tabler/icons-react"
import { motion } from "framer-motion"

import {
  MaterialTabs,
  ProgressCard,
  ChapterAccordion
} from "@/components/material/LearningComponents"
import type { ColorKey } from "@/components/material/MaterialUI"

/* ------------------ داده‌ها (همان قبلی) ------------------ */
// داده‌ها بدون تغییر کپی شده‌اند برای حفظ عملکرد
const learningData: any = {
  دهم: {
    title: "زیست‌شناسی دهم",
    color: "blue",
    overallProgress: 25,
    chapters: [
      {
        id: "ch1-10",
        title: "فصل ۱: دنیای زنده",
        progress: 45,
        icon: IconMicroscope,
        sections: [
          { id: "s1", title: "گفتار ۱: گستره حیات", progress: 100 },
          { id: "s2", title: "گفتار ۲: مولکول‌های زیستی", progress: 30 },
          { id: "s3", title: "گفتار ۳: یاخته و بافت‌ها", progress: 0 }
        ]
      },
      {
        id: "ch2-10",
        title: "فصل ۲: گوارش و جذب مواد",
        progress: 10,
        icon: IconRun,
        sections: [
          { id: "s4", title: "گفتار ۱: ساختار لوله گوارش", progress: 20 },
          { id: "s5", title: "گفتار ۲: جذب مواد", progress: 0 }
        ]
      }
    ]
  },
  یازدهم: {
    title: "زیست‌شناسی یازدهم",
    color: "purple",
    overallProgress: 0,
    chapters: [
      {
        id: "ch1-11",
        title: "فصل ۱: تنظیم عصبی",
        icon: IconDna,
        progress: 0,
        sections: [{ id: "s6", title: "گفتار ۱: یاخته‌های عصبی", progress: 0 }]
      }
    ]
  },
  دوازدهم: {
    title: "زیست‌شناسی دوازدهم",
    color: "pink",
    overallProgress: 0,
    chapters: [
      {
        id: "biology_12_ch01",
        title: "فصل ۱: مولکول‌های اطلاعاتی",
        icon: IconDna,
        progress: 0,
        sections: [{ id: "s7", title: "گفتار ۱: نوکلئیک اسیدها", progress: 0 }]
      },
      {
        id: "ch2-12",
        title: "فصل ۲: جریان اطلاعات",
        icon: IconPlant,
        progress: 0,
        sections: [{ id: "s8", title: "گفتار ۱: رونویسی", progress: 0 }]
      }
    ]
  }
}

export default function PathPage() {
  const [activeTab, setActiveTab] = useState("دهم")
  const router = useRouter()
  const params = useParams()
  // بررسی ایمن locale
  const locale = params && "locale" in params ? params.locale : "fa"

  const current = learningData[activeTab]
  const learningProgress = current.overallProgress
  const masteryProgress = 10
  const overallProgress = 42

  const handleSectionClick = (chapterId: string, sectionId: string) => {
    router.push(`/${locale}/lesson/${chapterId}`)
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-gray-50 text-gray-900 selection:bg-purple-200 selection:text-purple-900">
      {/* Background Ambient Mesh (تکنیک مدرن برای پس‌زمینه زنده) */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-[10%] -top-[20%] size-[70%] animate-pulse rounded-full bg-blue-200/30 mix-blend-multiply blur-[120px]" />
        <div className="absolute -right-[10%] top-[20%] size-3/5 animate-pulse rounded-full bg-purple-200/30 mix-blend-multiply blur-[120px] delay-700" />
        <div className="absolute -bottom-[10%] left-[20%] size-[50%] animate-pulse rounded-full bg-pink-200/30 mix-blend-multiply blur-[120px] delay-1000" />
      </div>

      <main className="mx-auto max-w-3xl px-6 py-12 md:py-20" dir="rtl">
        {/* Tabs */}
        <MaterialTabs
          tabs={[
            { label: "پایه دهم", value: "دهم", color: "blue" },
            { label: "پایه یازدهم", value: "یازدهم", color: "purple" },
            { label: "پایه دوازدهم", value: "دوازدهم", color: "pink" }
          ]}
          active={activeTab}
          onChange={v => setActiveTab(v)}
        />

        {/* Content Animate Presence for smooth transitions between tabs */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <ProgressCard
            title={current.title}
            learning={learningProgress}
            mastery={masteryProgress}
            overall={overallProgress}
            color={current.color}
          />

          <div className="mb-6 flex items-center gap-4 opacity-80">
            <span className="text-lg font-bold text-gray-700">
              فصل‌های آموزشی
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-gray-300 to-transparent" />
          </div>

          <div className="space-y-4 pb-20">
            {current.chapters.map((chapter: any, i: number) => (
              <ChapterAccordion
                key={chapter.id}
                chapter={chapter}
                index={i}
                onSectionClick={sectionId =>
                  handleSectionClick(chapter.id, sectionId)
                }
              />
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
