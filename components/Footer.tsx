// components/Footer.tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-gray-200 dark:border-neutral-700 bg-gray-800 text-offwhite">
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-5">
          {/* Logo */}
          <div className="text-center md:text-start">
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
          {/* Navigation Links */}
          <div className="text-center">
            <ul className="flex justify-center gap-x-6">
              <li>
                <Link href="/" className="hover:underline transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:underline transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:underline transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/directory" className="hover:underline transition-colors">
                  Directory
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:underline transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
          {/* Copyright */}
          <div className="text-center md:text-end">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} Wags Travel Hub. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
