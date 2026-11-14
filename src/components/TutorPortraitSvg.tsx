import React from 'react';
import { TutorProfile } from '../types/madaripur';

interface PortraitProps {
  variant: TutorProfile['portraitVariant'];
  className?: string;
}

export const TutorPortraitSvg: React.FC<PortraitProps> = ({
  variant,
  className = 'w-16 h-16',
}) => {
  const configs: Record<
    TutorProfile['portraitVariant'],
    {
      bg: string;
      accent: string;
      garment: string;
      skin: string;
      hair: string;
      glasses?: boolean;
      female?: boolean;
      headscarf?: string;
      kufi?: boolean;
      beard?: boolean;
    }
  > = {
    arif: {
      bg: '#E6F4EF',
      accent: '#047857',
      garment: '#065F46',
      skin: '#D9A17C',
      hair: '#1C1917',
      glasses: true,
    },
    nusrat: {
      bg: '#FEF3C7',
      accent: '#D97706',
      garment: '#047857',
      skin: '#E2AF8E',
      hair: '#1C1917',
      female: true,
      headscarf: '#064E3B',
    },
    tanvir: {
      bg: '#F3F1EC',
      accent: '#047857',
      garment: '#1E293B',
      skin: '#D39972',
      hair: '#1C1917',
    },
    farhana: {
      bg: '#FCE7F3',
      accent: '#B45309',
      garment: '#92400E',
      skin: '#E4B494',
      hair: '#1C1917',
      female: true,
      glasses: true,
      headscarf: '#78350F',
    },
    mahmud: {
      bg: '#ECFDF5',
      accent: '#047857',
      garment: '#065F46',
      skin: '#D49B75',
      hair: '#1C1917',
      kufi: true,
      beard: true,
    },
    sadia: {
      bg: '#FEF9C3',
      accent: '#047857',
      garment: '#B45309',
      skin: '#E5B697',
      hair: '#1C1917',
      female: true,
    },
    rakib: {
      bg: '#E0F2FE',
      accent: '#047857',
      garment: '#0F172A',
      skin: '#D69E78',
      hair: '#1C1917',
      glasses: true,
    },
    tasnim: {
      bg: '#ECFDF5',
      accent: '#D97706',
      garment: '#047857',
      skin: '#E4B393',
      hair: '#1C1917',
      female: true,
      headscarf: '#047857',
    },
  };

  const c = configs[variant] || configs.arif;

  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} rounded-xl overflow-hidden shrink-0 select-none`}
      role="img"
      aria-label={`Portrait illustration of ${variant}`}
    >
      <rect width="96" height="96" fill={c.bg} />
      <circle cx="80" cy="18" r="24" fill={c.accent} fillOpacity="0.12" />
      <circle cx="14" cy="82" r="20" fill={c.accent} fillOpacity="0.1" />

      {/* Shoulders / Garment */}
      <path
        d="M16 96C16 75.5 30.3 64 48 64C65.7 64 80 75.5 80 96H16Z"
        fill={c.garment}
      />
      {/* Collar detail */}
      <path
        d="M38 65L48 77L58 65"
        stroke="#FAF8F5"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Neck */}
      <rect x="42" y="52" width="12" height="16" rx="5" fill={c.skin} />

      {/* Headscarf back layer if applicable */}
      {c.female && c.headscarf && (
        <path
          d="M27 42C27 25.5 36.4 17 48 17C59.6 17 69 25.5 69 42C69 55 64 68 48 69C32 68 27 55 27 42Z"
          fill={c.headscarf}
        />
      )}

      {/* Female long hair if no headscarf */}
      {c.female && !c.headscarf && (
        <path
          d="M28 40C28 24 36.5 16 48 16C59.5 16 68 24 68 40C68 54 65 64 60 66H36C31 64 28 54 28 40Z"
          fill={c.hair}
        />
      )}

      {/* Face */}
      <rect x="33" y="24" width="30" height="34" rx="14" fill={c.skin} />

      {/* Hair / Kufi */}
      {c.kufi ? (
        <path
          d="M32 31C32 22.5 39 18 48 18C57 18 64 22.5 64 31H32Z"
          fill="#FAF8F5"
          stroke={c.accent}
          strokeWidth="2"
        />
      ) : !c.headscarf ? (
        <path
          d="M32 34C32 22.5 38.8 17 48 17C57.2 17 64 22.5 64 34C61 28 55 26 48 26C41 26 35 28 32 34Z"
          fill={c.hair}
        />
      ) : (
        <path
          d="M33 33C36 25 42 23 48 23C54 23 60 25 63 33C60 28 54 26 48 26C42 26 36 28 33 33Z"
          fill={c.headscarf}
        />
      )}

      {/* Eyes */}
      <circle cx="42" cy="39" r="2" fill="#1C1917" />
      <circle cx="54" cy="39" r="2" fill="#1C1917" />

      {/* Eyebrows */}
      <path
        d="M39 35.5C40.5 34.5 43 34.5 44.5 35.5"
        stroke="#1C1917"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M51.5 35.5C53 34.5 55.5 34.5 57 35.5"
        stroke="#1C1917"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Glasses */}
      {c.glasses && (
        <g stroke="#1C1917" strokeWidth="1.6">
          <rect x="37" y="35.5" width="9.5" height="7" rx="2" fill="none" />
          <rect x="49.5" y="35.5" width="9.5" height="7" rx="2" fill="none" />
          <line x1="46.5" y1="38.5" x2="49.5" y2="38.5" />
        </g>
      )}

      {/* Beard if applicable */}
      {c.beard && (
        <path
          d="M34 45C34 53 40 59 48 59C56 59 62 53 62 45C59 49 54 51 48 51C42 51 37 49 34 45Z"
          fill="#1C1917"
        />
      )}

      {/* Smile */}
      <path
        d="M44 47.5C45.5 49.2 50.5 49.2 52 47.5"
        stroke={c.beard ? '#FAF8F5' : '#1C1917'}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const MadaripurEditorialSceneSvg: React.FC = () => {
  return (
    <svg
      viewBox="0 0 520 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-44 sm:h-48 rounded-xl object-cover select-none"
      role="img"
      aria-label="Editorial illustration of Madaripur Shakuni Lake and mentorship desk"
    >
      <defs>
        <linearGradient id="padmaSky" x1="0" y1="0" x2="520" y2="260" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#064E3B" />
          <stop offset="60%" stopColor="#047857" />
          <stop offset="100%" stopColor="#065F46" />
        </linearGradient>
        <linearGradient id="sunGlow" x1="380" y1="20" x2="380" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="520" height="260" fill="url(#padmaSky)" />
      <circle cx="400" cy="76" r="68" fill="url(#sunGlow)" />
      <circle cx="400" cy="76" r="28" fill="#F59E0B" fillOpacity="0.85" />

      {/* Padma Bridge & Shakuni Lake architectural horizon */}
      <path
        d="M0 175L65 145L130 175L195 142L260 175L325 145L390 175L455 148L520 175V205H0V175Z"
        fill="#022C22"
        fillOpacity="0.45"
      />
      <line x1="0" y1="176" x2="520" y2="176" stroke="#F59E0B" strokeOpacity="0.4" strokeWidth="1.5" />

      {/* Study Desk & Open Books Foreground Card */}
      <rect x="24" y="38" width="298" height="184" rx="14" fill="#FAF8F5" fillOpacity="0.96" />
      <rect x="42" y="56" width="96" height="8" rx="4" fill="#047857" />
      <rect x="42" y="72" width="176" height="6" rx="3" fill="#78716C" fillOpacity="0.4" />

      {/* Coordinate graph & math curve inside card */}
      <rect x="42" y="92" width="116" height="74" rx="8" fill="#ECFDF5" stroke="#047857" strokeOpacity="0.25" />
      <path
        d="M52 152C66 146 74 114 94 120C114 126 124 104 142 106"
        stroke="#047857"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="94" cy="120" r="3.5" fill="#F59E0B" />
      <circle cx="142" cy="106" r="3.5" fill="#047857" />

      {/* Verification Stamp */}
      <rect x="170" y="92" width="134" height="74" rx="8" fill="#FFFBEB" stroke="#F59E0B" strokeOpacity="0.4" />
      <text x="182" y="115" fill="#92400E" fontSize="10" fontWeight="700" fontFamily="Plus Jakarta Sans, sans-serif">
        NID + UNI ID
      </text>
      <text x="182" y="135" fill="#047857" fontSize="14" fontWeight="800" fontFamily="JetBrains Mono, monospace">
        100% CHECKED
      </text>
      <text x="182" y="153" fill="#78716C" fontSize="9.5" fontWeight="700" fontFamily="Plus Jakarta Sans, sans-serif">
        Tutor Zone · Drabir Mandal
      </text>

      {/* Bottom Caption Bar inside card */}
      <text x="42" y="196" fill="#1C1917" fontSize="11.5" fontWeight="700" fontFamily="Plus Jakarta Sans, sans-serif">
        Sadar · Shibchar · Kalkini · Rajoir · Dasar
      </text>
    </svg>
  );
};
