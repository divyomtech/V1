-- Update properties INSERT policy to check owner approval status
DROP POLICY IF EXISTS "Owners can insert properties" ON public.properties;

CREATE POLICY "Owners can insert properties"
ON public.properties
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = owner_id 
  AND has_role(auth.uid(), 'owner'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.owners_profile
    WHERE user_id = auth.uid()
    AND approval_status = 'approved'::kyc_status
  )
);

-- Ensure trigger creates owners_profile when owner role is assigned
CREATE OR REPLACE FUNCTION public.handle_owner_role_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When an owner role is assigned, create owners_profile if it doesn't exist
  IF NEW.role = 'owner'::app_role THEN
    INSERT INTO public.owners_profile (user_id, approval_status)
    VALUES (NEW.user_id, 'pending'::kyc_status)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_owner_role_assignment ON public.user_roles;
CREATE TRIGGER on_owner_role_assignment
AFTER INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.handle_owner_role_assignment();