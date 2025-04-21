
After Phase 1: Verify email/password login now auto-saves the draft. Verify the useEffect in TripCreationForm is gone but the OAuth save still works (via AuthListener).
After Phase 2: Verify the "Save Draft" button works correctly for both logged-in and logged-out users (triggering the login flow). Verify "Generate My Trip" still works as before.
After Phase 3: Verify the post-OAuth redirect flow no longer shows the full homepage layout but goes through the (potentially blank) /auth/processing page before landing on /create-trip.

# Create-Trip Workflow Review & Refinement Tasks (Post-OAuth Fix)

## Summary

The core post-OAuth save mechanism is working, redirecting users back to `/create-trip` and saving the pending draft via `localStorage`. However, several areas need refinement for a top-tier user experience and consistent behavior.

## High-Impact Workflow & UX Improvements

1.  **Eliminate Homepage Flash (Post-OAuth Redirect):**
    *   **Issue:** Current flow (`Callback -> / -> AuthListener -> /create-trip`) shows a brief flash of the homepage.
    *   **Task (Option A - Recommended):** Create a minimal `/auth/processing` page. Modify `/auth/callback/route.ts` to redirect here instead of `/`. This processing page should render only the `AuthListener` (or similar) to handle the `localStorage` check and final redirect to `/create-trip` or `/`.

2.  **Unify Post-Login Save Behavior (OAuth vs. Email/Password):**
    *   **Issue:** OAuth auto-saves pending drafts, Email/Password does not.
    *   **Task:** Implement server-side auto-save for the Email/Password flow:
        *   Modify `app/login/page.tsx`: If `localStorage.getItem('pending_auth_action')` exists on load, add its value to a hidden input in the password login form.
        *   Modify `login` server action (`app/login/actions.ts`): Accept the hidden input. After successful `signInWithPassword`, check for pending action data. If `action === 'save_draft'`, perform the DB upsert *before* the final redirect. (Requires shared DB logic or API endpoint).

3.  **Remove Client-Side Post-Auth Check (Simplify `TripCreationForm`):**
    *   **Prerequisite:** Task #2 (Unified Post-Login Save) must be completed.
    *   **Task:** Remove the `useEffect` hook in `TripCreationForm` that checks `localStorage` for `pending_auth_action`. Remove the corresponding `localStorage.setItem` call from the save trigger.

4.  **Clarify "Save Draft" vs. "Generate Itinerary":**
    *   **Issue:** The "Generate My Trip" button currently handles both saving and AI generation.
    *   **Task:**
        *   Add an explicit "Save Draft" button to `TripCreationForm` that only calls `saveDraftToBackend(formData, false)`. Provide clear visual feedback on save.
        *   Ensure the main "Generate My Trip" button clearly indicates it will also save first (or rely on the explicit save).
        *   **(Optional):** Consider debounced auto-saving.

## State Management & Robustness Improvements

5.  **Solidify Initial Draft Loading (`TripBuilderClient`):**
    *   **Issue:** Logic for loading existing drafts (logged-in/guest) was commented out.
    *   **Task:** Uncomment, review, test, and potentially refactor the `useEffect` in `TripBuilderClient.tsx` that loads `initialDraft` (prop) or `sessionStorage` data into the Zustand store (`setTripData`) on mount. Ensure it correctly handles showing the form/modal/itinerary view based on the loaded draft's state.

6.  **Ensure Comprehensive Logout Cleanup:**
    *   **Issue:** Need to ensure complete state reset on logout.
    *   **Task:**
        *   Verify `clearTrip` action in `@/store/tripStore` fully resets all state fields.
        *   Add `sessionStorage.removeItem('tripData')` to the `SIGNED_OUT` handler in `AuthListener` to clear guest drafts.

## UI/UX & Feedback Improvements

7.  **Improve Loading States:**
    *   **Issue:** Basic loading states exist.
    *   **Task:** Enhance visual feedback for `isSavingDraft` (Save Draft button) and `isLoading` (Generate Trip button). Provide clear, distinct indicators and consider disabling relevant form parts during these operations.

8.  **Enhance Error Handling:**
    *   **Issue:** Generic error messages.
    *   **Task:** Make toast/error messages more specific, using details from `PostgrestError` or API responses where possible. Provide user guidance.

## Implementation Order Suggestion

1.  Unify Post-Login Save (#2 & #3)
2.  Implement "Save Draft" Button (#4)
3.  Fix Initial Draft Loading (#5)
4.  Refine Redirect (#1 - `/auth/processing` page)
5.  Improve Logout & Feedback (#6, #7, #8)
