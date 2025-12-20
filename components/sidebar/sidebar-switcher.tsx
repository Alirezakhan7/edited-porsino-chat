import { ContentType } from "@/types"
import {
  IconMessage,
  IconRobot,
  IconLayoutGrid,
  IconUpload,
  IconUser
} from "@tabler/icons-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { FC } from "react"
import { WithTooltip } from "../ui/with-tooltip"

// استفاده از سایز استاندارد قبلی (معادل size-6)
export const SIDEBAR_ICON_SIZE = 24

interface SidebarSwitcherProps {
  onContentTypeChange: (contentType: ContentType) => void
  setShowSidebar: (isOpen: boolean) => void
}

export const SidebarSwitcher: FC<SidebarSwitcherProps> = ({
  onContentTypeChange,
  setShowSidebar
}) => {
  const pathname = usePathname()

  // استایل کارتی (Paper-like) با ابعاد متناسب برای عرض 60px
  const getButtonClass = (isActive: boolean) => `
    group relative flex aspect-square w-10 items-center justify-center 
    rounded-xl transition-all duration-300 ease-out
    ${
      isActive
        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105 ring-2 ring-primary ring-offset-2 ring-offset-[#f0f2f5] dark:ring-offset-[#18181b]"
        : "bg-white text-gray-500 shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:text-primary dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-white"
    }
  `

  return (
    <div className="flex size-full flex-col items-center justify-between bg-[#f0f2f5] py-6 dark:bg-[#18181b]">
      {/* ۱. دکمه لیست چت‌ها (Sidebar Action) */}
      <WithTooltip
        display={<div>لیست چت‌ها</div>}
        trigger={
          <button
            onClick={() => {
              onContentTypeChange("chats")
              setShowSidebar(true)
            }}
            className={getButtonClass(false)}
          >
            <IconMessage size={SIDEBAR_ICON_SIZE} stroke={1.5} />
          </button>
        }
      />

      {/* ۲. دکمه AI (لینک به صفحه چت با آیکون ربات) */}
      <WithTooltip
        display={<div>هوش مصنوعی (AI)</div>}
        trigger={
          <Link
            href="/chat"
            className={getButtonClass(pathname.startsWith("/chat"))}
          >
            <IconRobot size={SIDEBAR_ICON_SIZE} stroke={1.5} />
          </Link>
        }
      />

      {/* ۳. مسیر درسی */}
      <WithTooltip
        display={<div>مسیر درسی</div>}
        trigger={
          <Link
            href="/path"
            className={getButtonClass(pathname.startsWith("/path"))}
          >
            <IconLayoutGrid size={SIDEBAR_ICON_SIZE} stroke={1.5} />
          </Link>
        }
      />

      {/* ۴. آپلود */}
      <WithTooltip
        display={<div>آپلود فایل</div>}
        trigger={
          <Link
            href="/upload"
            className={getButtonClass(pathname.startsWith("/upload"))}
          >
            <IconUpload size={SIDEBAR_ICON_SIZE} stroke={1.5} />
          </Link>
        }
      />

      {/* ۵. پروفایل (جایگزین دکمه تنظیمات قبلی) */}
      <WithTooltip
        display={<div>پروفایل کاربری</div>}
        trigger={
          <Link
            href="/profile"
            className={getButtonClass(pathname.startsWith("/profile"))}
          >
            <IconUser size={SIDEBAR_ICON_SIZE} stroke={1.5} />
          </Link>
        }
      />
    </div>
  )
}
