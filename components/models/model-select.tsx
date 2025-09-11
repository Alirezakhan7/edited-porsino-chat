import { ChatbotUIContext } from "@/context/context"
import { LLM, LLMID, ModelProvider } from "@/types"
import {
  IconChevronDown,
  IconFlask,
  IconMath,
  IconAtom,
  IconDna
} from "@tabler/icons-react"
import { FC, useContext, useRef, useState } from "react"
import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "../ui/dropdown-menu"

interface ModelSelectProps {
  selectedModelId: string
  onSelectModel: (modelId: LLMID) => void
}

export const ModelSelect: FC<ModelSelectProps> = ({
  selectedModelId,
  onSelectModel
}) => {
  const {
    profile,
    models,
    availableHostedModels,
    availableLocalModels,
    availableOpenRouterModels
  } = useContext(ChatbotUIContext)

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  const toggleCategory = (category: string) => {
    setExpandedCategory(prev => (prev === category ? null : category))
  }

  const handleSelectModel = (modelId: LLMID) => {
    onSelectModel(modelId)
    setIsOpen(false)
  }

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

  const customModelNames: Record<string, string> = {
    "math-simple": "پاسخ سریع",
    "math-advanced": "یادگیری مفهومی",
    "math-educational": "آموزشی",

    "chem-simple": "در حال توسعه",
    "chem-advanced": "در حال توسعه",

    "phys-simple": "پاسخ سریع",
    "phys-advanced": "یادگیری مفهومی",
    "phys-educational": "آموزشی",

    "bio-simple": "جامع",
    "bio-advanced": "پیشرفته"
  }

  const subjectData = {
    math: {
      icon: <IconMath size={20} className="text-white" />,
      gradient: "from-purple-500 to-violet-600"
    },
    chem: {
      icon: <IconFlask size={20} className="text-white" />,
      gradient: "from-gray-400 to-gray-500"
    },
    phys: {
      icon: <IconAtom size={20} className="text-white" />,
      gradient: "from-purple-500 to-violet-600"
    },
    bio: {
      icon: <IconDna size={20} className="text-white" />,
      gradient: "from-green-500 to-emerald-600"
    }
  }

  const getSubjectFromId = (modelId: string) => {
    if (modelId.includes("math")) return "math"
    if (modelId.includes("chem")) return "chem"
    if (modelId.includes("phys")) return "phys"
    if (modelId.includes("bio")) return "bio"
    return null
  }

  // 🔥 تغییر جدید: لیست درس‌هایی که بتا هستند
  const betaSubjects = ["math", "phys"]

  const selectedSubject = getSubjectFromId(selectedModelId)
  const selectedModel = allModels.find(
    model => model.modelId === selectedModelId
  )

  const disabledModelIds = [
    "math-educational",
    "phys-educational",
    "bio-advanced",
    "chem-simple",
    "chem-advanced"
  ]

  if (!profile) return null

  return (
    <div className="flex w-full flex-col space-y-1.5">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger
          className="w-full rounded-md border border-gray-300 bg-white transition-colors hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
          asChild
        >
          <Button
            ref={triggerRef}
            className="h-12 w-full justify-between px-4 text-gray-800 dark:text-white"
            variant="ghost"
          >
            {selectedSubject && selectedModel ? (
              <div className="flex items-center gap-2">
                <div
                  className={`flex size-7 items-center justify-center rounded-full bg-gradient-to-r ${subjectData[selectedSubject as keyof typeof subjectData].gradient}`}
                >
                  {
                    subjectData[selectedSubject as keyof typeof subjectData]
                      .icon
                  }
                </div>
                {/* 🔥 تغییر جدید: نمایش تگ بتا در دکمه اصلی */}
                <div className="flex items-center gap-1.5">
                  <span dir="rtl" className="text-md font-semibold">
                    {customModelNames[selectedModelId]}
                  </span>
                  {betaSubjects.includes(selectedSubject) && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/70 dark:text-blue-200">
                      بتا
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <span className="text-sm text-gray-400">انتخاب مدل...</span>
            )}
            <IconChevronDown size={16} className="text-gray-500" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-full max-w-xs rounded-md border border-gray-300 bg-white p-2 shadow-xl dark:border-gray-800 dark:bg-gray-900"
          align="start"
        >
          <div dir="rtl">
            <div className="border-b border-gray-200 px-2 py-1 text-xs font-medium text-gray-500 dark:border-gray-800 dark:text-gray-400">
              دسته‌بندی
            </div>
            <div dir="rtl" className="grid grid-cols-2 gap-2 p-2 text-right">
              {["math", "chem", "phys", "bio"].map(subject => {
                const isSubjectDisabled =
                  subject === "chem" || subject === "math" || subject === "phys"

                return (
                  <div
                    key={subject}
                    onClick={() =>
                      !isSubjectDisabled && toggleCategory(subject)
                    }
                    className={`flex items-center gap-2 rounded p-2 transition-colors ${
                      isSubjectDisabled
                        ? "cursor-not-allowed opacity-50"
                        : expandedCategory === subject
                          ? "bg-gray-100 dark:bg-gray-800"
                          : "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div
                      className={`flex size-6 items-center justify-center rounded-full bg-gradient-to-r ${subjectData[subject as keyof typeof subjectData].gradient}`}
                    >
                      {subjectData[subject as keyof typeof subjectData].icon}
                    </div>
                    <span className="text-sm font-medium text-gray-800 dark:text-white">
                      {subject === "math"
                        ? "ریاضی"
                        : subject === "chem"
                          ? "شیمی"
                          : subject === "phys"
                            ? "فیزیک"
                            : "زیست"}
                    </span>
                  </div>
                )
              })}
            </div>

            {expandedCategory && (
              <>
                <div className="mt-1 border-b border-gray-200 px-2 py-1 text-xs font-medium text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  سطح
                </div>
                <div className="grid grid-cols-2 gap-2 p-2">
                  {["simple", "advanced", "educational"].map(level => {
                    const modelId = `${expandedCategory}-${level}` as LLMID
                    const isDisabled = disabledModelIds.includes(modelId)

                    if (expandedCategory === "bio" && level === "educational") {
                      return null
                    }

                    return (
                      <div
                        key={level}
                        onClick={() =>
                          !isDisabled && handleSelectModel(modelId)
                        }
                        className={`
                          rounded-xl border p-2 text-center text-sm font-semibold
                          ${
                            isDisabled
                              ? "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                              : selectedModelId === modelId
                                ? `bg-gradient-to-r ${subjectData[expandedCategory as keyof typeof subjectData].gradient} text-white`
                                : "cursor-pointer border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                          }
                        `}
                      >
                        <span className="flex items-center justify-center gap-2">
                          <span>{customModelNames[modelId]}</span>
                          {/* 🔥 تغییر جدید: نمایش شرطی تگ بتا یا به‌زودی */}
                          {isDisabled && !modelId.includes("chem") && (
                            <span className="text-xs">(به‌زودی)</span>
                          )}
                          {!isDisabled &&
                            betaSubjects.includes(expandedCategory) && (
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/70 dark:text-blue-200">
                                بتا
                              </span>
                            )}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
