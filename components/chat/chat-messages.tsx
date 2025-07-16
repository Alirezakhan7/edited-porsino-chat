import { ChatbotUIContext } from "@/context/context"
import { Tables } from "@/supabase/types"
import { FC, useContext, useEffect, useRef, useState } from "react"
import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { Message } from "../messages/message"

interface ChatMessagesProps {}

export const ChatMessages: FC<ChatMessagesProps> = ({}) => {
  // 👇 مرحله ۱: chatSettings را از کانتکست دریافت می‌کنیم
  const { chatMessages, chatFileItems, chatSettings } =
    useContext(ChatbotUIContext)
  const { handleSendEdit } = useChatHandler()

  const [editingMessage, setEditingMessage] = useState<Tables<"messages">>()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [chatMessages])

  // 👇 مرحله ۲: منطق شرطی را بر اساس مدل انتخاب‌شده ایجاد می‌کنیم
  const isClassroomMode = ["math-advanced", "physics-advanced"].includes(
    chatSettings?.model || ""
  )

  // کلاس‌های CSS بر اساس حالت کلاس درس یا حالت عادی
  const containerClasses = isClassroomMode
    ? "mx-auto max-w-4xl space-y-6 bg-black bg-opacity-20 rounded-xl border border-gray-600 p-4 md:p-6" // استایل تخته سیاه
    : "mx-auto max-w-4xl space-y-6" // استایل عادی

  return (
    <div className="flex-1 overflow-y-auto pb-36 pt-4 md:pt-6">
      {/* 👇 مرحله ۳: کلاس‌های شرطی را اینجا اعمال می‌کنیم */}
      <div className={containerClasses}>
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
        {/* نقطهٔ اسکرول خودکار */}
        <div ref={scrollRef} />
      </div>
    </div>
  )
}
