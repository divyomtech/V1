-- Add virtual_tour_url to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS virtual_tour_url TEXT;

-- Create conversations table for chat
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(property_id, customer_id)
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view own conversations"
ON public.conversations FOR SELECT
USING (auth.uid() = customer_id OR auth.uid() = owner_id);

CREATE POLICY "Customers can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- Messages are already in the database, let's add conversation_id
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE;

-- Update messages policies
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own received messages" ON public.messages;

CREATE POLICY "Users can view conversation messages"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.customer_id = auth.uid() OR conversations.owner_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages in their conversations"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = from_user AND
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.customer_id = auth.uid() OR conversations.owner_id = auth.uid())
  )
);

CREATE POLICY "Users can update own messages"
ON public.messages FOR UPDATE
USING (auth.uid() = to_user);

-- Create roommate_preferences table
CREATE TABLE public.roommate_preferences (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  age_range TEXT,
  occupation TEXT,
  lifestyle TEXT[], -- early_bird, night_owl, social, quiet, etc.
  interests TEXT[], -- sports, music, cooking, reading, etc.
  dietary_preference TEXT, -- veg, non_veg, vegan, etc.
  smoking BOOLEAN DEFAULT false,
  drinking BOOLEAN DEFAULT false,
  pets BOOLEAN DEFAULT false,
  cleanliness_level INTEGER CHECK (cleanliness_level >= 1 AND cleanliness_level <= 5),
  budget_min INTEGER,
  budget_max INTEGER,
  preferred_gender TEXT,
  preferred_locations TEXT[],
  bio TEXT,
  looking_for_roommate BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.roommate_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roommate_preferences
CREATE POLICY "Users can view active roommate seekers"
ON public.roommate_preferences FOR SELECT
USING (looking_for_roommate = true);

CREATE POLICY "Users can manage own preferences"
ON public.roommate_preferences FOR ALL
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_conversations_customer ON public.conversations(customer_id);
CREATE INDEX idx_conversations_owner ON public.conversations(owner_id);
CREATE INDEX idx_conversations_property ON public.conversations(property_id);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);