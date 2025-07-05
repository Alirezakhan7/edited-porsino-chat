import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { ChatbotUIContext } from "@/context/context"
import { Tables } from "@/supabase/types"
import { FC, useContext, useEffect, useRef, useState } from "react"
import { Message } from "../messages/message"
import { motion, AnimatePresence } from "framer-motion"

interface ChatMessagesProps {}

export const ChatMessages: FC<ChatMessagesProps> = ({}) => {
  const { chatMessages, chatFileItems } = useContext(ChatbotUIContext)
  const { handleSendEdit } = useChatHandler()
  const [editingMessage, setEditingMessage] = useState<Tables<"messages">>()

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to the bottom when new messages are added
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [chatMessages])

  return (
    <div className="flex-1 overflow-y-auto pb-36 pt-4 md:pt-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <AnimatePresence initial={false}>
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
                <motion.div
                  key={chatMessage.message.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
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
                </motion.div>
              )
            })}
        </AnimatePresence>
        {/* Empty div to scroll to */}
        <div ref={scrollRef} />
      </div>
    </div>
  )
}
