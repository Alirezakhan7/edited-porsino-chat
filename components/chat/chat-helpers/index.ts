// Only used in use-chat-handler.tsx to keep it clean
import { createClient } from "@/lib/supabase/client"

import { createChatFiles } from "@/db/chat-files"
import { createChat } from "@/db/chats"
import { createMessageFileItems } from "@/db/message-file-items"
import { createMessages, updateMessage } from "@/db/messages"
import { uploadMessageImage } from "@/db/storage/message-images"
import {
  buildFinalMessages,
  adaptMessagesForGoogleGemini
} from "@/lib/build-prompt"
import { consumeReadableStream } from "@/lib/consume-stream"
import { Tables, TablesInsert } from "@/supabase/types"
import {
  ChatFile,
  ChatMessage,
  ChatPayload,
  ChatSettings,
  LLM,
  MessageImage
} from "@/types"
import React from "react"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"

export const validateChatSettings = (
  chatSettings: ChatSettings | null,
  modelData: LLM | undefined,
  profile: Tables<"profiles"> | null,
  selectedWorkspace: Tables<"workspaces"> | null,
  messageContent: string
) => {
  if (!chatSettings) {
    throw new Error("Chat settings not found")
  }

  if (!modelData) {
    throw new Error("Model not found")
  }

  if (!profile) {
    throw new Error("Profile not found")
  }

  if (!selectedWorkspace) {
    throw new Error("Workspace not found")
  }

  if (!messageContent) {
    throw new Error("Message content not found")
  }
}

export const handleRetrieval = async (
  userInput: string,
  newMessageFiles: ChatFile[],
  chatFiles: ChatFile[],
  embeddingsProvider: "openai" | "local",
  sourceCount: number
) => {
  const response = await fetch("/api/retrieval/retrieve", {
    method: "POST",
    body: JSON.stringify({
      userInput,
      fileIds: [...newMessageFiles, ...chatFiles].map(file => file.id),
      embeddingsProvider,
      sourceCount
    })
  })

  if (!response.ok) {
    console.error("Error retrieving:", response)
  }

  const { results } = (await response.json()) as {
    results: Tables<"file_items">[]
  }

  return results
}

export const createTempMessages = (
  messageContent: string,
  chatMessages: ChatMessage[],
  chatSettings: ChatSettings,
  b64Images: string[],
  isRegeneration: boolean,
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  selectedAssistant: Tables<"assistants"> | null
) => {
  let tempUserChatMessage: ChatMessage = {
    message: {
      chat_id: "",
      assistant_id: null,
      content: messageContent,
      created_at: "",
      id: uuidv4(),
      image_paths: b64Images,
      model: chatSettings.model,
      role: "user",
      sequence_number: chatMessages.length,
      updated_at: "",
      user_id: ""
    },
    fileItems: []
  }

  let tempAssistantChatMessage: ChatMessage = {
    message: {
      chat_id: "",
      assistant_id: selectedAssistant?.id || null,
      content: "",
      created_at: "",
      id: uuidv4(),
      image_paths: [],
      model: chatSettings.model,
      role: "assistant",
      sequence_number: chatMessages.length + 1,
      updated_at: "",
      user_id: ""
    },
    fileItems: []
  }

  let newMessages = []

  if (isRegeneration) {
    const lastMessageIndex = chatMessages.length - 1
    chatMessages[lastMessageIndex].message.content = ""
    newMessages = [...chatMessages]
  } else {
    newMessages = [
      ...chatMessages,
      tempUserChatMessage,
      tempAssistantChatMessage
    ]
  }

  setChatMessages(newMessages)

  return {
    tempUserChatMessage,
    tempAssistantChatMessage
  }
}

export const handleLocalChat = async (
  payload: ChatPayload,
  profile: Tables<"profiles">,
  chatSettings: ChatSettings,
  tempAssistantMessage: ChatMessage,
  isRegeneration: boolean,
  newAbortController: AbortController,
  setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>,
  setFirstTokenReceived: React.Dispatch<React.SetStateAction<boolean>>,
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  setToolInUse: React.Dispatch<React.SetStateAction<string>>
) => {
  const formattedMessages = await buildFinalMessages(payload, profile, [])

  const response = await fetchChatResponse(
    process.env.NEXT_PUBLIC_OLLAMA_URL + "/api/chat",
    {
      model: chatSettings.model,
      messages: formattedMessages,
      options: {
        temperature: payload.chatSettings.temperature
      }
    },
    newAbortController,
    setIsGenerating,
    setChatMessages
  )

  // NOTE: Assuming local models don't have the special math logic for now
  return await processResponse(
    response,
    isRegeneration
      ? payload.chatMessages[payload.chatMessages.length - 1]
      : tempAssistantMessage,
    newAbortController,
    setFirstTokenReceived,
    setChatMessages,
    setToolInUse,
    () => {}, // setTopicSummary
    () => {} // setSuggestions
  )
}

// ✅ تابع handleHostedChat برای هماهنگی با بک‌اند جدید اصلاح شده است
export const handleHostedChat = async (
  payload: ChatPayload,
  profile: Tables<"profiles">,
  modelData: LLM,
  tempAssistantChatMessage: ChatMessage,
  isRegeneration: boolean,
  newAbortController: AbortController,
  newMessageImages: MessageImage[],
  chatImages: MessageImage[],
  setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>,
  setFirstTokenReceived: React.Dispatch<React.SetStateAction<boolean>>,
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  setToolInUse: React.Dispatch<React.SetStateAction<string>>,
  setTopicSummary: (summary: string) => void,
  setSuggestions: (suggestions: string[]) => void
) => {
  const provider = modelData.provider

  // ما فقط برای provider کاستوم خودمان منطق ویژه داریم
  if (provider !== "custom") {
    // در اینجا می‌توانید منطق سایر provider ها را در آینده قرار دهید
    throw new Error(`Provider "${provider}" is not supported for hosted chat.`)
  }

  const apiEndpoint = "https://api.porsino.org/chat"

  // بدنه درخواست همیشه شامل chatId خواهد بود (که در ابتدا می‌تواند خالی باشد)
  const lastUserMessage = payload.chatMessages[payload.chatMessages.length - 1]
  const chatIdToSend = lastUserMessage.message.chat_id

  const requestBody = {
    message: lastUserMessage.message.content,
    customModelId: payload.chatSettings.model,
    // ✅ منطق صحیح: اگر chatId وجود نداشت، یعنی مسئله جدید است
    isNewProblem: !chatIdToSend,
    chatId: chatIdToSend
  }

  const response = await fetchChatResponse(
    apiEndpoint,
    requestBody,
    newAbortController,
    setIsGenerating,
    setChatMessages
  )

  return await processResponse(
    response,
    isRegeneration
      ? payload.chatMessages[payload.chatMessages.length - 1]
      : tempAssistantChatMessage,
    newAbortController,
    setFirstTokenReceived,
    setChatMessages,
    setToolInUse,
    setTopicSummary,
    setSuggestions
  )
}

export const fetchChatResponse = async (
  url: string,
  body: object,
  controller: AbortController,
  setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>,
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
) => {
  const supabase = createClient()
  const session = await supabase.auth.getSession()
  const token = session.data.session?.access_token

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: JSON.stringify(body),
    signal: controller.signal
  })

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ detail: "An unknown error occurred." }))
    const errorText =
      errorData?.detail && typeof errorData.detail === "string"
        ? errorData.detail
        : "An error has occurred. Please try again."

    toast.error(errorText)
    setIsGenerating(false)
    setChatMessages(prevMessages => prevMessages.slice(0, -2))

    // ✅ مهم: بعد از مدیریت خطا، یک Exception ایجاد می‌کنیم تا ادامه عملیات متوقف شود
    throw new Error(errorText)
  }

  return response
}

// ✅ تابع processResponse برای پردازش پاسخ‌های JSON استاندارد شده بازنویسی شده است
export const processResponse = async (
  response: Response,
  lastChatMessage: ChatMessage,
  controller: AbortController,
  setFirstTokenReceived: React.Dispatch<React.SetStateAction<boolean>>,
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  setToolInUse: React.Dispatch<React.SetStateAction<string>>,
  setTopicSummary: (summary: string) => void,
  setSuggestions: (suggestions: string[]) => void
) => {
  let fullText = ""

  if (response.body) {
    // مرحله ۱: کل استریم را در متغیر fullText جمع‌آوری کن
    await consumeReadableStream(
      response.body,
      chunk => {
        setFirstTokenReceived(true)
        setToolInUse("none")
        fullText += chunk
      },
      controller.signal
    )

    // مرحله ۲: پس از اتمام استریم، رشته کامل JSON را تجزیه کن
    try {
      if (!fullText) {
        throw new Error("Received empty response from server.")
      }
      const parsedData = JSON.parse(fullText)

      const answer = parsedData.answer || ""
      const topic = parsedData.topic_summary || ""
      const suggs = parsedData.suggestions || []
      const newChatId = parsedData.chatId || null

      // مرحله ۳: UI را با داده‌های نهایی آپدیت کن
      setChatMessages(prev =>
        prev.map(chatMessage => {
          if (chatMessage.message.id === lastChatMessage.message.id) {
            return {
              ...chatMessage,
              message: {
                ...chatMessage.message,
                content: answer,
                chat_id: newChatId || lastChatMessage.message.chat_id
              }
            }
          }
          return chatMessage
        })
      )
      setTopicSummary(topic)
      setSuggestions(suggs)

      // مرحله ۴: آبجکتی شامل متن پاسخ و chatId جدید را برگردان
      return { generatedText: answer, newChatId: newChatId }
    } catch (error) {
      console.error("Error parsing JSON response:", error, {
        receivedText: fullText
      })

      const errorMessage = `Error processing response: ${fullText || (error as Error).message}`
      setChatMessages(prev =>
        prev.map(chatMessage => {
          if (chatMessage.message.id === lastChatMessage.message.id) {
            return {
              ...chatMessage,
              message: { ...chatMessage.message, content: errorMessage }
            }
          }
          return chatMessage
        })
      )
      setTopicSummary("Error Parsing Response")
      setSuggestions([])

      return { generatedText: errorMessage, newChatId: null }
    }
  } else {
    throw new Error("Response body is null")
  }
}

export const handleCreateChat = async (
  chatSettings: ChatSettings,
  profile: Tables<"profiles">,
  selectedWorkspace: Tables<"workspaces">,
  messageContent: string,
  selectedAssistant: Tables<"assistants">,
  newMessageFiles: ChatFile[],
  setSelectedChat: React.Dispatch<React.SetStateAction<Tables<"chats"> | null>>,
  setChats: React.Dispatch<React.SetStateAction<Tables<"chats">[]>>,
  setChatFiles: React.Dispatch<React.SetStateAction<ChatFile[]>>
) => {
  const createdChat = await createChat({
    user_id: profile.user_id,
    workspace_id: selectedWorkspace.id,
    assistant_id: selectedAssistant?.id || null,
    context_length: chatSettings.contextLength,
    include_profile_context: chatSettings.includeProfileContext,
    include_workspace_instructions: chatSettings.includeWorkspaceInstructions,
    model: chatSettings.model,
    name: messageContent.substring(0, 100),
    prompt: chatSettings.prompt,
    temperature: chatSettings.temperature,
    embeddings_provider: chatSettings.embeddingsProvider
  })

  setSelectedChat(createdChat)
  setChats(chats => [createdChat, ...chats])

  if (newMessageFiles.length > 0) {
    await createChatFiles(
      newMessageFiles.map(file => ({
        user_id: profile.user_id,
        chat_id: createdChat.id,
        file_id: file.id
      }))
    )
    setChatFiles(prev => [...prev, ...newMessageFiles])
  }

  return createdChat
}

export const handleCreateMessages = async (
  chatMessages: ChatMessage[], // ✅ ورودی اصلی ما این است
  currentChat: Tables<"chats">,
  profile: Tables<"profiles">,
  modelData: LLM,
  generatedText: string, // ✅ این را هنوز لازم داریم
  newMessageImages: MessageImage[],
  isRegeneration: boolean,
  retrievedFileItems: Tables<"file_items">[],
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  setChatFileItems: React.Dispatch<
    React.SetStateAction<Tables<"file_items">[]>
  >,
  setChatImages: React.Dispatch<React.SetStateAction<MessageImage[]>>,
  selectedAssistant: Tables<"assistants"> | null
) => {
  // ✅ به جای ساختن پیام از اول، پیام کاربر را از آرایه ورودی می‌خوانیم
  const userMessageToSave = chatMessages[chatMessages.length - 1].message

  const finalUserMessage: TablesInsert<"messages"> = {
    // ✅ تمام مقادیر را از آبجکت پیام می‌خوانیم و فقط chat_id را اصلاح می‌کنیم
    ...userMessageToSave,
    chat_id: currentChat.id
  }

  const finalAssistantMessage: TablesInsert<"messages"> = {
    chat_id: currentChat.id,
    assistant_id: selectedAssistant?.id || null,
    user_id: profile.user_id,
    content: generatedText, // پاسخ نهایی مدل
    model: modelData.modelId,
    role: "assistant",
    sequence_number: userMessageToSave.sequence_number + 1,
    image_paths: []
  }

  if (isRegeneration) {
    const lastMessage = chatMessages[chatMessages.length - 1].message
    const updatedMessage = await updateMessage(lastMessage.id, {
      ...lastMessage,
      content: generatedText
    })

    setChatMessages(prev =>
      prev.map(chatMessage =>
        chatMessage.message.id === updatedMessage.id
          ? { ...chatMessage, message: updatedMessage }
          : chatMessage
      )
    )
  } else {
    const [userMessage, assistantMessage] = await createMessages([
      finalUserMessage,
      finalAssistantMessage
    ])

    if (newMessageImages.length > 0) {
      const uploadPromises = newMessageImages.map(obj => {
        const filePath = `${profile.user_id}/${currentChat.id}/${userMessage.id}/${uuidv4()}`
        return uploadMessageImage(filePath, obj.file as File)
      })
      const paths = await Promise.all(uploadPromises)

      const updatedUserMessage = await updateMessage(userMessage.id, {
        image_paths: paths.filter(Boolean) as string[]
      })

      setChatImages(prev => [
        ...prev,
        ...newMessageImages.map((img, index) => ({
          ...img,
          messageId: userMessage.id,
          path: paths[index] || ""
        }))
      ])

      setChatMessages(prev =>
        prev.map(chatMsg =>
          chatMsg.message.id === userMessage.id
            ? { ...chatMsg, message: updatedUserMessage }
            : chatMsg.message.id === assistantMessage.id
              ? {
                  ...chatMsg,
                  message: assistantMessage,
                  fileItems: retrievedFileItems.map(item => item.id)
                }
              : chatMsg
        )
      )
    } else {
      setChatMessages(prev =>
        prev.map(chatMsg =>
          chatMsg.message.id === userMessage.id
            ? { ...chatMsg, message: userMessage }
            : chatMsg.message.id === assistantMessage.id
              ? {
                  ...chatMsg,
                  message: assistantMessage,
                  fileItems: retrievedFileItems.map(item => item.id)
                }
              : chatMsg
        )
      )
    }

    if (retrievedFileItems.length > 0) {
      await createMessageFileItems(
        retrievedFileItems.map(fileItem => ({
          user_id: profile.user_id,
          message_id: assistantMessage.id,
          file_item_id: fileItem.id
        }))
      )
      setChatFileItems(prev => [...prev, ...retrievedFileItems])
    }
  }
}
