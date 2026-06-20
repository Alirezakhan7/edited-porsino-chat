import { createMockSupabaseClient } from "@/lib/mock/supabase-client"

export async function createClient() {
  return createMockSupabaseClient()
}
