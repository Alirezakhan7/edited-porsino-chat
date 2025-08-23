import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { ChatbotUIContext } from "@/context/context"
import { LLM_LIST } from "@/lib/models/llm/llm-list"
import { cn } from "@/lib/utils"
import { Tables } from "@/supabase/types"
import { LLM, LLMID, MessageImage, ModelProvider } from "@/types"
import {
  IconBolt,
  IconCaretDownFilled,
  IconCaretRightFilled,
  IconFileText,
  IconMoodSmile,
  IconPencil
} from "@tabler/icons-react"
import Image from "next/image"
import { FC, useContext, useEffect, useRef, useState } from "react"
import { ModelIcon } from "../models/model-icon"
import { Button } from "../ui/button"
import { FileIcon } from "../ui/file-icon"
import { FilePreview } from "../ui/file-preview"
import { TextareaAutosize } from "../ui/textarea-autosize"
import { WithTooltip } from "../ui/with-tooltip"
import { MessageActions } from "./message-actions"
import { MessageMarkdown } from "./message-markdown"
import FeedbackForm from "../chat/feedback/FeedbackForm"
import ModernProgressBar from "@/components/ui/ModernProgressBar" // مسیر را متناسب با ساختار پروژه خود تنظیم کنید
const ICON_SIZE = 32

const renderStructuredMessage = (content: string) => {
  if (!content || typeof content !== "string") return null

  const sectionRegex = /\*\*(.*?)\*\*\s*([\s\S]*?)(?=\n\*\*|$)/g
  const matches = Array.from(content.matchAll(sectionRegex))

  const sections = matches.map(match => ({
    title: match[1].trim(),
    body: match[2].trim()
  }))

  const lastMatch = matches.at(-1)
  const endOfLastMatch =
    typeof lastMatch?.index === "number"
      ? lastMatch.index + lastMatch[0].length
      : 0
  const trailingText = content.slice(endOfLastMatch).trim()

  const styleByTitle = (title: string) => {
    const t = title.toLowerCase()
    if (["کتاب", "رسمی", "منبع", "درسی"].some(k => t.includes(k))) return "book"
    if (["ساده", "یعنی", "یه جور", "مثال", "زبان"].some(k => t.includes(k)))
      return "casual"
    if (["خلاصه", "جمع‌بندی", "مرور", "کلیدی"].some(k => t.includes(k)))
      return "summary"
    if (
      [
        "نگران",
        "دوست",
        "می‌تونی",
        "خوبه",
        "آفرین",
        "عالی",
        "پیشرفت",
        "انگیزه"
      ].some(k => t.includes(k))
    )
      return "encourage"
    return "default"
  }

  const styleMap = {
    book: {
      bg: "bg-gradient-to-br from-blue-100 to-blue-50 border-blue-600 text-blue-900",
      icon: "📘",
      font: "font-semibold"
    },
    casual: {
      bg: "bg-gradient-to-br from-yellow-100 to-yellow-50 border-yellow-600 text-yellow-900",
      icon: "💡",
      font: "font-normal"
    },
    summary: {
      bg: "bg-gradient-to-br from-green-100 to-green-50 border-green-600 text-green-900",
      icon: "📌",
      font: "font-bold"
    },
    encourage: {
      bg: "", // فقط متن ساده
      icon: "❤️",
      font: "italic text-sm text-gray-700"
    },
    default: {
      bg: "bg-gradient-to-br from-gray-100 to-gray-50 border-gray-400 text-gray-900",
      icon: "🧩",
      font: "font-normal"
    }
  }

  const renderBody = (rawBody: string) => {
    const cleanedBody = rawBody
      .replace(/(\w)-\n/g, "$1")
      .replace(/\n{3,}/g, "\n\n")

    const lines = cleanedBody.split("\n").map(line => line.trim())
    const isBulletList = lines.every(line => line.startsWith("- "))

    if (isBulletList) {
      return (
        <ul className="list-disc space-y-2 hyphens-none break-words pr-4 leading-loose">
          {lines.map((line, i) => (
            <li key={i}>{line.replace(/^-\s*/, "")}</li>
          ))}
        </ul>
      )
    }

    return (
      <p className="hyphens-none whitespace-pre-line break-words leading-loose">
        {cleanedBody}
      </p>
    )
  }

  return (
    <div className="space-y-6 text-right leading-loose" dir="rtl">
      {sections.map(({ title, body }, i) => {
        const styleKey = styleByTitle(title)
        const style = styleMap[styleKey]

        return (
          <div
            key={i}
            className={`rounded border-r-4 p-4 shadow-sm ${style.bg} ${style.font} leading-loose`}
          >
            {styleKey !== "encourage" && (
              <p className="mb-2 flex items-center gap-2 font-bold">
                <span className="text-xl">{style.icon}</span>
                {title}
              </p>
            )}
            {renderBody(body)}
          </div>
        )
      })}

      {sections.length > 0 && trailingText && (
        <p
          className="mt-4 flex items-center gap-2 whitespace-pre-line text-sm italic leading-loose text-gray-700 dark:text-gray-300"
          dir="rtl"
        >
          ❤️ {trailingText}
        </p>
      )}

      {sections.length === 0 && content && (
        <MessageMarkdown content={content} />
      )}
    </div>
  )
}

interface MessageProps {
  message: Tables<"messages">
  fileItems: Tables<"file_items">[]
  isEditing: boolean
  isLast: boolean
  onStartEdit: (message: Tables<"messages">) => void
  onCancelEdit: () => void
  onSubmitEdit: (value: string, sequenceNumber: number) => void
}

export const Message: FC<MessageProps> = ({
  message,
  fileItems,
  isEditing,
  isLast,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit
}) => {
  const {
    assistants,
    profile,
    isGenerating,
    setIsGenerating,
    firstTokenReceived,
    availableLocalModels,
    availableOpenRouterModels,
    chatMessages,
    selectedAssistant,
    chatImages,
    assistantImages,
    toolInUse,
    files,
    models,
    networkPhase,
    streamStartedAt,
    lastByteAt
  } = useContext(ChatbotUIContext)

  const { handleSendMessage } = useChatHandler()

  const editInputRef = useRef<HTMLTextAreaElement>(null)

  const [isHovering, setIsHovering] = useState(false)
  const [editedMessage, setEditedMessage] = useState(message.content)

  const [showImagePreview, setShowImagePreview] = useState(false)
  const [selectedImage, setSelectedImage] = useState<MessageImage | null>(null)

  const [showFileItemPreview, setShowFileItemPreview] = useState(false)
  const [selectedFileItem, setSelectedFileItem] =
    useState<Tables<"file_items"> | null>(null)

  const [viewSources, setViewSources] = useState(false)

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message.content)
    } else {
      const textArea = document.createElement("textarea")
      textArea.value = message.content
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
    }
  }

  const handleSendEdit = () => {
    onSubmitEdit(editedMessage, message.sequence_number)
    onCancelEdit()
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (isEditing && event.key === "Enter" && event.metaKey) {
      handleSendEdit()
    }
  }

  const handleRegenerate = async () => {
    setIsGenerating(true)
    await handleSendMessage(
      editedMessage || chatMessages[chatMessages.length - 2].message.content,
      chatMessages,
      true
    )
  }

  const handleStartEdit = () => {
    onStartEdit(message)
  }

  useEffect(() => {
    setEditedMessage(message.content)

    if (isEditing && editInputRef.current) {
      const input = editInputRef.current
      input.focus()
      input.setSelectionRange(input.value.length, input.value.length)
    }
  }, [isEditing])

  const MODEL_DATA = [
    ...models.map(model => ({
      modelId: model.model_id as LLMID,
      modelName: model.name,
      provider: "custom" as ModelProvider,
      hostedId: model.id,
      platformLink: "",
      imageInput: false
    })),
    ...LLM_LIST,
    ...availableLocalModels,
    ...availableOpenRouterModels
  ].find(llm => llm.modelId === message.model) as LLM

  const messageAssistantImage = assistantImages.find(
    image => image.assistantId === message.assistant_id
  )?.base64

  const selectedAssistantImage = assistantImages.find(
    image => image.path === selectedAssistant?.image_path
  )?.base64

  const modelDetails = LLM_LIST.find(model => model.modelId === message.model)

  const fileAccumulator: Record<
    string,
    {
      id: string
      name: string
      count: number
      type: string
      description: string
    }
  > = {}

  const fileSummary = fileItems.reduce((acc, fileItem) => {
    const parentFile = files.find(file => file.id === fileItem.file_id)
    if (parentFile) {
      if (!acc[parentFile.id]) {
        acc[parentFile.id] = {
          id: parentFile.id,
          name: parentFile.name,
          count: 1,
          type: parentFile.type,
          description: parentFile.description
        }
      } else {
        acc[parentFile.id].count += 1
      }
    }
    return acc
  }, fileAccumulator)

  return (
    <div
      className={cn(
        "flex w-full",
        message.role === "user"
          ? "justify-end" // پیام کاربر راست‌چین
          : "justify-center " // پیام دستیار بدون تغییر
      )}
    >
      <div
        className={cn(
          "relative flex flex-col",
          message.role === "user"
            ? "ml-auto w-fit min-w-[110px] max-w-[80%] rounded-2xl bg-[#a3c5c0] px-5 py-3  shadow dark:bg-[#49746f]"
            : "w-full p-6 sm:w-[550px] sm:px-0 md:w-[650px] lg:w-[650px] xl:w-[700px]"
        )}
      >
        <div className="absolute right-5 top-7 sm:right-0">
          <MessageActions
            onCopy={handleCopy}
            onEdit={handleStartEdit}
            isAssistant={message.role === "assistant"}
            isLast={isLast}
            isEditing={isEditing}
            isHovering={isHovering}
            onRegenerate={handleRegenerate}
          />
        </div>
        <div className="space-y-3">
          {message.role === "system" ? (
            <div className="flex items-center space-x-4">
              <IconPencil
                className="border-primary bg-primary text-secondary rounded border-DEFAULT p-1"
                size={ICON_SIZE}
              />

              <div className="text-lg font-semibold">Prompt</div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              {message.role === "assistant" ? (
                messageAssistantImage ? (
                  <Image
                    style={{
                      width: `${ICON_SIZE}px`,
                      height: `${ICON_SIZE}px`
                    }}
                    className="rounded"
                    src={messageAssistantImage}
                    alt="assistant image"
                    height={ICON_SIZE}
                    width={ICON_SIZE}
                  />
                ) : (
                  <WithTooltip
                    display={<div>{MODEL_DATA?.modelName}</div>}
                    trigger={
                      <ModelIcon
                        provider={modelDetails?.provider || "custom"}
                        height={ICON_SIZE}
                        width={ICON_SIZE}
                      />
                    }
                  />
                )
              ) : profile?.image_url ? (
                <Image
                  className={`size-[32px] rounded`}
                  src={profile?.image_url}
                  height={32}
                  width={32}
                  alt="user image"
                />
              ) : (
                <IconMoodSmile
                  className="bg-primary text-secondary border-primary rounded border-DEFAULT p-1"
                  size={ICON_SIZE}
                />
              )}

              <div className="font-semibold">
                {message.role === "assistant"
                  ? message.assistant_id
                    ? assistants.find(
                        assistant => assistant.id === message.assistant_id
                      )?.name
                    : selectedAssistant
                      ? selectedAssistant?.name
                      : MODEL_DATA?.modelName
                  : (profile?.display_name ?? profile?.username)}
              </div>
            </div>
          )}
          {((!firstTokenReceived && isGenerating) ||
            networkPhase === "offline") &&
          isLast &&
          message.role === "assistant" ? (
            <>
              {(() => {
                switch (toolInUse) {
                  case "none":
                    return (
                      // کد جدید در اینجا جایگزین می‌شود
                      <ModernProgressBar
                        isGenerating={isGenerating}
                        phase={networkPhase} // NEW
                        startedAt={streamStartedAt} // NEW
                        lastByteAt={lastByteAt} // NEW
                        softSlaMs={40000} // مثلا ۴۰ ثانیه
                        onRetry={handleRegenerate} // دکمه‌ی تلاش مجدد
                        onComplete={() => setIsGenerating(false)}
                      />
                    )

                  case "retrieval":
                    return (
                      <div className="flex animate-pulse items-center space-x-2">
                        <IconFileText size={20} />
                        <div>Searching files...</div>
                      </div>
                    )
                  default:
                    return (
                      <div className="flex animate-pulse items-center space-x-2">
                        <IconBolt size={20} />
                        <div>Using {toolInUse}...</div>
                      </div>
                    )
                }
              })()}
            </>
          ) : isEditing ? (
            <TextareaAutosize
              textareaRef={editInputRef}
              className="text-md"
              value={editedMessage}
              onValueChange={setEditedMessage}
              maxRows={20}
            />
          ) : (
            <div className="rtl text-right">
              {(() => {
                try {
                  const parsed = JSON.parse(message.content)
                  return renderStructuredMessage(
                    parsed.response || message.content
                  )
                } catch {
                  return renderStructuredMessage(message.content)
                }
              })()}
            </div>
          )}
        </div>

        {message.role === "assistant" && message.id && (
          <FeedbackForm messageId={message.id} />
        )}

        {fileItems.length > 0 && (
          <div className="border-primary mt-6 border-t pt-4 font-bold">
            {!viewSources ? (
              <div
                className="flex cursor-pointer items-center text-lg hover:opacity-50"
                onClick={() => setViewSources(true)}
              >
                {fileItems.length}
                {fileItems.length > 1 ? " Sources " : " Source "}
                from {Object.keys(fileSummary).length}{" "}
                {Object.keys(fileSummary).length > 1 ? "Files" : "File"}{" "}
                <IconCaretRightFilled className="ml-1" />
              </div>
            ) : (
              <>
                <div
                  className="flex cursor-pointer items-center text-lg hover:opacity-50"
                  onClick={() => setViewSources(false)}
                >
                  {fileItems.length}
                  {fileItems.length > 1 ? " Sources " : " Source "}
                  from {Object.keys(fileSummary).length}{" "}
                  {Object.keys(fileSummary).length > 1 ? "Files" : "File"}{" "}
                  <IconCaretDownFilled className="ml-1" />
                </div>

                <div className="mt-3 space-y-4">
                  {Object.values(fileSummary).map((file, index) => (
                    <div key={index}>
                      <div className="flex items-center space-x-2">
                        <div>
                          <FileIcon type={file.type} />
                        </div>

                        <div className="truncate">{file.name}</div>
                      </div>

                      {fileItems
                        .filter(fileItem => {
                          const parentFile = files.find(
                            parentFile => parentFile.id === fileItem.file_id
                          )
                          return parentFile?.id === file.id
                        })
                        .map((fileItem, index) => (
                          <div
                            key={index}
                            className="ml-8 mt-1.5 flex cursor-pointer items-center space-x-2 hover:opacity-50"
                            onClick={() => {
                              setSelectedFileItem(fileItem)
                              setShowFileItemPreview(true)
                            }}
                          >
                            <div className="text-sm font-normal">
                              <span className="mr-1 text-lg font-bold">-</span>{" "}
                              {fileItem.content.substring(0, 200)}...
                            </div>
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {message.image_paths.map((path, index) => {
            // این `item` همان آبجکتی است که در مرحله قبل ساختید و حاوی `url` است
            const item = chatImages.find(image => image.path === path)

            return (
              <Image
                key={index}
                className="cursor-pointer rounded hover:opacity-50"
                // 👇 تغییر اصلی اینجاست
                src={path.startsWith("data") ? path : item?.url || ""}
                alt="message image"
                width={300}
                height={300}
                onClick={() => {
                  setSelectedImage({
                    messageId: message.id,
                    path,
                    // 👇 اینجا هم برای پیش‌نمایش عکس، url را اولویت قرار می‌دهیم
                    base64: path.startsWith("data") ? path : null,
                    url: path.startsWith("data") ? "" : item?.url || "",
                    file: null
                  })

                  setShowImagePreview(true)
                }}
                loading="lazy"
              />
            )
          })}
        </div>
        {isEditing && (
          <div className="mt-4 flex justify-center space-x-2">
            <Button size="sm" onClick={handleSendEdit}>
              Save & Send
            </Button>

            <Button size="sm" variant="outline" onClick={onCancelEdit}>
              Cancel
            </Button>
          </div>
        )}
      </div>

      {showImagePreview && selectedImage && (
        <FilePreview
          type="image"
          item={selectedImage}
          isOpen={showImagePreview}
          onOpenChange={(isOpen: boolean) => {
            setShowImagePreview(isOpen)
            setSelectedImage(null)
          }}
        />
      )}

      {showFileItemPreview && selectedFileItem && (
        <FilePreview
          type="file_item"
          item={selectedFileItem}
          isOpen={showFileItemPreview}
          onOpenChange={(isOpen: boolean) => {
            setShowFileItemPreview(isOpen)
            setSelectedFileItem(null)
          }}
        />
      )}
    </div>
  )
}
