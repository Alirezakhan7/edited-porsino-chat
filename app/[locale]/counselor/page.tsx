"use client"

import { useState, useContext } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChatbotUIContext } from "@/context/context"
import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { ChatInput } from "@/components/chat/chat-input"
import { ChatSettings } from "@/components/chat/chat-settings"
import { ChatUI } from "@/components/chat/chat-ui"
import { ProfileSettings } from "@/components/utility/profile-settings"
import { SupportFab } from "@/components/utility/support-fab"
import useHotkey from "@/lib/hooks/use-hotkey"
import { IconSparkles } from "@tabler/icons-react"

import {
  mainCategories,
  RenderCategoryContent
} from "@/components/chat/sample-counselor-questions"

export default function CounselorPage() {
  useHotkey("o", () => handleNewChat())
  useHotkey("l", () => handleFocusChatInput())

  const { chatMessages, setUserInput } = useContext(ChatbotUIContext)
  const { handleNewChat, handleFocusChatInput } = useChatHandler()
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

  const handleSampleQuestionClick = (question: string) => {
    setUserInput(question)
    handleFocusChatInput()
  }

  return (
    <>
      {chatMessages.length === 0 ? (
        <div className="relative flex h-full flex-col items-center justify-center overflow-y-auto">
          {/* Header */}
          <div className="absolute left-3 top-3 flex items-center gap-2 sm:left-4 sm:top-4">
            <div className="hidden md:block">
              <ProfileSettings />
            </div>
            <span className="hidden text-base font-bold sm:inline-block md:text-lg">
              Porsino AI
            </span>
          </div>

          <div className="absolute right-2 top-3 flex items-start gap-1 sm:right-3 sm:top-4 md:top-3">
            <ChatSettings />
          </div>

          {/* -------------------------------------------------- */}
          {/*                Main Page Content                   */}
          {/* -------------------------------------------------- */}
          <div className="flex w-full flex-1 flex-col items-center justify-center px-3 py-6 sm:px-4 md:py-8">
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-6 w-full text-center"
              dir="rtl"
            >
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-green-500/20 px-4 py-2">
                <IconSparkles
                  size={18}
                  className="text-emerald-600 dark:text-emerald-400"
                />
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  مشاور هوشمند
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                <span className="bg-gradient-to-l from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  راهنمای کنکور
                </span>
              </h1>

              <p className="text-muted-foreground mt-2 text-sm md:text-base">
                برنامه‌ریزی، استراتژی و مسیر موفقیت
              </p>
            </motion.div>

            {/* Chat Input */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="w-full max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-3xl"
            >
              <ChatInput />
            </motion.div>

            {/* -------------------------------------------------- */}
            {/*         Mobile Categories (2x2 animated grid)       */}
            {/* -------------------------------------------------- */}
            <div className="mt-4 grid w-full max-w-xs grid-cols-2 gap-3 sm:hidden">
              {mainCategories.map((cat, i) => {
                const Icon = cat.icon
                return (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`
                      group rounded-2xl border p-4 ${cat.borderColor} ${cat.bgColor}
                      flex flex-col items-center gap-2 shadow-sm transition-all 
                      hover:shadow-md active:scale-95
                    `}
                  >
                    <div
                      className={`
                        flex size-12 items-center justify-center rounded-xl
                        bg-gradient-to-br ${cat.color} text-white shadow-lg
                        transition-transform group-hover:scale-110
                      `}
                    >
                      <Icon size={22} strokeWidth={2} />
                    </div>
                    <span className="text-xs font-bold">{cat.title}</span>
                  </motion.button>
                )
              })}
            </div>

            {/* -------------------------------------------------- */}
            {/*               Desktop Version                       */}
            {/* -------------------------------------------------- */}
            <div className="mt-6 hidden w-full max-w-2xl md:block">
              <div className="grid grid-cols-2 gap-4">
                {mainCategories.map(cat => {
                  const Icon = cat.icon
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className="hover:bg-muted rounded-xl border p-5 text-center shadow-sm transition"
                    >
                      <Icon size={28} className="mx-auto mb-2" />
                      <span className="font-semibold">{cat.title}</span>
                    </button>
                  )
                })}
              </div>

              {selectedCategory && (
                <div className="mt-5">
                  <RenderCategoryContent
                    category={
                      mainCategories.find(c => c.id === selectedCategory)!
                    }
                    onClose={() => setSelectedCategory(null)}
                    onClickQuestion={handleSampleQuestionClick}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <ChatUI />
      )}

      {/* -------------------------------------------------- */}
      {/*                   Bottom Sheet (Mobile)              */}
      {/* -------------------------------------------------- */}
      <AnimatePresence>
        {selectedCategory && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setSelectedCategory(null)}
          >
            <motion.div
              onClick={e => e.stopPropagation()}
              className="absolute bottom-0 max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-neutral-900"
            >
              <RenderCategoryContent
                category={mainCategories.find(c => c.id === selectedCategory)!}
                onClose={() => setSelectedCategory(null)}
                onClickQuestion={handleSampleQuestionClick}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Support FAB */}
      <div className="hidden md:block">
        <SupportFab />
      </div>
    </>
  )
}
