-- Add bKash, Nagad, and verification fee columns to public.site_settings (id = 1)
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS bkash_number TEXT NOT NULL DEFAULT '01602393192',
  ADD COLUMN IF NOT EXISTS nagad_number TEXT NOT NULL DEFAULT '01602393192',
  ADD COLUMN IF NOT EXISTS verification_fee INTEGER NOT NULL DEFAULT 500;

-- Create public.payment_requests table for bKash and Nagad payment verification
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_code TEXT NOT NULL,
  user_id TEXT,
  user_email TEXT,
  tutor_id TEXT,
  tutor_name TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('bKash', 'Nagad')),
  sender_number TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 500,
  purpose TEXT NOT NULL DEFAULT 'Profile Verification Fee',
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  admin_note TEXT,
  hidden_from_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security on public.payment_requests
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Allow public read/insert/update for authenticated & admin workflows
DROP POLICY IF EXISTS "Allow read payment_requests" ON public.payment_requests;
CREATE POLICY "Allow read payment_requests"
  ON public.payment_requests
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow insert payment_requests" ON public.payment_requests;
CREATE POLICY "Allow insert payment_requests"
  ON public.payment_requests
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update payment_requests" ON public.payment_requests;
CREATE POLICY "Allow update payment_requests"
  ON public.payment_requests
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete payment_requests" ON public.payment_requests;
CREATE POLICY "Allow delete payment_requests"
  ON public.payment_requests
  FOR DELETE
  USING (true);
