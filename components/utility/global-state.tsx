"use client"

import { ChatbotUIContext } from "@/context/context"
import {
  MOCK_ASSISTANTS,
  MOCK_CHATS,
  MOCK_FOLDERS,
  MOCK_PROFILE,
  MOCK_WORKSPACE
} from "@/lib/mock/data"
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
import { FC, useEffect, useState } from "react"

interface GlobalStateProps {
  children: React.ReactNode
}

export const GlobalState: FC<GlobalStateProps> = ({ children }) => {
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(MOCK_PROFILE)
  const [assistants, setAssistants] =
    useState<Tables<"assistants">[]>(MOCK_ASSISTANTS)
  const [collections, setCollections] = useState<Tables<"collections">[]>([])
  const [chats, setChats] = useState<Tables<"chats">[]>(MOCK_CHATS)
  const [files, setFiles] = useState<Tables<"files">[]>([])
  const [folders, setFolders] = useState<Tables<"folders">[]>(MOCK_FOLDERS)
  const [models, setModels] = useState<Tables<"models">[]>([])
  const [presets, setPresets] = useState<Tables<"presets">[]>([])
  const [prompts, setPrompts] = useState<Tables<"prompts">[]>([])
  const [tools, setTools] = useState<Tables<"tools">[]>([])
  const [workspaces, setWorkspaces] = useState<Tables<"workspaces">[]>([
    MOCK_WORKSPACE
  ])

  const [envKeyMap, setEnvKeyMap] = useState<Record<string, VALID_ENV_KEYS>>({})
  const [availableHostedModels, setAvailableHostedModels] = useState<LLM[]>([])
  const [availableLocalModels, setAvailableLocalModels] = useState<LLM[]>([])
  const [availableOpenRouterModels, setAvailableOpenRouterModels] = useState<
    OpenRouterLLM[]
  >([])

  const [selectedWorkspace, setSelectedWorkspace] =
    useState<Tables<"workspaces"> | null>(MOCK_WORKSPACE)
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

  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [firstTokenReceived, setFirstTokenReceived] = useState<boolean>(false)
  const [abortController, setAbortController] =
    useState<AbortController | null>(null)
  const [networkPhase, setNetworkPhase] = useState<
    "idle" | "connecting" | "streaming" | "stalled" | "offline" | "done"
  >("idle")
  const [streamStartedAt, setStreamStartedAt] = useState<number | null>(null)
  const [lastByteAt, setLastByteAt] = useState<number | null>(null)

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

  const [chatFiles, setChatFiles] = useState<ChatFile[]>([])
  const [chatImages, setChatImages] = useState<MessageImage[]>([])
  const [newMessageFiles, setNewMessageFiles] = useState<ChatFile[]>([])
  const [newMessageImages, setNewMessageImages] = useState<MessageImage[]>([])
  const [showFilesDisplay, setShowFilesDisplay] = useState<boolean>(false)
  const [isUploadingFiles, setIsUploadingFiles] = useState<boolean>(false)

  const [useRetrieval, setUseRetrieval] = useState<boolean>(true)
  const [sourceCount, setSourceCount] = useState<number>(4)

  const [selectedTools, setSelectedTools] = useState<Tables<"tools">[]>([])
  const [toolInUse, setToolInUse] = useState<string>("none")

  const [topicSummary, setTopicSummary] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    setProfile(MOCK_PROFILE)
    setWorkspaces([MOCK_WORKSPACE])
    setSelectedWorkspace(MOCK_WORKSPACE)
  }, [])

  return (
    <ChatbotUIContext.Provider
      value={{
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
