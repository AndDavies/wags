'use client';

import React from 'react';
import { useTripStore } from '@/store/tripStore';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MapPin, CalendarDays, Users, DollarSign, UserPlus, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns'; // For formatting dates

// --- Interfaces & Types ---
interface TopBarProps {
  className?: string;
  // Add onClick handlers for interactivity
  onWhereClick?: () => void;
  onWhenClick?: () => void;
  onTravelersClick?: () => void;
  onBudgetClick?: () => void;
  onNewChatClick?: () => void;
  onInviteClick?: () => void;
  onCreateTripClick?: () => void;
}

// --- Helper Component for Trip Parameter Buttons ---
interface TripParamButtonProps {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
  placeholder: string;
  onClick?: () => void;
  className?: string;
}

/**
 * Reusable button component for displaying trip parameters in the TopBar.
 * @param {TripParamButtonProps} props - Component props.
 * @returns {JSX.Element}
 */
const TripParamButton: React.FC<TripParamButtonProps> = ({ 
  icon: Icon, 
  label, 
  value, 
  placeholder, 
  onClick, 
  className 
}) => (
  <Button 
    variant="outline"
    className={cn(
      "h-9 px-3 py-1.5 text-xs sm:text-sm flex items-center gap-1.5 border rounded-full shadow-sm bg-white hover:bg-gray-50 cursor-pointer",
      !value && "text-gray-500", // Dim placeholder text
      className
    )}
    onClick={onClick}
    aria-label={`${label}: ${value || placeholder}`}
  >
    <Icon className="h-4 w-4 flex-shrink-0 text-gray-500" />
    <span className="truncate">{value || placeholder}</span>
  </Button>
);

// --- TopBar Component ---
/**
 * TopBar Component
 * Displays key trip information and action buttons at the top of the chat/planning interface.
 * Reads trip data from the useTripStore.
 * @param {TopBarProps} props - Component props.
 * @returns {JSX.Element}
 */
const TopBar: React.FC<TopBarProps> = ({ 
    className, 
    onWhereClick, 
    onWhenClick, 
    onTravelersClick, 
    onBudgetClick,
    onNewChatClick,
    onInviteClick,
    onCreateTripClick
}) => {
  const tripData = useTripStore((state) => state.tripData);

  // Enhanced Format Dates function
  const formatDate = (dateString: string | null | undefined): string | null => {
    if (!dateString) return null;

    const yyyyMmDdRegex = /^\d{4}-\d{2}-\d{2}$/;
    const yyyyMmRegex = /^\d{4}-\d{2}$/;

    try {
      // 1. Check for YYYY-MM format
      if (yyyyMmRegex.test(dateString)) {
        // Create a date object for the first of the month to format
        const dateObj = new Date(dateString + '-01T00:00:00');
        return format(dateObj, 'LLL yyyy'); // Format as "Jun 2024"
      }

      // 2. Check for YYYY-MM-DD format or attempt general parsing
      if (yyyyMmDdRegex.test(dateString) || !isNaN(new Date(dateString).getTime())) {
         // Add T00:00:00 to ensure correct timezone handling for YYYY-MM-DD strings
         const dateObj = new Date(yyyyMmDdRegex.test(dateString) ? dateString + 'T00:00:00' : dateString);
          // Check for validity again after parsing
         if (!isNaN(dateObj.getTime()) && dateObj.getFullYear() > 1970) {
             return format(dateObj, 'LLL dd'); // Format as "Jun 10"
         }
      }

      // 3. If it doesn't match known formats and isn't parsable, return original string
      // (This catches things like "June", "next summer" returned by the enhanced parseDate)
      console.log(`[TopBar] Date string "${dateString}" not formatted, returning as is.`);
      return dateString; 

    } catch (error) {
      console.error('[TopBar] Error formatting date:', dateString, error);
      return dateString; // Fallback to original string on error
    }
  };

  // Ensure dates from store are strings before formatting
  const getIsoDateString = (date: string | Date | null | undefined): string | null | undefined => {
      if (date instanceof Date) {
          try {
              return date.toISOString().split('T')[0]; // Convert Date object to YYYY-MM-DD string
          } catch { 
              return undefined; // Handle invalid Date object
          }
      }
      return date; // Pass through string, null, or undefined
  };

  const startDateString = getIsoDateString(tripData?.startDate);
  const endDateString = getIsoDateString(tripData?.endDate);

  const formattedStartDate = formatDate(startDateString);
  const formattedEndDate = formatDate(endDateString);

  // Improved Date Display Logic
  let dateDisplay: string | null = null;
  if (formattedStartDate && formattedEndDate) {
    if (formattedStartDate === formattedEndDate) {
      dateDisplay = formattedStartDate; // Show only one if they are the same
    } else {
      dateDisplay = `${formattedStartDate} - ${formattedEndDate}`;
    }
  } else if (formattedStartDate) {
    dateDisplay = formattedStartDate; // Show start date if only it exists
  } else if (formattedEndDate) {
    dateDisplay = formattedEndDate; // Show end date if only it exists
  }

  // Format Travelers
  const travelersDisplay = [
    tripData?.adults ? `${tripData.adults} ${tripData.adults > 1 ? 'Travelers' : 'Traveler'}` : null,
    // Include children later if needed: tripData?.children ? `${tripData.children} Child${tripData.children > 1 ? 'ren' : ''}` : null,
    tripData?.pets ? `${tripData.pets} Pet${tripData.pets > 1 ? 's' : ''}` : null
  ].filter(Boolean).join(', ') || null;

  return (
    <div className={cn("bg-white border-b border-gray-200 px-3 py-2 h-14 flex items-center justify-between sticky top-0 z-20", className)}>
      {/* Left Side: New Chat */} 
      <div>
        <Button 
          variant="ghost"
          size="sm"
          className="text-sm font-medium text-gray-700 hover:bg-gray-100 px-3"
          onClick={onNewChatClick}
          aria-label="Start a new chat"
        >
          New Chat
        </Button>
      </div>

      {/* Center: Trip Parameters */} 
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1 scrollbar-hide">
        <TripParamButton 
          icon={MapPin} 
          label="Destination"
          value={tripData?.destination}
          placeholder="Where"
          onClick={onWhereClick}
        />
        <TripParamButton 
          icon={CalendarDays}
          label="Dates" 
          value={dateDisplay}
          placeholder="When"
          onClick={onWhenClick}
        />
        <TripParamButton 
          icon={Users} 
          label="Travelers"
          value={travelersDisplay}
          placeholder="Travelers"
          onClick={onTravelersClick}
        />
        <TripParamButton 
          icon={DollarSign}
          label="Budget" 
          value={tripData?.budget}
          placeholder="Budget"
          onClick={onBudgetClick}
        />
      </div>

      {/* Right Side: Actions */} 
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-gray-600 hover:bg-gray-100 px-2 sm:px-3"
          onClick={onInviteClick}
          aria-label="Invite others" 
        >
           <UserPlus className="h-4 w-4 sm:mr-1.5" />
           <span className="hidden sm:inline text-sm">Invite</span>
        </Button>
        <Separator orientation="vertical" className="h-6 hidden sm:block" />
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-gray-600 hover:bg-gray-100 px-2 sm:px-3"
          onClick={onCreateTripClick}
          aria-label="Create a trip using the form"
        >
           <PlusCircle className="h-4 w-4 sm:mr-1.5" />
           <span className="hidden sm:inline text-sm">Create a trip</span>
        </Button>
      </div>
    </div>
  );
};

export default TopBar; 