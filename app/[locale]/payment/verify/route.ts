import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server" // مسیر را چک کنید
import crypto from "crypto"

const PAYSTAR_API_BASE_URL = "https://core.paystar.ir/api/pardakht"

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    const { ref_num, card_number, tracking_code } = await request.json()

    // ۱. پیدا کردن تراکنش در دیتابیس
    const { data: transaction, error: findError } = await supabase
      .from("transactions")
      .select("*")
      .or(`ref_num.eq.${ref_num},order_id.eq.${ref_num}`) // In some cases ref_num from create (token) is used
      .single()

    if (findError || !transaction) throw new Error("تراکنش در سیستم یافت نشد.")
    if (transaction.status === "success") {
      return NextResponse.json({ message: "این تراکنش قبلا تایید شده است." })
    }

    // ۲. تایید تراکنش با پی‌استار
    const amount = transaction.amount
    const gatewayId = process.env.PAYSTAR_GATEWAY_ID!
    const secretKey = process.env.PAYSTAR_SECRET_KEY!
    const signString = `${amount}#${ref_num}#${card_number}#${tracking_code}`
    const sign = crypto
      .createHmac("sha512", secretKey)
      .update(signString)
      .digest("hex")

    const response = await fetch(`${PAYSTAR_API_BASE_URL}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${gatewayId}`
      },
      body: JSON.stringify({ ref_num, amount, sign })
    })

    const data = await response.json()
    if (data.status !== 1) {
      await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("id", transaction.id)
      return NextResponse.json({ message: data.message }, { status: 400 })
    }

    // ۳. به‌روزرسانی دیتابیس پس از تایید موفق
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // اشتراک ۳۰ روزه

    // آپدیت جدول profiles
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        subscription_status: "active",
        subscription_expires_at: expiresAt.toISOString()
      })
      .eq("user_id", transaction.user_id)

    if (profileError)
      throw new Error(`Error updating profile: ${profileError.message}`)

    // آپدیت جدول transactions
    await supabase
      .from("transactions")
      .update({ status: "success", verified_at: new Date().toISOString() })
      .eq("id", transaction.id)

    return NextResponse.json({
      message: "پرداخت شما با موفقیت تایید و اشتراک شما فعال شد."
    })
  } catch (error: any) {
    console.error("Verify Payment Error:", error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
