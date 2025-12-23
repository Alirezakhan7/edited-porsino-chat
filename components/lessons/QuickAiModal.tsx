// components/lessons/QuickAiModal.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { IconX, IconRobot, IconSend, IconSparkles } from "@tabler/icons-react"
import ReactMarkdown from "react-markdown"

interface QuickAiModalProps {
  isOpen: boolean
  onClose: () => void
  contextText: string // متنی که کاربر انتخاب کرده
  onAsk: (question: string, context: string) => Promise<ReadableStream | string> // تابع ارسال به سرور
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
  const [isStreaming, setIsStreaming] = useState(false)

  // برای اسکرول خودکار به پایین جواب
  const answerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setQuestion("")
      setAnswer("")
      setIsLoading(false)
      setIsStreaming(false)
    }
  }, [isOpen])

  // اسکرول خودکار وقتی جواب تایپ می‌شود
  useEffect(() => {
    if (answerRef.current) {
      answerRef.current.scrollTop = answerRef.current.scrollHeight
    }
  }, [answer])

  const handleSubmit = async () => {
    if (!question.trim() || isLoading) return

    setIsLoading(true)
    setAnswer("") // پاک کردن جواب قبلی

    try {
      const responseStream = await onAsk(question, contextText)

      setIsLoading(false)
      setIsStreaming(true)

      // اگر خروجی استریم باشد (ReadableStream)
      if (responseStream instanceof ReadableStream) {
        const reader = responseStream.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          // اضافه کردن تکه متن جدید به جواب
          setAnswer(prev => prev + chunk)
        }
      } else {
        // اگر رشته معمولی باشد
        setAnswer(responseStream as string)
      }
    } catch (error) {
      console.error(error)
      setAnswer("متاسفانه مشکلی پیش آمد. لطفا دوباره تلاش کنید.")
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* بک‌گراند تار */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm"
          />

          {/* باکس اصلی */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[120] m-auto flex h-[85vh] w-[95%] max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            {/* 1. هدر */}
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

            {/* 2. بدنه (اسکرول‌خور) */}
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
              {/* متن زمینه (Context) */}
              <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/30 dark:bg-indigo-900/10">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  <IconSparkles size={14} />
                  متن انتخاب شده (مرجع سوال):
                </div>
                <p className="line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {contextText}
                </p>
                {/* افکت محو شدن پایین متن */}
                <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-indigo-50 to-transparent dark:from-[#1e1b4b] dark:to-transparent" />
              </div>

              {/* نمایش پاسخ هوش مصنوعی */}
              {answer && (
                <div className="flex gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
                    <IconRobot size={18} />
                  </div>
                  <div
                    ref={answerRef}
                    className="max-h-[40vh] overflow-y-auto rounded-2xl rounded-tl-none bg-white p-4 text-sm leading-7 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700"
                  >
                    {/* رندر مارک‌داون برای نمایش تمیز جواب */}
                    <ReactMarkdown>{answer}</ReactMarkdown>
                    {isStreaming && <span className="animate-pulse">▍</span>}
                  </div>
                </div>
              )}

              {/* لودینگ */}
              {isLoading && !answer && (
                <div className="flex items-center gap-2 self-start p-4 text-sm text-slate-500">
                  <div className="size-2 animate-bounce rounded-full bg-indigo-400 delay-0" />
                  <div className="size-2 animate-bounce rounded-full bg-indigo-400 delay-150" />
                  <div className="size-2 animate-bounce rounded-full bg-indigo-400 delay-300" />
                  <span className="mr-2">در حال فکر کردن...</span>
                </div>
              )}
            </div>

            {/* 3. فوتر (ورودی سوال) */}
            <div className="border-t border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="relative flex items-center">
                <input
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  placeholder="سوال خود را درباره متن بالا بپرسید..."
                  className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 py-4 pl-14 pr-4 text-sm font-medium focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  autoFocus
                />
                <button
                  onClick={handleSubmit}
                  disabled={!question.trim() || isLoading || isStreaming}
                  className="absolute left-2 rounded-xl bg-indigo-600 p-2.5 text-white transition-transform hover:scale-105 hover:bg-indigo-700 disabled:bg-slate-300 disabled:hover:scale-100 dark:disabled:bg-slate-800"
                >
                  <IconSend size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
