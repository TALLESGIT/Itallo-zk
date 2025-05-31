-- Create a custom schema for file storage if it doesn't exist
CREATE SCHEMA IF NOT EXISTS custom_storage;

-- Create a table to store file metadata
CREATE TABLE IF NOT EXISTS custom_storage.files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    bucket_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB DEFAULT '{}'::JSONB,
    owner UUID REFERENCES auth.users(id),
    size BIGINT,
    mime_type TEXT
);

-- Create an index on bucket_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_files_bucket_id ON custom_storage.files(bucket_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION custom_storage.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_files_updated_at
    BEFORE UPDATE ON custom_storage.files
    FOR EACH ROW
    EXECUTE FUNCTION custom_storage.update_updated_at_column();

-- Create policies for file access
ALTER TABLE custom_storage.files ENABLE ROW LEVEL SECURITY;

-- Policy to allow public uploads
CREATE POLICY "Allow public uploads"
    ON custom_storage.files
    FOR INSERT
    TO public
    WITH CHECK (
        bucket_id = 'comprovantes' AND
        (LOWER(RIGHT(name, 4)) IN ('.jpg', '.png') OR LOWER(RIGHT(name, 5)) = '.webp')
    );

-- Policy to allow public reads
CREATE POLICY "Allow public reads"
    ON custom_storage.files
    FOR SELECT
    TO public
    USING (bucket_id = 'comprovantes');

-- Insert the default bucket if it doesn't exist
INSERT INTO custom_storage.files (bucket_id, name)
SELECT 'comprovantes', 'bucket_info'
WHERE NOT EXISTS (
    SELECT 1 FROM custom_storage.files WHERE bucket_id = 'comprovantes' AND name = 'bucket_info'
);