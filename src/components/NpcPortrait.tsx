import React from 'react';
import { NpcProfile } from '../campus/campusData';

interface NpcPortraitProps {
  npc: NpcProfile;
  size?: number;
}

/**
 * Geometric inline SVG character portrait styled directly from the NPC's 3D appearance.
 * Strictly vector-authored (zero AI-generated images).
 */
export const NpcPortrait: React.FC<NpcPortraitProps> = ({ npc, size = 56 }) => {
  const { skinTone, hairColor, hairStyle, topColor, accentColor, hasGlasses, hasLanyard } =
    npc.appearance;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      className="shrink-0 rounded-lg border border-white/15 bg-[#1e1819]"
    >
      {/* Subtle architectural background tone */}
      <rect width="64" height="64" fill="#231c1d" />
      <circle cx="32" cy="30" r="24" fill="#2f2426" />

      {/* Long hair back layer */}
      {hairStyle === 'long' && (
        <path d="M18 26 C18 14 46 14 46 26 L48 48 L16 48 Z" fill={hairColor} />
      )}
      {hairStyle === 'bun' && <circle cx="32" cy="12" r="7" fill={hairColor} />}

      {/* Shoulders & Shirt/Uniform */}
      <path d="M10 64 C10 49 20 44 32 44 C44 44 54 49 54 64 Z" fill={topColor} />

      {/* Collar & PUP ID Lanyard */}
      <path d="M24 44 L32 52 L40 44" fill="none" stroke={accentColor} strokeWidth="3" />
      {hasLanyard && (
        <>
          <path d="M26 45 L32 58 L38 45" fill="none" stroke={accentColor} strokeWidth="2.2" />
          <rect x="29" y="56" width="6" height="7" rx="1" fill="#f5f2eb" />
        </>
      )}

      {/* Neck & Face */}
      <rect x="27" y="36" width="10" height="10" rx="4" fill={skinTone} />
      <ellipse cx="32" cy="27" rx="11.5" ry="13" fill={skinTone} />

      {/* Hair top or Security/Maintenance Cap */}
      {hairStyle === 'cap' ? (
        <>
          <path d="M19 23 C19 13 45 13 45 23 Z" fill={npc.appearance.bottomColor} />
          <rect x="17" y="21" width="30" height="3.5" rx="1.5" fill={npc.appearance.bottomColor} />
          <rect x="29" y="16" width="6" height="3" rx="0.8" fill={accentColor} />
        </>
      ) : (
        <path
          d="M20 25 C20 13 44 13 44 25 C41 19 23 19 20 25 Z"
          fill={hairColor}
        />
      )}

      {/* Eyes & Expression */}
      <circle cx="27.5" cy="27.5" r="1.5" fill="#181515" />
      <circle cx="36.5" cy="27.5" r="1.5" fill="#181515" />
      <path
        d="M28 33.5 Q32 36.2 36 33.5"
        fill="none"
        stroke="#633e2b"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Optional Eyeglasses */}
      {hasGlasses && (
        <g stroke="#1b1b1e" strokeWidth="1.4" fill="rgba(255,255,255,0.14)">
          <rect x="23.5" y="24.5" width="7.5" height="5.5" rx="1.5" />
          <rect x="33" y="24.5" width="7.5" height="5.5" rx="1.5" />
          <line x1="31" y1="27" x2="33" y2="27" />
        </g>
      )}
    </svg>
  );
};
