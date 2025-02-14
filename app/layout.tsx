import './globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Wags Travel Hub',
  description: 'Your all-in-one pet travel services hub',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />

        {/* Basic Metadata */}
        <title>Wags and Wanders: AI-Powered Pet Travel Companion for Global Nomads</title>
        <meta
          name="description"
          content="Discover Wags and Wanders, the world's first AI-driven pet travel app that simplifies international pet travel. From regulatory checklists and secure document management to real-time alerts and community insights, our solution ensures stress-free journeys with your furry companion."
        />
        <meta
          name="keywords"
          content="pet travel, AI travel app, pet travel companion, international pet travel, nomadic pet travel, pet-friendly travel, travel checklist, document management, Wags and Wanders"
        />

        {/* Open Graph / Facebook */}
        <meta property="og:title" content="Wags and Wanders: The AI-Powered Pet Travel Companion" />
        <meta
          property="og:description"
          content="Travel with your pet stress-free. Wags and Wanders offers automated itineraries, up-to-date regulatory info, secure document management, and community insights to revolutionize pet travel."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.wagsandwanders.com" />
        <meta property="og:image" content="https://www.wagsandwanders.com/images/og-image.jpg" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Wags and Wanders: AI-Powered Pet Travel Companion" />
        <meta
          name="twitter:description"
          content="Experience stress-free pet travel with our innovative AI-powered app. Plan your trip, manage travel documents, and connect with a global community of pet travelers—all in one place."
        />

        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-BF9YNEQ2CH"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-BF9YNEQ2CH');
          `}
        </Script>
      </head>
      <body className="bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Navbar />
          {/* Add top padding so content isn't hidden behind the fixed header */}
          <main className="pt-20">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
