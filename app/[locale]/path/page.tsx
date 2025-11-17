"use client"

import React, { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  IconMicroscope,
  IconRun,
  IconDna,
  IconPlant,
  IconSparkles
} from "@tabler/icons-react"

import {
  PageHeader,
  MaterialTabs,
  ProgressCard,
  ChapterAccordion
} from "@/components/material/LearningComponents"
import type { ColorKey } from "@/components/material/MaterialUI"

// ------------------ تایپ‌ها ------------------

type GradeKey = "دهم" | "یازدهم" | "دوازدهم"

type Section = {
  id: string
  title: string
  progress: number
}

type Chapter = {
  id: string
  title: string
  icon: any
  progress: number
  sections: Section[]
}

type GradeData = {
  title: string
  color: ColorKey
  overallProgress: number
  chapters: Chapter[]
}

// ------------------ داده‌ها ------------------

const learningData: Record<GradeKey, GradeData> = {
  دهم: {
    title: "زیست‌ دهم",
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
          { id: "s3", title: "گفتار ۳: آب و...", progress: 0 }
        ]
      },
      {
        id: "ch2-10",
        title: "فصل ۲: گوارش و جذب مواد",
        progress: 10,
        icon: IconRun,
        sections: [
          { id: "s4", title: "گفتار ۱: ساختار...", progress: 20 },
          { id: "s5", title: "گفتار ۲: جذب مواد", progress: 0 }
        ]
      }
    ]
  },
  یازدهم: {
    title: "زیست‌ یازدهم",
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
    title: "زیست‌ دوازدهم",
    color: "pink",
    overallProgress: 0,
    chapters: [
      {
        id: "ch1-12",
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

// ------------------ صفحه ------------------

export default function PathPage() {
  const [activeTab, setActiveTab] = useState<GradeKey>("دهم")
  const router = useRouter()
  const params = useParams()
  const locale = (params as { locale?: string })?.locale ?? "fa"

  const current = learningData[activeTab]
  // فعلاً مقادیر تست — بعداً از Supabase محاسبه می‌شود
  const learningProgress = current.overallProgress // مثلاً از reading + flashcard
  const masteryProgress = 10 // از speed-test + exam
  const overallProgress = 42 // خروجی هوش مصنوعی — فعلاً ثابت

  const handleSectionClick = (chapterId: string, sectionId: string) => {
    router.push(`/${locale}/lesson/${chapterId}/${sectionId}`)
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-100 py-6 md:px-8">
      <MaterialTabs
        tabs={[
          { label: "دهم", value: "دهم", color: "blue" },
          { label: "یازدهم", value: "یازدهم", color: "purple" },
          { label: "دوازدهم", value: "دوازدهم", color: "pink" }
        ]}
        active={activeTab}
        onChange={v => setActiveTab(v as GradeKey)}
      />

      <ProgressCard
        title={current.title}
        learning={learningProgress}
        mastery={masteryProgress}
        overall={overallProgress} // فعلاً ثابت
        color={current.color}
      />

      <div className="mb-3 flex items-center gap-3">
        <div className="size-2 rounded-full bg-gray-400" />
        <h3 className="text-xl font-bold text-gray-700">فهرست فصل‌ها</h3>
        <div className="h-px flex-1 bg-gray-300" />
      </div>

      <div className="space-y-4">
        {current.chapters.map((chapter, i) => (
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
    </div>
  )
}
