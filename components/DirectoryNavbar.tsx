// components/DirectoryNavbar.tsx
import React, { useState } from 'react';
import Link from 'next/link';
// Now that we have a declaration file, TypeScript won't complain about this import.
import { MenuIcon, XIcon } from '@heroicons/react/outline';

/**
 * Define the interface for a navigation link.
 */
interface NavLink {
  name: string;
  href: string;
}

/**
 * Navigation links for the directory.
 */
const navLinks: NavLink[] = [
  { name: 'Home', href: '/' },
  { name: 'Airlines', href: '/directory/airlines' },
  { name: 'Hotels', href: '/directory/hotels' },
  { name: 'Blog', href: '/blog' },
  // Add more links as needed.
];

/**
 * DirectoryNavbar Component
 * 
 * A responsive top navigation bar that supports both desktop and mobile views.
 */
const DirectoryNavbar: React.FC = () => {
  // State to control whether the mobile menu is open.
  const [isMobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Toggle the mobile menu open/close state.
  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  return (
    <header className="fixed top-0 inset-x-0 bg-white shadow z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/">
              <a className="text-2xl font-bold text-blue-600">Wags Travel Hub</a>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 items-center">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <a className="text-gray-700 hover:text-blue-600 transition-colors">
                  {link.name}
                </a>
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
              className="p-2 rounded-md text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600"
            >
              {isMobileMenuOpen ? (
                <XIcon className="h-6 w-6" aria-hidden="true" />
              ) : (
                <MenuIcon className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <nav className="md:hidden bg-white shadow">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <a
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                >
                  {link.name}
                </a>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
};

export default DirectoryNavbar;
