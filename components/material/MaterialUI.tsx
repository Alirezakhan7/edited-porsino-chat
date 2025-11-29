"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// ابزار کمکی برای ترکیب کلاس‌ها
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/* -----------------------------------------
   1) تم رنگی مدرن (Vibrant & Pastel)
----------------------------------------- */
export const colorThemes = {
  blue: {
    gradient: "from-blue-500 to-indigo-600",
    light: "bg-blue-50/50",
    text: "text-blue-600",
    border: "border-blue-200/50",
    glow: "shadow-blue-500/20",
    bg: "bg-blue-600"
  },
  purple: {
    gradient: "from-violet-500 to-fuchsia-600",
    light: "bg-violet-50/50",
    text: "text-violet-600",
    border: "border-violet-200/50",
    glow: "shadow-violet-500/20",
    bg: "bg-violet-600"
  },
  pink: {
    gradient: "from-pink-500 to-rose-600",
    light: "bg-pink-50/50",
    text: "text-pink-600",
    border: "border-pink-200/50",
    glow: "shadow-pink-500/20",
    bg: "bg-pink-600"
  },
  emerald: {
    gradient: "from-emerald-400 to-teal-600",
    light: "bg-emerald-50/50",
    text: "text-emerald-600",
    border: "border-emerald-200/50",
    glow: "shadow-emerald-500/20",
    bg: "bg-emerald-600"
  }
}

export type ColorKey = keyof typeof colorThemes

/* -----------------------------------------
   2) GlassCard (جایگزین MaterialCard)
----------------------------------------- */
export function MaterialCard({
  children,
  className = "",
  elevation = 2, // برای سازگاری با کد قبلی نگه داشته شده اما استفاده مدرن می‌شود
  onClick
}: {
  children: React.ReactNode
  className?: string
  elevation?: 1 | 2 | 4 | 8
  onClick?: () => void
}) {
  return (
    <motion.div
      whileHover={onClick ? { y: -4, scale: 1.005 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/40 bg-white/60 p-0 backdrop-blur-xl transition-shadow duration-300",
        "shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]", // سایه مدرن نرم
        onClick ? "cursor-pointer" : "",
        className
      )}
    >
      {/* افکت درخشش شیشه‌ای روی کارت */}
      <div className="pointer-events-none absolute -right-24 -top-24 size-48 rounded-full bg-gradient-to-br from-white/40 to-transparent blur-3xl" />
      {children}
    </motion.div>
  )
}

/* -----------------------------------------
   3) Modern Ripple Button
----------------------------------------- */
export function RippleButton({
  children,
  className = "",
  onClick
}: {
  children: React.ReactNode
  className?: string
  onClick?: (e: any) => void
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-xl px-6 py-3 font-medium text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110",
        className
      )}
    >
      <div className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </div>
      {/* لایه براق روی دکمه */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
    </motion.button>
  )
}

/* -----------------------------------------
   4) IconWrapper (Squircle Modern)
----------------------------------------- */
export function IconWrapper({
  icon: Icon,
  color
}: {
  icon: any
  color: ColorKey
}) {
  const theme = colorThemes[color]

  return (
    <div
      className={cn(
        "relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg",
        theme.gradient,
        theme.glow
      )}
    >
      {/* آیکون داخلی */}
      <Icon size={28} strokeWidth={2} className="text-white drop-shadow-md" />

      {/* افکت نورانی پشت آیکون */}
      <div
        className={cn(
          "absolute inset-0 -z-10 rounded-2xl opacity-40 blur-lg",
          theme.bg
        )}
      />
    </div>
  )
}
