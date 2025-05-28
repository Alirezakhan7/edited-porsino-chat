"use client"

import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { ChatInput } from "@/components/chat/chat-input"
import { ChatSettings } from "@/components/chat/chat-settings"
import { ChatUI } from "@/components/chat/chat-ui"
import { Brand } from "@/components/ui/brand"
import { ChatbotUIContext } from "@/context/context"
import useHotkey from "@/lib/hooks/use-hotkey"
import { useTheme } from "next-themes"
import { useContext } from "react"
import { ProfileSettings } from "@/components/utility/profile-settings"
import { IconUser } from "@tabler/icons-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

export default function ChatPage() {
  useHotkey("o", () => handleNewChat())
  useHotkey("l", () => {
    handleFocusChatInput()
  })

  const { chatMessages } = useContext(ChatbotUIContext)
  const [openNotice1, setOpenNotice1] = useState(false)
  const [openNotice2, setOpenNotice2] = useState(false)
  const [openVersionDialog, setOpenVersionDialog] = useState(false)

  const { handleNewChat, handleFocusChatInput } = useChatHandler()

  const { theme } = useTheme()

  return (
    <>
      {chatMessages.length === 0 ? (
        <div className="relative flex h-full flex-col items-center justify-center">
          <div className="rtl absolute left-1/2 top-20 w-full max-w-[600px] -translate-x-1/2 space-y-3 px-4 text-center text-sm sm:top-4">
            <div
              className="inline-block cursor-pointer rounded-md bg-green-100 px-4 py-2 text-green-900 transition hover:bg-green-200"
              onClick={() => setOpenNotice1(true)}
            >
              <strong>اطلاعیه ۱</strong> : فعلاً در فاز تست هستیم و فقط مدل
              زیست‌شناسی ساده فعال می‌باشد
            </div>

            <div
              className="inline-block cursor-pointer rounded-md bg-blue-100 px-4 py-2 text-blue-900 transition hover:bg-blue-200"
              onClick={() => setOpenNotice2(true)}
            >
              <strong>اطلاعیه ۲</strong> : با پر کردن این فرم به مدت یک‌سال ۵۰٪
              تخفیف بگیرید
            </div>
          </div>

          {/* برند وسط صفحه */}
          <div className="top-50% left-50% -translate-x-50% -translate-y-50% absolute mb-20">
            <Brand theme={theme === "dark" ? "dark" : "light"} />
            <div
              onClick={() => setOpenVersionDialog(true)}
              className="text-muted-foreground mt-2 cursor-pointer text-center text-base font-semibold hover:underline"
              title="مشاهده تاریخچه نسخه‌ها"
            >
              Porsino AI v 0.13
            </div>
          </div>

          {/* تنظیمات کاربر در بالا چپ */}
          <div className="absolute left-4 top-2">
            <ProfileSettings />
          </div>

          {/* تنظیمات مدل در بالا راست */}
          <div className="absolute right-2 top-2">
            <ChatSettings />
          </div>

          <div className="flex grow flex-col items-center justify-center" />

          <div className="w-full min-w-[300px] items-end px-2 pb-3 pt-0 sm:w-[600px] sm:pb-8 sm:pt-5 md:w-[700px] lg:w-[700px] xl:w-[800px]">
            <ChatInput />
          </div>
        </div>
      ) : (
        <ChatUI />
      )}
      {/* پاپ‌آپ اطلاعیه ۱ */}
      <Dialog open={openNotice1} onOpenChange={setOpenNotice1}>
        <DialogContent className="rtl max-w-[90%] text-right sm:max-w-md">
          <DialogTitle>⚠️ اطلاعیه ۱</DialogTitle>
          <p>
            در حال حاضر فقط مدل زیست‌شناسی ساده با شناسه{" "}
            <code className="ltr inline-block px-1">bio-simple</code> فعال
            می‌باشد
          </p>
        </DialogContent>
      </Dialog>

      <Dialog open={openNotice2} onOpenChange={setOpenNotice2}>
        <DialogContent className="rtl max-w-[90%] text-right sm:max-w-md">
          <DialogTitle>🎁 اطلاعیه ۲</DialogTitle>

          <p>
            تا زمان انتشار نسخه اصلی پرسینو، تمام افرادی که فرم زیر را پر کنند و
            از پرسینو استفاده نمایند، به محض انتشار نسخه نهایی از کد تخفیف{" "}
            <strong>۵۰٪</strong> به مدت یک‌سال بهره‌مند خواهند شد.
          </p>

          <div className="mt-4 text-center">
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfYtegINbTbweUImTQRDuQIygS7Qzzo0I0LJ-jlKJzsWxte_A/viewform?usp=header" // ← این لینک رو جایگزین کن
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline transition hover:text-blue-800"
            >
              رفتن به فرم ثبت‌نام
            </a>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={openVersionDialog} onOpenChange={setOpenVersionDialog}>
        <DialogContent className="rtl max-w-[90%] text-right sm:max-w-lg">
          <DialogTitle>📦 تاریخچه نسخه‌ها</DialogTitle>
          <div className="space-y-4 text-sm leading-6">
            <div>
              <strong className="text-blue-600">v0.13</strong>
              <ul
                className="text-muted-foreground mt-1 list-disc pr-4"
                dir="rtl"
              >
                <li dir="auto">افزودن محدودیت توکن و پیام خطا در استریم</li>
                <li dir="auto">پشتیبانی از استریم برای پاسخ‌های هوش مصنوعی</li>
                <li dir="auto">بهبود دسته‌بندی سوالات با Agent جدید</li>
              </ul>
            </div>
            <div>
              <strong className="text-blue-600">v0.12</strong>
              <ul
                className="text-muted-foreground mt-1 list-disc pr-4"
                dir="rtl"
              >
                <li dir="auto">افزایش دقت مدل زیست‌شناسی در پاسخ‌دهی</li>
                <li dir="auto">ارتقاء ساختار حافظه با LangGraph</li>
              </ul>
            </div>
            <div>
              <strong className="text-blue-600">v0.11</strong>
              <ul
                className="text-muted-foreground mt-1 list-disc pr-4"
                dir="rtl"
              >
                <li dir="auto">افزودن دسته‌بندی مشاوره‌ای (emotional)</li>
                <li dir="auto">ساختار جدید ورودی مدل با context</li>
              </ul>
            </div>
            <div>
              <strong className="text-blue-600">v0.10</strong>
              <ul
                className="text-muted-foreground mt-1 list-disc pr-4"
                dir="rtl"
              >
                <li dir="auto">اولین نسخه MVP فقط با مدل زیست‌شناسی ساده</li>
                <li dir="auto">
                  پاسخ‌دهی مستقیم با استفاده از context بدون حافظه
                </li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
