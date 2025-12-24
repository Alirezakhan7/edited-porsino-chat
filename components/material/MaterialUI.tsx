// components/material/MaterialUI.tsx
"use client"

import { motion } from "framer-motion"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import React from "react"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/* -----------------------------------------
   1) تم‌های رنگی (اضافه کردن رنگ نارنجی برای رفع ارور)
----------------------------------------- */
export const colorThemes = {
  blue: {
    gradient: "from-blue-500 to-indigo-600",
    light: "bg-blue-50/50 dark:bg-blue-500/20",
    text: "text-blue-700 dark:text-blue-200",
    border: "border-blue-200/50 dark:border-blue-400/30",
    glow: "shadow-blue-500/20 dark:shadow-blue-500/40",
    bg: "bg-blue-600"
  },
  purple: {
    gradient: "from-violet-500 to-fuchsia-600",
    light: "bg-violet-50/50 dark:bg-violet-500/20",
    text: "text-violet-700 dark:text-violet-200",
    border: "border-violet-200/50 dark:border-violet-400/30",
    glow: "shadow-violet-500/20 dark:shadow-violet-500/40",
    bg: "bg-violet-600"
  },
  pink: {
    gradient: "from-pink-500 to-rose-600",
    light: "bg-pink-50/50 dark:bg-pink-500/20",
    text: "text-pink-700 dark:text-pink-200",
    border: "border-pink-200/50 dark:border-pink-400/30",
    glow: "shadow-pink-500/20 dark:shadow-pink-500/40",
    bg: "bg-pink-600"
  },
  emerald: {
    gradient: "from-emerald-400 to-teal-600",
    light: "bg-emerald-50/50 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-200",
    border: "border-emerald-200/50 dark:border-emerald-400/30",
    glow: "shadow-emerald-500/20 dark:shadow-emerald-500/40",
    bg: "bg-emerald-600"
  },
  // ✅ رنگ نارنجی (Orange) اضافه شد تا ارور برطرف شود
  orange: {
    gradient: "from-orange-400 to-amber-600",
    light: "bg-orange-50/50 dark:bg-orange-500/20",
    text: "text-orange-700 dark:text-orange-200",
    border: "border-orange-200/50 dark:border-orange-400/30",
    glow: "shadow-orange-500/20 dark:shadow-orange-500/40",
    bg: "bg-orange-500"
  }
}

export type ColorKey = keyof typeof colorThemes

/* -----------------------------------------
   2) MaterialCard
----------------------------------------- */
export function MaterialCard({
  children,
  className = "",
  elevation = 1,
  onClick
}: {
  children: React.ReactNode
  className?: string
  elevation?: number
  onClick?: () => void
}) {
  return (
    <motion.div
      whileHover={onClick ? { y: -4 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-3xl border backdrop-blur-xl transition-all duration-300",
        elevation > 1 ? "shadow-md" : "shadow-sm",
        "border-white/40 bg-white/60",
        "dark:border-white/10 dark:bg-slate-800/60 dark:shadow-2xl dark:shadow-black/50",
        onClick ? "cursor-pointer" : "",
        className
      )}
    >
      {children}
    </motion.div>
  )
}

/* -----------------------------------------
   3) IconWrapper
----------------------------------------- */
export function IconWrapper({
  icon: Icon,
  color
}: {
  icon: any
  color: ColorKey
}) {
  // ✅ یک محافظ (Fallback) اضافه می‌کنیم که اگر رنگ پیدا نشد، ارور ندهد و آبی را نشان دهد
  const theme = colorThemes[color] || colorThemes.blue

  if (!Icon) return null

  return (
    <div
      className={cn(
        "relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg",
        theme.gradient,
        theme.glow
      )}
    >
      <Icon size={28} strokeWidth={2} className="text-white drop-shadow-md" />
    </div>
  )
}

/* -----------------------------------------
   4) RippleButton (آپدیت شده با قابلیت disabled)
----------------------------------------- */
export function RippleButton({
  children,
  className = "",
  onClick,
  disabled = false // ✅ اضافه شدن ویژگی disabled
}: {
  children: React.ReactNode
  className?: string
  onClick?: (e: any) => void
  disabled?: boolean // ✅ تعریف تایپ
}) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.02 }} // اگر غیرفعال بود، انیمیشن هاور نداشته باشد
      whileTap={disabled ? undefined : { scale: 0.95 }} // اگر غیرفعال بود، انیمیشن کلیک نداشته باشد
      onClick={disabled ? undefined : onClick} // اگر غیرفعال بود، کلیک کار نکند
      disabled={disabled} // ویژگی استاندارد HTML
      className={cn(
        "relative overflow-hidden rounded-xl px-6 py-3 font-medium text-white shadow-lg transition-all",
        // استایل‌های پایه
        !className.includes("bg-") && "bg-blue-600",

        // استایل‌های حالت فعال (فقط وقتی disabled نباشد)
        !disabled && "hover:shadow-xl hover:brightness-110",

        // استایل‌های حالت غیرفعال (Disabled)
        disabled && "cursor-not-allowed opacity-50 grayscale",

        className
      )}
    >
      <div className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </div>
      {/* افکت شیشه‌ای فقط وقتی فعال است نمایش داده شود */}
      {!disabled && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
      )}
    </motion.button>
  )
}
