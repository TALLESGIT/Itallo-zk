-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage draws" ON draws;
DROP POLICY IF EXISTS "Anyone can view draws" ON draws;

-- Enable RLS on draws table
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;

-- Allow admin users to manage draws
CREATE POLICY "Admins can manage draws"
ON draws
FOR ALL
TO authenticated
USING (((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text)
WITH CHECK (((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text);

-- Allow public to view draws
CREATE POLICY "Anyone can view draws"
ON draws
FOR SELECT
TO public
USING (true);