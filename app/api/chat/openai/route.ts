import { ServerRuntime } from "next"

export const runtime: ServerRuntime = "nodejs" // موقتاً nodejs برای اینکه Edge محدودیت ایجاد نکند

export async function POST() {
  return new Response(
    JSON.stringify({
      message:
        "This endpoint has been disabled. Please remove/replace calls to /api/chat/openai."
    }),
    { status: 410, headers: { "content-type": "application/json" } }
  )
}
