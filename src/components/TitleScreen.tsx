import React from 'react';
import { BookOpen, Compass, SlidersHorizontal } from 'lucide-react';

interface TitleScreenProps {
  onStart: () => void;
  onOpenReference: () => void;
  onOpenSettings: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  onOpenReference,
  onOpenSettings,
}) => {
  return (
    <div
      className="fixed inset-0 z-30 flex flex-col justify-between pointer-events-none"
      style={{
        background:
          'linear-gradient(95deg, rgba(18, 12, 13, 0.92) 0%, rgba(18, 12, 13, 0.72) 38%, rgba(18, 12, 13, 0.14) 70%, rgba(18, 12, 13, 0.08) 100%)',
      }}
    >
      {/* Top quiet institutional mark */}
      <div className="px-8 md:px-14 pt-8 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs tracking-wide text-[#e8dfcf]/80">
          <span>Polytechnic University of the Philippines</span>
          <span aria-hidden="true">·</span>
          <span>A. Mabini Main Campus</span>
          <span aria-hidden="true">·</span>
          <span>Sta. Mesa, Manila</span>
        </div>
      </div>

      {/* Main Asymmetric Left-Third Editorial Lockup over Calm Scrim */}
      <div className="px-8 md:px-14 max-w-2xl pointer-events-auto">
        {/* Bespoke inline SVG PUP Pylon & Golden Star Emblem */}
        <svg
          width="68"
          height="68"
          viewBox="0 0 72 72"
          aria-hidden="true"
          className="mb-6"
        >
          <rect
            x="2"
            y="2"
            width="68"
            height="68"
            rx="12"
            fill="#580b0d"
            stroke="#e5a91a"
            strokeWidth="2"
          />
          {/* Iconic 3-pillar PUP Pylon silhouette */}
          <polygon points="18,56 22,22 25,22 26,56" fill="#f5f2eb" />
          <polygon points="32,56 34,18 38,18 40,56" fill="#f5f2eb" />
          <polygon points="46,56 47,22 50,22 54,56" fill="#f5f2eb" />
          <rect x="19" y="25" width="34" height="4.5" fill="#e5a91a" />
          {/* 5-point PUP Golden Star */}
          <polygon
            points="36,7 38.2,12.2 43.8,12.6 39.5,16.2 40.8,21.6 36,18.7 31.2,21.6 32.5,16.2 28.2,12.6 33.8,12.2"
            fill="#e5a91a"
          />
          <rect x="14" y="56" width="44" height="4" rx="1" fill="#e5a91a" />
        </svg>

        <h1
          className="font-display text-4xl md:text-6xl font-bold tracking-tight text-[#f5f2eb] leading-[1.08]"
          style={{ textWrap: 'balance' }}
        >
          PUP Sta. Mesa
        </h1>
        <p className="mt-4 text-base md:text-lg text-[#dfd6c7] leading-relaxed max-w-md">
          Walk the A. Mabini Main Campus in interactive 3D—from the Pylon, Catwalk, and
          Obelisk to the Main Building Dome, active North Wing reconstruction, Lagoon,
          and NALLRC Library.
        </p>

        {/* Primary & Secondary Actions (single clean horizontal row) */}
        <div className="mt-8 flex flex-wrap sm:flex-nowrap items-center gap-3">
          <button
            type="button"
            data-start="true"
            onClick={onStart}
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-[#7b1113] hover:bg-[#961619] active:bg-[#610d0f] text-[#f5f2eb] font-semibold text-sm tracking-wide border border-[#e5a91a]/60 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e5a91a]"
          >
            <Compass className="w-4 h-4 text-[#e5a91a]" />
            Start Simulation
          </button>

          <button
            type="button"
            onClick={onOpenReference}
            className="inline-flex items-center gap-2 px-4 py-3.5 rounded-lg bg-[#1d1718] hover:bg-[#2a2122] text-[#f5f2eb] font-medium text-sm border border-white/15 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e5a91a]"
          >
            <BookOpen className="w-4 h-4 text-[#e5a91a]" />
            Campus Reference
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-2 px-4 py-3.5 rounded-lg bg-[#1d1718] hover:bg-[#2a2122] text-[#f5f2eb] font-medium text-sm border border-white/15 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e5a91a]"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#e5a91a]" />
            Settings
          </button>
        </div>
      </div>

      {/* Single flat borderless bottom control hint line with high-contrast scrim */}
      <div
        className="px-8 md:px-14 pt-8 pb-6 flex flex-wrap items-center justify-between gap-4 text-xs text-[#ece3d5]"
        style={{
          background:
            'linear-gradient(180deg, rgba(18,12,13,0) 0%, rgba(18,12,13,0.78) 100%)',
        }}
      >
        <span>
          WASD Move · Drag or Double-Click Look · Shift Sprint · Space Jump · E Interact · V Camera · Tab Assistant · Esc Pause
        </span>
        <span className="font-mono-tabular text-[#f0d8a8]">14.5979° N, 121.0108° E</span>
      </div>
    </div>
  );
};
