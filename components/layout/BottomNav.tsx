"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  IconMessage,
  IconLayoutGrid,
  IconUser,
  IconCards
} from "@tabler/icons-react"

// تعریف رنگ‌ها برای هر آیتم
const colorMap: Record<string, { text: string; bg: string; dot: string }> = {
  blue: {
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/15", // غلظت کم برای پس‌زمینه
    dot: "bg-blue-600 dark:bg-blue-400"
  },
  emerald: {
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/15",
    dot: "bg-emerald-600 dark:bg-emerald-400"
  },
  violet: {
    text: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/15",
    dot: "bg-violet-600 dark:bg-violet-400"
  },
  rose: {
    text: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/15",
    dot: "bg-rose-600 dark:bg-rose-400"
  }
}

export const navItems = [
  { href: "/chat", label: "چت", icon: IconMessage, color: "blue" },
  { href: "/path", label: "درس", icon: IconLayoutGrid, color: "emerald" }, // سبز برای درس
  { href: "/upload", label: "فلش‌کارت", icon: IconCards, color: "violet" }, // بنفش برای فلش‌کارت
  { href: "/profile", label: "پروفایل", icon: IconUser, color: "rose" } // صورتی برای پروفایل
]

export function BottomNav({ className = "" }: { className?: string }) {
  const pathname = usePathname()
  if (pathname.includes("/play")) {
    return null
  }
  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 h-20 w-full md:hidden",
        "bg-white/80 backdrop-blur-2xl dark:bg-slate-950/80",
        "border-t border-white/20 dark:border-white/5",
        "shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]",
        className
      )}
    >
      <div className="mx-auto grid h-full max-w-md grid-cols-4 place-items-center px-4 pb-2">
        {navItems.map(item => {
          const isActive =
            item.href === "/chat"
              ? pathname.startsWith("/chat")
              : pathname.startsWith(item.href)

          // دریافت رنگ مربوط به این آیتم
          const activeColor = colorMap[item.color]

          return (
            <Link
              key={item.href}
              href={item.href}
              className="group relative flex w-full flex-col items-center justify-center gap-1 py-1"
            >
              {/* هاله نورانی پشت آیتم فعال (اصلاح شده: کوچک‌تر و محو‌تر) */}
              {isActive && (
                <motion.div
                  layoutId="nav-glow"
                  // تغییر: inset-1 برای کوچک‌تر شدن و blur-md برای کاهش پخش نور
                  className={cn(
                    "absolute inset-1 -z-10 rounded-2xl blur-md dark:opacity-80",
                    activeColor.bg
                  )}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}

              {/* آیکون */}
              <div
                className={cn(
                  "relative rounded-2xl p-1.5 transition-all duration-300",
                  isActive ? "-translate-y-1" : "group-hover:-translate-y-0.5"
                )}
              >
                <item.icon
                  size={26}
                  stroke={isActive ? 2.5 : 1.5}
                  className={cn(
                    "transition-colors duration-300",
                    isActive
                      ? activeColor.text
                      : "text-slate-500 dark:text-slate-400"
                  )}
                />

                {/* نقطه نشانگر */}
                {isActive && (
                  <motion.div
                    layoutId="nav-dot"
                    className={cn(
                      "absolute -bottom-2 left-1/2 size-1 -translate-x-1/2 rounded-full",
                      activeColor.dot
                    )}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </div>

              {/* متن */}
              <span
                className={cn(
                  "text-[10px] font-bold transition-all duration-300",
                  isActive
                    ? activeColor.text
                    : "text-slate-500 opacity-80 dark:text-slate-400"
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
