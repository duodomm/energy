import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Независимость от сети: как получить свой киловатт и узнать его цену — Альтернативная энергетика РФ",
    template: "%s — Альтернативная энергетика РФ",
  },
  description:
    "Независимость от сети: три уровня — резерв, гибрид, автономия. Профессиональный калькулятор солнечных станций, накопителей и генераторов: смета «от–до» по актуальным ценам, LCOE, окупаемость, справочник регионов PSH и тарифов, нормативка СП 20.13330 и микрогенерация до 15 кВт.",
  keywords: [
    "солнечные панели",
    "калькулятор солнечной станции",
    "солнечная энергетика Россия",
    "LiFePO4",
    "накопители энергии",
    "VRFB",
    "микрогенерация 15 кВт",
    "LCOE",
    "окупаемость СЭС",
    "смета солнечной электростанции",
    "справочник PSH",
    "энергетическая независимость",
    "независимость от электросети",
  ],
  openGraph: {
    title: "Независимость от сети: как получить свой киловатт и узнать его цену",
    description: "Три уровня независимости — резерв, гибрид, автономия. Калькулятор, справочник и честная экономика собственной генерации.",
    locale: "ru_RU",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className="" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
