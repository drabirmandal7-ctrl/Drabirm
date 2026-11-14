import React, { useId } from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 3D Emerald-Green & Gold-Edged Isometric Circuit Graduation Cap "Tutor Zone" Logo
 * 100% transparent background with realistic 3D bevels, glowing mint-green circuit nodes,
 * 3D left tassel, and 3D extruded "Tutor Zone" typography.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const uid = useId().replace(/:/g, '');

  const iconSizeClasses =
    size === 'sm'
      ? 'w-12 h-12'
      : size === 'lg'
      ? 'w-14 h-14 sm:w-16 sm:h-16'
      : 'w-14 h-14';

  const textSizeClasses =
    size === 'sm'
      ? 'text-lg sm:text-xl font-bold tracking-tight'
      : size === 'lg'
      ? 'text-xl md:text-2xl font-bold tracking-tight'
      : 'text-xl md:text-2xl font-bold tracking-tight';

  return (
    <span
      className={`inline-flex items-center gap-2.5 select-none bg-transparent ${className}`}
      data-testid="tutor-zone-3d-brand-logo"
    >
      {/* 3D Isometric Deep-Emerald & Gold-Edged Circuit Graduation Cap SVG */}
      <svg
        viewBox="0 0 180 148"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={`${iconSizeClasses} shrink-0 overflow-visible transition-transform duration-300 group-hover:scale-105`}
      >
        <defs>
          {/* Cap Top Emerald Surface Gradient */}
          <linearGradient
            id={`capTopSurface-${uid}`}
            x1="28"
            y1="18"
            x2="148"
            y2="82"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#059669" />
            <stop offset="48%" stopColor="#047857" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>

          {/* Cap Top Facet Highlight */}
          <linearGradient
            id={`capFacetHighlight-${uid}`}
            x1="78"
            y1="14"
            x2="145"
            y2="52"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#047857" stopOpacity="0.15" />
          </linearGradient>

          {/* Skullcap Lower Emerald Base */}
          <linearGradient
            id={`capBaseEmerald-${uid}`}
            x1="62"
            y1="66"
            x2="132"
            y2="112"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#064e3b" />
            <stop offset="55%" stopColor="#047857" />
            <stop offset="100%" stopColor="#022c22" />
          </linearGradient>

          {/* Warm Metallic-Gold 3D Bevel Edge Gradient (#d4af37 / #eab308) */}
          <linearGradient
            id={`goldBevel-${uid}`}
            x1="20"
            y1="40"
            x2="160"
            y2="98"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="28%" stopColor="#eab308" />
            <stop offset="62%" stopColor="#d4af37" />
            <stop offset="85%" stopColor="#a16207" />
            <stop offset="100%" stopColor="#facc15" />
          </linearGradient>

          {/* Glowing Mint-Green Circuit Nodes Gradient (#4ade80 / #6ee7b7) */}
          <radialGradient
            id={`mintNodeGlow-${uid}`}
            cx="50%"
            cy="38%"
            r="62%"
          >
            <stop offset="0%" stopColor="#ecfdf5" />
            <stop offset="42%" stopColor="#6ee7b7" />
            <stop offset="80%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#10b981" />
          </radialGradient>

          {/* 3D Left Tassel Metallic Emerald Gradient */}
          <linearGradient
            id={`tasselEmerald-${uid}`}
            x1="40"
            y1="62"
            x2="66"
            y2="128"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>

          {/* Soft 3D Drop Shadow + Neon Mint Circuit Glow Filter */}
          <filter
            id={`capDropShadow-${uid}`}
            x="-18%"
            y="-18%"
            width="136%"
            height="142%"
          >
            <feDropShadow
              dx="0"
              dy="6"
              stdDeviation="4.5"
              floodColor="#022c22"
              floodOpacity="0.38"
            />
          </filter>

          <filter
            id={`circuitGlow-${uid}`}
            x="-35%"
            y="-35%"
            width="170%"
            height="170%"
          >
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g filter={`url(#capDropShadow-${uid})`}>
          {/* ==============================================================
              1. LOWER SKULLCAP (3D Gold-Rim Extrusion + Deep Emerald Body)
             ============================================================== */}
          {/* 3D Gold Extruded Rim of Skullcap */}
          <path
            d="M60 72 L64 103 C77 98 90 101 101 109 C110 96 122 88 135 84 L126 57 Z"
            fill={`url(#goldBevel-${uid})`}
            stroke="#a16207"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {/* Inner Deep-Emerald Skullcap Surface */}
          <path
            d="M62 68 L66 96 C78 92 90 95 100 102 C109 90 120 82 132 78 L124 54 Z"
            fill={`url(#capBaseEmerald-${uid})`}
            stroke={`url(#goldBevel-${uid})`}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />

          {/* ==============================================================
              2. ISOMETRIC MORTARBOARD CAP TOP (3D Gold Bevel + Emerald Top)
             ============================================================== */}
          {/* 3D Metallic Gold Bottom Extrusion Wall of Mortarboard */}
          <path
            d="M18 59 L18 67 L94 79 L158 33 L158 25 L94 71 Z"
            fill={`url(#goldBevel-${uid})`}
            stroke="#92400e"
            strokeWidth="1.1"
            strokeLinejoin="round"
          />

          {/* Isometric Emerald Mortarboard Top Surface with Gold Bevel Rim */}
          <polygon
            points="78,12 158,25 94,71 18,59"
            fill={`url(#capTopSurface-${uid})`}
            stroke={`url(#goldBevel-${uid})`}
            strokeWidth="2.4"
            strokeLinejoin="round"
          />

          {/* Subtle Specular Isometric Facet Highlight on Right Half */}
          <polygon
            points="78,13.5 155,25.5 94,69.5 85,41"
            fill={`url(#capFacetHighlight-${uid})`}
          />

          {/* ==============================================================
              3. GLOWING MINT-GREEN ISOMETRIC CIRCUIT TRACES & NODES
             ============================================================== */}
          <g filter={`url(#circuitGlow-${uid})`}>
            {/* Upper Cap Circuit Trace: Left Nodes -> Center Hub -> Right Hub */}
            <polyline
              points="48,58 54,44 66,34 86,35 136,41"
              stroke="#6ee7b7"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Secondary Parallel Trace from Center Hub to Left Tassel Pivot */}
            <line
              x1="86"
              y1="36"
              x2="46"
              y2="63"
              stroke="#4ade80"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <line
              x1="88"
              y1="39"
              x2="49"
              y2="66"
              stroke="#fde047"
              strokeWidth="1.3"
              strokeLinecap="round"
            />

            {/* Lower Skullcap Circuit Trace & External Right Nodes */}
            <polyline
              points="76,84 92,87 86,105"
              stroke="#4ade80"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="92,87 103,88 117,71 142,64 152,49"
              stroke="#6ee7b7"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="136"
              y1="41"
              x2="142"
              y2="64"
              stroke="#4ade80"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Glowing Circuit Nodes on Cap Surface */}
            <circle cx="54" cy="44" r="3.6" fill="#a7f3d0" />
            <circle cx="66" cy="34" r="4.8" fill="#6ee7b7" />
            <circle cx="76" cy="84" r="4.5" fill="#6ee7b7" />
            <circle cx="92" cy="87" r="3.6" fill="#a7f3d0" />
            <circle cx="103" cy="88" r="3.6" fill="#a7f3d0" />
            <circle cx="117" cy="71" r="4.8" fill="#6ee7b7" />
          </g>

          {/* 3D Cylindrical Right Node Hub & External Floating Circuit Pins */}
          <ellipse
            cx="135"
            cy="45"
            rx="10.5"
            ry="7.5"
            fill={`url(#goldBevel-${uid})`}
            stroke="#92400e"
            strokeWidth="1"
          />
          <ellipse
            cx="135"
            cy="40.5"
            rx="10.5"
            ry="7.5"
            fill={`url(#mintNodeGlow-${uid})`}
            stroke="#059669"
            strokeWidth="1.2"
          />

          {/* External Right 3D Pin 1 */}
          <path
            d="M137 64 L137 70 C137 72.5 147 72.5 147 70 L147 64 Z"
            fill="#047857"
          />
          <ellipse
            cx="142"
            cy="64"
            rx="5"
            ry="3.6"
            fill={`url(#mintNodeGlow-${uid})`}
            stroke="#059669"
            strokeWidth="1"
          />

          {/* External Far-Right 3D Pin 2 */}
          <path
            d="M148 49 L148 55 C148 57.2 156 57.2 156 55 L156 49 Z"
            fill="#047857"
          />
          <ellipse
            cx="152"
            cy="49"
            rx="4"
            ry="2.9"
            fill={`url(#mintNodeGlow-${uid})`}
            stroke="#059669"
            strokeWidth="1"
          />

          {/* Bottom Skullcap 3D Pin */}
          <path
            d="M82 105 L82 111 C82 113.2 90 113.2 90 111 L90 105 Z"
            fill="#047857"
          />
          <ellipse
            cx="86"
            cy="105"
            rx="4"
            ry="2.8"
            fill={`url(#mintNodeGlow-${uid})`}
            stroke="#059669"
            strokeWidth="1"
          />

          {/* Central Glowing 3D Cap Button Hub */}
          <ellipse
            cx="86"
            cy="38"
            rx="12"
            ry="8.5"
            fill="#10b981"
            opacity="0.45"
          />
          <ellipse
            cx="86"
            cy="35.5"
            rx="10.5"
            ry="7.4"
            fill={`url(#mintNodeGlow-${uid})`}
            stroke="#34d399"
            strokeWidth="1.5"
          />

          {/* ==============================================================
              4. 3D LEFT TASSEL ASSEMBLY WITH CIRCUIT NODES & GOLD RIM
             ============================================================== */}
          {/* Small Left Side Secondary Node */}
          <line
            x1="44"
            y1="66"
            x2="33"
            y2="82"
            stroke="#4ade80"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M29 82 L29 88 C29 90.2 37 90.2 37 88 L37 82 Z"
            fill="#022c22"
          />
          <ellipse
            cx="33"
            cy="82"
            rx="4"
            ry="2.8"
            fill="#047857"
            stroke="#34d399"
            strokeWidth="1"
          />

          {/* Main 3D Left Tassel Arm & Lower Glowing Medallion Node */}
          <path
            d="M42 68 L53 108 L61 106 L49 65 Z"
            fill={`url(#tasselEmerald-${uid})`}
            stroke={`url(#goldBevel-${uid})`}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />

          {/* Tassel Pivot 3D Cylinder (Gold Base + Emerald Top) */}
          <ellipse
            cx="45"
            cy="68.5"
            rx="10.5"
            ry="7.4"
            fill={`url(#goldBevel-${uid})`}
            stroke="#92400e"
            strokeWidth="1"
          />
          <ellipse
            cx="45"
            cy="64.5"
            rx="10.2"
            ry="7.2"
            fill="#10b981"
            stroke="#6ee7b7"
            strokeWidth="1.4"
          />

          {/* Tassel End 3D Glowing Mint-Emerald Medallion */}
          <ellipse
            cx="58"
            cy="115.5"
            rx="11"
            ry="8"
            fill="#047857"
            stroke="#6ee7b7"
            strokeWidth="1.2"
          />
          <ellipse
            cx="58"
            cy="111.5"
            rx="10.5"
            ry="7.4"
            fill={`url(#mintNodeGlow-${uid})`}
            stroke="#a7f3d0"
            strokeWidth="1.5"
          />
        </g>
      </svg>

      {/* 3D Extruded "Tutor Zone" Wordmark */}
      <span
        className={`inline-flex items-baseline gap-1.5 leading-none ${textSizeClasses}`}
      >
        {/* "Tutor" in deep forest emerald (#064e3b to #047857) with 3D silver-gold bottom extrusion & drop shadow */}
        <span
          className="bg-gradient-to-b from-[#047857] via-[#065f46] to-[#064e3b] dark:from-[#10b981] dark:via-[#059669] dark:to-[#047857] bg-clip-text text-transparent [text-shadow:0_1px_0_#d4af37,0_2px_0_#a7f3d0,0_3px_6px_rgba(6,78,59,0.28)]"
        >
          Tutor
        </span>
        {/* "Zone" in vibrant 3D metallic mint-emerald (#10b981 to #34d399) with matching 3D depth */}
        <span
          className="bg-gradient-to-b from-[#34d399] via-[#10b981] to-[#059669] bg-clip-text text-transparent [text-shadow:0_1px_0_#6ee7b7,0_2px_0_#047857,0_3px_6px_rgba(16,185,129,0.28)]"
        >
          Zone
        </span>
      </span>
    </span>
  );
};
