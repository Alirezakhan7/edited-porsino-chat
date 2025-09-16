// app/api/pardakht/callback/route.ts
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// در صورت نیاز می‌تونی برای محیط تست override کنی
const DP_CALLBACK =
  process.env.DIRECTPAY_CALLBACK_URL ||
  "https://api.directpay.click/api/pardakht/callback"

// --- GET: با همان querystring به DirectPay ریدایرکت می‌کنیم.
export async function GET(req: NextRequest) {
  const qs = req.nextUrl.searchParams.toString()
  const target = qs ? `${DP_CALLBACK}?${qs}` : DP_CALLBACK
  return NextResponse.redirect(target, { status: 302 })
}

// --- POST: فیلدهای فرم PSP را بدون دست‌کاری با HTML اتوسابمیت به DirectPay POST می‌کنیم.
export async function POST(req: NextRequest) {
  // Helper برای escape کردن مقدارها در HTML attribute
  const esc = (v: string) =>
    v.replace(
      /[&<>"']/g,
      m =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        })[m]!
    )

  const formData = await req.formData()

  // ورودی‌ها را عیناً hidden می‌سازیم (فایل‌ها نخواهیم داشت؛ اگر بود نادیده می‌گیریم)
  const inputs: string[] = []
  for (const [key, val] of formData.entries()) {
    if (typeof val === "string") {
      inputs.push(
        `<input type="hidden" name="${esc(key)}" value="${esc(val)}" />`
      )
    }
  }

  const html = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>در حال انتقال…</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body onload="document.forms[0].submit()" style="font-family: system-ui, sans-serif; margin:24px;">
  <p>در حال انتقال به درگاه تأیید…</p>
  <form method="post" action="${esc(DP_CALLBACK)}">
    ${inputs.join("\n")}
    <noscript><button type="submit">ادامه</button></noscript>
  </form>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate"
    }
  })
}
