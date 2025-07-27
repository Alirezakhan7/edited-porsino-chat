import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

const url = "https://core.paystar.ir/api/pardakht/verify"

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    const { ref_num, order_id, card_number, tracking_code } =
      await request.json()

    const getTrx = await supabase
      .from("transactions")
      .select("*")
      .eq("order_id", order_id)
      .single()

    if (getTrx.error || !getTrx.data) {
      throw new Error(`تراکنش با شناسه ${order_id} پیدا نشد.`)
    }

    const amount = getTrx.data.amount

    const gateway_id = process.env.PAYSTAR_GATEWAY_ID!
    const sign_key = process.env.PAYSTAR_SECRET_KEY!

    const sign_data = `${amount}#${ref_num}#${card_number}#${tracking_code}`
    const sign = crypto
      .createHmac("sha512", sign_key)
      .update(sign_data)
      .digest("hex")

    const header = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: "Bearer " + gateway_id
    }

    const data = {
      amount,
      ref_num,
      sign
    }

    const response = await fetch(url, {
      method: "POST",
      headers: header,
      body: JSON.stringify(data)
    })

    const result = await response.json()
    console.log("Paystar Verify Response:", result)

    if (result.status !== 1) {
      await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("id", getTrx.data.id)

      return NextResponse.json(
        { message: `تراکنش تایید نشد: ${result.message}` },
        { status: 400 }
      )
    }

    const expires_at = new Date()
    expires_at.setDate(expires_at.getDate() + 30)

    const updateProfile = await supabase
      .from("profiles")
      .update({
        subscription_status: "active",
        subscription_expires_at: expires_at.toISOString()
      })
      .eq("user_id", getTrx.data.user_id)

    if (updateProfile.error) {
      console.error("[CRITICAL_PROFILE_UPDATE_ERROR]", updateProfile.error)
      throw new Error(
        "اشکال در فعال‌سازی اشتراک. لطفاً با پشتیبانی تماس بگیرید."
      )
    }

    await supabase
      .from("transactions")
      .update({
        status: "success",
        verified_at: new Date().toISOString()
      })
      .eq("id", getTrx.data.id)

    return NextResponse.json({
      message: "پرداخت تایید و اشتراک با موفقیت فعال شد."
    })
  } catch (error: any) {
    console.error("[VERIFY_ERROR]", error)
    return NextResponse.json(
      { message: error.message || "خطای داخلی سرور در تأیید تراکنش" },
      { status: 500 }
    )
  }
}
