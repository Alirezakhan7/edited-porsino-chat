import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server" // مسیر را متناسب با پروژه خود تنظیم کنید
import crypto from "crypto"

const PAYSTAR_API_BASE_URL = "https://core.paystar.ir/api/pardakht"

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    // ۱. دریافت کاربر لاگین کرده از سوپابیس
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { message: "دسترسی غیرمجاز. لطفا ابتدا وارد شوید." },
        { status: 401 }
      )
    }

    const { amount, order_id } = await request.json()

    // ۲. ایجاد رکورد تراکنش اولیه در دیتابیس با وضعیت 'pending'
    const { error: dbError } = await supabase.from("transactions").insert({
      user_id: user.id,
      order_id: order_id,
      amount: amount,
      status: "pending"
    })

    if (dbError) {
      console.error("Supabase insert error:", dbError)
      throw new Error("خطا در ثبت اولیه تراکنش در دیتابیس.")
    }

    // ۳. آماده‌سازی و ارسال درخواست به پی‌استار برای ایجاد تراکنش
    const gatewayId = process.env.PAYSTAR_GATEWAY_ID!
    const secretKey = process.env.PAYSTAR_SECRET_KEY!
    const callbackUrl = "https://porsino.org"

    const signString = `${amount}#${order_id}#${callbackUrl}`
    const sign = crypto
      .createHmac("sha512", secretKey)
      .update(signString)
      .digest("hex")

    // 🔍 لاگ‌های تستی برای دیباگ
    console.log("📌 gatewayId:", gatewayId)
    console.log("📌 signString:", signString)
    console.log("📌 sign:", sign)
    console.log("📌 callbackUrl:", callbackUrl)
    console.log("📌 amount:", amount)
    console.log("📌 order_id:", order_id)

    const response = await fetch(`${PAYSTAR_API_BASE_URL}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${gatewayId}`
      },
      body: JSON.stringify({
        amount: Number(amount),
        order_id,
        callback: callbackUrl,
        sign
      })
    })

    const data = await response.json()
    console.log("Paystar response:", data)
    // ۴. مدیریت پاسخ پی‌استار
    if (data.status !== 1) {
      // اگر پی‌استار خطا داد، وضعیت تراکنش را در دیتابیس خودمان 'failed' می‌کنیم
      await supabase
        .from("transactions")
        .update({ status: "failed" })
        .eq("order_id", order_id)
      return NextResponse.json(
        { message: `خطای درگاه: ${data.message}` },
        { status: 400 }
      )
    }

    // ۵. ذخیره توکن دریافتی در دیتابیس و ارسال URL به کلاینت
    await supabase
      .from("transactions")
      .update({ ref_num: data.data.token })
      .eq("order_id", order_id)

    const paymentUrl = `${PAYSTAR_API_BASE_URL}/payment?token=${data.data.token}`
    return NextResponse.json({ payment_url: paymentUrl })
  } catch (error: any) {
    console.error("[PAYMENT_CREATE_ERROR]", error)
    return NextResponse.json(
      { message: error.message || "خطای داخلی سرور" },
      { status: 500 }
    )
  }
}
