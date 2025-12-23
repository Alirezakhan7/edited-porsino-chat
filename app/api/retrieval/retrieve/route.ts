import { NextResponse } from "next/server"
export async function POST() {
  return new NextResponse("Retrieval disabled", { status: 200 })
}
