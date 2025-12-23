import { NextResponse } from "next/server"

// این روت دیگر کار نمی‌کند چون پکیج OpenAI حذف شده است.
// ما فقط یک آرایه خالی برمی‌گردانیم تا فرانت‌اند ارور ندهد.

export const runtime = "edge"

export async function GET() {
  return new NextResponse(JSON.stringify({ assistants: [] }), {
    status: 200
  })
}
