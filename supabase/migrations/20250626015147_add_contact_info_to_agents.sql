
-- Add contact_info column to agents table
ALTER TABLE public.agents 
ADD COLUMN contact_info jsonb;
