'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// Potentially import Sheet components if using that for the panel structure
// import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface SidePanelProps {
  // Define props to pass data, e.g., place details, policy info, booking links
  title?: string;
  content?: React.ReactNode;
  imageUrl?: string;
  bookingLink?: string;
  // Add more props as needed based on API/DB data
}

const SidePanel: React.FC<SidePanelProps> = ({
  title = "Details",
  content,
  imageUrl,
  bookingLink,
}) => {
  // This is a placeholder structure. You might use Sheet, Dialog, or just a Card
  // depending on how you want it to appear (e.g., slide-in, modal, static).
  return (
    <Card className="w-[350px] h-full"> {/* Adjust width/height as needed */}
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={title} className="rounded-md object-cover w-full h-48" />
        )}
        {typeof content === 'string' ? <p>{content}</p> : content}
        {bookingLink && (
          <Button asChild>
            <a href={bookingLink} target="_blank" rel="noopener noreferrer">
              Book Now
            </a>
          </Button>
        )}
        {/* Add sections for maps, reviews, policy details etc. */}
      </CardContent>
    </Card>
  );
};

export default SidePanel; 