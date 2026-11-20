import React from 'react';
import { X, Play, RotateCcw, Sun, CloudRain, Volume2, Monitor, Eye, Smartphone } from 'lucide-react';
import { TimeOfDayPreset, WeatherPreset } from '../campus/campusData';
import { CameraPerspective, GraphicsQuality } from '../engine/CampusSimulation';

export interface SimSettings {
  graphics: GraphicsQuality;
  timeOfDay: TimeOfDayPreset;
  weather: WeatherPreset;
  perspective: CameraPerspective;
  touchControls: boolean;
  masterVolume: number;
  ambientVolume: number;
  sfxVolume: number;
  musicVolume: number;
  aeroMusicEnabled: boolean;
  muted: boolean;
  mouseSensitivity: number;
}

interface PauseSettingsModalProps {
  isFromTitle: boolean;
  settings: SimSettings;
  onUpdateSettings: (patch: Partial<SimSettings>) => void;
  onResume: () => void;
  onReturnToTitle: () => void;
}

const TIME_OPTIONS: Array<{ id: TimeOfDayPreset; label: string }> = [
  { id: 'morning', label: 'Morning (8:30 AM)' },
  { id: 'midday', label: 'Midday (12:30 PM)' },
  { id: 'golden', label: 'Golden Hour (4:45 PM)' },
  { id: 'dusk', label: 'Manila Dusk (6:15 PM)' },
  { id: 'night', label: 'Manila Night (9:00 PM)' },
];

const WEATHER_OPTIONS: Array<{ id: WeatherPreset; label: string }> = [
  { id: 'clear', label: 'Clear Manila Sun' },
  { id: 'overcast', label: 'Tropical Overcast' },
  { id: 'rain', label: 'Monsoon Rain' },
];

export const PauseSettingsModal: React.FC<PauseSettingsModalProps> = ({
  isFromTitle,
  settings,
  onUpdateSettings,
  onResume,
  onReturnToTitle,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(12, 9, 10, 0.78)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="w-full max-w-2xl rounded-xl bg-[#181314] border border-white/15 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 bg-[#23191a] border-b border-white/10">
          <div>
            <h2
              id="settings-modal-title"
              className="font-display text-2xl font-semibold text-[#f5f2eb]"
            >
              {isFromTitle ? 'Simulation Settings' : 'Paused — Campus Settings'}
            </h2>
            <p className="text-xs text-[#c8bba8] mt-0.5">
              PUP Sta. Mesa 3D · Environment, Graphics, Camera & Audio
            </p>
          </div>
          <button
            type="button"
            onClick={onResume}
            aria-label="Close settings"
            className="p-2 rounded-lg text-[#d6ccbc] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[66vh] overflow-y-auto campus-scroll">
          {/* Time of Day */}
          <section>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#f5f2eb] mb-2.5">
              <Sun className="w-4 h-4 text-[#e5a91a]" />
              <span>Manila Time of Day</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TIME_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onUpdateSettings({ timeOfDay: t.id })}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                    settings.timeOfDay === t.id
                      ? 'bg-[#7b1113] border-[#e5a91a] text-white'
                      : 'bg-[#211b1c] border-white/10 text-[#d6ccbc] hover:bg-[#2d2426]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </section>

          {/* Weather */}
          <section>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#f5f2eb] mb-2.5">
              <CloudRain className="w-4 h-4 text-[#e5a91a]" />
              <span>Tropical Weather</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {WEATHER_OPTIONS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => onUpdateSettings({ weather: w.id })}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                    settings.weather === w.id
                      ? 'bg-[#7b1113] border-[#e5a91a] text-white'
                      : 'bg-[#211b1c] border-white/10 text-[#d6ccbc] hover:bg-[#2d2426]'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </section>

          {/* Camera & Graphics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <section>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#f5f2eb] mb-2.5">
                <Eye className="w-4 h-4 text-[#e5a91a]" />
                <span>Camera Perspective</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['first-person', 'third-person'] as CameraPerspective[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onUpdateSettings({ perspective: p })}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                      settings.perspective === p
                        ? 'bg-[#7b1113] border-[#e5a91a] text-white'
                        : 'bg-[#211b1c] border-white/10 text-[#d6ccbc] hover:bg-[#2d2426]'
                    }`}
                  >
                    {p === 'first-person' ? 'First-Person' : 'Third-Person'}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#f5f2eb] mb-2.5">
                <Monitor className="w-4 h-4 text-[#e5a91a]" />
                <span>Graphics Quality</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['high', 'balanced'] as GraphicsQuality[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => onUpdateSettings({ graphics: g })}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                      settings.graphics === g
                        ? 'bg-[#7b1113] border-[#e5a91a] text-white'
                        : 'bg-[#211b1c] border-white/10 text-[#d6ccbc] hover:bg-[#2d2426]'
                    }`}
                  >
                    {g === 'high' ? 'High Shadows' : 'Balanced'}
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Input Mode: Desktop vs Tablet / Mobile Touch Controls */}
          <section>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#f5f2eb] mb-2.5">
              <Smartphone className="w-4 h-4 text-[#e5a91a]" />
              <span>Control Mode (Desktop / Tablet & Mobile)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ touchControls: false })}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                  !settings.touchControls
                    ? 'bg-[#7b1113] border-[#e5a91a] text-white'
                    : 'bg-[#211b1c] border-white/10 text-[#d6ccbc] hover:bg-[#2d2426]'
                }`}
              >
                Desktop (WASD + Mouse)
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ touchControls: true })}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                  settings.touchControls
                    ? 'bg-[#7b1113] border-[#e5a91a] text-white'
                    : 'bg-[#211b1c] border-white/10 text-[#d6ccbc] hover:bg-[#2d2426]'
                }`}
              >
                Tablet & Mobile (Touch Pads)
              </button>
            </div>
          </section>

          {/* Audio Controls */}
          <section className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#f5f2eb]">
                <Volume2 className="w-4 h-4 text-[#e5a91a]" />
                <span>Spatial Campus Audio</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ aeroMusicEnabled: !settings.aeroMusicEnabled })}
                  className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                    settings.aeroMusicEnabled
                      ? 'bg-[#0e5a6d] border-[#5ce1e6]/70 text-[#e6fcff]'
                      : 'bg-[#251e1f] border-white/10 text-[#cfc4b2] hover:bg-[#32282a]'
                  }`}
                >
                  Frutiger Aero: {settings.aeroMusicEnabled ? 'ON' : 'OFF'}
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ muted: !settings.muted })}
                  className="px-3 py-1 rounded-md text-xs font-medium bg-[#251e1f] border border-white/10 text-[#ece5d9] hover:bg-[#32282a] cursor-pointer"
                >
                  {settings.muted ? 'Unmute Audio' : 'Mute Audio'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <label className="block text-xs text-[#d6ccbc]">
                <div className="flex justify-between mb-1">
                  <span>Master</span>
                  <span className="font-mono-tabular">{Math.round(settings.masterVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.masterVolume}
                  onChange={(e) => onUpdateSettings({ masterVolume: Number(e.target.value) })}
                  className="w-full accent-[#e5a91a]"
                />
              </label>

              <label className="block text-xs text-[#d6ccbc]">
                <div className="flex justify-between mb-1">
                  <span>Frutiger Aero</span>
                  <span className="font-mono-tabular">{Math.round(settings.musicVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.musicVolume}
                  onChange={(e) => onUpdateSettings({ musicVolume: Number(e.target.value) })}
                  className="w-full accent-[#5ce1e6]"
                />
              </label>

              <label className="block text-xs text-[#d6ccbc]">
                <div className="flex justify-between mb-1">
                  <span>Ambience</span>
                  <span className="font-mono-tabular">{Math.round(settings.ambientVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.ambientVolume}
                  onChange={(e) => onUpdateSettings({ ambientVolume: Number(e.target.value) })}
                  className="w-full accent-[#e5a91a]"
                />
              </label>

              <label className="block text-xs text-[#d6ccbc]">
                <div className="flex justify-between mb-1">
                  <span>Footsteps & SFX</span>
                  <span className="font-mono-tabular">{Math.round(settings.sfxVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.sfxVolume}
                  onChange={(e) => onUpdateSettings({ sfxVolume: Number(e.target.value) })}
                  className="w-full accent-[#e5a91a]"
                />
              </label>
            </div>

            <label className="block text-xs text-[#d6ccbc] pt-1">
              <div className="flex justify-between mb-1">
                <span>Camera Mouse Sensitivity</span>
                <span className="font-mono-tabular">{(settings.mouseSensitivity * 1000).toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={0.001}
                max={0.005}
                step={0.0002}
                value={settings.mouseSensitivity}
                onChange={(e) => onUpdateSettings({ mouseSensitivity: Number(e.target.value) })}
                className="w-full accent-[#e5a91a]"
              />
            </label>
          </section>

          {/* Controls Quick Guide */}
          <section className="pt-3 border-t border-white/10 text-xs text-[#cfc4b2] grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4">
            <div><strong className="text-white">W A S D / ↑ ↓</strong> — Smooth Walk</div>
            <div><strong className="text-white">← → / Drag / Dbl-Click</strong> — Turn &amp; Look</div>
            <div><strong className="text-white">Scroll Wheel</strong> — 3rd-Person Zoom</div>
            <div><strong className="text-white">Shift</strong> — Sprint</div>
            <div><strong className="text-white">Space</strong> — Jump</div>
            <div><strong className="text-white">E</strong> — Talk / Doors / Plaques</div>
            <div><strong className="text-white">V</strong> — 1st / 3rd Person</div>
            <div><strong className="text-white">Tab / M</strong> — Assistant &amp; Map</div>
            <div><strong className="text-white">Esc</strong> — Pause / Settings</div>
          </section>
        </div>

        <div className="px-6 py-4 bg-[#141011] border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          {!isFromTitle ? (
            <button
              type="button"
              onClick={onReturnToTitle}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#251e1f] hover:bg-[#32282a] text-xs font-medium text-[#ece5d9] border border-white/10 cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Main Menu
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onResume}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#7b1113] hover:bg-[#961619] text-sm font-semibold text-white border border-[#e5a91a]/50 cursor-pointer whitespace-nowrap"
          >
            <Play className="w-4 h-4 text-[#e5a91a]" />
            {isFromTitle ? 'Done' : 'Resume Exploration'}
          </button>
        </div>
      </div>
    </div>
  );
};
