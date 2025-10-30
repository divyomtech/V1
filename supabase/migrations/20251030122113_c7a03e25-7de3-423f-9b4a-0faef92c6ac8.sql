-- Security Fix: Validate booking amounts to prevent client-side manipulation
CREATE OR REPLACE FUNCTION validate_booking_amounts()
RETURNS TRIGGER AS $$
DECLARE
  expected_rent integer;
  expected_deposit integer;
BEGIN
  -- If room_id is provided, get room price; otherwise use property price
  IF NEW.room_id IS NOT NULL THEN
    SELECT price INTO expected_rent
    FROM rooms WHERE id = NEW.room_id;
    SELECT deposit INTO expected_deposit
    FROM properties WHERE id = NEW.property_id;
  ELSE
    SELECT monthly_rent, deposit INTO expected_rent, expected_deposit
    FROM properties WHERE id = NEW.property_id;
  END IF;
  
  -- Validate amounts match the actual property/room pricing
  IF NEW.amount != expected_rent OR NEW.security_deposit != expected_deposit THEN
    RAISE EXCEPTION 'Booking amounts do not match property pricing';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

CREATE TRIGGER validate_booking_amounts_trigger
BEFORE INSERT ON bookings
FOR EACH ROW EXECUTE FUNCTION validate_booking_amounts();

-- Security Fix: Add length constraints to prevent abuse and database bloat
-- Messages should have reasonable length limits
ALTER TABLE messages ADD CONSTRAINT message_length_check 
CHECK (char_length(content) >= 1 AND char_length(content) <= 2000);

-- Reviews should have reasonable comment length limits
ALTER TABLE reviews ADD CONSTRAINT comment_length_check 
CHECK (comment IS NULL OR char_length(comment) <= 1000);