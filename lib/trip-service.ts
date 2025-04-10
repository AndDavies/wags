import { createClient } from './supabase-client';
import { v4 as uuidv4 } from 'uuid';

// Trip related types
export type TripActivity = {
  id: string;
  type: 'flight' | 'hotel' | 'activity' | 'transportation' | 'restaurant' | 'vet';
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  isPetFriendly: boolean;
  bookingUrl?: string;
  price?: number;
  coordinates?: [number, number]; // [longitude, latitude]
};

export type TripDay = {
  date: Date | string;
  activities: TripActivity[];
};

export type Trip = {
  id?: string;
  title: string;
  destination: string;
  startDate: Date | string;
  endDate: Date | string;
  description?: string;
  days: TripDay[];
  petDetails: {
    type: string;
    size: string;
    breed?: string;
    health?: string;
    temperament?: string;
  };
  preferences?: {
    budget: 'budget' | 'moderate' | 'luxury';
    tripType: string;
    interests: string[];
    accommodationType: string[];
  };
  documents?: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

// Trip creation data from the modal stepper
export type TripCreationData = {
  primaryDestination: string;
  additionalCities: string[];
  startDate: Date | null;
  endDate: Date | null;
  origin: string;
  petType: string;
  petSize: string;
  petBreed: string;
  petHealth: string;
  vaccinations: string[];
  temperament: string;
  travelMode: 'car' | 'plane' | '';
  cabinPreference: 'in-cabin' | 'cargo' | '';
  petServices: string[];
  numPeople: number;
  tripType: string;
  budget: 'budget' | 'moderate' | 'luxury' | '';
  accommodationType: string[];
  interests: string[];
  additionalInfo: string;
};

export class TripService {
  private supabase = createClient();
  
  // Create a trip
  async createTrip(userId: string, tripData: Trip): Promise<Trip | null> {
    try {
      // Handle conversion of Date objects to ISO strings for Supabase
      const processedTripData = this.processDateFields(tripData);
      
      const { data, error } = await this.supabase
        .from('itineraries')
        .insert({
          user_id: userId,
          title: tripData.title,
          description: tripData.description || `Trip to ${tripData.destination}`,
          start_date: tripData.startDate instanceof Date ? tripData.startDate.toISOString() : tripData.startDate,
          end_date: tripData.endDate instanceof Date ? tripData.endDate.toISOString() : tripData.endDate,
          location: tripData.destination,
          trip_data: processedTripData
        })
        .select();
      
      if (error) {
        console.error('Error creating trip:', error);
        return null;
      }
      
      return data && data.length > 0 ? this.mapDataToTrip(data[0]) : null;
    } catch (error) {
      console.error('Error creating trip:', error);
      return null;
    }
  }
  
  // Get a trip by id
  async getTripById(tripId: string): Promise<Trip | null> {
    try {
      const { data, error } = await this.supabase
        .from('itineraries')
        .select('*')
        .eq('id', tripId)
        .single();
      
      if (error) {
        console.error('Error getting trip:', error);
        return null;
      }
      
      return this.mapDataToTrip(data);
    } catch (error) {
      console.error('Error getting trip:', error);
      return null;
    }
  }
  
  // Get all trips for a user
  async getUserTrips(userId: string): Promise<Trip[] | null> {
    try {
      const { data, error } = await this.supabase
        .from('itineraries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error getting user trips:', error);
        return null;
      }
      
      return data.map(item => this.mapDataToTrip(item));
    } catch (error) {
      console.error('Error getting user trips:', error);
      return null;
    }
  }
  
  // Update a trip
  async updateTrip(tripId: string, tripData: Partial<Trip>): Promise<Trip | null> {
    try {
      // Get the current trip data first
      const { data: currentTrip, error: fetchError } = await this.supabase
        .from('itineraries')
        .select('*')
        .eq('id', tripId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching trip for update:', fetchError);
        return null;
      }
      
      // Merge the current trip data with the updates
      const updatedTripData = {
        ...currentTrip.trip_data,
        ...this.processDateFields(tripData)
      };
      
      // Prepare database update
      const updateObj: any = {
        trip_data: updatedTripData,
        updated_at: new Date().toISOString()
      };
      
      // Update specific fields if they are provided
      if (tripData.title) updateObj.title = tripData.title;
      if (tripData.description) updateObj.description = tripData.description;
      if (tripData.startDate) {
        updateObj.start_date = tripData.startDate instanceof Date 
          ? tripData.startDate.toISOString() 
          : tripData.startDate;
      }
      if (tripData.endDate) {
        updateObj.end_date = tripData.endDate instanceof Date 
          ? tripData.endDate.toISOString() 
          : tripData.endDate;
      }
      if (tripData.destination) updateObj.location = tripData.destination;
      
      // Update the trip
      const { data, error } = await this.supabase
        .from('itineraries')
        .update(updateObj)
        .eq('id', tripId)
        .select();
      
      if (error) {
        console.error('Error updating trip:', error);
        return null;
      }
      
      return data && data.length > 0 ? this.mapDataToTrip(data[0]) : null;
    } catch (error) {
      console.error('Error updating trip:', error);
      return null;
    }
  }
  
  // Delete a trip
  async deleteTrip(tripId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('itineraries')
        .delete()
        .eq('id', tripId);
      
      if (error) {
        console.error('Error deleting trip:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting trip:', error);
      return false;
    }
  }
  
  // Upload a document for a trip
  async uploadDocument(tripId: string, file: File): Promise<{ id: string, url: string, name: string } | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${tripId}/${uuidv4()}.${fileExt}`;
      const filePath = `trip-documents/${fileName}`;
      
      const { data, error } = await this.supabase.storage
        .from('documents')
        .upload(filePath, file);
      
      if (error) {
        console.error('Error uploading document:', error);
        return null;
      }
      
      // Get public URL
      const { data: urlData } = await this.supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      
      if (!urlData || !urlData.publicUrl) {
        console.error('Error getting document URL');
        return null;
      }
      
      // Add document record
      const documentId = uuidv4();
      const { error: docError } = await this.supabase
        .from('documents')
        .insert({
          id: documentId,
          trip_id: tripId,
          file_name: file.name,
          file_path: filePath,
        });
      
      if (docError) {
        console.error('Error saving document record:', docError);
        return null;
      }
      
      return {
        id: documentId,
        url: urlData.publicUrl,
        name: file.name
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      return null;
    }
  }
  
  // Get documents for a trip
  async getTripDocuments(tripId: string): Promise<{ id: string, url: string, name: string }[] | null> {
    try {
      const { data, error } = await this.supabase
        .from('documents')
        .select('*')
        .eq('trip_id', tripId);
      
      if (error) {
        console.error('Error getting trip documents:', error);
        return null;
      }
      
      // Get public URLs for each document
      const documents = await Promise.all(
        data.map(async (doc) => {
          const { data: urlData } = await this.supabase.storage
            .from('documents')
            .getPublicUrl(doc.file_path);
          
          return {
            id: doc.id,
            url: urlData?.publicUrl || '',
            name: doc.file_name
          };
        })
      );
      
      return documents;
    } catch (error) {
      console.error('Error getting trip documents:', error);
      return null;
    }
  }
  
  // Helper function to map database row to Trip object
  private mapDataToTrip(data: any): Trip {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      destination: data.location,
      startDate: data.start_date,
      endDate: data.end_date,
      ...data.trip_data,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
  
  // Helper function to process Date objects for Supabase storage
  private processDateFields(trip: Partial<Trip>): any {
    const processedTrip = { ...trip };
    
    // Convert top-level Date objects to ISO strings
    if (processedTrip.startDate instanceof Date) {
      processedTrip.startDate = processedTrip.startDate.toISOString();
    }
    
    if (processedTrip.endDate instanceof Date) {
      processedTrip.endDate = processedTrip.endDate.toISOString();
    }
    
    if (processedTrip.createdAt instanceof Date) {
      processedTrip.createdAt = processedTrip.createdAt.toISOString();
    }
    
    if (processedTrip.updatedAt instanceof Date) {
      processedTrip.updatedAt = processedTrip.updatedAt.toISOString();
    }
    
    // Process days array if it exists
    if (processedTrip.days) {
      processedTrip.days = processedTrip.days.map(day => ({
        ...day,
        date: day.date instanceof Date ? day.date.toISOString() : day.date
      }));
    }
    
    return processedTrip;
  }
} 