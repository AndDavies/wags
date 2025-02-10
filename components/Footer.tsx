// components/Footer.tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-offwhite py-8">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center border-t border-gray-700 pt-6">
        <div className="mb-4 md:mb-0">
          <Link href="/">
            <Image
              src="/wags_and_wanders_logo_trans.png"
              alt="Wags Travel Hub Logo"
              width={120}
              height={40}
              className="object-contain hover:scale-105 transition-transform duration-200"
            />
          </Link>
        </div>
        <div className="flex space-x-6">
          <Link href="/" className="hover:underline transition-colors duration-200">
            Home
          </Link>
          <Link href="/about" className="hover:underline transition-colors duration-200">
            About Us
          </Link>
          <Link href="/how-it-works" className="hover:underline transition-colors duration-200">
            How It Works
          </Link>
          <Link href="/directory" className="hover:underline transition-colors duration-200">
            Directory
          </Link>
          <Link href="/blog" className="hover:underline transition-colors duration-200">
            Blog
          </Link>
        </div>
      </div>
      <div className="mt-4 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} Wags Travel Hub. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
