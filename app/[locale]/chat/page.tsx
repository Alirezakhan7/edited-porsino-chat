"use client"

import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { ChatInput } from "@/components/chat/chat-input"
// حذف ایمپورت‌های مستقیم سنگین
// import { ChatSettings } from "@/components/chat/chat-settings"
import { ChatUI } from "@/components/chat/chat-ui"
import { ChatbotUIContext } from "@/context/context"
import useHotkey from "@/lib/hooks/use-hotkey"
import { useContext } from "react"
// import { ProfileSettings } from "@/components/utility/profile-settings"
import { SampleQuestions } from "@/components/chat/sample-questions"
// import { Announcements } from "@/components/utility/announcements"
// import { SupportFab } from "@/components/utility/support-fab"

import dynamic from "next/dynamic"

// بارگذاری تنبل (Lazy Load) برای کامپوننت‌های فرعی
// این کار باعث میشه حجم اولیه صفحه به شدت کم بشه و TBT پایین بیاد
const ChatSettings = dynamic(
  () => import("@/components/chat/chat-settings").then(mod => mod.ChatSettings),
  {
    ssr: false // تنظیمات در سرور رندر نمیشه (چون مودال هست)
  }
)
const ProfileSettings = dynamic(
  () =>
    import("@/components/utility/profile-settings").then(
      mod => mod.ProfileSettings
    ),
  {
    ssr: false
  }
)
const Announcements = dynamic(
  () =>
    import("@/components/utility/announcements").then(mod => mod.Announcements),
  {
    ssr: false
  }
)
const SupportFab = dynamic(
  () => import("@/components/utility/support-fab").then(mod => mod.SupportFab),
  {
    ssr: false
  }
)

export default function ChatPage() {
  useHotkey("o", () => handleNewChat())
  useHotkey("l", () => {
    handleFocusChatInput()
  })

  const { chatMessages, setUserInput } = useContext(ChatbotUIContext)
  const { handleNewChat, handleFocusChatInput } = useChatHandler()

  const handleSampleQuestionClick = (question: string) => {
    if (setUserInput) {
      setUserInput(question)
      handleFocusChatInput()
    }
  }

  return (
    <>
      {chatMessages.length === 0 ? (
        <div className="relative flex h-full flex-col items-center">
          {/* START: Top-left header */}
          <div className="absolute left-4 top-3 flex items-center gap-2">
            <div className="hidden md:block">
              {/* پروفایل تا وقتی لازم نباشه لود نمیشه */}
              <ProfileSettings />
            </div>
            <span className="mt-[6px] hidden text-lg font-bold sm:inline-block">
              Porsino AI
            </span>
          </div>

          {/* END: Top-left header */}

          <div className="absolute -right-3 top-4 flex items-center gap-1 md:top-3">
            <Announcements />
            <ChatSettings />
          </div>

          {/* Section 1: Main Title */}
          <div className="mt-10 flex flex-1 flex-col items-center justify-center md:mt-20">
            <div className="px-4 text-center">
              <h1 className="text-2xl font-light tracking-tight text-slate-800 md:text-5xl dark:text-slate-200">
                <span className="text-3xl font-black text-blue-600 md:text-6xl dark:text-blue-500">
                  ، پرسینو{" "}
                </span>
                آماده‌ست
              </h1>
              <h2 className="mt-3 text-lg font-light tracking-tight text-slate-600 md:text-3xl dark:text-slate-400">
                امروز چه چیزی می‌خوای چه سوالی می‌خوای ازش{" "}
                <span className="text-xl font-semibold text-slate-800 md:text-4xl dark:text-slate-200">
                  یاد بگیری؟ بپرسی؟
                </span>
              </h2>
            </div>

            {/* 👇 فقط در موبایل نمایش داده شود */}
            <div className="mt-6 flex justify-center md:hidden">
              <SampleQuestions onQuestionClick={handleSampleQuestionClick} />
            </div>
          </div>

          {/* Section 2: Bottom content */}
          <div className="w-full min-w-[300px] items-end px-2 pb-3 pt-0 sm:w-[600px] sm:pb-8 sm:pt-5 md:w-[700px] lg:w-[700px] xl:w-[800px]">
            {/* 👇 فقط در دسکتاپ نمایش داده شود */}
            <div className="mb-4 hidden justify-center md:flex">
              <SampleQuestions onQuestionClick={handleSampleQuestionClick} />
            </div>

            <ChatInput />
          </div>
        </div>
      ) : (
        <ChatUI />
      )}
      <div className="hidden md:block">
        <SupportFab />
      </div>
    </>
  )
}
