// app/login/actions.ts
"use server";

import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { getURL } from "@/lib/utils";
import { saveDraftItinerary } from "@/lib/supabase-server-utils";
import type { TripData } from "@/store/tripStore";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectPath = formData.get("redirectPath") as string | null;
  const pendingSaveDataString = formData.get("pendingSaveData") as string | null;

  let sessionUserId: string | null = null;
  let saveError: string | null = null;

  try {
    console.log('[Login Action] Attempting password sign-in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    
    if (signInError) {
      console.error(`[Login Action] Sign-in error: ${signInError.message}`);
      throw new Error(signInError.message || "Invalid login credentials."); 
    }

    if (!signInData.session?.user?.id) {
      console.error('[Login Action] Sign-in successful but no user session found.');
      throw new Error('Authentication successful, but failed to establish session.');
    }
    
    sessionUserId = signInData.session.user.id;
    console.log(`[Login Action] Sign-in successful for user: ${sessionUserId}`);

    if (pendingSaveDataString) {
      console.log('[Login Action] Found pending save data string:', pendingSaveDataString);
      try {
        const pendingAction = JSON.parse(pendingSaveDataString);
        console.log('[Login Action] Parsed pending action:', pendingAction);
        
        if (pendingAction.action === 'save_draft' && pendingAction.payload && sessionUserId) {
          console.log('[Login Action] Performing pending draft save...');
          const result = await saveDraftItinerary(sessionUserId, pendingAction.payload as Partial<TripData>);
          
          if ('error' in result) {
            saveError = result.error.message;
            console.error('[Login Action] Error saving pending draft:', saveError);
          } else {
            console.log('[Login Action] Pending draft saved successfully. Draft ID:', result.id);
          }
        }
      } catch (e) {
        console.error('[Login Action] Error parsing or processing pending save data:', e);
        saveError = e instanceof Error ? e.message : 'Failed processing pending save data.';
      }
    }

  } catch (err) {
    console.error('[Login Action] Caught error during login/session check:', err);
    throw err; 
  }

  if (saveError) {
     console.warn(`[Login Action] Redirecting after login, but pending save failed: ${saveError}`);
  }
  
  console.log(`[Login Action] Login process complete. Redirecting to: ${redirectPath || "/"}`);
  redirect(redirectPath || "/");
}

export async function loginWithGoogle(redirectPath?: string | null) {
  const supabase = await createClient();

  const callbackUrlBase = process.env.NODE_ENV === 'production'
    ? `${getURL()}auth/callback` 
    : 'http://localhost:3000/auth/callback';

  let finalRedirectToUrl = callbackUrlBase;
  if (redirectPath) {
    const path = redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`;
    finalRedirectToUrl = `${callbackUrlBase}?next=${encodeURIComponent(path)}`;
    console.log(`[Google Login] Appending final path. Full redirectTo for Supabase: ${finalRedirectToUrl}`);
  } else {
     console.log(`[Google Login] No final path provided. Using base callback URL for Supabase: ${callbackUrlBase}`);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: finalRedirectToUrl, 
    }
  });

  if (error) {
    console.error(`[Google Login] Error initiating OAuth: ${error.message}`);
    throw new Error(error.message);
  }

  if (data.url) {
    console.log(`[Google Login] Redirecting user to Google auth page: ${data.url}`);
    redirect(data.url); 
  } else {
    console.error('[Google Login] No redirect URL provided by Supabase');
    throw new Error("Could not initiate Google login");
  }
}