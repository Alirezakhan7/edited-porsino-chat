import { NextResponse, type NextRequest } from "next/server"

export const createClient = (request: NextRequest) => {
  return {
    supabase: null,
    response: NextResponse.next({
      request: {
        headers: request.headers
      }
    })
  }
}
