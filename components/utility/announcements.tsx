"use client"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { Announcement } from "@/types/announcement"
import { IconExternalLink, IconSpeakerphone, IconX } from "@tabler/icons-react"
import { FC, useEffect, useState } from "react"

const SIDEBAR_ICON_SIZE = 22

// داده‌های جدید طبق درخواست شما
const initialAnnouncementsData: Omit<Announcement, "read">[] = [
  {
    id: "v0.9-update",
    title: "بروزرسانی نسخه 0.9",
    content: "کتاب درسی زیست شناسی به سیستم اضافه شد.",
    date: "2025-07-08"
  },
  {
    id: "form-discount-25",
    title: "۲۵٪ تخفیف برای کاربران اولیه",
    content: "با پر کردن فرم ثبت‌نام، کد تخفیف ویژه دریافت کنید.",
    date: "2025-07-06",
    link: "https://docs.google.com/forms/d/e/1FAIpQLSfYtegINbTbweUImTQRDuQIygS7Qzzo0I0LJ-jlKJzsWxte_A/viewform?usp=header"
  }
]

export const Announcements: FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalUrl, setModalUrl] = useState("")

  useEffect(() => {
    const storedAnnouncementsRaw = localStorage.getItem("announcements")
    const storedAnnouncements: Announcement[] = storedAnnouncementsRaw
      ? JSON.parse(storedAnnouncementsRaw)
      : []

    const updatedAnnouncements = initialAnnouncementsData.map(initialAnn => {
      const storedAnn = storedAnnouncements.find(sa => sa.id === initialAnn.id)
      return storedAnn ? storedAnn : { ...initialAnn, read: false }
    })

    setAnnouncements(updatedAnnouncements)
  }, [])

  const saveToStorage = (items: Announcement[]) => {
    localStorage.setItem("announcements", JSON.stringify(items))
  }

  const unreadCount = announcements.filter(a => !a.read).length

  const markAsRead = (id: string) => {
    const updated = announcements.map(a =>
      a.id === id ? { ...a, read: true } : a
    )
    setAnnouncements(updated)
    saveToStorage(updated)
  }

  const markAllAsRead = () => {
    const updated = announcements.map(a => ({ ...a, read: true }))
    setAnnouncements(updated)
    saveToStorage(updated)
  }

  // ✅ تغییر ۱: تابعی برای مدیریت باز و بسته شدن منو
  const handleOpenChange = (open: boolean) => {
    // وقتی منو بسته می‌شود (!open)، همه پیام‌ها را خوانده شده تلقی کن
    if (!open && unreadCount > 0) {
      markAllAsRead()
    }
  }

  const openModal = (url: string) => {
    setModalUrl(url)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setModalUrl("")
  }

  return (
    <>
      {/* ✅ تغییر ۱: اضافه کردن onOpenChange به Popover */}
      <Popover onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <div className="group relative cursor-pointer">
            {/* ✅ تغییر ۲: حذف گرادیانت و ساده‌سازی دکمه زنگ */}
            <div className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition-all duration-300 hover:bg-slate-50 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-blue-400">
              <IconSpeakerphone size={SIDEBAR_ICON_SIZE} stroke={1.5} />
            </div>
            {unreadCount > 0 && (
              <div className="absolute -right-1 -top-1 flex size-4 animate-bounce items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm">
                {unreadCount}
              </div>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="rtl mb-2 w-80 rounded-xl border border-slate-200 bg-white p-0 shadow-xl dark:border-slate-800 dark:bg-slate-950"
          side="top"
          align="end"
        >
          {/* ✅ تغییر ۲: هدر ساده و بدون گرادیانت */}
          <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-900">
            <div
              className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100"
              dir="rtl"
            >
              <IconSpeakerphone size={18} className="text-blue-600" />
              اطلاعیه‌ها
            </div>
            {unreadCount > 0 && (
              <span className="text-xs text-slate-400">
                {unreadCount} پیام جدید
              </span>
            )}
          </div>

          <div className="p-0">
            <div
              className="scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 max-h-96 overflow-y-auto"
              dir="rtl"
            >
              {announcements.length > 0 ? (
                announcements.map((a: Announcement) => (
                  <div
                    key={a.id}
                    className={`group relative border-b border-slate-50 p-4 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-900 dark:hover:bg-slate-900/50 ${
                      !a.read ? "bg-blue-50/40 dark:bg-blue-900/10" : ""
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {/* نقطه آبی برای پیام‌های خوانده نشده */}
                        {!a.read && (
                          <div className="size-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
                        )}
                        <div
                          className={`text-sm font-medium ${
                            !a.read
                              ? "text-slate-900 dark:text-white"
                              : "text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {a.title}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {a.date}
                      </span>
                    </div>

                    <div className="mb-4 pr-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {a.content}
                    </div>

                    <div className="flex gap-2 pr-4">
                      {/* ✅ تغییر ۲: دکمه‌های ساده و مینیمال */}
                      {!a.read && (
                        <Button
                          className="h-7 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-600 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsRead(a.id)}
                        >
                          خواندم
                        </Button>
                      )}

                      {a.link && (
                        <Button
                          variant="outline"
                          className="h-7 rounded-md border-blue-100 bg-blue-50 px-3 text-xs text-blue-600 hover:bg-blue-100 hover:text-blue-700 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                          size="sm"
                          onClick={() => openModal(a.link!)}
                        >
                          مشاهده
                          <IconExternalLink className="mr-1" size={12} />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <div className="mb-3 text-slate-300 dark:text-slate-700">
                    <IconSpeakerphone
                      size={40}
                      className="mx-auto"
                      stroke={1}
                    />
                  </div>
                  <div className="text-xs text-slate-400">
                    هیچ اطلاعیه‌ای وجود ندارد
                  </div>
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Modal - طراحی ساده‌تر */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm dark:bg-black/60"
            onClick={closeModal}
          ></div>
          <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                جزئیات
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeModal}
                className="size-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <IconX size={18} />
              </Button>
            </div>
            <div className="h-[70vh] bg-slate-50 dark:bg-slate-950">
              <iframe
                src={modalUrl}
                className="size-full"
                frameBorder="0"
                title="Modal Content"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
