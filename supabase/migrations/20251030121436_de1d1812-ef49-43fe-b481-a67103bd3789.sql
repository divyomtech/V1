-- Fix: Set search_path on functions to prevent SQL injection vulnerabilities
-- Drop the trigger first, then the function, then recreate with proper search_path

-- Drop the existing trigger
DROP TRIGGER IF EXISTS update_property_rating_trigger ON public.reviews;
DROP TRIGGER IF EXISTS on_review_change ON public.reviews;

-- Drop the function
DROP FUNCTION IF EXISTS public.update_property_rating();

-- Recreate the function with proper search_path
CREATE OR REPLACE FUNCTION public.update_property_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Trigger to update property rating when reviews are added/updated/deleted
  -- Currently just touches the property to update the updated_at timestamp
  UPDATE public.properties
  SET monthly_rent = monthly_rent
  WHERE id = COALESCE(NEW.property_id, OLD.property_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_property_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_property_rating();