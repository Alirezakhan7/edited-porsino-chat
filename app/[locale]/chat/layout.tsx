"use client"

import { ThemeProvider } from "next-themes"
import { Dashboard } from "@/components/ui/dashboard"
import { ChatbotUIContext } from "@/context/context"
import { getAssistantWorkspacesByWorkspaceId } from "@/db/assistants"
import { getChatsByWorkspaceId } from "@/db/chats"
import { getCollectionWorkspacesByWorkspaceId } from "@/db/collections"
import { getFileWorkspacesByWorkspaceId } from "@/db/files"
import { getFoldersByWorkspaceId } from "@/db/folders"
import { getModelWorkspacesByWorkspaceId } from "@/db/models"
import { getPresetWorkspacesByWorkspaceId } from "@/db/presets"
import { getPromptWorkspacesByWorkspaceId } from "@/db/prompts"
import { getAssistantImageFromStorage } from "@/db/storage/assistant-images"
import { getToolWorkspacesByWorkspaceId } from "@/db/tools"
import { getHomeWorkspace } from "@/db/workspaces"
import { convertBlobToBase64 } from "@/lib/blob-to-b64"
import { supabase } from "@/lib/supabase/browser-client"
import { LLMID } from "@/types"
import { useRouter, useSearchParams } from "next/navigation"
import { ReactNode, useContext, useEffect, useState } from "react"
import Loading from "../loading"

interface WorkspaceLayoutProps {
  children: ReactNode
}

export default function ChatLayout({ children }: WorkspaceLayoutProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const {
    setChatSettings,
    setAssistants,
    setAssistantImages,
    setChats,
    setCollections,
    setFolders,
    setFiles,
    setPresets,
    setPrompts,
    setTools,
    setModels,
    selectedWorkspace,
    setSelectedWorkspace,
    setSelectedChat,
    setChatMessages,
    setUserInput,
    setIsGenerating,
    setFirstTokenReceived,
    setChatFiles,
    setChatImages,
    setNewMessageFiles,
    setNewMessageImages,
    setShowFilesDisplay
  } = useContext(ChatbotUIContext)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const session = (await supabase.auth.getSession()).data.session

      if (!session) {
        return router.push("/login")
      } else {
        const workspace = await getHomeWorkspace()

        if (!workspace || typeof (workspace as any).id !== "string") {
          return router.push("/login")
        }

        await fetchWorkspaceData((workspace as any).id, workspace)
      }
    })()
  }, [])

  const fetchWorkspaceData = async (workspaceId: string, workspace: any) => {
    setLoading(true)

    setSelectedWorkspace(workspace)

    const assistantData = (await getAssistantWorkspacesByWorkspaceId(
      workspaceId
    )) as {
      assistants: any[]
    }
    setAssistants(assistantData.assistants)

    for (const assistant of assistantData.assistants) {
      let url = ""

      if (assistant.image_path) {
        url = (await getAssistantImageFromStorage(assistant.image_path)) || ""
      }

      if (url) {
        const response = await fetch(url)
        const blob = await response.blob()
        const base64 = await convertBlobToBase64(blob)

        setAssistantImages(prev => [
          ...prev,
          {
            assistantId: assistant.id,
            path: assistant.image_path,
            base64,
            url
          }
        ])
      } else {
        setAssistantImages(prev => [
          ...prev,
          {
            assistantId: assistant.id,
            path: assistant.image_path,
            base64: "",
            url: ""
          }
        ])
      }
    }

    const chats = await getChatsByWorkspaceId(workspaceId)
    setChats(chats)

    const collectionData = (await getCollectionWorkspacesByWorkspaceId(
      workspaceId
    )) as {
      collections: any[]
    }
    setCollections(collectionData.collections)

    const folders = await getFoldersByWorkspaceId(workspaceId)
    setFolders(folders)

    const fileData = (await getFileWorkspacesByWorkspaceId(workspaceId)) as {
      files: any[]
    }
    setFiles(fileData.files)

    const presetData = (await getPresetWorkspacesByWorkspaceId(
      workspaceId
    )) as {
      presets: any[]
    }
    setPresets(presetData.presets)

    const promptData = (await getPromptWorkspacesByWorkspaceId(
      workspaceId
    )) as {
      prompts: any[]
    }

    setPrompts(promptData.prompts)

    const toolData = (await getToolWorkspacesByWorkspaceId(workspaceId)) as {
      tools: any[]
    }
    setTools(toolData.tools)

    const modelData = (await getModelWorkspacesByWorkspaceId(workspaceId)) as {
      models: any[]
    }
    setModels(modelData.models)

    setChatSettings({
      model: (searchParams.get("model") || "bio-simple") as LLMID,
      prompt:
        workspace?.default_prompt ||
        "You are a friendly, helpful AI assistant.",
      temperature: workspace?.default_temperature || 0.5,
      contextLength: workspace?.default_context_length || 4096,
      includeProfileContext: workspace?.include_profile_context || true,
      includeWorkspaceInstructions:
        workspace?.include_workspace_instructions || true
    })

    setUserInput("")
    setChatMessages([])
    setSelectedChat(null)
    setIsGenerating(false)
    setFirstTokenReceived(false)
    setChatFiles([])
    setChatImages([])
    setNewMessageFiles([])
    setNewMessageImages([])
    setShowFilesDisplay(false)

    setLoading(false)
  }

  return loading ? <Loading /> : <Dashboard>{children}</Dashboard>
}
