-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create participants table
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    number INTEGER NOT NULL UNIQUE,
    registration_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create draws table
CREATE TABLE IF NOT EXISTS public.draws (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    winner_id UUID REFERENCES public.participants(id),
    draw_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS participants_number_idx ON public.participants(number);
CREATE INDEX IF NOT EXISTS participants_registration_date_idx ON public.participants(registration_date DESC);
CREATE INDEX IF NOT EXISTS draws_created_at_idx ON public.draws(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;

-- Create policies for participants table
CREATE POLICY "Allow public read access to participants"
    ON public.participants
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow public insert to participants"
    ON public.participants
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Allow admin full access to participants"
    ON public.participants
    TO authenticated
    USING (auth.jwt() ->> 'user_metadata'::text = 'admin'::text)
    WITH CHECK (auth.jwt() ->> 'user_metadata'::text = 'admin'::text);

-- Create policies for draws table
CREATE POLICY "Allow public read access to draws"
    ON public.draws
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow admin full access to draws"
    ON public.draws
    TO authenticated
    USING (auth.jwt() ->> 'user_metadata'::text = 'admin'::text)
    WITH CHECK (auth.jwt() ->> 'user_metadata'::text = 'admin'::text);