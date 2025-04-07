"use client"

import { IconCirclePlus, IconSend } from "@tabler/icons-react"
import { useRef, useState } from "react"
import { Input } from "../ui/input"
import { TextareaAutosize } from "../ui/textarea-autosize"
import { toast } from "sonner"

export const ChatInput = () => {
  const [userInput, setUserInput] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSendMockMessage = () => {
    if (!userInput.trim()) return
    toast.error("ابتدا باید ثبت‌نام کنید.")
    setUserInput("")
  }

  return (
    <div className="border-input relative mt-3 flex min-h-[60px] w-full items-center justify-center rounded-xl border-2">
      {/* آیکون افزودن فایل */}
      <IconCirclePlus
        className="absolute bottom-[12px] left-3 cursor-pointer p-1 hover:opacity-50"
        size={32}
        onClick={() => fileInputRef.current?.click()}
      />

      {/* input مخفی برای انتخاب فایل */}
      <Input
        ref={fileInputRef}
        className="hidden"
        type="file"
        onChange={() => toast.error("ابتدا باید ثبت‌نام کنید.")}
        accept="*"
      />

      {/* باکس نوشتن پیام */}
      <TextareaAutosize
        className="ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring text-md flex w-full resize-none rounded-md border-none bg-transparent px-14 py-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        placeholder="سؤالتو بنویس... (فعلاً باید ثبت‌نام کنی)"
        value={userInput}
        onValueChange={setUserInput}
        minRows={1}
        maxRows={18}
        onKeyDown={e => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSendMockMessage()
          }
        }}
      />

      {/* آیکون ارسال */}
      <div className="absolute bottom-[14px] right-3 cursor-pointer hover:opacity-50">
        <IconSend
          className="bg-primary text-secondary rounded p-1"
          onClick={handleSendMockMessage}
          size={30}
        />
      </div>
    </div>
  )
}
