"use client"; // Required for client-side hooks in Next.js App Router

import { useState, useEffect } from "react";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768); // Common mobile breakpoint
    };

    checkMobile(); // Initial check
    window.addEventListener("resize", checkMobile);

    // Cleanup listener on unmount
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
};

export { useIsMobile };