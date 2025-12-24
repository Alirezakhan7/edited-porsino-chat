import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Database } from "@/supabase/types"
import ProfileClient from "./profile-client"

// ✅ تعریف اینترفیس‌های محلی برای حل مشکل تایپ‌اسکریپت
interface TokenUsageData {
  limit_tokens: number | null
  used_tokens: number | null
}

interface ActivityLog {
  created_at: string | null
  is_correct: boolean | null
}

// تابع کمکی محاسبه روزهای متوالی
function calculateStreak(logs: { created_at: string | null }[]) {
  if (!logs || logs.length === 0) return 0

  const uniqueDates = Array.from(
    new Set(
      logs
        .filter(log => log.created_at)
        .map(log => new Date(log.created_at!).toISOString().split("T")[0])
    )
  )
    .sort()
    .reverse()

  if (uniqueDates.length === 0) return 0

  const today = new Date().toISOString().split("T")[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]

  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
    return 0
  }

  let streak = 1
  for (let i = 1; i < uniqueDates.length; i++) {
    const currentDate = new Date(uniqueDates[i - 1])
    const prevDate = new Date(uniqueDates[i])

    // اختلاف زمانی را حساب می‌کنیم
    const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      streak++
    } else {
      break
    }
  }
  return streak
}

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

  // دریافت پروفایل
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", session.user.id)
    .single()

  if (!profile) {
    return <div>خطا در بارگذاری پروفایل</div>
  }

  // اجرای همزمان درخواست‌ها
  // ما از Promise.all استفاده می‌کنیم ولی خروجی را دستی کست (Cast) می‌کنیم
  const [
    tokenUsageResult,
    leitnerCountResult,
    chatCountResult,
    activityLogsResult
  ] = await Promise.all([
    supabase
      .from("token_usage")
      .select("limit_tokens, used_tokens")
      .eq("user_email", session.user.email!)
      .maybeSingle(),

    supabase
      .from("leitner_box")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id),

    supabase
      .from("chats")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id),

    supabase
      .from("activity_logs")
      .select("created_at, is_correct")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
  ])

  // --- پردازش داده‌ها با استفاده از اینترفیس‌های محلی ---

  // 1. پردازش لاگ‌ها (رفع ارور is_correct)
  // با "as ActivityLog[]" به TS اطمینان می‌دهیم که ساختار دیتا درست است
  const logs = (activityLogsResult.data || []) as ActivityLog[]

  const streakDays = calculateStreak(logs)
  const testsCompleted = logs.length

  const correctAnswers = logs.filter(l => l.is_correct === true).length
  const accuracy =
    testsCompleted > 0 ? Math.round((correctAnswers / testsCompleted) * 100) : 0

  // 2. پردازش توکن‌ها (رفع ارور limit_tokens و used_tokens)
  const tokenData = tokenUsageResult.data as TokenUsageData | null

  const tokenLimit = tokenData?.limit_tokens ?? 10000
  const tokenUsed = tokenData?.used_tokens ?? 0

  const stats = {
    testsCompleted,
    streakDays,
    accuracy,
    flashcardsCount: leitnerCountResult.count || 0,
    chatsCount: chatCountResult.count || 0,
    tokenLimit,
    tokenUsed
  }

  return <ProfileClient initialProfile={profile} stats={stats} />
}
