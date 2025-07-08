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

const SIDEBAR_ICON_SIZE = 22 // Define the size if it's not imported

// Your initial announcements data
const initialAnnouncementsData: Omit<Announcement, "read">[] = [
  {
    id: "v0.13",
    title: "بروزرسانی نسخه v0.13",
    content: "پشتیبانی از استریم برای پاسخ‌ها و بهبود Agent دسته‌بندی.",
    date: "2025-07-07"
  },
  {
    id: "form-discount",
    title: "۵۰٪ تخفیف برای کاربران اولیه",
    content: "با پر کردن فرم ثبت‌نام، به مدت یک‌سال کد تخفیف دریافت کنید.",
    date: "2025-07-06",
    link: "https://docs.google.com/forms/d/e/1FAIpQLSfYtegINbTbweUImTQRDuQIygS7Qzzo0I0LJ-jlKJzsWxte_A/viewform?usp=header"
  },

  {
    id: "bio-simple-model",
    title: "مدل زیست‌شناسی ساده",
    content: "در فاز تست، فقط مدل bio-simple برای پاسخ‌دهی فعال است.",
    date: "2025-07-05"
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

    // Combine initial data with stored data
    const updatedAnnouncements = initialAnnouncementsData.map(initialAnn => {
      const storedAnn = storedAnnouncements.find(sa => sa.id === initialAnn.id)
      return storedAnn
        ? storedAnn // If found in storage, use its read status
        : { ...initialAnn, read: false } // Otherwise, it's a new, unread announcement
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

  const openModal = (url: string) => {
    setModalUrl(url)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setModalUrl("")
  }

  // ... (The rest of your component logic: markAllAsUnread, etc.)

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <div className="group relative cursor-pointer">
            <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-2 shadow-lg transition-all duration-300 hover:scale-105 hover:from-slate-100 hover:to-slate-200 hover:shadow-xl dark:from-slate-800 dark:to-slate-900 dark:hover:from-slate-700 dark:hover:to-slate-800">
              <IconSpeakerphone
                size={SIDEBAR_ICON_SIZE}
                className="text-slate-600 transition-colors duration-300 group-hover:text-blue-600 dark:text-slate-300 dark:group-hover:text-blue-400"
              />
            </div>
            {unreadCount > 0 && (
              <div className="absolute -right-1 -top-1 flex size-5 animate-pulse items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-[10px] font-bold text-white shadow-lg">
                {unreadCount}
              </div>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="rtl mb-2 w-80 rounded-2xl border-0 bg-white/95 p-0 shadow-2xl backdrop-blur-xl dark:bg-slate-900/95"
          side="top"
          align="end"
        >
          <div className="rounded-t-2xl bg-gradient-to-r from-blue-500 to-purple-600 p-4">
            <div className="flex flex-row-reverse items-center justify-between">
              <div
                className="flex items-center gap-2 text-lg font-bold text-white"
                dir="rtl"
              >
                <IconSpeakerphone size={20} />
                اطلاعیه‌ها
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  className="h-auto rounded-xl p-2 text-white transition-all duration-200 hover:bg-white/20"
                  onClick={markAllAsRead}
                >
                  خواندم
                </Button>
              )}
            </div>
          </div>

          <div className="p-4">
            <div
              className="scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 max-h-96 space-y-3 overflow-y-auto"
              dir="rtl"
            >
              {announcements.length > 0 ? (
                announcements.map((a: Announcement) => (
                  <div
                    key={a.id}
                    className={`group relative overflow-hidden rounded-xl border border-slate-200 p-4 transition-all duration-300 hover:shadow-lg dark:border-slate-700 ${
                      !a.read
                        ? "border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 dark:border-blue-800 dark:from-blue-950/30 dark:to-purple-950/30"
                        : "dark:hover:bg-slate-750 bg-white hover:bg-slate-50 dark:bg-slate-800"
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {a.title}
                      </div>

                      <div className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                        {a.date}
                      </div>
                    </div>
                    <div className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {a.content}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className={`h-8 rounded-lg text-xs font-medium transition-all duration-200 ${
                          a.read
                            ? "cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
                            : "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:scale-105 hover:from-green-600 hover:to-emerald-600 hover:shadow-xl"
                        }`}
                        size="sm"
                        onClick={() => markAsRead(a.id)}
                        disabled={a.read}
                      >
                        {a.read ? "خوانده شده" : "خوانده شد"}
                      </Button>

                      {a.link && (
                        <Button
                          variant="outline"
                          className="h-8 rounded-lg border-slate-300 text-xs font-medium transition-all duration-200 hover:scale-105 hover:border-transparent hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white dark:border-slate-600"
                          size="sm"
                          onClick={() => openModal(a.link!)}
                        >
                          بیشتر...
                          <IconExternalLink className="mr-1" size={14} />
                        </Button>
                      )}
                    </div>

                    {!a.read && (
                      <div className="absolute right-2 top-2 size-2 animate-pulse rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <div className="mb-2 text-slate-400 dark:text-slate-500">
                    <IconSpeakerphone
                      size={48}
                      className="mx-auto opacity-50"
                    />
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    هیچ اطلاعیه جدیدی وجود ندارد.
                  </div>
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          ></div>
          <div className="relative z-10 mx-4 max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-blue-500 to-purple-600 p-4 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-white">مشاهده محتوا</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeModal}
                className="rounded-xl text-white hover:bg-white/20"
              >
                <IconX size={20} />
              </Button>
            </div>
            <div className="h-[70vh]">
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
