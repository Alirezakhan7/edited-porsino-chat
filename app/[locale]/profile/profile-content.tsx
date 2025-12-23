// app/[locale]/profile/profile-content.tsx
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Database } from "@/supabase/types"
import ProfileClient from "./profile-client"

export default async function ProfileContent({ locale }: { locale: string }) {
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

  const {
    data: { session }
  } = await supabase.auth.getSession()

  if (!session) {
    redirect(`/${locale}/login`)
  }

  // دریافت پروفایل مستقیماً از دیتابیس
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", session.user.id)
    .single()

  if (!profile) {
    return <div>خطا در بارگذاری پروفایل</div>
  }

  return <ProfileClient initialProfile={profile} />
}
