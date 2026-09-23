import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ВИЭ·РФ — Альтернативная энергетика России",
  description:
    "Аналитическая платформа по альтернативной энергетике России: установленная мощность, виды ВИЭ, регионы, каталог ключевых проектов и сценарии развития отрасли до 2035 года.",
  keywords: [
    "ВИЭ",
    "альтернативная энергетика",
    "возобновляемая энергетика",
    "ветровая энергетика",
    "солнечная энергетика",
    "малые ГЭС",
    "биомасса",
    "геотермальная энергетика",
    "Россия",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
