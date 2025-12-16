"use client"

import React, { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  IconMicroscope,
  IconDna,
  IconPlant,
  IconAtom,
  IconStethoscope
} from "@tabler/icons-react"
import { motion } from "framer-motion"

import {
  MaterialTabs,
  ProgressCard,
  ChapterAccordion
} from "@/components/material/LearningComponents"
import type { ColorKey } from "@/components/material/MaterialUI"

// ✅ تغییر: ایمپورت منطق جدید
import { getChaptersByGrade, GradeLevel } from "@/lib/lessons/config"

export default function PathPage() {
  const router = useRouter()
  const params = useParams()
  // بررسی ایمن locale
  const locale = params && "locale" in params ? params.locale : "fa"

  // ✅ تغییر: استفاده از کلیدهای استاندارد (10, 11, 12) به جای (دهم، یازدهم...)
  const [activeTab, setActiveTab] = useState<GradeLevel>("10")

  // ✅ تغییر: دریافت فصل‌های واقعی از فایل کانفیگ (دیتابیس)
  const realChapters = getChaptersByGrade(activeTab)

  // اطلاعات ظاهری برای هر پایه (برای حفظ ظاهر قبلی)
  const gradeInfo: Record<
    GradeLevel,
    { title: string; color: ColorKey; icon: any }
  > = {
    "10": { title: "زیست‌شناسی دهم", color: "blue", icon: IconMicroscope },
    "11": { title: "زیست‌شناسی یازدهم", color: "purple", icon: IconDna },
    "12": { title: "زیست‌شناسی دوازدهم", color: "pink", icon: IconPlant }
  }

  const currentInfo = gradeInfo[activeTab]

  // محاسبه پیشرفت (فعلاً ثابت، بعداً می‌توانید واقعی کنید)
  const learningProgress = 0
  const masteryProgress = 0
  const overallProgress = 0

  const handleSectionClick = (chapterId: string) => {
    router.push(`/${locale}/lesson/${chapterId}`)
  }

  // لیستی از آیکون‌ها برای اختصاص دادن به فصل‌های مختلف
  const icons = [IconMicroscope, IconDna, IconPlant, IconAtom, IconStethoscope]

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-gray-50 text-gray-900 selection:bg-purple-200 selection:text-purple-900">
      {/* ✅ حفظ ظاهر: Background Ambient Mesh (تکنیک مدرن برای پس‌زمینه زنده) */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-[10%] -top-[20%] size-[70%] animate-pulse rounded-full bg-blue-200/30 mix-blend-multiply blur-[120px]" />
        <div className="absolute -right-[10%] top-[20%] size-3/5 animate-pulse rounded-full bg-purple-200/30 mix-blend-multiply blur-[120px] delay-700" />
        <div className="absolute -bottom-[10%] left-[20%] size-[50%] animate-pulse rounded-full bg-pink-200/30 mix-blend-multiply blur-[120px] delay-1000" />
      </div>

      <main className="mx-auto max-w-3xl px-6 py-12 md:py-20" dir="rtl">
        {/* Tabs */}
        <MaterialTabs
          tabs={[
            // مقدار value ها را به 10, 11, 12 تغییر دادیم تا با سیستم جدید هماهنگ باشد
            // اما رنگ‌ها همان رنگ‌های کد اصلی شماست
            { label: "پایه دهم", value: "10", color: "blue" },
            { label: "پایه یازدهم", value: "11", color: "purple" },
            { label: "پایه دوازدهم", value: "12", color: "pink" }
          ]}
          active={activeTab}
          onChange={v => setActiveTab(v as GradeLevel)}
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
            title={currentInfo.title}
            learning={learningProgress}
            mastery={masteryProgress}
            overall={overallProgress}
            color={currentInfo.color}
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
              // ✅ تغییر: حلقه روی فصل‌های واقعی
              realChapters.map((chapter, i) => (
                <ChapterAccordion
                  key={chapter.id}
                  chapter={{
                    id: chapter.id,
                    title: chapter.title,
                    // چون در کانفیگ آیکون نداریم، چرخشی آیکون اختصاص می‌دهیم
                    icon: icons[i % icons.length],
                    progress: 0, // فعلاً صفر
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
      </main>
    </div>
  )
}
