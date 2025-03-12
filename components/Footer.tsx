// components/Footer.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, Heart, Loader2, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button"; // Added import

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to subscribe");
      }

      setIsSubmitted(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to subscribe. Please try again!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-gradient-to-r from-brand-teal/10 via-brand-pink/10 to-brand-teal/10 border-t border-brand-teal/20">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        {/* Top section with logo and description */}
        <div className="flex flex-col items-center mb-12 text-center">
          <div className="mb-6 relative w-[180px] h-[60px]">
            <Image
              src="/wags_and_wanders_logo_trans.png"
              alt="Wags & Wanders"
              fill
              className="object-contain"
              sizes="180px"
            />
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Making pet travel stress-free and tail-waginly easy for pet owners around the globe.
          </p>
          <div className="flex space-x-6 mt-6">
            <a href="#" className="text-brand-teal hover:text-brand-pink transition-colors" aria-label="Facebook">
              <Facebook className="h-6 w-6" />
            </a>
            <a href="#" className="text-brand-teal hover:text-brand-pink transition-colors" aria-label="Instagram">
              <Instagram className="h-6 w-6" />
            </a>
            <a href="#" className="text-brand-teal hover:text-brand-pink transition-colors" aria-label="Twitter">
              <Twitter className="h-6 w-6" />
            </a>
            <a href="#" className="text-brand-teal hover:text-brand-pink transition-colors" aria-label="LinkedIn">
              <Linkedin className="h-6 w-6" />
            </a>
          </div>
        </div>

        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <h3 className="text-lg font-semibold text-brand-teal mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Mail className="h-5 w-5 mr-2 text-brand-teal flex-shrink-0 mt-0.5" />
                <a
                  href="mailto:hello@wagsandwanders.com"
                  className="text-gray-600 hover:text-brand-teal transition-colors"
                >
                  hello@wagsandwanders.com
                </a>
              </li>
              <li className="flex items-start">
                <Phone className="h-5 w-5 mr-2 text-brand-teal flex-shrink-0 mt-0.5" />
                <a href="tel:+12894725592" className="text-gray-600 hover:text-brand-teal transition-colors">
                  +1 (289) 472-5592
                </a>
              </li>
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-2 text-brand-teal flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">Toronto, Canada</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-brand-teal mb-4">Solutions</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/directory"
                  className="text-gray-600 hover:text-brand-teal transition-colors flex items-center"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-teal mr-2"></span>
                  Pet-Friendly Directory
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-brand-teal mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-600 hover:text-brand-teal transition-colors flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-teal mr-2"></span>
                  About
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-600 hover:text-brand-teal transition-colors flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-teal mr-2"></span>
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-brand-teal mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/faq" className="text-gray-600 hover:text-brand-teal transition-colors flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-teal mr-2"></span>
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-600 hover:text-brand-teal transition-colors flex items-center"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-teal mr-2"></span>
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-600 hover:text-brand-teal transition-colors flex items-center"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-teal mr-2"></span>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-brand-teal transition-colors flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-teal mr-2"></span>
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter subscription with enhanced functionality */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-12 border border-brand-pink/20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <div className="lg:col-span-2">
              <h3 className="text-xl font-semibold text-brand-teal mb-2">Stay Updated</h3>
              <p className="text-gray-600">Subscribe to our newsletter for the latest pet travel tips and updates.</p>
            </div>
            <div>
              {isSubmitted ? (
                <div className="text-center py-2">
                  <div className="bg-green-50 rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-sm text-gray-600">Welcome to the Pack!</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      placeholder="Your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-teal disabled:opacity-50"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-red-700 text-sm">
                      {error}
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="w-full bg-brand-teal hover:bg-brand-pink text-white rounded-full flex items-center justify-center gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Subscribe
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Bottom section with copyright */}
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-center md:text-left mb-4 md:mb-0">
            © {currentYear} Wags & Wanders. All rights reserved.
          </p>
          <div className="flex items-center text-gray-500">
            <span>Made with</span>
            <Heart className="h-4 w-4 mx-1 text-brand-pink" />
            <span>for pets and their humans</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;