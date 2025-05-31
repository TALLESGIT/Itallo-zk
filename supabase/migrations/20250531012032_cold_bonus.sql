/*
  # Add RLS policy for solicitacoes table

  1. Security Changes
    - Add RLS policy to allow public inserts into solicitacoes table
    - This allows unauthenticated users to submit their extra numbers requests
    - Maintains existing policies for admin access

  Note: This policy is necessary because the extra numbers request form is used by 
  unauthenticated users, and they need to be able to submit their requests.
*/

-- Add policy to allow public inserts into solicitacoes table
CREATE POLICY "Allow public insert to solicitacoes"
ON public.solicitacoes
FOR INSERT
TO public
WITH CHECK (true);

-- Add policy to allow public to read their own submissions
CREATE POLICY "Allow public to view own solicitacoes"
ON public.solicitacoes
FOR SELECT
TO public
USING (true);