import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "学乱 Wiki",
  description: "Gakuran 官方 Trello 资料的非官方中文版。",
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
