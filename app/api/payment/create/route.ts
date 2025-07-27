import { NextResponse } from "next/server"
import crypto from "crypto"
import { PAYSTAR_BASE_URL, CALLBACK_URL } from "@/lib/paystar"

export async function POST(req: Request) {
  try {
    const { amount, order_id, callback_method = 1 } = await req.json()

    const signKey = process.env.PAYSTAR_SIGN_KEY as string
    const signData = `${amount}#${order_id}#${CALLBACK_URL}`
    const sign = crypto
      .createHmac("sha512", signKey)
      .update(signData)
      .digest("hex")

    const res = await fetch(`${PAYSTAR_BASE_URL}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${process.env.PAYSTAR_GATEWAY_ID}`
      },
      body: JSON.stringify({
        amount,
        order_id,
        callback: CALLBACK_URL,
        sign,
        callback_method
      })
    })

    const data = await res.json()
    if (!res.ok || data.status !== 1)
      return NextResponse.json(
        { message: data.message || "Paystar error" },
        { status: 400 }
      )

    return NextResponse.json({
      payment_url: `${PAYSTAR_BASE_URL}/payment?token=${data.data.token}`
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ message: "Internal error" }, { status: 500 })
  }
}
