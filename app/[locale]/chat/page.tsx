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
          {/* START: Top-left header change */}
          <div className="absolute left-4 top-2 flex items-center gap-2">
            <ProfileSettings />
            <span className="hidden translate-y-2 text-lg font-bold sm:inline-block">
              Porsino AI
            </span>
          </div>

          {/* END: Top-left header change */}

          <div className="absolute right-2 top-2 flex items-center gap-1">
            <Announcements />
            <ChatSettings />
          </div>

          {/* Section 1: Main Title */}
          {/* START: Main heading change */}
          <div className="-mt-20 flex flex-1 items-center justify-center">
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
          </div>

          {/* END: Main heading change */}

          {/* Section 2: Bottom content (kept separate for layout) */}
          <div className="w-full min-w-[300px] items-end px-2 pb-3 pt-0 sm:w-[600px] sm:pb-8 sm:pt-5 md:w-[700px] lg:w-[700px] xl:w-[800px]">
            <div className="mb-4 flex justify-center">
              <SampleQuestions onQuestionClick={handleSampleQuestionClick} />
            </div>
            <ChatInput />
          </div>
        </div>
      ) : (
        <ChatUI />
      )}
      {/* Dialogs should be managed by the Announcements component now */}
    </>
  )
}
