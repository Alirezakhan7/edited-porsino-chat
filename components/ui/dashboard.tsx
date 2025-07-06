"use client"

import { Sidebar } from "@/components/sidebar/sidebar"
import { SidebarSwitcher } from "@/components/sidebar/sidebar-switcher"
import { Button } from "@/components/ui/button"
import { Tabs } from "@/components/ui/tabs"
import useHotkey from "@/lib/hooks/use-hotkey"
import { useMediaQuery } from "@/lib/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { ContentType } from "@/types"
// IconMenu2 را برای دکمه همبرگری اضافه کنید
import { IconChevronCompactRight, IconMenu2 } from "@tabler/icons-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { FC, useEffect, useState } from "react"
import { useSelectFileHandler } from "../chat/chat-hooks/use-select-file-handler"
import { CommandK } from "../utility/command-k"

export const SIDEBAR_WIDTH = 300 // عرض سایدبار در موبایل
export const SIDEBAR_DESKTOP_WIDTH = 350
export const SIDEBAR_SWITCHER_WIDTH = 60

interface DashboardProps {
  children: React.ReactNode
}

export const Dashboard: FC<DashboardProps> = ({ children }) => {
  const isMobile = useMediaQuery("(max-width: 768px)")

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

  useEffect(() => {
    if (isMobile) {
      setShowSidebar(false)
    } else {
      const storedState = localStorage.getItem("showSidebar")
      setShowSidebar(storedState === null ? true : storedState === "true")
    }
  }, [isMobile])

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

  return (
    <div className="flex size-full">
      <CommandK />

      {/* ******************** دکمه همبرگری شناور (فقط موبایل) ******************** */}
      {isMobile && (
        <div
          className="fixed top-4 z-30 flex items-center space-x-2 transition-all duration-300"
          style={{
            left: showSidebar ? `${SIDEBAR_WIDTH + 16}px` : "16px" // ← حرکت همراه با سایدبار
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

      {/* ******************** بخش سایدبار ******************** */}
      {isMobile ? (
        // چیدمان موبایل: سایدبار به صورت کشویی (Drawer)
        <>
          <div
            className={cn(
              "bg-background absolute left-0 top-0 z-20 h-full shadow-lg transition-transform duration-300 ease-in-out",
              showSidebar ? "translate-x-0" : "-translate-x-full"
            )}
            style={{ width: `${SIDEBAR_WIDTH}px` }}
          >
            <Tabs
              className="flex h-full bg-[#dcebca] dark:bg-[#0a140d]"
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
        // چیدمان دسکتاپ
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
            <div className="size-full overflow-hidden border-r-2 bg-[#dcebca] text-white dark:border-none dark:bg-[#0a140d]">
              <Sidebar contentType={contentType} showSidebar={showSidebar} />
            </div>
          </div>
        </Tabs>
      )}

      {/* ******************** بخش محتوای اصلی ******************** */}
      <div
        className="relative flex w-full grow flex-col"
        onDrop={onFileDrop}
        onDragOver={onDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        {/* MobileHeader به طور کامل حذف شد */}
        <main className="size-full grow">
          {isDragging ? (
            <div className="flex h-full items-center justify-center bg-black/50 text-2xl text-white">
              drop file here
            </div>
          ) : (
            children
          )}
        </main>

        {/* دکمه باز/بسته کردن فقط در دسکتاپ */}
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
