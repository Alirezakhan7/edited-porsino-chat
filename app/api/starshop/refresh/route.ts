// app/api/starshop/refresh/route.ts
import { NextRequest, NextResponse } from "next/server"

function checkAuth(req: NextRequest) {
  const incoming = req.headers.get("authorization") || ""
  const expected = `Bearer ${process.env.CRON_SECRET}`
  return incoming === expected
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return new NextResponse("Unauthorized", { status: 401 })

  return NextResponse.json({
    ok: true,
    data: {
      api_key: "mock-api-key",
      refresh_token: "mock-refresh-token",
      expires_at: new Date(Date.now() + 86400000).toISOString()
    }
  })
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return new NextResponse("Unauthorized", { status: 401 })

  return NextResponse.json({
    ok: true,
    data: {
      api_key: "mock-api-key",
      refresh_token: "mock-refresh-token",
      expires_at: new Date(Date.now() + 86400000).toISOString()
    }
  })
}
