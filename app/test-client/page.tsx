"use client";

import { createClient } from '@/lib/supabase-client';

export default function TestClientPage() {
  const supabase = createClient();
  console.log('Client Component Supabase:', supabase);
  return <div>Check the console for the Supabase client.</div>;
}