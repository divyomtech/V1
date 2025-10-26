-- Add safety score and nearby amenities to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS safety_score integer DEFAULT 0 CHECK (safety_score >= 0 AND safety_score <= 5),
ADD COLUMN IF NOT EXISTS nearby_amenities jsonb DEFAULT '{"metro": [], "hospital": [], "market": [], "school": []}'::jsonb,
ADD COLUMN IF NOT EXISTS instant_booking boolean DEFAULT false;

-- Add referral system tables
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id),
  referee_id uuid REFERENCES auth.users(id),
  referral_code text NOT NULL UNIQUE,
  reward_amount integer DEFAULT 500,
  reward_claimed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  claimed_at timestamp with time zone
);

-- Enable RLS for referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Create policies for referrals
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "Users can create referrals"
  ON referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);

-- Add notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  read boolean DEFAULT false,
  link text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Add property comparison tracking
CREATE TABLE IF NOT EXISTS property_comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  property_ids uuid[] NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE property_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own comparisons"
  ON property_comparisons FOR ALL
  USING (auth.uid() = user_id);