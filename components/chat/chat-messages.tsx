import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { ChatbotUIContext } from "@/context/context"
import { Tables } from "@/supabase/types"
import { FC, useContext, useEffect, useRef, useState } from "react"
import { Message } from "../messages/message"
import { BookOpen, Calculator, Atom, ChevronRight } from "lucide-react"

// =================================================================
// 👇 کامپوننت جدید برای دکمه‌های پیشنهادی (انتقال داده شده)
// =================================================================
interface ChatSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void
}

const ChatSuggestions: FC<ChatSuggestionsProps> = ({ onSuggestionClick }) => {
  const { suggestions, chatSettings } = useContext(ChatbotUIContext)

  // فقط اگر مدل ریاضی انتخاب شده بود و پیشنهادی وجود داشت، دکمه‌ها را نمایش بده
  if (
    chatSettings?.model !== "math-advanced" ||
    !suggestions ||
    suggestions.length === 0
  ) {
    return null
  }

  return (
    <div className="flex flex-wrap justify-center gap-2 p-2">
      {suggestions.map((text, index) => (
        <button
          key={index}
          className="rounded-xl bg-gray-100 px-4 py-2 text-right text-sm font-semibold text-gray-800 shadow-md transition-colors duration-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          dir="rtl" // این attribute جهت متن را درست می‌کند
          onClick={() => onSuggestionClick(text)}
        >
          {text}
        </button>
      ))}
    </div>
  )
}
// =================================================================

interface ChatMessagesProps {
  setUserInput: (input: string) => void
  handleFocusChatInput: () => void
}

export const ChatMessages: FC<ChatMessagesProps> = ({
  setUserInput,
  handleFocusChatInput
}) => {
  const {
    chatMessages,
    chatFileItems,
    chatSettings,
    topicSummary,
    suggestions
  } = useContext(ChatbotUIContext)
  const { handleSendEdit } = useChatHandler()
  const [editingMessage, setEditingMessage] = useState<Tables<"messages">>()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [chatMessages, suggestions]) // Add suggestions to dependency array

  const isClassroomMode = ["math-advanced", "phys-advanced"].includes(
    chatSettings?.model || ""
  )

  const getSubjectIcon = () => {
    switch (chatSettings?.model) {
      case "math-advanced":
        return <Calculator className="size-5" />

      default:
        return <BookOpen className="size-5" />
    }
  }

  const getSubjectName = () => {
    switch (chatSettings?.model) {
      case "math-advanced":
        return "Mathematics"

      default:
        return "Learning"
    }
  }

  // در فایل chat-messages.tsx
  const containerClasses = isClassroomMode
    ? `
        mx-auto max-w-5xl relative /* mb-40 */
        bg-white dark:bg-gray-900
        border border-gray-200 dark:border-gray-700
        rounded-2xl shadow-xl /* overflow-hidden */
        transition-all duration-300 ease-in-out
        backdrop-blur-sm
        before:absolute before:inset-0 before:bg-gradient-to-br
        before:from-emerald-50/30 before:to-teal-50/30
        dark:before:from-emerald-900/10 dark:before:to-teal-900/10
        before:pointer-events-none
      `
    : "mx-auto max-w-4xl space-y-6" // mb-40 از اینجا هم حذف شد

  const messagesContainerClasses = isClassroomMode
    ? `
      relative z-10 p-4 md:p-6 lg:p-8 space-y-4
      // خصوصیات مربوط به اسکرول حذف شدند
    `
    : "space-y-6"

  // 👇 تابع جدید برای مدیریت کلیک روی دکمه‌های پیشنهادی
  const handleSuggestionClick = (suggestionText: string) => {
    setUserInput(suggestionText)
    // با فوکوس کردن روی اینپوت، کاربر می‌تواند بلافاصله اینتر بزند
    handleFocusChatInput()
  }

  return (
    <div className="py-4 md:pt-6">
      <div className={containerClasses}>
        {/* Modern Classroom Header */}
        {isClassroomMode && (
          <div
            className="
            relative z-10 border-b border-emerald-500/20 bg-gradient-to-r from-emerald-600 to-teal-600
            p-4 text-white md:p-6
            lg:px-8 dark:from-emerald-800
            dark:to-teal-800
          "
            dir="rtl"
          >
            <div className="flex items-center justify-between pr-16 md:pr-0">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div
                  className="
                  rounded-full border
                  border-white/20 bg-white/10
                  p-2 backdrop-blur-sm
                "
                >
                  {getSubjectIcon()}
                </div>
                <div className="text-right">
                  <h2 className="text-lg font-bold md:text-xl">
                    کلاس {getSubjectName() === "Mathematics"}
                  </h2>
                  {topicSummary && (
                    <p className="mt-1 text-sm text-emerald-100 opacity-90">
                      {topicSummary}
                    </p>
                  )}
                </div>
              </div>

              <div className="hidden items-center space-x-2 space-x-reverse text-sm text-emerald-100 md:flex">
                <span>یادگیری پیشرفته</span>
                <ChevronRight className="size-4 rotate-180" />
                <span
                  className="
                  rounded-full border border-white/20
                  bg-white/10 px-3
                  py-1 font-medium
                  backdrop-blur-sm
                "
                >
                  تعاملی
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Messages Container */}
        <div className={messagesContainerClasses}>
          {/* Welcome Message for Classroom Mode */}
          {isClassroomMode && chatMessages.length === 0 && (
            <div
              className="
              mx-2 rounded-xl border
              border-emerald-200/50 bg-gradient-to-br from-emerald-50/50
              to-teal-50/50 py-8
              text-center backdrop-blur-sm md:mx-4 md:py-12
              dark:border-emerald-700/50 dark:from-emerald-900/20
              dark:to-teal-900/20
            "
              dir="rtl"
            >
              <div
                className="
                mb-4 inline-flex rounded-full
                border border-emerald-200/50
                bg-emerald-100/70 p-3
                text-emerald-600
                backdrop-blur-sm
                dark:border-emerald-700/50 dark:bg-emerald-900/40 dark:text-emerald-400
              "
              >
                {getSubjectIcon()}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-emerald-800 dark:text-emerald-200">
                به کلاس {getSubjectName() === "Mathematics"} خوش آمدید
              </h3>
              <p className="mx-auto max-w-md text-sm text-emerald-600 dark:text-emerald-400">
                هر سوالی درباره {getSubjectName() === "Mathematics"} داشته
                باشید، با توضیحات کامل و مثال‌های عملی پاسخ خواهم داد.
              </p>
            </div>
          )}

          {/* Chat Messages */}
          <div className={isClassroomMode ? "space-y-4" : "space-y-6"}>
            {chatMessages
              .sort(
                (a, b) => a.message.sequence_number - b.message.sequence_number
              )
              .map((chatMessage, index, array) => {
                const messageFileItems = chatFileItems.filter(
                  (chatFileItem, _, self) =>
                    chatMessage.fileItems.includes(chatFileItem.id) &&
                    self.findIndex(item => item.id === chatFileItem.id) === _
                )

                return (
                  <div
                    key={chatMessage.message.id}
                    className={
                      isClassroomMode
                        ? `
                      overflow-hidden rounded-lg border border-gray-200/50
                      bg-white/50 backdrop-blur-sm
                      transition-all duration-300
                      ease-in-out hover:scale-[1.01]
                      hover:shadow-lg dark:border-gray-700/50 dark:bg-gray-800/50
                    `
                        : ""
                    }
                  >
                    <Message
                      message={chatMessage.message}
                      fileItems={messageFileItems}
                      isEditing={editingMessage?.id === chatMessage.message.id}
                      isLast={index === array.length - 1}
                      onStartEdit={setEditingMessage}
                      onCancelEdit={() => setEditingMessage(undefined)}
                      onSubmitEdit={handleSendEdit}
                    />
                  </div>
                )
              })}
          </div>

          {/* 👇 کامپوننت دکمه‌های پیشنهادی اینجا قرار می‌گیرد */}
          {["math-advanced", "physics-advanced"].includes(
            chatSettings?.model || ""
          ) &&
            chatMessages.length > 0 && (
              <div className="mt-6">
                <ChatSuggestions onSuggestionClick={handleSuggestionClick} />
              </div>
            )}
        </div>

        <div ref={scrollRef} />
      </div>
    </div>
  )
}
