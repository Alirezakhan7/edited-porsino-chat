"use client"

import { useState } from "react"
import { motion } from "framer-motion"

/* -----------------------------------------
   1) تم رنگی
----------------------------------------- */
export const colorThemes = {
  blue: {
    gradient: "from-blue-500 to-blue-700",
    light: "bg-blue-50",
    text: "text-blue-700",
    shadow: "shadow-blue-200",
    bg: "bg-blue-600"
  },
  purple: {
    gradient: "from-purple-500 to-purple-700",
    light: "bg-purple-50",
    text: "text-purple-700",
    shadow: "shadow-purple-200",
    bg: "bg-purple-600"
  },
  pink: {
    gradient: "from-pink-500 to-pink-700",
    light: "bg-pink-50",
    text: "text-pink-700",
    shadow: "shadow-pink-200",
    bg: "bg-pink-600"
  },
  emerald: {
    gradient: "from-emerald-500 to-emerald-700",
    light: "bg-emerald-50",
    text: "text-emerald-700",
    shadow: "shadow-emerald-200",
    bg: "bg-emerald-600"
  }
}

export type ColorKey = keyof typeof colorThemes

/* -----------------------------------------
   2) MaterialCard
----------------------------------------- */
export function MaterialCard({
  children,
  className = "",
  elevation = 2,
  onClick
}: {
  children: React.ReactNode
  className?: string
  elevation?: 1 | 2 | 4 | 8
  onClick?: () => void
}) {
  const shadow = {
    1: "shadow-md",
    2: "shadow-lg",
    4: "shadow-xl",
    8: "shadow-2xl"
  }[elevation]

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`
        rounded-2xl bg-white/70 backdrop-blur-md transition-all duration-200 
        ${shadow} ${className}
        ${onClick ? "cursor-pointer hover:shadow-2xl" : ""}
      `}
    >
      {children}
    </motion.div>
  )
}

/* -----------------------------------------
   3) RippleButton (دکمه با افکت ریپل)
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
  const [ripples, setRipples] = useState<any[]>([])

  const createRipple = (e: any) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const id = Date.now()
    setRipples([...ripples, { x, y, id }])

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id))
    }, 600)

    onClick?.(e)
  }

  return (
    <button
      onClick={createRipple}
      className={`relative overflow-hidden rounded-lg ${className}`}
    >
      {ripples.map(r => (
        <span
          key={r.id}
          className="absolute animate-ping rounded-full bg-white/40"
          style={{
            left: r.x,
            top: r.y,
            width: 0,
            height: 0,
            animation: "ripple 0.5s ease-out"
          }}
        ></span>
      ))}
      {children}
    </button>
  )
}

/* -----------------------------------------
   4) IconWrapper
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
      className={`
        flex size-16 items-center justify-center rounded-xl bg-gradient-to-br ${theme.gradient} text-white 
        shadow-lg ${theme.shadow}
      `}
    >
      <Icon size={32} strokeWidth={2} />
    </div>
  )
}
