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
  // Use a ref to prevent the effect logic from running multiple times unnecessarily on HMR
  const checkedInitialSession = useRef(false);

  useEffect(() => {
    console.log('[AuthListener] useEffect running.');

    // --- Function to check localStorage and redirect ---
    const checkAndRedirect = () => {
      const redirectPath = localStorage.getItem('post_auth_redirect');
      console.log(`[AuthListener] checkAndRedirect: Found path in localStorage: ${redirectPath}`);
      if (redirectPath) {
        console.log(`[AuthListener] checkAndRedirect: Redirecting to ${redirectPath}...`);
        localStorage.removeItem('post_auth_redirect');
        router.push(redirectPath);
        return true; // Indicate redirect was attempted
      }
      return false; // Indicate no redirect path found
    };
    // --- End function ---

    // 1. Check immediately if there's a redirect path and an active session might exist
    //    Only do this on the initial mount, not on subsequent re-renders.
    if (!checkedInitialSession.current) {
      console.log('[AuthListener] Running initial session check.');
      // Check localStorage first
      const redirectPath = localStorage.getItem('post_auth_redirect');
      if (redirectPath) {
        // If path exists, check if session is already active 
        supabase.auth.getSession().then(({ data: { session } }) => {
          console.log('[AuthListener] Initial getSession result:', session ? 'Active' : 'Inactive');
          if (session) { // If session is active *and* we have a path, redirect.
            checkAndRedirect();
          }
        });
      }
      checkedInitialSession.current = true;
    }

    // 2. Set up the state change listener
    console.log('[AuthListener] Setting up onAuthStateChange listener.');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[AuthListener] Auth event: ${event}`, session ? `Session: active` : `Session: none`);
      
      if (event === 'SIGNED_IN') {
        console.log('[AuthListener] SIGNED_IN event detected. Running checkAndRedirect.');
        checkAndRedirect();
      }
      else if (event === 'SIGNED_OUT') {
        console.log('[AuthListener] SIGNED_OUT event detected. Clearing trip store.');
        clearTrip();
      }
    });

    // Cleanup
    return () => {
      console.log('[AuthListener] Cleaning up auth listener.');
      subscription?.unsubscribe();
    };
  }, [supabase, router, clearTrip]);

  // Render the children wrapped by this listener
  return <>{children}</>;
} 