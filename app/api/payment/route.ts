import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server" // مسیر را چک کنید
import crypto from "crypto"

const PAYSTAR_API_BASE_URL = "https://core.paystar.ir/api/pardakht"

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { message: "کاربر شناسایی نشد." },
        { status: 401 }
      )
    }

    const { amount, order_id } = await request.json()

    // ۱. ایجاد رکورد تراکنش در دیتابیس
    const { error: dbError } = await supabase.from("transactions").insert({
      user_id: user.id,
      order_id: order_id,
      amount: amount,
      status: "pending"
    })

    if (dbError) throw new Error(`Supabase Error: ${dbError.message}`)

    // ۲. ارتباط با پی‌استار
    const gatewayId = process.env.PAYSTAR_GATEWAY_ID!
    const secretKey = process.env.PAYSTAR_SECRET_KEY!
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`

    const signString = `${amount}#${order_id}#${callbackUrl}`
    const sign = crypto
      .createHmac("sha512", secretKey)
      .update(signString)
      .digest("hex")

    const response = await fetch(`${PAYSTAR_API_BASE_URL}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${gatewayId}`
      },
      body: JSON.stringify({ amount, order_id, callback: callbackUrl, sign })
    })

    const data = await response.json()
    if (data.status !== 1) {
      await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("order_id", order_id)
      return NextResponse.json({ message: data.message }, { status: 400 })
    }

    // ۳. ذخیره ref_num و بازگرداندن URL درگاه
    await supabase
      .from("transactions")
      .update({ ref_num: data.data.token })
      .eq("order_id", order_id)

    const paymentUrl = `${PAYSTAR_API_BASE_URL}/payment?token=${data.data.token}`
    return NextResponse.json({ payment_url: paymentUrl })
  } catch (error: any) {
    console.error("Create Payment Error:", error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
