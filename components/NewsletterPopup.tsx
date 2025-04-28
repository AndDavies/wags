"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Key for localStorage
const LOCAL_STORAGE_KEY = "newsletterPopupDismissed";
// Delay before showing the popup (in milliseconds)
const POPUP_DELAY = 10000; // 10 seconds
// How long to hide the popup after dismissal (in milliseconds)
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * @description A popup modal component to capture newsletter subscriptions via an embedded Beehiiv form.
 * It appears after a delay and uses localStorage to avoid showing repeatedly after dismissal.
 * @component NewsletterPopup
 * @returns {JSX.Element | null} The rendered popup component or null if dismissed.
 */
export const NewsletterPopup = (): JSX.Element | null => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true); // Start as dismissed until checked

  useEffect(() => {
    const dismissedTimestamp = localStorage.getItem(LOCAL_STORAGE_KEY);
    const now = Date.now();

    // Check if dismissed and if the dismissal period has expired
    if (!dismissedTimestamp || now > parseInt(dismissedTimestamp, 10)) {
      setIsDismissed(false); // Not dismissed or expired, eligible to show
      if (dismissedTimestamp) {
          // Clear expired timestamp
          localStorage.removeItem(LOCAL_STORAGE_KEY);
      }

      // Set timer to show the popup
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, POPUP_DELAY);

      // Cleanup timer on component unmount
      return () => clearTimeout(timer);
    } else {
        // Still within dismissal period
        setIsDismissed(true);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  /**
   * @description Handles the closing/dismissal of the popup.
   * Sets localStorage to prevent the popup from showing again for DISMISS_DURATION.
   */
  const handleDismiss = () => {
    const expiryTimestamp = Date.now() + DISMISS_DURATION;
    localStorage.setItem(LOCAL_STORAGE_KEY, expiryTimestamp.toString());
    setIsOpen(false);
    setIsDismissed(true); // Ensure it's marked as dismissed for the current session
  };

  // Don't render anything if the popup has been dismissed recently
  if (isDismissed && !isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-[480px] bg-white rounded-lg shadow-lg p-0">
        {/* Custom Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          aria-label="Close newsletter popup"
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="p-6 pt-8">
          <DialogHeader className="mb-4 text-center">
            <DialogTitle className="text-2xl font-bold text-black tracking-tight">
              Join the Pack!
            </DialogTitle>
            <DialogDescription className="text-base text-gray-700">
              Get exclusive pet travel tips, news, and offers delivered straight to your inbox.
            </DialogDescription>
          </DialogHeader>

          {/* Beehiiv Embed */}
          <div className="w-full h-[120px] overflow-hidden flex items-center justify-center">
             {/* Adjusted height and added basic styling for the iframe container */}
             <iframe
                src="https://embeds.beehiiv.com/3ebb3c0a-d2c2-425a-a779-9210da195adb?slim=true" // Added slim=true potentially for better fit
                data-test-id="beehiiv-embed"
                width="100%"
                height="100%" // Adjust height as needed, iframe content dictates its internal size
                frameBorder="0"
                scrolling="no"
                style={{
                  margin: 0,
                  backgroundColor: "transparent",
                  width: '100%',
                  height: '100%' // Ensure iframe takes full container space
                }}
                title="Beehiiv Newsletter Signup Form" // Added title for accessibility
             ></iframe>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 