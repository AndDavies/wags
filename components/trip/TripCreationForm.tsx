'use client';

import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useTripStore } from '@/store/tripStore';
import CityAutocomplete from './CityAutocomplete';
import { createClient } from '@/lib/supabase-client';
import { PostgrestError } from '@supabase/supabase-js';
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import * as Toast from '@radix-ui/react-toast';

// Shadcn UI component imports
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils';

// Lucide Icons
import {
  MapPin,
  CalendarDays,
  Users,
  Baby,
  Dog,
  Cat,
  Bird,
  Rabbit,
  Scale,
  Hotel,
  Camera,
  ShoppingBag,
  Info,
  CircleDollarSign,
  Plus,
  Minus,
  X,
  Check,
  Mountain,
  Briefcase,
} from 'lucide-react';

// Constants
const interests = [
  'Sightseeing', 'Outdoor Adventures', 'Sports', 'Food Tours', 'Museums', 'Shopping',
  'Spa and Wellness', 'Local Experiences', 'Photography', 'Wildlife Viewing',
  'Water Activities', 'Nightlife', 'Historical Sites', 'Cultural Events', 'Other'
];

const accommodations = ['Hotels', 'Homes/Apartments', 'B&Bs', 'Hostels', 'Flexible'];
const budgets = ['Budget', 'Moderate', 'Luxury'];
const petTypes = [
  { name: 'Dog', icon: Dog },
  { name: 'Cat', icon: Cat },
  { name: 'Bird', icon: Bird },
  { name: 'Other', icon: Rabbit },
];
const petSizes = [
  { label: '5-15 lbs', value: 'Small', icon: Scale, size: 16 },
  { label: '15-40 lbs', value: 'Medium', icon: Scale, size: 20 },
  { label: '40+ lbs', value: 'Large', icon: Scale, size: 24 },
];

// Types
interface FormData {
  origin: string;
  originCountry: string;
  destination: string;
  destinationCountry: string;
  additionalCities: string[];
  additionalCountries?: string[];
  startDate: Date | null;
  endDate: Date | null;
  adults: number;
  children: number;
  pets: number;
  petDetails: { type: string; size: string }[];
  budget: string;
  accommodation: string;
  interests: string[];
  additionalInfo: string;
  draftId?: string;
}

// --- Helper Components ---

const SelectableTag = ({
  value,
  isSelected,
  onSelect,
  icon: Icon,
}: {
  value: string;
  isSelected: boolean;
  onSelect: (value: string) => void;
  icon?: React.ElementType;
}) => (
  <Button
    variant={isSelected ? 'default' : 'outline'}
    size="sm"
    onClick={() => onSelect(value)}
    className={cn(
      'flex items-center gap-2 text-sm transition-colors duration-150 ease-in-out h-auto py-1 px-3 rounded-full border',
      isSelected
        ? 'bg-teal-500 text-white border-teal-500 hover:bg-teal-600'
        : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400'
    )}
  >
    {Icon && <Icon className="h-4 w-4" />}
    {value}
    {isSelected && <Check className="h-4 w-4 ml-1" />}
  </Button>
);

const SelectableIconButton = ({
  value,
  label,
  isSelected,
  onSelect,
  icon: Icon,
  iconSize,
}: {
  value: string;
  label?: string;
  isSelected: boolean;
  onSelect: (value: string) => void;
  icon: React.ElementType;
  iconSize?: number;
}) => (
  <Button
    variant="outline"
    onClick={() => onSelect(value)}
    className={cn(
      'flex flex-col items-center justify-center gap-1 p-3 h-auto border rounded-lg transition-colors duration-150 ease-in-out w-20',
      isSelected
        ? 'bg-teal-100 border-teal-500 text-teal-700 ring-2 ring-teal-500 ring-offset-1'
        : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400'
    )}
  >
    <Icon className="h-6 w-6" size={iconSize} />
    {label && <span className="text-xs font-medium mt-1 text-center break-words">{label}</span>} 
  </Button>
);

// --- Main Form Component ---

export default function TripCreationForm({
  session,
}: {
  onClose?: () => void;
  session: any | null;
}) {
  const { tripData, setTripData } = useTripStore();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showPetWarning, setShowPetWarning] = useState(false);

  // Refs for auto-scrolling to errors
  const originRef = useRef<HTMLDivElement>(null);
  const destinationRef = useRef<HTMLDivElement>(null);
  const datesRef = useRef<HTMLDivElement>(null);
  const adultsRef = useRef<HTMLDivElement>(null);
  const budgetRef = useRef<HTMLDivElement>(null);
  const accommodationRef = useRef<HTMLDivElement>(null);
  const petDetailsRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormData>(() => ({
    origin: tripData.origin || '',
    originCountry: tripData.originCountry || '',
    destination: tripData.destination || '',
    destinationCountry: tripData.destinationCountry || '',
    additionalCities: tripData.additionalCities || [],
    additionalCountries: tripData.additionalCountries || [],
    startDate: tripData.startDate ? new Date(tripData.startDate) : null,
    endDate: tripData.endDate ? new Date(tripData.endDate) : null,
    adults: tripData.adults || 1,
    children: tripData.children || 0,
    pets: tripData.pets || 1, // Default to 1 pet
    petDetails: tripData.petDetails?.map((p: { type?: string; size?: string } | null | undefined) => ({
        type: p?.type || '',
        size: p?.size || ''
    })) || [{ type: '', size: '' }], // Initialize with one pet detail
    budget: tripData.budget || '',
    accommodation: tripData.accommodation || '',
    interests: tripData.interests || [],
    additionalInfo: tripData.additionalInfo || '',
    draftId: tripData.draftId || undefined,
  }));

  useEffect(() => {
    const targetLength = formData.pets;
    setFormData((prev) => {
      const currentLength = prev.petDetails.length;
      if (targetLength === currentLength) return prev;

      let newPetDetails = [...prev.petDetails];
      if (targetLength > currentLength) {
        newPetDetails = newPetDetails.concat(
          Array(targetLength - currentLength).fill({ type: '', size: '' })
        );
      } else {
        newPetDetails = newPetDetails.slice(0, targetLength);
      }
      return { ...prev, petDetails: newPetDetails };
    });

    // Check if any pet details are missing type or size
    const hasMissingPetDetails = formData.pets > 0 && formData.petDetails.some(pet => !pet.type || !pet.size);
    setShowPetWarning(hasMissingPetDetails);
  }, [formData.pets, formData.petDetails]);

  const handleInputChange = useCallback((field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      if (field === 'startDate' || field === 'endDate') delete newErrors.dates;
      return newErrors;
    });
  }, []);

  const handlePetDetailChange = useCallback((index: number, field: 'type' | 'size', value: string) => {
    setFormData((prev) => ({
      ...prev,
      petDetails: prev.petDetails.map((pet, i) =>
        i === index ? { ...pet, [field]: value } : pet
      ),
    }));
  }, []);

  const handleMultiSelect = useCallback((field: 'interests', value: string) => {
    setFormData((prev) => {
      const currentValues = prev[field] as string[];
      const updatedValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      return { ...prev, [field]: updatedValues };
    });
    setErrors((prev) => {
        const newErrors = {...prev};
        delete newErrors[field];
        return newErrors;
    });
  }, []);

  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    setFormData((prev) => ({
      ...prev,
      startDate: range?.from || null,
      endDate: range?.to || null,
    }));
    setErrors((prev) => {
        const newErrors = {...prev};
        delete newErrors.startDate;
        delete newErrors.endDate;
        delete newErrors.dates;
        return newErrors;
    });
    // Close the popover if both start and end dates are selected
    if (range?.from && range?.to) {
      setIsCalendarOpen(false);
    }
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.origin) newErrors.origin = 'Origin city is required.';
    if (!formData.destination) newErrors.destination = 'Destination city is required.';
    if (!formData.startDate) newErrors.startDate = 'Start date is required.';
    if (!formData.endDate) newErrors.endDate = 'End date is required.';
    if (formData.startDate && formData.endDate && formData.endDate <= formData.startDate) {
      newErrors.dates = 'End date must be after start date.';
    }

    if (formData.adults < 1) newErrors.adults = 'At least one adult is required.';
    if (!formData.budget) newErrors.budget = 'Budget selection is required.';
    if (!formData.accommodation) newErrors.accommodation = 'Accommodation type is required.';

    setErrors(newErrors);

    // Auto-scroll to the first error
    if (Object.keys(newErrors).length > 0) {
      const firstErrorKey = Object.keys(newErrors)[0];
      let targetRef: HTMLDivElement | null = null;
      if (firstErrorKey === 'origin') targetRef = originRef.current;
      else if (firstErrorKey === 'destination') targetRef = destinationRef.current;
      else if (firstErrorKey === 'startDate' || firstErrorKey === 'endDate' || firstErrorKey === 'dates') targetRef = datesRef.current;
      else if (firstErrorKey === 'adults') targetRef = adultsRef.current;
      else if (firstErrorKey === 'budget') targetRef = budgetRef.current;
      else if (firstErrorKey === 'accommodation') targetRef = accommodationRef.current;
      if (targetRef) {
        targetRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    const newTripData = { ...formData, itinerary: null };

    setTripData(newTripData);

    let draftIdToUpdate = formData.draftId;

    try {
      if (session) {
        const supabase = createClient();
        const { data: upsertedDraft, error: upsertError } = await supabase
          .from('draft_itineraries')
          .upsert({ id: draftIdToUpdate, user_id: session.user.id, trip_data: newTripData, updated_at: new Date().toISOString() })
          .select('id').single();
        if (upsertError) throw new Error(`Failed to save draft: ${(upsertError as PostgrestError).message || 'Unknown error'}`);
        draftIdToUpdate = upsertedDraft.id;
        setFormData((prev) => ({ ...prev, draftId: draftIdToUpdate }));
        setTripData({ ...newTripData, draftId: draftIdToUpdate });
        setToastMessage('Draft saved successfully!');
        setToastOpen(true);
      } else {
        sessionStorage.setItem('tripData', JSON.stringify(newTripData));
        draftIdToUpdate = undefined;
        setFormData((prev) => ({ ...prev, draftId: undefined }));
        setToastMessage('Draft saved locally!');
        setToastOpen(true);
      }
    } catch (error) {
      console.error('[TripCreationForm] Error during draft saving:', error);
      setErrors({ general: error instanceof Error ? error.message : 'An unexpected error occurred while saving.' });
      setToastMessage(error instanceof Error ? error.message : 'Failed to save draft.');
      setToastOpen(true);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/ai/enhanced-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newTripData, draftId: draftIdToUpdate }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response.' }));
        throw new Error(errorData.error || `Failed to generate itinerary (Status: ${response.status})`);
      }
      const itinerary = await response.json();
      const finalTripData = { ...newTripData, draftId: draftIdToUpdate, itinerary };
      setTripData(finalTripData);
      if (session && draftIdToUpdate) {
        const supabase = createClient();
        const { error: updateError } = await supabase.from('draft_itineraries').update({ trip_data: finalTripData, updated_at: new Date().toISOString() }).eq('id', draftIdToUpdate);
        if (updateError) console.error('[TripCreationForm] Non-blocking: Error updating draft with itinerary:', updateError);
      } else {
        sessionStorage.setItem('tripData', JSON.stringify(finalTripData));
      }
      setToastMessage('Itinerary generated successfully!');
      setToastOpen(true);
    } catch (error) {
      console.error('[TripCreationForm] Error during itinerary generation/update:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred while generating itinerary.';
      setErrors({ general: errorMessage });
      setToastMessage(errorMessage);
      setToastOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full p-4 sm:p-6 font-sans">
      <Toast.Provider swipeDirection="right">
        <Toast.Root
          open={toastOpen}
          onOpenChange={setToastOpen}
          className={cn(
            "bg-white border shadow-lg p-4 rounded-lg",
            errors.general ? "border-red-400" : "border-teal-200"
          )}
        >
          <Toast.Title className={cn(
            "font-bold text-base",
            errors.general ? "text-red-700" : "text-teal-700"
          )}>
            {errors.general ? "Error" : "Success"}
          </Toast.Title>
          <Toast.Description className={cn(
            "text-sm",
            errors.general ? "text-red-600" : "text-gray-600"
          )}>
            {toastMessage}
          </Toast.Description>
        </Toast.Root>
        <Toast.Viewport className="fixed bottom-0 right-0 p-6 w-[390px] max-w-[100vw]" />
      </Toast.Provider>

      <h1 className="text-4xl font-bold text-gray-800 tracking-tight mb-4 text-center font-outfit">Tell Us About Your Trip!</h1>
      <p className="text-lg text-gray-600 mb-8 text-center">Help us create the perfect pet-friendly itinerary for you.</p>

      {errors.general && (
           <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
               <strong className="font-bold">Error: </strong>
               <span className="block sm:inline">{errors.general}</span>
           </div>
       )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Location and Dates Section */}
        <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight mb-6 font-outfit">Location and Dates</h2>
          <div className="space-y-6">
            <div ref={originRef} className={cn(errors.origin && "animate-shake")}>
              <Label className="text-base font-medium text-gray-700 flex items-center gap-2 mb-2">
                <MapPin className="h-5 w-5 text-teal-600" /> Traveling From
              </Label>
              <div className={cn(errors.origin && "ring-2 ring-red-500 rounded-md ring-offset-1")}> 
                <CityAutocomplete
                  value={formData.origin}
                  onChange={(value) => handleInputChange('origin', value)}
                  onCountryChange={(country) => handleInputChange('originCountry', country)}
                  placeholder="Enter departure city"
                />
              </div>
              {errors.origin && <p className="text-sm text-red-600 mt-1">{errors.origin}</p>}
            </div>

            <div ref={destinationRef} className={cn(errors.destination && "animate-shake")}>
              <Label className="text-base font-medium text-gray-700 flex items-center gap-2 mb-2">
                <MapPin className="h-5 w-5 text-teal-600" /> Primary Destination
              </Label>
              <div className={cn(errors.destination && "ring-2 ring-red-500 rounded-md ring-offset-1")}> 
                <CityAutocomplete
                  value={formData.destination}
                  onChange={(value) => handleInputChange('destination', value)}
                  onCountryChange={(country) => handleInputChange('destinationCountry', country)}
                  placeholder="Enter main destination city"
                />
              </div>
              {errors.destination && <p className="text-sm text-red-600 mt-1">{errors.destination}</p>}
            </div>

            <div>
              <Label className="text-base font-medium text-gray-700 mb-2 block">Additional Destinations (Optional)</Label>
              <div className="space-y-3">
                {formData.additionalCities.map((city, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CityAutocomplete
                      value={city}
                      onChange={(value) => {
                          const updatedCities = [...formData.additionalCities];
                          updatedCities[index] = value;
                          handleInputChange('additionalCities', updatedCities);
                      }}
                      onCountryChange={(country) => {
                           const updatedCountries = [...(formData.additionalCountries ?? [])];
                           updatedCountries[index] = country;
                          handleInputChange('additionalCountries', updatedCountries);
                      }}
                      placeholder={`Add stop ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const updatedCities = formData.additionalCities.filter((_, i) => i !== index);
                        const updatedCountries = (formData.additionalCountries ?? []).filter((_, i) => i !== index);
                        handleInputChange('additionalCities', updatedCities);
                        handleInputChange('additionalCountries', updatedCountries);
                      }}
                      className="text-red-500 hover:bg-red-100 hover:text-red-700 flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="link"
                onClick={() => handleInputChange('additionalCities', [...formData.additionalCities, ''])}
                className="text-teal-600 hover:text-teal-700 text-sm p-0 mt-2 flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> Add Another Stop
              </Button>
            </div>

            <div ref={datesRef} className={cn((errors.startDate || errors.endDate || errors.dates) && "animate-shake")}>
              <Label className="text-base font-medium text-gray-700 flex items-center gap-2 mb-2">
                 <CalendarDays className="h-5 w-5 text-teal-600" /> Trip Dates
              </Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.startDate && "text-muted-foreground",
                        (errors.startDate || errors.endDate || errors.dates) && "border-red-500 focus:ring-red-500"
                      )}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {formData.startDate ? (
                        formData.endDate ? (
                          <>{format(formData.startDate, "LLL dd, y")} - {format(formData.endDate, "LLL dd, y")}</>
                        ) : (
                          format(formData.startDate, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={formData.startDate ?? new Date()}
                      selected={{
                        from: formData.startDate ?? undefined,
                        to: formData.endDate ?? undefined,
                      }}
                      onSelect={handleDateRangeChange}
                      numberOfMonths={2}
                      pagedNavigation
                      disabled={{ before: new Date() }}
                      showOutsideDays={false}
                      className="rounded-md border p-2"
                      classNames={{
                        months: "relative flex flex-col sm:flex-row gap-8",
                        month: "relative w-full first-of-type:before:hidden before:absolute max-sm:before:inset-x-2 max-sm:before:h-px max-sm:before:-top-2 sm:before:inset-y-2 sm:before:w-px before:bg-border sm:before:-left-4",
                        caption: "flex justify-center pt-1 relative items-center mx-10 mb-1 h-9 z-20",
                        nav: "absolute top-0 flex w-full justify-between z-10",
                        nav_button: cn(buttonVariants({ variant: "ghost" }), "size-9 text-muted-foreground/80 hover:text-foreground p-0"),
                        nav_button_previous: "absolute left-1 top-0",
                        nav_button_next: "absolute right-1 top-0",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex",
                        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected][data-outside])]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 [&:has([aria-selected][data-range-end])]:rounded-r-md",
                        day: "group size-9 px-0 py-px text-sm relative flex items-center justify-center whitespace-nowrap rounded-md p-0 text-foreground group-[[data-selected]:not([data-range-middle])]:[transition-property:color,background-color,border-radius,box-shadow] group-[[data-selected]:not([data-range-middle])]:duration-150 group-data-disabled:pointer-events-none focus-visible:z-10 hover:not-in-data-selected:bg-accent group-data-selected:bg-primary hover:not-in-data-selected:text-foreground group-data-selected:text-primary-foreground group-data-disabled:text-foreground/30 group-data-disabled:line-through group-data-outside:text-foreground/30 group-data-selected:group-data-outside:text-primary-foreground outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] group-[[data-range-start]:not([data-range-end])]:rounded-e-none group-[[data-range-end]:not([data-range-start])]:rounded-s-none group-[data-range-middle]:rounded-none group-[data-range-middle]:group-data-selected:bg-accent group-[data-range-middle]:group-data-selected:text-foreground group-data-today:*:after:pointer-events-none group-data-today:*:after:absolute group-data-today:*:after:bottom-1 group-data-today:*:after:start-1/2 group-data-today:*:after:z-10 group-data-today:*:after:size-[3px] group-data-today:*:after:-translate-x-1/2 group-data-today:*:after:rounded-full group-data-today:*:after:bg-primary group-data-today:[&[data-selected]:not([data-range-middle])>*]:after:bg-background group-data-today:[&[data-disabled]>*]:after:bg-foreground/30 group-data-today:*:after:transition-colors group-data-outside:text-muted-foreground group-data-outside:group-data-selected:bg-accent/50 group-data-outside:group-data-selected:text-muted-foreground group-data-hidden:invisible",
                      }}
                    />
                  </PopoverContent>
                </Popover>
               {(errors.startDate || errors.endDate || errors.dates) &&
                <p className="text-sm text-red-600 mt-1">
                    {errors.startDate || errors.endDate || errors.dates}
                </p>
              }
            </div>
          </div>
        </div>

        {/* Travelers & Preferences Section */}
        <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight mb-6 font-outfit">Travelers & Preferences</h2>
          <div className="space-y-6">
            <div ref={adultsRef} className={cn(errors.adults && "animate-shake")}>
              <Label className="text-base font-medium text-gray-700 mb-2 block">Number of Travelers</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="adults" className="text-sm text-gray-600 flex items-center gap-1">
                    <Users className="h-4 w-4 text-teal-600" /> Adults
                  </Label>
                  <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-none h-8 w-8 border-r bg-gray-100 hover:bg-gray-200" 
                      onClick={() => handleInputChange('adults', Math.max(1, formData.adults - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input 
                      id="adults" 
                      type="number" 
                      value={formData.adults} 
                      onChange={(e) => handleInputChange('adults', Math.max(1, parseInt(e.target.value) || 1))} 
                      min="1" 
                      className="w-12 h-8 text-center border-0 focus:ring-0 focus-visible:ring-0 rounded-none p-0" 
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-none h-8 w-8 border-l bg-gray-100 hover:bg-gray-200" 
                      onClick={() => handleInputChange('adults', formData.adults + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {errors.adults && <p className="text-sm text-red-600 mt-1">{errors.adults}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="children" className="text-sm text-gray-600 flex items-center gap-1">
                    <Baby className="h-4 w-4 text-teal-600" /> Children
                  </Label>
                  <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-none h-8 w-8 border-r bg-gray-100 hover:bg-gray-200" 
                      onClick={() => handleInputChange('children', Math.max(0, formData.children - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input 
                      id="children" 
                      type="number" 
                      value={formData.children} 
                      onChange={(e) => handleInputChange('children', parseInt(e.target.value) || 0)} 
                      min="0" 
                      className="w-12 h-8 text-center border-0 focus:ring-0 focus-visible:ring-0 rounded-none p-0" 
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-none h-8 w-8 border-l bg-gray-100 hover:bg-gray-200" 
                      onClick={() => handleInputChange('children', formData.children + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pets" className="text-sm text-gray-600 flex items-center gap-1">
                    <Dog className="h-4 w-4 text-teal-600" /> Pets
                  </Label>
                  <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-none h-8 w-8 border-r bg-gray-100 hover:bg-gray-200" 
                      onClick={() => handleInputChange('pets', Math.max(0, formData.pets - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input 
                      id="pets" 
                      type="number" 
                      value={formData.pets} 
                      onChange={(e) => handleInputChange('pets', parseInt(e.target.value) || 0)} 
                      min="0" 
                      className="w-12 h-8 text-center border-0 focus:ring-0 focus-visible:ring-0 rounded-none p-0" 
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-none h-8 w-8 border-l bg-gray-100 hover:bg-gray-200" 
                      onClick={() => handleInputChange('pets', formData.pets + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {formData.pets > 0 && (
              <div ref={petDetailsRef} className="space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                <Label className="text-base font-medium text-gray-700 block">Pet Details</Label>
                {Array.from({ length: formData.pets }).map((_, index) => (
                  <div key={`pet-details-${index}`} className="space-y-3 border-b border-gray-200 pb-3 last:border-b-0">
                      <p className="text-sm font-medium text-gray-600">Pet {index + 1}</p>
                     {/* Pet Type */}
                     <div>
                        <Label className="text-sm text-gray-500 block mb-1.5">Type (Optional)</Label>
                        <div className="flex flex-wrap gap-2">
                            {petTypes.map(({ name, icon }) => (
                                <SelectableIconButton
                                  key={name}
                                  value={name}
                                  label={name}
                                  isSelected={formData.petDetails[index]?.type === name}
                                  onSelect={(value) => handlePetDetailChange(index, 'type', value)}
                                  icon={icon}
                                />
                            ))}
                        </div>
                     </div>
                      {/* Pet Size */}
                      <div>
                        <Label className="text-sm text-gray-500 block mb-1.5">Size (Optional)</Label>
                        <div className="flex flex-wrap gap-2">
                            {petSizes.map(({ value, label, icon, size }) => (
                                <SelectableIconButton
                                    key={value}
                                    value={value}
                                    label={label}
                                    isSelected={formData.petDetails[index]?.size === value}
                                    onSelect={(val) => handlePetDetailChange(index, 'size', val)}
                                    icon={icon}
                                    iconSize={size}
                                />
                            ))}
                        </div>
                      </div>
                  </div>
                ))}
                {showPetWarning && (
                  <p className="text-sm text-teal-600 mt-2">
                    Missing pet type or size may lead to constraints. You can modify this later in the itinerary viewer.
                  </p>
                )}
                <a
                    href="/service-animals"
                    target="_blank" rel="noopener noreferrer"
                    className="text-teal-600 hover:text-teal-700 hover:underline text-sm mt-2 inline-block"
                  >
                    Service Animal Information
                  </a>
              </div>
            )}

            <div ref={budgetRef} className={cn(errors.budget && "animate-shake")}>
              <Label className="text-base font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-teal-600" /> Budget
              </Label>
              <div className="flex flex-wrap gap-3">
                  {budgets.map((budget) => (
                      <SelectableIconButton
                        key={budget}
                        value={budget}
                        label={budget}
                        isSelected={formData.budget === budget}
                        onSelect={(value) => handleInputChange('budget', value)}
                        icon={() => (
                            <span className={cn("text-xl font-bold",
                                budget === 'Budget' && "text-green-600",
                                budget === 'Moderate' && "text-yellow-600",
                                budget === 'Luxury' && "text-purple-600",
                            )}>
                                {budget === 'Budget' ? '$' : budget === 'Moderate' ? '$$' : '$$$'}
                            </span>
                        )}
                      />
                  ))}
              </div>
              {errors.budget && <p className="text-sm text-red-600 mt-1">{errors.budget}</p>}
            </div>

            <div ref={accommodationRef} className={cn(errors.accommodation && "animate-shake")}>
              <Label htmlFor="accommodation" className="text-base font-medium text-gray-700 flex items-center gap-2 mb-2">
                <Hotel className="h-5 w-5 text-teal-600" /> Accommodation
              </Label>
              <Select
                value={formData.accommodation}
                onValueChange={(value) => handleInputChange('accommodation', value)}
              >
                <SelectTrigger id="accommodation" className={cn("w-full", errors.accommodation && "border-red-500 focus:ring-red-500")}>
                    <SelectValue placeholder="Select accommodation type" />
                </SelectTrigger>
                <SelectContent>
                    {accommodations.map((acc) => (
                        <SelectItem key={acc} value={acc}>
                            {acc}
                        </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.accommodation && <p className="text-sm text-red-600 mt-1">{errors.accommodation}</p>}
            </div>
          </div>
        </div>

        {/* What's Your Vibe? Section */}
        <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight mb-6 font-outfit">What's Your Vibe?</h2>
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium text-gray-700 mb-2 block">Interests (Optional)</Label>
              <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                      <SelectableTag
                          key={interest}
                          value={interest}
                          isSelected={formData.interests.includes(interest)}
                          onSelect={(value) => handleMultiSelect('interests', value)}
                          icon={interest === 'Outdoor Adventures' ? Mountain : interest === 'Shopping' ? ShoppingBag : undefined}
                      />
                  ))}
              </div>
            </div>

            <div>
              <Label htmlFor="additionalInfo" className="text-base font-medium text-gray-700 flex items-center gap-2 mb-2">
                  <Info className="h-5 w-5 text-teal-600" /> Additional Information (Optional)
              </Label>
              <Textarea
                id="additionalInfo"
                value={formData.additionalInfo}
                onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                placeholder="Any specific requests, preferences, or accessibility needs? (e.g., prefer ground floor, allergic to feathers, need quiet walks)"
                rows={5}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white py-4 -mx-4 px-4 shadow-top">
          <div className="flex justify-end max-w-2xl mx-auto">
            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 rounded-lg font-medium text-lg disabled:opacity-50 shadow-sm hover:shadow transition-all"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Trip...
                </>
              ) : (
                'Generate My Trip'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}