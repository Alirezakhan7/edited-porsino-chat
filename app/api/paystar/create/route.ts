import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  // 1. گرفتن اطلاعات تراکنش از body
  const body = await req.json()
  console.log("[paystar-create] body received:", body)

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
  } = body

  // 2. گرفتن کلیدها از env
  const gateway_id = process.env.PAYSTAR_GATEWAY_ID
  const sign_key = process.env.PAYSTAR_SECRET_KEY
  console.log("[paystar-create] env loaded:", {
    gateway_idExists: !!gateway_id,
    sign_keyExists: !!sign_key,
    gateway_idFirst6: gateway_id?.slice(0, 6) || null,
    sign_keyLength: sign_key?.length || null
  })

  // 3. ساخت امضا (sign)
  const sign_data = `${amount}#${order_id}#${callback}`
  const sign = sign_key
    ? crypto.createHmac("sha512", sign_key).update(sign_data).digest("hex")
    : null
  console.log("[paystar-create] sign_data:", sign_data)
  console.log("[paystar-create] sign:", sign)

  // 4. ساخت دیتای نهایی
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
  console.log("[paystar-create] data to send:", data)

  // 5. ساخت هدر
  const headers = {
    Accept: "application/json",
    Authorization: "Bearer " + gateway_id,
    "Content-Type": "application/json"
  }
  console.log("[paystar-create] headers to send:", headers)

  // 6. ارسال درخواست به پی‌استار
  try {
    const resp = await fetch("https://api.paystar.shop/api/pardakht/create", {
      method: "POST",
      headers,
      body: JSON.stringify(data),
      cache: "no-store"
    })

    // کد و متن اولیه پاسخ
    console.log(
      "[paystar-create] paystar status:",
      resp.status,
      resp.statusText
    )

    let text = await resp.text()
    try {
      const json = JSON.parse(text)
      console.log("[paystar-create] paystar json:", json)
      return NextResponse.json(json)
    } catch (e) {
      console.log("[paystar-create] paystar non-json response:", text)
      return NextResponse.json(
        { error: "Paystar response is not JSON", text },
        { status: 500 }
      )
    }
  } catch (err) {
    console.log("[paystar-create] error:", err)
    return NextResponse.json(
      { error: "Failed to create transaction", detail: err },
      { status: 500 }
    )
  }
}
