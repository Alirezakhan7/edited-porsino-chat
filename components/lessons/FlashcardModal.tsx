"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  IconX,
  IconDeviceFloppy,
  IconArrowsExchange
} from "@tabler/icons-react"

interface FlashcardModalProps {
  isOpen: boolean
  onClose: () => void
  initialText: string // اسمش رو عوض کردیم به text کلی
  onSave: (front: string, back: string) => Promise<void>
}

export default function FlashcardModal({
  isOpen,
  onClose,
  initialText,
  onSave
}: FlashcardModalProps) {
  // تغییر استراتژی: متن سلکت شده میره تو "پشت کارت" (جواب)
  // "روی کارت" (سوال) خالی میمونه تا کاربر پرش کنه
  const [front, setFront] = useState("")
  const [back, setBack] = useState(initialText)
  const [loading, setLoading] = useState(false)

  // هر بار که مودال باز میشه، استیت‌ها رو ریست/آپدیت کن
  useEffect(() => {
    if (isOpen) {
      setBack(initialText) // متن سلکت شده میشه جواب
      setFront("") // سوال خالیه
    }
  }, [isOpen, initialText])

  const handleSave = async () => {
    if (!front.trim() || !back.trim()) return
    setLoading(true)
    await onSave(front, back)
    setLoading(false)
    onClose()
  }

  // قابلیت جابجایی متن‌ها (Swap)
  const handleSwap = () => {
    setFront(back)
    setBack(front)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[120] m-auto h-fit w-[90%] max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800 dark:text-white">
                ساخت فلش‌کارت 📝
              </h3>
              <button
                onClick={onClose}
                className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-red-100 hover:text-red-500 dark:bg-slate-800 dark:text-slate-400"
              >
                <IconX size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* --- روی کارت (سوال) --- */}
              <div className="relative">
                <label className="mb-2 flex items-center justify-between text-sm font-bold text-slate-500">
                  <span>روی کارت (سوال)</span>
                  <span className="text-xs font-normal opacity-70">
                    چیزی که از شما پرسیده می‌شود
                  </span>
                </label>
                <textarea
                  value={front}
                  onChange={e => setFront(e.target.value)}
                  placeholder="مثلا: وظیفه میتوکندری چیست؟"
                  className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 p-3 font-medium text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  rows={3}
                  autoFocus // به صورت خودکار فوکوس میکنه اینجا
                />
              </div>

              {/* دکمه جابجایی */}
              <div className="flex justify-center">
                <button
                  onClick={handleSwap}
                  className="rounded-full bg-slate-100 p-1.5 text-slate-500 transition-colors hover:bg-blue-100 hover:text-blue-600 dark:bg-slate-800"
                  title="جابجایی متن‌ها"
                >
                  <IconArrowsExchange size={18} />
                </button>
              </div>

              {/* --- پشت کارت (جواب) --- */}
              <div>
                <label className="mb-2 flex items-center justify-between text-sm font-bold text-slate-500">
                  <span>پشت کارت (جواب)</span>
                  <span className="text-xs font-normal opacity-70">
                    متن انتخاب شده شما
                  </span>
                </label>
                <textarea
                  value={back}
                  onChange={e => setBack(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-100 bg-emerald-50/50 p-3 font-medium text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                  rows={4}
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl py-3 font-bold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                لغو
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !front.trim() || !back.trim()}
                className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white shadow-lg shadow-blue-500/30 transition-transform active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  "در حال ذخیره..."
                ) : (
                  <>
                    <IconDeviceFloppy size={20} />
                    ذخیره کارت
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
