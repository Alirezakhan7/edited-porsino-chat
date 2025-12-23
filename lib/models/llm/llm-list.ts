import { LLM } from "@/types"

// ما تمام ایمپورت‌های اضافی (OpenAI, Google, etc) را حذف کردیم
// فقط مدل‌های اختصاصی شما باقی می‌مانند

export const LLM_LIST: LLM[] = [
  {
    modelId: "bio-simple",
    modelName: "Biology Simple",
    provider: "custom",
    hostedId: "bio-simple",
    platformLink: "",
    imageInput: false // اگر مدل شما عکس قبول می‌کند این را true کنید
  },
  {
    modelId: "math-advanced",
    modelName: "Math advanced",
    provider: "custom",
    hostedId: "math-advanced",
    platformLink: "",
    imageInput: false
  },
  {
    modelId: "math-simple",
    modelName: "Math simple",
    provider: "custom",
    hostedId: "math-simple",
    platformLink: "",
    imageInput: false
  },
  {
    modelId: "phys-simple",
    modelName: "Phys simple",
    provider: "custom",
    hostedId: "phys-simple",
    platformLink: "",
    imageInput: false
  },
  {
    modelId: "phys-advanced",
    modelName: "Phys advanced",
    provider: "custom",
    hostedId: "phys-advanced",
    platformLink: "",
    imageInput: false
  }
]

// این مپ را خالی می‌گذاریم چون دیگر دسته‌بندی پرووایدرها را نداریم
// وجود این متغیر لازم است تا فایل‌های دیگر ارور ندهند (مثل fetch-models)
export const LLM_LIST_MAP: Record<string, LLM[]> = {
  openai: [],
  azure: [],
  google: [],
  mistral: [],
  groq: [],
  perplexity: [],
  anthropic: []
}
