// components/Navbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client"; // Client-side Supabase
import { User } from "@supabase/supabase-js";
import md5 from "md5"; // For Gravatar hashing

const NoPrefetchLink = ({ href, children, ...props }: React.ComponentProps<typeof Link>) => (
  <Link href={href} prefetch={false} {...props}>
    {children}
  </Link>
);

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const checkAuth = async () => {
    const authToken = document.cookie
      .split("; ")
      .find(row => row.startsWith("auth-token="))
      ?.split("=")[1];
    const loggedIn = !!authToken && authToken.length > 0;
    console.log(`[Navbar] auth-token: ${authToken ? `${authToken.substring(0, 50)}...` : 'undefined'}, isLoggedIn: ${loggedIn}`);

    if (loggedIn && !user) {
      const { data: { user: fetchedUser }, error } = await supabase.auth.getUser(authToken);
      if (error) {
        console.error(`[Navbar] Error fetching user: ${error.message}`);
      } else {
        console.log(`[Navbar] User fetched: ${fetchedUser?.email}`);
        setUser(fetchedUser);
      }
    } else if (!loggedIn) {
      setUser(null);
    }
    setIsLoggedIn(loggedIn);
  };

  useEffect(() => {
    checkAuth(); // Initial check

    const interval = setInterval(checkAuth, 500); // Poll every 500ms
    return () => clearInterval(interval);
  }, []);

  const handleSignout = async () => {
    await fetch("/signout", { method: "GET" });
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=.wagsandwanders.com";
    setIsLoggedIn(false);
    setUser(null); // Clear user data
    router.push("/");
  };

  // Gravatar URL based on email
  const getAvatarUrl = (email: string) => {
    const hash = md5(email.trim().toLowerCase());
    return `https://www.gravatar.com/avatar/${hash}?s=40&d=identicon`; // 40px, fallback to identicon
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <NoPrefetchLink href="/" className="flex items-center space-x-2">
            <Image
              src="/wags_and_wanders_logo_trans.png"
              alt="Wags & Wanders"
              width={40}
              height={40}
              className="w-10 h-10"
            />
            <span className="text-xl font-semibold text-[#30B8C4]">Wags & Wanders</span>
          </NoPrefetchLink>

          <nav className="hidden md:flex items-center space-x-8">
            <NoPrefetchLink href="/" className="text-sm font-medium text-offblack hover:text-[#FFE5E5] transition-colors">Home</NoPrefetchLink>
            <NoPrefetchLink href="/services" className="text-sm font-medium text-offblack hover:text-[#FFE5E5] transition-colors">Services</NoPrefetchLink>
            <NoPrefetchLink href="/about" className="text-sm font-medium text-offblack hover:text-[#FFE5E5] transition-colors">About</NoPrefetchLink>
            <NoPrefetchLink href="/blog" className="text-sm font-medium text-offblack hover:text-[#FFE5E5] transition-colors">Blog</NoPrefetchLink>
            <NoPrefetchLink href="/contact" className="text-sm font-medium text-offblack hover:text-[#FFE5E5] transition-colors">Contact</NoPrefetchLink>
            {isLoggedIn && user ? (
              <>
                <div className="flex items-center space-x-2">
                  <Image
                    src={getAvatarUrl(user.email || "")}
                    alt="User Avatar"
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                  <span className="text-sm text-offblack">{user.email?.split("@")[0]}</span>
                </div>
                <NoPrefetchLink href="/profile" className="text-sm font-medium text-offblack hover:text-[#FFE5E5] transition-colors">Profile</NoPrefetchLink>
                <button
                  onClick={handleSignout}
                  className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <NoPrefetchLink href="/login" className="text-sm font-medium text-[#30B8C4] hover:text-[#FFE5E5] transition-colors">Log In</NoPrefetchLink>
                <NoPrefetchLink href="/signup" className="text-sm font-medium text-[#30B8C4] hover:text-[#FFE5E5] transition-colors">Sign Up</NoPrefetchLink>
              </>
            )}
          </nav>

          <nav className="md:hidden flex flex-col items-center space-y-2 py-4">
            <NoPrefetchLink href="/" className="text-lg font-medium text-offblack hover:text-[#30B8C4] transition-colors">Home</NoPrefetchLink>
            <NoPrefetchLink href="/services" className="text-lg font-medium text-offblack hover:text-[#30B8C4] transition-colors">Services</NoPrefetchLink>
            <NoPrefetchLink href="/about" className="text-lg font-medium text-offblack hover:text-[#30B8C4] transition-colors">About</NoPrefetchLink>
            <NoPrefetchLink href="/blog" className="text-lg font-medium text-offblack hover:text-[#30B8C4] transition-colors">Blog</NoPrefetchLink>
            <NoPrefetchLink href="/contact" className="text-lg font-medium text-offblack hover:text-[#30B8C4] transition-colors">Contact</NoPrefetchLink>
            {isLoggedIn && user ? (
              <>
                <div className="flex items-center space-x-2">
                  <Image
                    src={getAvatarUrl(user.email || "")}
                    alt="User Avatar"
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                  <span className="text-lg text-offblack">{user.email?.split("@")[0]}</span>
                </div>
                <NoPrefetchLink href="/profile" className="text-lg font-medium text-offblack hover:text-[#30B8C4] transition-colors">Profile</NoPrefetchLink>
                <button
                  onClick={handleSignout}
                  className="text-lg font-medium text-red-600 hover:text-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <NoPrefetchLink href="/login" className="text-lg font-medium text-[#30B8C4] hover:text-[#FFE5E5] transition-colors">Log In</NoPrefetchLink>
                <NoPrefetchLink href="/signup" className="text-lg font-medium text-[#30B8C4] hover:text-[#FFE5E5] transition-colors">Sign Up</NoPrefetchLink>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}