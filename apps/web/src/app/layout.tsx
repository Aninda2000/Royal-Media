import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Footer } from "@/components/layout/footer"

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
})

export const metadata: Metadata = {
  title: {
    default: "Royal Media - Connect, Share, Discover",
    template: "%s | Royal Media"
  },
  description: "A modern social network platform for connecting with friends, sharing moments, and discovering new content.",
  keywords: ["social media", "social network", "connect", "share", "discover"],
  authors: [{ name: "aninda" }],
  creator: "aninda",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Royal Media - Connect, Share, Discover",
    description: "A modern social network platform for connecting with friends, sharing moments, and discovering new content.",
    siteName: "Royal Media",
  },
  twitter: {
    card: "summary_large_image",
    title: "Royal Media - Connect, Share, Discover",
    description: "A modern social network platform for connecting with friends, sharing moments, and discovering new content.",
    creator: "@royalmedia",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <Providers>
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}