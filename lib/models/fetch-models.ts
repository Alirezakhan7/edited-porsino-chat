import { Tables } from "@/supabase/types"
import { LLM, OpenRouterLLM } from "@/types"

// این تابع قبلاً مدل‌های آنلاین را می‌گرفت. الان فقط یک خروجی خالی استاندارد می‌دهد.
export const fetchHostedModels = async (profile: Tables<"profiles">) => {
  return {
    envKeyMap: {},
    hostedModels: [] as LLM[]
  }
}

// این تابع برای مدل‌های لوکال (Ollama) بود. خنثی شد.
export const fetchOllamaModels = async () => {
  return [] as LLM[]
}

// این تابع برای OpenRouter بود. خنثی شد.
export const fetchOpenRouterModels = async () => {
  return [] as OpenRouterLLM[]
}
