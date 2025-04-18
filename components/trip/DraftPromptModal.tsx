'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface DraftPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewItinerary: () => void;
  onStartNewTrip: () => void;
}

export default function DraftPromptModal({
  open,
  onOpenChange,
  onViewItinerary,
  onStartNewTrip,
}: DraftPromptModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <Dialog.Title className="text-lg font-semibold text-gray-800">
            You have a saved trip!
          </Dialog.Title>
          <Dialog.Description className="text-sm text-gray-600 mt-2">
            Would you like to view your saved itinerary or start a new trip?
          </Dialog.Description>
          <div className="flex flex-col gap-3 mt-4">
            <Button onClick={onViewItinerary} className="bg-teal-600 hover:bg-teal-700 text-white">
              View Itinerary
            </Button>
            <Button onClick={onStartNewTrip} variant="ghost">
              Start New Trip
            </Button>
          </div>
          <Dialog.Close className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
            <X className="h-4 w-4" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}