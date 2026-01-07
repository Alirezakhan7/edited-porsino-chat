import { NextResponse } from "next/server"

// لیست کدها فقط اینجا هستند و کاربر آنها را نمی‌بیند
const serverDiscountCodes: Record<
  string,
  { percent?: number; amount?: number }
> = {
  SUMMER99: { percent: 99 }
  // "NORUZ1403": { amount: 50000 } // مثال
}

export async function POST(req: Request) {
  try {
    const { code } = await req.json()

    if (!code) {
      return NextResponse.json(
        { valid: false, message: "کد وارد نشده است" },
        { status: 400 }
      )
    }

    const normalizedCode = code.trim().toUpperCase()
    const discount = serverDiscountCodes[normalizedCode]

    if (discount) {
      // اگر کد معتبر بود، نوع و مقدار آن را برمی‌گردانیم
      return NextResponse.json({
        valid: true,
        type: discount.percent ? "percent" : "amount",
        value: discount.percent || discount.amount
      })
    } else {
      return NextResponse.json(
        { valid: false, message: "کد تخفیف نامعتبر است" },
        { status: 404 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { valid: false, message: "خطای سرور" },
      { status: 500 }
    )
  }
}
