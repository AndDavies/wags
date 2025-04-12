'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  MapPin, 
  Calendar as CalendarIcon, 
  Dog, 
  Users, 
  Cat, 
  Bird,
  Rabbit, 
  HelpCircle,
  PawPrint,
  Luggage,
  AlertTriangle,
  Car,
  Plane,
  Hotel,
  Home,
  Building,
  Tent,
  DollarSign,
  Palmtree,
  Mountain,
  Utensils,
  Camera,
  Umbrella,
  Music,
  Coffee,
  Wine,
  Landmark,
  ShoppingBag,
  ArrowRight,
  Baby,
  UserCircle2,
  Trees,
  Footprints,
  Flower,
  Waves,
  Leaf,
  Sun,
  PlaneTakeoff,
  PlaneLanding
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, differenceInDays, addDays } from 'date-fns';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import CityAutocomplete from './CityAutocomplete';

type TripData = {
  // Step 1: Location & Dates
  primaryDestination: string;
  additionalCities: string[];
  startDate: Date | null;
  endDate: Date | null;
  origin: string;
  
  // Step 2: Pet Details
  petType: string;
  petSize: string;
  petBreed: string;
  vaccinations: string[];
  temperament: string;
  petServices: string[];
  
  // Step 3: Preferences
  numPeople: number;
  numChildren: number;
  numPets: number;
  budget: 'budget' | 'moderate' | 'luxury' | '';
  accommodationType: string[];
  interests: string[];
};

const initialTripData: TripData = {
  primaryDestination: '',
  additionalCities: [],
  startDate: null,
  endDate: null,
  origin: '',
  petType: '',
  petSize: '',
  petBreed: '',
  vaccinations: [],
  temperament: '',
  petServices: [],
  numPeople: 1,
  numChildren: 0,
  numPets: 1,
  budget: '',
  accommodationType: [],
  interests: [],
};

type TripModalStepperProps = {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (tripData: TripData) => void;
  defaultData?: Partial<TripData>;
};

export function TripModalStepper({ 
  isOpen, 
  onClose, 
  onComplete,
  defaultData = {} 
}: TripModalStepperProps) {
  const [step, setStep] = useState(1);
  const [tripData, setTripData] = useState<TripData>(() => {
    // First check localStorage for existing data when component mounts
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('tripData');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          // Convert date strings back to Date objects
          if (parsedData.startDate) parsedData.startDate = new Date(parsedData.startDate);
          if (parsedData.endDate) parsedData.endDate = new Date(parsedData.endDate);
          
          return { ...initialTripData, ...parsedData };
        } catch (e) {
          console.error('Error parsing saved trip data:', e);
        }
      }
    }
    // Fallback to default data or initial state
    return { ...initialTripData, ...defaultData };
  });
  const router = useRouter();
  
  // localStorage for trip data
  useEffect(() => {
    // Save to localStorage whenever tripData changes
    if (typeof window !== 'undefined') {
      localStorage.setItem('tripData', JSON.stringify(tripData));
    }
  }, [tripData]);
  
  const updateTripData = (field: keyof TripData, value: string | string[] | number | Date | null | boolean) => {
    setTripData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Function to clear trip data from localStorage
  const clearTripData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tripData');
      setTripData(initialTripData);
    }
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      onComplete(tripData);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return tripData.primaryDestination && tripData.startDate && tripData.endDate;
      case 2:
        return tripData.petType && tripData.petSize;
      case 3:
        return tripData.numPeople > 0 && tripData.budget;
      case 4:
        return true;
      default:
        return false;
    }
  };

  // Debug function to log trip data
  const logTripData = (data: TripData) => {
    console.group('Trip Data Debug');
    console.log('Trip Data:', JSON.parse(JSON.stringify(data)));
    console.log('Location & Dates:', {
      destination: data.primaryDestination,
      origin: data.origin,
      dates: data.startDate && data.endDate 
        ? `${format(data.startDate, 'MMM d, yyyy')} - ${format(data.endDate, 'MMM d, yyyy')} (${differenceInDays(data.endDate, data.startDate) + 1} days)` 
        : 'Not set',
      additionalCities: data.additionalCities
    });
    console.log('Pet Details:', {
      type: data.petType,
      size: data.petSize,
      breed: data.petBreed
    });
    console.log('Preferences:', {
      travelers: {
        adults: data.numPeople,
        children: data.numChildren,
        pets: data.numPets
      },
      budget: data.budget,
      accommodationType: data.accommodationType,
      interests: data.interests
    });
    console.groupEnd();
  };

  // Log trip data whenever it changes (for development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logTripData(tripData);
    }
  }, [tripData]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="max-w-4xl mx-auto flex flex-col md:flex-row p-0 gap-0">
        {/* Left side: Image and trip preview */}
        <div className="w-full md:w-2/5 bg-primary/10 p-6 rounded-l-lg relative overflow-hidden">
          <div 
            className="absolute inset-0 opacity-20 z-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/images/travel-with-pet.jpg')",
              filter: "blur(2px)"
            }}
          />
          
          <div className="relative z-10">
            <h3 className="text-xl font-semibold mb-6 text-primary">Your Trip Preview</h3>
            
            <div className="rounded-lg bg-white/80 backdrop-blur-sm p-4 space-y-6 shadow-sm">
              {/* Destination & Date Preview */}
              <div>
                <div className="flex gap-2 items-center">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h4 className="font-medium">Destination</h4>
                </div>
                <p className="pl-7 mt-1">
                  {tripData.primaryDestination || 'Where are you going?'}
                </p>
                {tripData.additionalCities.length > 0 && (
                  <p className="pl-7 text-sm text-gray-600">
                    Also visiting: {tripData.additionalCities.join(', ')}
                  </p>
                )}
              </div>
              
              {/* Date Preview */}
              <div>
                <div className="flex gap-2 items-center">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  <h4 className="font-medium">Dates</h4>
                </div>
                <p className="pl-7 mt-1">
                  {tripData.startDate && tripData.endDate ? (
                    <>
                      {format(tripData.startDate, 'MMM d')} - {format(tripData.endDate, 'MMM d, yyyy')}
                      <span className="text-sm text-gray-600 ml-2">
                        ({differenceInDays(tripData.endDate, tripData.startDate) + 1} days)
                      </span>
                    </>
                  ) : (
                    'When will you travel?'
                  )}
                </p>
              </div>
              
              {/* Pet Details Preview */}
              <div>
                <div className="flex gap-2 items-center">
                  <PawPrint className="h-5 w-5 text-primary" />
                  <h4 className="font-medium">Pet Details</h4>
                </div>
                <div className="pl-7 mt-1">
                  {tripData.petType ? (
                    <div className="flex items-center gap-1">
                      {tripData.petType === 'dog' && <Dog className="h-4 w-4 text-primary" />}
                      {tripData.petType === 'cat' && <Cat className="h-4 w-4 text-primary" />}
                      {tripData.petType === 'bird' && <Bird className="h-4 w-4 text-primary" />}
                      {tripData.petType === 'rabbit' && <Rabbit className="h-4 w-4 text-primary" />}
                      {tripData.petType === 'other' && <HelpCircle className="h-4 w-4 text-primary" />}
                      <span className="capitalize">{tripData.petType}</span>
                      {tripData.petSize && (
                        <span className="text-gray-600">
                          {' • '}
                          {tripData.petSize === 'small' ? 'Small (up to 20 lbs)' : 
                           tripData.petSize === 'medium' ? 'Medium (20-60 lbs)' : 
                           'Large (over 60 lbs)'}
                        </span>
                      )}
                    </div>
                  ) : (
                    'What pet will join you?'
                  )}
                </div>
              </div>
              
              {/* Preferences Preview */}
              {(tripData.budget || tripData.accommodationType.length > 0 || tripData.interests.length > 0) && (
                <div>
                  <div className="flex gap-2 items-center">
                    <Users className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">Preferences</h4>
                  </div>
                  <div className="pl-7 mt-1 space-y-1.5">
                    {tripData.budget && (
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-600">Budget:</span>
                        <div className="flex">
                          {tripData.budget === 'budget' && <DollarSign className="h-3 w-3 text-primary" />}
                          {tripData.budget === 'moderate' && (
                            <>
                              <DollarSign className="h-3 w-3 text-primary" />
                              <DollarSign className="h-3 w-3 text-primary" />
                            </>
                          )}
                          {tripData.budget === 'luxury' && (
                            <>
                              <DollarSign className="h-3 w-3 text-primary" />
                              <DollarSign className="h-3 w-3 text-primary" />
                              <DollarSign className="h-3 w-3 text-primary" />
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {tripData.accommodationType.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-600">Accommodation:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {tripData.accommodationType.map(type => (
                            <span key={type} className="inline-flex items-center text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">
                              {type === 'hotel' && <Hotel className="h-3 w-3 mr-1" />}
                              {type === 'home' && <Home className="h-3 w-3 mr-1" />}
                              {type === 'apartment' && <Building className="h-3 w-3 mr-1" />}
                              {type === 'hostel' && <Tent className="h-3 w-3 mr-1" />}
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {tripData.interests.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-600">Interests:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {tripData.interests.slice(0, 3).map(interest => (
                            <span key={interest} className="inline-flex items-center text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">
                              {interest === 'parks' && <Palmtree className="h-3 w-3 mr-1" />}
                              {interest === 'hiking' && <Mountain className="h-3 w-3 mr-1" />}
                              {interest === 'beaches' && <Umbrella className="h-3 w-3 mr-1" />}
                              {interest === 'restaurants' && <Utensils className="h-3 w-3 mr-1" />}
                              {interest === 'sightseeing' && <Camera className="h-3 w-3 mr-1" />}
                              {interest === 'nightlife' && <Music className="h-3 w-3 mr-1" />}
                              {interest === 'coffee' && <Coffee className="h-3 w-3 mr-1" />}
                              {interest === 'wine' && <Wine className="h-3 w-3 mr-1" />}
                              {interest === 'culture' && <Landmark className="h-3 w-3 mr-1" />}
                              {interest === 'shopping' && <ShoppingBag className="h-3 w-3 mr-1" />}
                              {interest.charAt(0).toUpperCase() + interest.slice(1)}
                            </span>
                          ))}
                          {tripData.interests.length > 3 && (
                            <span className="text-xs text-gray-500">+{tripData.interests.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Step indicator */}
            <div className="mt-8">
              <div className="h-1 w-full bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${(step / 4) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-primary/70">Start</span>
                <span className="text-xs text-primary/70">Create Trip</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side: Form fields */}
        <div className="w-full md:w-3/5 p-6">
          <DialogHeader className="flex flex-row justify-between items-center">
            <DialogTitle className="text-2xl font-bold">
              {step === 1 && "Where are you going?"}
              {step === 2 && "Tell us about your pet"}
              {step === 3 && "Trip preferences"}
              {step === 4 && "Review your trip details"}
            </DialogTitle>
            {/* Add Start New Trip button */}
            {step === 1 && Object.values(tripData).some(value => 
              value !== '' && value !== null && 
              (Array.isArray(value) ? value.length > 0 : true)
            ) && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearTripData}
                className="text-gray-500 hover:text-red-500"
              >
                Start New Trip
              </Button>
            )}
          </DialogHeader>
          
          {/* Step indicator for mobile */}
          <div className="flex justify-between mb-8 md:hidden">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex flex-col items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    s === step ? 'bg-primary text-white' : 
                    s < step ? 'bg-green-500 text-white' : 
                    'bg-gray-200 text-gray-600'
                  }`}
                >
                  {s < step ? <Check size={16} /> : s}
                </div>
                <div className="text-xs mt-1 text-gray-600">
                  {s === 1 && "Location"}
                  {s === 2 && "Pet Details"}
                  {s === 3 && "Preferences"}
                  {s === 4 && "Review"}
                </div>
              </div>
            ))}
          </div>
          
          {/* Step 1: Location & Dates */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Flight-style location inputs */}
              <div className="bg-white rounded-lg border p-4">
                <div className="space-y-4">
                <div className="relative">
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center">
                    <PlaneTakeoff className="h-5 w-5 text-primary" />
                  </div>
                  <CityAutocomplete 
                    id="origin"
                    label="Where are you flying from?"
                    placeholder="e.g., Ottawa (YOW)"
                    value={tripData.origin}
                    onChange={(value) => updateTripData('origin', value)}
                    className="pl-10"
                  />
                </div>
                  
                  <div className="relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10">
                      <PlaneLanding className="h-5 w-5 text-primary" />
                    </div>
                    <CityAutocomplete 
                      id="primaryDestination"
                      label="Where are you going?"
                      placeholder="e.g., Paris (CDG)"
                      value={tripData.primaryDestination}
                      onChange={(value) => updateTripData('primaryDestination', value)}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              
              {/* Calendar as a popover */}
              <div className="bg-white rounded-lg border p-4">
  <Label htmlFor="travel-dates" className="text-base font-medium block mb-2">
    When are you traveling?
  </Label>
  <Popover>
  <PopoverTrigger asChild>
  <Button
    id="travel-dates"
    variant="outline"
    className={`w-full justify-start text-left font-normal h-12 transition-colors text-foreground hover:text-foreground focus:text-foreground hover:bg-gray-50 focus:ring-2 focus:ring-primary/50 ${
      !tripData.startDate && !tripData.endDate ? "text-muted-foreground hover:text-muted-foreground" : ""
    }`}
  >
    <CalendarIcon className="mr-3 h-5 w-5 flex-shrink-0 text-foreground" />
    <div className="flex-1 truncate">
      {tripData.startDate && tripData.endDate ? (
        <span className="flex items-center gap-2">
          <span className="text-sm">
            {format(tripData.startDate, "MMM d, yyyy")} –{" "}
            {format(tripData.endDate, "MMM d, yyyy")}
          </span>
          <span className="text-xs text-muted-foreground">
            ({differenceInDays(tripData.endDate, tripData.startDate) + 1}{" "}
            {differenceInDays(tripData.endDate, tripData.startDate) + 1 === 1
              ? "day"
              : "days"}
            )
          </span>
        </span>
      ) : (
        <span className="text-sm">Select travel dates</span>
      )}
    </div>
  </Button>
</PopoverTrigger>
    <PopoverContent
      className="w-auto p-3 bg-white rounded-lg shadow-lg"
      align="start"
    >
      <Calendar
        mode="range"
        selected={{
          from: tripData.startDate || undefined,
          to: tripData.endDate || undefined,
        }}
        onSelect={(range: DateRange | undefined) => {
          if (range?.from) {
            updateTripData("startDate", range.from);
          }
          if (range?.to) {
            updateTripData("endDate", range.to);
          }
        }}
        numberOfMonths={2}
        defaultMonth={new Date()}
        showOutsideDays={false}
        pagedNavigation
        className="border-none"
        classNames={{
          months: "flex gap-4 sm:gap-8",
          month:
            "relative first-of-type:before:hidden before:absolute max-sm:before:inset-x-2 max-sm:before:h-px max-sm:before:-top-2 sm:before:inset-y-2 sm:before:w-px before:bg-border sm:before:-left-4",
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
          range_middle:
            "bg-primary/20 hover:bg-primary/30 focus:bg-primary/30 aria-selected:bg-primary/20",
          nav_button:
            "h-8 w-8 bg-transparent hover:bg-gray-100 rounded-full flex items-center justify-center",
          caption_dropdowns: "flex gap-2",
          dropdown: "rounded-md border p-2 bg-white",
        }}
      />
      <div
        className="text-xs text-muted-foreground text-center mt-2"
        role="region"
        aria-live="polite"
      >
        {tripData.startDate && tripData.endDate
          ? `Selected: ${format(tripData.startDate, "MMM d, yyyy")} to ${format(
              tripData.endDate,
              "MMM d, yyyy"
            )}`
          : "Select a date range"}
      </div>
    </PopoverContent>
  </Popover>
</div>
              
              <div className="bg-white rounded-lg border p-4">
                <Label className="text-base font-medium mb-2 block">Any additional cities you plan to visit?</Label>
                <Input 
                  placeholder="e.g., Lyon, Bordeaux (separate with commas)"
                  value={tripData.additionalCities.join(', ')}
                  onChange={(e) => updateTripData('additionalCities', 
                    e.target.value.split(',').map(city => city.trim()).filter(Boolean)
                  )}
                  className="w-full"
                />
              </div>
            </div>
          )}
          
          {/* Step 2: Pet Details */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Who's Going Section */}
              <div className="bg-white rounded-lg border p-4">
                <Label className="text-lg mb-3 block">Who's Going?</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center p-3 border rounded-lg">
                    <UserCircle2 className="h-8 w-8 mb-2 text-primary" />
                    <Label htmlFor="numPeople" className="mb-1 text-sm text-center">Adults</Label>
                    <div className="flex items-center">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => updateTripData('numPeople', Math.max(1, tripData.numPeople - 1))}
                      >
                        -
                      </Button>
                      <span className="mx-3 text-lg font-medium">{tripData.numPeople}</span>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => updateTripData('numPeople', tripData.numPeople + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col items-center p-3 border rounded-lg">
                    <Baby className="h-8 w-8 mb-2 text-primary" />
                    <Label htmlFor="numChildren" className="mb-1 text-sm text-center">Children</Label>
                    <div className="flex items-center">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => updateTripData('numChildren', Math.max(0, tripData.numChildren - 1))}
                      >
                        -
                      </Button>
                      <span className="mx-3 text-lg font-medium">{tripData.numChildren}</span>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => updateTripData('numChildren', tripData.numChildren + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col items-center p-3 border rounded-lg">
                    <PawPrint className="h-8 w-8 mb-2 text-primary" />
                    <Label htmlFor="numPets" className="mb-1 text-sm text-center">Pets</Label>
                    <div className="flex items-center">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => updateTripData('numPets', Math.max(1, tripData.numPets - 1))}
                      >
                        -
                      </Button>
                      <span className="mx-3 text-lg font-medium">{tripData.numPets}</span>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => updateTripData('numPets', tripData.numPets + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <a href="/service-animals" className="text-primary hover:underline text-sm">Bringing a service animal?</a>
                </div>
              </div>

              <div>
                <Label className="text-lg mb-3 block">Type of Pet</Label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-2">
                  {[
                    { value: 'dog', label: 'Dog', icon: Dog },
                    { value: 'cat', label: 'Cat', icon: Cat },
                    { value: 'bird', label: 'Bird', icon: Bird },
                    { value: 'rabbit', label: 'Rabbit', icon: Rabbit },
                    { value: 'other', label: 'Other', icon: HelpCircle }
                  ].map(petType => {
                    const Icon = petType.icon;
                    return (
                      <button
                        key={petType.value}
                        type="button"
                        className={`flex flex-col items-center justify-center p-2 border-2 rounded-lg transition-all ${
                          tripData.petType === petType.value 
                            ? 'border-primary text-primary bg-primary/5' 
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                        onClick={() => updateTripData('petType', petType.value)}
                      >
                        <Icon className={`h-8 w-8 mb-1 ${
                          tripData.petType === petType.value 
                            ? 'text-primary' 
                            : 'text-gray-500'
                        }`} />
                        <span className="font-medium text-sm">{petType.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <Label className="text-lg mb-3 block">Pet Size</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                  {[
                    { 
                      value: 'small', 
                      label: 'Small', 
                      icon: PawPrint,
                      description: 'Up to 20 pounds' 
                    },
                    { 
                      value: 'medium', 
                      label: 'Medium', 
                      icon: PawPrint,
                      description: '20-60 pounds' 
                    },
                    { 
                      value: 'large', 
                      label: 'Large', 
                      icon: PawPrint,
                      description: 'Over 60 pounds' 
                    }
                  ].map(petSize => {
                    const Icon = petSize.icon;
                    return (
                      <button
                        key={petSize.value}
                        type="button"
                        className={`flex flex-row items-center justify-start p-3 border-2 rounded-lg transition-all ${
                          tripData.petSize === petSize.value 
                            ? 'border-primary text-primary bg-primary/5' 
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                        onClick={() => updateTripData('petSize', petSize.value)}
                      >
                        <Icon className={`h-6 w-6 mr-3 ${
                          tripData.petSize === petSize.value 
                            ? 'text-primary' 
                            : 'text-gray-500'
                        }`} />
                        <div className="text-left">
                          <span className="font-medium block">{petSize.label}</span>
                          <p className="text-xs text-gray-500">{petSize.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <Label htmlFor="petBreed">Breed (if applicable)</Label>
                <Input 
                  id="petBreed"
                  placeholder="e.g., Labrador Retriever, Domestic Shorthair"
                  value={tripData.petBreed}
                  onChange={(e) => updateTripData('petBreed', e.target.value)}
                />
              </div>
            </div>
          )}
          
          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <Label className="text-lg mb-3 block">Budget</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {[
                    { 
                      value: 'budget', 
                      label: 'Budget', 
                      icon: DollarSign,
                      description: 'Economical options' 
                    },
                    { 
                      value: 'moderate', 
                      label: 'Moderate', 
                      icon: DollarSign,
                      description: 'Mid-range comfort' 
                    },
                    { 
                      value: 'luxury', 
                      label: 'Luxury', 
                      icon: DollarSign,
                      description: 'Premium experience' 
                    }
                  ].map(budgetOption => {
                    const Icon = budgetOption.icon;
                    return (
                      <button
                        key={budgetOption.value}
                        type="button"
                        className={`flex flex-row items-center justify-start p-3 border-2 rounded-lg transition-all ${
                          tripData.budget === budgetOption.value 
                            ? 'border-primary text-primary bg-primary/5' 
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                        onClick={() => updateTripData('budget', budgetOption.value)}
                      >
                        <div className={`mr-3 flex ${
                          tripData.budget === budgetOption.value 
                            ? 'text-primary' 
                            : 'text-gray-500'
                        }`}>
                          {budgetOption.value === 'budget' && <DollarSign className="h-5 w-5" />}
                          {budgetOption.value === 'moderate' && (
                            <>
                              <DollarSign className="h-5 w-5" />
                              <DollarSign className="h-5 w-5" />
                            </>
                          )}
                          {budgetOption.value === 'luxury' && (
                            <>
                              <DollarSign className="h-5 w-5" />
                              <DollarSign className="h-5 w-5" />
                              <DollarSign className="h-5 w-5" />
                            </>
                          )}
                        </div>
                        <div className="text-left">
                          <span className="font-medium block">{budgetOption.label}</span>
                          <p className="text-xs text-gray-500">{budgetOption.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <Label className="block mb-2">Accommodation Type</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { value: 'hotel', label: 'Hotel', icon: Hotel },
                    { value: 'home', label: 'Home', icon: Home },
                    { value: 'apartment', label: 'Apartment', icon: Building },
                    { value: 'hostel', label: 'Hostel', icon: Tent }
                  ].map(type => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        className={`flex flex-row items-center p-2 border-2 rounded-lg transition-all ${
                          tripData.accommodationType.includes(type.value) 
                            ? 'border-primary text-primary bg-primary/5' 
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                        onClick={() => {
                          if (tripData.accommodationType.includes(type.value)) {
                            updateTripData('accommodationType', 
                              tripData.accommodationType.filter(t => t !== type.value)
                            );
                          } else {
                            updateTripData('accommodationType', 
                              [...tripData.accommodationType, type.value]
                            );
                          }
                        }}
                      >
                        <Icon className={`h-5 w-5 mr-2 ${
                          tripData.accommodationType.includes(type.value) 
                            ? 'text-primary' 
                            : 'text-gray-500'
                        }`} />
                        <span className="font-medium text-sm">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <Label className="text-lg mb-3 block">Interests & Activities</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pb-2">
                  {[
                    // General interests
                    { value: 'relaxation', label: 'Relaxation', icon: Flower },
                    { value: 'adventure', label: 'Adventure', icon: Mountain },
                    { value: 'cultural', label: 'Cultural', icon: Landmark },
                    { value: 'family', label: 'Family', icon: Users },
                    
                    // Standard activities
                    { value: 'parks', label: 'Parks', icon: Palmtree },
                    { value: 'hiking', label: 'Hiking', icon: Footprints },
                    { value: 'beaches', label: 'Beaches', icon: Umbrella },
                    { value: 'restaurants', label: 'Restaurants', icon: Utensils },
                    { value: 'sightseeing', label: 'Sightseeing', icon: Camera },
                    { value: 'nightlife', label: 'Nightlife', icon: Music },
                    { value: 'coffee', label: 'Coffee', icon: Coffee },
                    { value: 'wine', label: 'Wine', icon: Wine },
                    { value: 'shopping', label: 'Shopping', icon: ShoppingBag },
                    
                    // Pet-friendly activities
                    { value: 'dog-parks', label: 'Dog Parks', icon: Trees },
                    { value: 'pet-friendly-trails', label: 'Pet Trails', icon: Footprints },
                    { value: 'pet-friendly-beaches', label: 'Pet Beaches', icon: Sun },
                    { value: 'pet-friendly-cafes', label: 'Pet Cafes', icon: Coffee },
                    { value: 'pet-friendly-restaurants', label: 'Pet Dining', icon: Utensils },
                    { value: 'pet-swimming', label: 'Pet Swimming', icon: Waves },
                    { value: 'pet-spas', label: 'Pet Spas', icon: Flower },
                    { value: 'nature-exploration', label: 'Nature', icon: Leaf },
                  ].map(interest => {
                    const Icon = interest.icon;
                    return (
                      <button
                        key={interest.value}
                        type="button"
                        className={`flex flex-row items-center p-2 border-2 rounded-lg transition-all ${
                          tripData.interests.includes(interest.value) 
                            ? 'border-primary text-primary bg-primary/5' 
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                        onClick={() => {
                          if (tripData.interests.includes(interest.value)) {
                            updateTripData('interests', 
                              tripData.interests.filter(i => i !== interest.value)
                            );
                          } else {
                            updateTripData('interests', 
                              [...tripData.interests, interest.value]
                            );
                          }
                        }}
                      >
                        <Icon className={`h-5 w-5 mr-2 ${
                          tripData.interests.includes(interest.value) 
                            ? 'text-primary' 
                            : 'text-gray-500'
                        }`} />
                        <span className="font-medium text-sm">{interest.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          
          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="bg-offwhite p-4 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-primary" />
                  Location & Dates
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600 block">Destination:</span> 
                    <p className="font-medium">{tripData.primaryDestination || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 block">Origin:</span> 
                    <p className="font-medium">{tripData.origin || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 block">Travel dates:</span> 
                    <p className="font-medium">
                      {tripData.startDate && tripData.endDate ? 
                        `${format(tripData.startDate, 'MMM d, yyyy')} - ${format(tripData.endDate, 'MMM d, yyyy')}` : 
                        'Not specified'}
                    </p>
                  </div>
                  {tripData.additionalCities.length > 0 && (
                    <div>
                      <span className="text-gray-600 block">Additional cities:</span> 
                      <p className="font-medium">{tripData.additionalCities.join(', ')}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-offwhite p-4 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center">
                  <PawPrint className="h-4 w-4 mr-2 text-primary" />
                  Pet Details
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600 block">Pet type:</span> 
                    <p className="capitalize font-medium flex items-center">
                      {tripData.petType === 'dog' && <Dog className="h-4 w-4 mr-1 text-primary" />}
                      {tripData.petType === 'cat' && <Cat className="h-4 w-4 mr-1 text-primary" />}
                      {tripData.petType === 'bird' && <Bird className="h-4 w-4 mr-1 text-primary" />}
                      {tripData.petType === 'rabbit' && <Rabbit className="h-4 w-4 mr-1 text-primary" />}
                      {tripData.petType === 'other' && <HelpCircle className="h-4 w-4 mr-1 text-primary" />}
                      {tripData.petType || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 block">Size:</span> 
                    <p className="font-medium">{
                      tripData.petSize === 'small' ? 'Small (up to 20 lbs)' :
                      tripData.petSize === 'medium' ? 'Medium (20-60 lbs)' :
                      tripData.petSize === 'large' ? 'Large (over 60 lbs)' :
                      tripData.petSize || 'Not specified'
                    }</p>
                  </div>
                  {tripData.petBreed && (
                    <div>
                      <span className="text-gray-600 block">Breed:</span> 
                      <p className="font-medium">{tripData.petBreed}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-offwhite p-4 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center">
                  <Users className="h-4 w-4 mr-2 text-primary" />
                  Preferences
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600 block">Who's going:</span> 
                    <p className="font-medium flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">
                        <UserCircle2 className="h-3 w-3 mr-1" />
                        {tripData.numPeople} {tripData.numPeople === 1 ? 'Adult' : 'Adults'}
                      </span>
                      {tripData.numChildren > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">
                          <Baby className="h-3 w-3 mr-1" />
                          {tripData.numChildren} {tripData.numChildren === 1 ? 'Child' : 'Children'}
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">
                        <PawPrint className="h-3 w-3 mr-1" />
                        {tripData.numPets} {tripData.numPets === 1 ? 'Pet' : 'Pets'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 block">Budget:</span> 
                    <p className="font-medium flex items-center">
                      {tripData.budget === 'budget' && <DollarSign className="h-3 w-3 text-primary" />}
                      {tripData.budget === 'moderate' && (
                        <>
                          <DollarSign className="h-3 w-3 text-primary" />
                          <DollarSign className="h-3 w-3 text-primary" />
                        </>
                      )}
                      {tripData.budget === 'luxury' && (
                        <>
                          <DollarSign className="h-3 w-3 text-primary" />
                          <DollarSign className="h-3 w-3 text-primary" />
                          <DollarSign className="h-3 w-3 text-primary" />
                        </>
                      )}
                      <span className="ml-1 capitalize">{tripData.budget || 'Not specified'}</span>
                    </p>
                  </div>
                </div>
                
                {tripData.accommodationType.length > 0 && (
                  <div className="mt-3">
                    <span className="text-gray-600 block">Accommodation:</span> 
                    <div className="flex flex-wrap gap-1 mt-1">
                      {tripData.accommodationType.map(type => (
                        <span key={type} className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">
                          {type === 'hotel' && <Hotel className="h-3 w-3 mr-1" />}
                          {type === 'home' && <Home className="h-3 w-3 mr-1" />}
                          {type === 'apartment' && <Building className="h-3 w-3 mr-1" />}
                          {type === 'hostel' && <Tent className="h-3 w-3 mr-1" />}
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {tripData.interests.length > 0 && (
                  <div className="mt-3">
                    <span className="text-gray-600 block">Interests:</span> 
                    <div className="flex flex-wrap gap-1 mt-1">
                      {tripData.interests.map(interest => (
                        <span key={interest} className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">
                          {interest === 'parks' && <Palmtree className="h-3 w-3 mr-1" />}
                          {interest === 'hiking' && <Footprints className="h-3 w-3 mr-1" />}
                          {interest === 'beaches' && <Umbrella className="h-3 w-3 mr-1" />}
                          {interest === 'restaurants' && <Utensils className="h-3 w-3 mr-1" />}
                          {interest === 'sightseeing' && <Camera className="h-3 w-3 mr-1" />}
                          {interest === 'nightlife' && <Music className="h-3 w-3 mr-1" />}
                          {interest === 'coffee' && <Coffee className="h-3 w-3 mr-1" />}
                          {interest === 'wine' && <Wine className="h-3 w-3 mr-1" />}
                          {interest === 'culture' && <Landmark className="h-3 w-3 mr-1" />}
                          {interest === 'shopping' && <ShoppingBag className="h-3 w-3 mr-1" />}
                          {interest === 'dog-parks' && <Trees className="h-3 w-3 mr-1" />}
                          {interest === 'pet-friendly-trails' && <Footprints className="h-3 w-3 mr-1" />}
                          {interest === 'pet-friendly-beaches' && <Sun className="h-3 w-3 mr-1" />}
                          {interest === 'pet-friendly-cafes' && <Coffee className="h-3 w-3 mr-1" />}
                          {interest === 'pet-friendly-restaurants' && <Utensils className="h-3 w-3 mr-1" />}
                          {interest === 'pet-swimming' && <Waves className="h-3 w-3 mr-1" />}
                          {interest === 'pet-spas' && <Flower className="h-3 w-3 mr-1" />}
                          {interest === 'nature-exploration' && <Leaf className="h-3 w-3 mr-1" />}
                          {interest === 'relaxation' && <Flower className="h-3 w-3 mr-1" />}
                          {interest === 'adventure' && <Mountain className="h-3 w-3 mr-1" />}
                          {interest === 'cultural' && <Landmark className="h-3 w-3 mr-1" />}
                          {interest === 'family' && <Users className="h-3 w-3 mr-1" />}
                          {interest.charAt(0).toUpperCase() + interest.slice(1).replace(/-/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Navigation Buttons */}
          <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row items-center justify-between mt-8">
            <div>
              {step > 1 && (
                <Button 
                  variant="outline" 
                  onClick={handleBack}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="text-gray-500"
              >
                Cancel
              </Button>
              
              <Button 
                variant="default" 
                onClick={handleNext}
                disabled={!canProceed()}
                className={`flex items-center gap-2 ${!canProceed() ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {step === 4 ? (
                  <>
                    <span>Create Trip</span>
                    <Check className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export clearTripData as a static method
TripModalStepper.clearTripData = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('tripData');
  }
};

// Export as both named and default export
export default TripModalStepper; 