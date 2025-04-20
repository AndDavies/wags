// app/signup/page.tsx
"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { useSearchParams } from 'next/navigation'
import { signup } from "./actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Mail, Lock, User, Loader2 } from "lucide-react"

function SignupForm() {
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get('redirect')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSignup = async (formData: FormData) => {
    setIsSubmitting(true)
    setError("")

    try {
      await signup(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-md w-full space-y-8">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link href="/" className="inline-block">
          <Image
            src="/wags_and_wanders_logo_trans.png"
            alt="Wags & Wanders"
            width={80}
            height={80}
            className="mx-auto"
          />
        </Link>
        <h2 className="mt-6 text-3xl font-display text-brand-teal">Join Wags & Wanders</h2>
        <p className="mt-2 text-sm text-offblack">Create an account to start planning your pet travel adventures</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="border-none shadow-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Sign Up</CardTitle>
            <CardDescription className="text-center">Enter your details to create your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
            )}

            <form action={handleSignup}>
              <input type="hidden" name="redirectPath" value={redirectParam || ""} />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-offblack">
                    Full Name (Optional)
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      className="pl-10 bg-white"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-offblack">
                    Email
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="pl-10 bg-white"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-offblack">
                    Password
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      className="pl-10 bg-white"
                      placeholder="••••••••"
                    />
                  </div>
                  <p className="text-xs text-offblack/60">Password must be at least 8 characters long</p>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox id="terms" name="terms" required />
                  <Label htmlFor="terms" className="text-sm font-normal text-offblack leading-tight">
                    I agree to the{" "}
                    <Link href="/terms" className="text-brand-teal hover:text-brand-pink">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-brand-teal hover:text-brand-pink">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-brand-teal hover:bg-brand-pink text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating account...
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-offblack/60">or</span>
              </div>
            </div>

            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-brand-teal hover:text-brand-pink">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="min-h-screen bg-gradient-to-r from-brand-teal/5 to-brand-pink/5 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <SignupForm />
      </div>
    </Suspense>
  )
}