// components/layout/AppShell.tsx
"use client"

import { ReactNode, useContext, useEffect, useState, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Dashboard } from "@/components/ui/dashboard"
import Loading from "@/app/[locale]/loading"
import { ChatbotUIContext } from "@/context/context"
import { LLMID } from "@/types"
// ایمپورت‌های دیتابیس
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
import { useMediaQuery } from "@/lib/hooks/use-media-query"

interface AppShellProps {
  children: ReactNode
  workspaceData: any
}

export default function AppShell({ children, workspaceData }: AppShellProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const isMobile = useMediaQuery("(max-width: 768px)")

  // این رفرنس کمک می‌کند تا از فچ تکراری جلوگیری کنیم
  const dataFetchedRef = useRef(false)

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

  useEffect(() => {
    if (workspaceData) {
      setSelectedWorkspace(workspaceData)

      setChatSettings({
        model: (searchParams.get("model") || "bio-simple") as LLMID,
        prompt:
          workspaceData.default_prompt ||
          "You are a friendly, helpful AI assistant.",
        temperature: workspaceData.default_temperature || 0.5,
        contextLength: workspaceData.default_context_length || 4096,
        includeProfileContext: workspaceData.include_profile_context ?? true,
        includeWorkspaceInstructions:
          workspaceData.include_workspace_instructions ?? true
      })

      // ریست کردن مقادیر چت (این بخش سبک است و مشکلی ندارد)
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

      // --- تغییر حیاتی اینجاست ---
      // شرط: آیا کاربر در صفحه چت است؟
      const isChatPage = pathname?.includes("/chat")

      // اگر در صفحه چت هستیم و قبلا دیتا را نگرفته‌ایم -> بگیر
      if (isChatPage && !dataFetchedRef.current) {
        fetchPrimaryData(workspaceData.id)
        dataFetchedRef.current = true
      }
      // اگر در صفحه path یا upload هستیم -> هیچ کاری نکن (CPU آزاد می‌ماند)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceData, pathname]) // pathname اضافه شد تا اگر نویگیت کرد به چت، دیتا لود شود

  const fetchPrimaryData = async (workspaceId: string) => {
    try {
      const [chats, folders, assistantData] = await Promise.all([
        getChatsByWorkspaceId(workspaceId),
        getFoldersByWorkspaceId(workspaceId),
        getAssistantWorkspacesByWorkspaceId(workspaceId)
      ])

      setChats(chats)
      setFolders(folders)
      setAssistants((assistantData as any).assistants)
      processAssistantImages((assistantData as any).assistants)

      // لود دیتای ثانویه با تاخیر
      setTimeout(() => fetchSecondaryData(workspaceId), 2000)
    } catch (e) {
      console.error("Error fetching primary data", e)
    }
  }

  const fetchSecondaryData = async (workspaceId: string) => {
    try {
      const [collections, files, presets, prompts, tools, models] =
        await Promise.all([
          getCollectionWorkspacesByWorkspaceId(workspaceId),
          getFileWorkspacesByWorkspaceId(workspaceId),
          getPresetWorkspacesByWorkspaceId(workspaceId),
          getPromptWorkspacesByWorkspaceId(workspaceId),
          getToolWorkspacesByWorkspaceId(workspaceId),
          getModelWorkspacesByWorkspaceId(workspaceId)
        ])

      setCollections((collections as any).collections)
      setFiles((files as any).files)
      setPresets((presets as any).presets)
      setPrompts((prompts as any).prompts)
      setTools((tools as any).tools)
      setModels((models as any).models)
    } catch (e) {
      console.error("Error fetching secondary data", e)
    }
  }

  const processAssistantImages = async (assistants: any[]) => {
    for (const assistant of assistants) {
      let url = ""
      if (assistant.image_path) {
        url = (await getAssistantImageFromStorage(assistant.image_path)) || ""
      }
      setAssistantImages(prev => [
        ...prev,
        {
          assistantId: assistant.id,
          path: assistant.image_path,
          base64: "",
          url
        }
      ])
    }
  }

  if (!workspaceData) return <Loading />

  const isChatRoute = pathname?.includes("/chat")

  // مسیرهایی که نیاز به دشبورد و سایدبار ندارند (Immersive)
  const isImmersiveRoute =
    pathname?.includes("/path") ||
    pathname?.includes("/lesson") ||
    pathname?.includes("/play") ||
    pathname?.includes("/profile") ||
    pathname?.includes("/upload") // اضافه شد طبق درخواستت

  // لاجیک نمایش موبایل
  if (isMobile && !isChatRoute) {
    return <>{children}</>
  }

  // لاجیک نمایش دسکتاپ برای صفحات تمام صفحه (مثل درس)
  // نکته: اینجا قبلا Dashboard رندر می‌شد که سایدبار داشت
  // الان هم رندر می‌شود اما چون دیتا فچ نشده، سایدبار خالی است (که مشکلی نیست چون دیده نمی‌شود یا کمتر دیده می‌شود)
  // اما اگر می‌خواهی کلا Dashboard هم رندر نشود، می‌توانی اینجا شرط بگذاری
  if (isImmersiveRoute) {
    return (
      <Dashboard>
        <div className="size-full">{children}</div>
      </Dashboard>
    )
  }

  return (
    <Dashboard>
      <div
        className={`bg-background text-foreground w-full ${
          isChatRoute ? "flex h-full flex-col" : ""
        }`}
      >
        <div
          className={`w-full px-4 md:px-8 
            ${isChatRoute ? "h-full py-0" : "py-6"}
            ${isMobile ? "pb-24" : ""} 
          `}
        >
          {children}
        </div>
      </div>
    </Dashboard>
  )
}
