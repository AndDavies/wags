import type React from 'react';
import './globals.css';
import { Outfit } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthListener from '@/components/AuthListener';
import { SpeedInsights } from '@vercel/speed-insights/next';

import { ToastProvider } from '@/components/ui/toast';
import { Toaster } from '@/components/ui/toaster';
import Script from 'next/script';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata = {
  title: 'Wags & Wanders | Seamless Pet Travel for Digital Nomads & Families',
  description:
    'Plan stress-free pet travel with Wags & Wanders. Discover pet-friendly hotels, airlines, and vet networks. Perfect for digital nomads and families traveling with pets.',
  keywords: [
    'pet travel',
    'travel with pets',
    'pet-friendly travel',
    'digital nomad pet travel',
    'vet network for pet travel',
    'pet-friendly hotels',
    'pet travel app',
    'pet travel itinerary',
    'pet travel documents',
  ],
  authors: [{ name: 'Wags & Wanders Team', url: 'https://wagsandwanders.com' }],
  creator: 'Wags & Wanders',
  publisher: 'Wags & Wanders',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://wagsandwanders.com',
    languages: {
      'en-US': 'https://wagsandwanders.com/en-US',
      'es-ES': 'https://wagsandwanders.com/es-ES',
    },
  },
  openGraph: {
    title: 'Wags & Wanders | Travel Confidently with Your Pet',
    description:
      'Your all-in-one pet travel app. Plan trips, manage documents, and connect with a global vet network. Ideal for digital nomads and pet-loving families.',
    url: 'https://wagsandwanders.com',
    siteName: 'Wags & Wanders',
    images: [
      {
        url: 'https://wagsandwanders.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Wags & Wanders - Pet Travel App',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wags & Wanders | Travel Confidently with Your Pet',
    description:
      'Plan pet-friendly travel with ease. From itineraries to vet networks, Wags & Wanders has you covered. Perfect for digital nomads and families.',
    images: ['https://wagsandwanders.com/twitter-image.jpg'],
    creator: '@wagsandwanders',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} font-outfit`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-BF9YNEQ2CH"
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-BF9YNEQ2CH');
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Wags & Wanders',
              url: 'https://wagsandwanders.com',
              description:
                'Wags & Wanders is the ultimate pet travel app for digital nomads and families. Plan trips, manage pet documents, and connect with a global vet network.',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://wagsandwanders.com/search?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
              sameAs: [
                'https://twitter.com/wagsandwanders',
                'https://facebook.com/wagsandwanders',
                'https://instagram.com/wagsandwanders',
              ],
            }),
          }}
        />
      </head>
      <body className="bg-gray-50 text-gray-800 min-h-screen flex flex-col font-outfit" suppressHydrationWarning>
        <SpeedInsights />
        <ToastProvider>
          <AuthListener>
            <Navbar />
            <main className="flex-grow pt-20">{children}</main>
            <Footer />
          </AuthListener>
          <Toaster />
        </ToastProvider>
      </body>
    </html>
  );
}