"use client";

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import type { Subscription, Session } from '@supabase/supabase-js';
import { useTripStore } from '@/store/tripStore';

// This component handles client-side auth state changes, 
// including the post-OAuth redirect logic.
export default function AuthListener({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const { clearTrip } = useTripStore();
  // Ref to ensure initial check runs only once
  const initialCheckPerformed = useRef(false);

  useEffect(() => {
    console.log('[AuthListener] useEffect running.');

    // --- Only perform check on initial mount --- 
    if (!initialCheckPerformed.current) {
      initialCheckPerformed.current = true; // Mark as performed immediately
      console.log('[AuthListener] Performing initial check...');

      const redirectPath = localStorage.getItem('post_auth_redirect');
      console.log(`[AuthListener] Initial check - found redirectPath: ${redirectPath}`);

      if (redirectPath) {
        // If a redirect path exists, check session status
        supabase.auth.getSession().then(({ data: { session } }) => {
          console.log('[AuthListener] Initial getSession result:', session ? 'Active' : 'Inactive');
          if (session) { // If session is active AND we have a redirect path
            console.log(`[AuthListener] Session active and redirectPath found. Redirecting to ${redirectPath}...`);
            localStorage.removeItem('post_auth_redirect'); // Clear before redirect
            router.push(redirectPath); 
            // NOTE: No further listener logic needed JUST for this redirect
          } else {
            // Session not active yet, maybe clear redirect path?
            console.warn('[AuthListener] Redirect path found, but no active session on initial check.');
            localStorage.removeItem('post_auth_redirect'); // Clear invalid redirect instruction
          }
        });
      } else {
         console.log('[AuthListener] No post-auth redirect path found on initial check.');
      }
    }

    // --- Setup listener ONLY for other events (like SIGNED_OUT) ---
    console.log('[AuthListener] Setting up onAuthStateChange listener for other events (e.g., SIGNED_OUT).');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Log events but don't handle the SIGNED_IN redirect here anymore
      console.log(`[AuthListener] Listener Event: ${event}`, session ? `Session: active` : `Session: none`);
      
      if (event === 'SIGNED_OUT') {
        console.log('[AuthListener] SIGNED_OUT event detected. Clearing trip store.');
        clearTrip();
        sessionStorage.removeItem('tripData'); // Also clear guest draft
      }
    });

    // Cleanup
    return () => {
      console.log('[AuthListener] Cleaning up auth listener.');
      subscription?.unsubscribe();
    };
  // Add supabase, router, clearTrip to dependencies
  }, [supabase, router, clearTrip]);

  // Render the children wrapped by this listener
  return <>{children}</>;
} 