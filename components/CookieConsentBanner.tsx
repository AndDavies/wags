'use client';

import React from "react";
import CookieConsent from "react-cookie-consent";

/**
 * @description Renders a compact cookie consent banner using the react-cookie-consent library.
 * This component is designed to be used within a client-side context in a Next.js application.
 * It informs users about cookie usage and provides an option to accept.
 * Upon acceptance, it sets a cookie to remember the user's consent.
 * Styling follows the project's design guidelines (OriginUI-inspired) but is minimized.
 * @returns {JSX.Element | null} The cookie consent banner component or null if consent has been given.
 */
const CookieConsentBanner = () => {
  return (
    <CookieConsent
      location="bottom"
      buttonText="Accept"
      cookieName="wags-and-wanders-cookie-consent"
      style={{
        // Minimized container styling
        background: "#FFFFFF", // bg-white
        color: "#374151",      // text-gray-700
        padding: "0.75rem",     // p-3
        borderTop: "1px solid #E5E7EB", // border-t border-gray-200
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        fontSize: "13px",        // Smaller base font size
        lineHeight: "1.3",
        textAlign: "center",    // Center text
        // Narrower and centered
        maxWidth: "500px",
        margin: "0 auto 1rem auto", // Center horizontally, add bottom margin
        borderRadius: "0.5rem", // rounded-lg
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)", // shadow-md
      }}
      buttonStyle={{
        // Minimized button styling
        background: "#00CED1", // bg-teal-500
        color: "white",
        fontSize: "13px", // Smaller button font
        fontWeight: "500", // font-medium
        borderRadius: "0.375rem", // rounded-md
        padding: "0.4rem 1rem", // px-4 py-1.5 (approx)
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        marginLeft: "1rem", // Add some space between text and button
      }}
      expires={150}
      ariaAcceptLabel="Accept cookies"
    >
      We use cookies to improve your experience. By clicking Accept, you agree to our cookie use.
       {/* TODO: Link to a privacy policy page */}
       {/* <a href="/privacy-policy" style={{ color: '#00CED1', textDecoration: 'underline', marginLeft: '4px' }}>Learn more</a> */}
    </CookieConsent>
  );
};

export default CookieConsentBanner; 