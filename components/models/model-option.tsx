import { LLM } from "@/types"
import { FC } from "react"
import { WithTooltip } from "../ui/with-tooltip"

interface ModelOptionProps {
  model: LLM
  onSelect: () => void
  isSelected?: boolean
}

export const ModelOption: FC<ModelOptionProps> = ({
  model,
  onSelect,
  isSelected
}) => {
  return (
    <WithTooltip
      display={
        <div>
          {model.provider !== "ollama" && model.pricing && (
            <div className="space-y-1 text-xs">
              <div>
                <span className="font-semibold">هزینه ورودی:</span>{" "}
                {model.pricing?.inputCost} {model.pricing?.currency} per{" "}
                {model.pricing?.unit}
              </div>
              {model.pricing?.outputCost && (
                <div>
                  <span className="font-semibold">هزینه خروجی:</span>{" "}
                  {model.pricing?.outputCost} {model.pricing?.currency} per{" "}
                  {model.pricing?.unit}
                </div>
              )}
            </div>
          )}
        </div>
      }
      side="bottom"
      trigger={
        <div
          className={`
            flex w-full cursor-pointer flex-col items-center justify-center
            rounded-xl border border-white/10 bg-white/10 px-4
            py-2 text-center shadow-md backdrop-blur-md transition-all
            duration-200 hover:scale-[1.02] hover:bg-white/20 dark:bg-white/5
            ${isSelected ? "ring-2 ring-blue-400 dark:ring-blue-300" : ""}
          `}
          onClick={onSelect}
        >
          <div className="text-sm font-semibold text-white">
            {model.modelName}
          </div>
        </div>
      }
    />
  )
}
