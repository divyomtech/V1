-- Fix function search path - drop trigger first
DROP TRIGGER IF EXISTS update_property_rating_trigger ON public.reviews;
DROP FUNCTION IF EXISTS public.update_property_rating();

CREATE OR REPLACE FUNCTION public.update_property_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.properties
  SET 
    monthly_rent = monthly_rent
  WHERE id = COALESCE(NEW.property_id, OLD.property_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_property_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_property_rating();