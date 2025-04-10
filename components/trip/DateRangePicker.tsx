'use client';

import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar-rac';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateValue, parseDate } from '@internationalized/date';

interface DateRangePickerProps {
  from: Date | null;
  to: Date | null;
  onFromChange: (date: Date | null) => void;
  onToChange: (date: Date | null) => void;
}

export function DateRangePicker({ from, to, onFromChange, onToChange }: DateRangePickerProps) {
  // Use state but don't initialize with a value that could cause hydration mismatch
  const [mounted, setMounted] = useState(false);
  const [isFromCalendarOpen, setIsFromCalendarOpen] = useState(false);
  const [isToCalendarOpen, setIsToCalendarOpen] = useState(false);

  // Once the component mounts on the client, mark it as mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper function to convert Date to DateValue
  const toDateValue = (date: Date | null): DateValue | undefined => {
    if (!date) return undefined;
    return parseDate(date.toISOString().split('T')[0]);
  };

  // Helper function to convert DateValue to Date
  const toDate = (dateValue: DateValue | null): Date | null => {
    if (!dateValue) return null;
    return new Date(dateValue.toString());
  };

  // Don't render anything until client-side 
  if (!mounted) {
    return (
      <div className="flex flex-col sm:flex-row gap-2">
        <Button variant="outline" className="justify-start text-left font-normal w-full sm:w-[200px]">
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span>Loading...</span>
        </Button>
        <div className="flex items-center justify-center">
          <span className="text-sm text-muted-foreground hidden sm:inline">to</span>
        </div>
        <Button variant="outline" className="justify-start text-left font-normal w-full sm:w-[200px]">
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span>Loading...</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Popover open={isFromCalendarOpen} onOpenChange={setIsFromCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal w-full sm:w-[200px]",
              !from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {from ? format(from, "PPP") : <span>Pick a start date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            value={toDateValue(from)}
            onChange={(date: DateValue) => {
              const newDate = toDate(date);
              onFromChange(newDate);
              setIsFromCalendarOpen(false);
              
              // Check if we need to open the end date picker
              if (!to || (newDate && to && to < newDate)) {
                setIsToCalendarOpen(true);
              }
            }}
          />
        </PopoverContent>
      </Popover>

      <div className="flex items-center justify-center">
        <span className="text-sm text-muted-foreground hidden sm:inline">to</span>
      </div>

      <Popover open={isToCalendarOpen} onOpenChange={setIsToCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal w-full sm:w-[200px]",
              !to && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {to ? format(to, "PPP") : <span>Pick an end date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            value={toDateValue(to)}
            onChange={(date: DateValue) => {
              onToChange(toDate(date));
              setIsToCalendarOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
} 