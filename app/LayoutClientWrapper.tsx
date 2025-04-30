'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Toaster } from '@/components/ui/toaster'; // Keep Toaster always visible

interface LayoutClientWrapperProps {
  children: React.ReactNode;
}

/**
 * LayoutClientWrapper
 * A client component wrapper for the main layout.
 * Conditionally renders Navbar and Footer based on the current pathname.
 * Ensures Toaster is always rendered within the client context.
 * @param {LayoutClientWrapperProps} props - Component props.
 * @returns {JSX.Element}
 */
export default function LayoutClientWrapper({ children }: LayoutClientWrapperProps) {
  const pathname = usePathname();

  // Paths where Navbar and Footer should be hidden
  const pathsToHideLayout = ['/chat']; 

  const shouldHideLayout = pathsToHideLayout.includes(pathname);

  return (
    <>
      {!shouldHideLayout && <Navbar />}
      <main className="flex-grow">{children}</main>
      {!shouldHideLayout && <Footer />}
      <Toaster /> {/* Ensure Toaster is rendered here */}
    </>
  );
} 