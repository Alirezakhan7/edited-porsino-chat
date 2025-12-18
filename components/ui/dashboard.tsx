"use client"

import { Sidebar } from "@/components/sidebar/sidebar"
import { SidebarSwitcher } from "@/components/sidebar/sidebar-switcher"
import { Button } from "@/components/ui/button"
import { Tabs } from "@/components/ui/tabs"
import useHotkey from "@/lib/hooks/use-hotkey"
import { useMediaQuery } from "@/lib/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { ContentType } from "@/types"
import { IconChevronCompactRight } from "@tabler/icons-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { FC, useEffect, useState } from "react"
import { useSelectFileHandler } from "../chat/chat-hooks/use-select-file-handler"
import { CommandK } from "../utility/command-k"

export const SIDEBAR_WIDTH = 300
export const SIDEBAR_DESKTOP_WIDTH = 350
export const SIDEBAR_SWITCHER_WIDTH = 90

interface DashboardProps {
  children: React.ReactNode
}

// Modern Hamburger Menu Component
const ModernHamburgerButton: FC<{
  isOpen: boolean
  onClick: () => void
  className?: string
}> = ({ isOpen, onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative size-10 rounded-lg transition-all duration-150 ease-out",
        // 👇 کلاس‌های جدید
        "border border-white/20 bg-white/30 shadow-md backdrop-blur-md",
        "hover:scale-105 hover:bg-white/40 hover:shadow-lg",
        "dark:border-gray-700/50 dark:bg-[#222]/30 dark:hover:bg-[#222]/40",
        // 👆 تا اینجا تغییرات اعمال شد
        "focus:outline-none focus:ring-2 focus:ring-blue-500/30 active:scale-95",
        "transform-gpu",
        isOpen && "pointer-events-none opacity-0",
        className
      )}
      aria-label={isOpen ? "Close menu" : "Open menu"}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-4 w-5">
          <span className="absolute left-0 top-0.5 block h-0.5 w-5 rounded-full bg-gray-700 dark:bg-gray-200" />
          <span className="absolute left-0 top-2 block h-0.5 w-5 rounded-full bg-gray-700 dark:bg-gray-200" />
          <span className="absolute left-0 top-3.5 block h-0.5 w-5 rounded-full bg-gray-700 dark:bg-gray-200" />
        </div>
      </div>
    </button>
  )
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

      {/* ******************** Modern Floating Hamburger Button (Mobile Only) ******************** */}
      {isMobile && (
        <div
          className="fixed top-4 z-30 flex items-center space-x-4 transition-all duration-300 ease-out"
          style={{
            left: showSidebar ? `${SIDEBAR_WIDTH + 20}px` : "20px"
          }}
        >
          <ModernHamburgerButton
            isOpen={showSidebar}
            onClick={handleToggleSidebar}
          />
          <div
            className={cn(
              // کلاس‌های ظاهری حذف شدند
              "transition-all duration-300",
              showSidebar
                ? "translate-x-2 opacity-0"
                : "translate-x-0 opacity-100"
            )}
          >
            <span className="text-lg font-bold text-gray-800 drop-shadow-sm dark:text-white">
              Porsino AI
            </span>
          </div>
        </div>
      )}

      {/* ******************** Sidebar Section ******************** */}
      {isMobile ? (
        // Mobile Layout: Sidebar as Drawer
        <>
          <div
            className={cn(
              "bg-background absolute left-0 top-0 z-20 h-full shadow-2xl transition-transform duration-300 ease-in-out",
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
              className="absolute inset-0 z-10 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
            />
          )}
        </>
      ) : (
        // Desktop Layout
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

      {/* ******************** Main Content Section ******************** */}
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

        {/* Desktop Toggle Button */}
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
