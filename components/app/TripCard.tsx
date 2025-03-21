// components/app/TripCard.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import { Eye, FileText, Archive, Lock, Unlock, Upload, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

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
  origin_vet?: { name: string; address: string; phone: string }[];
  destination_vet?: { name: string; address: string; phone: string }[];
}

interface Document {
  id: string;
  trip_id: string;
  file_name: string;
  file_path: string;
  created_at: string;
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
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showDocuments, setShowDocuments] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [errorDocuments, setErrorDocuments] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<{ [key: string]: string }>({}); // Store signed URLs
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null); // Track which document is loading
  const [errorUrl, setErrorUrl] = useState<string | null>(null); // Error for URL generation
  const supabase = createClient();

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoadingDocuments(true);
      setErrorDocuments(null);

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("trip_id", trip.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching documents:", error.message);
        setErrorDocuments("Failed to load documents: " + (error.message || "Unknown error"));
      } else {
        setDocuments(data || []);
      }

      setLoadingDocuments(false);
    };

    fetchDocuments();
  }, [trip.id]);

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
  
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only PDF, JPG, and PNG files are allowed.");
      return;
    }
  
    const filePath = `${trip.id}/${file.name}`;
    const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file, {
      upsert: true,
      contentType: file.type,
      metadata: { trip_id: trip.id }, // Ensure metadata is passed
    });
    if (uploadError) {
      console.error("Error uploading file:", uploadError.message);
      setError("Failed to upload file: " + (uploadError.message || "Unknown error"));
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
      window.location.reload(); // Will be replaced in Step 4
    } else {
      console.error("Error saving document:", insertError.message);
      setError("Failed to save document: " + (insertError.message || "Unknown error"));
    }
  };

  const handleDownload = async (doc: Document) => {
    setLoadingUrl(doc.id);
    setErrorUrl(null);

    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.file_path, 60); // URL valid for 60 seconds

    if (error) {
      console.error("Error generating signed URL:", error.message);
      setErrorUrl("Failed to generate download link: " + (error.message || "Unknown error"));
      setLoadingUrl(null);
      return;
    }

    setSignedUrls((prev) => ({ ...prev, [doc.id]: data.signedUrl }));
    setLoadingUrl(null);

    // Open the URL in a new tab to trigger download
    window.open(data.signedUrl, "_blank");
  };

  const handleArchive = async () => {
    const { error } = await supabase
      .from("trips")
      .update({ archived: !trip.archived })
      .eq("id", trip.id)
      .eq("user_id", trip.userId);

    if (!error && onArchiveToggle) {
      onArchiveToggle();
      window.location.reload(); // Will be replaced in Step 4
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
          <Button
            variant="outline"
            size="sm"
            className="border-brand-teal text-brand-teal hover:bg-brand-teal/10"
            onClick={() => setIsUploadOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-brand-teal text-brand-teal hover:bg-brand-teal/10"
            onClick={() => setShowDocuments(!showDocuments)}
          >
            {showDocuments ? "Hide Documents" : "View Documents"}
          </Button>
        </div>
        {isUploadOpen && (
          <div className="mt-2 space-y-2">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png"
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
        {showDocuments && (
          <div className="mt-4">
            {loadingDocuments ? (
              <p className="text-offblack/70 text-center">Loading documents...</p>
            ) : errorDocuments ? (
              <p className="text-red-500 text-center">{errorDocuments}</p>
            ) : documents.length > 0 ? (
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li key={doc.id} className="bg-brand-teal/5 p-2 rounded flex items-center gap-2">
                    <PawPrint className="h-5 w-5 text-brand-teal" />
                    <span className="text-offblack">{doc.file_name}</span>
                    <span className="text-offblack/70 text-sm">
                      Uploaded: {new Date(doc.created_at).toISOString().split("T")[0]}
                    </span>
                    <Button
                      variant="link"
                      className="text-brand-teal hover:text-brand-pink text-sm"
                      onClick={() => handleDownload(doc)}
                      disabled={loadingUrl === doc.id}
                    >
                      {loadingUrl === doc.id ? "Generating link..." : "Download"}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-offblack/70 text-center">No documents uploaded yet.</p>
            )}
            {errorUrl && <p className="text-red-500 text-center mt-2">{errorUrl}</p>}
          </div>
        )}
      </div>
    </li>
  );
}