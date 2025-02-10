// components/Navbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button"; // Shadcn UI Button component

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  // Listen for scroll events to update navbar style
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white bg-opacity-90 backdrop-blur-md shadow-md"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <Image
                src="/wags_and_wanders_logo_trans.png"
                alt="Wags and Wanders Logo"
                width={100} // Adjust as needed
                height={100} // Adjust as needed
                className="object-contain"
              />
            </Link>
          </div>
          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8">
            <Link
              href="/"
              className="text-sm font-medium transition-colors duration-300 hover:text-primary"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium transition-colors duration-300 hover:text-primary"
            >
              About Us
            </Link>
            <Link
              href="/how-it-works"
              className="text-sm font-medium transition-colors duration-300 hover:text-primary"
            >
              How It Works
            </Link>
            <Link
              href="/directory"
              className="text-sm font-medium transition-colors duration-300 hover:text-primary"
            >
              Directory
            </Link>
            <Link
              href="/blog"
              className="text-sm font-medium transition-colors duration-300 hover:text-primary"
            >
              Blog
            </Link>
          </div>
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              onClick={toggleMobileMenu}
              className="p-2 focus:outline-none transition-transform duration-300"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden animate-slideDown bg-white bg-opacity-90 backdrop-blur-md">
          <div className="px-4 pt-2 pb-3 space-y-1">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-base font-medium transition-colors duration-300 hover:text-primary"
            >
              Home
            </Link>
            <Link
              href="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-base font-medium transition-colors duration-300 hover:text-primary"
            >
              About Us
            </Link>
            <Link
              href="/how-it-works"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-base font-medium transition-colors duration-300 hover:text-primary"
            >
              How It Works
            </Link>
            <Link
              href="/directory"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-base font-medium transition-colors duration-300 hover:text-primary"
            >
              Directory
            </Link>
            <Link
              href="/blog"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-base font-medium transition-colors duration-300 hover:text-primary"
            >
              Blog
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
