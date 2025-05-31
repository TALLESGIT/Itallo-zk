/*
  # Create participants and draws tables

  1. New Tables
    - `participants`
      - `id` (uuid, primary key)
      - `name` (text)
      - `whatsapp` (text)
      - `number` (integer, unique)
      - `registration_date` (timestamp with time zone)
    
    - `draws`
      - `id` (uuid, primary key)
      - `winner_id` (uuid, foreign key to participants)
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS on both tables
    - Add policies for public read access
    - Add policies for public insert on participants
    - Add policies for authenticated admin users to manage all data

  3. Relationships
    - Foreign key from draws.winner_id to participants.id
*/

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  number INTEGER NOT NULL UNIQUE,
  registration_date TIMESTAMPTZ DEFAULT now()
);

-- Create draws table with foreign key relationship
CREATE TABLE IF NOT EXISTS draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  winner_id UUID REFERENCES participants(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;

-- Policies for participants table
CREATE POLICY "Anyone can view participants"
  ON participants
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert participants"
  ON participants
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can manage participants"
  ON participants
  FOR ALL
  TO authenticated
  USING (((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text)
  WITH CHECK (((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text);

-- Policies for draws table
CREATE POLICY "Anyone can view draws"
  ON draws
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage draws"
  ON draws
  FOR ALL
  TO authenticated
  USING (((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text)
  WITH CHECK (((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS participants_number_idx ON participants(number);
CREATE INDEX IF NOT EXISTS draws_winner_id_idx ON draws(winner_id);
CREATE INDEX IF NOT EXISTS draws_created_at_idx ON draws(created_at DESC);