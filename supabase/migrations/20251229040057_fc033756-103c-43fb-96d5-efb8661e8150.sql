-- Add recurrence fields to tasks table
ALTER TABLE public.tasks 
ADD COLUMN recurrence_type text DEFAULT NULL,
ADD COLUMN recurrence_interval integer DEFAULT 1;

-- Add constraint to validate recurrence_type values
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_recurrence_type_check 
CHECK (recurrence_type IS NULL OR recurrence_type IN ('daily', 'weekly', 'monthly'));