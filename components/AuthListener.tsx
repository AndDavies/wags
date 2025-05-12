"use client";

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import type { Subscription, Session } from '@supabase/supabase-js';
import { useTripStore, TripData } from '@/store/tripStore';
import { savePendingItineraryAction } from '@/lib/actions/itineraryActions';

// This component handles client-side auth state changes, 
// including the post-OAuth redirect logic.
export default function AuthListener({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const { clearTrip } = useTripStore();
  // Ref to ensure initial check runs only once
  const initialCheckPerformed = useRef(false);
  // Ref to ensure pending action is processed only once per session establishment
  const pendingActionProcessed = useRef(false);

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

    // --- Setup listener for auth events --- 
    console.log('[AuthListener] Setting up onAuthStateChange listener.');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthListener] Listener Event: ${event}`, session ? `User: ${session.user.id}` : `Session: none`);
      
      // Handle the SIGNED_IN event specifically for processing pending actions
      if (event === 'SIGNED_IN' && session && !pendingActionProcessed.current) {
        console.log('[AuthListener] SIGNED_IN event detected. Checking for pending actions...');
        pendingActionProcessed.current = true; // Mark as processed for this session instance

        const redirectPath = localStorage.getItem('post_auth_redirect') || '/';
        const pendingActionString = localStorage.getItem('pending_auth_action');

        console.log(`[AuthListener] SIGNED_IN - redirectPath: ${redirectPath}, pendingActionString exists: ${!!pendingActionString}`);

        if (pendingActionString) {
          localStorage.removeItem('pending_auth_action'); // Attempt to clear immediately
          localStorage.removeItem('post_auth_redirect');
          console.log('[AuthListener] Cleared localStorage items.');

          try {
            const pendingAction = JSON.parse(pendingActionString);
            console.log('[AuthListener] Parsed pending action:', pendingAction?.action);

            if (pendingAction.action === 'save_final_itinerary' && pendingAction.payload && session.user.id) {
              console.log('[AuthListener] Found save_final_itinerary action. Calling server action...');
              
              // Call the server action to save the itinerary
              const result = await savePendingItineraryAction(session.user.id, pendingAction.payload as TripData);

              if (result.success) {
                console.log('[AuthListener] Server action successful. Redirecting now.');
                router.push(redirectPath);
              } else {
                console.error('[AuthListener] Server action failed:', result.error);
                // Redirect anyway, but maybe show an error? Or redirect to an error page?
                // For now, just redirect to the intended path.
                router.push(redirectPath + '?saveError=' + encodeURIComponent(result.error || 'Unknown save error'));
              }
              
            } else {
              console.log('[AuthListener] Pending action was not save_final_itinerary or payload missing. Redirecting normally.');
              router.push(redirectPath);
            }
          } catch (e) {
            console.error('[AuthListener] Error parsing or processing pending action:', e);
            // Redirect even if parsing fails, maybe with an error indicator
            router.push(redirectPath + '?parseError=true');
          }
        } else {
            // No pending action, just redirect
            console.log('[AuthListener] No pending action found. Redirecting normally.');
            localStorage.removeItem('post_auth_redirect'); // Ensure it's cleared
            router.push(redirectPath);
        }

      } else if (event === 'SIGNED_OUT') {
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