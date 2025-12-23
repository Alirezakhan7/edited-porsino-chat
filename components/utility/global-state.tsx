"use client"

import { ChatbotUIContext } from "@/context/context"
import { getAssistantWorkspacesByWorkspaceId } from "@/db/assistants"
import { getChatsByWorkspaceId } from "@/db/chats"
import { getCollectionWorkspacesByWorkspaceId } from "@/db/collections"
import { getFileWorkspacesByWorkspaceId } from "@/db/files"
import { getFoldersByWorkspaceId } from "@/db/folders"
import { getModelWorkspacesByWorkspaceId } from "@/db/models"
import { getPresetWorkspacesByWorkspaceId } from "@/db/presets"
import { getProfileByUserId } from "@/db/profile"
import { getPromptWorkspacesByWorkspaceId } from "@/db/prompts"
import { getWorkspaceImageFromStorage } from "@/db/storage/workspace-images"
import { getToolWorkspacesByWorkspaceId } from "@/db/tools"
import { getWorkspacesByUserId } from "@/db/workspaces"
// import { convertBlobToBase64 } from "@/lib/blob-to-b64" // فعلا غیرفعال (شاید سنگین باشد)
import { supabase } from "@/lib/supabase/browser-client"
import { Tables } from "@/supabase/types"
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
import { VALID_ENV_KEYS } from "@/types/valid-keys"
import { useRouter } from "next/navigation"
import { FC, useEffect, useState } from "react"
import { usePathname } from "next/navigation"

// ایمپورت‌های مدل‌ها را فعلاً حذف می‌کنیم تا زنجیره وابستگی قطع شود
// import { fetchHostedModels, ... } from "@/lib/models/fetch-models"

interface GlobalStateProps {
  children: React.ReactNode
}

export const GlobalState: FC<GlobalStateProps> = ({ children }) => {
  const router = useRouter()
  const pathname = usePathname()

  // PROFILE STORE
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null)

  // ITEMS STORE
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

  // MODELS STORE
  const [envKeyMap, setEnvKeyMap] = useState<Record<string, VALID_ENV_KEYS>>({})
  const [availableHostedModels, setAvailableHostedModels] = useState<LLM[]>([])
  const [availableLocalModels, setAvailableLocalModels] = useState<LLM[]>([])
  const [availableOpenRouterModels, setAvailableOpenRouterModels] = useState<
    OpenRouterLLM[]
  >([])

  // WORKSPACE STORE
  const [selectedWorkspace, setSelectedWorkspace] =
    useState<Tables<"workspaces"> | null>(null)
  const [workspaceImages, setWorkspaceImages] = useState<WorkspaceImage[]>([])

  // PRESET STORE
  const [selectedPreset, setSelectedPreset] =
    useState<Tables<"presets"> | null>(null)

  // ASSISTANT STORE
  const [selectedAssistant, setSelectedAssistant] =
    useState<Tables<"assistants"> | null>(null)
  const [assistantImages, setAssistantImages] = useState<AssistantImage[]>([])
  const [openaiAssistants, setOpenaiAssistants] = useState<any[]>([])

  // PASSIVE CHAT STORE
  const [userInput, setUserInput] = useState<string>("")
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatSettings, setChatSettings] = useState<ChatSettings | null>(null)
  const [selectedChat, setSelectedChat] = useState<Tables<"chats"> | null>(null)
  const [chatFileItems, setChatFileItems] = useState<Tables<"file_items">[]>([])

  // ACTIVE CHAT STORE
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [firstTokenReceived, setFirstTokenReceived] = useState<boolean>(false)
  const [abortController, setAbortController] =
    useState<AbortController | null>(null)
  const [networkPhase, setNetworkPhase] = useState<
    "idle" | "connecting" | "streaming" | "stalled" | "offline" | "done"
  >("idle")
  const [streamStartedAt, setStreamStartedAt] = useState<number | null>(null)
  const [lastByteAt, setLastByteAt] = useState<number | null>(null)

  // CHAT INPUT COMMAND STORE
  const [isPromptPickerOpen, setIsPromptPickerOpen] = useState(false)
  const [slashCommand, setSlashCommand] = useState("")
  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false)
  const [hashtagCommand, setHashtagCommand] = useState("")
  const [isToolPickerOpen, setIsToolPickerOpen] = useState(false)
  const [toolCommand, setToolCommand] = useState("")
  const [focusPrompt, setFocusPrompt] = useState(false)
  const [focusFile, setFocusFile] = useState(false)
  const [focusTool, setFocusTool] = useState(false)
  const [focusAssistant, setFocusAssistant] = useState(false)
  const [atCommand, setAtCommand] = useState("")
  const [isAssistantPickerOpen, setIsAssistantPickerOpen] = useState(false)

  // ATTACHMENTS STORE
  const [chatFiles, setChatFiles] = useState<ChatFile[]>([])
  const [chatImages, setChatImages] = useState<MessageImage[]>([])
  const [newMessageFiles, setNewMessageFiles] = useState<ChatFile[]>([])
  const [newMessageImages, setNewMessageImages] = useState<MessageImage[]>([])
  const [showFilesDisplay, setShowFilesDisplay] = useState<boolean>(false)
  const [isUploadingFiles, setIsUploadingFiles] = useState<boolean>(false)

  // RETRIEVAL STORE
  const [useRetrieval, setUseRetrieval] = useState<boolean>(true)
  const [sourceCount, setSourceCount] = useState<number>(4)

  // TOOL STORE
  const [selectedTools, setSelectedTools] = useState<Tables<"tools">[]>([])
  const [toolInUse, setToolInUse] = useState<string>("none")

  // NEW STATES
  const [topicSummary, setTopicSummary] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])

  // بارگذاری اولیه پروفایل و ورک‌اسپیس (فقط دیتای ضروری)
  useEffect(() => {
    ;(async () => {
      const session = (await supabase.auth.getSession()).data.session

      if (session) {
        const user = session.user
        const profile = await getProfileByUserId(user.id)
        setProfile(profile)

        if (!profile.has_onboarded) {
          return router.push("/setup")
        }

        const workspaces = await getWorkspacesByUserId(user.id)
        setWorkspaces(workspaces)

        if (workspaces.length > 0) {
          setSelectedWorkspace(workspaces[0])
        }

        // بخش Fetch Models را فعلاً غیرفعال کردیم تا از ایمپورت langchain جلوگیری شود
        // اگر برای مدل VPS خودت نیاز داری، باید دستی ست کنی نه با fetchHostedModels
      }
    })()
  }, [])

  // مدیریت لودینگ دیتا در تغییر ورک‌اسپیس (بهینه‌سازی شده)
  useEffect(() => {
    const fetchWorkspaceData = async () => {
      if (selectedWorkspace) {
        const workspaceId = selectedWorkspace.id
        const isChatSection = pathname?.includes("/chat")

        const [folders, assistantsData] = await Promise.all([
          getFoldersByWorkspaceId(workspaceId),
          getAssistantWorkspacesByWorkspaceId(workspaceId)
        ])

        setFolders(folders)
        setAssistants(assistantsData.assistants || [])

        if (!isChatSection) {
          setChats([])
          setFiles([])
          return
        }

        const [
          chats,
          filesData,
          presetsData,
          promptsData,
          collectionsData,
          toolsData,
          modelsData
        ] = await Promise.all([
          getChatsByWorkspaceId(workspaceId),
          getFileWorkspacesByWorkspaceId(workspaceId),
          getPresetWorkspacesByWorkspaceId(workspaceId),
          getPromptWorkspacesByWorkspaceId(workspaceId),
          getCollectionWorkspacesByWorkspaceId(workspaceId),
          getToolWorkspacesByWorkspaceId(workspaceId),
          getModelWorkspacesByWorkspaceId(workspaceId)
        ])

        setChats(chats)
        setFiles(filesData.files || [])
        setPresets(presetsData.presets || [])
        setPrompts(promptsData.prompts || [])
        setCollections(collectionsData.collections || [])
        setTools(toolsData.tools || [])
        setModels(modelsData.models || [])
      }
    }

    fetchWorkspaceData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkspace, pathname])

  return (
    <ChatbotUIContext.Provider
      value={{
        // پاس دادن تمام استیت‌ها به کانتکست
        supabase,
        profile,
        setProfile,
        networkPhase,
        setNetworkPhase,
        streamStartedAt,
        setStreamStartedAt,
        lastByteAt,
        setLastByteAt,
        firstTokenReceived,
        setFirstTokenReceived,
        topicSummary,
        setTopicSummary,
        suggestions,
        setSuggestions,
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
        isGenerating,
        setIsGenerating,
        abortController,
        setAbortController,
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
        isUploadingFiles,
        setIsUploadingFiles,
        useRetrieval,
        setUseRetrieval,
        sourceCount,
        setSourceCount,
        selectedTools,
        setSelectedTools,
        toolInUse,
        setToolInUse
      }}
    >
      {children}
    </ChatbotUIContext.Provider>
  )
}
