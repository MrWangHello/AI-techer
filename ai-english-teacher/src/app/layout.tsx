import type { Metadata } from "next";
import type { Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 英语老师 - Bella",
  description: "AI 驱动的英语学习宠物，语音互动更轻松",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="h-full flex flex-col bg-[#fdf2f8] text-[#1f2937]">
        {children}
      </body>
    </html>
  );
}