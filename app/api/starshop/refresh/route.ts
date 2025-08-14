// app/api/starshop/refresh/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

type RefreshOk = {
  status: "ok"
  data: { api_key: string; refresh_token: string; expires_at: string }
}

async function runRefresh() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supa = createClient(supabaseUrl, supabaseServiceKey)

  // توکن فعلی را از DB بخوان؛ اگر نبود از ENV بردار
  const { data: row } = await supa
    .from("starshop_tokens")
    .select("api_key, refresh_token")
    .eq("id", 1)
    .maybeSingle()

  const currentApiKey = row?.api_key || process.env.STARSHOP_API_KEY!
  const currentRefreshToken =
    row?.refresh_token || process.env.STARSHOP_REFRESH_TOKEN!

  // فراخوانی رفرش StarShop
  const res = await fetch("https://coreshop.paystar.shop/api/api-key", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // هر دو را می‌فرستیم تا با هر دو تفسیرِ مستند سازگار باشد
    body: JSON.stringify({
      api_key: currentApiKey,
      refresh_token: currentRefreshToken
    })
  })

  const json = (await res.json()) as RefreshOk
  if (json.status !== "ok") {
    throw new Error("StarShop refresh failed")
  }

  const { api_key, refresh_token, expires_at } = json.data

  // ذخیره در Supabase
  await supa
    .from("starshop_tokens")
    .upsert({ id: 1, api_key, refresh_token, expires_at }, { onConflict: "id" })

  return json.data
}

function checkAuth(req: NextRequest) {
  const incoming = req.headers.get("authorization") || ""
  const expected = `Bearer ${process.env.CRON_SECRET}`
  return incoming === expected
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return new NextResponse("Unauthorized", { status: 401 })
  try {
    const data = await runRefresh()
    return NextResponse.json({ ok: true, data })
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return new NextResponse("Unauthorized", { status: 401 })
  try {
    const data = await runRefresh()
    return NextResponse.json({ ok: true, data })
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
  }
}
