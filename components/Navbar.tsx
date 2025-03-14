// components/Navbar.tsx
import Link from "next/link";
import Image from "next/image";

// Custom Link component to disable prefetching
const NoPrefetchLink = ({ href, children, ...props }: React.ComponentProps<typeof Link>) => (
  <Link href={href} prefetch={false} {...props}>
    {children}
  </Link>
);

export default function Navbar() {
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
            <NoPrefetchLink href="/profile" className="text-sm font-medium text-offblack hover:text-[#FFE5E5] transition-colors">Profile</NoPrefetchLink>
            <NoPrefetchLink href="/login" className="text-sm font-medium text-[#30B8C4] hover:text-[#FFE5E5] transition-colors">Log In</NoPrefetchLink>
            <NoPrefetchLink href="/signup" className="text-sm font-medium text-[#30B8C4] hover:text-[#FFE5E5] transition-colors">Sign Up</NoPrefetchLink>
            <NoPrefetchLink href="/signout" className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors">Sign Out</NoPrefetchLink>
          </nav>

          <nav className="md:hidden flex flex-col items-center space-y-2 py-4">
            <NoPrefetchLink href="/" className="text-lg font-medium text-offblack hover:text-[#30B8C4] transition-colors">Home</NoPrefetchLink>
            <NoPrefetchLink href="/services" className="text-lg font-medium text-offblack hover:text-[#30B8C4] transition-colors">Services</NoPrefetchLink>
            <NoPrefetchLink href="/about" className="text-lg font-medium text-offblack hover:text-[#30B8C4] transition-colors">About</NoPrefetchLink>
            <NoPrefetchLink href="/blog" className="text-lg font-medium text-offblack hover:text-[#30B8C4] transition-colors">Blog</NoPrefetchLink>
            <NoPrefetchLink href="/contact" className="text-lg font-medium text-offblack hover:text-[#30B8C4] transition-colors">Contact</NoPrefetchLink>
            <NoPrefetchLink href="/profile" className="text-lg font-medium text-offblack hover:text-[#30B8C4] transition-colors">Profile</NoPrefetchLink>
            <NoPrefetchLink href="/login" className="text-lg font-medium text-[#30B8C4] hover:text-[#FFE5E5] transition-colors">Log In</NoPrefetchLink>
            <NoPrefetchLink href="/signup" className="text-lg font-medium text-[#30B8C4] hover:text-[#FFE5E5] transition-colors">Sign Up</NoPrefetchLink>
            <NoPrefetchLink href="/signout" className="text-lg font-medium text-red-600 hover:text-red-700 transition-colors">Sign Out</NoPrefetchLink>
          </nav>
        </div>
      </div>
    </header>
  );
}