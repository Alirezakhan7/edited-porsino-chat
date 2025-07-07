"use client"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { Announcement } from "@/types/announcement"
import { IconExternalLink, IconSpeakerphone } from "@tabler/icons-react"
import { FC, useEffect, useState } from "react"

const SIDEBAR_ICON_SIZE = 22 // Define the size if it's not imported

// Your initial announcements data
const initialAnnouncementsData: Omit<Announcement, "read">[] = [
  {
    id: "v0.13",
    title: "بروزرسانی نسخه v0.13",
    content: "پشتیبانی از استریم برای پاسخ‌ها و بهبود Agent دسته‌بندی.",
    date: "2025-07-07",
    link: "https://porsino.ir/changelog" // Example link
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

  // ... (The rest of your component logic: markAllAsUnread, etc.)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="relative cursor-pointer hover:opacity-50">
          <IconSpeakerphone size={SIDEBAR_ICON_SIZE} />
          {unreadCount > 0 && (
            <div className="notification-indicator absolute right-[-4px] top-[-4px] flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {unreadCount}
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="rtl mb-2 w-80" side="top" align="end">
        <div className="grid gap-4">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="text-lg font-bold leading-none">اطلاعیه‌ها</div>
              {unreadCount > 0 && (
                <Button
                  variant="link"
                  className="h-auto p-0"
                  onClick={markAllAsRead}
                >
                  خواندم
                </Button>
              )}
            </div>

            <div className="grid max-h-96 space-y-4 overflow-y-auto">
              {announcements.length > 0 ? (
                announcements.map((a: Announcement) => (
                  <div
                    key={a.id}
                    className={`block select-none rounded-md border p-3 ${!a.read ? "bg-muted/50" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium leading-none">
                        {a.title}
                      </div>
                      <div className="text-muted-foreground text-xs leading-snug">
                        {a.date}
                      </div>
                    </div>
                    <div className="text-muted-foreground mt-3 text-sm leading-snug">
                      {a.content}
                    </div>

                    <div className="mt-3 space-x-2">
                      <Button
                        className="h-[26px] text-xs"
                        size="sm"
                        onClick={() => markAsRead(a.id)}
                        disabled={a.read}
                      >
                        خوانده شد
                      </Button>

                      {a.link && (
                        <a href={a.link} target="_blank" rel="noreferrer">
                          <Button
                            variant="outline"
                            className="h-[26px] text-xs"
                            size="sm"
                          >
                            بیشتر...
                            <IconExternalLink className="mr-1" size={14} />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground p-4 text-center text-sm">
                  هیچ اطلاعیه جدیدی وجود ندارد.
                </div>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
