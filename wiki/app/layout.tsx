import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "学乱档案室 · Gakuran 中文 Wiki",
  description: "以对话翻阅学乱：带来源的战斗机制、风格、生活系统与 1,097 项外观图鉴。",
  icons: {
    icon: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/favicon.svg`,
    shortcut: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/favicon.svg`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
