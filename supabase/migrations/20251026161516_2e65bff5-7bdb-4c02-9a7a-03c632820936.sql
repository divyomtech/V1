-- Add new fields to profiles table for emergency contact and work details
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS emergency_contact_name text,
ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
ADD COLUMN IF NOT EXISTS emergency_contact_address text,
ADD COLUMN IF NOT EXISTS work_type text,
ADD COLUMN IF NOT EXISTS work_place text,
ADD COLUMN IF NOT EXISTS languages_known text[],
ADD COLUMN IF NOT EXISTS mother_tongue text;