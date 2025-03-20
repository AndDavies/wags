// components/ui/TripCard.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { Eye, FileText, Archive, Lock, Unlock, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image"; // Added import

interface Trip {
  id: string;
  departure: string;
  destination: string;
  dates: { start: string; end: string };
  method: string;
  travelers: { adults: number; children: number; pets: number };
  archived: boolean;
  status: string;
  userId: string;
}

interface TripCardProps {
  trip: Trip;
  onArchiveToggle?: () => void;
}

export default function TripCard({ trip, onArchiveToggle }: TripCardProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const supabase = createClient();

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    const filePath = `${trip.id}/${file.name}`;
    const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file, {
      upsert: true,
    });
    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      setError("Failed to upload file. Please try again.");
      return;
    }

    const { error: insertError } = await supabase.from("documents").insert({
      trip_id: trip.id,
      file_name: file.name,
      file_path: filePath,
    });

    if (!insertError) {
      setIsUploadOpen(false);
      setFile(null);
      setError(null);
      window.location.reload();
    } else {
      console.error("Error saving document:", insertError);
      setError("Failed to save document. Please try again.");
    }
  };

  const handleArchive = async () => {
    const { error } = await supabase
      .from("trips")
      .update({ archived: !trip.archived })
      .eq("id", trip.id)
      .eq("user_id", trip.userId);

    if (!error && onArchiveToggle) {
      onArchiveToggle();
      window.location.reload();
    } else {
      console.error("Error archiving trip:", error);
    }
  };

  return (
    <li className="relative border-none shadow-md rounded-lg overflow-hidden">
      <div className="relative h-40">
        <Image
          src="/default-trip-image.jpg"
          alt={`Background for ${trip.destination}`}
          fill
          style={{ objectFit: "cover" }}
          className="opacity-50"
          onError={(e) => {
            e.currentTarget.src = "/default-trip-image.jpg"; // Fallback to local image
          }}
        />
      </div>
      <div className="absolute top-4 right-4">
        <span className="bg-white text-offblack text-sm px-2 py-1 rounded-full">
          {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
        </span>
      </div>
      <div className="p-4 bg-white">
        <h3 className="text-xl font-medium text-offblack">{trip.destination}</h3>
        <p className="text-offblack/70 flex items-center gap-1">
          <span>{trip.dates.start} - {trip.dates.end || "TBD"}</span>
        </p>
        <div className="flex gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            className="border-brand-teal text-brand-teal hover:bg-brand-teal/10"
            onClick={() => alert("View trip details - coming soon!")}
          >
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-brand-teal text-brand-teal hover:bg-brand-teal/10"
            onClick={() => alert("Download PDF - coming soon!")}
          >
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-brand-teal text-brand-teal hover:bg-brand-teal/10"
            onClick={handleArchive}
          >
            <Archive className="h-4 w-4 mr-2" />
            {trip.archived ? "Unarchive" : "Archive"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-brand-teal text-brand-teal hover:bg-brand-teal/10"
            onClick={() => setIsPublic(!isPublic)}
          >
            {isPublic ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
            {isPublic ? "Public" : "Private"}
          </Button>
        </div>
        {isUploadOpen && (
          <div className="mt-2 space-y-2">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="border border-brand-teal/50 rounded p-2 w-full text-offblack"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => setIsUploadOpen(false)}
                variant="outline"
                className="border-brand-teal text-brand-teal hover:bg-brand-teal/10 w-full"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                className="bg-brand-teal hover:bg-brand-pink text-white w-full"
                disabled={!file}
              >
                Save
              </Button>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}