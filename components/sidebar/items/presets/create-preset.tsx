import { SidebarCreateItem } from "@/components/sidebar/items/all/sidebar-create-item"
import { ChatSettingsForm } from "@/components/ui/chat-settings-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChatbotUIContext } from "@/context/context"
import { PRESET_NAME_MAX } from "@/db/limits"
import { TablesInsert } from "@/supabase/types"
import { FC, useContext, useState } from "react"
import { ChatSettings } from "@/types"
interface CreatePresetProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const CreatePreset: FC<CreatePresetProps> = ({
  isOpen,
  onOpenChange
}) => {
  const { profile, selectedWorkspace } = useContext(ChatbotUIContext)

  const [name, setName] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [description, setDescription] = useState("")
  const [presetChatSettings, setPresetChatSettings] = useState<ChatSettings>({
    model: "gpt-4-turbo-preview", // یک مدل پیش‌فرض معتبر
    prompt: "",
    temperature: 0.5,
    contextLength: 4096,
    includeProfileContext: true,
    includeWorkspaceInstructions: true
  })

  if (!profile) return null
  if (!selectedWorkspace) return null

  return (
    <SidebarCreateItem
      contentType="presets"
      isOpen={isOpen}
      isTyping={isTyping}
      onOpenChange={onOpenChange}
      createState={
        {
          user_id: profile.user_id,
          name,
          description,
          include_profile_context: presetChatSettings.includeProfileContext,
          include_workspace_instructions:
            presetChatSettings.includeWorkspaceInstructions,
          context_length: presetChatSettings.contextLength,
          model: presetChatSettings.model,
          prompt: presetChatSettings.prompt,
          temperature: presetChatSettings.temperature
        } as TablesInsert<"presets">
      }
      renderInputs={() => (
        <>
          <div className="space-y-1">
            <Label>Name</Label>

            <Input
              placeholder="Preset name..."
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={PRESET_NAME_MAX}
            />
          </div>

          <ChatSettingsForm
            chatSettings={presetChatSettings as any}
            onChangeChatSettings={setPresetChatSettings}
            useAdvancedDropdown={true}
          />
        </>
      )}
    />
  )
}
