// components/Navbar.tsx
"use client"

import type React from "react"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client" // Client-side client
import type { User } from "@supabase/supabase-js"
import { Menu, X } from "lucide-react"

const NoPrefetchLink = ({ href, children, ...props }: React.ComponentProps<typeof Link>) => (
  <Link href={href} prefetch={false} {...props}>
    {children}
  </Link>
)

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      if (error) {
        console.error(`[Navbar] Error fetching session: ${error.message}`)
        setIsLoggedIn(false)
        setUser(null)
        return
      }
      setIsLoggedIn(!!session)
      setUser(session?.user ?? null)
    }
    checkAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(
        `[Navbar] Auth event: ${event}, Session: ${session ? "active" : "none"}, User: ${session?.user?.email || "none"}`,
      )
      setIsLoggedIn(!!session)
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleSignout = async () => {
    await supabase.auth.signOut()
    setIsOpen(false)
    router.push("/")
  }

  // Update the navItems array to remove "Create a Trip" since we'll make it a special CTA
  const navItems = [
    { name: "Home", href: "/" },
    { name: "Directory", href: "/directory" },
    { name: "About", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Contact", href: "/contact" },
  ]

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

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-offblack hover:text-[#30B8C4] focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Update the desktop navigation section to include a prominent CTA */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <NoPrefetchLink
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-offblack hover:text-[#FFE5E5] transition-colors"
              >
                {item.name}
              </NoPrefetchLink>
            ))}
            <NoPrefetchLink
              href="/create-trip"
              className="text-sm font-medium bg-brand-teal text-white hover:bg-brand-pink transition-colors px-4 py-2 rounded-full flex items-center gap-1 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1"
              >
                <path d="M12 5v14M5 12h14"></path>
              </svg>
              Create a Trip
            </NoPrefetchLink>
            {isLoggedIn && user ? (
              <>
                <span className="text-sm text-offblack">{user.email?.split("@")[0]}</span>
                <NoPrefetchLink
                  href="/profile"
                  className="text-sm font-medium text-offblack hover:text-[#FFE5E5] transition-colors"
                >
                  Profile
                </NoPrefetchLink>
                <button
                  onClick={handleSignout}
                  className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <NoPrefetchLink
                  href="/login"
                  className="text-sm font-medium text-[#30B8C4] hover:text-[#FFE5E5] transition-colors"
                >
                  Log In
                </NoPrefetchLink>
                <NoPrefetchLink
                  href="/signup"
                  className="text-sm font-medium text-[#30B8C4] hover:text-[#FFE5E5] transition-colors"
                >
                  Sign Up
                </NoPrefetchLink>
              </>
            )}
          </nav>
        </div>

        {isOpen && (
          // Update the mobile menu to include the prominent CTA at the top
          <nav className="md:hidden flex flex-col items-center space-y-2 py-4 bg-white border-t border-gray-200">
            <NoPrefetchLink
              href="/create-trip"
              onClick={() => setIsOpen(false)}
              className="text-lg font-medium bg-brand-teal text-white hover:bg-brand-pink transition-colors px-6 py-3 rounded-full flex items-center gap-2 shadow-md w-full max-w-xs justify-center mb-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1"
              >
                <path d="M12 5v14M5 12h14"></path>
              </svg>
              Create a Trip
            </NoPrefetchLink>

            {navItems.map((item) => (
              <NoPrefetchLink
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="text-lg font-medium text-offblack hover:text-[#30B8C4] transition-colors"
              >
                {item.name}
              </NoPrefetchLink>
            ))}

            {/* Divider */}
            <div className="h-px bg-gray-200 my-2 w-full"></div>

            {isLoggedIn && user ? (
              <>
                <span className="text-lg text-offblack">{user.email?.split("@")[0]}</span>
                <NoPrefetchLink
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-medium text-offblack hover:text-[#30B8C4] transition-colors"
                >
                  Profile
                </NoPrefetchLink>
                <button
                  onClick={handleSignout}
                  className="text-lg font-medium text-red-600 hover:text-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <NoPrefetchLink
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-medium text-[#30B8C4] hover:text-[#FFE5E5] transition-colors"
                >
                  Log In
                </NoPrefetchLink>
                <NoPrefetchLink
                  href="/signup"
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-medium text-[#30B8C4] hover:text-[#FFE5E5] transition-colors"
                >
                  Sign Up
                </NoPrefetchLink>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}

