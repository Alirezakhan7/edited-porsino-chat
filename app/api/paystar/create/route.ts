import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  // گرفتن اطلاعات تراکنش از body ریکوئست (مثلاً فرانت می‌فرسته)
  const {
    amount,
    order_id,
    callback,
    name,
    phone,
    mail,
    description,
    wallet_hashid,
    national_code,
    card_number
  } = await req.json()

  // گرفتن کلیدها از env
  const gateway_id = process.env.PAYSTAR_GATEWAY_ID!
  const sign_key = process.env.PAYSTAR_SECRET_KEY!

  // ساخت امضا (sign)
  const sign_data = `${amount}#${order_id}#${callback}`
  const sign = crypto
    .createHmac("sha512", sign_key)
    .update(sign_data)
    .digest("hex")

  // ساخت دیتای نهایی (میتونی فیلدهای اختیاری رو حذف کنی)
  const data: any = {
    amount,
    order_id,
    callback,
    sign
  }
  if (name) data.name = name
  if (phone) data.phone = phone
  if (mail) data.mail = mail
  if (description) data.description = description
  if (wallet_hashid) data.wallet_hashid = wallet_hashid
  if (national_code) data.national_code = national_code
  if (card_number) data.card_number = card_number

  // ساخت هدر
  const headers = {
    Accept: "application/json",
    Authorization: "Bearer " + gateway_id,
    "Content-Type": "application/json"
  }

  try {
    // درخواست به پی‌استار (استفاده از fetch نیتیو)
    const resp = await fetch("https://core.paystar.ir/api/pardakht/create", {
      method: "POST",
      headers,
      body: JSON.stringify(data),
      cache: "no-store"
    })
    const result = await resp.json()

    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create transaction", detail: err },
      { status: 500 }
    )
  }
}
