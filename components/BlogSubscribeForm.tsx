// components/BlogSubscribeForm.tsx
"use client";

import Image from "next/image";
import { Mail, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscribe } from "@/hooks/useSubscribe";

export const BlogSubscribeForm = () => {
  const { email, setEmail, isSubmitting, isSubmitted, error, handleSubmit } = useSubscribe();

  return (
    <section className="py-16 bg-gradient-to-r from-brand-teal/10 to-brand-pink/10">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-5">
            <div className="md:col-span-2 relative h-48 md:h-auto">
              <Image
                src="/placeholders/hero_floating_wags_and_wanders_5.png"
                alt="Dog with travel bag"
                fill
                className="object-cover"
              />
            </div>

            <div className="p-6 md:p-8 md:col-span-3">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-brand-pink/20 p-2 rounded-full">
                  <Mail className="h-5 w-5 text-brand-teal" />
                </div>
                <h3 className="text-xl font-semibold text-brand-teal">Subscribe to Our Blog</h3>
              </div>

              {isSubmitted ? (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">🎉 Welcome to the pack!</span>
                </div>
              ) : (
                <>
                  <p className="text-offblack mb-6">
                    Get the latest pet travel tips, stories, and guides delivered straight to your inbox.
                  </p>

                  {error && (
                    <div className="text-red-500 bg-red-50 p-3 rounded-md text-sm mb-4">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="email"
                        placeholder="Your email address"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-teal"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      <Button
                        type="submit"
                        className="bg-brand-teal text-white hover:bg-brand-pink"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Subscribing...
                          </>
                        ) : (
                          "Subscribe"
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-offblack/60">We respect your privacy. Unsubscribe at any time.</p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
