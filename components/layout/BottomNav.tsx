"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useMediaQuery } from "@/lib/hooks/use-media-query"
import {
  IconMessage,
  IconLayoutGrid,
  IconUpload,
  IconSparkles,
  IconUser
} from "@tabler/icons-react"

const navItems = [
  { href: "/chat", label: "چت", icon: IconMessage },
  { href: "/path", label: "مسیر درسی", icon: IconLayoutGrid },
  { href: "/upload", label: "آپلود", icon: IconUpload },
  { href: "/counselor", label: "مشاور", icon: IconSparkles },
  { href: "/profile", label: "پروفایل", icon: IconUser }
]

export function BottomNav() {
  const pathname = usePathname()
  const isMobile = useMediaQuery("(max-width: 768px)")

  // اگر در دسکتاپ بود، این کامپوننت اصلاً رندر نشه
  if (!isMobile) {
    return null
  }

  return (
    <nav className="bg-background/95 fixed inset-x-0 bottom-0 z-40 h-16 border-t backdrop-blur-sm md:hidden">
      <div className="mx-auto grid h-full max-w-lg grid-cols-5">
        {navItems.map(item => {
          // چک می‌کنیم که آیا لینک فعلی، صفحه فعال هست یا نه
          // برای /chat که صفحه اصلیه، چک می‌کنیم که آیا pathname با /chat شروع می‌شه
          const isActive =
            item.href === "/chat"
              ? pathname.startsWith("/chat")
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`hover:bg-muted/50 inline-flex flex-col items-center justify-center px-2 ${
                isActive
                  ? "text-primary" // رنگ فعال
                  : "text-muted-foreground" // رنگ غیرفعال
              }`}
            >
              <item.icon className="size-6" stroke={isActive ? 2 : 1.5} />
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
