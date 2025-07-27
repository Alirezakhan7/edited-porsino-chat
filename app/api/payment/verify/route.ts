import { NextResponse } from "next/server"
import crypto from "crypto"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { PAYSTAR_BASE_URL } from "@/lib/paystar"

const VERIFY_URL = `${PAYSTAR_BASE_URL}/verify`

export async function POST(request: Request) {
  const body = await request.json()
  const { ref_num, order_id, card_number, tracking_code } = body
  if (!ref_num || !card_number || !tracking_code)
    return NextResponse.json(
      { message: "پارامترهای لازم ناقص است." },
      { status: 400 }
    )

  // --- fetch transaction from Supabase (اختیاری) ---
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const { data: trx } = await supabase
    .from("transactions")
    .select("*")
    .eq("order_id", order_id)
    .single()

  const amount = trx?.amount || 0 // یا از body دریافت کنید

  // --- HMAC sign ---
  const sign = crypto
    .createHmac("sha512", process.env.PAYSTAR_SIGN_KEY as string)
    .update(`${amount}#${ref_num}#${card_number}#${tracking_code}`)
    .digest("hex")

  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), 10_000)
  const res = await fetch(VERIFY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${process.env.PAYSTAR_GATEWAY_ID}`
    },
    body: JSON.stringify({ amount, ref_num, sign }),
    signal: controller.signal
  })
  clearTimeout(t)

  const data = await res.json()
  const ok = data.status === 1

  // --- update DB یا منطق دلخواه ---
  if (trx)
    await supabase
      .from("transactions")
      .update({ status: ok ? "success" : "failed" })
      .eq("id", trx.id)

  return NextResponse.json(
    { message: data.message },
    { status: ok ? 200 : 400 }
  )
}
