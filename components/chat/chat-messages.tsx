import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { ChatbotUIContext } from "@/context/context"
import { Tables } from "@/supabase/types"
import { FC, useContext, useEffect, useRef, useState } from "react"
import { Message } from "../messages/message"
import { BookOpen, Calculator, Atom, ChevronRight } from "lucide-react"

interface ChatMessagesProps {}

export const ChatMessages: FC<ChatMessagesProps> = ({}) => {
  const { chatMessages, chatFileItems, chatSettings, topicSummary } =
    useContext(ChatbotUIContext)
  const { handleSendEdit } = useChatHandler()
  const [editingMessage, setEditingMessage] = useState<Tables<"messages">>()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [chatMessages])

  const isClassroomMode = ["math-advanced", "physics-advanced"].includes(
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

  const containerClasses = isClassroomMode
    ? `
      mx-auto max-w-5xl relative
      bg-white dark:bg-gray-900
      border border-gray-200 dark:border-gray-700
      rounded-2xl shadow-xl overflow-hidden
      transition-all duration-300 ease-in-out
      backdrop-blur-sm
      before:absolute before:inset-0 before:bg-gradient-to-br 
      before:from-blue-50/50 before:to-indigo-50/50 
      dark:before:from-blue-900/10 dark:before:to-purple-900/10
      before:pointer-events-none
    `
    : "mx-auto max-w-4xl space-y-6"

  const messagesContainerClasses = isClassroomMode
    ? `
      relative z-10 p-4 md:p-6 lg:p-8 space-y-4
      max-h-[80vh] overflow-y-auto
      scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600
      scrollbar-track-transparent
    `
    : "space-y-6"

  return (
    <div className="flex-1 overflow-y-auto pb-36 pt-4 md:pt-6">
      <div className={containerClasses}>
        {/* Modern Classroom Header */}
        {isClassroomMode && (
          <div
            className="
            relative z-10 border-b border-blue-500/20 bg-gradient-to-r from-blue-600 to-indigo-600
            p-4 text-white md:p-6
            lg:px-8 dark:from-blue-800
            dark:to-indigo-800
          "
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className="
                  rounded-full border 
                  border-white/20 bg-white/10
                  p-2 backdrop-blur-sm
                "
                >
                  {getSubjectIcon()}
                </div>
                <div>
                  <h2 className="text-lg font-bold md:text-xl">
                    {getSubjectName()} Classroom
                  </h2>
                  {topicSummary && (
                    <p className="mt-1 text-sm text-blue-100 opacity-90">
                      {topicSummary}
                    </p>
                  )}
                </div>
              </div>

              <div className="hidden items-center space-x-2 text-sm text-blue-100 md:flex">
                <span>Advanced Learning</span>
                <ChevronRight className="size-4" />
                <span
                  className="
                  rounded-full border border-white/20 
                  bg-white/10 px-2
                  py-1 backdrop-blur-sm
                "
                >
                  Interactive
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
              border-gray-200 bg-gradient-to-br from-gray-50
              to-gray-100 py-8
              text-center md:mx-4 md:py-12 dark:border-gray-700
              dark:from-gray-800 dark:to-gray-900
            "
            >
              <div
                className="
                mb-4 inline-flex rounded-full 
                bg-blue-100 p-3
                text-blue-600 dark:bg-blue-900/30
                dark:text-blue-400
              "
              >
                {getSubjectIcon()}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-200">
                Welcome to {getSubjectName()} Classroom
              </h3>
              <p className="mx-auto max-w-md text-sm text-gray-600 dark:text-gray-400">
                {`Ask me anything about ${getSubjectName().toLowerCase()} and I'll help you learn with detailed explanations and examples.`}
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
        </div>

        <div ref={scrollRef} />
      </div>

      {/* Floating Action Button for Mobile (Classroom Mode) */}
      {isClassroomMode && (
        <div
          className="
          fixed bottom-24 right-4 z-50
          md:hidden
        "
        >
          <button
            className="
            rounded-full bg-blue-600
            p-3 text-white
            shadow-lg transition-all
            duration-200 hover:scale-110
            hover:bg-blue-700 active:scale-95 dark:bg-blue-700
            dark:hover:bg-blue-600
          "
          >
            {getSubjectIcon()}
          </button>
        </div>
      )}
    </div>
  )
}
