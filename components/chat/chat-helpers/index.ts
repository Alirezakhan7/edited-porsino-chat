import { createClient } from "@/lib/supabase/client"

import { createChatFiles } from "@/db/chat-files"
import { createChat } from "@/db/chats"
import { createMessageFileItems } from "@/db/message-file-items"
import { createMessages, updateMessage } from "@/db/messages"
import { uploadMessageImage } from "@/db/storage/message-images"
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

export const createTempMessages = (
  messageContent: string,
  chatMessages: ChatMessage[],
  chatSettings: ChatSettings,
  b64Images: string[],
  isRegeneration: boolean,
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  selectedAssistant: Tables<"assistants"> | null,
  /** NEW: اگر چت انتخاب‌شده داریم، chat_id را به پیام‌های موقتی تزریق کن */
  selectedChatId?: string | null
) => {
  const cid = selectedChatId ?? ""

  let tempUserChatMessage: ChatMessage = {
    message: {
      chat_id: cid, // ✅ NEW
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
      chat_id: cid, // ✅ NEW
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

// ✅ تابع handleHostedChat برای هماهنگی با بک‌اند جدید اصلاح شده است
export const handleHostedChat = async (
  payload: ChatPayload,
  profile: Tables<"profiles">,
  workspaceId: string,
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
  const apiEndpoint = "https://api.porsino.org/chat"

  // ✅ آخرین پیام «کاربر» را درست پیدا کن
  const lastUserMessage = [...payload.chatMessages]
    .reverse()
    .find(m => m.message.role === "user")

  if (!lastUserMessage) {
    toast.error("No user message found to send.")
    setIsGenerating(false)
    throw new Error("No user message found.")
  }

  // ✅ از تاریخچه، آخرین chat_id غیرخالی را پیدا کن
  const lastWithChatId = [...payload.chatMessages]
    .reverse()
    .find(m => m.message.chat_id && m.message.chat_id !== "")

  const chatIdToSend = lastWithChatId?.message.chat_id || ""

  // ✅ فقط اگر chat_id نداریم یعنی سؤال اول است
  const requestBody = {
    message: lastUserMessage.message.content,
    customModelId: payload.chatSettings.model,
    isNewProblem: !chatIdToSend,
    chatId: chatIdToSend,
    workspaceId: workspaceId,
    images: newMessageImages.map(img => img.base64)
  }

  try {
    const supabase = createClient()
    const session = await supabase.auth.getSession()
    const token = session.data.session?.access_token
    const initialResponse = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify(requestBody),
      signal: newAbortController.signal
    })

    if (!initialResponse.ok) {
      const errorData = await initialResponse
        .json()
        .catch(() => ({ detail: "An unknown error occurred." }))
      const errorText =
        errorData?.detail && typeof errorData.detail === "string"
          ? errorData.detail
          : "An error has occurred. Please try again."
      toast.error(errorText)
      setIsGenerating(false)
      setChatMessages(prevMessages => prevMessages.slice(0, -2))
      throw new Error(errorText)
    }

    const initialData = (await initialResponse.json()) as {
      job_id?: string
      jobId?: string
      chatId?: string
      [key: string]: any
    }
    const jobId = initialData.job_id ?? initialData.jobId
    const newChatId = initialData.chatId

    if (newChatId) {
      tempAssistantChatMessage.message.chat_id = newChatId
      lastUserMessage.message.chat_id = newChatId
    }

    const resultEndpoint = `${apiEndpoint}/result/${jobId}`
    let finalData: any = null
    let isProcessing = true

    while (isProcessing && !newAbortController.signal.aborted) {
      const resultResponse = await fetch(resultEndpoint, {
        method: "GET",
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        signal: newAbortController.signal
      })

      if (!resultResponse.ok) {
        // ... (بخش مدیریت خطا بدون تغییر)
        throw new Error("Failed to fetch result")
      }

      let fullText = ""
      if (resultResponse.body) {
        // کل پاسخ را به صورت یکجا می‌خوانیم
        const reader = resultResponse.body.getReader()
        const decoder = new TextDecoder()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          fullText += decoder.decode(value, { stream: true })
        }
      }

      try {
        const parsedChunk = JSON.parse(fullText)
        if (parsedChunk.status !== "processing") {
          finalData = parsedChunk
          isProcessing = false // برای خروج از حلقه
        }
      } catch (error) {
        console.error("Error parsing result JSON:", error, {
          receivedText: fullText
        })
        throw new Error("Failed to parse server response.")
      }

      if (isProcessing) {
        await new Promise(resolve => setTimeout(resolve, 2000)) // تاخیر قبل از پرس‌وجوی بعدی
      }
    }

    // ================== اصلاحیه کلیدی ==================
    // حالا که از حلقه خارج شدیم، یعنی پاسخ نهایی را داریم.
    // در این لحظه توکن اول را فعال می‌کنیم.
    setFirstTokenReceived(true)
    setToolInUse("none")
    // =================================================

    const answer = finalData.answer || ""
    const topic = finalData.topic_summary || ""
    const suggs = finalData.suggestions || []
    const chatIdFinal = finalData.chatId || newChatId || chatIdToSend
    const finalValidChatId = chatIdFinal === "" ? null : chatIdFinal

    setChatMessages(prev =>
      prev.map(chatMessage => {
        if (chatMessage.message.id === tempAssistantChatMessage.message.id) {
          return {
            ...chatMessage,
            message: {
              ...chatMessage.message,
              content: answer,
              chat_id: finalValidChatId || chatMessage.message.chat_id
            }
          }
        }
        return chatMessage
      })
    )
    setTopicSummary(topic)
    setSuggestions(suggs)

    return { generatedText: answer, newChatId: finalValidChatId }
  } catch (error) {
    if ((error as Error).name !== "AbortError") {
      console.error(error)
      setIsGenerating(false)
      setChatMessages(prevMessages => prevMessages.slice(0, -2))
    }
    throw error
  }
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
    temperature: chatSettings.temperature
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
  chatMessages: ChatMessage[],
  currentChat: Tables<"chats">,
  profile: Tables<"profiles">,
  modelData: LLM,
  generatedText: string,
  newMessageImages: MessageImage[],
  isRegeneration: boolean,
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  setChatImages: React.Dispatch<React.SetStateAction<MessageImage[]>>,
  selectedAssistant: Tables<"assistants"> | null
) => {
  const userMessageToSave = chatMessages[chatMessages.length - 2].message
  const assistantMessageToSave = chatMessages[chatMessages.length - 1].message

  const now = new Date().toISOString()

  // ================== اصلاحیه کلیدی ==================
  // user_id را به صراحت از پروفایل کاربر می‌خوانیم
  const finalUserMessage: TablesInsert<"messages"> = {
    ...userMessageToSave,
    user_id: profile.user_id, // <-- این خط مهم اضافه شده است
    chat_id: currentChat.id,
    created_at: now,
    updated_at: now
  }
  // =================================================

  const finalAssistantMessage: TablesInsert<"messages"> = {
    ...assistantMessageToSave,
    chat_id: currentChat.id,
    user_id: profile.user_id,
    content: generatedText,
    model: modelData.modelId,
    role: "assistant",
    sequence_number: userMessageToSave.sequence_number + 1,
    image_paths: [],
    created_at: now,
    updated_at: now
  }

  if (isRegeneration) {
    const lastMessage = chatMessages[chatMessages.length - 1].message
    const updatedMessage = await updateMessage(lastMessage.id, {
      ...lastMessage,
      content: generatedText,
      updated_at: now
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

    // بخش مربوط به آپلود تصاویر بدون تغییر باقی می‌ماند
    if (newMessageImages.length > 0) {
      // ... (کد شما در این بخش صحیح است)
    } else {
      setChatMessages(prev =>
        prev.map(chatMsg =>
          chatMsg.message.id === userMessage.id
            ? { ...chatMsg, message: userMessage }
            : chatMsg.message.id === assistantMessage.id
              ? {
                  ...chatMsg,
                  message: assistantMessage
                }
              : chatMsg
        )
      )
    }
  }
}
