import { createClient } from "@/lib/supabase/middleware"
import { i18nRouter } from "next-i18n-router"
import { NextResponse, type NextRequest } from "next/server"
import i18nConfig from "./i18nConfig"

export async function middleware(request: NextRequest) {
  // 1. هندل کردن i18n (زبان سایت)
  const i18nResult = i18nRouter(request, i18nConfig)
  
  // اگر i18n ریدایرکت لازم داشت، سریع برگردان و ادامه نده
  if (i18nResult) return i18nResult

  try {
    // 2. ایجاد کلاینت Supabase فقط برای مدیریت کوکی‌ها
    // (اینجا دیگه کوئری به دیتابیس نمی‌زنیم)
    const { supabase, response } = createClient(request)

    // این خط فقط سشن را در کوکی رفرش می‌کند تا کاربر لاگ‌اوت نشود.
    // نکته مهم: از getUser استفاده می‌کنیم که امن‌تر و سریع‌تر از getSession در میدل‌ور است
    await supabase.auth.getUser()

    return response
  } catch (e) {
    // اگر هر خطایی پیش آمد، صفحه را خراب نکن و اجازه بده باز شود
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
}

export const config = {
  // این مچر فایل‌های استاتیک (عکس، فونت و...) را نادیده می‌گیرد
  // تا میدل‌ور روی آن‌ها اجرا نشود و سرعت دانلودشان بالا برود
  matcher: [
       "/((?!api|_next/static|_next/image|favicon.ico|fonts|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|otf|eot)$).*)",
  ],
}