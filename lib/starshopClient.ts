// lib/starshopClient.ts
type RefreshOk = {
  status: "ok"
  data: { api_key: string; refresh_token: string; expires_at: string }
}

const BASE = process.env.STARSHOP_BASE_URL!

async function loadTokens() {
  // از Supabase سرور-ساید بخوان (service role یا RPC ساده)
  // اینجا pseudo-code است؛ بر اساس set-up خودت اتصال بده.
  const res = await fetch(
    process.env.SUPABASE_EDGE_FUNC_URL! + "/get-starshop-tokens",
    { method: "POST" }
  )
  const json = await res.json()
  return json as { api_key: string; refresh_token: string; expires_at?: string }
}

async function saveTokens(t: {
  api_key: string
  refresh_token: string
  expires_at: string
}) {
  await fetch(process.env.SUPABASE_EDGE_FUNC_URL! + "/set-starshop-tokens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(t)
  })
}

function nearExpiry(expires_at?: string, padMin = 30) {
  if (!expires_at) return false
  const exp = new Date(expires_at.replace(" ", "T") + "Z").getTime()
  return exp - Date.now() < padMin * 60_000
}

export async function starshopAuthFetch(
  path: string,
  init: RequestInit = {},
  retry = true
) {
  let { api_key, refresh_token, expires_at } = await loadTokens()

  if (nearExpiry(expires_at)) {
    ;({ api_key, refresh_token, expires_at } = await refreshApiKey(
      api_key,
      refresh_token
    ))
  }

  const headers = new Headers(init.headers || {})
  headers.set("Authorization", `Bearer ${api_key}`)
  headers.set("Accept", "application/json")

  const res = await fetch(`${BASE}${path}`, { ...init, headers })

  if ((res.status === 401 || res.status === 403) && retry) {
    ;({ api_key } = await refreshApiKey(api_key, refresh_token))
    headers.set("Authorization", `Bearer ${api_key}`)
    return fetch(`${BASE}${path}`, { ...init, headers })
  }
  return res
}

export async function refreshApiKey(
  currentApiKey?: string,
  refreshToken?: string
) {
  const body: any = {}
  if (currentApiKey) body.api_key = currentApiKey
  if (refreshToken) body.refresh_token = refreshToken

  const res = await fetch(`${BASE}/api-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
  const json = (await res.json()) as RefreshOk
  if (json.status !== "ok") throw new Error("StarShop refresh failed")

  await saveTokens(json.data)
  return json.data
}
