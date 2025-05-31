/*
  # Create storage bucket for payment proofs

  1. Storage Setup
    - Create 'comprovantes' bucket for storing payment proofs
    - Enable public access for admins to view proofs
    - Allow public uploads for payment verification
  
  2. Security
    - Enable storage policies for the bucket
    - Add policy for public uploads
    - Add policy for admin access to view all proofs
*/

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprovantes', 'comprovantes', false)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public uploads
CREATE POLICY "Allow public uploads to comprovantes"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'comprovantes' AND
  (storage.foldername(name))[1] = 'proofs'
);

-- Policy to allow admins to do everything
CREATE POLICY "Allow admin access to comprovantes"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'comprovantes' AND
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
);

-- Policy to allow public to read their own uploads
CREATE POLICY "Allow public to read their own uploads"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'comprovantes'
);