import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { PWARegister } from '@/components/PWARegister'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'cyrillic'],
})

export const metadata: Metadata = {
  title: 'Life Factory — Операционная система жизни',
  description: 'Визуальный редактор бизнес-процессов в стиле Factorio',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Life Factory',
  },
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0f172a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className="dark">
      <body
        className={`${inter.variable} font-sans antialiased bg-slate-900 text-slate-100`}
      >
        <PWARegister />
        {children}
      </body>
    </html>
  )
}
