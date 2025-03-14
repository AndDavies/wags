// components/Navbar.tsx
import Link from "next/link";
import Image from "next/image";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavbarProps {
  user: SupabaseUser | null;
}

const routes = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar({ user }: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
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
            <span className="text-xl font-semibold text-[#30B8C4]">Wags & Wanders</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className="text-sm font-medium text-offblack hover:text-[#FFE5E5] transition-colors"
              >
                {route.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth Links */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-offblack">
                  Hello, {user.email?.split("@")[0] || "User"}!
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#30B8C4] text-[#30B8C4] hover:bg-[#30B8C4] hover:text-white"
                  asChild
                >
                  <Link href="/profile">Profile</Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                  asChild
                >
                  <Link href="/signout">Sign Out</Link>
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#30B8C4] hover:text-[#FFE5E5]"
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
              </>
            )}
            <Button
              variant="default"
              className="bg-[#30B8C4] text-white hover:bg-[#FFE5E5] hover:text-[#30B8C4] rounded-full"
              asChild
            >
              <Link href="/signup">Start Your Journey Together</Link>
            </Button>
          </div>

          {/* Mobile Menu (CSS-only) */}
          <div className="md:hidden">
            <input type="checkbox" id="mobile-menu" className="hidden peer" />
            <label
              htmlFor="mobile-menu"
              className="flex items-center cursor-pointer text-offblack"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </label>

            <div className="fixed inset-0 bg-white shadow-lg hidden peer-checked:flex flex-col items-center justify-center space-y-6 text-offblack z-40">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className="text-lg font-medium hover:text-[#30B8C4] transition-colors"
                >
                  {route.label}
                </Link>
              ))}
              {user ? (
                <>
                  <span className="text-lg text-offblack">
                    Hello, {user.email?.split("@")[0] || "User"}!
                  </span>
                  <Link href="/profile" className="text-lg hover:text-[#30B8C4] transition-colors">
                    Profile
                  </Link>
                  <Link href="/signout" className="text-lg text-red-600 hover:text-red-700 transition-colors">
                    Sign Out
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-lg hover:text-[#30B8C4] transition-colors">
                    Log In
                  </Link>
                  <Link href="/signup" className="text-lg hover:text-[#30B8C4] transition-colors">
                    Sign Up
                  </Link>
                </>
              )}
              <Button
                variant="default"
                className="bg-[#30B8C4] text-white hover:bg-[#FFE5E5] hover:text-[#30B8C4]"
                asChild
              >
                <Link href="/signup">Start Your Journey Together</Link>
              </Button>

              {/* Close Button */}
              <label
                htmlFor="mobile-menu"
                className="absolute top-6 right-6 cursor-pointer text-offblack"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </label>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}