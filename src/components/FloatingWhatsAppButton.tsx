import React, { useEffect, useState } from 'react';
import { Language } from '../types/madaripur';
import {
  fetchSiteSocialSettingsFromSupabase,
  formatWhatsAppDirectLink,
  readSiteSocialSettingsFromStorage,
} from '../utils/tutorEngine';
import { supabase } from '../supabaseClient';

export const OFFICIAL_WHATSAPP_SUPPORT_NUMBER = '8801715380022';
export const OFFICIAL_WHATSAPP_SUPPORT_MESSAGE =
  'Hello Tutor Zone Admin, I need help with...';

export function buildOfficialWhatsAppSupportUrl(
  rawWhatsappContact: string = OFFICIAL_WHATSAPP_SUPPORT_NUMBER,
  customMessage: string = OFFICIAL_WHATSAPP_SUPPORT_MESSAGE
): string {
  const effectiveContact =
    (rawWhatsappContact || '').trim() || OFFICIAL_WHATSAPP_SUPPORT_NUMBER;
  return formatWhatsAppDirectLink(effectiveContact, customMessage);
}

interface FloatingWhatsAppButtonProps {
  lang?: Language;
  whatsappContact?: string;
  whatsapp_number?: string;
}

export const FloatingWhatsAppButton: React.FC<FloatingWhatsAppButtonProps> = ({
  lang = 'en',
  whatsappContact,
  whatsapp_number,
}) => {
  const incomingWhatsappProp = whatsapp_number || whatsappContact;
  const [liveWhatsappContact, setLiveWhatsappContact] = useState<string>(
    () =>
      incomingWhatsappProp ||
      readSiteSocialSettingsFromStorage().whatsappContact ||
      OFFICIAL_WHATSAPP_SUPPORT_NUMBER
  );

  useEffect(() => {
    if (incomingWhatsappProp && incomingWhatsappProp.trim()) {
      setLiveWhatsappContact(incomingWhatsappProp.trim());
      return;
    }
    let mounted = true;
    fetchSiteSocialSettingsFromSupabase(supabase)
      .then((settings) => {
        if (mounted && settings?.whatsappContact) {
          setLiveWhatsappContact(settings.whatsappContact);
        }
      })
      .catch(() => {
        // Ignore network errors and keep fallback
      });
    return () => {
      mounted = false;
    };
  }, [incomingWhatsappProp]);

  const effectiveWhatsapp =
    (incomingWhatsappProp && incomingWhatsappProp.trim()) || liveWhatsappContact;

  const directWhatsappUrl = buildOfficialWhatsAppSupportUrl(
    effectiveWhatsapp,
    OFFICIAL_WHATSAPP_SUPPORT_MESSAGE
  );

  if (!directWhatsappUrl) return null;

  return (
    <div
      data-testid="floating-whatsapp-widget"
      className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 flex items-center gap-2.5 group pointer-events-none"
    >
      <span
        role="tooltip"
        className="pointer-events-auto hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-stone-900/95 dark:bg-stone-800/95 text-white text-xs font-extrabold shadow-lg border border-white/10 opacity-95 group-hover:opacity-100 group-hover:-translate-x-0.5 transition-all duration-200 whitespace-nowrap"
      >
        <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse shrink-0" />
        <span>
          {lang === 'en'
            ? 'Need Help? Chat on WhatsApp'
            : 'সাহায্য প্রয়োজন? হোয়াটসঅ্যাপে চ্যাট করুন'}
        </span>
      </span>

      <a
        href={directWhatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={
          lang === 'en'
            ? 'Need Help? Chat on WhatsApp'
            : 'সাহায্য প্রয়োজন? হোয়াটসঅ্যাপে চ্যাট করুন'
        }
        className="pointer-events-auto relative w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-[#128C7E] via-[#25D366] to-[#2FE376] text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center ring-4 ring-[#25D366]/25 focus:outline-none focus:ring-[#25D366]/50 cursor-pointer"
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-[#25D366] opacity-25 animate-ping pointer-events-none"
        />

        <svg
          className="w-5 h-5 sm:w-7 sm:h-7 fill-current relative z-10 drop-shadow-xs"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.625.846 5.059 2.284 7.033l-1.492 5.451 5.581-1.464c1.908 1.251 4.185 1.98 6.627 1.98 6.627 0 12-5.373 12-12s-5.373-12-12-12z" />
        </svg>
      </a>
    </div>
  );
};

export default FloatingWhatsAppButton;
