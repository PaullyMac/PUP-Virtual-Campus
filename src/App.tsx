import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CAMPUS_LANDMARKS,
  CampusLandmark,
  InspectableItem,
  NpcProfile,
  PLAYER_SPAWN,
  TimeOfDayPreset,
  WeatherPreset,
} from './campus/campusData';
import { CampusAssistantPanel } from './components/CampusAssistantPanel';
import { CampusHUD } from './components/CampusHUD';
import { InspectModal } from './components/InspectModal';
import { NpcDialogueModal } from './components/NpcDialogueModal';
import { PauseSettingsModal, SimSettings } from './components/PauseSettingsModal';
import { TitleScreen } from './components/TitleScreen';
import { TouchControlsOverlay } from './components/TouchControlsOverlay';
import { CampusSimulation, SimulationHudSnapshot } from './engine/CampusSimulation';

type AppViewState = 'title' | 'playing' | 'paused';

const TIME_ORDER: TimeOfDayPreset[] = ['morning', 'midday', 'golden', 'dusk', 'night'];
const WEATHER_ORDER: WeatherPreset[] = ['clear', 'overcast', 'rain'];

const INITIAL_HUD: SimulationHudSnapshot = {
  playerX: PLAYER_SPAWN.x,
  playerZ: PLAYER_SPAWN.z,
  playerYaw: PLAYER_SPAWN.yaw,
  currentLandmark: CAMPUS_LANDMARKS[0],
  insideLandmarkZone: true,
  isIndoors: false,
  isSitting: false,
  prompt: null,
  npcs: [],
  activeWaypointId: null,
  showColliders: false,
  colliderCount: 0,
  blockedByColliderIds: [],
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<CampusSimulation | null>(null);
  const bannerTimerRef = useRef<number | null>(null);

  const autostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [viewState, setViewState] = useState<AppViewState>(autostart ? 'playing' : 'title');
  const [hud, setHud] = useState<SimulationHudSnapshot>(INITIAL_HUD);
  const [arrivalBanner, setArrivalBanner] = useState<CampusLandmark | null>(null);

  const [activeNpc, setActiveNpc] = useState<{ npc: NpcProfile; activity: string } | null>(null);
  const [inspectItem, setInspectItem] = useState<InspectableItem | null>(null);
  const [assistantOpen, setAssistantOpen] = useState<'assistant' | 'map' | 'reference' | null>(null);
  const [settingsFromTitle, setSettingsFromTitle] = useState(false);

  const [settings, setSettings] = useState<SimSettings>(() => {
    const isTouchDevice =
      typeof window !== 'undefined' &&
      (window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints > 0);
    return {
      graphics: 'high',
      timeOfDay: 'morning',
      weather: 'clear',
      perspective: 'third-person',
      touchControls: Boolean(isTouchDevice),
      masterVolume: 0.7,
      ambientVolume: 0.65,
      sfxVolume: 0.75,
      musicVolume: 0.52,
      aeroMusicEnabled: true,
      muted: false,
      mouseSensitivity: 0.0024,
    };
  });

  // Keep latest callbacks accessible to stable single-mount WebGL instance
  const onTalkRef = useRef((npc: NpcProfile, activity: string) => {
    setActiveNpc({ npc, activity });
  });
  const onInspectRef = useRef((item: InspectableItem) => {
    setInspectItem(item);
  });
  const onLandmarkEnteredRef = useRef((landmark: CampusLandmark) => {
    setArrivalBanner(landmark);
    if (bannerTimerRef.current) window.clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = window.setTimeout(() => setArrivalBanner(null), 5500);
  });

  // Mount Three.js CampusSimulation exactly once
  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!mountEl) return;

    const sim = new CampusSimulation(mountEl, {
      onHudUpdate: (snapshot) => setHud(snapshot),
      onTalkToNpc: (npc, activity) => onTalkRef.current(npc, activity),
      onInspectItem: (item) => onInspectRef.current(item),
      onLandmarkEntered: (lm) => onLandmarkEnteredRef.current(lm),
    });
    simRef.current = sim;

    if (autostart) {
      sim.setMode('playing');
    }

    return () => {
      if (bannerTimerRef.current) window.clearTimeout(bannerTimerRef.current);
      sim.dispose();
      simRef.current = null;
    };
  }, [autostart]);

  // Synchronize document.body.dataset.state & simulation mode
  const hasModalOverlay = Boolean(activeNpc || inspectItem || assistantOpen);
  useEffect(() => {
    document.body.dataset.state = viewState;
    const sim = simRef.current;
    if (!sim) return;

    if (viewState === 'title') {
      sim.setMode('title');
    } else if (viewState === 'paused') {
      sim.setMode('paused');
    } else if (hasModalOverlay) {
      sim.setMode('ui-focus');
    } else {
      sim.setMode('playing');
    }
    sim.setTalkingNpc(activeNpc?.npc.id ?? null);
  }, [viewState, hasModalOverlay, activeNpc]);

  const startSimulation = useCallback(() => {
    setSettingsFromTitle(false);
    setAssistantOpen(null);
    setViewState('playing');
    document.body.dataset.state = 'playing';
    (document.activeElement as HTMLElement | null)?.blur?.();
  }, []);

  const updateSettings = useCallback((patch: Partial<SimSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      const sim = simRef.current;
      if (sim) {
        if (patch.timeOfDay !== undefined) sim.setTimeOfDay(next.timeOfDay);
        if (patch.weather !== undefined) sim.setWeather(next.weather);
        if (patch.perspective !== undefined) sim.setPerspective(next.perspective);
        if (patch.graphics !== undefined) sim.setGraphicsQuality(next.graphics);
        if (patch.mouseSensitivity !== undefined) sim.setMouseSensitivity(next.mouseSensitivity);
        if (
          patch.masterVolume !== undefined ||
          patch.ambientVolume !== undefined ||
          patch.sfxVolume !== undefined ||
          patch.musicVolume !== undefined ||
          patch.muted !== undefined
        ) {
          sim.setAudioVolumes(
            next.masterVolume,
            next.ambientVolume,
            next.sfxVolume,
            next.muted,
            next.musicVolume,
          );
        }
        if (patch.aeroMusicEnabled !== undefined) {
          sim.setAeroMusicEnabled(next.aeroMusicEnabled);
        }
      }
      return next;
    });
  }, []);

  const togglePerspective = useCallback(() => {
    const next = simRef.current?.togglePerspective() ?? (settings.perspective === 'first-person' ? 'third-person' : 'first-person');
    setSettings((prev) => ({ ...prev, perspective: next }));
  }, [settings.perspective]);

  const toggleShowColliders = useCallback(() => {
    simRef.current?.playAeroUiClick();
    simRef.current?.toggleShowColliders();
  }, []);

  const cycleTimeOfDay = useCallback(() => {
    const idx = TIME_ORDER.indexOf(settings.timeOfDay);
    const next = TIME_ORDER[(idx + 1) % TIME_ORDER.length];
    updateSettings({ timeOfDay: next });
  }, [settings.timeOfDay, updateSettings]);

  const cycleWeather = useCallback(() => {
    const idx = WEATHER_ORDER.indexOf(settings.weather);
    const next = WEATHER_ORDER[(idx + 1) % WEATHER_ORDER.length];
    updateSettings({ weather: next });
  }, [settings.weather, updateSettings]);

  // Global keyboard shortcuts (Enter/Space on Title, Esc Pause/Close, V Camera, Tab Assistant, M Map)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA';

      if (viewState === 'title' && !assistantOpen && !settingsFromTitle) {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          startSimulation();
        }
        return;
      }

      if (e.code === 'Escape') {
        e.preventDefault();
        if (activeNpc) {
          setActiveNpc(null);
        } else if (inspectItem) {
          setInspectItem(null);
        } else if (assistantOpen) {
          setAssistantOpen(null);
        } else if (settingsFromTitle) {
          setSettingsFromTitle(false);
        } else if (viewState === 'paused') {
          setViewState('playing');
        } else if (viewState === 'playing') {
          setViewState('paused');
        }
        return;
      }

      if (inInput) return;

      if (viewState === 'playing' && !hasModalOverlay) {
        if (e.code === 'KeyV') {
          e.preventDefault();
          togglePerspective();
        } else if (e.code === 'Tab') {
          e.preventDefault();
          setAssistantOpen('assistant');
        } else if (e.code === 'KeyM') {
          e.preventDefault();
          setAssistantOpen('map');
        } else if (e.code === 'KeyH') {
          e.preventDefault();
          toggleShowColliders();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    viewState,
    activeNpc,
    inspectItem,
    assistantOpen,
    settingsFromTitle,
    hasModalOverlay,
    startSimulation,
    togglePerspective,
    toggleShowColliders,
  ]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#120e0f]">
      {/* Dedicated isolated WebGL canvas container (never unmounted by HUD state) */}
      <div
        ref={canvasMountRef}
        data-testid="campus-webgl-viewport"
        className="absolute inset-0 w-full h-full"
      />

      {/* Main Title Screen over Live 3D Campus Camera Tour */}
      {viewState === 'title' && !assistantOpen && !settingsFromTitle && (
        <TitleScreen
          onStart={startSimulation}
          onOpenReference={() => setAssistantOpen('reference')}
          onOpenSettings={() => setSettingsFromTitle(true)}
        />
      )}

      {/* Active Exploration HUD & Tablet/Mobile Touch Controls */}
      {viewState === 'playing' && !hasModalOverlay && (
        <>
          {settings.touchControls && (
            <TouchControlsOverlay
              prompt={hud.prompt}
              perspective={settings.perspective}
              isSitting={hud.isSitting}
              onJoystickChange={(x, y) => simRef.current?.setVirtualJoystick(x, y)}
              onLookDelta={(dx, dy) => simRef.current?.applyTouchLookDelta(dx, dy)}
              onSprintChange={(active) => simRef.current?.setVirtualSprint(active)}
              onJump={() => simRef.current?.triggerJump()}
              onInteract={() => simRef.current?.triggerInteract()}
              onTogglePerspective={togglePerspective}
            />
          )}
          <CampusHUD
            hud={hud}
            perspective={settings.perspective}
            timeOfDay={settings.timeOfDay}
            weather={settings.weather}
            muted={settings.muted}
            aeroMusicEnabled={settings.aeroMusicEnabled}
            touchControls={settings.touchControls}
            arrivalBanner={arrivalBanner}
            onDismissBanner={() => setArrivalBanner(null)}
            onTogglePerspective={togglePerspective}
            onToggleTouchControls={() =>
              updateSettings({ touchControls: !settings.touchControls })
            }
            onCycleTimeOfDay={cycleTimeOfDay}
            onCycleWeather={cycleWeather}
            onToggleMute={() => updateSettings({ muted: !settings.muted })}
            onToggleAeroMusic={() =>
              updateSettings({ aeroMusicEnabled: !settings.aeroMusicEnabled })
            }
            onOpenAssistant={(tab) => {
              simRef.current?.playAeroUiClick();
              setAssistantOpen(tab);
            }}
            onOpenPause={() => {
              simRef.current?.playAeroUiClick();
              setViewState('paused');
            }}
            onTriggerInteract={() => simRef.current?.triggerInteract()}
            onClearWaypoint={() => simRef.current?.setWaypoint(null)}
            onToggleShowColliders={toggleShowColliders}
          />
        </>
      )}

      {/* AI-Powered NPC Dialogue Modal */}
      {activeNpc && (
        <NpcDialogueModal
          npc={activeNpc.npc}
          currentActivity={activeNpc.activity}
          playerPosition={{ x: hud.playerX, z: hud.playerZ }}
          timeOfDay={settings.timeOfDay}
          weather={settings.weather}
          onSetWaypoint={(id) => simRef.current?.setWaypoint(id)}
          onClose={() => setActiveNpc(null)}
        />
      )}

      {/* Campus Signs, Plaques & Library Terminal Inspection Modal */}
      {inspectItem && (
        <InspectModal item={inspectItem} onClose={() => setInspectItem(null)} />
      )}

      {/* PUP AI Campus Assistant, Map & Verified Architectural Reference Panel */}
      {assistantOpen && (
        <CampusAssistantPanel
          initialTab={assistantOpen}
          playerPosition={{ x: hud.playerX, z: hud.playerZ }}
          currentLandmark={hud.currentLandmark}
          activeWaypointId={hud.activeWaypointId}
          timeOfDay={settings.timeOfDay}
          weather={settings.weather}
          canTeleport={viewState === 'playing'}
          onSetWaypoint={(id) => simRef.current?.setWaypoint(id)}
          onTeleportToLandmark={(id) => simRef.current?.teleportToLandmark(id)}
          onClose={() => setAssistantOpen(null)}
        />
      )}

      {/* Pause & Settings Modal */}
      {(viewState === 'paused' || settingsFromTitle) && (
        <PauseSettingsModal
          isFromTitle={settingsFromTitle}
          settings={settings}
          onUpdateSettings={updateSettings}
          onResume={() => {
            if (settingsFromTitle) setSettingsFromTitle(false);
            else setViewState('playing');
          }}
          onReturnToTitle={() => {
            setActiveNpc(null);
            setInspectItem(null);
            setAssistantOpen(null);
            setViewState('title');
          }}
        />
      )}
    </div>
  );
}
