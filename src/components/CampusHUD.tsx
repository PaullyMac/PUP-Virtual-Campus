import React, { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CloudRain,
  Compass,
  Eye,
  Map as MapIcon,
  Monitor,
  Moon,
  Navigation,
  Pause,
  Smartphone,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  CAMPUS_LANDMARKS,
  CampusLandmark,
  TimeOfDayPreset,
  WeatherPreset,
} from '../campus/campusData';
import { estimateRealWorldDistanceMeters } from '../campus/campusLogic';
import { CameraPerspective, SimulationHudSnapshot } from '../engine/CampusSimulation';

interface CampusHUDProps {
  hud: SimulationHudSnapshot;
  perspective: CameraPerspective;
  timeOfDay: TimeOfDayPreset;
  weather: WeatherPreset;
  muted: boolean;
  aeroMusicEnabled: boolean;
  touchControls: boolean;
  arrivalBanner: CampusLandmark | null;
  onDismissBanner: () => void;
  onTogglePerspective: () => void;
  onToggleTouchControls: () => void;
  onCycleTimeOfDay: () => void;
  onCycleWeather: () => void;
  onToggleMute: () => void;
  onToggleAeroMusic: () => void;
  onOpenAssistant: (tab: 'assistant' | 'map' | 'reference') => void;
  onOpenPause: () => void;
  onTriggerInteract: () => void;
  onClearWaypoint: () => void;
}

const TIME_LABELS: Record<TimeOfDayPreset, string> = {
  morning: '8:30 AM',
  midday: '12:30 PM',
  golden: '4:45 PM',
  dusk: '6:15 PM',
  night: '9:00 PM',
};

const WEATHER_LABELS: Record<WeatherPreset, string> = {
  clear: 'Clear',
  overcast: 'Overcast',
  rain: 'Rain',
};

export const CampusHUD: React.FC<CampusHUDProps> = ({
  hud,
  perspective,
  timeOfDay,
  weather,
  muted,
  aeroMusicEnabled,
  touchControls,
  arrivalBanner,
  onDismissBanner,
  onTogglePerspective,
  onToggleTouchControls,
  onCycleTimeOfDay,
  onCycleWeather,
  onToggleMute,
  onToggleAeroMusic,
  onOpenAssistant,
  onOpenPause,
  onTriggerInteract,
  onClearWaypoint,
}) => {
  const [dockOpen, setDockOpen] = useState(() =>
    typeof window !== 'undefined' ? !(touchControls && window.innerWidth < 680) : true,
  );

  useEffect(() => {
    if (touchControls && typeof window !== 'undefined' && window.innerWidth < 680) {
      setDockOpen(false);
    }
  }, [touchControls]);

  // Convert world (x in [-84..224], z in [-76..122]) to SVG minimap coords (196 x 136)
  const mapX = (x: number) => ((x + 84) / 308) * 188 + 4;
  const mapY = (z: number) => ((z + 76) / 198) * 128 + 4;

  const activeWaypoint = hud.activeWaypointId
    ? CAMPUS_LANDMARKS.find((l) => l.id === hud.activeWaypointId) ?? null
    : null;
  const waypointDistM = activeWaypoint
    ? estimateRealWorldDistanceMeters(
        { x: hud.playerX, z: hud.playerZ },
        activeWaypoint.approachPoint,
      )
    : null;
  const distFromGateM =
    hud.playerX > 95
      ? estimateRealWorldDistanceMeters({ x: 81.2, z: -4 }, { x: hud.playerX, z: hud.playerZ })
      : null;

  // Player heading degrees for SVG arrow (yaw = 0 faces -Z / North / Up on map)
  const headingDeg = (-hud.playerYaw * 180) / Math.PI;

  return (
    <div className="fixed inset-0 z-20 pointer-events-none">
      {/* TOP-LEFT: Minimal Location, Time & Google Maps Distance Plaque */}
      <div className="fixed top-4 left-4 pointer-events-auto max-w-xs">
        <div className="rounded-lg bg-[#161112]/90 border border-white/15 px-3.5 py-2.5 shadow-lg">
          <div className="font-display text-sm font-semibold text-[#f5f2eb] leading-snug">
            {hud.currentLandmark.shortName}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#cfc4b2] font-mono-tabular">
            <span>{TIME_LABELS[timeOfDay]}</span>
            <span aria-hidden="true">·</span>
            <span>{WEATHER_LABELS[weather]}</span>
            <span aria-hidden="true">·</span>
            <span>{distFromGateM !== null ? `${distFromGateM}m E of Gate` : hud.isIndoors ? 'Indoors' : 'Outdoors'}</span>
          </div>
          {activeWaypoint && (
            <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between gap-2 text-[11px] text-[#f2ca68]">
              <span className="inline-flex items-center gap-1 truncate font-mono-tabular">
                <Navigation className="w-3 h-3 shrink-0" />
                {activeWaypoint.shortName} (~{waypointDistM}m)
              </span>
              <button
                type="button"
                onClick={onClearWaypoint}
                className="text-[#d6ccbc] hover:text-white underline cursor-pointer shrink-0"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TOP-CENTER: Contextual Landmark Discovery Banner */}
      {arrivalBanner && (
        <div className="fixed top-16 sm:top-4 left-1/2 -translate-x-1/2 pointer-events-auto max-w-md w-[92vw] sm:w-auto">
          <button
            type="button"
            onClick={onDismissBanner}
            aria-label={`Dismiss ${arrivalBanner.name} banner`}
            className="w-full text-left rounded-lg bg-[#171213]/92 border border-[#e5a91a]/50 px-4 py-3 shadow-xl cursor-pointer"
          >
            <div className="font-display text-sm font-semibold text-[#f5f2eb]">
              {arrivalBanner.name}
            </div>
            <p className="mt-1 text-xs text-[#d6ccbc] leading-relaxed line-clamp-2">
              {arrivalBanner.summary}
            </p>
          </button>
        </div>
      )}

      {/* TOP-RIGHT: Compact Interactive Minimap + Utility Buttons */}
      <div className="fixed top-4 right-4 flex flex-col items-end gap-2 pointer-events-auto">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleTouchControls();
            }}
            aria-pressed={touchControls}
            aria-label={touchControls ? 'Switch to Desktop Controls' : 'Enable Tablet & Mobile Touch Controls'}
            title={touchControls ? 'Touch Controls ON (Click for Desktop)' : 'Enable Tablet / Mobile Touch Controls'}
            className={`h-9 px-2.5 rounded-lg border flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
              touchControls
                ? 'bg-[#7b1113] border-[#e5a91a] text-white'
                : 'bg-[#161112]/90 hover:bg-[#261e1f] border-white/15 text-[#ece5d9]'
            }`}
          >
            {touchControls ? (
              <Smartphone className="w-3.5 h-3.5 text-[#f2ca68]" />
            ) : (
              <Monitor className="w-3.5 h-3.5 text-[#e5a91a]" />
            )}
            <span>{touchControls ? 'Touch On' : 'Touch'}</span>
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleAeroMusic();
            }}
            aria-pressed={aeroMusicEnabled}
            aria-label={aeroMusicEnabled ? 'Turn off Frutiger Aero music' : 'Turn on Frutiger Aero music'}
            title={aeroMusicEnabled ? 'Frutiger Aero Sound ON' : 'Frutiger Aero Sound OFF'}
            className={`h-9 px-2.5 rounded-lg border flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
              aeroMusicEnabled && !muted
                ? 'bg-[#0e5a6d]/92 border-[#5ce1e6]/75 text-[#e6fcff]'
                : 'bg-[#161112]/90 hover:bg-[#261e1f] border-white/15 text-[#cfc4b2]'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${aeroMusicEnabled && !muted ? 'text-[#7ef2f7]' : 'text-[#9e9488]'}`} />
            <span>Aero</span>
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            title="Mute / Unmute Audio"
            className="w-9 h-9 rounded-lg bg-[#161112]/90 hover:bg-[#261e1f] border border-white/15 flex items-center justify-center text-[#ece5d9] cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4 text-[#e5a91a]" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onOpenPause();
            }}
            aria-label="Pause and open settings"
            title="Pause / Settings (Esc)"
            className="w-9 h-9 rounded-lg bg-[#161112]/90 hover:bg-[#261e1f] border border-white/15 flex items-center justify-center text-[#ece5d9] cursor-pointer"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive Campus Minimap (opens full Campus Map on click) */}
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.currentTarget.blur();
            onOpenAssistant('map');
          }}
          aria-label="Open full PUP Sta. Mesa Campus Map"
          className="hidden sm:block rounded-lg bg-[#151011]/92 border border-white/15 p-1.5 shadow-lg hover:border-[#e5a91a]/60 transition-colors cursor-pointer"
        >
          <svg width="196" height="136" viewBox="0 0 196 136" className="block rounded bg-[#1d251d]">
            {/* Pasig River strip on West */}
            <rect x="0" y="0" width="11" height="136" fill="#20586d" />

            {/* PUP Lagoon water pocket */}
            <ellipse cx={mapX(-19)} cy={mapY(-17)} rx="6" ry="4.5" fill="#2a7b78" opacity="0.9" />

            {/* Southeastern Track & Field Oval */}
            <g transform={`translate(${mapX(48)}, ${mapY(44)}) rotate(-25)`}>
              <ellipse cx="0" cy="0" rx="13" ry="8.5" fill="#2d4c2d" stroke="#a64b35" strokeWidth="2.2" />
            </g>

            {/* Iconic Star/Y-Wing Main Building footprint */}
            <g stroke="#d8cfc0" strokeWidth="3.2" strokeLinecap="round" opacity="0.88">
              <line x1={mapX(-28)} y1={mapY(24)} x2={mapX(-28)} y2={mapY(50)} />
              <line x1={mapX(-28)} y1={mapY(24)} x2={mapX(-44)} y2={mapY(6)} />
              <line x1={mapX(-28)} y1={mapY(24)} x2={mapX(-48)} y2={mapY(26)} />
              <line x1={mapX(-47)} y1={mapY(26)} x2={mapX(-47)} y2={mapY(44)} />
              <line x1={mapX(-28)} y1={mapY(24)} x2={mapX(-8)} y2={mapY(12)} stroke="#d97706" strokeDasharray="3 2" />
            </g>
            <circle cx={mapX(-28)} cy={mapY(24)} r="3.8" fill="#9b1c1f" stroke="#f2eadc" strokeWidth="0.9" />

            {/* Schematic building blocks for PUP A. Mabini campus & Teresa Street */}
            <g fill="#6d2a2a" opacity="0.65">
              {/* Northern strip */}
              <rect x={mapX(-66)} y={mapY(-63)} width={mapX(-53) - mapX(-66)} height={mapY(-54) - mapY(-63)} rx="1" />
              <rect x={mapX(-51)} y={mapY(-72)} width={mapX(-36) - mapX(-51)} height={mapY(-65) - mapY(-72)} rx="1" />
              <rect x={mapX(-36)} y={mapY(-52)} width={mapX(-12) - mapX(-36)} height={mapY(-36) - mapY(-52)} rx="1" fill="#d9d4c7" />
              <rect x={mapX(-17)} y={mapY(-71)} width={mapX(-6) - mapX(-17)} height={mapY(-62) - mapY(-71)} rx="1" />
              <rect x={mapX(-6)} y={mapY(-56)} width={mapX(2.5) - mapX(-6)} height={mapY(-37) - mapY(-56)} rx="1" />
              <rect x={mapX(5)} y={mapY(-57)} width={mapX(27) - mapX(5)} height={mapY(-39) - mapY(-57)} rx="1" fill="#2a86b5" />
              <rect x={mapX(30)} y={mapY(-58)} width={mapX(58) - mapX(30)} height={mapY(-38) - mapY(-58)} rx="2" />
              <rect x={mapX(61)} y={mapY(-57)} width={mapX(75) - mapX(61)} height={mapY(-39) - mapY(-57)} rx="1" />
              {/* Mid-north courts, Tahanan ng Alumni & Visitor's Lounge */}
              <rect x={mapX(13.5)} y={mapY(-29)} width={mapX(21.5) - mapX(13.5)} height={mapY(-20) - mapY(-29)} rx="1" fill="#c98e3a" />
              <rect x={mapX(24)} y={mapY(-31)} width={mapX(54) - mapX(24)} height={mapY(-17) - mapY(-31)} rx="1" fill="#2f6653" />
              <rect x={mapX(62.5)} y={mapY(-21)} width={mapX(71.5) - mapX(62.5)} height={mapY(-14) - mapY(-21)} rx="1" />
              {/* Western strip */}
              <rect x={mapX(-66)} y={mapY(-50)} width={mapX(-53) - mapX(-66)} height={mapY(-25) - mapY(-50)} rx="1" />
              <rect x={mapX(-61)} y={mapY(-23)} width={mapX(-46) - mapX(-61)} height={mapY(-1) - mapY(-23)} rx="1" fill="#c99326" />
              <rect x={mapX(-62.5)} y={mapY(5.5)} width={mapX(-53.5) - mapX(-62.5)} height={mapY(18.5) - mapY(5.5)} rx="1" fill="#b5523b" />
              {/* Southern strip */}
              <rect x={mapX(-50.5)} y={mapY(62.5)} width={mapX(-32.5) - mapX(-50.5)} height={mapY(72.5) - mapY(62.5)} rx="1" />
              <rect x={mapX(-29)} y={mapY(62.5)} width={mapX(-4) - mapX(-29)} height={mapY(72.5) - mapY(62.5)} rx="1" />
              <rect x={mapX(-0.5)} y={mapY(62.5)} width={mapX(14.5) - mapX(-0.5)} height={mapY(72.5) - mapY(62.5)} rx="1" />
              <rect x={mapX(18.5)} y={mapY(62.5)} width={mapX(33.5) - mapX(18.5)} height={mapY(72.5) - mapY(62.5)} rx="1" fill="#8f2426" />
              {/* Teresa Street North & South shophouse strips (x=118..200) */}
              <rect x={mapX(118)} y={mapY(-18)} width={mapX(200) - mapX(118)} height={mapY(-10.5) - mapY(-18)} rx="1" fill="#c98e3a" />
              <rect x={mapX(136)} y={mapY(2.6)} width={mapX(200) - mapX(136)} height={mapY(10) - mapY(2.6)} rx="1" fill="#b87742" />
              <rect x={mapX(217)} y={mapY(-26)} width={mapX(224) - mapX(217)} height={mapY(18) - mapY(-26)} rx="1" fill="#9b4b38" />
              {/* South Anonas Condos: Maui Oasis, Futura Centro & El Pueblo */}
              <rect x={mapX(46)} y={mapY(81)} width={mapX(70) - mapX(46)} height={mapY(93) - mapY(81)} rx="1" fill="#c7a57c" />
              <rect x={mapX(93)} y={mapY(92)} width={mapX(113) - mapX(93)} height={mapY(112) - mapY(92)} rx="1" fill="#9fb0c2" />
              <rect x={mapX(20)} y={mapY(108)} width={mapX(44) - mapX(20)} height={mapY(120) - mapY(108)} rx="1" fill="#c47353" />
            </g>

            {/* Roads & Rail Corridors: Anonas St (89.5 -> SW to El Pueblo), PNR/NLEX (105.5), Teresa St -> Old Sta. Mesa St (208) */}
            <path
              d={`M ${mapX(89.5)} ${mapY(-70)} L ${mapX(89.5)} ${mapY(84)} Q ${mapX(89.5)} ${mapY(95)} ${mapX(76)} ${mapY(99)} L ${mapX(42)} ${mapY(106)}`}
              fill="none"
              stroke="#6d6a64"
              strokeWidth="2.8"
            />
            <line x1={mapX(102)} y1={mapY(-70)} x2={mapX(102)} y2={mapY(88)} stroke="#d95d24" strokeWidth="1.4" strokeDasharray="3 2" />
            <line x1={mapX(109.5)} y1={mapY(-70)} x2={mapX(109.5)} y2={mapY(88)} stroke="#a6a49d" strokeWidth="2.2" opacity="0.85" />
            <line x1={mapX(208)} y1={mapY(-70)} x2={mapX(208)} y2={mapY(74)} stroke="#7c7870" strokeWidth="3.2" />
            <line x1={mapX(208)} y1={mapY(-4)} x2={mapX(14)} y2={mapY(-4)} stroke="#8b7f70" strokeWidth="2.8" />
            <circle cx={mapX(14)} cy={mapY(-4)} r="4.2" fill="#3a5e36" stroke="#c2b8a8" strokeWidth="1" />
            <line x1={mapX(14)} y1={mapY(-4)} x2={mapX(-2)} y2={mapY(42)} stroke="#7b6f60" strokeWidth="1.8" />
            <line x1={mapX(14)} y1={mapY(-4)} x2={mapX(-24)} y2={mapY(-34)} stroke="#7b6f60" strokeWidth="1.8" />
            <line x1={mapX(-65)} y1={mapY(-58)} x2={mapX(-65)} y2={mapY(58)} stroke="#94887a" strokeWidth="2" />

            {/* Landmarks */}
            {CAMPUS_LANDMARKS.map((lm) => (
              <circle
                key={lm.id}
                cx={mapX(lm.position.x)}
                cy={mapY(lm.position.z)}
                r={lm.id === 'main-building' ? 4 : 2.7}
                fill={lm.mapColor}
                stroke="#120e0f"
                strokeWidth="0.9"
              />
            ))}

            {/* Active Waypoint Line & Beacon */}
            {activeWaypoint && (
              <>
                <line
                  x1={mapX(hud.playerX)}
                  y1={mapY(hud.playerZ)}
                  x2={mapX(activeWaypoint.approachPoint.x)}
                  y2={mapY(activeWaypoint.approachPoint.z)}
                  stroke="#e5a91a"
                  strokeWidth="1.5"
                  strokeDasharray="3 2"
                />
                <circle
                  cx={mapX(activeWaypoint.approachPoint.x)}
                  cy={mapY(activeWaypoint.approachPoint.z)}
                  r="4.8"
                  fill="none"
                  stroke="#e5a91a"
                  strokeWidth="1.6"
                />
              </>
            )}

            {/* Named NPC Dots */}
            {hud.npcs.map((n) => (
              <circle
                key={n.id}
                cx={mapX(n.x)}
                cy={mapY(n.z)}
                r="1.7"
                fill="#ffffff"
                opacity="0.85"
              />
            ))}

            {/* Player Arrow */}
            <g
              transform={`translate(${mapX(hud.playerX)}, ${mapY(hud.playerZ)}) rotate(${headingDeg})`}
            >
              <polygon points="0,-5.5 3.8,4 0,2 -3.8,4" fill="#e5a91a" stroke="#120e0f" strokeWidth="0.9" />
            </g>

            {/* Compass N indicator */}
            <text x="184" y="13" textAnchor="middle" fill="#e8dfcf" fontSize="9" fontWeight="700">
              N
            </text>
          </svg>
          <div className="mt-1 flex items-center justify-between px-1 text-[10px] text-[#c7baa6]">
            <span>PUP · Teresa St. Map</span>
            <span>[M]</span>
          </div>
        </button>
      </div>

      {/* CENTER: Subtle Crosshair & Contextual [E] Interaction Prompt */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="w-1.5 h-1.5 rounded-full bg-white/80 shadow-[0_0_2px_rgba(0,0,0,0.9)]" />
      </div>

      {hud.prompt && (
        <div className="fixed left-1/2 top-[56%] -translate-x-1/2 pointer-events-auto">
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onTriggerInteract();
            }}
            className="flex items-center gap-3 rounded-lg bg-[#161112]/94 hover:bg-[#241b1d] border border-[#e5a91a]/65 px-4 py-2.5 shadow-xl cursor-pointer transition-colors"
          >
            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#7b1113] border border-[#e5a91a]/60 text-xs font-bold text-[#f5f2eb] font-mono-tabular shrink-0">
              E
            </span>
            <div className="text-left">
              <div className="text-xs font-semibold text-[#f5f2eb] whitespace-nowrap">
                {hud.prompt.label}
              </div>
              {hud.prompt.sublabel && (
                <div className="text-[11px] text-[#c7baa6] whitespace-nowrap">
                  {hud.prompt.sublabel}
                </div>
              )}
            </div>
          </button>
        </div>
      )}

      {/* BOTTOM-CENTER: Collapsible Unified Control Dock (Cleanly centered between touch pads on mobile/tablet) */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto ${
          touchControls ? 'bottom-3 max-w-[44vw] sm:max-w-[54vw]' : 'bottom-4 max-w-[95vw]'
        }`}
      >
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.currentTarget.blur();
            setDockOpen((o) => !o);
          }}
          aria-expanded={dockOpen}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-t-md bg-[#161112]/90 border border-b-0 border-white/15 text-[11px] text-[#d6ccbc] hover:text-white cursor-pointer"
        >
          {dockOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          {dockOpen ? 'Hide Controls' : 'Show Controls'}
        </button>

        {dockOpen && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#161112]/92 border border-white/15 shadow-2xl">
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onTogglePerspective();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#231b1c] hover:bg-[#312628] text-xs font-medium text-[#f5f2eb] border border-white/10 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Eye className="w-3.5 h-3.5 text-[#e5a91a]" />
              {perspective === 'first-person' ? '1st Person [V]' : '3rd Person [V]'}
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenAssistant('assistant');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#7b1113] hover:bg-[#961619] text-xs font-semibold text-white border border-[#e5a91a]/50 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Compass className="w-3.5 h-3.5 text-[#e5a91a]" />
              Campus Assistant [Tab]
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenAssistant('map');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#231b1c] hover:bg-[#312628] text-xs font-medium text-[#f5f2eb] border border-white/10 cursor-pointer whitespace-nowrap shrink-0"
            >
              <MapIcon className="w-3.5 h-3.5 text-[#e5a91a]" />
              Map & Travel [M]
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onCycleTimeOfDay();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#231b1c] hover:bg-[#312628] text-xs font-medium text-[#f5f2eb] border border-white/10 cursor-pointer whitespace-nowrap shrink-0"
            >
              {timeOfDay === 'night' ? (
                <Moon className="w-3.5 h-3.5 text-[#f2ca68]" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-[#e5a91a]" />
              )}
              {TIME_LABELS[timeOfDay]}
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onCycleWeather();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#231b1c] hover:bg-[#312628] text-xs font-medium text-[#f5f2eb] border border-white/10 cursor-pointer whitespace-nowrap shrink-0"
            >
              <CloudRain className="w-3.5 h-3.5 text-[#e5a91a]" />
              {WEATHER_LABELS[weather]}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
