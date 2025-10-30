-- Fix Critical Security Issues: RLS Policies

-- 1. Fix profiles table - Remove public access to PII
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

-- Create restricted profile access policies
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Owners view customers with active bookings" ON profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.customer_id = profiles.id
    AND bookings.owner_id = auth.uid()
    AND bookings.status IN ('accepted', 'paid')
  )
);

-- 2. Fix system_settings table - Remove public access to business config
DROP POLICY IF EXISTS "Anyone can view system settings" ON system_settings;

-- Create admin-only system settings access
CREATE POLICY "Admins can view system settings" ON system_settings
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Ensure audit_logs policies are correct (already good, but verify)
-- The existing policies are secure:
-- - "Admins can view audit logs" - admin-only SELECT
-- - "System can insert audit logs" - allows logging

-- Note: The user role manipulation issue will be fixed in application code