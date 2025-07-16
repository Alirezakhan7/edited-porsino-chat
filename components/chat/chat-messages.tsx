import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { ChatbotUIContext } from "@/context/context"
import { Tables } from "@/supabase/types"
import { FC, useContext, useEffect, useRef, useState } from "react"
import { Message } from "../messages/message"

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

  const containerClasses = isClassroomMode
    ? "mx-auto max-w-4xl space-y-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 p-4 md:p-6 shadow-lg" // ✨ استایل مدرن
    : "mx-auto max-w-4xl space-y-6"

  return (
    <div className="flex-1 overflow-y-auto pb-36 pt-4 md:pt-6">
      <div className={containerClasses}>
        {/* 👇 عنوان کلاس به اینجا منتقل شده است */}
        {isClassroomMode && topicSummary && (
          <div className="border-b border-slate-700 p-2 text-center">
            <h2 className="text-lg font-semibold text-gray-200">
              کلاس یادگیری: {topicSummary}
            </h2>
          </div>
        )}

        {chatMessages
          .sort((a, b) => a.message.sequence_number - b.message.sequence_number)
          .map((chatMessage, index, array) => {
            const messageFileItems = chatFileItems.filter(
              (chatFileItem, _, self) =>
                chatMessage.fileItems.includes(chatFileItem.id) &&
                self.findIndex(item => item.id === chatFileItem.id) === _
            )

            return (
              <Message
                key={chatMessage.message.id}
                message={chatMessage.message}
                fileItems={messageFileItems}
                isEditing={editingMessage?.id === chatMessage.message.id}
                isLast={index === array.length - 1}
                onStartEdit={setEditingMessage}
                onCancelEdit={() => setEditingMessage(undefined)}
                onSubmitEdit={handleSendEdit}
              />
            )
          })}
        <div ref={scrollRef} />
      </div>
    </div>
  )
}
