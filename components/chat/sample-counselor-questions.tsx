"use client"

import { motion } from "framer-motion"
import { IconX } from "@tabler/icons-react"

export const mainCategories = [
  {
    id: 1,
    title: "برنامه‌ریزی",
    icon: require("@tabler/icons-react").IconCalendar,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    questions: [
      "چطور یک برنامه هفتگی مناسب برای کنکور بچینم؟",
      "بهترین ساعات مطالعه در طول روز کدوم هستند؟",
      "چطور زمان رو بین دروس تقسیم کنم؟",
      "چه برنامه‌ای برای تعطیلات مناسبه؟"
    ]
  },
  {
    id: 2,
    title: "روش‌های مطالعه",
    icon: require("@tabler/icons-react").IconBrain,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    questions: [
      "چه روش‌هایی برای مطالعه مفهومی و عمیق مفیده؟",
      "تفاوت مطالعه سطحی و عمیق چیه؟",
      "چطور مطالب رو یادداری کنم؟",
      "بهترین روش برای حل مسئله کدوم هست؟"
    ]
  },
  {
    id: 3,
    title: "استراتژی کنکور",
    icon: require("@tabler/icons-react").IconTrophy,
    color: "from-amber-500 to-amber-600",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    questions: [
      "استراتژی مناسب برای رسیدن به رتبه زیر ۱۰۰۰ چیه؟",
      "چطور در امتحان اول خوب نتیجه بگیرم؟",
      "چه ترتیبی برای حل سوالات بهتره؟",
      "مدیریت زمان در جلسه امتحان چطوره؟"
    ]
  },
  {
    id: 4,
    title: "تقویت نقاط ضعیف",
    icon: require("@tabler/icons-react").IconBook2,
    color: "from-pink-500 to-pink-600",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/20",
    questions: [
      "برای دروس ضعیفم چه برنامه‌ای داشته باشم؟",
      "چطور مباحث سخت رو ساده‌تر یاد بگیرم؟",
      "چند بار باید یک مبحث رو تکرار کنم؟",
      "چه منابعی برای تقویت بهتره؟"
    ]
  }
]

// ------------------------------------------------------
// 🔥 این تابع فقط محتوای یک دسته انتخاب‌شده را برمی‌گرداند
// ------------------------------------------------------
export function RenderCategoryContent({
  category,
  onClose,
  onClickQuestion
}: {
  category: any
  onClose: () => void
  onClickQuestion: (q: string) => void
}) {
  return (
    <div className="space-y-4" dir="rtl">
      {/* Close */}
      <div className="flex justify-center">
        <button onClick={onClose} className="bg-muted rounded-full p-2">
          <IconX size={18} />
        </button>
      </div>

      {/* Questions List */}
      <div className="space-y-2 pt-2">
        {category.questions.map((q: string, i: number) => (
          <button
            key={i}
            onClick={() => onClickQuestion(q)}
            className="bg-muted hover:bg-muted/70 w-full rounded-lg border p-3 text-right active:scale-95"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}
