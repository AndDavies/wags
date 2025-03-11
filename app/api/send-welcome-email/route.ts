import { NextResponse } from "next/server";
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
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${process.env.EMAIL_API_TOKEN}`) {
    console.error("Unauthorized access attempt to send-welcome-email");
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { email } = await request.json();

  try {
    await transporter.sendMail({
      from: "Pet Travel Hub <m.andrew.davies@gmail.com>",
      to: email,
      subject: "Welcome to Pet Travel Hub!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #008080;">Welcome to Pet Travel Hub!</h1>
          <p style="color: #333;">Thanks for joining our community of pet travel enthusiasts! Get ready for tips, airline updates, and more.</p>
          <p style="color: #333;">Happy travels,<br/>The Pet Travel Hub Team</p>
          <footer style="font-size: 12px; color: #777; margin-top: 20px;">
            <p>Pet Travel Hub • <a href="https://pet-travel-hub.vercel.app/unsubscribe">Unsubscribe</a></p>
          </footer>
        </div>
      `,
    });
    console.log("Email sent successfully to:", email);
    return NextResponse.json({ message: "Email sent" });
  } catch (error) {
    console.error("Email send failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ message: "Failed to send email" }, { status: 500 });
  }
}