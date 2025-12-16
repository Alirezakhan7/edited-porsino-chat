import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { Database } from "@/supabase/types" // ایمپورت تایپ

// تابع باید async شود چون cookies در Next 16 پرامیس است
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>( // اضافه کردن جنریک Database
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // هندل کردن ارور در سرور کامپوننت‌ها
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: "", ...options })
          } catch (error) {
            // هندل کردن ارور
          }
        }
      }
    }
  )
}
