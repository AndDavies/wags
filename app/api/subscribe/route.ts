// app/api/subscribe/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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

  // Send email directly
  try {
    await transporter.sendMail({
      from: "Wags & Wanders <hello@wagsandwanders.com>", // Updated sender email
      to: email,
      subject: "Welcome to Wags & Wanders!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #008080;">Welcome to Wags & Wanders!</h1>
          <p style="color: #333;">Thanks for joining our community of pet travel enthusiasts! Get ready for tips, airline updates, and more.</p>
          <p style="color: #333;">Happy travels,<br/>The Wags & Wanders Team</p>
          <footer style="font-size: 12px; color: #777; margin-top: 20px;">
            <p>Wags & Wanders • <a href="https://wagsandwanders.com/unsubscribe">Unsubscribe</a></p>
          </footer>
        </div>
      `,
    });
    console.log("Email sent successfully to:", email);
  } catch (emailError) {
    console.error("Email send failed:", emailError instanceof Error ? emailError.message : emailError);
    // Don’t fail the subscription if email fails
  }

  return NextResponse.json({ message: "Thanks for subscribing!" });
}