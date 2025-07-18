import { ContentType } from "@/types"
import { FC } from "react"
import { TabsTrigger } from "../ui/tabs"
import { WithTooltip } from "../ui/with-tooltip"

interface SidebarSwitchItemProps {
  contentType: ContentType
  icon: React.ReactNode
  onContentTypeChange: (contentType: ContentType) => void
  setShowSidebar: (isOpen: boolean) => void
}

export const SidebarSwitchItem: FC<SidebarSwitchItemProps> = ({
  contentType,
  icon,
  onContentTypeChange,
  setShowSidebar // ← اینجا اضافه شد
}) => {
  const handleClick = () => {
    onContentTypeChange(contentType as ContentType)
    if (contentType === "chats") {
      setShowSidebar(true)
    }
  }

  return (
    <WithTooltip
      display={
        <div>{contentType[0].toUpperCase() + contentType.substring(1)}</div>
      }
      trigger={
        <TabsTrigger
          className="hover:opacity-50"
          value={contentType}
          onClick={handleClick}
        >
          {icon}
        </TabsTrigger>
      }
    />
  )
}
