"use client"

import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import { MaterialCard, IconWrapper, colorThemes, ColorKey } from "./MaterialUI"
import {
  IconChevronDown,
  IconTrophy,
  IconBrain,
  IconChartPie
} from "@tabler/icons-react"
import React, { useState } from "react"

/* -----------------------------------------
   1) Modern Tabs (Apple Style)
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
      <div className="flex w-full max-w-md items-center gap-2 rounded-2xl bg-white/40 p-1.5 shadow-inner ring-1 ring-white/60 backdrop-blur-md">
        {tabs.map(t => {
          const isActive = active === t.value
          return (
            <button
              key={t.value}
              onClick={() => onChange(t.value)}
              className={`relative flex-1 rounded-xl py-3 text-sm font-bold transition-colors duration-300 ${
                isActive ? "text-gray-800" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-xl bg-white shadow-[0_2px_10px_rgb(0,0,0,0.05)]"
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
   2) ProgressCard (Dashboard Style)
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
    <MaterialCard className="group mb-8 !rounded-[2rem] !border-white/50">
      <div className="relative z-10 flex flex-col gap-8 p-8 md:flex-row md:items-center">
        {/* Left Side: Info */}
        <div className="flex-1 space-y-6" dir="rtl">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-gray-800">{title}</h2>
            <p className="font-medium text-gray-500">مسیر یادگیری هوشمند</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
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

        {/* Right Side: Circular Graph */}
        <div className="relative flex shrink-0 items-center justify-center">
          {/* افکت Glow پشت دایره */}
          <div
            className={`absolute inset-0 bg-gradient-to-br opacity-20 blur-3xl ${theme.gradient}`}
          />
          <CircularProgress
            value={overall}
            color={color}
            size={140}
            strokeWidth={12}
          />
        </div>
      </div>

      {/* Background Decoration */}
      <div
        className={`absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r ${theme.gradient} opacity-80`}
      />
    </MaterialCard>
  )
}

// کامپوننت داخلی کوچک برای آمار
function StatBadge({ label, value, icon: Icon, color }: any) {
  const theme = colorThemes[color as ColorKey]
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl p-3 ${theme.light} border border-white/60`}
    >
      <div
        className={`rounded-lg bg-gradient-to-br p-2 text-white ${theme.gradient}`}
      >
        <Icon size={18} />
      </div>
      <div>
        <div className="text-[10px] font-bold text-gray-500 opacity-80">
          {label}
        </div>
        <div className={`text-lg font-bold ${theme.text}`}>٪{value}</div>
      </div>
    </div>
  )
}

function CircularProgress({ value, size, strokeWidth, color }: any) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const theme = colorThemes[color as ColorKey]

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90 drop-shadow-xl">
        {/* Track */}
        <circle
          stroke="rgba(0,0,0,0.05)"
          fill="white" // وسط دایره سفید باشد
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Indicator */}
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          stroke="url(#gradient)"
          strokeLinecap="round"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-black text-gray-800">{value}٪</span>
        <span className="text-[10px] font-bold text-gray-400">پیشرفت کل</span>
      </div>
    </div>
  )
}

/* -----------------------------------------
   3) ChapterAccordion (Clean & Floating)
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
        className={`mb-4 transition-all duration-300 ${open ? "shadow-xl ring-2 ring-purple-500/20" : ""}`}
      >
        <div
          onClick={() => setOpen(!open)}
          className="flex cursor-pointer items-center justify-between p-5"
          dir="rtl"
        >
          <div className="flex items-center gap-5">
            <IconWrapper icon={chapter.icon} color={color} />
            <div className="space-y-1 text-right">
              <h4 className="text-lg font-bold text-gray-800">
                {chapter.title}
              </h4>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                  {chapter.sections.length} گفتار
                </span>
                {chapter.progress > 0 && (
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600">
                    {chapter.progress}٪ تکمیل
                  </span>
                )}
              </div>
            </div>
          </div>

          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            className="rounded-full bg-gray-50 p-1 text-gray-400"
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
                <div className="mb-4 h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                {chapter.sections.map((sec: any, i: number) => (
                  <SectionItem
                    key={sec.id}
                    section={sec}
                    i={i}
                    color={color}
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

function SectionItem({ section, color, onClick, i }: any) {
  return (
    <motion.div
      initial={{ x: -10, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: i * 0.05 }}
      onClick={onClick}
      className="group flex cursor-pointer items-center justify-between rounded-xl border border-transparent p-4 transition-all hover:border-gray-100 hover:bg-gray-50"
    >
      <span className="text-sm font-medium text-gray-600 transition-transform duration-200 group-hover:translate-x-[-4px] group-hover:text-gray-900">
        {section.title}
      </span>
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-400 to-purple-500"
            style={{ width: `${section.progress}%` }}
          />
        </div>
        <span className="w-6 text-left text-xs font-bold text-gray-400">
          {section.progress}٪
        </span>
      </div>
    </motion.div>
  )
}

// PageHeader placeholder to prevent errors if used
export function PageHeader({ icon, title, subtitle }: any) {
  return <div className="hidden" />
}
