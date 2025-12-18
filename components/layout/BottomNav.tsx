"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  IconMessage,
  IconLayoutGrid,
  IconUpload,
  IconSparkles,
  IconUser
} from "@tabler/icons-react"

export const navItems = [
  { href: "/chat", label: "چت", icon: IconMessage },
  { href: "/path", label: "مسیر درسی", icon: IconLayoutGrid },
  { href: "/upload", label: "آپلود", icon: IconUpload },
  { href: "/counselor", label: "مشاور", icon: IconSparkles },
  { href: "/profile", label: "پروفایل", icon: IconUser }
]

export function BottomNav({ className = "" }: { className?: string }) {
  const pathname = usePathname()

  return (
    <nav className={className}>
      <div className="mx-auto grid h-full max-w-lg grid-cols-5">
        {navItems.map(item => {
          const isActive =
            item.href === "/chat"
              ? pathname.startsWith("/chat")
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`hover:bg-muted/50 inline-flex flex-col items-center justify-center px-2 ${
                isActive ? "text-primary" : "text-muted-foreground"
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
