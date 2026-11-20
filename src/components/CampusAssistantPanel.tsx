import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Compass, MapPin, Navigation, Send, X } from 'lucide-react';
import {
  CAMPUS_LANDMARKS,
  CampusLandmark,
  TimeOfDayPreset,
  WeatherPreset,
} from '../campus/campusData';
import { haversineDistanceMeters, PUP_OBELISK_GPS } from '../campus/geoProjection';

interface AssistantMessage {
  role: 'user' | 'assistant';
  text: string;
  waypointLandmarkId?: string | null;
  waypointLandmarkName?: string | null;
}

interface CampusAssistantPanelProps {
  initialTab: 'assistant' | 'reference' | 'map';
  playerPosition: { x: number; z: number };
  currentLandmark: CampusLandmark;
  activeWaypointId: string | null;
  timeOfDay: TimeOfDayPreset;
  weather: WeatherPreset;
  canTeleport: boolean;
  onSetWaypoint: (landmarkId: string | null) => void;
  onTeleportToLandmark: (landmarkId: string) => void;
  onClose: () => void;
}

const SAMPLE_ASSISTANT_PROMPTS = [
  'How do I get from the Main Building to the NALLRC?',
  'What is the status of the North Wing construction?',
  'Which buildings can I enter and explore inside?',
  'Tell me about the PUP Lagoon and Mabini Shrine.',
];

export const CampusAssistantPanel: React.FC<CampusAssistantPanelProps> = ({
  initialTab,
  playerPosition,
  currentLandmark,
  activeWaypointId,
  timeOfDay,
  weather,
  canTeleport,
  onSetWaypoint,
  onTeleportToLandmark,
  onClose,
}) => {
  const [tab, setTab] = useState<'assistant' | 'reference' | 'map'>(initialTab);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: 'assistant',
      text: `Welcome to the PUP Sta. Mesa Campus Assistant. You are currently near ${currentLandmark.name}. Ask me for walking directions between any landmarks, building details, or verified campus geography.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const askAssistant = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || loading) return;

    const historyForApi = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: historyForApi,
          playerPosition,
          timeOfDay,
          weather,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Campus Assistant request failed.');
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: String(data.reply ?? '').trim(),
          waypointLandmarkId: data.waypointLandmarkId ?? null,
          waypointLandmarkName: data.waypointLandmarkName ?? null,
        },
      ]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to reach Campus Assistant.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(12, 9, 10, 0.76)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="campus-assistant-title"
    >
      <div className="w-full max-w-4xl h-[82vh] max-h-[700px] rounded-xl bg-[#171213] border border-white/15 shadow-2xl flex flex-col overflow-hidden">
        {/* Header & Segmented Tabs */}
        <div className="px-6 py-4 bg-[#221819] border-b border-white/10 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2
              id="campus-assistant-title"
              className="font-display text-lg md:text-xl font-semibold text-[#f5f2eb] truncate"
            >
              PUP Sta. Mesa Guide & AI Assistant
            </h2>
            <p className="text-xs text-[#c8bba8] truncate">
              A. Mabini Campus &amp; Sta. Mesa · {CAMPUS_LANDMARKS.length} Landmarks · Google Maps GPS
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#141011] border border-white/10">
              <button
                type="button"
                onClick={() => setTab('assistant')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  tab === 'assistant'
                    ? 'bg-[#7b1113] text-white'
                    : 'text-[#cfc4b2] hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                AI Assistant
              </button>
              <button
                type="button"
                onClick={() => setTab('map')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  tab === 'map'
                    ? 'bg-[#7b1113] text-white'
                    : 'text-[#cfc4b2] hover:text-white'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                Campus Map
              </button>
              <button
                type="button"
                onClick={() => setTab('reference')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  tab === 'reference'
                    ? 'bg-[#7b1113] text-white'
                    : 'text-[#cfc4b2] hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Reference Log
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Campus Assistant"
              className="p-2 rounded-lg text-[#d6ccbc] hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TAB 1: AI Campus Assistant */}
        {tab === 'assistant' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 campus-scroll">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[84%] rounded-lg px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                      msg.role === 'user'
                        ? 'bg-[#7b1113] text-white'
                        : 'bg-[#231c1d] text-[#f0eae0] border border-white/10'
                    }`}
                  >
                    {msg.text}
                  </div>
                  {msg.role === 'assistant' && msg.waypointLandmarkId && msg.waypointLandmarkName && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onSetWaypoint(msg.waypointLandmarkId!);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#2b2217] hover:bg-[#3d301f] border border-[#e5a91a]/50 text-xs font-medium text-[#f2ca68] cursor-pointer"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        Set Waypoint to {msg.waypointLandmarkName}
                      </button>
                      {canTeleport && (
                        <button
                          type="button"
                          onClick={() => {
                            onTeleportToLandmark(msg.waypointLandmarkId!);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#231d1e] hover:bg-[#31282a] border border-white/15 text-xs font-medium text-[#ece5d9] cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          Go Directly There
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="text-xs text-[#cfc4b2]">Consulting PUP Sta. Mesa navigation graph...</div>
              )}
              {error && (
                <div
                  role="alert"
                  className="rounded-lg bg-[#3b1518] border border-[#e05258]/50 px-4 py-3 text-xs text-[#ffd7d9]"
                >
                  {error}
                </div>
              )}
            </div>

            {/* Suggested Queries */}
            <div className="px-6 pb-3 flex flex-wrap gap-2">
              {SAMPLE_ASSISTANT_PROMPTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => askAssistant(q)}
                  className="px-3 py-1.5 rounded-md bg-[#231c1d] hover:bg-[#312628] border border-white/10 text-xs text-[#dfd6c7] transition-colors cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                askAssistant(input);
              }}
              className="px-6 py-4 bg-[#130f10] border-t border-white/10 flex items-center gap-2.5"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask for directions, e.g., 'How do I get from the Main Building to the NALLRC?'"
                aria-label="Ask the PUP Campus Assistant"
                disabled={loading}
                className="flex-1 bg-[#211b1c] border border-white/15 rounded-lg px-4 py-2.5 text-sm text-[#f5f2eb] placeholder-[#9c907f] focus:outline-none focus:border-[#e5a91a]"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#7b1113] hover:bg-[#961619] disabled:opacity-45 text-sm font-semibold text-white cursor-pointer whitespace-nowrap shrink-0"
              >
                <Send className="w-4 h-4" />
                Ask
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: Interactive Campus Directory & Fast Travel */}
        {tab === 'map' && (
          <div className="flex-1 overflow-y-auto p-6 campus-scroll">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <p className="text-xs text-[#cfc4b2]">
                Select any PUP Sta. Mesa landmark to place an in-world navigation beacon or travel directly to its entrance.
              </p>
              {activeWaypointId && (
                <button
                  type="button"
                  onClick={() => onSetWaypoint(null)}
                  className="px-3 py-1.5 rounded-md bg-[#2a2021] border border-white/15 text-xs text-[#f5f2eb] hover:bg-[#382a2c] cursor-pointer"
                >
                  Clear Active Waypoint
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {CAMPUS_LANDMARKS.map((lm) => {
                const isPinned = activeWaypointId === lm.id;
                const isHere = currentLandmark.id === lm.id;
                const gmapsDistM = Math.round(haversineDistanceMeters(currentLandmark.gps, lm.gps));
                return (
                  <div
                    key={lm.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      isPinned
                        ? 'bg-[#261d17] border-[#e5a91a]/60'
                        : 'bg-[#1f1819] border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-base font-semibold text-[#f5f2eb]">
                          {lm.shortName}
                        </h3>
                        <p className="text-xs text-[#b8ab97] mt-0.5 font-mono-tabular">
                          {lm.gps.lat.toFixed(5)}°N, {lm.gps.lng.toFixed(5)}°E ·{' '}
                          {isHere ? 'Current Location' : `~${gmapsDistM}m (Google Maps)`} ·{' '}
                          {lm.enterable ? 'Enterable Interior' : 'Outdoor'}
                        </p>
                      </div>
                      <span
                        className="w-3 h-3 rounded-sm shrink-0 mt-1"
                        style={{ backgroundColor: lm.mapColor }}
                        aria-hidden="true"
                      />
                    </div>
                    <p className="mt-2 text-xs text-[#dcd3c5] leading-relaxed">{lm.summary}</p>
                    <div className="mt-3.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onSetWaypoint(lm.id);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#2b2217] hover:bg-[#3b2f1f] border border-[#e5a91a]/45 text-xs font-medium text-[#f2ca68] cursor-pointer whitespace-nowrap"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        {isPinned ? 'Waypoint Active' : 'Set Waypoint'}
                      </button>
                      {canTeleport && (
                        <button
                          type="button"
                          onClick={() => {
                            onTeleportToLandmark(lm.id);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#7b1113] hover:bg-[#961619] text-xs font-medium text-white cursor-pointer whitespace-nowrap"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          Travel Here
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: Verified Campus Reference & Architectural Accuracy Library */}
        {tab === 'reference' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5 campus-scroll">
            <div className="pb-4 border-b border-white/10">
              <h3 className="font-display text-lg font-semibold text-[#f5f2eb]">
                Architectural Research & Realism Disclosure
              </h3>
              <p className="mt-1.5 text-sm text-[#d6ccbc] leading-relaxed">
                Every structure in this 3D simulation is modeled programmatically in Three.js from
                verified geographic maps, PUP institutional documentation, and recent 2022–2026 campus
                redevelopment news (including the ongoing DPWH 9-storey North Wing construction site).
                No AI-generated images are used anywhere in the project; approximations are explicitly
                documented below.
              </p>
            </div>

            <div className="space-y-4">
              {CAMPUS_LANDMARKS.map((lm) => (
                <article
                  key={lm.id}
                  className="p-4 rounded-lg bg-[#1f1819] border border-white/10 space-y-2.5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="font-display text-base font-semibold text-[#f5f2eb]">
                      {lm.name}
                    </h4>
                    <span className="text-xs text-[#e5a91a] font-mono-tabular">
                      {lm.gps.lat.toFixed(5)}°N, {lm.gps.lng.toFixed(5)}°E ·{' '}
                      {Math.round(haversineDistanceMeters(PUP_OBELISK_GPS, lm.gps))}m from Obelisk ·{' '}
                      {lm.enterable ? 'Walkable Interior + Exterior' : 'Exterior Reconstruction'}
                    </span>
                  </div>
                  <p className="text-xs text-[#dfd6c7] leading-relaxed">{lm.architecturalNotes}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs">
                    <div>
                      <div className="font-semibold text-[#d7e8d4] mb-1">Verified Features</div>
                      <ul className="space-y-1 text-[#cfc4b2] list-disc list-inside">
                        {lm.verifiedFeatures.map((f, idx) => (
                          <li key={idx}>{f}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="font-semibold text-[#f0d8a8] mb-1">Clearly Noted Approximations</div>
                      <ul className="space-y-1 text-[#b8ab97] list-disc list-inside">
                        {lm.approximatedFeatures.map((f, idx) => (
                          <li key={idx}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
