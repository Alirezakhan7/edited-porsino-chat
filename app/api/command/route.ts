import { NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(request: Request) {
  // این روت غیرفعال شده چون پکیج OpenAI حذف شده است
  return new NextResponse(
    JSON.stringify({
      content: "OpenAI integration is disabled in this version."
    }),
    {
      status: 200
    }
  )
}
