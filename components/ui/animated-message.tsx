"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

export default function AnimatedMessage({ message }: { message: string }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000)
    return () => clearTimeout(timer)
  }, [message])

  if (!message || !visible) return null

  const successKeywords = [
    "ایمیل",
    "ارسال",
    "با موفقیت",
    "انجام شد",
    "تأیید شد",
    "ثبت‌نام با موفقیت",
    "رمز عبور تغییر یافت",
    "ورود موفق"
  ]

  const isSuccess = successKeywords.some(keyword => message.includes(keyword))

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={message}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4 }}
        className={`mb-4 rounded-md p-3 text-center text-sm
          ${isSuccess ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
      >
        {message}
      </motion.p>
    </AnimatePresence>
  )
}
