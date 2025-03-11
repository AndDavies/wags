"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Assuming you have this

export default function EmailCapture() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      setMessage(result.message);
      if (response.ok) setEmail("");
    } catch (error) {
      setMessage("Something went wrong. Try again!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md mx-auto mt-8">
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email for pet travel updates"
        className="p-2 border rounded-md border-brand-teal text-offblack"
        required
        disabled={isSubmitting}
      />
      <Button
        type="submit"
        disabled={isSubmitting}
        className="bg-brand-teal text-white hover:bg-brand-pink hover:text-offblack"
      >
        {isSubmitting ? "Subscribing..." : "Subscribe"}
      </Button>
      {message && <p className="text-center text-offblack">{message}</p>}
    </form>
  );
}