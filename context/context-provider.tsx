// فایل: context/context-provider.tsx (نسخه نهایی با استفاده از enum شما)

"use client"

import { getChatsByUserId } from "@/db/chats"
import { getFoldersByUserId } from "@/db/folders"
import { Tables } from "@/supabase/types"
import { Dispatch, FC, SetStateAction, useEffect, useState } from "react"
import { ChatbotUIContext } from "./context"
import { createClient } from "@/lib/supabase/client"
import { Session, SupabaseClient } from "@supabase/supabase-js"
import {
  ChatFile,
  ChatMessage,
  ChatSettings,
  LLM,
  MessageImage,
  OpenRouterLLM,
  WorkspaceImage
} from "@/types"
import { AssistantImage } from "@/types/images/assistant-image"
import { VALID_ENV_KEYS } from "@/types/valid-keys" // <-- ایمپورت از فایل جدید

interface ChatbotUIProviderProps {
  children: React.ReactNode
}

export const ChatbotUIProvider: FC<ChatbotUIProviderProps> = ({ children }) => {
  // تمام state ها مطابق با context.tsx ساخته می‌شوند
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null)
  const [assistants, setAssistants] = useState<Tables<"assistants">[]>([])
  const [collections, setCollections] = useState<Tables<"collections">[]>([])
  const [chats, setChats] = useState<Tables<"chats">[]>([])
  const [files, setFiles] = useState<Tables<"files">[]>([])
  const [folders, setFolders] = useState<Tables<"folders">[]>([])
  const [models, setModels] = useState<Tables<"models">[]>([])
  const [presets, setPresets] = useState<Tables<"presets">[]>([])
  const [prompts, setPrompts] = useState<Tables<"prompts">[]>([])
  const [tools, setTools] = useState<Tables<"tools">[]>([])
  const [workspaces, setWorkspaces] = useState<Tables<"workspaces">[]>([])
  const [envKeyMap, setEnvKeyMap] = useState<Record<string, VALID_ENV_KEYS>>({}) // <-- این state حالا وجود دارد
  const [availableHostedModels, setAvailableHostedModels] = useState<LLM[]>([])
  const [availableLocalModels, setAvailableLocalModels] = useState<LLM[]>([])
  const [availableOpenRouterModels, setAvailableOpenRouterModels] = useState<
    OpenRouterLLM[]
  >([])
  const [selectedWorkspace, setSelectedWorkspace] =
    useState<Tables<"workspaces"> | null>(null)
  const [workspaceImages, setWorkspaceImages] = useState<WorkspaceImage[]>([])
  const [selectedPreset, setSelectedPreset] =
    useState<Tables<"presets"> | null>(null)
  const [selectedAssistant, setSelectedAssistant] =
    useState<Tables<"assistants"> | null>(null)
  const [assistantImages, setAssistantImages] = useState<AssistantImage[]>([])
  const [openaiAssistants, setOpenaiAssistants] = useState<any[]>([])
  const [userInput, setUserInput] = useState<string>("")
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatSettings, setChatSettings] = useState<ChatSettings | null>(null)
  const [selectedChat, setSelectedChat] = useState<Tables<"chats"> | null>(null)
  const [chatFileItems, setChatFileItems] = useState<Tables<"file_items">[]>([])
  const [abortController, setAbortController] =
    useState<AbortController | null>(null)
  const [firstTokenReceived, setFirstTokenReceived] = useState<boolean>(false)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [isPromptPickerOpen, setIsPromptPickerOpen] = useState<boolean>(false)
  const [slashCommand, setSlashCommand] = useState<string>("")
  const [isFilePickerOpen, setIsFilePickerOpen] = useState<boolean>(false)
  const [hashtagCommand, setHashtagCommand] = useState<string>("")
  const [isToolPickerOpen, setIsToolPickerOpen] = useState<boolean>(false)
  const [toolCommand, setToolCommand] = useState<string>("")
  const [focusPrompt, setFocusPrompt] = useState<boolean>(false)
  const [focusFile, setFocusFile] = useState<boolean>(false)
  const [focusTool, setFocusTool] = useState<boolean>(false)
  const [focusAssistant, setFocusAssistant] = useState<boolean>(false)
  const [atCommand, setAtCommand] = useState<string>("")
  const [isAssistantPickerOpen, setIsAssistantPickerOpen] =
    useState<boolean>(false)
  const [chatFiles, setChatFiles] = useState<ChatFile[]>([])
  const [chatImages, setChatImages] = useState<MessageImage[]>([])
  const [newMessageFiles, setNewMessageFiles] = useState<ChatFile[]>([])
  const [newMessageImages, setNewMessageImages] = useState<MessageImage[]>([])
  const [showFilesDisplay, setShowFilesDisplay] = useState<boolean>(false)
  const [useRetrieval, setUseRetrieval] = useState<boolean>(false)
  const [sourceCount, setSourceCount] = useState<number>(4)
  const [selectedTools, setSelectedTools] = useState<Tables<"tools">[]>([])
  const [toolInUse, setToolInUse] = useState<string>("none")
  const [topicSummary, setTopicSummary] = useState<string>("")
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    const supabase = createClient()
    setSupabase(supabase)

    const fetchInitialData = async (userId: string) => {
      const userChats = await getChatsByUserId(userId)
      setChats(userChats)

      const userFolders = await getFoldersByUserId(userId)
      setFolders(userFolders)
    }

    const handleAuthChange = async (event: string, session: Session | null) => {
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .single()
        setProfile(profile)
        if (profile) {
          fetchInitialData(profile.user_id)
        }
      } else {
        setProfile(null)
        setChats([])
        setFolders([])
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange("INITIAL_SESSION", session)
    })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(handleAuthChange)

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <ChatbotUIContext.Provider
      value={{
        profile,
        setProfile,
        supabase,
        assistants,
        setAssistants,
        collections,
        setCollections,
        chats,
        setChats,
        files,
        setFiles,
        folders,
        setFolders,
        models,
        setModels,
        presets,
        setPresets,
        prompts,
        setPrompts,
        tools,
        setTools,
        workspaces,
        setWorkspaces,
        envKeyMap,
        setEnvKeyMap,
        availableHostedModels,
        setAvailableHostedModels,
        availableLocalModels,
        setAvailableLocalModels,
        availableOpenRouterModels,
        setAvailableOpenRouterModels,
        selectedWorkspace,
        setSelectedWorkspace,
        workspaceImages,
        setWorkspaceImages,
        selectedPreset,
        setSelectedPreset,
        selectedAssistant,
        setSelectedAssistant,
        assistantImages,
        setAssistantImages,
        openaiAssistants,
        setOpenaiAssistants,
        userInput,
        setUserInput,
        chatMessages,
        setChatMessages,
        chatSettings,
        setChatSettings,
        selectedChat,
        setSelectedChat,
        chatFileItems,
        setChatFileItems,
        abortController,
        setAbortController,
        firstTokenReceived,
        setFirstTokenReceived,
        isGenerating,
        setIsGenerating,
        isPromptPickerOpen,
        setIsPromptPickerOpen,
        slashCommand,
        setSlashCommand,
        isFilePickerOpen,
        setIsFilePickerOpen,
        hashtagCommand,
        setHashtagCommand,
        isToolPickerOpen,
        setIsToolPickerOpen,
        toolCommand,
        setToolCommand,
        focusPrompt,
        setFocusPrompt,
        focusFile,
        setFocusFile,
        focusTool,
        setFocusTool,
        focusAssistant,
        setFocusAssistant,
        atCommand,
        setAtCommand,
        isAssistantPickerOpen,
        setIsAssistantPickerOpen,
        chatFiles,
        setChatFiles,
        chatImages,
        setChatImages,
        newMessageFiles,
        setNewMessageFiles,
        newMessageImages,
        setNewMessageImages,
        showFilesDisplay,
        setShowFilesDisplay,
        useRetrieval,
        setUseRetrieval,
        sourceCount,
        setSourceCount,
        selectedTools,
        setSelectedTools,
        toolInUse,
        setToolInUse,
        topicSummary,
        setTopicSummary,
        suggestions,
        setSuggestions
      }}
    >
      {children}
    </ChatbotUIContext.Provider>
  )
}
