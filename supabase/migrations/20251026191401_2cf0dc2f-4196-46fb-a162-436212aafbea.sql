-- Add reminder settings columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS payment_reminders_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS maintenance_reminders_enabled BOOLEAN DEFAULT false;