// app/layout.tsx
import type React from "react";
import "./globals.css";
import { Outfit } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Notifications from "@/components/app/notifications"; // Changed to default import

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata = {
  // ... (unchanged metadata)
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
        <Notifications />
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}