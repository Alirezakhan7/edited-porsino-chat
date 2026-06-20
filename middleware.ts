import { i18nRouter } from "next-i18n-router"
import i18nConfig from "./i18nConfig"

export async function middleware(request: Request) {
  return i18nRouter(request as any, i18nConfig)
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|fonts|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|otf|eot)$).*)"
  ]
}
