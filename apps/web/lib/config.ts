import { env } from "@/env";
import type { Metadata, Viewport } from "next";

export const siteConfig = {
  name: "OneChat",
  title: "OneChat",
  description:
    "Chat with 20+ AI models, share conversations in real-time, and experience seamless voice interactions. Open-source AI chat platform with multi-model support, chat branching, image generation, and cross-device sync.",
  url: env.NEXT_PUBLIC_APP_URL,
  links: {
    twitter: "https://x.com/bharath_uwu",
    github: "https://github.com/BharathXD/one-chat",
  },
  keywords: [
    "AI chat",
    "Multi-model AI",
    "Real-time streaming",
    "Voice chat",
    "Chat sharing",
    "OpenAI",
    "Claude",
    "Anthropic",
    "Gemini",
    "OpenRouter",
    "DeepSeek",
    "Qwen",
    "Llama3",
    "ChatGPT",
    "Chat branching",
    "Text-to-speech",
    "Speech-to-text",
    "File attachments",
    "Image generation",
    "Web search",
    "BYOK",
    "Cross-device sync",
    "Next.js",
    "React",
    "TypeScript",
    "tRPC",
    "Open source",
    "Collaborative chat",
    "AI personalization",
  ] as string[],
  authors: [
    {
      name: "OneChat Team",
      url: "https://github.com/BharathXD",
    },
  ],
  creator: "OneChat Team",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: siteConfig.authors,
  creator: siteConfig.creator,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: `/opengraph-image.jpg`,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: ["/opengraph-image.jpg"],
    creator: "@bharath_uwu",
  },
  icons: {
    icon: [
      { url: "/assets/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/assets/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      {
        url: "/assets/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    other: [
      {
        rel: "icon",
        url: "/assets/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        rel: "icon",
        url: "/assets/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    yandex: process.env.YANDEX_VERIFICATION || undefined,
  },
  category: "technology",
  classification: "AI Chat Application",
  referrer: "origin-when-cross-origin",
  alternates: {
    canonical: siteConfig.url,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "format-detection": "telephone=no",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};
