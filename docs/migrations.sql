-- Wags & Wanders Trip Builder Tables Migration

-- Create itineraries table if it doesn't exist
CREATE TABLE IF NOT EXISTS itineraries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  location TEXT NOT NULL,
  trip_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create table for trip checklists
CREATE TABLE IF NOT EXISTS checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create table for trip documents
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Add a trip_id column to the conversations table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'conversations' AND column_name = 'trip_id'
    ) THEN
        ALTER TABLE conversations ADD COLUMN trip_id UUID REFERENCES itineraries(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create storage bucket for trip documents if it doesn't exist
-- Note: This needs to be executed via the Supabase dashboard or API
-- The equivalent would be:
-- 1. Go to Storage in Supabase dashboard
-- 2. Create a new bucket named 'documents'
-- 3. Set the privacy to 'Authenticated users only'

-- Create or update RLS (Row Level Security) policies for itineraries
CREATE POLICY "Users can view their own itineraries"
ON itineraries
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own itineraries"
ON itineraries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own itineraries"
ON itineraries
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own itineraries"
ON itineraries
FOR DELETE
USING (auth.uid() = user_id);

-- Create or update RLS policies for checklists
CREATE POLICY "Users can view their own checklists"
ON checklists
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM itineraries
  WHERE itineraries.id = checklists.itinerary_id
  AND itineraries.user_id = auth.uid()
));

CREATE POLICY "Users can insert their own checklists"
ON checklists
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM itineraries
  WHERE itineraries.id = checklists.itinerary_id
  AND itineraries.user_id = auth.uid()
));

CREATE POLICY "Users can update their own checklists"
ON checklists
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM itineraries
  WHERE itineraries.id = checklists.itinerary_id
  AND itineraries.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own checklists"
ON checklists
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM itineraries
  WHERE itineraries.id = checklists.itinerary_id
  AND itineraries.user_id = auth.uid()
));

-- Create or update RLS policies for documents
CREATE POLICY "Users can view their own documents"
ON documents
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM itineraries
  WHERE itineraries.id = documents.trip_id
  AND itineraries.user_id = auth.uid()
));

CREATE POLICY "Users can insert their own documents"
ON documents
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM itineraries
  WHERE itineraries.id = documents.trip_id
  AND itineraries.user_id = auth.uid()
));

CREATE POLICY "Users can update their own documents"
ON documents
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM itineraries
  WHERE itineraries.id = documents.trip_id
  AND itineraries.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own documents"
ON documents
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM itineraries
  WHERE itineraries.id = documents.trip_id
  AND itineraries.user_id = auth.uid()
));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_itineraries_user_id ON itineraries(user_id);
CREATE INDEX IF NOT EXISTS idx_checklists_itinerary_id ON checklists(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_documents_trip_id ON documents(trip_id);
CREATE INDEX IF NOT EXISTS idx_conversations_trip_id ON conversations(trip_id);

-- Enable Row Level Security for all tables
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY; 