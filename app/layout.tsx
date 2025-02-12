// app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Head from 'next/head';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Wags Travel Hub',
  description: 'Your all-in-one pet travel services hub',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <Head>
        <meta charSet="utf-8" />
        <meta name="robots" content="max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="description" content="Your all-in-one pet travel services hub" />
        <title>Wags Travel Hub</title>
      </Head>
      <body className="bg-white text-offblack dark:bg-neutral-900">
        <Navbar />
        {/* Add top padding so content isn’t hidden behind the fixed header */}
        <main className="pt-20">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
