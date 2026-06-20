"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/chat")
  }, [router])

  return (
    <div className="text-muted-foreground flex h-screen w-full items-center justify-center">
      ... در حال انتقال
    </div>
  )
}
