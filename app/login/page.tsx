// app/login/page.tsx (partial update)
"use client";

import { useState } from "react";
import Link from "next/link";
import { login } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (formData: FormData) => {
    setIsSubmitting(true);
    setError("");

    try {
      await login(formData); // Server handles redirect
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-brand-teal/5 to-brand-pink/5">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-display text-brand-teal">Welcome Back</h1>
          <p className="mt-2 text-sm text-offblack">Log in to your Wags & Wanders account</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <form action={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-offblack">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1"
              placeholder="you@example.com"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-offblack">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1"
              placeholder="••••••••"
              disabled={isSubmitting}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-brand-teal hover:bg-brand-pink text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging In...
              </>
            ) : (
              "Log In"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-offblack">
          Don’t have an account?{' '}
          <Link href="/signup" className="text-brand-teal hover:text-brand-pink">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}