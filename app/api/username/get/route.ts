export const runtime = "edge"

export async function POST(request: Request) {
  const json = await request.json()
  const { userId: _userId } = json as { userId: string }

  return new Response(JSON.stringify({ username: "demo_user" }), {
    status: 200
  })
}
