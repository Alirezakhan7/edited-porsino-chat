import { Toaster } from "@/components/ui/sonner"
import { GlobalState } from "@/components/utility/global-state"
import { Providers } from "@/components/utility/providers"
import TranslationsProvider from "@/components/utility/translations-provider"
import initTranslations from "@/lib/i18n"
import { Database } from "@/supabase/types"
import { createServerClient } from "@supabase/ssr"
import { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { cookies } from "next/headers"
import { ReactNode } from "react"
import "./globals.css"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

// آیکون های پایین صفحه در این فایل هست
import { BottomNav } from "@/components/layout/BottomNav"

const inter = Inter({ subsets: ["latin"] })
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

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: "پرسینو - هوش مصنوعی کنکوری",
    template: "%s | پرسینو"
  },
  // START - این خط را جایگزین کنید
  description:
    "پرسینو، هوش مصنوعی تخصصی کنکور. پاسخ فوری به سوالات، آموزش گام‌به‌گام و برنامه‌ریزی درسی هوشمند برای موفقیت شما.",
  // END - پایان بخش جایگزینی
  keywords: [
    "هوش مصنوعی کنکوری",
    "پرسینو",
    "هوش مصنوعی کنکور",
    "کمک درسی با هوش مصنوعی",
    "آموزش کنکور با AI",
    "تست‌زنی هوش مصنوعی",
    "ربات حل سوال کنکور",
    "حل تست آنلاین",
    "یادگیری هوشمند",
    "برنامه‌ریزی درسی هوش مصنوعی"
  ],
  manifest: "/manifest.json",
  metadataBase: new URL("https://porsino.org"),
  alternates: {
    canonical: "https://porsino.org"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: "پرسینو"
  },
  formatDetection: {
    telephone: false
  },
  openGraph: {
    type: "website",
    siteName: "پرسینو",
    title: "پرسینو - هوش مصنوعی کنکوری",
    description:
      "آموزش و حل تست‌های کنکور با هوش مصنوعی، سریع، دقیق و شخصی‌سازی شده.",
    url: "https://porsino.org",
    images: [
      {
        url: "https://porsino.org/og-image.jpg",
        width: 1024,
        height: 1024,
        alt: "پرسینو - هوش مصنوعی کنکوری"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "پرسینو - هوش مصنوعی کنکوری",
    description:
      "آموزش و حل تست‌های کنکور با هوش مصنوعی، سریع، دقیق و شخصی‌سازی شده.",
    images: ["https://porsino.org/og-image.jpg"]
  },
  icons: {
    icon: "/favicon.ico"
  }
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
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        }
      }
    }
  )
  const session = (await supabase.auth.getSession()).data.session

  const { t, resources } = await initTranslations(locale, i18nNamespaces)

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      dir={locale === "fa" ? "rtl" : "ltr"}
    >
      <body className={`${inter.className} bg-background text-foreground`}>
        <Providers attribute="class" defaultTheme="dark" enableSystem={false}>
          <TranslationsProvider
            namespaces={i18nNamespaces}
            locale={locale}
            resources={resources}
          >
            <Toaster richColors position="top-center" duration={3000} />
            <div className="min-h-dvh w-full pb-16 md:pb-0">
              {session ? <GlobalState>{children}</GlobalState> : children}
            </div>

            <div id="portals" />
            {session && (
              <BottomNav className="bg-background/95 fixed inset-x-0 bottom-0 z-40 h-16 border-t backdrop-blur-sm md:hidden" />
            )}
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
