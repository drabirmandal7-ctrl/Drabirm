import React from 'react';
import { unstable_noStore } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import FloatingWhatsAppButton from '@/components/FloatingWhatsAppButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://lqlumszqxnzmowfpioxf.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_OWl0EbdYM5n2HUzWElzilg_NpfxQkO0';

export default async function RootLayout({ children }) {
  // 1. Bypass Next.js caching completely
  unstable_noStore();

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
    },
  });

  // 2. Fetch whatsapp_number directly from Supabase site_settings (where id = 1)
  const { data } = await supabase
    .from('site_settings')
    .select('whatsapp_number')
    .eq('id', 1)
    .single();

  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900">
        {children}

        {/* 3. Global Floating WhatsApp Button synced with Supabase site_settings */}
        {data?.whatsapp_number && (
          <FloatingWhatsAppButton whatsapp_number={data.whatsapp_number} />
        )}
      </body>
    </html>
  );
}
