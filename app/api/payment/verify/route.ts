// =============================
// 1) app/api/payment/verify/route.ts
// =============================
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"
import { PAYSTAR_BASE_URL } from "@/lib/paystar"

const VERIFY_URL = `${PAYSTAR_BASE_URL}/verify`

export async function POST(request: Request) {
  // نخست: فقط یک بار بدنهٔ درخواست را بخوانید
  const body = await request.json()
  const { ref_num, order_id, card_number, tracking_code } = body

  // بررسی کامل بودن اطلاعات لازم برای امضا
  if (!ref_num || !card_number || !tracking_code) {
    return NextResponse.json(
      { message: "پارامترهای لازم برای ساخت امضا ناقص است." },
      { status: 400 }
    )
  }

  // دیتابیس سوپابیس
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // واکشی تراکنش مربوطه
  const { data: transaction, error: trxError } = await supabase
    .from("transactions")
    .select("*")
    .eq("order_id", order_id)
    .single()

  if (trxError || !transaction) {
    return NextResponse.json(
      { message: `تراکنش با شناسه ${order_id} پیدا نشد.` },
      { status: 404 }
    )
  }

  // اگر قبلاً تأیید شده باشد تکرار نمی‌کنیم
  if (transaction.status === "success") {
    return NextResponse.json({ message: "این تراکنش قبلاً تایید شده است." })
  }

  const amount = transaction.amount
  const gatewayId = process.env.PAYSTAR_GATEWAY_ID!
  const secretKey = process.env.PAYSTAR_SECRET_KEY!

  // ساخت رشتهٔ امضا دقیقاً طبق مستند
  const signString = `${amount}#${ref_num}#${card_number}#${tracking_code}`
  const sign = crypto
    .createHmac("sha512", secretKey)
    .update(signString)
    .digest("hex")

  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${gatewayId}`
  }

  const verifyBody = JSON.stringify({ amount, ref_num, sign })

  // Timeout ده‌ثانیه‌ای طبق توصیهٔ پی‌استار
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)

  let paystarResponse
  try {
    paystarResponse = await fetch(VERIFY_URL, {
      method: "POST",
      headers,
      body: verifyBody,
      signal: controller.signal
    })
  } finally {
    clearTimeout(timer)
  }

  const verifyResult = await paystarResponse.json()

  if (verifyResult.status !== 1) {
    // عدم تأیید → به‌روزرسانی دیتابیس
    await supabase
      .from("transactions")
      .update({ status: "failed" })
      .eq("id", transaction.id)

    return NextResponse.json(
      { message: `تراکنش تایید نشد: ${verifyResult.message}` },
      { status: 400 }
    )
  }

  // موفقیت → فعال‌سازی اشتراک کاربر
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  await supabase
    .from("profiles")
    .update({
      subscription_status: "active",
      subscription_expires_at: expiresAt.toISOString()
    })
    .eq("user_id", transaction.user_id)

  await supabase
    .from("transactions")
    .update({ status: "success", verified_at: new Date().toISOString() })
    .eq("id", transaction.id)

  return NextResponse.json({
    message: "پرداخت تایید شد و اشتراک فعال گردید."
  })
}
