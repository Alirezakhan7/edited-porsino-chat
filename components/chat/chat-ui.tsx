import Loading from "@/app/[locale]/loading"
import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { ChatbotUIContext } from "@/context/context"
import { getAssistantToolsByAssistantId } from "@/db/assistant-tools"
import { getChatFilesByChatId } from "@/db/chat-files"
import { getChatById } from "@/db/chats"
import { getMessageFileItemsByMessageId } from "@/db/message-file-items"
import { getMessagesByChatId } from "@/db/messages"
import { getMessageImageFromStorage } from "@/db/storage/message-images"
import { convertBlobToBase64 } from "@/lib/blob-to-b64"
import useHotkey from "@/lib/hooks/use-hotkey"
import { LLMID, MessageImage } from "@/types"
import { useParams } from "next/navigation"
import { FC, useContext, useEffect, useState } from "react"
import { useScroll } from "./chat-hooks/use-scroll"
import { ChatInput } from "./chat-input"
import { ChatMessages } from "./chat-messages"
import { ChatScrollButtons } from "./chat-scroll-buttons"
import { ChatSecondaryButtons } from "./chat-secondary-buttons"

// =================================================================
// 👇 کامپوننت جدید برای دکمه‌های پیشنهادی
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

interface ChatUIProps {}

export const ChatUI: FC<ChatUIProps> = ({}) => {
  useHotkey("o", () => handleNewChat())

  const params = useParams()

  const {
    setChatMessages,
    selectedChat,
    setSelectedChat,
    setChatSettings,
    setChatImages,
    assistants,
    setSelectedAssistant,
    setChatFileItems,
    setChatFiles,
    setShowFilesDisplay,
    setUseRetrieval,
    setSelectedTools,
    // 👇 state های جدید را از کانتکست می‌گیریم
    topicSummary,
    chatSettings,
    setUserInput
  } = useContext(ChatbotUIContext)

  const { handleNewChat, handleFocusChatInput } = useChatHandler()

  const {
    messagesStartRef,
    messagesEndRef,
    handleScroll,
    scrollToBottom,
    setIsAtBottom,
    isAtTop,
    isAtBottom,
    isOverflowing,
    scrollToTop
  } = useScroll()

  const [loading, setLoading] = useState(true)

  // 👇 تابع جدید برای مدیریت کلیک روی دکمه‌های پیشنهادی
  const handleSuggestionClick = (suggestionText: string) => {
    setUserInput(suggestionText)
    // با فوکوس کردن روی اینپوت، کاربر می‌تواند بلافاصله اینتر بزند
    handleFocusChatInput()
  }

  useEffect(() => {
    const fetchData = async () => {
      await fetchMessages()
      await fetchChat()

      scrollToBottom()
      setIsAtBottom(true)
    }

    if (params.chatid) {
      fetchData().then(() => {
        handleFocusChatInput()
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [params.chatid]) // وابستگی params.chatid اضافه شد

  const fetchMessages = async () => {
    if (!params.chatid) return // اضافه کردن گارد برای جلوگیری از خطا
    const fetchedMessages = await getMessagesByChatId(params.chatid as string)

    const imagePromises: Promise<MessageImage>[] = fetchedMessages.flatMap(
      message =>
        message.image_paths
          ? message.image_paths.map(async imagePath => {
              const url = await getMessageImageFromStorage(imagePath)

              if (url) {
                const response = await fetch(url)
                const blob = await response.blob()
                const base64 = await convertBlobToBase64(blob)

                return {
                  messageId: message.id,
                  path: imagePath,
                  base64,
                  url,
                  file: null
                }
              }

              return {
                messageId: message.id,
                path: imagePath,
                base64: "",
                url,
                file: null
              }
            })
          : []
    )

    const images: MessageImage[] = await Promise.all(imagePromises.flat())
    setChatImages(images)

    const messageFileItemPromises = fetchedMessages.map(
      async message => await getMessageFileItemsByMessageId(message.id)
    )

    const messageFileItems = await Promise.all(messageFileItemPromises)

    const uniqueFileItems = messageFileItems.flatMap(item => item.file_items)
    setChatFileItems(uniqueFileItems)

    const chatFiles = await getChatFilesByChatId(params.chatid as string)

    setChatFiles(
      chatFiles.files.map(file => ({
        id: file.id,
        name: file.name,
        type: file.type,
        file: null
      }))
    )

    setUseRetrieval(true)
    setShowFilesDisplay(true)

    const fetchedChatMessages = fetchedMessages.map(message => {
      return {
        message,
        fileItems: messageFileItems
          .filter(messageFileItem => messageFileItem.id === message.id)
          .flatMap(messageFileItem =>
            messageFileItem.file_items.map(fileItem => fileItem.id)
          )
      }
    })

    setChatMessages(fetchedChatMessages)
  }

  const fetchChat = async () => {
    if (!params.chatid) return // اضافه کردن گارد برای جلوگیری از خطا
    const chat = await getChatById(params.chatid as string)
    if (!chat) return

    if (chat.assistant_id) {
      const assistant = assistants.find(
        assistant => assistant.id === chat.assistant_id
      )

      if (assistant) {
        setSelectedAssistant(assistant)

        const assistantTools = (
          await getAssistantToolsByAssistantId(assistant.id)
        ).tools
        setSelectedTools(assistantTools)
      }
    }

    setSelectedChat(chat)
    setChatSettings({
      model: chat.model as LLMID,
      prompt: chat.prompt,
      temperature: chat.temperature,
      contextLength: chat.context_length,
      includeProfileContext: chat.include_profile_context,
      includeWorkspaceInstructions: chat.include_workspace_instructions,
      embeddingsProvider: chat.embeddings_provider as "openai" | "local"
    })
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="relative flex h-screen flex-col items-center overflow-hidden">
      {/* 👇 بخش جدید: نمایش عنوان کلاس درس */}
      {chatSettings?.model === "math-advanced" && topicSummary && (
        <div className="sticky top-0 z-10 w-full bg-blue-600 p-2 text-center text-white shadow-md">
          <h2 className="text-lg font-semibold">
            کلاس یادگیری: {topicSummary}
          </h2>
        </div>
      )}

      <div
        className="fade-mask flex size-full flex-col overflow-auto"
        onScroll={handleScroll}
      >
        <div ref={messagesStartRef} />
        <ChatMessages />
        <div ref={messagesEndRef} />
      </div>

      <div
        className="
        absolute right-4 top-2 z-30 flex items-center space-x-2
        rounded-xl bg-white/30 px-2 py-1
        shadow-md backdrop-blur-md dark:bg-[#222]/30
      "
      >
        <ChatSecondaryButtons />
      </div>

      <div className="absolute inset-x-0 bottom-0 w-full bg-transparent">
        <div
          className="
          mx-auto min-w-[300px] 
          px-2 pt-0 sm:w-[90%] md:w-[80%] 
          lg:w-[70%] xl:w-[65%]
        "
        >
          {/* 👇 کامپوننت دکمه‌های پیشنهادی اینجا قرار می‌گیرد */}
          <ChatSuggestions onSuggestionClick={handleSuggestionClick} />
          <ChatInput />
        </div>

        <p className="mt-1 pb-1 text-center text-xs text-gray-500 dark:text-gray-400">
          امکان وجود خطا در پاسخ‌ها وجود دارد. لطفاً با دقت بررسی نمایید
        </p>
      </div>
    </div>
  )
}
