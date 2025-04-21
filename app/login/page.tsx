"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from 'next/navigation';
import { login } from "./actions";
import { createClient } from '@/lib/supabase-client';
import { getURL } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const supabase = createClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const callbackError = searchParams.get('error');
    const errorMessage = searchParams.get('message');
    if (callbackError) {
      setError(errorMessage || `Authentication failed: ${callbackError}`);
      router.replace('/login', { scroll: false });
    }
  }, [searchParams, router]);

  const handleLogin = async (formData: FormData) => {
    setIsSubmitting(true);
    setError("");
    try {
      await login(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      if (redirectParam) {
        console.log(`[Login Page] Storing post-auth redirect in localStorage: ${redirectParam}`);
        localStorage.setItem('post_auth_redirect', redirectParam);
      } else {
        localStorage.removeItem('post_auth_redirect');
      }

      const callbackUrl = process.env.NODE_ENV === 'production'
        ? `${getURL()}auth/callback`
        : 'http://localhost:3000/auth/callback';
      
      console.log(`[Login Page] Initiating Google OAuth with callback: ${callbackUrl}`);

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
        },
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err) {
      console.error("[Login Page] Google login error:", err);
      setError(err instanceof Error ? err.message : "Google login failed. Please try again.");
      localStorage.removeItem('post_auth_redirect');
      setIsSubmitting(false);
    }
  };

  return (
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
        <input type="hidden" name="redirectPath" value={redirectParam || ""} />

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

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-offblack/60">or</span>
        </div>
      </div>

      <Button
        onClick={handleGoogleLogin}
        className="w-full bg-white border border-gray-300 text-offblack hover:bg-gray-100 flex items-center justify-center gap-2"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </>
        )}
      </Button>

      <p className="text-center text-sm text-offblack">
        Don't have an account?{' '}
        <Link href="/signup" className="text-brand-teal hover:text-brand-pink">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-brand-teal/5 to-brand-pink/5">
        <LoginForm />
      </div>
    </Suspense>
  );
}