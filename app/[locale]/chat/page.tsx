"use client"

import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { ChatInput } from "@/components/chat/chat-input"
import { ChatSettings } from "@/components/chat/chat-settings"
import { ChatUI } from "@/components/chat/chat-ui"
import { ChatbotUIContext } from "@/context/context"
import useHotkey from "@/lib/hooks/use-hotkey"
import { useContext } from "react"
import { ProfileSettings } from "@/components/utility/profile-settings"
import { SampleQuestions } from "@/components/chat/sample-questions"
import { Announcements } from "@/components/utility/announcements"
import { SupportFab } from "@/components/utility/support-fab"

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
          <div className="mt-20 flex flex-1 flex-col items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-light tracking-tight md:text-5xl">
                <span className="text-5xl font-black md:text-6xl">
                  ، پرسینو{" "}
                </span>
                آماده‌ست
              </h1>
              <h2 className="mt-2 text-2xl font-light tracking-tight md:text-3xl">
                چه سوالی می‌خوای ازش{" "}
                <span className="text-3xl font-semibold md:text-4xl">
                  بپرسی؟
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
