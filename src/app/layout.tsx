import type { Metadata } from "next";
import { Suspense } from "react";
import { Providers } from "@/components/Providers";
import "./globals.css";
import { TopNav } from "@/components/layout/TopNav";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { SWRegister } from "@/components/SWRegister";
import { ViewTransitionWrapper } from "@/components/ViewTransitionWrapper";
import { GlobalSearch } from "@/components/GlobalSearch";

export const metadata: Metadata = {
  title: {
    default: "面试网 - AI 驱动的程序员面试准备平台",
    template: "%s | 面试网",
  },
  description:
    "智能题库、AI 模拟面试、学习计划、社区交流，一站式面试准备平台。涵盖前端、Java、Python、Go、数据库、算法等方向。",
  keywords: [
    "面试",
    "算法题",
    "LeetCode",
    "模拟面试",
    "前端面试",
    "Java面试",
    "Python面试",
    "Go面试",
    "刷题",
    "程序员面试",
  ],
  authors: [{ name: "面试网" }],
  creator: "面试网",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "面试网",
    title: "面试网 - AI 驱动的程序员面试准备平台",
    description:
      "智能题库、AI 模拟面试、学习计划、社区交流，一站式面试准备平台",
  },
  twitter: {
    card: "summary_large_image",
    title: "面试网 - AI 驱动的程序员面试准备平台",
    description:
      "智能题库、AI 模拟面试、学习计划、社区交流，一站式面试准备平台",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(){var t=localStorage.getItem("interview-platform-theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme:dark)").matches;document.documentElement.setAttribute("data-theme",d?"dark":"light");document.documentElement.style.colorScheme=d?"dark":"light"}()`
          }}
        />
        <link rel="manifest" href="/manifest.json" />
        {/* Umami 网站访问统计 */}
        <script
          defer
          src="https://analytics.zhangzhengyang.com/script.js"
          data-website-id="1c981f52-bac4-4320-bd1a-c074478f020d"
        />
        <meta name="theme-color" content="#f54e00" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="面试网" />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <Providers>
          <SWRegister />
          <Suspense>
            <TopNav />
          </Suspense>
          <OfflineIndicator />
          <main id="main-content" className="flex-1 pt-[56px]" tabIndex={-1}>
            <ViewTransitionWrapper>{children}</ViewTransitionWrapper>
          </main>
          <GlobalSearch />
        </Providers>
      </body>
    </html>
  );
}
