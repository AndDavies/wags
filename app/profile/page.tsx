// app/profile/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import Image from 'next/image';
import Link from 'next/link';
import { PawPrint, User, Mail, MapPin, Plus, Settings, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ProfilePage() {
  const supabase = await createClient();
  console.log("Profile page executing with supabase:", supabase); // Debug log

  const { data: userData, error: userError } = await supabase.auth.getUser();
  console.log("User data from getUser:", userData, "Error:", userError); // Debug log
  if (userError || !userData?.user) {
    console.log("Redirecting to /login due to missing session"); // Debug log
    redirect('/login');
  }

  const userId = userData.user.id;
  const { data, error } = await supabase.from('users').select('full_name').eq('id', userId).single();
  if (error) throw error;

  // Safely access email with a fallback
  const displayName = data?.full_name || userData.user.email?.split('@')[0] || 'User';
  const email = userData.user.email || '';

  return (
    <div className="min-h-screen bg-gradient-to-r from-brand-teal/5 to-brand-pink/5 py-20">
      <div className="container mx-auto px-4 pt-10">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-display text-brand-teal mb-2">Your Profile</h1>
            <p className="text-offblack">Manage your account and pet information</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Card */}
            <Card className="md:col-span-1 border-none shadow-md">
              <CardHeader className="text-center border-b pb-6">
                <div className="mx-auto bg-brand-teal/10 rounded-full w-24 h-24 flex items-center justify-center mb-4">
                  <User className="h-12 w-12 text-brand-teal" />
                </div>
                <CardTitle className="text-xl text-brand-teal">{displayName}</CardTitle>
                <CardDescription className="flex items-center justify-center gap-1">
                  <Mail className="h-3 w-3" />
                  {email}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-brand-teal" />
                      <span className="text-sm text-offblack">Location</span>
                    </div>
                    <span className="text-sm text-offblack/70">Not set</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PawPrint className="h-4 w-4 text-brand-teal" />
                      <span className="text-sm text-offblack">Pets</span>
                    </div>
                    <span className="text-sm text-offblack/70">0 pets</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 border-t pt-6">
                <Button 
                  variant="outline" 
                  className="w-full justify-between border-brand-teal text-brand-teal hover:bg-brand-teal/10"
                  asChild
                >
                  <Link href="/settings">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Account Settings
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            {/* Main Content Area */}
            <div className="md:col-span-2 space-y-6">
              {/* Pet Section */}
              <Card className="border-none shadow-md">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                  <div>
                    <CardTitle className="text-xl text-brand-teal">Your Pets</CardTitle>
                    <CardDescription>Add and manage your furry travel companions</CardDescription>
                  </div>
                  <Button className="bg-brand-teal hover:bg-brand-pink text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Pet
                  </Button>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="bg-brand-pink/10 rounded-full p-4 mb-4">
                      <PawPrint className="h-8 w-8 text-brand-teal" />
                    </div>
                    <h3 className="text-lg font-medium text-offblack mb-2">No pets added yet</h3>
                    <p className="text-offblack/70 max-w-md mb-6">
                      Add your pets to keep track of their travel documents, vaccination records, and preferences.
                    </p>
                    <Button className="bg-brand-teal hover:bg-brand-pink text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Pet
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Recent Trips Section */}
              <Card className="border-none shadow-md">
                <CardHeader className="border-b pb-4">
                  <CardTitle className="text-xl text-brand-teal">Recent Trips</CardTitle>
                  <CardDescription>Your pet travel history</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <p className="text-offblack/70 mb-4">
                      Your recent pet travel trips will appear here.
                    </p>
                    <Button 
                      variant="outline" 
                      className="border-brand-teal text-brand-teal hover:bg-brand-teal/10"
                      asChild
                    >
                      <Link href="/trips/plan">Plan a Trip</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}