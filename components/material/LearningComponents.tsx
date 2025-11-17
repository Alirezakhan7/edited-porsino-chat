"use client"

import { motion, AnimatePresence } from "framer-motion"
import { MaterialCard, IconWrapper, colorThemes, ColorKey } from "./MaterialUI"
import { IconChevronDown, IconBook } from "@tabler/icons-react"
import React, { useState } from "react"

/* -----------------------------------------
   1) PageHeader
----------------------------------------- */
export function PageHeader({
  icon,
  title,
  subtitle
}: {
  icon: any
  title: string
  subtitle: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-10 text-center"
    >
      <MaterialCard className="mb-4 inline-block px-8 py-3">
        <div className="flex items-center gap-3 font-bold text-purple-600">
          {icon}
          {title}
        </div>
      </MaterialCard>

      <h1 className="text-4xl font-bold text-gray-900">{title}</h1>
      <p className="mt-2 text-gray-600">{subtitle}</p>
    </motion.div>
  )
}

/* -----------------------------------------
   2) MaterialTabs
----------------------------------------- */

export function MaterialTabs({
  tabs,
  active,
  onChange
}: {
  tabs: { label: string; value: string; color: ColorKey }[]
  active: string
  onChange: (v: string) => void
}) {
  // پیدا کردن ایندکس تب فعال
  const activeIndex = tabs.findIndex(t => t.value === active)

  return (
    <div
      className="mb-8 flex items-center justify-center"
      style={{ height: 120 }} // ارتفاع ثابت برای جلوگیری از پرش محتوا
    >
      {/* والدِ مرکزچین برای دایره‌ها */}
      <div className="relative flex w-full max-w-sm items-center justify-center">
        {tabs.map((t, index) => {
          const theme = colorThemes[t.color]
          const isActive = t.value === active

          // محاسبه موقعیت نسبت به تب فعال
          const position = index - activeIndex

          let x = 0
          let scale = 0.8
          let opacity = 0
          let zIndex = 0

          if (position === 0) {
            // فعال (وسط)
            x = 0
            scale = 1.1
            opacity = 1
            zIndex = 10
          } else if (position === -1) {
            // قبلی (راست)
            x = 110
            scale = 0.9
            opacity = 0.6
            zIndex = 5
          } else if (position === 1) {
            // بعدی (چپ)
            x = -110
            scale = 0.9
            opacity = 0.6
            zIndex = 5
          } else if (position < -1) {
            x = 150
            scale = 0
            opacity = 0
            zIndex = 0
          } else if (position > 1) {
            x = -150
            scale = 0
            opacity = 0
            zIndex = 0
          }

          return (
            <motion.div
              key={t.value}
              onClick={() => onChange(t.value)}
              animate={{
                x, // بر حسب پیکسل از مرکز
                scale,
                opacity,
                zIndex
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`
                mx-auto flex size-24 cursor-pointer 
                items-center 
                justify-center rounded-full text-lg
                font-bold
                shadow-xl md:size-28
                ${
                  isActive
                    ? `bg-gradient-to-r text-white ${theme.gradient} ${theme.shadow}`
                    : "bg-white/70 text-gray-700 backdrop-blur-md"
                }
              `}
              style={{ transformOrigin: "center center", position: "absolute" }}
            >
              {t.label}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

/* -----------------------------------------
   3) ProgressCard — نسخه جدید و کامل
----------------------------------------- */
export function ProgressCard({
  title,
  learning,
  mastery,
  overall,
  color
}: {
  title: string
  learning: number // از reading + flashcard
  mastery: number // از exam + speed-test
  overall: number // عدد کلی (فعلاً ثابت / بعداً از AI)
  color: ColorKey
}) {
  const theme = colorThemes[color]

  return (
    <MaterialCard elevation={4} className="mb-8 overflow-hidden">
      {/* نوار گرادیانی بالای کارت */}
      <div className={`h-2 bg-gradient-to-r ${theme.gradient}`} />

      <div className="p-8">
        {/* هدر کارت همراه با دایره درصد کلی */}
        <div className="mb-6 flex items-start justify-between gap-6 " dir="rtl">
          {/* متن سمت راست */}
          <div className="flex w-40 flex-col items-start md:w-auto md:flex-1">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 ">
              {title}
            </h2>

            <button
              onClick={() => console.log("Show details...")} // این را بعداً تغییر می‌دهیم
              className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-2 text-sm 
                            font-semibold text-white shadow transition hover:brightness-110"
            >
              جزئیات بیشتر
            </button>
          </div>

          {/* دایره درصد کلی */}
          <div className="shrink-0">
            <CircularProgress value={overall} size={100} strokeWidth={10} />
          </div>
        </div>

        {/* نوار یادگیری */}
        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className={theme.text + " font-medium"}>یادگیری</span>
            <span className={theme.text + " font-semibold"}>٪{learning}</span>
          </div>

          <div className="h-3 w-full rounded-full bg-blue-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${learning}%` }}
            />
          </div>
        </div>

        {/* نوار تسلط */}
        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-yellow-700">تسلط</span>
            <span className="font-semibold text-yellow-700">٪{mastery}</span>
          </div>

          <div className="h-3 w-full rounded-full bg-yellow-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all"
              style={{ width: `${mastery}%` }}
            />
          </div>
        </div>
      </div>
    </MaterialCard>
  )
}

function CircularProgress({
  value,
  size = 80,
  strokeWidth = 6
}: {
  value: number
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, value))
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          stroke="#E5E7EB" // خاکستری روشن
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke="#FBBF24" // طلایی/amber
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <span className="absolute text-2xl font-bold text-gray-700">
        ٪{clamped}
      </span>
    </div>
  )
}

/* -----------------------------------------
   4) SectionItem
----------------------------------------- */
export function SectionItem({
  section,
  color,
  onClick,
  i
}: {
  section: { id: string; title: string; progress: number }
  color: ColorKey
  onClick: () => void
  i: number
}) {
  const theme = colorThemes[color]

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.05 }}
    >
      <MaterialCard
        onClick={onClick}
        elevation={1}
        className="hover:bg-white/80"
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <span className="text-sm">{section.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-bold ${theme.text}`}>
              ٪{section.progress}
            </span>
          </div>
        </div>
      </MaterialCard>
    </motion.div>
  )
}

/* -----------------------------------------
   5) ChapterAccordion
----------------------------------------- */
export function ChapterAccordion({
  chapter,
  index,
  onSectionClick
}: {
  chapter: {
    id: string
    title: string
    icon: any
    progress: number
    sections: any[]
  }
  index: number
  onSectionClick: (sectionId: string) => void
}) {
  const [open, setOpen] = useState(false)

  const colors: ColorKey[] = ["blue", "purple", "pink", "emerald"]
  const color = colors[index % colors.length]
  const theme = colorThemes[color]

  return (
    <MaterialCard elevation={open ? 4 : 2} className="mb-4 overflow-hidden">
      <div
        onClick={() => setOpen(!open)}
        className="cursor-pointer p-6 transition-colors hover:bg-gray-50"
      >
        <div className="flex items-center justify-between" dir="rtl">
          <div className="flex items-center gap-4">
            <IconWrapper icon={chapter.icon} color={color} />
            <div className="text-right">
              <h4 className="font-bold text-gray-900">{chapter.title}</h4>
              <p className="text-sm text-gray-500">
                {chapter.sections.length} گفتار
              </p>
            </div>
          </div>

          <motion.div animate={{ rotate: open ? 180 : 0 }}>
            <IconChevronDown className={theme.text} />
          </motion.div>
        </div>
      </div>

      {/* Sections */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2 bg-transparent px-6 pb-6"
          >
            {chapter.sections.map((sec, i) => (
              <SectionItem
                key={sec.id}
                section={sec}
                i={i}
                color={color}
                onClick={() => onSectionClick(sec.id)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </MaterialCard>
  )
}
