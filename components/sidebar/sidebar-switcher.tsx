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

export const SIDEBAR_ICON_SIZE = 26

interface SidebarSwitcherProps {
  onContentTypeChange: (contentType: ContentType) => void
  setShowSidebar: (isOpen: boolean) => void
}

export const SidebarSwitcher: FC<SidebarSwitcherProps> = ({
  onContentTypeChange,
  setShowSidebar
}) => {
  const pathname = usePathname()

  // تابع کمکی برای استایل دکمه‌ها (Paper-like card style)
  const getButtonClass = (isActive: boolean) => `
    group relative flex aspect-square w-12 items-center justify-center 
    rounded-2xl transition-all duration-300 ease-out
    ${
      isActive
        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110 ring-2 ring-primary ring-offset-2 ring-offset-[#f0f2f5] dark:ring-offset-[#18181b]"
        : "bg-white text-gray-500 shadow-md hover:-translate-y-1 hover:shadow-xl hover:text-primary dark:bg-zinc-800 dark:text-zinc-400 dark:hover:text-white"
    }
  `

  return (
    <div className="flex size-full flex-col items-center justify-between bg-[#f0f2f5] py-6 dark:bg-[#18181b]">
      {/* 1. دکمه چت سایدبار (تغییر محتوا) */}
      <WithTooltip
        display={<div>لیست چت‌ها</div>}
        trigger={
          <button
            onClick={() => {
              onContentTypeChange("chats")
              setShowSidebar(true)
            }}
            className={getButtonClass(false)} // این دکمه اکشن است، معمولا اکتیو نیست مگر اینکه لاجیک خاصی داشته باشید
          >
            <IconMessage size={SIDEBAR_ICON_SIZE} stroke={1.5} />
          </button>
        }
      />

      {/* 2. دکمه AI (همان چت بات) */}
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

      {/* 3. مسیر درسی */}
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

      {/* 4. آپلود */}
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

      {/* 5. پروفایل (جایگزین شده با لینک پروفایل باتم‌نو) */}
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
