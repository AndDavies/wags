// components/Navbar.tsx
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Bars3Icon, XMarkIcon, UserIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import NavLink from '@/components/NavLink';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 w-full z-50 transition-colors duration-300 ${isScrolled ? 'bg-gray-50 dark:bg-neutral-800 shadow-md' : 'bg-transparent'}`}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link href="/">
            <Image
              src="/wags_and_wanders_logo_trans.png"
              alt="Wags Travel Hub Logo"
              width={80}
              height={80}
              className="object-contain"
            />
          </Link>
        </div>
        {/* Desktop Navigation */}
        <ul className="hidden lg:flex items-center gap-x-8">
          <li>
            <NavLink href="/">Home</NavLink>
          </li>
          <li>
            <NavLink href="/about">About Us</NavLink>
          </li>
          <li>
            <NavLink href="/how-it-works">How It Works</NavLink>
          </li>
          <li>
            <NavLink href="/directory">Directory</NavLink>
          </li>
          <li>
            <NavLink href="/blog">Blog</NavLink>
          </li>
        </ul>
        {/* Desktop Button Group */}
        <div className="hidden lg:flex gap-x-4 items-center">
          <Button variant="ghost" className="flex items-center gap-x-2 py-1 px-3 text-sm">
            <UserIcon className="h-5 w-5" />
            Sign In
          </Button>
          <Button variant="default" className="py-1 px-3 text-sm">
            Hire Us
          </Button>
        </div>
        {/* Mobile Menu Button */}
        <div className="lg:hidden">
          <Button variant="ghost" onClick={toggleMobileMenu} className="p-2 focus:outline-none transition-transform duration-300">
            {isMobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </Button>
        </div>
      </nav>
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute inset-x-0 top-16 bg-gray-50 dark:bg-neutral-800 shadow-md">
          <ul className="flex flex-col gap-y-4 p-4">
            <li>
              <NavLink href="/" >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink href="/about">
                About Us
              </NavLink>
            </li>
            <li>
              <NavLink href="/how-it-works">
                How It Works
              </NavLink>
            </li>
            <li>
              <NavLink href="/directory">
                Directory
              </NavLink>
            </li>
            <li>
              <NavLink href="/blog">
                Blog
              </NavLink>
            </li>
            <li className="flex gap-x-4 pt-4">
              <Button variant="ghost" className="flex items-center gap-x-2 py-1 px-3 text-base">
                <UserIcon className="h-5 w-5" />
                Sign In
              </Button>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};

export default Navbar;
