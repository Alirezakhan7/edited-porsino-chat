// app/[locale]/path/path-content.tsx

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Database } from "@/supabase/types"
import PathClient from "./path-client"

export default async function PathContent({ locale }: { locale: string }) {
  const cookieStore = await cookies()

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

  // نکته مهم: ما اینجا فقط getUser می‌کنیم چون layout قبلاً سشن را چک کرده
  // اما برای اطمینان و گرفتن ID نیاز است.
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: progressData } = await supabase
    .from("user_progress")
    .select("chapter_id, completed_steps")
    .eq("user_id", user.id)

  const userStepsMap: Record<string, number> = {}
  if (progressData) {
    progressData.forEach((item: any) => {
      if (item.chapter_id && typeof item.completed_steps === "number") {
        userStepsMap[item.chapter_id] = item.completed_steps
      }
    })
  }

  return <PathClient locale={locale} initialUserSteps={userStepsMap} />
}
