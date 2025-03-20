// app/profile/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { PawPrint, User, Mail, MapPin, Plus, Settings, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cookies } from "next/headers";
import ProfileClient from "./ProfileClient";


export default async function ProfilePage() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth-token")?.value;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser(authToken);

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;
  const { data: userData, error: userError } = await supabase.from("users").select("full_name").eq("id", userId).single();
  if (userError) throw userError;

  const { data: pets, error: petsError } = await supabase.from("pets").select("*").eq("user_id", userId);
  if (petsError) throw petsError;

  const { data: trips, error: tripsError } = await supabase.from("trips").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (tripsError) throw tripsError;

  const displayName = userData?.full_name || user.email?.split("@")[0] || "User";
  const email = user.email || "";

  return (
    <div className="min-h-screen bg-gradient-to-r from-brand-teal/5 to-brand-pink/5 py-20">
      <div className="container mx-auto px-4 pt-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-display text-brand-teal mb-2">Your Profile</h1>
            <p className="text-offblack">Manage your account, pets, and trips</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <span className="text-sm text-offblack/70">{pets?.length || 0} pets</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 border-t pt-6">
                <Button
                  variant="outline"
                  className="w-full justify-between border-brand-teal text-brand-teal hover:bg-brand-teal/10"
                  asChild
                >
                  <a href="/settings">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Account Settings
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </Button>
              </CardFooter>
            </Card>

            <ProfileClient userId={userId} initialPets={pets || []} initialTrips={trips || []} />
          </div>
        </div>
      </div>
    </div>
  );
}