// components/Navbar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, User, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const routes = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

interface NavbarProps {
  user: SupabaseUser | null;
}

export function Navbar({ user }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Debug: Log initial user prop
  useEffect(() => {
    console.log("Navbar initial user prop:", user);
  }, [user]);

  // Debug: Monitor cookie changes
  useEffect(() => {
    const checkCookie = () => {
      const cookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('sb-auqyngiwrzjwylzylxtb-auth-token'));
      console.log("Cookie sb-auqyngiwrzjwylzylxtb-auth-token:", cookie);
    };

    // Check cookie on mount
    checkCookie();

    // Check cookie on dropdown toggle
    const interval = setInterval(() => {
      if (isOpen) {
        checkCookie();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getGreeting = (email: string | undefined) => {
    if (!email) return "Hello, friend!";
    const name = email.split('@')[0];
    return `Hello, ${name} and your furry friend!`;
  };

  const defaultAvatar = <User className="h-8 w-8 text-white" />;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "bg-white shadow-md" : "bg-transparent",
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/wags_and_wanders_logo_trans.png"
              alt="Wags & Wanders"
              width={40}
              height={40}
              className="w-10 h-10"
            />
            <span className={cn("text-xl font-semibold", isScrolled ? "text-[#30B8C4]" : "text-[#30B8C4]")}>
              Wags & Wanders
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-[#FFE5E5]",
                  isScrolled ? "text-offblack" : "text-[#30B8C4]",
                )}
              >
                {route.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu onOpenChange={(open) => {
                console.log("Dropdown menu toggled:", open); // Debug log
                setIsOpen(open);
              }}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full" aria-label="User menu">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#30B8C4] text-white">
                      {defaultAvatar}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#30B8C4]/20">
                      <User className="h-4 w-4 text-[#30B8C4]" />
                    </div>
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-sm font-medium text-offblack">
                        {getGreeting(user.email)}
                      </p>
                      <p className="text-xs text-offblack/60">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/trips" className="cursor-pointer">
                      My Trips
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/signout" className="text-red-600 focus:text-red-600 cursor-pointer">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#30B8C4] hover:text-[#FFE5E5] hover:bg-transparent"
                  asChild
                >
                  <Link href="/login">Log In</Link>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="bg-[#30B8C4] text-white hover:bg-[#FFE5E5] hover:text-[#30B8C4] rounded-full"
                  asChild
                >
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            )}

            <Button
              variant="default"
              className={cn(
                "bg-[#30B8C4] text-white hover:bg-[#FFE5E5] hover:text-[#30B8C4]",
                "transition-all duration-300 rounded-full px-4 py-2 hidden md:flex",
              )}
              asChild
            >
              <Link href="/signup">Start Your Journey Together</Link>
            </Button>

            <button className="md:hidden" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
              {isOpen ? (
                <X className={cn("h-6 w-6", isScrolled ? "text-offblack" : "text-[#30B8C4]")} />
              ) : (
                <Menu className={cn("h-6 w-6", isScrolled ? "text-offblack" : "text-[#30B8C4]")} />
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white shadow-lg"
          >
            <div className="container mx-auto px-4 py-6">
              <nav className="flex flex-col space-y-4">
                {routes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    className="text-offblack hover:text-[#30B8C4] transition-colors text-lg"
                    onClick={() => setIsOpen(false)}
                  >
                    {route.label}
                  </Link>
                ))}

                <div className="h-px bg-gray-200 my-2"></div>

                {user ? (
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#30B8C4]/20">
                        {defaultAvatar}
                      </div>
                      <span className="text-offblack">{getGreeting(user.email)}</span>
                    </div>
                    <Link
                      href="/profile"
                      className="text-offblack hover:text-[#30B8C4] transition-colors text-lg"
                      onClick={() => setIsOpen(false)}
                    >
                      My Profile
                    </Link>
                    <Link
                      href="/trips"
                      className="text-offblack hover:text-[#30B8C4] transition-colors text-lg"
                      onClick={() => setIsOpen(false)}
                    >
                      My Trips
                    </Link>
                    <Link
                      href="/settings"
                      className="text-offblack hover:text-[#30B8C4] transition-colors text-lg"
                      onClick={() => setIsOpen(false)}
                    >
                      Settings
                    </Link>
                    <Link
                      href="/signout"
                      className="text-red-600 hover:text-red-700 transition-colors text-lg flex items-center"
                      onClick={() => setIsOpen(false)}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-3">
                    <Link
                      href="/login"
                      className="flex items-center justify-center py-2 text-[#30B8C4] hover:text-[#FFE5E5] transition-colors border border-[#30B8C4] rounded-md"
                      onClick={() => setIsOpen(false)}
                    >
                      Log In
                    </Link>
                    <Link
                      href="/signup"
                      className="flex items-center justify-center py-2 bg-[#30B8C4] text-white hover:bg-[#FFE5E5] hover:text-[#30B8C4] transition-colors rounded-md"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </div>
                )}

                <div className="pt-2">
                  <Button className="w-full bg-[#30B8C4] text-white hover:bg-[#FFE5E5] hover:text-[#30B8C4]" asChild>
                    <Link href="/signup" onClick={() => setIsOpen(false)}>
                      Start Your Journey Together
                    </Link>
                  </Button>
                </div>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Navbar;