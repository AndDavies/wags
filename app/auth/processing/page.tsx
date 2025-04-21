'use client';

import AuthListener from '@/components/AuthListener';
import { Loader2 } from 'lucide-react'; // Optional loading indicator
import { useEffect } from 'react'; // Import useEffect

// This page exists solely to host the AuthListener after the Supabase callback.
// AuthListener will handle checking localStorage and redirecting to the final destination.
export default function AuthProcessingPage() {

  // Add effect to log localStorage on mount
  useEffect(() => {
    const postAuth = localStorage.getItem('post_auth_redirect');
    const pendingAction = localStorage.getItem('pending_auth_action');
    console.log(`[AuthProcessingPage] Mounted. localStorage check: post_auth_redirect=${postAuth}, pending_auth_action exists=${!!pendingAction}`);
    
    // This effect runs only once on mount
  }, []);

  return (
    <AuthListener>
      {/* Optional: Render a loading indicator or a minimal message */}
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        {/* <p className="text-gray-500">Processing login...</p> */}
      </div>
    </AuthListener>
  );
} 