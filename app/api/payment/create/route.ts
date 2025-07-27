import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

const url = "https://core.paystar.ir/api/pardakht/verify"

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    // 🟡 دریافت پارامترهای ورودی از callback
    const { ref_num, order_id, card_number, tracking_code } =
      await request.json()
    console.log("🟡 [INPUT] ref_num:", ref_num)
    console.log("🟡 [INPUT] order_id:", order_id)
    console.log("🟡 [INPUT] card_number:", card_number)
    console.log("🟡 [INPUT] tracking_code:", tracking_code)

    // 🔍 واکشی اطلاعات تراکنش از دیتابیس
    const getTrx = await supabase
      .from("transactions")
      .select("*")
      .eq("order_id", order_id)
      .single()

    if (getTrx.error || !getTrx.data) {
      console.error("🔴 [DB] Transaction not found:", order_id)
      throw new Error(`تراکنش با شناسه ${order_id} پیدا نشد.`)
    }

    const amount = getTrx.data.amount
    console.log("🧾 [DB] Transaction amount:", amount)

    // 🔐 آماده‌سازی مقادیر رمزنگاری و امضای تراکنش
    const gateway_id = process.env.PAYSTAR_GATEWAY_ID!
    const sign_key = process.env.PAYSTAR_SECRET_KEY!
    console.log("🔑 [CONFIG] Gateway ID:", gateway_id)
    console.log("🔑 [CONFIG] Sign Key Length:", sign_key.length)

    const sign_data = `${amount}#${ref_num}#${card_number}#${tracking_code}`
    console.log("✍️ [SIGN] sign_data string:", sign_data)

    const sign = crypto
      .createHmac("sha512", sign_key)
      .update(sign_data)
      .digest("hex")

    console.log("🧾 [SIGN] Final HMAC Sign:", sign)

    // 📤 آماده‌سازی داده‌های ارسال به پی‌استار
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

    console.log("📦 [VERIFY_REQUEST] Body:", data)
    console.log("📦 [VERIFY_REQUEST] Headers:", header)

    // ⏳ ارسال درخواست تأیید به پی‌استار
    const response = await fetch(url, {
      method: "POST",
      headers: header,
      body: JSON.stringify(data)
    })

    const result = await response.json()
    console.log("✅ [VERIFY_RESPONSE] Paystar Response:", result)

    // ❌ بررسی خطا در پاسخ پی‌استار
    if (result.status !== 1) {
      console.warn("⚠️ [VERIFY_FAIL] Paystar error:", result.message)
      await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("id", getTrx.data.id)

      return NextResponse.json(
        { message: `تراکنش تایید نشد: ${result.message}` },
        { status: 400 }
      )
    }

    // 🟢 بروزرسانی اطلاعات اشتراک کاربر
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

    console.log("🎉 [PROFILE] اشتراک کاربر با موفقیت فعال شد")

    // ✅ ثبت نهایی تأیید تراکنش
    await supabase
      .from("transactions")
      .update({
        status: "success",
        verified_at: new Date().toISOString()
      })
      .eq("id", getTrx.data.id)

    console.log("🏁 [TRANSACTION] تراکنش نهایی شد")

    return NextResponse.json({
      message: "پرداخت تایید و اشتراک با موفقیت فعال شد."
    })
  } catch (error: any) {
    console.error("💥 [VERIFY_ERROR]", error)
    return NextResponse.json(
      { message: error.message || "خطای داخلی سرور در تأیید تراکنش" },
      { status: 500 }
    )
  }
}
