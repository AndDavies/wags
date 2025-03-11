import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    console.error("Invalid email format:", email);
    return NextResponse.json({ message: "Invalid email address" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("email_subscribers").insert({ email });

  if (error) {
    console.error("Supabase insert error:", error.message, "Code:", error.code);
    if (error.code === "23505") {
      return NextResponse.json({ message: "You’re already subscribed!" }, { status: 400 });
    }
    return NextResponse.json(
      { message: `Error subscribing: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Thanks for subscribing!" });
}