"use client"

import { Sidebar } from "@/components/sidebar/sidebar"
import { SidebarSwitcher } from "@/components/sidebar/sidebar-switcher"
import { Button } from "@/components/ui/button"
import { Tabs } from "@/components/ui/tabs"
import useHotkey from "@/lib/hooks/use-hotkey"
import { useMediaQuery } from "@/lib/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { ContentType } from "@/types"
import { IconChevronCompactRight, IconMenu2 } from "@tabler/icons-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { FC, useEffect, useState } from "react"
import { useSelectFileHandler } from "../chat/chat-hooks/use-select-file-handler"
import { CommandK } from "../utility/command-k"

export const SIDEBAR_WIDTH = 300
export const SIDEBAR_DESKTOP_WIDTH = 350
export const SIDEBAR_SWITCHER_WIDTH = 60

interface DashboardProps {
  children: React.ReactNode
}

export const Dashboard: FC<DashboardProps> = ({ children }) => {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [isMounted, setIsMounted] = useState(false) // <-- مرحله ۱: استیت جدید

  useHotkey("s", () => {
    if (!isMobile) setShowSidebar(prevState => !prevState)
  })

  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabValue = searchParams.get("tab") || "chats"

  const { handleSelectDeviceFile } = useSelectFileHandler()

  const [contentType, setContentType] = useState<ContentType>(
    tabValue as ContentType
  )
  const [showSidebar, setShowSidebar] = useState(true)
  const [isDragging, setIsDragging] = useState(false)

  // <-- مرحله ۲: اضافه کردن useEffect برای isMounted
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return // <-- صبر کن تا کلاینت آماده شود

    if (isMobile) {
      setShowSidebar(false)
    } else {
      const storedState = localStorage.getItem("showSidebar")
      setShowSidebar(storedState === null ? true : storedState === "true")
    }
  }, [isMobile, isMounted]) // <-- isMounted به وابستگی‌ها اضافه شد

  // ... (توابع درگ و دراپ بدون تغییر) ...
  const onFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const files = event.dataTransfer.files
    const file = files[0]
    handleSelectDeviceFile(file)
    setIsDragging(false)
  }
  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
  }
  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleToggleSidebar = () => {
    const newState = !showSidebar
    setShowSidebar(newState)
    if (!isMobile) {
      localStorage.setItem("showSidebar", String(newState))
    }
  }

  const handleCloseSidebar = () => {
    if (isMobile) {
      setShowSidebar(false)
    }
  }

  // <-- مرحله ۳: قبل از mount شدن کامپوننت، چیزی رندر نکن (یا لودر نمایش بده)
  if (!isMounted) {
    return null // یا <LoadingSpinner />
  }

  return (
    <div className="flex size-full">
      <CommandK />

      {isMobile && (
        <div
          className="fixed top-4 z-30 flex items-center space-x-2 transition-all duration-300"
          style={{
            left: showSidebar ? `${SIDEBAR_WIDTH + 16}px` : "16px"
          }}
        >
          <Button
            className="rounded-md border border-gray-300 bg-white p-2 text-black shadow-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
            size="icon"
            onClick={handleToggleSidebar}
          >
            <IconMenu2 size={24} />
          </Button>
          <span className="text-muted-foreground text-base font-semibold">
            Porsino
          </span>
        </div>
      )}

      {isMobile ? (
        <>
          <div
            className={cn(
              "bg-background absolute left-0 top-0 z-20 h-full shadow-lg transition-transform duration-300 ease-in-out",
              showSidebar ? "translate-x-0" : "-translate-x-full"
            )}
            style={{ width: `${SIDEBAR_WIDTH}px` }}
          >
            <Tabs
              className="flex h-full bg-[#f0f0f0] dark:bg-[#2c2d2f]"
              value={contentType}
              onValueChange={tabValue => {
                setContentType(tabValue as ContentType)
                router.replace(`${pathname}?tab=${tabValue}`)
                handleCloseSidebar()
              }}
            >
              <SidebarSwitcher
                onContentTypeChange={setContentType}
                setShowSidebar={setShowSidebar}
              />
              <Sidebar contentType={contentType} showSidebar={showSidebar} />
            </Tabs>
          </div>
          {showSidebar && (
            <div
              onClick={handleToggleSidebar}
              className="absolute inset-0 z-10 bg-black/50"
            />
          )}
        </>
      ) : (
        <Tabs
          className="flex"
          value={contentType}
          onValueChange={tabValue => {
            setContentType(tabValue as ContentType)
            router.replace(`${pathname}?tab=${tabValue}`)
          }}
        >
          <SidebarSwitcher
            onContentTypeChange={setContentType}
            setShowSidebar={setShowSidebar}
          />
          <div
            className="transition-all duration-200"
            style={{
              width: showSidebar
                ? `${SIDEBAR_DESKTOP_WIDTH - SIDEBAR_SWITCHER_WIDTH}px`
                : "0px"
            }}
          >
            <div className="size-full overflow-hidden border-r-2 bg-[#f0f0f0] text-white dark:border-none dark:bg-[#2c2d2f]">
              <Sidebar contentType={contentType} showSidebar={showSidebar} />
            </div>
          </div>
        </Tabs>
      )}

      <div
        className="relative flex w-full grow flex-col"
        onDrop={onFileDrop}
        onDragOver={onDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        <main className="size-full grow">
          {isDragging ? (
            <div className="flex h-full items-center justify-center bg-black/50 text-2xl text-white">
              drop file here
            </div>
          ) : (
            children
          )}
        </main>

        {!isMobile && (
          <Button
            className={cn(
              "bg-background hover:bg-muted absolute left-[-16px] top-[50%] z-10 size-[32px] -translate-y-1/2 cursor-pointer rounded-full border"
            )}
            style={{
              transform: `rotate(${showSidebar ? 180 : 0}deg)`
            }}
            variant="ghost"
            size="icon"
            onClick={handleToggleSidebar}
          >
            <IconChevronCompactRight size={24} />
          </Button>
        )}
      </div>
    </div>
  )
}
