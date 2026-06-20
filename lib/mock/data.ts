import type { Tables } from "@/supabase/types"

export const IS_DEMO_MODE = true

export const MOCK_USER_ID = "11111111-1111-1111-1111-111111111111"
export const MOCK_PROFILE_ID = "22222222-2222-2222-2222-222222222222"
export const MOCK_WORKSPACE_ID = "33333333-3333-3333-3333-333333333333"

const now = new Date().toISOString()

export const MOCK_USER = {
  id: MOCK_USER_ID,
  aud: "authenticated",
  role: "authenticated",
  email: "demo@porsino.ir",
  email_confirmed_at: now,
  phone: "",
  confirmed_at: now,
  last_sign_in_at: now,
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: { display_name: "کاربر دمو" },
  identities: [],
  created_at: now,
  updated_at: now
}

export const MOCK_SESSION = {
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: "bearer",
  user: MOCK_USER
}

export const MOCK_PROFILE: Tables<"profiles"> = {
  id: MOCK_PROFILE_ID,
  user_id: MOCK_USER_ID,
  username: "demo_user",
  display_name: "کاربر دمو",
  full_name: "کاربر دمو",
  bio: "حساب نمایشی — بدون اتصال به پایگاه داده",
  image_path: "",
  image_url: "",
  profile_context: "",
  has_onboarded: true,
  use_azure_openai: false,
  created_at: now,
  updated_at: now,
  anthropic_api_key: null,
  azure_openai_35_turbo_id: null,
  azure_openai_45_turbo_id: null,
  azure_openai_45_vision_id: null,
  azure_openai_api_key: null,
  azure_openai_embeddings_id: null,
  azure_openai_endpoint: null,
  google_gemini_api_key: null,
  groq_api_key: null,
  mistral_api_key: null,
  openai_api_key: null,
  openai_organization_id: null,
  openrouter_api_key: null,
  perplexity_api_key: null,
  subscription_expires_at: null,
  subscription_status: "active",
  user_grade: "12",
  user_profile: null,
  referral_code: "DEMO01",
  referred_by: null,
  wallet_balance: 0
}

export const MOCK_WORKSPACE: Tables<"workspaces"> = {
  id: MOCK_WORKSPACE_ID,
  user_id: MOCK_USER_ID,
  name: "فضای کاری دمو",
  description: "نسخه نمایشی بدون Supabase",
  instructions: "You are a friendly, helpful AI assistant.",
  default_model: "bio-simple",
  default_prompt: "You are a friendly, helpful AI assistant.",
  default_temperature: 0.5,
  default_context_length: 4096,
  include_profile_context: true,
  include_workspace_instructions: true,
  image_path: "",
  is_home: true,
  sharing: "private",
  created_at: now,
  updated_at: now
}

export const MOCK_ASSISTANTS: Tables<"assistants">[] = [
  {
    id: "44444444-4444-4444-4444-444444444444",
    user_id: MOCK_USER_ID,
    name: "دستیار زیست",
    description: "دستیار تخصصی زیست‌شناسی کنکور",
    prompt: "You are a biology tutor for Iranian university entrance exam.",
    model: "bio-simple",
    temperature: 0.5,
    context_length: 4096,
    include_profile_context: true,
    include_workspace_instructions: true,
    image_path: "",
    folder_id: null,
    sharing: "private",
    created_at: now,
    updated_at: now
  }
]

export const MOCK_CHATS: Tables<"chats">[] = [
  {
    id: "55555555-5555-5555-5555-555555555555",
    user_id: MOCK_USER_ID,
    workspace_id: MOCK_WORKSPACE_ID,
    name: "گفتگوی نمونه",
    model: "bio-simple",
    prompt: "You are a friendly, helpful AI assistant.",
    temperature: 0.5,
    context_length: 4096,
    include_profile_context: true,
    include_workspace_instructions: true,
    assistant_id: null,
    chat_id: null,
    folder_id: null,
    sharing: "private",
    created_at: now,
    updated_at: now
  }
]

export const MOCK_FOLDERS: Tables<"folders">[] = [
  {
    id: "66666666-6666-6666-6666-666666666666",
    user_id: MOCK_USER_ID,
    workspace_id: MOCK_WORKSPACE_ID,
    name: "پوشه نمونه",
    description: "",
    type: "chats",
    created_at: now,
    updated_at: now
  }
]

export function createEmptyStore(): Record<string, unknown[]> {
  return {
    profiles: [{ ...MOCK_PROFILE, mobile: "09123456789" }],
    workspaces: [{ ...MOCK_WORKSPACE }],
    assistants: MOCK_ASSISTANTS.map(a => ({ ...a })),
    chats: MOCK_CHATS.map(c => ({ ...c })),
    folders: MOCK_FOLDERS.map(f => ({ ...f })),
    collections: [],
    files: [],
    presets: [],
    prompts: [],
    tools: [],
    models: [],
    messages: [],
    file_items: [],
    user_progress: [],
    activity_logs: [],
    flashcard_mistakes: [],
    lesson_contents: [],
    lessons: [],
    otp_codes: [],
    starshop_tokens: [{ id: 1, api_key: "mock", refresh_token: "mock" }]
  }
}
