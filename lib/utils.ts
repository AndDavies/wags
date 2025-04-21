import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Constructs the absolute base URL for the application based on environment variables.
 * Prioritizes NEXT_PUBLIC_SITE_URL, then NEXT_PUBLIC_VERCEL_URL, falling back to localhost.
 * Ensures the URL starts with http/https and ends with a trailing slash.
 * 
 * @returns {string} The absolute base URL.
 */
export const getURL = (): string => {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process.env.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    'http://localhost:3000/'; // Default to localhost

  // Make sure to include `https://` when not localhost.
  url = url.includes('http') ? url : `https://${url}`;
  // Make sure to include a trailing `/`.
  url = url.endsWith('/') ? url : `${url}/`;

  // console.log(`[getURL] Determined base URL: ${url}`); // Optional: for debugging
  return url;
};

// Add other general utility functions here if needed
