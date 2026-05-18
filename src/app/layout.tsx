import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import RegisterSW from '@/components/RegisterSW'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GAA Attendance Tracker',
  description: 'U16 GAA Squad Attendance & Management',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GAA Attendance',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#006837',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="GAA Attendance" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${inter.className} h-full`}>
        <RegisterSW />
        {children}
      </body>
    </html>
  )
}
