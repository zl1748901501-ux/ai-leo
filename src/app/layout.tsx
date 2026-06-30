import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Second AI",
  description: "Privacy-first AI workspace and controlled AI profile.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
