"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  IconSend,
  IconPhoto,
  IconLogin,
  IconUserPlus,
  IconSettings
} from "@tabler/icons-react"
import { toast } from "sonner"

export default function ChatMockPage() {
  const [inputValue, setInputValue] = useState("")
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.error("برای ارسال پیام ابتدا باید ثبت‌نام کنید.")
  }

  const handleUploadClick = () => {
    toast.error("برای آپلود تصویر ابتدا باید ثبت‌نام کنید.")
  }

  // تشخیص حالت سیستم و اعمال کلاس مناسب به body
  useEffect(() => {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches
    document.body.classList.add(prefersDark ? "dark" : "light")
  }, [])

  return (
    <div className="bg-muted/50 relative flex h-screen w-full flex-col text-black transition-colors dark:text-white">
      {/* دکمه‌های ورود و ثبت‌نام بالا چپ */}
      <div className="absolute left-4 top-4 flex gap-2 rounded-xl bg-white/10 p-1 shadow backdrop-blur-sm dark:bg-white/10">
        <button
          onClick={() => router.push("/login")}
          className="flex items-center gap-1 rounded-md px-3 py-1 text-sm font-semibold transition hover:bg-white/20"
        >
          <IconLogin className="size-4" /> ورود
        </button>
        <button
          onClick={() => router.push("/login")}
          className="flex items-center gap-1 rounded-md px-3 py-1 text-sm font-semibold transition hover:bg-white/20"
        >
          <IconUserPlus className="size-4" /> ثبت‌نام
        </button>
      </div>

      {/* دکمه تنظیمات بالا راست */}
      <div className="absolute right-4 top-4">
        <button
          className="rounded-full p-2 transition hover:bg-white/10"
          title="تنظیمات مدل"
        >
          <IconSettings className="size-6" />
        </button>
      </div>

      {/* محتوا */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 ">
        <h1 className="mb-6 text-center  text-3xl font-bold">
          !از پرسینو بپرس
        </h1>

        <form
          onSubmit={handleSubmit}
          className="relative z-10 flex w-full max-w-[700px] items-center gap-2 rounded-2xl border border-gray-800 bg-[#5D5D5D] px-5 py-4 shadow-lg"
        >
          <div
            onClick={handleUploadClick}
            className="cursor-pointer rounded-md p-2 transition hover:bg-gray-300"
            title="آپلود تصویر"
          >
            <IconPhoto className="size-6 text-white" />
          </div>

          <textarea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="...سوال خود را بپرسید"
            className="grow resize-none rounded-md bg-[#5D5D5D] px-3 py-2 text-right text-white placeholder:text-white/70 focus:outline-none"
            rows={1}
          />

          <button
            type="submit"
            className="rounded-md bg-white p-2 text-black transition hover:bg-gray-200"
            title="ارسال پیام"
          >
            <IconSend className="size-5" />
          </button>
        </form>
      </div>
    </div>
  )
}
