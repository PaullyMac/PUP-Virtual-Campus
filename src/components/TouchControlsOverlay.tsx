import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, Eye, Hand, Zap } from 'lucide-react';
import { CameraPerspective, InteractionPrompt } from '../engine/CampusSimulation';

interface TouchControlsOverlayProps {
  prompt: InteractionPrompt | null;
  perspective: CameraPerspective;
  isSitting: boolean;
  onJoystickChange: (x: number, y: number) => void;
  onLookDelta: (dx: number, dy: number) => void;
  onSprintChange: (active: boolean) => void;
  onJump: () => void;
  onInteract: () => void;
  onTogglePerspective: () => void;
}

const JOYSTICK_RADIUS = 46;

export const TouchControlsOverlay: React.FC<TouchControlsOverlayProps> = ({
  prompt,
  perspective,
  isSitting,
  onJoystickChange,
  onLookDelta,
  onSprintChange,
  onJump,
  onInteract,
  onTogglePerspective,
}) => {
  const padRef = useRef<HTMLDivElement>(null);
  const joyPointerId = useRef<number | null>(null);
  const joyOrigin = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lookPointerId = useRef<number | null>(null);
  const lookLast = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [joyActive, setJoyActive] = useState(false);
  const [sprintLocked, setSprintLocked] = useState(false);

  // Reset joystick & sprint cleanly if unmounted (e.g. switching back to Desktop mode or opening a modal)
  useEffect(() => {
    return () => {
      onJoystickChange(0, 0);
      onSprintChange(false);
    };
  }, [onJoystickChange, onSprintChange]);

  const updateJoystickFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const dx = clientX - joyOrigin.current.x;
      const dy = clientY - joyOrigin.current.y;
      const dist = Math.hypot(dx, dy);
      const clamped = Math.min(dist, JOYSTICK_RADIUS);
      const angle = Math.atan2(dy, dx);
      const ox = Math.cos(angle) * clamped;
      const oy = Math.sin(angle) * clamped;
      setKnobOffset({ x: ox, y: oy });

      // Normalize: +x = right strafe, +y = forward (-screenY)
      const normX = ox / JOYSTICK_RADIUS;
      const normY = -oy / JOYSTICK_RADIUS;
      const deadzone = 0.12;
      if (Math.hypot(normX, normY) < deadzone) {
        onJoystickChange(0, 0);
      } else {
        onJoystickChange(normX, normY);
      }
    },
    [onJoystickChange],
  );

  const handleJoyPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = padRef.current?.getBoundingClientRect();
    if (!rect) return;
    joyPointerId.current = e.pointerId;
    joyOrigin.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    setJoyActive(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateJoystickFromClient(e.clientX, e.clientY);
  };

  const handleJoyPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (joyPointerId.current !== e.pointerId) return;
    e.stopPropagation();
    updateJoystickFromClient(e.clientX, e.clientY);
  };

  const handleJoyPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (joyPointerId.current !== e.pointerId) return;
    e.stopPropagation();
    joyPointerId.current = null;
    setJoyActive(false);
    setKnobOffset({ x: 0, y: 0 });
    onJoystickChange(0, 0);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleLookPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (lookPointerId.current !== null) return;
    lookPointerId.current = e.pointerId;
    lookLast.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleLookPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (lookPointerId.current !== e.pointerId) return;
    const dx = e.clientX - lookLast.current.x;
    const dy = e.clientY - lookLast.current.y;
    lookLast.current = { x: e.clientX, y: e.clientY };
    onLookDelta(dx, dy);
  };

  const handleLookPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (lookPointerId.current !== e.pointerId) return;
    lookPointerId.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const toggleSprint = () => {
    setSprintLocked((prev) => {
      const next = !prev;
      onSprintChange(next);
      return next;
    });
  };

  const interactShortLabel = isSitting
    ? 'Stand'
    : prompt?.kind === 'npc'
      ? 'Talk'
      : prompt?.kind === 'door'
        ? 'Door'
        : prompt?.kind === 'inspect'
          ? 'Read'
          : prompt?.kind === 'bench'
            ? 'Sit'
            : 'Use';

  return (
    <div
      data-testid="touch-controls-overlay"
      className="fixed inset-0 z-15 pointer-events-none select-none"
    >
      {/* Right-half touch-drag camera look zone (below HUD buttons) */}
      <div
        aria-label="Touch and drag to look around"
        onPointerDown={handleLookPointerDown}
        onPointerMove={handleLookPointerMove}
        onPointerUp={handleLookPointerUp}
        onPointerCancel={handleLookPointerUp}
        style={{ touchAction: 'none' }}
        className="fixed top-20 right-0 bottom-0 left-[42%] pointer-events-auto"
      />

      {/* BOTTOM-LEFT: Virtual Analog Movement Joystick */}
      <div className="fixed bottom-5 left-4 sm:bottom-8 sm:left-7 pointer-events-auto flex flex-col items-center gap-1.5">
        <div
          ref={padRef}
          role="slider"
          aria-label="Virtual movement joystick"
          aria-valuetext={joyActive ? 'Moving' : 'Centered'}
          tabIndex={-1}
          onPointerDown={handleJoyPointerDown}
          onPointerMove={handleJoyPointerMove}
          onPointerUp={handleJoyPointerUp}
          onPointerCancel={handleJoyPointerUp}
          style={{ touchAction: 'none' }}
          className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 transition-colors flex items-center justify-center shadow-2xl ${
            joyActive
              ? 'bg-[#1a1314]/80 border-[#e5a91a]/80'
              : 'bg-[#161112]/68 border-white/25'
          }`}
        >
          {/* Subtle N/S/E/W directional pips */}
          <span className="absolute top-2.5 text-[9px] font-bold text-white/45 pointer-events-none">▲</span>
          <span className="absolute bottom-2.5 text-[9px] font-bold text-white/45 pointer-events-none">▼</span>
          <span className="absolute left-2.5 text-[9px] font-bold text-white/45 pointer-events-none">◀</span>
          <span className="absolute right-2.5 text-[9px] font-bold text-white/45 pointer-events-none">▶</span>

          {/* Inner thumbstick knob */}
          <div
            style={{
              transform: `translate3d(${knobOffset.x}px, ${knobOffset.y}px, 0)`,
            }}
            className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full border-2 shadow-lg pointer-events-none transition-colors ${
              joyActive
                ? 'bg-[#8c1518] border-[#f2ca68]'
                : 'bg-[#7b1113]/90 border-[#e5a91a]/70'
            }`}
          />
        </div>
        <span className="text-[10px] font-medium tracking-wide uppercase text-[#e6dccb]/80 bg-[#161112]/75 px-2 py-0.5 rounded border border-white/10">
          Move
        </span>
      </div>

      {/* BOTTOM-RIGHT: Ergonomic Tablet / Mobile Action Pad */}
      <div className="fixed bottom-5 right-4 sm:bottom-8 sm:right-7 pointer-events-auto flex flex-col items-end gap-2 sm:gap-2.5">
        {/* Top Row: Sprint Toggle + Camera Toggle */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            tabIndex={-1}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              e.currentTarget.blur();
              toggleSprint();
            }}
            aria-pressed={sprintLocked}
            aria-label={sprintLocked ? 'Disable sprint' : 'Enable sprint'}
            className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full border flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold shadow-xl cursor-pointer transition-colors ${
              sprintLocked
                ? 'bg-[#e5a91a] border-[#fff3d1] text-[#1a1112]'
                : 'bg-[#161112]/82 border-white/25 text-[#f5f2eb] active:bg-[#2b2223]'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Run</span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              e.currentTarget.blur();
              onTogglePerspective();
            }}
            aria-label="Switch camera view"
            className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#161112]/82 active:bg-[#2b2223] border border-white/25 text-[#f5f2eb] flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold shadow-xl cursor-pointer"
          >
            <Eye className="w-4 h-4 text-[#e5a91a]" />
            <span>{perspective === 'first-person' ? '1st' : '3rd'}</span>
          </button>
        </div>

        {/* Bottom Row: Contextual Interact + Jump */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            tabIndex={-1}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              e.currentTarget.blur();
              onInteract();
            }}
            aria-label={prompt ? prompt.label : 'Interact'}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold shadow-2xl cursor-pointer transition-all ${
              prompt || isSitting
                ? 'bg-[#7b1113] border-[#f2ca68] text-white scale-105'
                : 'bg-[#161112]/72 border-white/20 text-[#b8ab97]'
            }`}
          >
            <Hand className="w-5 h-5" />
            <span>{interactShortLabel}</span>
          </button>

          <button
            type="button"
            tabIndex={-1}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              e.currentTarget.blur();
              onJump();
            }}
            aria-label="Jump"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#161112]/84 active:bg-[#7b1113] border-2 border-white/25 text-[#f5f2eb] flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold shadow-2xl cursor-pointer"
          >
            <ArrowUp className="w-5 h-5 text-[#e5a91a]" />
            <span>Jump</span>
          </button>
        </div>
      </div>
    </div>
  );
};
