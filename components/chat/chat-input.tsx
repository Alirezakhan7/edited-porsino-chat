import { ChatbotUIContext } from "@/context/context"
import useHotkey from "@/lib/hooks/use-hotkey"
import { LLM_LIST } from "@/lib/models/llm/llm-list"
import { cn } from "@/lib/utils"
import {
  IconArrowUp,
  IconBolt,
  IconCalculator,
  IconPaperclip,
  IconPlayerStopFilled
} from "@tabler/icons-react"
import Image from "next/image"
import { FC, useContext, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Input } from "../ui/input"
import { TextareaAutosize } from "../ui/textarea-autosize"
import { ChatFilesDisplay } from "./chat-files-display"
import { useChatHandler } from "./chat-hooks/use-chat-handler"
import { useChatHistoryHandler } from "./chat-hooks/use-chat-history"
import { usePromptAndCommand } from "./chat-hooks/use-prompt-and-command"
import { useSelectFileHandler } from "./chat-hooks/use-select-file-handler"
import { ImageThumb } from "../ui/ImageThumb"

// Helper function to deeply freeze an object and all its nested properties
const deepFreeze = (obj: any): any => {
  if (obj && typeof obj === "object" && !Object.isFrozen(obj)) {
    Object.keys(obj).forEach(prop => deepFreeze((obj as any)[prop]))
    Object.freeze(obj)
  }
  return obj
}

// ============== داده‌های صفحه‌کلید ریاضی ==============
const mathData = {
  tabs: [
    { id: "basic", label: "÷×−+" },
    { id: "functions", label: "f(x) e ln" },
    { id: "trigonometry", label: "sin cos" },
    { id: "calculus", label: "lim ∫ ∑" }
  ],
  symbols: {
    basic: [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "x",
      "y",
      "√",
      "∛",
      "a²",
      "xⁿ",
      "(",
      ")",
      "÷",
      "<",
      ">",
      "×",
      "≤",
      "≥",
      "−",
      "x/y",
      "≠",
      ",",
      "=",
      "+"
    ],
    functions: [
      "e",
      "logₐ",
      "ln",
      "|a|",
      "aₙ",
      "!",
      "{",
      "}",
      "[",
      "]",
      "π",
      "%",
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "g",
      "h",
      "i",
      "j",
      "k",
      "l",
      "m",
      "n",
      "o",
      "p",
      "r",
      "s"
    ],
    trigonometry: [
      "sin",
      "cos",
      "tan",
      "cot",
      "sin⁻¹",
      "cos⁻¹",
      "tan⁻¹",
      "cot⁻¹",
      "α",
      "β",
      "γ",
      "δ",
      "ε",
      "ζ",
      "η",
      "θ",
      "ι",
      "κ",
      "λ",
      "μ",
      "ν",
      "ξ",
      "ο",
      "ρ",
      "σ",
      "τ",
      "υ",
      "φ",
      "χ",
      "ψ"
    ],
    calculus: [
      "lim",
      "∫",
      "f'",
      "dx",
      "∞",
      "∑",
      "(n¦k)",
      "z̄",
      "x⃗",
      "Π",
      "⇒",
      "⇔",
      "∈",
      "∉",
      "∪",
      "∩",
      "∅",
      "∧",
      "∨"
    ]
  }
}

// Deep freeze the data to make it truly immutable and prevent any modification
const MATH_KEYBOARD_DATA = deepFreeze(mathData)
// ======================================================

interface ChatInputProps {}

export const ChatInput: FC<ChatInputProps> = ({}) => {
  const { t } = useTranslation()
  useHotkey("l", () => handleFocusChatInput())
  const [isTyping, setIsTyping] = useState<boolean>(false)

  // 👇 ۱. افزودن استیت محلی
  const [localUserInput, setLocalUserInput] = useState("")

  const {
    userInput,
    chatMessages,
    isGenerating,
    selectedPreset,
    selectedAssistant,
    chatSettings,
    selectedTools,
    setSelectedTools,
    assistantImages,
    setUserInput,
    newMessageImages
  } = useContext(ChatbotUIContext)

  const {
    chatInputRef,
    handleSendMessage,
    handleStopMessage,
    handleFocusChatInput
  } = useChatHandler()

  const { handleInputChange } = usePromptAndCommand()
  const { filesToAccept, handleSelectDeviceFile } = useSelectFileHandler()
  const {
    setNewMessageContentToNextUserMessage,
    setNewMessageContentToPreviousUserMessage
  } = useChatHistoryHandler()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showMathKeyboard, setShowMathKeyboard] = useState(false)
  const [activeMathTab, setActiveMathTab] = useState("basic")

  // 👇 ۲. افزودن افکت هوشمند برای همگام‌سازی
  useEffect(() => {
    // این شرط کلیدی از رندر مجدد غیرضروری و پرش نشانگر جلوگیری می‌کند
    if (userInput !== localUserInput) {
      setLocalUserInput(userInput)
    }
  }, [userInput])

  useEffect(() => {
    setTimeout(() => handleFocusChatInput(), 200)
  }, [selectedPreset, selectedAssistant])

  // در کامپوننت ChatInput و بعد از تعریف ref ها

  useEffect(() => {
    // بعد از اینکه کامپوننت در صفحه قرار گرفت،
    // به صورت دستی پراپرتی dir را روی عنصر اصلی textarea تنظیم می‌کنیم.
    if (chatInputRef.current) {
      chatInputRef.current.dir = "rtl"
    }
  }, []) // [] یعنی این کد فقط یک بار بعد از اولین رندر اجرا می‌شود

  const handleKeyDown = async (event: React.KeyboardEvent) => {
    if (!isTyping && event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      await handleSendMessage(userInput, chatMessages, false)
      setUserInput("")
      setLocalUserInput("")
    }
  }

  const handlePaste = (event: React.ClipboardEvent) => {
    const imagesAllowed = LLM_LIST.find(
      llm => llm.modelId === chatSettings?.model
    )?.imageInput

    const items = event.clipboardData.items
    for (const item of items) {
      if (item.type.indexOf("image") === 0) {
        if (!imagesAllowed) {
          toast.error(
            `Images are not supported for this model. Use models like GPT-4 Vision instead.`
          )
          return
        }
        const file = item.getAsFile()
        if (!file) return
        handleSelectDeviceFile(file)
      }
    }
  }

  const insertSymbol = (symbol: string) => {
    if (chatInputRef.current) {
      const start = chatInputRef.current.selectionStart ?? 0
      const end = chatInputRef.current.selectionEnd ?? 0
      const before = userInput.slice(0, start)
      const after = userInput.slice(end)
      const newText = before + symbol + after
      setUserInput(newText)
      setTimeout(() => {
        if (chatInputRef.current) {
          chatInputRef.current.focus()
          chatInputRef.current.selectionStart =
            chatInputRef.current.selectionEnd = start + symbol.length
        }
      }, 0)
    }
  }

  // 👇 ۳. ایجاد تابع مدیریت ورودی جدید
  const handleLocalInputChange = (value: string) => {
    setLocalUserInput(value)
    setUserInput(value)
  }

  return (
    <>
      <div className="flex flex-col flex-wrap justify-center gap-2">
        <ChatFilesDisplay />
        <div className="flex flex-wrap justify-center gap-2">
          {newMessageImages.map(image => (
            <ImageThumb
              key={image.messageId || image.path}
              src={image.url}
              uploading={image.isUploading}
            />
          ))}
        </div>
        {selectedTools.map((tool, index) => (
          <div
            key={index}
            className="flex justify-center"
            onClick={() =>
              setSelectedTools(
                selectedTools.filter(
                  selectedTool => selectedTool.id !== tool.id
                )
              )
            }
          >
            <div className="flex cursor-pointer items-center justify-center space-x-1 rounded-lg bg-purple-600 px-3 py-1 hover:opacity-50">
              <IconBolt size={20} />
              <div>{tool.name}</div>
            </div>
          </div>
        ))}
        {selectedAssistant && (
          <div className="border-primary mx-auto flex w-fit items-center space-x-2 rounded-lg border p-1.5">
            {selectedAssistant.image_path && (
              <Image
                className="rounded"
                src={
                  assistantImages.find(
                    img => img.path === selectedAssistant.image_path
                  )?.base64
                }
                width={28}
                height={28}
                alt={selectedAssistant.name}
              />
            )}
            <div className="text-sm font-bold">
              Talking to {selectedAssistant.name}
            </div>
          </div>
        )}
      </div>

      <div className="flex w-full justify-center">
        <div className="relative  w-full max-w-6xl">
          <div className="flex flex-col rounded-2xl  bg-white/40 p-3 shadow-2xl backdrop-blur-md dark:bg-[#3c3c3c]">
            {/* 👇 ۴. به‌روزرسانی پراپرتی‌های TextareaAutosize */}
            <TextareaAutosize
              textareaRef={chatInputRef}
              className="placeholder:text-muted-foreground rtl w-full resize-none border-none bg-transparent text-right text-base placeholder:text-gray-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-[#f9f8f4]"
              placeholder={t(`پیام خود را بنویسید...`)}
              onValueChange={handleLocalInputChange}
              value={localUserInput}
              minRows={2}
              maxRows={8}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onCompositionStart={() => setIsTyping(true)}
              onCompositionEnd={() => setIsTyping(false)}
            />
            <div className="mt-2 flex w-full items-center justify-between">
              <div>
                {isGenerating ? (
                  <IconPlayerStopFilled
                    className="animate-pulse cursor-pointer text-sky-500 hover:text-sky-700 dark:text-[#ffe066] dark:hover:text-[#f9f871]"
                    onClick={handleStopMessage}
                    size={30}
                  />
                ) : (
                  <button
                    className={cn(
                      "rounded-full p-2 transition-colors",
                      !userInput
                        ? "cursor-not-allowed text-gray-400 dark:text-gray-600"
                        : "cursor-pointer bg-sky-500 text-white hover:bg-sky-600 dark:bg-[#38bdf8] dark:hover:bg-[#2563eb]"
                    )}
                    disabled={!userInput}
                    onClick={async () => {
                      await handleSendMessage(userInput, chatMessages, false)
                      setUserInput("")
                      setLocalUserInput("")
                    }}
                  >
                    <IconArrowUp size={18} stroke={2.5} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4 ">
                <button
                  className={cn(
                    "cursor-pointer rounded-full p-2 shadow-sm transition-all",
                    showMathKeyboard
                      ? "bg-white text-[#7dcfb6] dark:bg-[#7dcfb6] dark:text-[#3c3c3c]"
                      : "bg-white text-[#7dcfb6] hover:bg-[#f2f2f2] dark:bg-[#3c3c3c] dark:text-[#ffe066] dark:hover:bg-[#2c2c2c]"
                  )}
                  onClick={() => setShowMathKeyboard(prev => !prev)}
                  type="button"
                  title="صفحه‌کلید ریاضی"
                >
                  <IconCalculator size={22} />
                </button>
                <button
                  className="
                    cursor-pointer 
                    rounded-full 
                    bg-white
                    p-2 
                    text-[#a5b4fc] 
                    shadow-sm 
                    transition-all 
                    hover:bg-[#f2f2f2]
                    hover:text-[#7dcfb6] 
                    dark:bg-[#3c3c3c] 
                    dark:text-[#258080]
                    dark:hover:bg-[#2c2c2c]
                  "
                  onClick={() => fileInputRef.current?.click()}
                  title="افزودن فایل"
                >
                  <IconPaperclip size={22} />
                </button>
              </div>
            </div>
          </div>

          <Input
            ref={fileInputRef}
            className="hidden"
            type="file"
            onChange={e => {
              if (e.target.files) handleSelectDeviceFile(e.target.files[0])
            }}
            accept={filesToAccept}
          />

          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              showMathKeyboard ? "mt-2 max-h-[500px]" : "max-h-0"
            )}
          >
            <div className="rounded-xl border bg-gray-100/90 p-3 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/90">
              <div className="flex justify-around border-b border-gray-300 dark:border-gray-600">
                {MATH_KEYBOARD_DATA.tabs.map(
                  (tab: { id: string; label: string }) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveMathTab(tab.id)}
                      className={cn(
                        "w-full py-2 text-center text-sm tracking-widest text-gray-500 transition-colors hover:text-black dark:text-gray-300 dark:hover:text-white",
                        activeMathTab === tab.id &&
                          "border-b-2 border-blue-500 text-black dark:text-white"
                      )}
                    >
                      {tab.label}
                    </button>
                  )
                )}
              </div>

              <div className="grid grid-cols-10 gap-x-3 gap-y-2 p-2 pt-3">
                {MATH_KEYBOARD_DATA.symbols[
                  activeMathTab as keyof typeof MATH_KEYBOARD_DATA.symbols
                ].map((symbol: string, idx: number) => (
                  <button
                    key={`${activeMathTab}-${idx}`}
                    onClick={() => insertSymbol(symbol)}
                    className={cn(
                      "flex size-12 items-center justify-center rounded-2xl text-xl font-semibold shadow-md transition-all duration-150",
                      "bg-gray-100 hover:bg-blue-100 active:scale-95 dark:bg-gray-700 dark:text-white dark:hover:bg-blue-800",
                      "ring-1 ring-gray-200 dark:ring-gray-700",
                      activeMathTab === "basic" &&
                        "0123456789".includes(symbol) &&
                        "bg-orange-500/90 font-extrabold text-white shadow-lg hover:bg-orange-600"
                    )}
                    style={{ transition: "box-shadow 0.2s, background 0.2s" }}
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
