// فایل: components/models/model-icon.tsx (نسخه کامل و اصلاح شده)

import { cn } from "@/lib/utils"
import mistral from "@/public/providers/mistral.png"
import groq from "@/public/providers/groq.png"
import perplexity from "@/public/providers/perplexity.png"
import { ModelProvider } from "@/types"
import { IconSparkles } from "@tabler/icons-react"
import { useTheme } from "next-themes"
import Image from "next/image"
import { forwardRef, HTMLAttributes } from "react"
import { AnthropicSVG } from "../icons/anthropic-svg"
import { GoogleSVG } from "../icons/google-svg"
import { OpenAISVG } from "../icons/openai-svg"

interface ModelIconProps extends HTMLAttributes<HTMLDivElement> {
  provider: ModelProvider
  height: number
  width: number
}

// ❗️ کامپوننت با forwardRef بازنویسی شده است
export const ModelIcon = forwardRef<HTMLDivElement, ModelIconProps>(
  ({ provider, height, width, ...props }, ref) => {
    const { theme } = useTheme()

    // ❗️ کل خروجی داخل یک div قرار گرفته تا ref را دریافت کند
    return (
      <div ref={ref} {...props}>
        {(() => {
          switch (provider as ModelProvider) {
            case "openai":
              return (
                <OpenAISVG
                  className={cn(
                    "rounded-sm bg-white p-1 text-black",
                    theme === "dark"
                      ? "bg-white"
                      : "border-DEFAULT border-black"
                  )}
                  width={width}
                  height={height}
                />
              )
            case "mistral":
              return (
                <Image
                  className={cn(
                    "rounded-sm p-1",
                    theme === "dark"
                      ? "bg-white"
                      : "border-DEFAULT border-black"
                  )}
                  src={mistral.src}
                  alt="Mistral"
                  width={width}
                  height={height}
                />
              )
            case "groq":
              return (
                <Image
                  className={cn(
                    "rounded-sm p-0",
                    theme === "dark"
                      ? "bg-white"
                      : "border-DEFAULT border-black"
                  )}
                  src={groq.src}
                  alt="Groq"
                  width={width}
                  height={height}
                />
              )
            case "anthropic":
              return (
                <AnthropicSVG
                  className={cn(
                    "rounded-sm bg-white p-1 text-black",
                    theme === "dark"
                      ? "bg-white"
                      : "border-DEFAULT border-black"
                  )}
                  width={width}
                  height={height}
                />
              )
            case "google":
              return (
                <GoogleSVG
                  className={cn(
                    "rounded-sm bg-white p-1 text-black",
                    theme === "dark"
                      ? "bg-white"
                      : "border-DEFAULT border-black"
                  )}
                  width={width}
                  height={height}
                />
              )
            case "perplexity":
              return (
                <Image
                  className={cn(
                    "rounded-sm p-1",
                    theme === "dark"
                      ? "bg-white"
                      : "border-DEFAULT border-black"
                  )}
                  src={perplexity.src}
                  alt="Perplexity" // Mistral -> Perplexity
                  width={width}
                  height={height}
                />
              )
            default:
              return <IconSparkles size={width} />
          }
        })()}
      </div>
    )
  }
)

// ❗️ این خط برای دیباگ کردن بهتر است
ModelIcon.displayName = "ModelIcon"
