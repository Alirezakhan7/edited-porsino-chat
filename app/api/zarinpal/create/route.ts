import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { planId } = await req.json()

    if (!planId) {
      return NextResponse.json({ message: "پلن نامعتبر است." }, { status: 400 })
    }

    console.log("[Demo mode] zarinpal/create — mock payment URL")

    return NextResponse.json({
      payment_url: "/payment-result?status=success&message=حالت+دمو"
    })
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "خطای سرور" },
      { status: 500 }
    )
  }
}
