import { ContentType } from "@/types"
import { IconMessage, IconHeadset } from "@tabler/icons-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { FC, useState } from "react"

import { navItems } from "@/components/layout/BottomNav"
import { TabsList } from "../ui/tabs"
import { WithTooltip } from "../ui/with-tooltip"
import { ProfileSettings } from "../utility/profile-settings"
import { SupportModal } from "../utility/support-modal"
import { SidebarSwitchItem } from "./sidebar-switch-item"

export const SIDEBAR_ICON_SIZE = 28

interface SidebarSwitcherProps {
  onContentTypeChange: (contentType: ContentType) => void
  setShowSidebar: (isOpen: boolean) => void
}

export const SidebarSwitcher: FC<SidebarSwitcherProps> = ({
  onContentTypeChange,
  setShowSidebar
}) => {
  const [supportOpen, setSupportOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="flex flex-col justify-between bg-[#f8f8f8] pb-5 text-black dark:bg-[#3a3b3d] dark:text-white">
      {/* بالا: تب‌های سایدبار (فعلاً فقط Chats) */}
      <TabsList className="grid h-[440px] grid-rows-7 bg-[#f8f8f8] dark:bg-[#3a3b3d]">
        <SidebarSwitchItem
          icon={<IconMessage size={SIDEBAR_ICON_SIZE} />}
          contentType="chats"
          onContentTypeChange={onContentTypeChange}
          setShowSidebar={setShowSidebar}
        />
      </TabsList>

      {/* پایین: Nav دسکتاپ + پشتیبانی موبایل + پروفایل */}
      <div className="flex flex-col items-center space-y-4">
        {/* دسکتاپ: آیتم‌های BottomNav داخل سایدبار */}
        <div className="hidden flex-col items-center gap-3 md:flex">
          {navItems.map(item => {
            const isActive =
              item.href === "/chat"
                ? pathname.startsWith("/chat")
                : pathname.startsWith(item.href)

            return (
              <WithTooltip
                key={item.href}
                display={<div>{item.label}</div>}
                trigger={
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    className={`rounded-lg p-2 hover:opacity-70 ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <item.icon size={SIDEBAR_ICON_SIZE} />
                  </Link>
                }
              />
            )
          })}
        </div>

        {/* فقط موبایل: آیکون پشتیبانی بالای پروفایل */}
        <button
          type="button"
          className="md:hidden"
          aria-label="پشتیبانی"
          onClick={() => setSupportOpen(true)}
        >
          <WithTooltip
            display={<div>پشتیبانی</div>}
            trigger={
              <IconHeadset
                size={SIDEBAR_ICON_SIZE}
                className="cursor-pointer hover:opacity-70"
              />
            }
          />
        </button>

        {/* پروفایل */}
        <WithTooltip
          display={<div>تنظیمات پروفایل</div>}
          trigger={<ProfileSettings />}
        />
      </div>

      {/* مودال پشتیبانی */}
      <SupportModal open={supportOpen} onOpenChange={setSupportOpen} />
    </div>
  )
}
