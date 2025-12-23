// app/[locale]/chat/layout.tsx

import AppShell from "@/components/layout/AppShell"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Database } from "@/supabase/types"

export default async function ChatLayout({
  children
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()

  // 1. ساخت کلاینت سوپابیس سمت سرور
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        }
      }
    }
  )

  // 2. چک کردن سشن کاربر
  const {
    data: { session }
  } = await supabase.auth.getSession()

  if (!session) {
    return redirect("/login")
  }

  // 3. گرفتن اطلاعات ورک‌اسپیس همینجا (سمت سرور)
  // این کار باعث میشه وقتی صفحه به کاربر میرسه، دیتا توش باشه
  const { data: homeWorkspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("user_id", session.user.id)
    .eq("is_home", true)
    .single()

  if (!homeWorkspace) {
    return redirect("/setup")
  }

  // 4. پاس دادن دیتا به AppShell به عنوان Props
  return <AppShell workspaceData={homeWorkspace}>{children}</AppShell>
}
