// components/Navbar.tsx
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
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
            <Link href="/" className="text-sm font-medium text-offblack hover:text-[#FFE5E5] transition-colors">Home</Link>
            <Link href="/services" className="text-sm font-medium text-offblack hover:text-[#FFE5E5] transition-colors">Services</Link>
            <Link href="/about" className="text-sm font-medium text-offblack hover:text-[#FFE5E5] transition-colors">About</Link>
            <Link href="/blog" className="text-sm font-medium text-offblack hover:text-[#FFE5E5] transition-colors">Blog</Link>
            <Link href="/contact" className="text-sm font-medium text-offblack hover:text-[#FFE5E5] transition-colors">Contact</Link>
            <Link href="/profile" className="text-sm font-medium text-offblack hover:text-[#FFE5E5] transition-colors">Profile</Link>
            <Link href="/login" className="text-sm font-medium text-[#30B8C4] hover:text-[#FFE5E5] transition-colors">Log In</Link>
            <Link href="/signup" className="text-sm font-medium text-[#30B8C4] hover:text-[#FFE5E5] transition-colors">Sign Up</Link>
            <Link href="/signout" className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors">Sign Out</Link>
          </nav>

          {/* Mobile Navigation (Static) */}
          <nav className="md:hidden flex flex-col items-center space-y-4 py-4">
            <Link href="/" className="text-lg font-medium text-offblack hover:text-[#30B8C4] transition-colors">Home</Link>
            <Link href="/services" className="text-lg font-medium text-offblack hover:text-[#30B8C4] transition-colors">Services</Link>
            <Link href="/about" className="text-lg font-medium text-offblack hover:text-[#30B8C4] transition-colors">About</Link>
            <Link href="/blog" className="text-lg font-medium text-offblack hover:text-[#30B8C4] transition-colors">Blog</Link>
            <Link href="/contact" className="text-lg font-medium text-offblack hover:text-[#30B8C4] transition-colors">Contact</Link>
            <Link href="/profile" className="text-lg font-medium text-offblack hover:text-[#30B8C4] transition-colors">Profile</Link>
            <Link href="/login" className="text-lg font-medium text-[#30B8C4] hover:text-[#FFE5E5] transition-colors">Log In</Link>
            <Link href="/signup" className="text-lg font-medium text-[#30B8C4] hover:text-[#FFE5E5] transition-colors">Sign Up</Link>
            <Link href="/signout" className="text-lg font-medium text-red-600 hover:text-red-700 transition-colors">Sign Out</Link>
          </nav>
        </div>
      </div>
    </header>
  );
}