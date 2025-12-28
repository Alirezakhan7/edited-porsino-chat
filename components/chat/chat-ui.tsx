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
import { ChatMessages } from "./chat-messages" // Keep this import
import { ChatScrollButtons } from "./chat-scroll-buttons"
import { ChatSecondaryButtons } from "./chat-secondary-buttons"

// =================================================================
// 👇 ChatSuggestions component will be moved, so it's removed from here
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
    setUserInput // Keep setUserInput from context
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

  // 👇 handleSuggestionClick will be moved to ChatMessages
  // const handleSuggestionClick = (suggestionText: string) => {
  //   setUserInput(suggestionText)
  //   handleFocusChatInput()
  // }

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

              // مستقیماً آبجکت را با URL دریافتی برمی‌گردانیم
              return {
                messageId: message.id,
                path: imagePath,
                base64: null, // دیگر به base64 نیازی نداریم
                url: url || "", // از url مستقیم استفاده می‌کنیم. اگر url null بود، یک رشته خالی برمی‌گردانیم تا خطا ندهد
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
      includeWorkspaceInstructions: chat.include_workspace_instructions
    })
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="relative flex h-screen flex-col items-center overflow-hidden">
      {/* هدر موبایل (بدون تغییر) */}
      <div className="absolute inset-x-0 top-0 z-10 h-16 bg-white/30 backdrop-blur-xl md:hidden dark:bg-black/20"></div>
      <div className="absolute right-4 top-4 z-30 flex items-center space-x-2 rounded-xl bg-white/30 px-2 py-1 shadow-md backdrop-blur-md dark:bg-[#222]/30">
        <ChatSecondaryButtons />
      </div>

      {/* 👇 تغییر ۱: افزایش فضای خالی پایین (padding-bottom) برای موبایل */}
      {/* قبلاً pb-24 بود، الان pb-44 کردیم تا وقتی اینپوت بالا می‌آید، پیام‌ها دیده شوند */}
      <div
        className="fade-mask flex size-full flex-col overflow-auto pb-44 pt-16 md:pb-24 md:pt-0"
        onScroll={handleScroll}
      >
        <div ref={messagesStartRef} />
        <ChatMessages
          setUserInput={setUserInput}
          handleFocusChatInput={handleFocusChatInput}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* 👇 تغییر ۲: بالا آوردن کادر ورودی در موبایل */}
      {/* کلاس bottom-20 را اضافه کردیم تا ۸۰ پیکسل بالاتر بیاید (فقط در موبایل) */}
      {/* در دسکتاپ (md:bottom-0) سر جای خودش برمی‌گردد */}
      <div className="absolute inset-x-0 bottom-20 w-full md:bottom-0">
        {/* این div برای افکت بلر پشت اینپوت است */}
        <div
          className="
            absolute inset-x-0 bottom-0 mx-auto h-28
            min-w-[300px] 
            rounded-t-2xl bg-white/10 backdrop-blur-xl sm:w-[90%] md:w-4/5
            lg:w-[70%] xl:w-[65%]
            dark:bg-[hsla(210_3%_13%_/_0.3)] 
          "
        ></div>

        {/* محتوای اصلی (ورودی متن) */}
        <div className="relative z-10">
          <div
            className="
            mx-auto min-w-[300px]
            sm:w-[90%] md:w-4/5 lg:w-[70%] xl:w-[65%]
          "
          >
            <ChatInput />
          </div>

          <p className="mt-2 pb-2 text-center text-xs text-gray-500 dark:text-gray-400">
            امکان وجود خطا در پاسخ‌ها وجود دارد. لطفاً با دقت بررسی نمایید
          </p>
        </div>
      </div>
    </div>
  )
}
