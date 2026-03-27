import type { Metadata } from 'next'
import { Geist, Geist_Mono, Vazirmatn } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { MobileWall } from '@/components/mobile-wall'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: 'nodepad - Research & Ideation',
  description: 'An AI-enabled personal research, note-taking, and ideation app with tiling layout',
  icons: {
    icon: [
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased ${vazirmatn.variable}`} suppressHydrationWarning>
        <MobileWall />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
