"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import ChatMockPage from "./chat-mock-page"

export default function RootPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const { data: homeWorkspace } = await supabase
          .from("workspaces")
          .select("id")
          .eq("user_id", data.session.user.id)
          .eq("is_home", true)
          .single()

        if (homeWorkspace?.id) {
          router.replace("/chat")
        }
      }

      setChecking(false)
    })
  }, [router])

  // نمایش لودینگ در زمان چک کردن session
  if (checking) {
    return (
      <div className="text-muted-foreground flex h-screen w-full items-center justify-center">
        ... در حال انتقال
      </div>
    )
  }

  return <ChatMockPage />
}
