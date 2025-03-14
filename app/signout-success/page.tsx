// app/signout-success/page.tsx
"use client";

import { useEffect } from "react";

export default function SignoutSuccess() {
  useEffect(() => {
    // Force full reload to root
    window.location.href = "/";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Signing out...</p>
    </div>
  );
}