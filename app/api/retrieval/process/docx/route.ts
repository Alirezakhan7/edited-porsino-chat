import { NextResponse } from "next/server"
export async function POST() {
  return new NextResponse("Docx processing disabled", { status: 200 })
}
