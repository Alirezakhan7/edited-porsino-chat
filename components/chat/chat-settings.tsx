import { ChatbotUIContext } from "@/context/context"
import { IconChevronDown } from "@tabler/icons-react"
import { CHAT_SETTING_LIMITS } from "@/lib/chat-setting-limits"
import useHotkey from "@/lib/hooks/use-hotkey"
import { LLMID, ModelProvider } from "@/types"
import {
  IconFlask,
  IconMath,
  IconAtom,
  IconDna,
  IconSettings
} from "@tabler/icons-react"
import { FC, useContext, useEffect, useRef } from "react"
import { Button } from "../ui/button"
import { ChatSettingsForm } from "../ui/chat-settings-form"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"

interface ChatSettingsProps {}

export const ChatSettings: FC<ChatSettingsProps> = ({}) => {
  useHotkey("i", () => handleClick())
  const customModelNames: Record<string, string> = {
    "math-simple": "ریاضی - پاسخ سریع",
    "math-advanced": "ریاضی - یادگیری مفهومی",
    "chem-simple": "شیمی - ساده",
    "chem-advanced": "شیمی - پیشرفته",
    "phys-simple": "فیزیک - ساده",
    "phys-advanced": "فیزیک - پیشرفته",
    "bio-simple": "زیست - ساده",
    "bio-advanced": "زیست - پیشرفته"
  }

  const {
    chatSettings,
    setChatSettings,
    models,
    availableHostedModels,
    availableLocalModels,
    availableOpenRouterModels
  } = useContext(ChatbotUIContext)

  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClick = () => {
    if (buttonRef.current) {
      buttonRef.current.click()
    }
  }

  useEffect(() => {
    if (!chatSettings) return
    setChatSettings({
      ...chatSettings,
      temperature: Math.min(
        chatSettings.temperature,
        CHAT_SETTING_LIMITS[chatSettings.model]?.MAX_TEMPERATURE || 1
      ),
      contextLength: Math.min(
        chatSettings.contextLength,
        CHAT_SETTING_LIMITS[chatSettings.model]?.MAX_CONTEXT_LENGTH || 4096
      )
    })
  }, [chatSettings?.model])

  if (!chatSettings) return null

  const allModels = [
    ...models.map(model => ({
      modelId: model.model_id as LLMID,
      modelName: model.name,
      provider: "custom" as ModelProvider,
      hostedId: model.id,
      platformLink: "",
      imageInput: false
    })),
    ...availableHostedModels,
    ...availableLocalModels,
    ...availableOpenRouterModels
  ]

  const fullModel = allModels.find(llm => llm.modelId === chatSettings.model)

  // Increase icon sizes from 18 to 24
  const getModelStyle = (modelId: string) => {
    if (modelId.includes("math")) {
      return {
        icon: <IconMath size={24} className="text-white" />,
        gradient: "from-emerald-500 to-teal-600"
      }
    } else if (modelId.includes("chem")) {
      return {
        icon: <IconFlask size={24} className="text-white" />,
        gradient: "from-blue-500 to-indigo-600"
      }
    } else if (modelId.includes("phys")) {
      return {
        icon: <IconAtom size={24} className="text-white" />,
        gradient: "from-purple-500 to-violet-600"
      }
    } else if (modelId.includes("bio")) {
      return {
        icon: <IconDna size={24} className="text-white" />,
        gradient: "from-green-500 to-emerald-600"
      }
    }
    // Default style
    return {
      icon: null,
      gradient: "from-gray-500 to-gray-600"
    }
  }

  const modelStyle = getModelStyle(chatSettings.model)

  return (
    <Popover>
      <PopoverTrigger asChild>
        {/* 
            Updated Trigger: 
            - Responsive width: w-[300px] on mobile,
              sm:w-[350px], md:w-[400px], lg:w-[500px]
            - Increased height (h-10 sm:h-12 md:h-14 lg:h-16) and padding for larger button.
        */}
        <Button
          ref={buttonRef}
          className="group flex items-center gap-2 rounded-full  transition-all hover:bg-transparent"
          variant="ghost"
        >
          <div className="flex w-full flex-row-reverse items-center justify-between gap-2">
            {/* آیکون درس سمت راست */}
            {modelStyle.icon && (
              <div
                className={`flex size-8 items-center justify-center rounded-full bg-gradient-to-r p-2 ${modelStyle.gradient} shadow-md`}
              >
                {modelStyle.icon}
              </div>
            )}

            {/* نام مدل با تفکیک و فلش */}
            <div className="flex items-center gap-2 text-right" dir="rtl">
              {/* بلاک دوخطی با self-center */}
              <div className="flex flex-col self-center leading-tight">
                <span className="text-lg font-bold">
                  {customModelNames[
                    fullModel?.modelId ?? chatSettings.model
                  ]?.split(" - ")[0] ??
                    fullModel?.modelName?.split(" - ")[0] ??
                    chatSettings.model}
                </span>
                <span className="text-xs text-gray-400">
                  {customModelNames[
                    fullModel?.modelId ?? chatSettings.model
                  ]?.split(" - ")[1] ??
                    fullModel?.modelName?.split(" - ")[1] ??
                    ""}
                </span>
              </div>

              {/* فلش رو‌به‌پایین */}
              <IconChevronDown
                size={18}
                className="self-center text-gray-500 dark:text-gray-300"
              />
            </div>
          </div>

          {/* Increase settings icon container size for balance

          <div
            className="relative flex size-8 items-center justify-center rounded-full bg-gray-200 
                      text-gray-600 shadow-sm 
                      transition-colors hover:bg-gray-300 
                      dark:bg-gray-800 dark:text-gray-300 
                      dark:hover:bg-gray-700"
          >
            <IconSettings size={20} />
          </div>
           */}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="relative flex max-h-[calc(100vh-60px)] w-[300px] max-w-xs 
                      flex-col space-y-4 overflow-auto 
                      rounded-lg border border-gray-300
                      bg-white p-4 shadow-xl sm:w-[350px] 
                      md:w-[400px] lg:w-[500px] 
                      dark:border-gray-800 dark:bg-gray-900"
        align="end"
      >
        <ChatSettingsForm
          chatSettings={chatSettings}
          onChangeChatSettings={setChatSettings}
        />
      </PopoverContent>
    </Popover>
  )
}
