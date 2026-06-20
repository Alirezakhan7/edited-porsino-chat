import { Toaster } from "@/components/ui/sonner"
import { GlobalState } from "@/components/utility/global-state"
import { Providers } from "@/components/utility/providers"
import TranslationsProvider from "@/components/utility/translations-provider"
import initTranslations from "@/lib/i18n"
import { Metadata, Viewport } from "next"
// خط زیر حذف شد (import Inter)
import { ReactNode } from "react"
import "./globals.css"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

import { BottomNav } from "@/components/layout/BottomNav"

// خط زیر حذف شد (const inter)
const APP_NAME = "Porsino AI"
const APP_DEFAULT_TITLE = "هوش مصنوعی پرسینو"
const APP_TITLE_TEMPLATE = "%s - Porsino AI"
const APP_DESCRIPTION = "Porsino AI PWA!"

interface RootLayoutProps {
  children: ReactNode
  params: Promise<{
    locale: string
  }>
}

// ... (بخش metadata بدون تغییر) ...
export const metadata: Metadata = {
  // ... همان کدهای قبلی ...
  title: {
    default: "پرسینو - هوش مصنوعی کنکوری",
    template: "%s | پرسینو"
  },
  description: "پرسینو، هوش مصنوعی تخصصی کنکور..."
}

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1
}

const i18nNamespaces = ["translation"]

export default async function RootLayout({
  children,
  params
}: RootLayoutProps) {
  const { locale } = await params
  const { t, resources } = await initTranslations(locale, i18nNamespaces)

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      dir={locale === "fa" ? "rtl" : "ltr"}
    >
      {/* 👇 تغییر مهم اینجاست: inter.className حذف شد */}
      <body className="bg-background text-foreground font-sans">
        <Providers attribute="class" defaultTheme="light" enableSystem={false}>
          <TranslationsProvider
            namespaces={i18nNamespaces}
            locale={locale}
            resources={resources}
          >
            <Toaster richColors position="top-center" duration={3000} />
            <div className="min-h-dvh w-full pb-16 md:pb-0">
              <GlobalState>{children}</GlobalState>
            </div>

            <div id="portals" />
            <BottomNav className="bg-background/95 fixed inset-x-0 bottom-0 z-40 h-16 border-t border-gray-200 backdrop-blur-sm md:hidden dark:border-slate-800" />
          </TranslationsProvider>
        </Providers>
        <Analytics />
        <SpeedInsights />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "پرسینو",
              url: "https://porsino.org",
              description:
                "هوش مصنوعی ویژه کنکور با آموزش گام‌به‌گام، تست‌زنی و برنامه‌ریزی درسی.",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://porsino.org/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </body>
    </html>
  )
}
