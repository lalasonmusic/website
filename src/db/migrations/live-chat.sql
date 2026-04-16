-- Live chat: admin ↔ visitor real-time messaging
-- Run this migration in the Supabase SQL editor

-- 1. Messages table
CREATE TABLE IF NOT EXISTS live_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  sender text NOT NULL CHECK (sender IN ('visitor', 'admin', 'bot')),
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_live_chat_session
  ON live_chat_messages(session_id, created_at);

-- 2. Admin takeover flag on visitor_sessions
ALTER TABLE visitor_sessions
  ADD COLUMN IF NOT EXISTS admin_takeover boolean DEFAULT false;

-- 3. RLS: deny all for anon/authenticated (access via service_role only)
ALTER TABLE live_chat_messages ENABLE ROW LEVEL SECURITY;
