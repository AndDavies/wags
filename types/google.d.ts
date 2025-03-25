// types/google.d.ts
export {};

declare global {
  namespace google {
    namespace maps {
      namespace places {
        interface Autocomplete {
          addListener(eventName: string, handler: () => void): void;
          getPlace(): PlaceResult;
        }

        interface AutocompleteOptions {
          types?: string[];
        }

        interface PlaceResult {
          formatted_address?: string;
          place_id?: string;
          address_components?: Array<{
            long_name: string;
            short_name: string;
            types: string[];
          }>;
        }

        class Autocomplete {
          constructor(input: HTMLInputElement, options?: AutocompleteOptions);
          addListener(eventName: string, handler: () => void): void;
          getPlace(): PlaceResult;
        }
      }
    }
  }
}