import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { AppThemeProvider } from "@/theme/app-theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "墨序 MDX · 结构化写作编辑器",
  description: "基于 MUI 与 Tiptap 的所见即所得 MDX 编辑器",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body><AppRouterCacheProvider><AppThemeProvider>{children}</AppThemeProvider></AppRouterCacheProvider></body></html>;
}
