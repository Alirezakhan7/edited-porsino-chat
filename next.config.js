const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
})

const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // در حالت توسعه PWA غیرفعال باشد بهتر است
  register: true,
  skipWaiting: true,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // این خط حیاتی است: انتقال پکیج‌های خاص به تنظیمات اصلی
  serverExternalPackages: ["sharp", "onnxruntime-node"],

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // بخش experimental را فعلا خالی یا پاک کنید چون کلید قبلی جابجا شده
  experimental: {},
}

module.exports = withBundleAnalyzer(withPWA(nextConfig))