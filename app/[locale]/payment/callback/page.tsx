import { NextResponse } from "next/server"
import crypto from "crypto"
import { PAYSTAR_BASE_URL } from "@/lib/paystar"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const status = Number(url.searchParams.get("status"))
  const amount = Number(url.searchParams.get("payment_amount"))
  const ref_num = url.searchParams.get("ref_num")
  const card_number = url.searchParams.get("card_number")
  const tracking_code = url.searchParams.get("tracking_code")

  if (status !== 1 || !ref_num || !card_number || !tracking_code || !amount)
    return NextResponse.redirect(
      "https://chat.porsino.org/payment/result?fail=1"
    )

  const sign = crypto
    .createHmac("sha512", process.env.PAYSTAR_SIGN_KEY as string)
    .update(`${amount}#${ref_num}#${card_number}#${tracking_code}`)
    .digest("hex")

  const res = await fetch(`${PAYSTAR_BASE_URL}/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${process.env.PAYSTAR_GATEWAY_ID}`
    },
    body: JSON.stringify({ amount, ref_num, sign })
  })
  const data = await res.json()

  const target =
    data.status === 1
      ? "https://chat.porsino.org/payment/result?success=1"
      : "https://chat.porsino.org/payment/result?fail=2"
  return NextResponse.redirect(target)
}
