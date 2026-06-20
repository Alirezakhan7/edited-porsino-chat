export const runtime = "edge"

export async function POST(request: Request) {
  const json = await request.json()
  const { username } = json as { username: string }

  return new Response(JSON.stringify({ isAvailable: true }), {
    status: 200
  })
}
