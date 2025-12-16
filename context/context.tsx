import type { Database, Tables } from "@/supabase/types"
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
import { Dispatch, SetStateAction, createContext } from "react"

import { supabase as browserSupabase } from "@/lib/supabase/browser-client"
type BrowserSupabaseClient = typeof browserSupabase
interface ChatbotUIContext {
  // PROFILE STORE
  profile: Tables<"profiles"> | null
  supabase: BrowserSupabaseClient | null
  setProfile: Dispatch<SetStateAction<Tables<"profiles"> | null>>

  // ITEMS STORE
  assistants: Tables<"assistants">[]
  setAssistants: Dispatch<SetStateAction<Tables<"assistants">[]>>
  collections: Tables<"collections">[]
  setCollections: Dispatch<SetStateAction<Tables<"collections">[]>>
  chats: Tables<"chats">[]
  setChats: Dispatch<SetStateAction<Tables<"chats">[]>>
  files: Tables<"files">[]
  setFiles: Dispatch<SetStateAction<Tables<"files">[]>>
  folders: Tables<"folders">[]
  setFolders: Dispatch<SetStateAction<Tables<"folders">[]>>
  models: Tables<"models">[]
  setModels: Dispatch<SetStateAction<Tables<"models">[]>>
  presets: Tables<"presets">[]
  setPresets: Dispatch<SetStateAction<Tables<"presets">[]>>
  prompts: Tables<"prompts">[]
  setPrompts: Dispatch<SetStateAction<Tables<"prompts">[]>>
  tools: Tables<"tools">[]
  setTools: Dispatch<SetStateAction<Tables<"tools">[]>>
  workspaces: Tables<"workspaces">[]
  setWorkspaces: Dispatch<SetStateAction<Tables<"workspaces">[]>>

  // MODELS STORE
  envKeyMap: Record<string, VALID_ENV_KEYS>
  setEnvKeyMap: Dispatch<SetStateAction<Record<string, VALID_ENV_KEYS>>>
  availableHostedModels: LLM[]
  setAvailableHostedModels: Dispatch<SetStateAction<LLM[]>>
  availableLocalModels: LLM[]
  setAvailableLocalModels: Dispatch<SetStateAction<LLM[]>>
  availableOpenRouterModels: OpenRouterLLM[]
  setAvailableOpenRouterModels: Dispatch<SetStateAction<OpenRouterLLM[]>>

  // WORKSPACE STORE
  selectedWorkspace: Tables<"workspaces"> | null
  setSelectedWorkspace: Dispatch<SetStateAction<Tables<"workspaces"> | null>>
  workspaceImages: WorkspaceImage[]
  setWorkspaceImages: Dispatch<SetStateAction<WorkspaceImage[]>>

  // PRESET STORE
  selectedPreset: Tables<"presets"> | null
  setSelectedPreset: Dispatch<SetStateAction<Tables<"presets"> | null>>

  // ASSISTANT STORE
  selectedAssistant: Tables<"assistants"> | null
  setSelectedAssistant: Dispatch<SetStateAction<Tables<"assistants"> | null>>
  assistantImages: AssistantImage[]
  setAssistantImages: Dispatch<SetStateAction<AssistantImage[]>>
  openaiAssistants: any[]
  setOpenaiAssistants: Dispatch<SetStateAction<any[]>>

  // PASSIVE CHAT STORE
  userInput: string
  setUserInput: Dispatch<SetStateAction<string>>
  chatMessages: ChatMessage[]
  setChatMessages: Dispatch<SetStateAction<ChatMessage[]>>
  chatSettings: ChatSettings | null
  setChatSettings: Dispatch<SetStateAction<ChatSettings | null>>
  selectedChat: Tables<"chats"> | null
  setSelectedChat: Dispatch<SetStateAction<Tables<"chats"> | null>>
  chatFileItems: Tables<"file_items">[]
  setChatFileItems: Dispatch<SetStateAction<Tables<"file_items">[]>>

  // ACTIVE CHAT STORE
  abortController: AbortController | null
  setAbortController: Dispatch<SetStateAction<AbortController | null>>
  firstTokenReceived: boolean
  setFirstTokenReceived: Dispatch<SetStateAction<boolean>>
  isGenerating: boolean
  setIsGenerating: Dispatch<SetStateAction<boolean>>
  networkPhase:
    | "idle"
    | "connecting"
    | "streaming"
    | "stalled"
    | "offline"
    | "done"
  setNetworkPhase: Dispatch<
    SetStateAction<
      "idle" | "connecting" | "streaming" | "stalled" | "offline" | "done"
    >
  >
  streamStartedAt: number | null
  setStreamStartedAt: Dispatch<SetStateAction<number | null>>
  lastByteAt: number | null
  setLastByteAt: Dispatch<SetStateAction<number | null>>
  // CHAT INPUT COMMAND STORE
  isPromptPickerOpen: boolean
  setIsPromptPickerOpen: Dispatch<SetStateAction<boolean>>
  slashCommand: string
  setSlashCommand: Dispatch<SetStateAction<string>>
  isFilePickerOpen: boolean
  setIsFilePickerOpen: Dispatch<SetStateAction<boolean>>
  hashtagCommand: string
  setHashtagCommand: Dispatch<SetStateAction<string>>
  isToolPickerOpen: boolean
  setIsToolPickerOpen: Dispatch<SetStateAction<boolean>>
  toolCommand: string
  setToolCommand: Dispatch<SetStateAction<string>>
  focusPrompt: boolean
  setFocusPrompt: Dispatch<SetStateAction<boolean>>
  focusFile: boolean
  setFocusFile: Dispatch<SetStateAction<boolean>>
  focusTool: boolean
  setFocusTool: Dispatch<SetStateAction<boolean>>
  focusAssistant: boolean
  setFocusAssistant: Dispatch<SetStateAction<boolean>>
  atCommand: string
  setAtCommand: Dispatch<SetStateAction<string>>
  isAssistantPickerOpen: boolean
  setIsAssistantPickerOpen: Dispatch<SetStateAction<boolean>>

  // ATTACHMENTS STORE
  chatFiles: ChatFile[]
  setChatFiles: Dispatch<SetStateAction<ChatFile[]>>
  chatImages: MessageImage[]
  setChatImages: Dispatch<SetStateAction<MessageImage[]>>
  newMessageFiles: ChatFile[]
  setNewMessageFiles: Dispatch<SetStateAction<ChatFile[]>>
  newMessageImages: MessageImage[]
  setNewMessageImages: Dispatch<SetStateAction<MessageImage[]>>
  showFilesDisplay: boolean
  setShowFilesDisplay: Dispatch<SetStateAction<boolean>>
  isUploadingFiles: boolean
  setIsUploadingFiles: Dispatch<SetStateAction<boolean>>

  // RETRIEVAL STORE
  useRetrieval: boolean
  setUseRetrieval: Dispatch<SetStateAction<boolean>>
  sourceCount: number
  setSourceCount: Dispatch<SetStateAction<number>>

  // TOOL STORE
  selectedTools: Tables<"tools">[]
  setSelectedTools: Dispatch<SetStateAction<Tables<"tools">[]>>
  toolInUse: string
  setToolInUse: Dispatch<SetStateAction<string>>

  // 👇 STATE های جدید برای کلاس درس
  topicSummary: string
  setTopicSummary: Dispatch<SetStateAction<string>>
  suggestions: string[]
  setSuggestions: Dispatch<SetStateAction<string[]>>
}

export const ChatbotUIContext = createContext<ChatbotUIContext>({
  // PROFILE STORE
  profile: null,
  setProfile: () => {},
  supabase: null,
  // ITEMS STORE
  assistants: [],
  setAssistants: () => {},
  collections: [],
  setCollections: () => {},
  chats: [],
  setChats: () => {},
  files: [],
  setFiles: () => {},
  folders: [],
  setFolders: () => {},
  models: [],
  setModels: () => {},
  presets: [],
  setPresets: () => {},
  prompts: [],
  setPrompts: () => {},
  tools: [],
  setTools: () => {},
  workspaces: [],
  setWorkspaces: () => {},

  // MODELS STORE
  envKeyMap: {},
  setEnvKeyMap: () => {},
  availableHostedModels: [],
  setAvailableHostedModels: () => {},
  availableLocalModels: [],
  setAvailableLocalModels: () => {},
  availableOpenRouterModels: [],
  setAvailableOpenRouterModels: () => {},

  // WORKSPACE STORE
  selectedWorkspace: null,
  setSelectedWorkspace: () => {},
  workspaceImages: [],
  setWorkspaceImages: () => {},

  // PRESET STORE
  selectedPreset: null,
  setSelectedPreset: () => {},

  // ASSISTANT STORE
  selectedAssistant: null,
  setSelectedAssistant: () => {},
  assistantImages: [],
  setAssistantImages: () => {},
  openaiAssistants: [],
  setOpenaiAssistants: () => {},

  // PASSIVE CHAT STORE
  userInput: "",
  setUserInput: () => {},
  selectedChat: null,
  setSelectedChat: () => {},
  chatMessages: [],
  setChatMessages: () => {},
  chatSettings: null,
  setChatSettings: () => {},
  chatFileItems: [],
  setChatFileItems: () => {},

  // ACTIVE CHAT STORE
  isGenerating: false,
  setIsGenerating: () => {},
  firstTokenReceived: false,
  setFirstTokenReceived: () => {},
  abortController: null,
  setAbortController: () => {},
  networkPhase: "idle",
  setNetworkPhase: () => {},
  streamStartedAt: null,
  setStreamStartedAt: () => {},
  lastByteAt: null,
  setLastByteAt: () => {},

  // CHAT INPUT COMMAND STORE
  isPromptPickerOpen: false,
  setIsPromptPickerOpen: () => {},
  slashCommand: "",
  setSlashCommand: () => {},
  isFilePickerOpen: false,
  setIsFilePickerOpen: () => {},
  hashtagCommand: "",
  setHashtagCommand: () => {},
  isToolPickerOpen: false,
  setIsToolPickerOpen: () => {},
  toolCommand: "",
  setToolCommand: () => {},
  focusPrompt: false,
  setFocusPrompt: () => {},
  focusFile: false,
  setFocusFile: () => {},
  focusTool: false,
  setFocusTool: () => {},
  focusAssistant: false,
  setFocusAssistant: () => {},
  atCommand: "",
  setAtCommand: () => {},
  isAssistantPickerOpen: false,
  setIsAssistantPickerOpen: () => {},

  // ATTACHMENTS STORE
  chatFiles: [],
  setChatFiles: () => {},
  chatImages: [],
  setChatImages: () => {},
  newMessageFiles: [],
  setNewMessageFiles: () => {},
  newMessageImages: [],
  setNewMessageImages: () => {},
  showFilesDisplay: false,
  setShowFilesDisplay: () => {},
  isUploadingFiles: false,
  setIsUploadingFiles: () => {},

  // RETRIEVAL STORE
  useRetrieval: false,
  setUseRetrieval: () => {},
  sourceCount: 4,
  setSourceCount: () => {},

  // TOOL STORE
  selectedTools: [],
  setSelectedTools: () => {},
  toolInUse: "none",
  setToolInUse: () => {},

  // 👇 مقادیر پیش‌فرض برای STATE های جدید
  topicSummary: "",
  setTopicSummary: () => {},
  suggestions: [],
  setSuggestions: () => {}
})
