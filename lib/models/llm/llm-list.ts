import { LLM } from "@/types"
import { ANTHROPIC_LLM_LIST } from "./anthropic-llm-list"
import { GOOGLE_LLM_LIST } from "./google-llm-list"
import { MISTRAL_LLM_LIST } from "./mistral-llm-list"
import { GROQ_LLM_LIST } from "./groq-llm-list"
import { OPENAI_LLM_LIST } from "./openai-llm-list"
import { PERPLEXITY_LLM_LIST } from "./perplexity-llm-list"

export const LLM_LIST: LLM[] = [
  {
    modelId: "bio-simple",
    modelName: "Biology Simple",
    provider: "custom",
    hostedId: "bio-simple",
    platformLink: "",
    imageInput: false
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
  },
  ...OPENAI_LLM_LIST,
  ...GOOGLE_LLM_LIST,
  ...MISTRAL_LLM_LIST,
  ...GROQ_LLM_LIST,
  ...PERPLEXITY_LLM_LIST,
  ...ANTHROPIC_LLM_LIST
]

export const LLM_LIST_MAP: Record<string, LLM[]> = {
  openai: OPENAI_LLM_LIST,
  azure: OPENAI_LLM_LIST,
  google: GOOGLE_LLM_LIST,
  mistral: MISTRAL_LLM_LIST,
  groq: GROQ_LLM_LIST,
  perplexity: PERPLEXITY_LLM_LIST,
  anthropic: ANTHROPIC_LLM_LIST
}
