-- Create operation_logs table
CREATE TABLE IF NOT EXISTS public.operation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    request_id UUID REFERENCES public.solicitacoes(id),
    numbers INTEGER[] NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on operation_logs
ALTER TABLE public.operation_logs ENABLE ROW LEVEL SECURITY;

-- Add policies for operation_logs
CREATE POLICY "Allow admin access to operation_logs"
ON public.operation_logs
FOR ALL
TO authenticated
USING (((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text)
WITH CHECK (((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_operation_logs_type ON public.operation_logs(type);
CREATE INDEX IF NOT EXISTS idx_operation_logs_request_id ON public.operation_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_timestamp ON public.operation_logs(timestamp DESC);