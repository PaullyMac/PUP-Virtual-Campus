import type { TimeOfDayPreset } from '../campus/campusData';

export interface AeroChordVoicing {
  name: string;
  bassMidi: number;
  padMidis: number[];
  rhodesMidis: number[];
  sparkleMidis: number[];
}

/**
 * Classic late-2000s Frutiger Aero harmonic progression (Wii Shop / Vista / XMB aesthetic):
 * Lush sunlit C-major / A-minor ninth & sixth voicings with Lydian shimmer.
 */
export const FRUTIGER_AERO_PROGRESSION: AeroChordVoicing[] = [
  {
    name: 'Fmaj9',
    bassMidi: 41, // F2
    padMidis: [53, 57, 60, 64], // F3, A3, C4, E4
    rhodesMidis: [60, 64, 67, 69], // C4, E4, G4, A4
    sparkleMidis: [72, 76, 79, 81, 84], // C5, E5, G5, A5, C6
  },
  {
    name: 'G6/9',
    bassMidi: 43, // G2
    padMidis: [55, 59, 62, 64], // G3, B3, D4, E4
    rhodesMidis: [59, 62, 64, 69], // B3, D4, E4, A4
    sparkleMidis: [74, 76, 79, 81, 86], // D5, E5, G5, A5, D6
  },
  {
    name: 'Em9',
    bassMidi: 40, // E2
    padMidis: [52, 55, 59, 62], // E3, G3, B3, D4
    rhodesMidis: [59, 62, 66, 67], // B3, D4, F#4, G4
    sparkleMidis: [71, 74, 76, 79, 83], // B4, D5, E5, G5, B5
  },
  {
    name: 'Am9',
    bassMidi: 45, // A2
    padMidis: [52, 55, 59, 60], // E3, G3, B3, C4
    rhodesMidis: [57, 60, 64, 67], // A3, C4, E4, G4
    sparkleMidis: [72, 76, 79, 83, 84], // C5, E5, G5, B5, C6
  },
  {
    name: 'Dm9',
    bassMidi: 38, // D2
    padMidis: [50, 53, 57, 60], // D3, F3, A3, C4
    rhodesMidis: [57, 60, 64, 65], // A3, C4, E4, F4
    sparkleMidis: [72, 74, 76, 79, 81], // C5, D5, E5, G5, A5
  },
  {
    name: 'G13sus4',
    bassMidi: 43, // G2
    padMidis: [53, 57, 60, 62], // F3, A3, C4, D4
    rhodesMidis: [57, 60, 62, 64], // A3, C4, D4, E4
    sparkleMidis: [72, 74, 76, 79, 86], // C5, D5, E5, G5, D6
  },
  {
    name: 'Cmaj9',
    bassMidi: 36, // C2
    padMidis: [48, 55, 59, 62], // C3, G3, B3, D4
    rhodesMidis: [60, 64, 67, 71], // C4, E4, G4, B4
    sparkleMidis: [72, 76, 79, 83, 86], // C5, E5, G5, B5, D6
  },
  {
    name: 'C6/9',
    bassMidi: 47, // B2 (passing bass back to Fmaj9 / Cmaj9)
    padMidis: [52, 55, 57, 62], // E3, G3, A3, D4
    rhodesMidis: [60, 62, 64, 67], // C4, D4, E4, G4
    sparkleMidis: [74, 76, 79, 84, 88], // D5, E5, G5, C6, E6
  },
];

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Deterministic Frutiger Aero crystalline water-droplet arpeggio pattern per 16th-note step (0..15).
 * Returns the MIDI note to trigger on this step, or null for rhythmic breathing space.
 */
export function selectAeroSparkleMidi(
  chordIndex: number,
  stepInBar: number,
): number | null {
  const chord =
    FRUTIGER_AERO_PROGRESSION[
      ((chordIndex % FRUTIGER_AERO_PROGRESSION.length) + FRUTIGER_AERO_PROGRESSION.length) %
        FRUTIGER_AERO_PROGRESSION.length
    ];
  // Syncopated glassy bell pattern (steps 0, 3, 6, 10, 12, 14)
  const patternMap: Record<number, number> = {
    0: 0,
    3: 2,
    6: 1,
    10: 3,
    12: 4,
    14: 2,
  };
  const slot = patternMap[stepInBar % 16];
  if (slot === undefined) return null;
  const shifted = (slot + (chordIndex % 2)) % chord.sparkleMidis.length;
  return chord.sparkleMidis[shifted];
}

export interface AeroAtmosphereProfile {
  filterCutoffHz: number;
  sparkleGain: number;
  padGain: number;
  delayFeedback: number;
}

/**
 * Adapts the Frutiger Aero synth tone smoothly for time of day and indoor acoustics.
 */
export function getAeroAtmosphereProfile(
  timeOfDay: TimeOfDayPreset,
  isIndoors: boolean,
): AeroAtmosphereProfile {
  let filterCutoffHz = 3600;
  let sparkleGain = 1.0;
  let padGain = 1.0;
  let delayFeedback = 0.34;

  if (timeOfDay === 'midday') {
    filterCutoffHz = 4200;
    sparkleGain = 1.1;
  } else if (timeOfDay === 'golden') {
    filterCutoffHz = 2900;
    sparkleGain = 0.92;
    padGain = 1.08;
    delayFeedback = 0.38;
  } else if (timeOfDay === 'dusk' || timeOfDay === 'night') {
    filterCutoffHz = 2150;
    sparkleGain = 0.78;
    padGain = 1.12;
    delayFeedback = 0.42;
  }

  if (isIndoors) {
    filterCutoffHz = Math.round(filterCutoffHz * 0.68);
    sparkleGain *= 0.75;
    delayFeedback = Math.min(0.46, delayFeedback + 0.05);
  }

  return { filterCutoffHz, sparkleGain, padGain, delayFeedback };
}
