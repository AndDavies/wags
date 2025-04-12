'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar, Hotel, Car, MapPin, Utensils, Map, AlertCircle, Trash2, Info } from 'lucide-react';
import { Timeline, TimelineContent, TimelineDate, TimelineHeader, TimelineIndicator, TimelineItem, TimelineSeparator, TimelineTitle } from '@/components/ui/timeline';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { Trip, TripActivity, TripDay } from '@/lib/trip-service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import ItineraryView from '@/components/trip/ItineraryView';

// Dynamically import components that might cause hydration issues
const TripModalStepper = dynamic(
  () => import('@/components/trip/TripModalStepper'),
  { ssr: false } // Disable server-side rendering for this component
);

const TripChatbot = dynamic(
  () => import('@/components/trip/TripChatbot'),
  { ssr: false }
);

// Define a type for the trip data coming from the form
type TripFormData = {
  primaryDestination: string;
  additionalCities: string[];
  startDate: Date | null;
  endDate: Date | null;
  origin: string;
  petType: string;
  petSize: string;
  petBreed: string;
  temperament: string;
  numPeople: number;
  numChildren: number;
  numPets: number;
  budget: 'budget' | 'moderate' | 'luxury' | string;
  accommodationType: string[];
  interests: string[];
  [key: string]: unknown; // For any additional fields that might be present
};

export default function TripBuilderClient() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [resumedFromStorage, setResumedFromStorage] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Set mounted state when component mounts on client
  useEffect(() => {
    setIsMounted(true);
    
    // Check for existing trip data
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('tripData');
      if (savedData) {
        try {
          const tripData = JSON.parse(savedData);
          // If there's meaningful trip data, create a trip from it
          if (tripData.primaryDestination) {
            handleCreateTrip(tripData, false);
            setResumedFromStorage(true);
          }
        } catch (e) {
          console.error('Error parsing saved trip data:', e);
        }
      }
    }
  }, []);

  // Function to handle creating a new trip
  const handleCreateTrip = async (tripData: TripFormData, closeModal = true) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Generate days based on start and end dates
      const days: TripDay[] = [];
      
      if (tripData.startDate && tripData.endDate) {
        const start = new Date(tripData.startDate);
        const end = new Date(tripData.endDate);
        
        // Create an array of dates between start and end
        const currentDate = new Date(start);
        while (currentDate <= end) {
          days.push({
            date: new Date(currentDate),
            activities: []
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
      
      // Process accommodation type to ensure it's an array
      const accommodationType = Array.isArray(tripData.accommodationType) 
        ? tripData.accommodationType 
        : [tripData.accommodationType].filter(Boolean);
      
      // Process interests to ensure it's an array
      const interests = Array.isArray(tripData.interests)
        ? tripData.interests
        : [tripData.interests].filter(Boolean);
      
      // Create trip object
      const newTrip: Trip = {
        title: `Trip to ${tripData.primaryDestination}`,
        destination: tripData.primaryDestination,
        startDate: tripData.startDate ? new Date(tripData.startDate) : null as unknown as string | Date,
        endDate: tripData.endDate ? new Date(tripData.endDate) : null as unknown as string | Date,
        days,
        petDetails: {
          type: tripData.petType,
          size: tripData.petSize,
          breed: tripData.petBreed,
          temperament: tripData.temperament
        },
        preferences: {
          budget: tripData.budget as 'budget' | 'moderate' | 'luxury',
          tripType: (tripData as any).tripType || '',
          interests: interests,
          accommodationType: accommodationType
        }
      };
      
      setTrip(newTrip);
      if (closeModal) {
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error('Error creating trip:', err);
      setError('Failed to create trip. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to clear trip data and start a new trip
  const startNewTrip = () => {
    // Clear localStorage data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tripData');
    }
    
    // Reset UI state
    setTrip(null);
    setError(null);
    setResumedFromStorage(false);
  };
  
  // Function to save the trip to Supabase
  const saveTrip = async () => {
    if (!trip) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Redirect to login if not authenticated
        router.push('/login?redirect=create-trip');
        return;
      }
      
      // Save to Supabase
      const { data, error } = await supabase
        .from('itineraries')
        .insert({
          user_id: user.id,
          title: trip.title,
          description: `Trip to ${trip.destination}`,
          start_date: trip.startDate instanceof Date ? trip.startDate.toISOString() : trip.startDate,
          end_date: trip.endDate instanceof Date ? trip.endDate.toISOString() : trip.endDate,
          location: trip.destination,
          trip_data: trip
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      if (data && data[0]) {
        // Update local trip with ID from database
        setTrip({
          ...trip,
          id: data[0].id
        });
        
        // Clear localStorage data after successful save
        if (typeof window !== 'undefined') {
          localStorage.removeItem('tripData');
        }
        
        // Optionally redirect to the trip detail page
        // router.push(`/trips/${data[0].id}`);
      }
    } catch (err: any) {
      console.error('Error saving trip:', err);
      setError(err.message || 'Failed to save trip. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to add an activity to a day
  const addActivity = (dayIndex: number, activity: Omit<TripActivity, 'id'>) => {
    if (!trip) return;
    
    try {
      const newTrip = { ...trip };
      newTrip.days[dayIndex].activities.push({
        ...activity,
        id: Math.random().toString(36).substring(2, 9)
      });
      
      setTrip(newTrip);
    } catch (err) {
      console.error('Error adding activity:', err);
      setError('Failed to add activity. Please try again.');
    }
  };

  // If not yet mounted on client, return a loading state
  if (!isMounted) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex space-x-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="h-[60vh] w-full rounded-lg bg-gray-100 animate-pulse flex items-center justify-center">
          <span className="text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <header className="sticky top-0 z-10 bg-background pt-4 pb-2 border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            {trip ? trip.title : 'New Trip'}
          </h1>
          <div className="flex items-center space-x-3">
            {trip && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={startNewTrip}
                className="text-gray-500"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Start New Trip
              </Button>
            )}
            <Button variant="outline" disabled={!trip || isLoading}>
              Export PDF
            </Button>
            <Button variant="outline" disabled={!trip || isLoading}>
              Share
            </Button>
            <Button 
              onClick={trip ? saveTrip : () => setIsModalOpen(true)}
              className="bg-primary text-white hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : (trip ? 'Save Trip' : 'Create Trip')}
            </Button>
          </div>
        </div>
      </header>
      
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {resumedFromStorage && trip && (
        <Alert className="mt-4 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertTitle className="text-blue-700">Trip Resumed</AlertTitle>
          <AlertDescription className="text-blue-600">
            Your unsaved trip has been restored from your previous session. You can continue where you left off or 
            start a new trip with the "Start New Trip" button.
          </AlertDescription>
        </Alert>
      )}
      
      {!trip ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 p-8">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4">Start Planning Your Pet-Friendly Trip</h2>
            <p className="text-gray-600 mb-8">
              Create a personalized travel plan with pet-friendly accommodations, 
              activities, and all the essentials for a stress-free journey.
            </p>
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary text-white hover:bg-primary/90 px-6 py-3"
              size="lg"
              disabled={isLoading}
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Create New Trip
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mt-8">
            <div className="bg-offwhite rounded-lg p-6 text-center">
              <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <Map className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Find Pet-Friendly Destinations</h3>
              <p className="text-gray-600 text-sm">Discover places that welcome your furry companion</p>
            </div>
            
            <div className="bg-offwhite rounded-lg p-6 text-center">
              <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Personalized Itinerary</h3>
              <p className="text-gray-600 text-sm">Create a day-by-day plan tailored to you and your pet</p>
            </div>
            
            <div className="bg-offwhite rounded-lg p-6 text-center">
              <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <Hotel className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Pet-Friendly Accommodations</h3>
              <p className="text-gray-600 text-sm">Find the perfect stay for both you and your pet</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6 mt-6">
          {/* Chatbot */}
          <div className="w-full md:w-1/3 bg-offwhite rounded-lg p-4 h-64 md:h-auto">
            <h2 className="text-lg font-semibold mb-4">Travel Assistant</h2>
            {isMounted && (
              <TripChatbot 
                trip={trip}
                onAddActivity={(activity) => {
                  // Find the appropriate day to add this activity to (default to first day)
                  const dayIndex = 0;
                  addActivity(dayIndex, activity);
                }}
                onAddHotel={(hotel) => {
                  // Usually add hotels to the first day
                  const dayIndex = 0;
                  addActivity(dayIndex, hotel);
                }}
                onAddRestaurant={(restaurant) => {
                  // Add restaurants to the first day for now
                  const dayIndex = 0;
                  addActivity(dayIndex, restaurant);
                }}
                className="h-[calc(100%-2rem)]"
              />
            )}
          </div>
          
          {/* Timeline view */}
          <div className="w-full md:w-2/3 bg-white rounded-lg p-6">
            <ItineraryView 
              trip={trip}
              onAddActivity={addActivity}
              onEditActivity={(dayIndex, activityId, updatedActivity) => {
                if (!trip) return;
                
                try {
                  const newTrip = { ...trip };
                  const activityIndex = newTrip.days[dayIndex].activities.findIndex(a => a.id === activityId);
                  
                  if (activityIndex !== -1) {
                    newTrip.days[dayIndex].activities[activityIndex] = {
                      ...updatedActivity,
                      id: activityId
                    };
                    
                    setTrip(newTrip);
                  }
                } catch (err) {
                  console.error('Error editing activity:', err);
                  setError('Failed to edit activity. Please try again.');
                }
              }}
              onDeleteActivity={(dayIndex, activityId) => {
                if (!trip) return;
                
                try {
                  const newTrip = { ...trip };
                  newTrip.days[dayIndex].activities = newTrip.days[dayIndex].activities.filter(
                    activity => activity.id !== activityId
                  );
                  
                  setTrip(newTrip);
                } catch (err) {
                  console.error('Error deleting activity:', err);
                  setError('Failed to delete activity. Please try again.');
                }
              }}
            />
          </div>
        </div>
      )}
      
      {isModalOpen && (
        <TripModalStepper 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onComplete={(data) => handleCreateTrip(data as TripFormData)}
        />
      )}
    </>
  );
} 