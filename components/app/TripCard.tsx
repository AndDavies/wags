// components/app/TripCard.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import { Eye, FileText, Archive, Lock, Unlock, Upload, PawPrint, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  user_id: string;
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
  onArchiveToggle?: (tripId: string) => void;
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
  const [signedUrls, setSignedUrls] = useState<{ [key: string]: string }>({});
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null);
  const [errorUrl, setErrorUrl] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isArchived, setIsArchived] = useState(trip.archived);
  const supabase = createClient();

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoadingDocuments(true);
      setErrorDocuments(null);

      try {
        const { data, error } = await supabase
          .from("documents")
          .select("*")
          .eq("trip_id", trip.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setDocuments(data || []);
      } catch (err: any) {
        console.error("Error fetching documents:", err.message);
        setErrorDocuments("Failed to load documents: " + (err.message || "Unknown error"));
      } finally {
        setLoadingDocuments(false);
      }
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

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Authentication error: Please log in again.");

      const filePath = `${trip.id}/${file.name}`;
      const uploadOptions = { upsert: true, contentType: file.type };

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("documents")
        .upload(filePath, file, uploadOptions);
      if (uploadError) throw uploadError;

      const { error: insertError, data: insertData } = await supabase
        .from("documents")
        .insert({ trip_id: trip.id, file_name: file.name, file_path: filePath })
        .select()
        .single();
      if (insertError) throw insertError;

      setDocuments((prev) => [insertData, ...prev]);
      setIsUploadOpen(false);
      setFile(null);
      setError(null);

      toast({
        title: "Upload Successful",
        description: `${file.name} has been uploaded to your trip.`,
        variant: "default",
        action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
      });
    } catch (err: any) {
      console.error("Error during upload:", err);
      setError("Failed to upload: " + (err.message || "Unknown error"));
    }
  };

  const handleDownload = async (doc: Document) => {
    setLoadingUrl(doc.id);
    setErrorUrl(null);

    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(doc.file_path, 60);
      if (error) throw error;

      setSignedUrls((prev) => ({ ...prev, [doc.id]: data.signedUrl }));
      window.open(data.signedUrl, "_blank");
    } catch (err: any) {
      console.error("Error generating signed URL:", err);
      setErrorUrl("Failed to generate download link: " + (err.message || "Unknown error"));
    } finally {
      setLoadingUrl(null);
    }
  };

  const handleDelete = async (docId: string) => {
    setDeletingDocId(docId);
    setDeleteError(null);

    try {
      const doc = documents.find((d) => d.id === docId);
      if (!doc) throw new Error("Document not found");

      const { error: storageError } = await supabase.storage.from("documents").remove([doc.file_path]);
      if (storageError) throw storageError;

      const { error: deleteError } = await supabase.from("documents").delete().eq("id", docId);
      if (deleteError) throw deleteError;

      setDocuments(documents.filter((d) => d.id !== docId));
      setShowDeleteConfirm(false);

      toast({
        title: "Document Deleted",
        description: `${doc.file_name} has been removed.`,
        variant: "destructive",
      });
    } catch (err: any) {
      console.error("Error during deletion:", err);
      setDeleteError("Failed to delete: " + (err.message || "Unknown error"));
    } finally {
      setDeletingDocId(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleArchive = async () => {
    try {
      const newArchivedStatus = !isArchived;
      const { error } = await supabase
        .from("trips")
        .update({ archived: newArchivedStatus })
        .eq("id", trip.id)
        .eq("user_id", trip.userId);

      if (error) throw error;

      setIsArchived(newArchivedStatus);
      if (onArchiveToggle) onArchiveToggle(trip.id);

      toast({
        title: newArchivedStatus ? "Trip Archived" : "Trip Unarchived",
        description: `${trip.destination} has been ${newArchivedStatus ? "archived" : "unarchived"}.`,
        variant: "default",
      });
    } catch (err: any) {
      console.error("Error archiving trip:", err);
      toast({
        title: "Error",
        description: "Failed to update archive status: " + (err.message || "Unknown error"),
        variant: "destructive",
      });
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
        <div className="flex flex-wrap gap-2 mt-2">
          <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-brand-teal text-brand-teal hover:bg-brand-teal/10"
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Trip to {trip.destination}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-offblack">Details</h4>
                  <p className="text-offblack/70">
                    <strong>Departure:</strong> {trip.departure}
                    <br />
                    <strong>Destination:</strong> {trip.destination}
                    <br />
                    <strong>Dates:</strong> {trip.dates.start} to {trip.dates.end || "TBD"}
                    <br />
                    <strong>Travel Method:</strong> {trip.method}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-offblack">Travelers</h4>
                  <p className="text-offblack/70">
                    <strong>Adults:</strong> {trip.travelers.adults}
                    <br />
                    <strong>Children:</strong> {trip.travelers.children}
                    <br />
                    <strong>Pets:</strong> {trip.travelers.pets}
                  </p>
                </div>
                {(trip.origin_vet?.length || trip.destination_vet?.length) && (
                  <div>
                    <h4 className="text-sm font-medium text-offblack">Veterinary Contacts</h4>
                    {trip.origin_vet?.length ? (
                      <p className="text-offblack/70">
                        <strong>Origin Vet:</strong> {trip.origin_vet[0].name} ({trip.origin_vet[0].address})
                        {trip.origin_vet[0].phone && (
                          <>
                            <br />
                            <strong>Phone:</strong>{" "}
                            <a href={`tel:${trip.origin_vet[0].phone}`} className="text-brand-teal hover:underline">
                              {trip.origin_vet[0].phone}
                            </a>
                          </>
                        )}
                      </p>
                    ) : null}
                    {trip.destination_vet?.length ? (
                      <p className="text-offblack/70">
                        <strong>Destination Vet:</strong> {trip.destination_vet[0].name} (
                        {trip.destination_vet[0].address})
                        {trip.destination_vet[0].phone && (
                          <>
                            <br />
                            <strong>Phone:</strong>{" "}
                            <a
                              href={`tel:${trip.destination_vet[0].phone}`}
                              className="text-brand-teal hover:underline"
                            >
                              {trip.destination_vet[0].phone}
                            </a>
                          </>
                        )}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
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
            {isArchived ? "Unarchive" : "Archive"}
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-brand-teal text-brand-teal hover:bg-brand-teal/10"
                  onClick={() => setShowDocuments(!showDocuments)}
                >
                  {showDocuments ? "Hide Documents" : "View Documents"}
                  <Shield className="h-4 w-4 ml-2" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Documents are encrypted at rest with AES-256 and in transit with TLS 1.3.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {isUploadOpen && (
          <div className="mt-2 space-y-2">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Input
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="border-brand-teal/50 text-offblack"
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
                    <Button
                      variant="link"
                      className="text-red-500 hover:text-red-700 text-sm"
                      onClick={() => {
                        setShowDeleteConfirm(true);
                        setDeletingDocId(doc.id);
                      }}
                      disabled={deletingDocId === doc.id}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {deletingDocId === doc.id ? "Deleting..." : "Delete"}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-offblack/70 text-center">No documents uploaded yet.</p>
            )}
            {errorUrl && <p className="text-red-500 text-center mt-2">{errorUrl}</p>}
            {deleteError && <p className="text-red-500 text-center mt-2">{deleteError}</p>}
          </div>
        )}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
              <h3 className="text-lg font-medium text-offblack mb-4">
                Are you sure you want to delete this document?
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-brand-teal text-brand-teal hover:bg-brand-teal/10 w-full"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletingDocId(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-red-500 hover:bg-red-700 text-white w-full"
                  onClick={() => handleDelete(deletingDocId!)}
                  disabled={deletingDocId === null}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}