'use client';

import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useTripStore, TripData } from '@/store/tripStore';
import CityAutocomplete from './CityAutocomplete';
import { createClient } from '@/lib/supabase-client';
import { PostgrestError } from '@supabase/supabase-js';
import { format, parse, isValid, isAfter } from "date-fns";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Home,
  Bed,
  Tent,
  Search,
  Building,
  CalendarRange,
  PlaneTakeoff,
  PlaneLanding,
  MapPinned,
  UserRound,
  PawPrint,
  HeartHandshake,
  PiggyBank,
  PencilLine,
  Grip,
  Ticket,
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

interface ValidationState {
  origin: boolean;
  destination: boolean;
  startDate: boolean;
  endDate: boolean;
  adults: boolean;
  budget: boolean;
  accommodation: boolean;
  interacted: Set<keyof FormData>;
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
    type="button"
    variant={isSelected ? 'default' : 'outline'}
    size="sm"
    onClick={() => onSelect(value)}
    className={cn(
      'flex items-center gap-2 text-base transition-colors duration-150 ease-in-out h-12 py-2 px-4 rounded-full border',
      isSelected
        ? 'bg-teal-500 text-white border-teal-500 hover:bg-teal-600'
        : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400'
    )}
  >
    {Icon && <Icon className="h-5 w-5" />}
    {value}
    {isSelected && <Check className="h-5 w-5 ml-2" />}
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
    type="button"
    variant="outline"
    onClick={() => onSelect(value)}
    className={cn(
      'flex flex-col items-center justify-center gap-1.5 p-3 h-auto min-h-[80px] min-w-[80px] border rounded-lg transition-colors duration-150 ease-in-out text-center',
      isSelected
        ? 'bg-teal-100 border-teal-500 text-teal-700 ring-2 ring-teal-500 ring-offset-1'
        : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400'
    )}
  >
    <Icon className="h-8 w-8" size={iconSize} />
    {label && <span className="text-sm font-medium mt-1 break-words max-w-full">{label}</span>} 
  </Button>
);

// --- Main Form Component ---

export default function TripCreationForm({
  session,
  onClose,
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
  const [showSummary, setShowSummary] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>({
    origin: false,
    destination: false,
    startDate: false,
    endDate: false,
    adults: false,
    budget: false,
    accommodation: false,
    interacted: new Set(),
  });
  const [dateInput, setDateInput] = useState({ start: '', end: '' });

  // Refs for auto-scrolling to errors
  const originRef = useRef<HTMLDivElement>(null);
  const destinationRef = useRef<HTMLDivElement>(null);
  const datesRef = useRef<HTMLDivElement>(null);
  const adultsRef = useRef<HTMLDivElement>(null);
  const budgetRef = useRef<HTMLDivElement>(null);
  const accommodationRef = useRef<HTMLDivElement>(null);
  const petDetailsRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormData>(() => ({
    origin: tripData?.origin || '',
    originCountry: tripData?.originCountry || '',
    destination: tripData?.destination || '',
    destinationCountry: tripData?.destinationCountry || '',
    additionalCities: tripData?.additionalCities || [],
    additionalCountries: tripData?.additionalCountries || [],
    startDate: tripData?.startDate ? new Date(tripData.startDate) : null,
    endDate: tripData?.endDate ? new Date(tripData.endDate) : null,
    adults: tripData?.adults || 1,
    children: tripData?.children || 0,
    pets: tripData?.pets || 1,
    petDetails: tripData?.petDetails?.map((p: { type?: string; size?: string } | null | undefined) => ({
        type: p?.type || '',
        size: p?.size || ''
    })) || [{ type: '', size: '' }],
    budget: tripData?.budget || 'Moderate',
    accommodation: tripData?.accommodation || 'Hotels',
    interests: tripData?.interests || [],
    additionalInfo: tripData?.additionalInfo || '',
    draftId: tripData?.draftId || undefined,
  }));

  // Initialize date input based on formData
  useEffect(() => {
    setDateInput({
      start: formData.startDate ? format(formData.startDate, "MMM dd, y") : '',
      end: formData.endDate ? format(formData.endDate, "MMM dd, y") : '',
    });
  }, [formData.startDate, formData.endDate]);

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
    setValidationState((prev) => ({
      ...prev,
      interacted: new Set(prev.interacted).add(field),
    }));
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
    setValidationState((prev) => ({
      ...prev,
      interacted: new Set(prev.interacted).add(field),
    }));
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
    setValidationState((prev) => ({
      ...prev,
      startDate: !!range?.from,
      endDate: !!range?.to,
      interacted: new Set(prev.interacted).add('startDate').add('endDate'),
    }));
    // Update date input fields and close the popover if both dates are selected
    if (range?.from) {
      setDateInput((prev) => ({
        ...prev,
        start: format(range.from!, "MMM dd, y"),
      }));
    }
    if (range?.to) {
      setDateInput((prev) => ({
        ...prev,
        end: format(range.to!, "MMM dd, y"),
      }));
    }
    if (range?.from && range?.to) {
      setIsCalendarOpen(false);
    }
  }, []);

  const handleDateInputChange = (field: 'start' | 'end', value: string) => {
    setDateInput((prev) => ({ ...prev, [field]: value }));

    const parsedDate = parse(value, "MMM dd, y", new Date());
    if (isValid(parsedDate)) {
      setFormData((prev) => ({
        ...prev,
        [field === 'start' ? 'startDate' : 'endDate']: parsedDate,
      }));
      setValidationState((prev) => ({
        ...prev,
        [field === 'start' ? 'startDate' : 'endDate']: true,
        interacted: new Set(prev.interacted).add(field === 'start' ? 'startDate' : 'endDate'),
      }));
    } else {
      const naturalParse = parse(value, "iiii", new Date()); // Try parsing "next Friday"
      if (isValid(naturalParse) && isAfter(naturalParse, new Date())) {
        setFormData((prev) => ({
          ...prev,
          [field === 'start' ? 'startDate' : 'endDate']: naturalParse,
        }));
        setValidationState((prev) => ({
          ...prev,
          [field === 'start' ? 'startDate' : 'endDate']: true,
          interacted: new Set(prev.interacted).add(field === 'start' ? 'startDate' : 'endDate'),
        }));
        setDateInput((prev) => ({
          ...prev,
          [field]: format(naturalParse, "MMM dd, y"),
        }));
      } else {
        setValidationState((prev) => ({
          ...prev,
          [field === 'start' ? 'startDate' : 'endDate']: false,
          interacted: new Set(prev.interacted).add(field === 'start' ? 'startDate' : 'endDate'),
        }));
      }
    }
  };

  const validateField = useCallback((field: keyof FormData) => {
    const newErrors: { [key: string]: string } = {};

    switch (field) {
      case 'origin':
        if (!formData.origin) newErrors.origin = 'Please enter your departure city.';
        break;
      case 'destination':
        if (!formData.destination) newErrors.destination = 'Please enter your main destination city.';
        break;
      case 'startDate':
      case 'endDate':
        if (!formData.startDate) newErrors.startDate = 'Please select a start date.';
        if (!formData.endDate) newErrors.endDate = 'Please select an end date.';
        if (formData.startDate && formData.endDate && formData.endDate <= formData.startDate) {
          newErrors.dates = 'End date must be after start date.';
        }
        break;
      case 'adults':
        if (formData.adults < 1) newErrors.adults = 'At least one adult is required.';
        break;
      case 'budget':
        // Removed validation as it now has a default
        // if (!formData.budget) newErrors.budget = 'Please select a budget.';
        break;
      case 'accommodation':
        // Removed validation as it now has a default
        // if (!formData.accommodation) newErrors.accommodation = 'Please select an accommodation type.';
        break;
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    setValidationState((prev) => ({
      ...prev,
      [field]: !newErrors[field],
    }));
  }, [formData]);

  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.origin) newErrors.origin = 'Please enter your departure city.';
    if (!formData.destination) newErrors.destination = 'Please enter your main destination city.';
    if (!formData.startDate) newErrors.startDate = 'Please select a start date.';
    if (!formData.endDate) newErrors.endDate = 'Please select an end date.';
    if (formData.startDate && formData.endDate && formData.endDate <= formData.startDate) {
      newErrors.dates = 'End date must be after start date.';
    }
    if (formData.adults < 1) newErrors.adults = 'At least one adult is required.';
    // Removed budget validation check
    // if (!formData.budget) newErrors.budget = 'Please select a budget.';

    setErrors(newErrors);

    setValidationState((prev) => ({
      ...prev,
      origin: !!formData.origin,
      destination: !!formData.destination,
      startDate: !!formData.startDate,
      endDate: !!formData.endDate,
      adults: formData.adults >= 1,
      budget: true, // <-- Always true due to default
      accommodation: true,
    }));

    // Auto-scroll to the first error
    if (Object.keys(newErrors).length > 0) {
       const firstErrorKey = Object.keys(newErrors)[0];
       let targetRef: HTMLDivElement | null = null;
       if (firstErrorKey === 'origin') targetRef = originRef.current;
       else if (firstErrorKey === 'destination') targetRef = destinationRef.current;
       else if (firstErrorKey === 'startDate' || firstErrorKey === 'endDate' || firstErrorKey === 'dates') targetRef = datesRef.current;
       else if (firstErrorKey === 'adults') targetRef = adultsRef.current;
       else if (firstErrorKey === 'budget') targetRef = budgetRef.current;
       // Removed accommodation from scroll target logic
       // else if (firstErrorKey === 'accommodation') targetRef = accommodationRef.current;
       if (targetRef) {
         targetRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
       }
     }

    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const getMissingFieldsCount = () => {
    let count = 0;
    if (!formData.origin) count++;
    if (!formData.destination) count++;
    if (!formData.startDate) count++;
    if (!formData.endDate) count++;
    if (formData.adults < 1) count++;
    if (!formData.budget) count++;
    // Removed accommodation from count logic
    // if (!formData.accommodation) count++;
    return count;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowSummary(true);
    if (!validateForm()) {
      setToastMessage(`Please complete the form: ${getMissingFieldsCount()} field${getMissingFieldsCount() !== 1 ? 's' : ''} remaining.`);
      setToastOpen(true);
      return;
    }
  
    setIsLoading(true);
    setErrors({});

    // Prepare data for API/store, ensuring type safety
    const finalFormData: Partial<TripData> = {
      ...formData,
      startDate: formData.startDate ? formData.startDate.toISOString().split('T')[0] : undefined,
      endDate: formData.endDate ? formData.endDate.toISOString().split('T')[0] : undefined,
      // Explicitly set itinerary and policy fields to undefined or null
      // if they shouldn't be part of the *initial* submission data
      // but ensure they are optional in the TripData type
      itinerary: undefined,
      policyRequirements: undefined,
      generalPreparation: undefined,
      preDeparturePreparation: undefined,
    };

    // Set the data in the store (no `as any` needed if types match)
    setTripData(finalFormData as TripData);

    let draftIdToUpdate = formData.draftId;
  
    try {
      if (session) {
        const supabase = createClient();
        const { data: upsertedDraft, error: upsertError } = await supabase
          .from('draft_itineraries')
          .upsert({ id: draftIdToUpdate, user_id: session.user.id, trip_data: finalFormData, updated_at: new Date().toISOString() })
          .select('id').single();
        if (upsertError) throw new Error(`Failed to save draft: ${(upsertError as PostgrestError).message || 'Unknown error'}`);
        draftIdToUpdate = upsertedDraft.id;
        setFormData((prev) => ({ ...prev, draftId: draftIdToUpdate }));
        setTripData({ ...finalFormData, draftId: draftIdToUpdate } as TripData);
        setToastMessage('Draft saved successfully!');
        setToastOpen(true);
      } else {
        sessionStorage.setItem('tripData', JSON.stringify(finalFormData));
        draftIdToUpdate = undefined;
        setFormData((prev) => ({ ...prev, draftId: undefined }));
        setTripData({ ...finalFormData, draftId: undefined } as TripData);
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
      console.log("Submitting trip data to API:", finalFormData);
      const response = await fetch('/api/ai/enhanced-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalFormData),
      });
  
      console.log("API Response Status:", response.status);
  
      if (!response.ok) {
        let errorBody = 'Unknown error';
        try {
          errorBody = await response.text();
          console.error("API Error Response Body:", errorBody);
        } catch (textError) {
          console.error("Could not read error response body:", textError);
        }
        throw new Error(`API Error (${response.status}): ${response.statusText}. Details: ${errorBody}`);
      }
  
      let result: any;
      try {
        result = await response.json();
        console.log("API Response JSON:", result);
      } catch (parseError: any) {
        console.error("Failed to parse API response JSON:", parseError);
        throw new Error('Failed to parse itinerary response from server.');
      }
  
      if (!result || typeof result !== 'object') {
          throw new Error('Invalid response format received from server.');
      }
      
      if (!result.itinerary || typeof result.itinerary !== 'object' || !Array.isArray(result.itinerary.days)) {
        if (result.error && typeof result.error === 'string') { 
           console.error('API returned an error message:', result.error);
           throw new Error(`Itinerary generation failed: ${result.error}`);
        } else {
          console.error('Invalid itinerary structure received:', result.itinerary);
          throw new Error('Generated itinerary data is missing or malformed.');
        }
      }
  
      console.log("Generated itinerary:", result.itinerary);
  
      // Assuming result has { itinerary, policyRequirements, generalPreparation, preDeparturePreparation }
      const finalTripDataWithResults: TripData = {
        // Ensure all fields from TripData are present or optional
        origin: finalFormData.origin ?? '',
        originCountry: finalFormData.originCountry ?? '',
        destination: finalFormData.destination ?? '',
        destinationCountry: finalFormData.destinationCountry ?? '',
        additionalCities: finalFormData.additionalCities ?? [],
        additionalCountries: finalFormData.additionalCountries ?? [],
        startDate: finalFormData.startDate,
        endDate: finalFormData.endDate,
        adults: finalFormData.adults ?? 1,
        children: finalFormData.children ?? 0,
        pets: finalFormData.pets ?? 0,
        petDetails: finalFormData.petDetails ?? [],
        budget: finalFormData.budget ?? '',
        accommodation: finalFormData.accommodation ?? 'Hotels',
        interests: finalFormData.interests ?? [],
        additionalInfo: finalFormData.additionalInfo ?? '',
        itinerary: result.itinerary,
        policyRequirements: result.policyRequirements,
        generalPreparation: result.generalPreparation,
        preDeparturePreparation: result.preDeparturePreparation,
        draftId: draftIdToUpdate, // Keep draftId
      };

      // Set final data in the store (no `as any` needed)
      setTripData(finalTripDataWithResults);
  
      if (session && draftIdToUpdate) {
        const supabase = createClient();
        console.log('[TripCreationForm] Attempting final update to draft ID:', draftIdToUpdate, 'with data containing itinerary:', !!finalTripDataWithResults.itinerary);
        const { error: updateError } = await supabase
          .from('draft_itineraries')
          .update({ trip_data: finalTripDataWithResults, updated_at: new Date().toISOString() })
          .eq('id', draftIdToUpdate);
        if (updateError) {
          console.error('[TripCreationForm] CRITICAL: Failed to update draft with generated itinerary:', updateError);
          // Optionally, inform the user the final save failed
          setToastMessage("Itinerary generated, but failed to save final state. Please save manually if needed.");
          setToastOpen(true); // Show a toast for the update failure
        } else {
          console.log('[TripCreationForm] Successfully updated draft with generated itinerary.');
          // Existing success toast message (or modify if needed)
          setToastMessage("Itinerary generated successfully!");
          setToastOpen(true);
        }
      } else {
        // Guest user or no draftId - save to sessionStorage
        console.log('[TripCreationForm] Saving final results to sessionStorage for guest user.');
        sessionStorage.setItem('tripData', JSON.stringify(finalTripDataWithResults));
        setToastMessage("Itinerary generated successfully!");
        setToastOpen(true);
      }
      
      // Move onClose call outside the try block to ensure it always happens on logical success
      // but potentially inside the if/else blocks if you only want it after successful save
      if (onClose) onClose(); // Close form on success (API call succeeded)

    } catch (error: any) {
      console.error("Error in handleSubmit:", error);
      setErrors({ submit: error.message || 'An unexpected error occurred during itinerary generation.' });
      setToastMessage(error.message || 'Failed to generate itinerary. Please try again.');
      setToastOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to render validation errors
  const renderError = (field: keyof FormData) => {
    if (validationState.interacted.has(field) && !validationState[field as keyof Omit<ValidationState, 'interacted'>]) {
      return (
        <p className="text-sm text-red-600 mt-1">{errors[field]}</p>
      );
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 font-sans">
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

      {showSummary && getMissingFieldsCount() > 0 && (
        <div className="bg-teal-50 border border-teal-200 text-teal-700 px-4 py-3 rounded-lg mb-6">
          Just {getMissingFieldsCount()} more thing{getMissingFieldsCount() !== 1 ? 's' : ''} before we fetch your pet's travel rules.
        </div>
      )}

      <h1 className="text-4xl font-bold text-gray-800 tracking-tight mb-4 text-center font-outfit">Tell Us About Your Trip!</h1>
      <p className="text-lg text-gray-600 mb-8 text-center">Help us create the perfect pet-friendly itinerary for you.</p>

      {errors.general && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{errors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Location and Dates Section - Revised Layout */}
        <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight mb-6 font-outfit">Location and Dates</h2>
          {/* Grid for two columns on medium screens+ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            {/* Column 1: Origin & Destination */}
            <div className="space-y-6">
              {/* Origin */}
              <div ref={originRef} className={'relative'}>
                <Label htmlFor='origin-input' className="text-base font-medium text-gray-700 flex items-center gap-2 mb-2">
                  <PlaneTakeoff className="h-5 w-5 text-teal-600" /> Traveling From
                </Label>
                <div className="relative flex items-center">
                   <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none z-10" />
                   <CityAutocomplete
                     inputId='origin-input'
                     value={formData.origin}
                     onChange={(value) => handleInputChange('origin', value)}
                     onCountryChange={(country) => handleInputChange('originCountry', country)}
                     placeholder="Enter departure city"
                     className="pl-10 h-12"
                   />
                 </div>
                 {renderError('origin')}
                 <p className="text-sm text-gray-500 mt-1">We'll use this to check pet rules for your origin.</p>
              </div>

              {/* Destination (Changed Label and Icon) */}
              <div ref={destinationRef} className={'relative'}>
                <Label htmlFor='destination-input' className="text-base font-medium text-gray-700 flex items-center gap-2 mb-2">
                  <PlaneLanding className="h-5 w-5 text-teal-600" /> Traveling To
                </Label>
                <div className="relative flex items-center">
                   <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none z-10" />
                   <CityAutocomplete
                     inputId='destination-input'
                     value={formData.destination}
                     onChange={(value) => handleInputChange('destination', value)}
                     onCountryChange={(country) => handleInputChange('destinationCountry', country)}
                     placeholder="Enter main destination city"
                     className="pl-10 h-12"
                   />
                 </div>
                {renderError('destination')}
                <p className="text-sm text-gray-500 mt-1">We'll use this to check pet rules for your destination.</p>
              </div>
            </div>

            {/* Column 2: Dates & Additional Destinations */}
            <div className="space-y-6">
              {/* Dates */}
              <div ref={datesRef} className={'relative'}>
                <Label className="text-base font-medium text-gray-700 flex items-center gap-2 mb-2">
                  <CalendarDays className="h-5 w-5 text-teal-600" /> Trip Dates
                </Label>
                <div className="relative flex gap-4">
                   {/* Start Date Input */}
                   <div className="flex-1 relative">
                     <Input
                       value={dateInput.start}
                       onChange={(e) => handleDateInputChange('start', e.target.value)}
                       placeholder="Start date"
                       className={cn(
                         "w-full h-12 p-3 text-base border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500",
                         validationState.interacted.has('startDate') && !validationState.startDate && "border-amber-300"
                       )}
                     />
                     {renderError('startDate')}
                   </div>
                   {/* End Date Input */}
                   <div className="flex-1 relative">
                     <Input
                       value={dateInput.end}
                       onChange={(e) => handleDateInputChange('end', e.target.value)}
                       placeholder="End date"
                       className={cn(
                         "w-full h-12 p-3 text-base border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500",
                         validationState.interacted.has('endDate') && !validationState.endDate && "border-amber-300"
                       )}
                     />
                     {renderError('endDate')}
                   </div>
                   {/* Calendar Popover */}
                   <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                     <PopoverTrigger asChild>
                       <Button
                         variant="outline"
                         className="h-12 w-12 p-0 flex-shrink-0"
                       >
                         <CalendarDays className="h-5 w-5" />
                       </Button>
                     </PopoverTrigger>
                     <PopoverContent className="w-auto p-0" align="end">
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
                       />
                     </PopoverContent>
                   </Popover>
                </div>
                {(renderError('startDate') || renderError('endDate')) && (validationState.interacted.has('startDate') || validationState.interacted.has('endDate')) && (
                   <p className="text-sm text-red-600 mt-1">
                     {errors.startDate || errors.endDate || errors.dates || 'Invalid date range or format.'}
                   </p>
                )}
                 <p className="text-sm text-gray-500 mt-1">Choose your travel dates.</p> {/* Shortened helper text */}
              </div>

              {/* Additional Destinations (Added Icon) */}
              <div>
                <Label className="text-base font-medium text-gray-700 mb-2 flex items-center gap-2">
                   <Ticket className="h-5 w-5 text-teal-600" /> Additional Stops (Optional)
                </Label>
                <div className="space-y-3">
                  {formData.additionalCities.map((city, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="relative flex items-center flex-grow">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none z-10" />
                        <CityAutocomplete
                          inputId={`additionalCity-${index}`}
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
                          className="pl-10 h-12"
                        />
                      </div>
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
                        className="text-red-500 hover:bg-red-100 hover:text-red-700 flex-shrink-0 h-12 w-12"
                      >
                        <X className="h-5 w-5" />
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
                  <Plus className="h-5 w-5" /> Add Another Stop
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Travelers & Preferences Section */}
        <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight mb-6 font-outfit">Travelers & Preferences</h2>
          <div className="space-y-6">
            <div ref={adultsRef}>
              <Label className="text-base font-medium text-gray-700 mb-2 block">Number of Travelers</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="adults" className="text-sm text-gray-600 flex items-center gap-1">
                    <Users className="h-5 w-5 text-teal-600" /> Adults
                  </Label>
                  <div className="flex items-center border border-gray-300 rounded-md overflow-hidden h-12">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-none h-full w-12 border-r bg-gray-50 hover:bg-gray-100 text-gray-700"
                      onClick={() => handleInputChange('adults', Math.max(1, formData.adults - 1))}
                      aria-label="Decrease adults"
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <Input
                      id="adults"
                      type="number"
                      value={formData.adults}
                      onChange={(e) => handleInputChange('adults', Math.max(1, parseInt(e.target.value) || 1))}
                      onBlur={() => validateField('adults')}
                      min="1"
                      className={cn(
                        "flex-1 h-full w-auto min-w-[40px] text-base text-center border-0 focus:ring-0 focus-visible:ring-0 rounded-none p-0",
                        validationState.interacted.has('adults') && !validationState.adults && "bg-red-50 border-amber-300"
                      )}
                      aria-invalid={validationState.interacted.has('adults') && !validationState.adults}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-none h-full w-12 border-l bg-gray-50 hover:bg-gray-100 text-gray-700"
                      onClick={() => handleInputChange('adults', formData.adults + 1)}
                      aria-label="Increase adults"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  {renderError('adults')}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="children" className="text-sm text-gray-600 flex items-center gap-1">
                    <Baby className="h-5 w-5 text-teal-600" /> Children
                  </Label>
                  <div className="flex items-center border border-gray-300 rounded-md overflow-hidden h-12">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-none h-full w-12 border-r bg-gray-50 hover:bg-gray-100 text-gray-700"
                      onClick={() => handleInputChange('children', Math.max(0, formData.children - 1))}
                      aria-label="Decrease children"
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <Input
                      id="children"
                      type="number"
                      value={formData.children}
                      onChange={(e) => handleInputChange('children', parseInt(e.target.value) || 0)}
                      min="0"
                      className="flex-1 h-full w-auto min-w-[40px] text-base text-center border-0 focus:ring-0 focus-visible:ring-0 rounded-none p-0"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-none h-full w-12 border-l bg-gray-50 hover:bg-gray-100 text-gray-700"
                      onClick={() => handleInputChange('children', formData.children + 1)}
                      aria-label="Increase children"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pets" className="text-sm text-gray-600 flex items-center gap-1">
                    <Dog className="h-5 w-5 text-teal-600" /> Pets
                  </Label>
                  <div className="flex items-center border border-gray-300 rounded-md overflow-hidden h-12">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-none h-full w-12 border-r bg-gray-50 hover:bg-gray-100 text-gray-700"
                      onClick={() => handleInputChange('pets', Math.max(0, formData.pets - 1))}
                      aria-label="Decrease pets"
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <Input
                      id="pets"
                      type="number"
                      value={formData.pets}
                      onChange={(e) => handleInputChange('pets', parseInt(e.target.value) || 0)}
                      min="0"
                      className="flex-1 h-full w-auto min-w-[40px] text-base text-center border-0 focus:ring-0 focus-visible:ring-0 rounded-none p-0"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-none h-full w-12 border-l bg-gray-50 hover:bg-gray-100 text-gray-700"
                      onClick={() => handleInputChange('pets', formData.pets + 1)}
                      aria-label="Increase pets"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {formData.pets > 0 && (
              <div ref={petDetailsRef} className="space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                <Label className="text-base font-medium text-gray-700 block">Pet Details</Label>
                {Array.from({ length: formData.pets }).map((_, index) => (
                  <div key={`pet-details-${index}`} className="space-y-4 border-b border-gray-200 pb-4 last:border-b-0">
                      <p className="text-sm font-medium text-gray-600">Pet {index + 1}</p>
                     <div>
                        <Label className="text-sm text-gray-500 block mb-1.5">Type (Optional)</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                      <div>
                        <Label className="text-sm text-gray-500 block mb-1.5">Size (Optional)</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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

            <div ref={budgetRef}>
              <Label className="text-base font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-teal-600" /> Budget
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {budgets.map((budget) => (
                  <SelectableIconButton
                    key={budget}
                    value={budget}
                    label={budget}
                    isSelected={formData.budget === budget}
                    onSelect={(value) => {
                      handleInputChange('budget', value);
                    }}
                    icon={() => (
                      <DollarSign
                        className={cn(
                          "h-8 w-8",
                          budget === 'Budget' && "text-green-600",
                          budget === 'Moderate' && "text-yellow-600",
                          budget === 'Luxury' && "text-purple-600",
                        )}
                      />
                    )}
                  />
                ))}
              </div>
              {renderError('budget')}
              <p className="text-sm text-gray-500 mt-1">Helps us suggest activities within your budget.</p>
            </div>

            <div ref={accommodationRef}>
              <Label className="text-base font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Hotel className="h-5 w-5 text-teal-600" /> Accommodation
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                 {accommodations.map((acc) => {
                    let IconComponent;
                    switch (acc) {
                      case 'Hotels': IconComponent = Hotel; break;
                      case 'Homes/Apartments': IconComponent = Home; break;
                      case 'B&Bs': IconComponent = Bed; break;
                      case 'Hostels': IconComponent = Tent; break;
                      case 'Flexible': IconComponent = Search; break;
                      default: IconComponent = Hotel;
                    }
                    return (
                      <SelectableIconButton
                        key={acc}
                        value={acc}
                        label={acc}
                        isSelected={formData.accommodation === acc}
                        onSelect={(value) => handleInputChange('accommodation', value)}
                        icon={IconComponent}
                      />
                    );
                  })}
              </div>
              {renderError('accommodation')}
              <p className="text-sm text-gray-500 mt-1">We'll ensure it's pet-friendly.</p>
            </div>
          </div>
        </div>

        {/* What's Your Vibe? Section */}
        <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight mb-6 font-outfit">What's Your Vibe?</h2>
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium text-gray-700 mb-2 block">Interests (Optional)</Label>
              <div className="flex flex-wrap gap-4">
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
              <p className="text-sm text-gray-500 mt-1">We'll suggest activities based on your interests.</p>
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
                className="w-full p-3 text-base border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 h-auto"
              />
              <p className="text-sm text-gray-500 mt-1">Let us know any special requirements for your trip.</p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white py-4 -mx-4 px-4 shadow-top border-t border-gray-200">
          <div className="flex justify-end max-w-4xl mx-auto">
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