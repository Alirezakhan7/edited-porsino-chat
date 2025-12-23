"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  IconX,
  IconRobot,
  IconSend,
  IconSparkles,
  IconLock
} from "@tabler/icons-react"
import ReactMarkdown from "react-markdown"

interface QuickAiModalProps {
  isOpen: boolean
  onClose: () => void
  contextText: string
  onAsk: (question: string, context: string) => Promise<string | undefined>
}

export default function QuickAiModal({
  isOpen,
  onClose,
  contextText,
  onAsk
}: QuickAiModalProps) {
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const answerRef = useRef<HTMLDivElement>(null)

  // ریست کردن وضعیت وقتی مودال باز می‌شود (یا متن جدید انتخاب می‌شود)
  useEffect(() => {
    if (isOpen) {
      setQuestion("")
      setAnswer("")
      setIsLoading(false)
    }
  }, [isOpen, contextText])

  // اسکرول خودکار به پایین وقتی جواب می‌آید
  useEffect(() => {
    if (answerRef.current) {
      answerRef.current.scrollTop = answerRef.current.scrollHeight
    }
  }, [answer])

  const handleSubmit = async () => {
    // اگر جوابی وجود دارد (یعنی قبلاً پرسیده) یا در حال لود است، اجازه نده
    if (!question.trim() || isLoading || answer) return

    setIsLoading(true)

    try {
      const result = await onAsk(question, contextText)
      if (result) {
        setAnswer(result)
      }
    } catch (error) {
      console.error(error)
      setAnswer("متاسفانه مشکلی پیش آمد.")
    } finally {
      setIsLoading(false)
    }
  }

  // ✅ متغیر کمکی برای چک کردن پایان مکالمه
  const isFinished = !!answer && !isLoading

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
            className="fixed inset-0 z-[120] m-auto flex h-[85vh] w-[95%] max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            {/* هدر */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
                  <IconRobot size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white">
                    دستیار هوشمند
                  </h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    پاسخ‌دهی سریع بر اساس متن درس
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700"
              >
                <IconX size={20} />
              </button>
            </div>

            {/* بدنه */}
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
              {/* متن زمینه */}
              <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/30 dark:bg-indigo-900/10">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  <IconSparkles size={14} />
                  متن انتخاب شده:
                </div>
                <p className="line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {contextText}
                </p>
              </div>

              {/* سوال کاربر (نمایش بعد از پرسیدن) */}
              {answer && (
                <div className="flex justify-end">
                  <div className="rounded-2xl rounded-tr-none bg-slate-100 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {question}
                  </div>
                </div>
              )}

              {/* پاسخ هوش مصنوعی */}
              {answer && (
                <div className="flex gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
                    <IconRobot size={18} />
                  </div>
                  <div
                    ref={answerRef}
                    className="max-h-[40vh] overflow-y-auto rounded-2xl rounded-tl-none bg-white p-4 text-sm leading-7 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700"
                  >
                    <ReactMarkdown>{answer}</ReactMarkdown>
                  </div>
                </div>
              )}

              {/* لودینگ */}
              {isLoading && (
                <div className="flex items-center gap-2 self-start p-4 text-sm text-slate-500">
                  <span className="animate-pulse">در حال فکر کردن...</span>
                </div>
              )}
            </div>

            {/* فوتر (ورودی سوال) */}
            <div className="border-t border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="relative flex items-center">
                <input
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  // ✅ اگر جواب آمده باشد، اینپوت غیرفعال می‌شود
                  disabled={isLoading || isFinished}
                  placeholder={
                    isFinished
                      ? "برای سوال جدید، لطفاً متن دیگری انتخاب کنید."
                      : "سوال خود را درباره متن بالا بپرسید..."
                  }
                  className={`
                    w-full rounded-2xl border-2 bg-slate-50 py-4 pl-14 pr-4 text-sm font-medium focus:outline-none 
                    ${
                      isFinished
                        ? "cursor-not-allowed border-slate-100 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-900"
                        : "border-slate-200 focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    }
                  `}
                  autoFocus={!isFinished}
                />

                <button
                  onClick={handleSubmit}
                  // ✅ دکمه هم غیرفعال می‌شود
                  disabled={!question.trim() || isLoading || isFinished}
                  className={`
                    absolute left-2 rounded-xl p-2.5 transition-transform 
                    ${
                      isFinished
                        ? "bg-slate-200 text-slate-400 dark:bg-slate-800"
                        : "bg-indigo-600 text-white hover:scale-105 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800"
                    }
                  `}
                >
                  {isFinished ? <IconLock size={18} /> : <IconSend size={18} />}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
