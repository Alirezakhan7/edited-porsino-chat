import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

// POST /api/paystar/verify
export async function POST(req: NextRequest) {
  // داده‌ها رو از Body بگیر (از Callback باید اینها رو جمع کنی!)
  const { amount, ref_num, card_number, tracking_code } = await req.json()

  // دریافت کلیدها از env
  const gateway_id = process.env.PAYSTAR_GATEWAY_ID!
  const sign_key = process.env.PAYSTAR_SECRET_KEY!

  // آماده سازی sign دقیقاً مشابه نمونه پایتون
  const sign_data = `${amount}#${ref_num}#${card_number}#${tracking_code}`
  const sign = crypto
    .createHmac("sha512", sign_key)
    .update(sign_data)
    .digest("hex")

  // ساختن data دقیقاً مثل نمونه پایتون
  const data = {
    amount,
    ref_num,
    sign
  }

  // ساختن header
  const headers = {
    Accept: "application/json",
    Authorization: "Bearer " + gateway_id,
    "Content-Type": "application/json"
  }

  try {
    // ارسال درخواست به پی‌استار
    const response = await fetch(
      "https://core.paystar.ir/api/pardakht/verify",
      {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        cache: "no-store"
      }
    )
    const result = await response.json()

    // خروجی دقیقاً مثل پایتون
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: "Verification failed", detail: error },
      { status: 500 }
    )
  }
}
