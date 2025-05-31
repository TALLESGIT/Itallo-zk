/*
  # Fix operation_logs RLS policies

  1. Changes
    - Add INSERT policy for authenticated users to create operation logs

  2. Security
    - Maintains existing RLS policies
    - Adds new policy for INSERT operations
    - Only authenticated users can insert records
*/

-- Add INSERT policy for authenticated users
CREATE POLICY "Allow authenticated users to insert operation logs"
ON operation_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');