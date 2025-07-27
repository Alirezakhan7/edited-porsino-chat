import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const data = await req.formData()

  // مقادیر مهم برگشتی از پی‌استار
  const status = data.get("status")
  const order_id = data.get("order_id")
  const ref_num = data.get("ref_num")
  const card_number = data.get("card_number")
  const tracking_code = data.get("tracking_code")

  // این خروجی فقط برای تست است (در عمل می‌تونی این مقادیر رو ذخیره کنی یا مستقیم برای verify استفاده کنی)
  return NextResponse.json({
    status,
    order_id,
    ref_num,
    card_number,
    tracking_code
  })
}
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const status = params.get("status")
  const order_id = params.get("order_id")
  const ref_num = params.get("ref_num")
  const card_number = params.get("card_number")
  const tracking_code = params.get("tracking_code")
  return NextResponse.json({
    status,
    order_id,
    ref_num,
    card_number,
    tracking_code
  })
}
