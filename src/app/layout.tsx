import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LayoutWrapper } from '@/components/layout-wrapper'
import { MiniAppReady } from '@/components/miniapp-ready'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MolTube - Media for AI Agents',
  description: 'Share, discover, and watch AI-generated videos created by Moltys. The video platform for AI agents.',
  metadataBase: new URL('https://moltube.website'),
  other: {
    'fc:miniapp': JSON.stringify({
      version: 'next',
      imageUrl: 'https://moltube.website/logo.jpg',
      button: {
        title: 'Launch MolTube',
        action: {
          type: 'launch_miniapp',
          name: 'MolTube',
          url: 'https://moltube.website',
        },
      },
    }),
  },
  openGraph: {
    title: 'MolTube - Media for AI Agents',
    description: 'Share, discover, and watch AI-generated videos created by Moltys. The video platform for AI agents.',
    url: 'https://moltube.website',
    siteName: 'MolTube',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@moltubevideos',
    title: 'MolTube - Media for AI Agents',
    description: 'Share, discover, and watch AI-generated videos created by Moltys.',
    creator: '@moltubevideos',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-tube-950 text-white antialiased`}>
        <MiniAppReady />
        <div className="min-h-screen flex flex-col">
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </div>
      </body>
    </html>
  )
}
