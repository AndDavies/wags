// components/NavLink.tsx
import Link from 'next/link';
import React from 'react';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

const NavLink = ({ href, children }: NavLinkProps) => {
  return (
    <Link
      href={href}
      className="relative group text-sm font-medium text-black dark:text-white transition-colors"
    >
      {children}
      <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-primary transition-all duration-300 group-hover:w-full" />
    </Link>
  );
};

export default NavLink;
