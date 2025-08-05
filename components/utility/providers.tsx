// در فایل: providers.tsx

"use client"

import { ChatbotUIProvider } from "@/context/context-provider" // <-- این خط را اضافه کنید
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { ThemeProviderProps } from "next-themes/dist/types"
import { FC } from "react"

export const Providers: FC<ThemeProviderProps> = ({ children, ...props }) => {
  return (
    <NextThemesProvider {...props}>
      <TooltipProvider>
        {/* کل برنامه را درون پرووایدر خودمان قرار می‌دهیم */}
        <ChatbotUIProvider>{children}</ChatbotUIProvider>
      </TooltipProvider>
    </NextThemesProvider>
  )
}
