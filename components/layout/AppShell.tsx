"use client"

import { ReactNode, useContext, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Dashboard } from "@/components/ui/dashboard"
import Loading from "@/app/[locale]/loading"

import { ChatbotUIContext } from "@/context/context"
import { supabase } from "@/lib/supabase/browser-client"
import { LLMID } from "@/types"

import { getHomeWorkspace } from "@/db/workspaces"
import { getChatsByWorkspaceId } from "@/db/chats"
import { getFoldersByWorkspaceId } from "@/db/folders"
import { getCollectionWorkspacesByWorkspaceId } from "@/db/collections"
import { getFileWorkspacesByWorkspaceId } from "@/db/files"
import { getPresetWorkspacesByWorkspaceId } from "@/db/presets"
import { getPromptWorkspacesByWorkspaceId } from "@/db/prompts"
import { getToolWorkspacesByWorkspaceId } from "@/db/tools"
import { getModelWorkspacesByWorkspaceId } from "@/db/models"
import { getAssistantWorkspacesByWorkspaceId } from "@/db/assistants"
import { getAssistantImageFromStorage } from "@/db/storage/assistant-images"
import { convertBlobToBase64 } from "@/lib/blob-to-b64"

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
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
        router.push("/login")
        return
      }

      const workspace = await getHomeWorkspace()

      if (!workspace || typeof (workspace as any).id !== "string") {
        router.push("/login")
        return
      }

      await fetchWorkspaceData((workspace as any).id, workspace)
    })()
  }, [])

  const fetchWorkspaceData = async (workspaceId: string, workspace: any) => {
    setLoading(true)

    setSelectedWorkspace(workspace)

    /* ---------- Assistants ---------- */
    const assistantData = (await getAssistantWorkspacesByWorkspaceId(
      workspaceId
    )) as { assistants: any[] }

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

    /* ---------- Core Data ---------- */
    setChats(await getChatsByWorkspaceId(workspaceId))
    setFolders(await getFoldersByWorkspaceId(workspaceId))

    const collections = await getCollectionWorkspacesByWorkspaceId(workspaceId)
    setCollections((collections as any).collections)

    const files = await getFileWorkspacesByWorkspaceId(workspaceId)
    setFiles((files as any).files)

    const presets = await getPresetWorkspacesByWorkspaceId(workspaceId)
    setPresets((presets as any).presets)

    const prompts = await getPromptWorkspacesByWorkspaceId(workspaceId)
    setPrompts((prompts as any).prompts)

    const tools = await getToolWorkspacesByWorkspaceId(workspaceId)
    setTools((tools as any).tools)

    const models = await getModelWorkspacesByWorkspaceId(workspaceId)
    setModels((models as any).models)

    /* ---------- Chat Settings ---------- */
    setChatSettings({
      model: (searchParams.get("model") || "bio-simple") as LLMID,
      prompt:
        workspace.default_prompt || "You are a friendly, helpful AI assistant.",
      temperature: workspace.default_temperature || 0.5,
      contextLength: workspace.default_context_length || 4096,
      includeProfileContext: workspace.include_profile_context ?? true,
      includeWorkspaceInstructions:
        workspace.include_workspace_instructions ?? true
    })

    /* ---------- Reset Chat State ---------- */
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
