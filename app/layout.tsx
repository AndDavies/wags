// app/layout.tsx
import type React from "react";
import "./globals.css";
import { Outfit } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { createClient } from "@/lib/supabase-server";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata = {
  title: {
    default: "Wags & Wanders: Explore the World with Your Pet, Stress-Free",
    template: "%s | Wags & Wanders",
  },
  description: "Discover Wags & Wanders, Explore the World with Your Pet, Stress-Free. Travel Confidently with Your Pet. Plan itineraries, manage documents, and explore pet-friendly destinations and activities worldwide.",
  keywords: [
    "pet travel",
    "AI travel app",
    "pet travel companion",
    "international pet travel",
    "nomadic pet travel",
    "pet-friendly travel",
    "travel checklist",
    "document management",
    "Wags and Wanders",
  ],
  authors: [{ name: "Wags & Wanders Team", url: "https://wagsandwanders.com" }],
  openGraph: {
    title: "Wags & Wanders: Explore the World with Your Pet, Stress-Free",
    description: "Discover Wags & Wanders, Explore the World with Your Pet, Stress-Free. Travel Confidently with Your Pet. Plan itineraries, manage documents, and explore pet-friendly destinations and activities worldwide.",
    url: "https://www.wagsandwanders.com",
    siteName: "Wags & Wanders",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Wags & Wanders - Pet Travel Companion",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wags & Wanders: AI-Powered Pet Travel Companion",
    description: "Discover Wags & Wanders, your AI-powered companion for stress-free pet travel.",
    images: ["/images/og-image.jpg"],
    creator: "@WagsAndWanders",
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
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  other: {
    "google-analytics": "G-BF9YNEQ2CH", // For custom tracking setup if needed
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en" className={`${outfit.variable} font-sans`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-BF9YNEQ2CH" />
        <script
          id="google-analytics"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-BF9YNEQ2CH');
            `,
          }}
        />
      </head>
      <body className="bg-background text-foreground min-h-screen flex flex-col">
        <SpeedInsights />
        <Analytics />
        <Navbar user={user} />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}