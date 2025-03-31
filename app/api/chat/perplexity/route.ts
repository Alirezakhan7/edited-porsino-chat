import { ChatSettings } from "@/types"

export const runtime = "edge"

export async function POST(request: Request) {
  const json = await request.json()
  const { messages } = json as {
    chatSettings: ChatSettings
    messages: any[]
  }

  try {
    // استخراج آخرین پیام کاربر از تاریخچه چت
    const userMessage = messages[messages.length - 1].content

    // ارسال درخواست به سرور FastAPI شما که از StreamingResponse استفاده می‌کند
    const response = await fetch("http://localhost:8000/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: userMessage })
    })

    if (!response.ok) {
      throw new Error(`Server returned error: ${response.status}`)
    }

    // انتقال مستقیم جریان (stream) پاسخ دریافتی از FastAPI به کلاینت
    return new Response(response.body, {
      status: 200,
      headers: { "Content-Type": "text/plain" }
    })
  } catch (error: any) {
    const errorMessage = error.message || "Unknown error occurred"
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}

/*
این کد جدیده ولی با باگ



import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { ChatSettings } from "@/types"

export const runtime = "edge"

export async function POST(request: Request) {
  const json = await request.json()
  const { messages } = json as {
    chatSettings: ChatSettings
    messages: any[]
  }

  try {
    // دریافت آخرین پیام کاربر از تاریخچه چت
    const userMessage = messages[messages.length - 1].content

    // درخواست به API اختصاصی شما
    const response = await fetch("http://localhost:8000/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query: userMessage })
    })
    

    if (!response.ok) {
      throw new Error(`Server returned error: ${response.status}`)
    }

    const data = await response.json()
    const answer = data.answer || "پاسخی دریافت نشد."

    return new Response(JSON.stringify({ answer: answer }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error: any) {
    let errorMessage = error.message || "خطای نامشخص رخ داد"
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: error.status || 500
    })
  }
}



****

import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { ChatSettings } from "@/types"
import { OpenAIStream, StreamingTextResponse } from "ai"
import OpenAI from "openai"

export const runtime = "edge"

export async function POST(request: Request) {
  const json = await request.json()
  const { chatSettings, messages } = json as {
    chatSettings: ChatSettings
    messages: any[]
  }

  try {
    const profile = await getServerProfile()

    checkApiKey(profile.perplexity_api_key, "Perplexity")

    // Perplexity is compatible the OpenAI SDK
    const perplexity = new OpenAI({
      apiKey: profile.perplexity_api_key || "",
      baseURL: "https://api.perplexity.ai/"
    })

    const response = await perplexity.chat.completions.create({
      model: chatSettings.model,
      messages,
      stream: true
    })

    const stream = OpenAIStream(response)

    return new StreamingTextResponse(stream)
  } catch (error: any) {
    let errorMessage = error.message || "An unexpected error occurred"
    const errorCode = error.status || 500

    if (errorMessage.toLowerCase().includes("api key not found")) {
      errorMessage =
        "Perplexity API Key not found. Please set it in your profile settings."
    } else if (errorCode === 401) {
      errorMessage =
        "Perplexity API Key is incorrect. Please fix it in your profile settings."
    }

    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}
*/
