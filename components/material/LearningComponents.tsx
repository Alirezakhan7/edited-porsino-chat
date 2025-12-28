"use client"

import { motion, AnimatePresence } from "framer-motion"
import { MaterialCard, IconWrapper, colorThemes, ColorKey } from "./MaterialUI"
import { IconChevronDown, IconTrophy, IconBrain } from "@tabler/icons-react"
import React, { useState } from "react"

/* -----------------------------------------
   1) Modern Tabs
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
  return (
    <div className="mb-8 flex justify-center">
      <div className="flex w-full max-w-md items-center gap-2 rounded-2xl bg-white/40 p-1.5 shadow-inner ring-1 ring-white/60 backdrop-blur-md dark:bg-slate-800/60 dark:ring-white/10">
        {tabs.map(t => {
          const isActive = active === t.value
          return (
            <button
              key={t.value}
              onClick={() => onChange(t.value)}
              className={`relative flex-1 rounded-xl py-3 text-sm font-bold transition-colors duration-300 ${
                isActive
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-xl bg-white shadow-[0_2px_10px_rgb(0,0,0,0.2)] dark:bg-slate-600"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {t.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* -----------------------------------------
   2) ProgressCard (اصلاح شده)
----------------------------------------- */
export function ProgressCard({
  title,
  learning,
  mastery,
  overall,
  color
}: {
  title: string
  learning: number
  mastery: number
  overall: number
  color: ColorKey
}) {
  const theme = colorThemes[color]

  return (
    <MaterialCard className="group mb-8 !rounded-[2rem]">
      {/* پدینگ را کم کردیم تا در فضاهای کوچک بهتر جا شود */}
      <div className="relative z-10 flex flex-col gap-6 p-5">
        {/* بخش بالایی: نمودار و تیترها */}
        <div className="flex items-center justify-between" dir="rtl">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-800 dark:text-white">
              {title}
            </h2>
          </div>

          {/* نمودار دایره‌ای */}
          <div className="relative flex shrink-0 scale-75 items-center justify-center">
            <div
              className={`absolute inset-0 bg-gradient-to-br opacity-20 blur-2xl ${theme.gradient}`}
            />
            <CircularProgress
              value={overall}
              color={color}
              size={100} // سایز را کمی کوچک کردیم
              strokeWidth={10}
            />
          </div>
        </div>

        {/* بخش پایینی: آمارها - تغییر مهم: grid-cols-1 */}
        {/* این باعث می‌شود آیتم‌ها زیر هم قرار بگیرند و فضا داشته باشند */}
        <div className="grid grid-cols-1 gap-3">
          <StatBadge
            label="یادگیری"
            value={learning}
            icon={IconBrain}
            color="blue"
          />
          <StatBadge
            label="تسلط"
            value={mastery}
            icon={IconTrophy}
            color="emerald"
          />
        </div>
      </div>

      <div
        className={`absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r ${theme.gradient} opacity-80`}
      />
    </MaterialCard>
  )
}

function StatBadge({ label, value, icon: Icon, color }: any) {
  const theme = colorThemes[color as ColorKey]
  return (
    <div
      className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 transition-all ${theme.light} border-white/20 dark:border-white/10 dark:bg-slate-700/30`}
    >
      {/* سمت راست: آیکون و عنوان */}
      <div className="flex items-center gap-3">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ${theme.gradient}`}
        >
          <Icon size={20} />
        </div>
        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
          {label}
        </span>
      </div>

      {/* سمت چپ: درصد */}
      <span className={`text-lg font-black ${theme.text}`}>٪{value}</span>
    </div>
  )
}

function CircularProgress({ value, size, strokeWidth, color }: any) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90 drop-shadow-2xl">
        {/* مسیر دایره در حالت شب روشن‌تر شد (slate-700 به جای slate-800) */}
        <circle
          className="text-slate-100 dark:text-slate-700"
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          stroke="url(#progressGradient)"
          strokeLinecap="round"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <defs>
          <linearGradient
            id="progressGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-black text-slate-800 dark:text-white">
          {value}٪
        </span>
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400">
          پیشرفت کل
        </span>
      </div>
    </div>
  )
}

/* -----------------------------------------
   3) ChapterAccordion
----------------------------------------- */
export function ChapterAccordion({
  chapter,
  index,
  onSectionClick
}: {
  chapter: any
  index: number
  onSectionClick: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const colors: ColorKey[] = ["blue", "purple", "pink", "emerald"]
  const color = colors[index % colors.length]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <MaterialCard
        className={`mb-4 transition-all duration-300 ${
          open ? "ring-2 ring-blue-500/20 dark:ring-blue-400/20" : ""
        }`}
      >
        <div
          onClick={() => setOpen(!open)}
          className="flex cursor-pointer items-center justify-between p-5"
          dir="rtl"
        >
          <div className="flex items-center gap-5">
            {chapter.icon ? (
              <IconWrapper icon={chapter.icon} color={color} />
            ) : (
              <div className="size-14 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
            )}

            <div className="space-y-1 text-right">
              <h4 className="text-lg font-bold text-slate-800 dark:text-white">
                {chapter.title}
              </h4>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                  {chapter.sections?.length || 0} گفتار
                </span>
                {chapter.progress > 0 && (
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {chapter.progress}٪ تکمیل
                  </span>
                )}
              </div>
            </div>
          </div>

          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            className="rounded-full bg-slate-50 p-1 text-slate-400 dark:bg-slate-700 dark:text-slate-300"
          >
            <IconChevronDown size={20} />
          </motion.div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-2 p-4 pt-0">
                <div className="mb-4 h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />
                {chapter.sections?.map((sec: any, i: number) => (
                  <SectionItem
                    key={sec.id}
                    section={sec}
                    i={i}
                    onClick={() => onSectionClick(sec.id)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </MaterialCard>
    </motion.div>
  )
}

function SectionItem({ section, onClick, i }: any) {
  return (
    <motion.div
      initial={{ x: -10, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: i * 0.05 }}
      onClick={onClick}
      className="group flex cursor-pointer items-center justify-between rounded-xl border border-transparent p-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50"
    >
      <span className="text-sm font-medium text-slate-600 transition-colors group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white">
        {section.title}
      </span>
      <div className="flex items-center gap-3">
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${section.progress}%` }}
            className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-500"
          />
        </div>
        <span className="w-8 text-left text-xs font-bold text-slate-400 dark:text-slate-500">
          {section.progress}٪
        </span>
      </div>
    </motion.div>
  )
}
