import { createClient } from './supabase-client';

/**
 * EntryRequirementsService - Handles fetching and processing travel entry requirements
 * 
 * This service provides information about travel requirements between countries,
 * including specific requirements for traveling with pets.
 */
export class EntryRequirementsService {
  private supabase = createClient();
  
  /**
   * Retrieves comprehensive entry requirements for travel between two countries
   * 
   * @param originCountry - The country of origin
   * @param destinationCountry - The destination country
   * @param includesPet - Whether to include pet-specific requirements
   * @param petType - Optional type of pet (dog, cat, etc.)
   * @returns Promise with entry requirements data
   */
  async getEntryRequirements(
    originCountry: string,
    destinationCountry: string,
    includesPet: boolean = false,
    petType?: string
  ): Promise<EntryRequirements> {
    try {
      // Step 1: Get general travel requirements
      const { data: generalRequirements, error: generalError } = await this.supabase
        .from('country_entry_requirements')
        .select('*')
        .eq('origin_country', originCountry)
        .eq('destination_country', destinationCountry)
        .single();
      
      if (generalError) {
        console.error('Error fetching general requirements:', generalError);
        throw new Error(`Failed to fetch entry requirements: ${generalError.message}`);
      }
      
      // Step 2: If needed, get pet-specific requirements
      let petRequirements = null;
      if (includesPet) {
        const { data: petData, error: petError } = await this.supabase
          .from('pet_entry_requirements')
          .select('*')
          .eq('origin_country', originCountry)
          .eq('destination_country', destinationCountry)
          .eq('pet_type', petType || 'any')
          .order('pet_type', { ascending: false }) // Specific pet types first
          .limit(1);
        
        if (petError) {
          console.error('Error fetching pet requirements:', petError);
        } else if (petData && petData.length > 0) {
          petRequirements = petData[0];
        }
      }
      
      // Step 3: Get list of required documents
      const { data: documents, error: docsError } = await this.supabase
        .from('required_documents')
        .select('*')
        .eq('origin_country', originCountry)
        .eq('destination_country', destinationCountry);
      
      if (docsError) {
        console.error('Error fetching required documents:', docsError);
      }
      
      // Step 4: Check for any travel advisories
      const { data: advisories, error: advisoryError } = await this.supabase
        .from('travel_advisories')
        .select('*')
        .eq('country', destinationCountry)
        .eq('is_active', true)
        .order('severity', { ascending: false })
        .limit(5);
      
      if (advisoryError) {
        console.error('Error fetching travel advisories:', advisoryError);
      }
      
      // Combine all data into a comprehensive requirements object
      return {
        generalRequirements: generalRequirements || {
          visa_required: 'unknown',
          passport_validity_months: 6, // Default assumption
          covid_requirements: 'Check official sources for latest COVID-19 requirements',
          currency_restrictions: 'Unknown',
          customs_information: 'Check official customs website'
        },
        petRequirements: petRequirements || null,
        requiredDocuments: documents || [],
        travelAdvisories: advisories || [],
        lastUpdated: new Date().toISOString(),
        sources: ['Official government websites', 'Supabase database']
      };
    } catch (error) {
      console.error('Error in getEntryRequirements:', error);
      throw error;
    }
  }
  
  /**
   * Searches for country information by partial name
   * 
   * @param partialName - Partial country name to search for
   * @returns Promise with matching countries
   */
  async searchCountry(partialName: string): Promise<Country[]> {
    try {
      const { data, error } = await this.supabase
        .from('countries')
        .select('*')
        .ilike('name', `%${partialName}%`)
        .order('name')
        .limit(10);
      
      if (error) {
        console.error('Error searching countries:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in searchCountry:', error);
      throw error;
    }
  }
  
  /**
   * Gets detailed pet requirements for a specific destination
   * 
   * @param destinationCountry - The destination country
   * @param petType - Type of pet (dog, cat, etc.)
   * @returns Promise with detailed pet requirements
   */
  async getPetRequirements(destinationCountry: string, petType: string): Promise<PetRequirements | null> {
    try {
      const { data, error } = await this.supabase
        .from('pet_entry_requirements')
        .select('*')
        .eq('destination_country', destinationCountry)
        .eq('pet_type', petType)
        .single();
      
      if (error) {
        console.error('Error fetching pet requirements:', error);
        return null; // Return null instead of throwing to handle gracefully
      }
      
      return data;
    } catch (error) {
      console.error('Error in getPetRequirements:', error);
      throw error;
    }
  }
  
  /**
   * Gets local pet regulations for a specific city
   * 
   * @param city - The city name
   * @param country - The country name
   * @returns Promise with local pet regulations
   */
  async getLocalPetRegulations(city: string, country: string): Promise<LocalPetRegulation[]> {
    try {
      const { data, error } = await this.supabase
        .from('local_pet_regulations')
        .select('*')
        .eq('country', country)
        .ilike('city', `%${city}%`);
      
      if (error) {
        console.error('Error fetching local pet regulations:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getLocalPetRegulations:', error);
      throw error;
    }
  }
}

// Type definitions
export interface Country {
  id: number;
  name: string;
  code: string;
  region: string;
  currency: string;
  language: string;
  pet_friendly_rating?: number; // 1-5 scale
}

export interface EntryRequirements {
  generalRequirements: {
    visa_required: 'yes' | 'no' | 'on-arrival' | 'e-visa' | 'unknown';
    passport_validity_months: number;
    covid_requirements: string;
    currency_restrictions: string;
    customs_information: string;
    health_insurance_required?: boolean;
    return_ticket_required?: boolean;
    [key: string]: any;
  };
  petRequirements: PetRequirements | null;
  requiredDocuments: RequiredDocument[];
  travelAdvisories: TravelAdvisory[];
  lastUpdated: string;
  sources: string[];
}

export interface PetRequirements {
  id: number;
  origin_country: string;
  destination_country: string;
  pet_type: string;
  microchip_required: boolean;
  vaccination_required: boolean;
  vaccination_details: string;
  quarantine_required: boolean;
  quarantine_details: string;
  health_certificate_required: boolean;
  health_certificate_validity_days: number;
  import_permit_required: boolean;
  blood_test_required: boolean;
  additional_requirements: string;
  restricted_breeds: string[];
  entry_points: string[];
  export_requirements: string;
}

export interface RequiredDocument {
  id: number;
  origin_country: string;
  destination_country: string;
  document_type: string;
  is_required: boolean;
  details: string;
  for_pets: boolean;
}

export interface TravelAdvisory {
  id: number;
  country: string;
  advisory_text: string;
  severity: 'low' | 'medium' | 'high';
  issue_date: string;
  source: string;
  is_active: boolean;
}

export interface LocalPetRegulation {
  id: number;
  country: string;
  city: string;
  regulation_type: string;
  description: string;
  pet_types: string[];
  is_restriction: boolean;
}

// Export as singleton instance
export const entryRequirementsService = new EntryRequirementsService(); 