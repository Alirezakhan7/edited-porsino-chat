"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  IconMicroscope,
  IconDna,
  IconPlant,
  IconAtom,
  IconStethoscope
} from "@tabler/icons-react"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import {
  MaterialTabs,
  ProgressCard,
  ChapterAccordion
} from "@/components/material/LearningComponents"
import type { ColorKey } from "@/components/material/MaterialUI"
import { getChaptersByGrade, GradeLevel } from "@/lib/lessons/config"

export default function PathPage() {
  const router = useRouter()
  const params = useParams()
  const locale = params && "locale" in params ? params.locale : "fa"
  const supabase = createClient()

  // تب فعال (پیش‌فرض دهم)
  const [activeTab, setActiveTab] = useState<GradeLevel>("10")

  // 🔄 تغییر مهم: به جای درصد، خودِ "تعداد مراحل طی شده" را نگه می‌داریم
  // کلید: آیدی فصل، مقدار: تعداد پله‌های رفته (completed_steps)
  const [userStepsMap, setUserStepsMap] = useState<Record<string, number>>({})

  // دریافت فصل‌های واقعی از فایل کانفیگ
  const realChapters = getChaptersByGrade(activeTab)

  // 1. دریافت اطلاعات از دیتابیس
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

      if (error) {
        console.error("Error loading progress:", error)
        return
      }

      // ذخیره تعداد مراحل رفته برای هر فصل
      const newMap: Record<string, number> = {}
      data.forEach(item => {
        newMap[item.chapter_id] = item.completed_steps
      })

      setUserStepsMap(newMap)
    }

    fetchProgress()
  }, [activeTab]) // وابستگی به تب فعال

  // 2. محاسبه هوشمند پیشرفت‌ها (برای دایره بالا و نوار فصل‌ها)
  const { overallPercentage, processedChapters } = useMemo(() => {
    let totalGradeSteps = 0
    let totalUserSteps = 0

    const processed = realChapters.map(chapter => {
      // مراحل رفته کاربر در این فصل (پیش‌فرض ۰)
      const userSteps = userStepsMap[chapter.id] || 0

      // جمع زدن برای آمار کلی بالا
      totalGradeSteps += chapter.totalSteps
      totalUserSteps += Math.min(userSteps, chapter.totalSteps) // جلوگیری از بیشتر شدن از سقف

      // محاسبه درصد کلی همین فصل (برای نوار روی آکاردئون)
      const chapterPercent = Math.round((userSteps / chapter.totalSteps) * 100)
      const safeChapterPercent = chapterPercent > 100 ? 100 : chapterPercent

      // 🔥 محاسبه دقیق پیشرفت تک‌تک گفتارها
      const sectionsWithProgress = chapter.sections.map(sec => {
        let secProgress = 0

        if (userSteps >= sec.endStep) {
          // اگر کاربر از این گفتار عبور کرده -> ۱۰۰٪
          secProgress = 100
        } else if (userSteps < sec.startStep) {
          // اگر کاربر هنوز به این گفتار نرسیده -> ۰٪
          secProgress = 0
        } else {
          // اگر کاربر وسط این گفتار است
          // فرمول: (مراحل رفته در این گفتار / کل مراحل این گفتار)
          const stepsInThisSection = sec.endStep - sec.startStep + 1
          const stepsDoneInThisSection = userSteps - sec.startStep + 1 // +1 چون خود پله جاری هم حساب است
          secProgress = Math.round(
            (stepsDoneInThisSection / stepsInThisSection) * 100
          )
        }

        return {
          ...sec,
          progress: secProgress
        }
      })

      return {
        ...chapter,
        calculatedProgress: safeChapterPercent,
        sections: sectionsWithProgress
      }
    })

    // محاسبه درصد کل پایه (دایره بزرگ بالا)
    const overall =
      totalGradeSteps > 0
        ? Math.round((totalUserSteps / totalGradeSteps) * 100)
        : 0

    return { overallPercentage: overall, processedChapters: processed }
  }, [realChapters, userStepsMap])

  // تنظیمات ظاهری (ثابت)
  const gradeInfo: Record<
    GradeLevel,
    { title: string; color: ColorKey; icon: any }
  > = {
    "10": { title: "زیست‌شناسی دهم", color: "blue", icon: IconMicroscope },
    "11": { title: "زیست‌شناسی یازدهم", color: "purple", icon: IconDna },
    "12": { title: "زیست‌شناسی دوازدهم", color: "pink", icon: IconPlant }
  }

  const currentInfo = gradeInfo[activeTab]
  const icons = [IconMicroscope, IconDna, IconPlant, IconAtom, IconStethoscope]

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-gray-50 text-gray-900 selection:bg-purple-200 selection:text-purple-900">
      {/* بک‌گراند بدون تغییر */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-[10%] -top-[20%] size-[70%] animate-pulse rounded-full bg-blue-200/30 mix-blend-multiply blur-[120px]" />
        <div className="absolute -right-[10%] top-[20%] size-3/5 animate-pulse rounded-full bg-purple-200/30 mix-blend-multiply blur-[120px] delay-700" />
        <div className="absolute -bottom-[10%] left-[20%] size-[50%] animate-pulse rounded-full bg-pink-200/30 mix-blend-multiply blur-[120px] delay-1000" />
      </div>

      <main className="mx-auto max-w-3xl px-6 py-12 md:py-20" dir="rtl">
        <MaterialTabs
          tabs={[
            { label: "پایه دهم", value: "10", color: "blue" },
            { label: "پایه یازدهم", value: "11", color: "purple" },
            { label: "پایه دوازدهم", value: "12", color: "pink" }
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
          {/* ✅ کارت پیشرفت کلی (الان واقعی شده است) */}
          <ProgressCard
            title={currentInfo.title}
            learning={overallPercentage} // درصد یادگیری واقعی
            mastery={overallPercentage} // فعلاً برابر با یادگیری (تا وقتی سیستم تحلیل دقیق‌تر شود)
            overall={overallPercentage}
            color={currentInfo.color}
          />

          <div className="mb-6 flex items-center gap-4 opacity-80">
            <span className="text-lg font-bold text-gray-700">
              فصل‌های آموزشی
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-gray-300 to-transparent" />
          </div>

          <div className="space-y-4 pb-20">
            {processedChapters.length === 0 ? (
              <div className="py-10 text-center text-gray-400">
                هنوز درسی برای این پایه اضافه نشده است.
              </div>
            ) : (
              // ✅ استفاده از فصل‌های پردازش شده با درصد دقیق
              processedChapters.map((chapter, i) => (
                <ChapterAccordion
                  key={chapter.id}
                  chapter={{
                    id: chapter.id,
                    title: chapter.title,
                    icon: icons[i % icons.length],
                    progress: chapter.calculatedProgress, // درصد کل فصل
                    sections: chapter.sections.map(sec => ({
                      id: sec.id,
                      title: sec.title,
                      progress: sec.progress // ✅ درصد هوشمند هر گفتار
                    }))
                  }}
                  index={i}
                  onSectionClick={() =>
                    router.push(`/${locale}/lesson/${chapter.id}`)
                  }
                />
              ))
            )}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
