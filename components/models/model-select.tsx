import { ChatbotUIContext } from "@/context/context"
import { LLM, LLMID, ModelProvider } from "@/types"
import {
  IconChevronDown,
  IconFlask,
  IconMath,
  IconAtom,
  IconDna,
  IconSettings
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
    "chem-simple": "شیمی - ساده",
    "chem-advanced": "شیمی - پیشرفته",
    "phys-simple": "فیزیک - ساده",
    "phys-advanced": "فیزیک - پیشرفته",
    "bio-simple": "زیست - ساده",
    "bio-advanced": "زیست - پیشرفته"
  }

  const subjectData = {
    math: {
      icon: <IconMath size={20} className="text-white" />,
      gradient: "from-emerald-500 to-teal-600"
    },
    chem: {
      icon: <IconFlask size={20} className="text-white" />,
      gradient: "from-blue-500 to-indigo-600"
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

  const selectedSubject = getSubjectFromId(selectedModelId)
  const selectedModel = allModels.find(
    model => model.modelId === selectedModelId
  )

  if (!profile) return null

  return (
    <div className="flex w-full flex-col space-y-1.5">
      {/*<label className="text-sm font-medium text-gray-800 dark:text-gray-200 mr-1" dir="rtl">مدل</label>*/}
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
            {selectedSubject ? (
              <div className="text-md flex items-center gap-2">
                <div
                  className={`flex size-7 items-center justify-center rounded-full bg-gradient-to-r ${subjectData[selectedSubject].gradient}`}
                >
                  {subjectData[selectedSubject].icon}
                </div>
                <span dir="rtl" className="text-md font-semibold">
                  {customModelNames[selectedModelId]}
                </span>
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
              {["math", "chem", "phys", "bio"].map(subject => (
                <div
                  key={subject}
                  onClick={() => toggleCategory(subject)}
                  className={`flex cursor-pointer items-center gap-2 rounded p-2 transition-colors
                ${expandedCategory === subject ? "bg-gray-100 dark:bg-gray-800" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
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
              ))}
            </div>

            {expandedCategory && (
              <>
                <div className="mt-1 border-b border-gray-200 px-2 py-1 text-xs font-medium text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  سطح
                </div>
                <div className="grid grid-cols-2 gap-2 p-2">
                  {["simple", "advanced"].map(level => {
                    const modelId = `${expandedCategory}-${level}` as LLMID
                    const isSelected = selectedModelId === modelId

                    return (
                      <div
                        key={level}
                        onClick={() => handleSelectModel(modelId)}
                        className={`
                        cursor-pointer rounded-xl border p-2 text-center text-sm
                        font-semibold text-gray-800 transition-all dark:text-white
                        ${
                          isSelected
                            ? `bg-gradient-to-r ${subjectData[expandedCategory as keyof typeof subjectData].gradient} text-white`
                            : "border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                        }`}
                      >
                        <span className="justify-right flex items-center gap-2">
                          {modelId === "math-simple" && (
                            <span className="text-lg">⚡</span>
                          )}
                          {modelId === "math-advanced" && (
                            <span className="text-lg">🧠</span>
                          )}
                          <span>
                            {customModelNames[modelId] ??
                              (level === "simple" ? "ساده" : "پیشرفته")}
                          </span>
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
