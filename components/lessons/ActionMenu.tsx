"use client"

import { useRef, useLayoutEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { IconCards, IconRobot } from "@tabler/icons-react"

interface ActionMenuProps {
  position: {
    top: number
    left: number
    width: number
    height: number
    bottom: number
  } | null
  onFlashcard: () => void
  onAskAI: () => void
}

export default function ActionMenu({
  position,
  onFlashcard,
  onAskAI
}: ActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // استیت برای ذخیره مکان منو و مکان فلش
  const [layout, setLayout] = useState({
    top: 0,
    left: 0,
    arrowLeft: 0, // مکان افقی فلش نسبت به باکس منو
    isBelow: false // آیا منو زیر متن افتاده؟
  })

  const [isVisible, setIsVisible] = useState(false)

  useLayoutEffect(() => {
    if (!position || !menuRef.current) return

    const menuRect = menuRef.current.getBoundingClientRect()
    const menuWidth = menuRect.width
    const screenWidth = window.innerWidth
    const PADDING = 16 // فاصله امن از لبه‌های گوشی

    // ۱. مرکز متن انتخاب شده کجاست؟
    const selectionCenter = position.left + position.width / 2

    // ۲. محاسبه مکان چپ منو (تلاش می‌کنیم وسط متن باشد)
    let left = selectionCenter - menuWidth / 2

    // ۳. جلوگیری از بیرون زدن از چپ (Clamp Left)
    if (left < PADDING) {
      left = PADDING
    }

    // ۴. جلوگیری از بیرون زدن از راست (Clamp Right)
    if (left + menuWidth > screenWidth - PADDING) {
      left = screenWidth - menuWidth - PADDING
    }

    // ۵. محاسبه مکان فلش (باید دقیقاً به selectionCenter اشاره کند)
    // فرمول: مکان متن - مکان شروع منو
    let arrowLeft = selectionCenter - left

    // محدود کردن فلش که از گوشه‌های گرد دکمه بیرون نزند
    if (arrowLeft < 12) arrowLeft = 12
    if (arrowLeft > menuWidth - 12) arrowLeft = menuWidth - 12

    // ۶. محاسبه ارتفاع (بالا یا پایین متن)
    let top = position.top - 60
    let isBelow = false

    // اگر بالای صفحه جا نبود، ببر پایین
    if (top < 60) {
      top = position.bottom + 15
      isBelow = true
    }

    setLayout({ top, left, arrowLeft, isBelow })
    setIsVisible(true)
  }, [position])

  if (!position) return null

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: isVisible ? 1 : 0, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 10 }}
        style={{
          position: "fixed",
          top: layout.top,
          left: layout.left,
          // نکته مهم: translateX را حذف کردیم چون left را دقیق حساب کردیم
          zIndex: 100
        }}
        className="flex items-center gap-1 rounded-xl border border-white/20 bg-slate-900 p-1.5 text-white shadow-xl dark:bg-white dark:text-slate-900"
        onMouseDown={e => e.preventDefault()}
      >
        <button
          onClick={onFlashcard}
          className="flex items-center gap-1.5 text-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-colors hover:bg-white/20 dark:hover:bg-slate-200"
        >
          <IconCards size={16} />
          <span>فلش‌کارت</span>
        </button>

        <div className="h-4 w-px bg-white/20 dark:bg-slate-300" />

        <button
          onClick={onAskAI}
          className="flex items-center gap-1.5 text-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-colors hover:bg-white/20 dark:hover:bg-slate-200"
        >
          <IconRobot size={16} />
          <span>هوش مصنوعی</span>
        </button>

        {/* فلش کوچک (داینامیک) */}
        <div
          className={`absolute size-3 rotate-45 border border-white/20 bg-slate-900 dark:border-transparent dark:bg-white
           ${
             layout.isBelow
               ? "-top-1.5 border-b-0 border-r-0"
               : "-bottom-1.5 border-l-0 border-t-0"
           }
           `}
          style={{
            left: layout.arrowLeft, // فلش با متن حرکت می‌کند
            transform: "translateX(-50%) rotate(45deg)"
          }}
        />
      </motion.div>
    </AnimatePresence>
  )
}
