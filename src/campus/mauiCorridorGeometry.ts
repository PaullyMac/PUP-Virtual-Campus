export interface WorldPoint2D {
  x: number;
  z: number;
}

export interface CorridorBuildingFootprint {
  id: string;
  label: string;
  x: number;
  z: number;
  width: number;
  depth: number;
}

export interface BoulevardItemPlacement {
  x: number;
  z: number;
  rotY: number;
  along: number;
  lateral: number;
}

export const MAUI_CORRIDOR_CONFIG = {
  anonasWestCurbX: 85.65,
  anonasEastCurbX: 95.2,
  anonasStartZ: 52.0,
  anonasCurveZ: 88.5,
  boulevardOrigin: { x: 65.5, z: 100.5 } as WorldPoint2D,
  boulevardAngleRad: 0.26, // Matches Three.js rotation.y = +0.26 along Maui Oasis -> El Pueblo road
  boulevardLength: 62.0,
  boulevardWidth: 16.5,
};

/**
 * Transforms local Maui Oasis / El Pueblo boulevard coordinates (along, lateral)
 * into Three.js world (x, z) coordinates matching rotation.y = +boulevardAngleRad.
 * +along runs ENE toward Anonas St; -along runs WSW toward El Pueblo Manila.
 * +lateral runs SSE toward the commercial/residential side; -lateral runs NNW toward Maui Oasis.
 */
export function computeBoulevardWorldPoint(
  along: number,
  lateral: number,
  origin: WorldPoint2D = MAUI_CORRIDOR_CONFIG.boulevardOrigin,
  angleRad: number = MAUI_CORRIDOR_CONFIG.boulevardAngleRad,
): WorldPoint2D {
  const c = Math.cos(angleRad);
  const s = Math.sin(angleRad);
  return {
    x: origin.x + along * c + lateral * s,
    z: origin.z - along * s + lateral * c,
  };
}

/**
 * Returns non-overlapping East Anonas Street civic & commercial footprints
 * anchored from 2026 Google Maps satellite imagery of 630 Anonas St (Barangay 630, Zone 63).
 */
export function computeBarangay630Footprints(): CorridorBuildingFootprint[] {
  return [
    {
      id: 'anonas-alfamart',
      label: 'Alfamart Anonas',
      x: 100.4,
      z: 62.0,
      width: 6.2,
      depth: 7.4,
    },
    {
      id: 'barangay-630-hall',
      label: 'Barangay 630 Zone 63 Hall',
      x: 100.8,
      z: 71.8,
      width: 7.4,
      depth: 10.0,
    },
    {
      id: 'barangay-630-court',
      label: 'Barangay 630 Multi-Purpose Covered Court',
      x: 102.2,
      z: 83.2,
      width: 9.6,
      depth: 10.8,
    },
  ];
}

/**
 * Computes evenly spaced Meralco utility poles & cobra-head streetlamps along both
 * South Anonas Street and the curving Maui Oasis / El Pueblo boulevard.
 */
export function computeMauiCorridorPoles(): BoulevardItemPlacement[] {
  const poles: BoulevardItemPlacement[] = [];

  // South Anonas Street East-side poles (between Oval Gate and SE bend)
  for (const pz of [55.0, 66.5, 78.2, 88.8]) {
    poles.push({
      x: 96.0,
      z: pz,
      rotY: -Math.PI / 2,
      along: 0,
      lateral: 0,
    });
  }

  // Curving Maui Oasis / El Pueblo boulevard South-East sidewalk poles
  for (const along of [16, 4, -8, -20]) {
    const pt = computeBoulevardWorldPoint(along, 8.6);
    poles.push({
      x: pt.x,
      z: pt.z,
      rotY: MAUI_CORRIDOR_CONFIG.boulevardAngleRad + Math.PI,
      along,
      lateral: 8.6,
    });
  }

  return poles;
}

/**
 * Computes asphalt speed humps & pedestrian crosswalk placements along South Anonas St
 * and the Maui Oasis / El Pueblo boulevard.
 */
export function computeMauiSpeedHumps(): BoulevardItemPlacement[] {
  const humps: BoulevardItemPlacement[] = [
    // South Anonas St speed humps fronting Barangay 630 Hall & approaching the 2315 bend
    { x: 90.4, z: 66.2, rotY: 0, along: 0, lateral: 0 },
    { x: 90.4, z: 84.8, rotY: 0, along: 0, lateral: 0 },
  ];

  // Curving Maui Oasis / El Pueblo boulevard speed humps (aligned perpendicular to road)
  for (const along of [11.5, -10.5]) {
    const pt = computeBoulevardWorldPoint(along, 1.5);
    humps.push({
      x: pt.x,
      z: pt.z,
      rotY: MAUI_CORRIDOR_CONFIG.boulevardAngleRad + Math.PI / 2,
      along,
      lateral: 1.5,
    });
  }

  return humps;
}
