-- Create public.site_settings table (id = 1) for Official Social & Support Channels
CREATE TABLE IF NOT EXISTS public.site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  facebook_url TEXT NOT NULL DEFAULT 'https://www.facebook.com/tutorzonebd',
  whatsapp_url TEXT NOT NULL DEFAULT 'https://wa.me/8801602393192',
  whatsapp_number TEXT NOT NULL DEFAULT '01602393192',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default row (id = 1)
INSERT INTO public.site_settings (id, facebook_url, whatsapp_url, whatsapp_number)
VALUES (1, 'https://www.facebook.com/tutorzonebd', 'https://wa.me/8801602393192', '01602393192')
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access so all users see live Facebook & WhatsApp links in the footer
DROP POLICY IF EXISTS "Allow public read site_settings" ON public.site_settings;
CREATE POLICY "Allow public read site_settings"
  ON public.site_settings
  FOR SELECT
  USING (true);

-- Allow Admin / authenticated upsert on site_settings (id = 1)
DROP POLICY IF EXISTS "Allow admin upsert site_settings" ON public.site_settings;
CREATE POLICY "Allow admin upsert site_settings"
  ON public.site_settings
  FOR ALL
  USING (true)
  WITH CHECK (id = 1);
