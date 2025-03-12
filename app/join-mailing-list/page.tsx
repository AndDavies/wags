// app/join-mailing-list/page.tsx
"use client";

import type React from "react";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { PawPrint, Mail, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function JoinOurPackPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Call the /api/subscribe endpoint
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to subscribe");
      }

      // Show success state on successful response
      setIsSubmitted(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "There was a problem submitting your email. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-brand-pink/5 to-brand-teal/5 py-20">
      <div className="container mx-auto px-4 pt-10">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/" className="inline-block mb-6">
              <Image
                src="/wags_and_wanders_logo_trans.png"
                alt="Wags & Wanders"
                width={100}
                height={100}
                className="mx-auto"
              />
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-brand-teal mb-4">Join Our Pack</h1>
            <p className="text-lg text-gray-600 max-w-lg mx-auto">
              Subscribe to our newsletter for exclusive pet travel tips, destination guides, and special offers.
            </p>
          </motion.div>

          {/* Main Content */}
          <motion.div
            className="bg-white rounded-xl shadow-md overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="p-6 md:p-8">
              {isSubmitted ? (
                <div className="text-center py-8">
                  <div className="bg-green-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-semibold text-brand-teal mb-2">Welcome to the Pack!</h2>
                  <p className="text-gray-600 mb-6">
                    Thank you for subscribing to our newsletter. We can't wait to share our pet travel adventures with
                    you!
                  </p>
                  <Button asChild className="bg-brand-teal hover:bg-brand-pink text-white">
                    <Link href="/">Return to Homepage</Link>
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-brand-pink/20 p-2 rounded-full">
                      <Mail className="h-5 w-5 text-brand-teal" />
                    </div>
                    <h2 className="text-xl font-semibold text-brand-teal">Subscribe to Our Newsletter</h2>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm mb-4">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700">
                        Your Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-teal"
                        required
                      />
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox id="privacy" name="privacy" required />
                      <Label htmlFor="privacy" className="text-sm text-gray-600">
                        I agree to receive emails from Wags & Wanders. You can unsubscribe at any time. View our{" "}
                        <Link href="/privacy" className="text-brand-teal hover:underline">
                          Privacy Policy
                        </Link>
                        .
                      </Label>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-brand-teal hover:bg-brand-pink text-white flex items-center justify-center gap-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Join Our Pack
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </motion.div>

          {/* Decorative Elements */}
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex justify-center gap-4">
              <PawPrint className="h-6 w-6 text-brand-teal opacity-20" />
              <PawPrint className="h-6 w-6 text-brand-teal opacity-40" />
              <PawPrint className="h-6 w-6 text-brand-teal opacity-60" />
              <PawPrint className="h-6 w-6 text-brand-teal opacity-80" />
              <PawPrint className="h-6 w-6 text-brand-teal" />
            </div>
          </motion.div>

          {/* Benefits */}
          <motion.div
            className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="bg-white p-5 rounded-lg shadow-sm">
              <h3 className="font-semibold text-brand-teal mb-2">Travel Tips</h3>
              <p className="text-sm text-gray-600">
                Get expert advice on traveling with pets to make your journeys smooth and enjoyable.
              </p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm">
              <h3 className="font-semibold text-brand-teal mb-2">Exclusive Offers</h3>
              <p className="text-sm text-gray-600">
                Receive special discounts and promotions from our pet-friendly partners.
              </p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm">
              <h3 className="font-semibold text-brand-teal mb-2">Community</h3>
              <p className="text-sm text-gray-600">
                Join a community of pet lovers who share your passion for adventure.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}