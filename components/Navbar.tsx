"use client"

import type React from "react"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase-client" // Client-side client
import type { User } from "@supabase/supabase-js"
import { Menu, X, ChevronDown, LogOut, UserIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const NoPrefetchLink = ({ href, children, ...props }: React.ComponentProps<typeof Link>) => (
  <Link href={href} prefetch={false} {...props}>
    {children}
  </Link>
)

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const isHomePage = pathname === "/"
  const supabase = createClient()
  const userMenuRef = useRef<HTMLDivElement>(null)

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

    // Add scroll event listener
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)

    // Close user menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener("scroll", handleScroll)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [supabase])

  const handleSignout = async () => {
    await supabase.auth.signOut()
    setIsOpen(false)
    setUserMenuOpen(false)
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

  // Use frosted glass effect when not scrolled, white background when scrolled
  const navbarBgClass = scrolled ? "bg-white shadow-md" : "bg-white/30 backdrop-blur-md backdrop-saturate-150"

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navbarBgClass}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Brand Name */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            <NoPrefetchLink href="/" className="flex items-center space-x-2 group">
              <div className="relative overflow-hidden rounded-full transition-all duration-300 group-hover:shadow-md">
                <Image
                  src="/wags_and_wanders_logo_trans.png"
                  alt="Wags & Wanders"
                  width={40}
                  height={40}
                  className="w-10 h-10 transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <span className="text-xl font-semibold text-[#249ab4] transition-colors duration-300 group-hover:text-[#FFA9DE]">
                Wags & Wanders
              </span>
            </NoPrefetchLink>
          </motion.div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-[#249ab4] hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-[#249ab4]/20"
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))

              return (
                <NoPrefetchLink
                  key={item.name}
                  href={item.href}
                  className={`relative px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 ${
                    isActive ? "text-[#249ab4]" : "text-gray-700 hover:text-[#249ab4] hover:bg-gray-50"
                  }`}
                >
                  {item.name}
                  {isActive && (
                    <motion.span
                      layoutId="navbar-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#249ab4]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </NoPrefetchLink>
              )
            })}

            {/* Create Trip Button */}
            <NoPrefetchLink
              href="/create-trip"
              className="ml-2 px-4 py-2 bg-[#30B8C4] text-white rounded-md text-sm font-medium hover:bg-[#249ab4] transition-all duration-300 shadow-sm hover:shadow transform hover:-translate-y-0.5"
            >
              Create Trip
            </NoPrefetchLink>

            {/* Authentication Links */}
            {isLoggedIn && user ? (
              <div className="relative ml-4" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#249ab4]/10 flex items-center justify-center text-[#249ab4]">
                    <span className="font-medium">{user.email?.[0].toUpperCase() || "U"}</span>
                  </div>
                  <span className="hidden lg:inline-block">{user.email?.split("@")[0]}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-300 ${userMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-20 border border-gray-200"
                    >
                      <NoPrefetchLink
                        href="/profile"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
                        Profile
                      </NoPrefetchLink>
                      <button
                        onClick={handleSignout}
                        className="flex items-center w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center ml-4 space-x-2">
                <NoPrefetchLink
                  href="/login"
                  className="px-3 py-2 text-sm font-medium text-[#249ab4] hover:text-[#FFA9DE] transition-colors"
                >
                  Log In
                </NoPrefetchLink>
                <NoPrefetchLink
                  href="/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#249ab4] rounded-md hover:bg-[#249ab4]/90 transition-colors shadow-sm hover:shadow"
                >
                  Sign Up
                </NoPrefetchLink>
              </div>
            )}
          </nav>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden bg-white border-t border-gray-100"
            >
              <div className="py-2 space-y-1">
                {/* Add the Create Trip button at the top for mobile */}
                <NoPrefetchLink
                  href="/create-trip"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center mx-4 my-3 px-4 py-2.5 bg-[#30B8C4] text-white rounded-md text-base font-medium hover:bg-[#249ab4] transition-colors"
                >
                  Create Trip
                </NoPrefetchLink>

                {navItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))

                  return (
                    <NoPrefetchLink
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`block px-4 py-2.5 text-base font-medium ${
                        isActive
                          ? "text-[#249ab4] bg-[#30B8C4]/10"
                          : "text-gray-700 hover:bg-gray-50 hover:text-[#249ab4]"
                      }`}
                    >
                      {item.name}
                    </NoPrefetchLink>
                  )
                })}

                {/* Divider */}
                <div className="h-px bg-gray-200 my-2 mx-4"></div>

                {isLoggedIn && user ? (
                  <>
                    <div className="px-4 py-2 text-sm text-gray-500">
                      Signed in as <span className="font-medium text-gray-900">{user.email}</span>
                    </div>
                    <NoPrefetchLink
                      href="/profile"
                      onClick={() => setIsOpen(false)}
                      className="block px-4 py-2.5 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-[#249ab4]"
                    >
                      Profile
                    </NoPrefetchLink>
                    <button
                      onClick={handleSignout}
                      className="block w-full text-left px-4 py-2.5 text-base font-medium text-red-600 hover:bg-red-50"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <NoPrefetchLink
                      href="/login"
                      onClick={() => setIsOpen(false)}
                      className="block px-4 py-2.5 text-base font-medium text-[#30B8C4] hover:bg-[#30B8C4]/10"
                    >
                      Log In
                    </NoPrefetchLink>
                    <NoPrefetchLink
                      href="/signup"
                      onClick={() => setIsOpen(false)}
                      className="block px-4 py-2.5 text-base font-medium text-[#30B8C4] hover:bg-[#30B8C4]/10"
                    >
                      Sign Up
                    </NoPrefetchLink>
                  </>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
