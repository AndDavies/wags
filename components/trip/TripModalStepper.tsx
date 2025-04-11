'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar-rac';
import { DateRangePicker } from '@/components/trip/DateRangePicker';
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
  Plane
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, differenceInDays } from 'date-fns';
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
  tripType: string;
  budget: 'budget' | 'moderate' | 'luxury' | '';
  accommodationType: string[];
  interests: string[];
  additionalInfo: string;
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
  tripType: '',
  budget: '',
  accommodationType: [],
  interests: [],
  additionalInfo: '',
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
        return tripData.numPeople > 0 && tripData.tripType && tripData.budget;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="max-w-6xl mx-auto flex flex-col md:flex-row p-0 gap-0">
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
              {(tripData.startDate || tripData.endDate) && (
                <div>
                  <div className="flex gap-2 items-center">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">Dates</h4>
                  </div>
                  <p className="pl-7 mt-1">
                    {tripData.startDate && tripData.endDate ? (
                      <>
                        {format(tripData.startDate, 'MMM d')} - {format(tripData.endDate, 'MMM d, yyyy')}
                        <span className="text-sm text-gray-600 block">
                          {differenceInDays(tripData.endDate, tripData.startDate) + 1} days
                        </span>
                      </>
                    ) : (
                      'Select your travel dates'
                    )}
                  </p>
                </div>
              )}
              
              {/* Pet Preview */}
              {tripData.petType && (
                <div>
                  <div className="flex gap-2 items-center">
                    <Dog className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">Pet</h4>
                  </div>
                  <p className="pl-7 mt-1">
                    {tripData.petType} {tripData.petBreed && `(${tripData.petBreed})`}
                    {tripData.petSize && (
                      <span className="block text-sm text-gray-600">
                        {tripData.petSize === 'small' ? 'Small (up to 20 lbs)' :
                         tripData.petSize === 'medium' ? 'Medium (20-60 lbs)' :
                         tripData.petSize === 'large' ? 'Large (over 60 lbs)' :
                         tripData.petSize}
                      </span>
                    )}
                  </p>
                </div>
              )}
              
              {/* Preferences Preview */}
              {(tripData.numPeople > 1 || tripData.tripType || tripData.interests.length > 0) && (
                <div>
                  <div className="flex gap-2 items-center">
                    <Users className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">Preferences</h4>
                  </div>
                  <div className="pl-7 mt-1">
                    {tripData.numPeople > 1 && (
                      <p>{tripData.numPeople} travelers</p>
                    )}
                    {tripData.tripType && (
                      <p className="text-sm text-gray-600">{tripData.tripType} trip</p>
                    )}
                    {tripData.interests.length > 0 && (
                      <p className="text-sm text-gray-600">
                        Interests: {tripData.interests.join(', ')}
                      </p>
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
              <CityAutocomplete 
                id="primaryDestination"
                label="Where are you going?"
                placeholder="e.g., Paris, France"
                value={tripData.primaryDestination}
                onChange={(value) => updateTripData('primaryDestination', value)}
                required
              />
              
              <CityAutocomplete 
                id="origin"
                label="Where are you coming from?"
                placeholder="e.g., San Francisco, CA"
                value={tripData.origin}
                onChange={(value) => updateTripData('origin', value)}
              />
              
              <div>
                <Label>When are you traveling?</Label>
                <div className="mt-2">
                  <DateRangePicker
                    from={tripData.startDate}
                    to={tripData.endDate}
                    onFromChange={(date) => updateTripData('startDate', date)}
                    onToChange={(date) => updateTripData('endDate', date)}
                  />
                </div>
              </div>
              
              <div>
                <Label>Any additional cities you plan to visit?</Label>
                <Input 
                  placeholder="e.g., Lyon, Bordeaux (separate with commas)"
                  value={tripData.additionalCities.join(', ')}
                  onChange={(e) => updateTripData('additionalCities', 
                    e.target.value.split(',').map(city => city.trim()).filter(Boolean)
                  )}
                />
              </div>
            </div>
          )}
          
          {/* Step 2: Pet Details */}
          {step === 2 && (
            <div className="space-y-6">
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="numPeople">Number of People</Label>
                  <Input 
                    id="numPeople"
                    type="number"
                    min={1}
                    value={tripData.numPeople}
                    onChange={(e) => updateTripData('numPeople', parseInt(e.target.value))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="tripType">Trip Type</Label>
                  <Select 
                    value={tripData.tripType}
                    onValueChange={(value) => updateTripData('tripType', value)}
                  >
                    <SelectTrigger id="tripType">
                      <SelectValue placeholder="Select trip type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relaxation">Relaxation</SelectItem>
                      <SelectItem value="adventure">Adventure</SelectItem>
                      <SelectItem value="cultural">Cultural</SelectItem>
                      <SelectItem value="family">Family</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="budget">Budget</Label>
                <Select 
                  value={tripData.budget}
                  onValueChange={(value: 'budget' | 'moderate' | 'luxury' | '') => updateTripData('budget', value)}
                >
                  <SelectTrigger id="budget">
                    <SelectValue placeholder="Select budget" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="budget">Budget</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="block mb-2">Accommodation Type</Label>
                <div className="flex flex-wrap gap-2">
                  {['hotel', 'home', 'apartment', 'hostel'].map(type => (
                    <button
                      key={type}
                      type="button"
                      className={`px-3 py-1.5 rounded-full border text-sm ${
                        tripData.accommodationType.includes(type) 
                          ? 'bg-primary text-white border-primary' 
                          : 'bg-white text-gray-700 border-gray-300'
                      }`}
                      onClick={() => {
                        if (tripData.accommodationType.includes(type)) {
                          updateTripData('accommodationType', 
                            tripData.accommodationType.filter(t => t !== type)
                          );
                        } else {
                          updateTripData('accommodationType', 
                            [...tripData.accommodationType, type]
                          );
                        }
                      }}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="block mb-2">Interests</Label>
                <div className="flex flex-wrap gap-2">
                  {['parks', 'hiking', 'beaches', 'restaurants', 'sightseeing'].map(interest => (
                    <button
                      key={interest}
                      type="button"
                      className={`px-3 py-1.5 rounded-full border text-sm ${
                        tripData.interests.includes(interest) 
                          ? 'bg-primary text-white border-primary' 
                          : 'bg-white text-gray-700 border-gray-300'
                      }`}
                      onClick={() => {
                        if (tripData.interests.includes(interest)) {
                          updateTripData('interests', 
                            tripData.interests.filter(i => i !== interest)
                          );
                        } else {
                          updateTripData('interests', 
                            [...tripData.interests, interest]
                          );
                        }
                      }}
                    >
                      {interest.charAt(0).toUpperCase() + interest.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="additionalInfo">Additional Information</Label>
                <textarea 
                  id="additionalInfo"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Any specific needs or preferences"
                  value={tripData.additionalInfo}
                  onChange={(e) => updateTripData('additionalInfo', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          
          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="bg-offwhite p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Location & Dates</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Destination:</span> 
                    <p>{tripData.primaryDestination}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Origin:</span> 
                    <p>{tripData.origin}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Travel dates:</span> 
                    <p>
                      {tripData.startDate && tripData.endDate ? 
                        `${format(tripData.startDate, 'MMM d, yyyy')} - ${format(tripData.endDate, 'MMM d, yyyy')}` : 
                        'Not specified'}
                    </p>
                  </div>
                  {tripData.additionalCities.length > 0 && (
                    <div>
                      <span className="text-gray-600">Additional cities:</span> 
                      <p>{tripData.additionalCities.join(', ')}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-offwhite p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Pet Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Pet type:</span> 
                    <p className="capitalize">{tripData.petType}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Size:</span> 
                    <p>{
                      tripData.petSize === 'small' ? 'Small (up to 20 lbs)' :
                      tripData.petSize === 'medium' ? 'Medium (20-60 lbs)' :
                      tripData.petSize === 'large' ? 'Large (over 60 lbs)' :
                      tripData.petSize
                    }</p>
                  </div>
                  {tripData.petBreed && (
                    <div>
                      <span className="text-gray-600">Breed:</span> 
                      <p>{tripData.petBreed}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-offwhite p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Preferences</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">People:</span> 
                    <p>{tripData.numPeople}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Trip type:</span> 
                    <p>{tripData.tripType}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Budget:</span> 
                    <p>{tripData.budget}</p>
                  </div>
                  {tripData.accommodationType.length > 0 && (
                    <div>
                      <span className="text-gray-600">Accommodation:</span> 
                      <p>{tripData.accommodationType.join(', ')}</p>
                    </div>
                  )}
                  {tripData.interests.length > 0 && (
                    <div>
                      <span className="text-gray-600">Interests:</span> 
                      <p>{tripData.interests.join(', ')}</p>
                    </div>
                  )}
                </div>
                
                {tripData.additionalInfo && (
                  <div className="mt-2">
                    <span className="text-gray-600">Additional info:</span> 
                    <p className="text-sm">{tripData.additionalInfo}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="flex justify-between mt-6">
            <Button 
              variant="outline" 
              onClick={step === 1 ? onClose : handleBack}
            >
              {step === 1 ? 'Cancel' : (
                <div className="flex items-center">
                  <ChevronLeft size={16} />
                  <span>Back</span>
                </div>
              )}
            </Button>
            
            <Button 
              onClick={handleNext}
              disabled={!canProceed()}
            >
              {step < 4 ? (
                <div className="flex items-center">
                  <span>Next</span>
                  <ChevronRight size={16} />
                </div>
              ) : 'Create Trip'}
            </Button>
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