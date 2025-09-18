import { ContentType } from "@/types" // ← اینو اضافه کن
import { IconMessage, IconHeadset } from "@tabler/icons-react"
// import Link from "next/link" // استفاده نشده؛ حذف
import { FC, useState } from "react"
import { TabsList } from "../ui/tabs"
import { WithTooltip } from "../ui/with-tooltip"
import { ProfileSettings } from "../utility/profile-settings"
import { SidebarSwitchItem } from "./sidebar-switch-item"
import { SupportModal } from "../utility/support-modal"

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

  return (
    <div className="flex flex-col justify-between bg-[#f8f8f8] pb-5 text-black dark:bg-[#3a3b3d] dark:text-white">
      <TabsList className="grid h-[440px] grid-rows-7 bg-[#f8f8f8] dark:bg-[#3a3b3d]">
        <SidebarSwitchItem
          icon={<IconMessage size={SIDEBAR_ICON_SIZE} />}
          contentType="chats"
          onContentTypeChange={onContentTypeChange}
          setShowSidebar={setShowSidebar}
        />
        {/*
        ... سایر تب‌ها
        */}
      </TabsList>

      <div className="flex flex-col items-center space-y-4">
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
