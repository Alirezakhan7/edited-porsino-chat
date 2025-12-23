import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    // ما تمام منطق پردازش فایل و امبدینگ سمت نکست را حذف کردیم
    // چون شما از VPS استفاده می‌کنید و پکیج‌های سنگین را پاک کردید.

    return new NextResponse(
      "File uploaded successfully (No embedding generated)",
      {
        status: 200
      }
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500
    })
  }
}
