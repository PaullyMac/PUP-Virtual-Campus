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
  side: 'east' | 'west';
}

export interface BoulevardItemPlacement {
  x: number;
  z: number;
  rotY: number;
  along: number;
  lateral: number;
}

/**
 * Calibrated South Anonas Street -> Barangay 630 -> Maui Oasis / Futura Centro / El Pueblo Manila
 * corridor geometry in blueprint units (1 blueprint unit = 1.62m real-world scale).
 *
 * Key real-world separation:
 * - PUP Main Gate: z = -4.0
 * - PUP Oval South Wall ends: z = 78.5 (SE Service Gate ends z = 84.4)
 * - Barangay 630 Zone 63 Civic Core: z = 85..105
 * - Extended South Anonas residential, dorm & commercial street: z = 108..168 (~145m south of PUP Oval!)
 * - Sweeping Maui Oasis / Futura Centro / El Pueblo Boulevard: origin (46, 186), length 112 units (~181m)
 */
export const MAUI_CORRIDOR_CONFIG = {
  anonasWestCurbX: 85.65,
  anonasEastCurbX: 95.2,
  anonasStartZ: 52.0,
  anonasCurveZ: 174.0,
  boulevardOrigin: { x: 46.0, z: 186.0 } as WorldPoint2D,
  boulevardAngleRad: 0.24, // Matches Three.js rotation.y = +0.24 along Maui Oasis -> El Pueblo boulevard
  boulevardLength: 112.0,
  boulevardWidth: 16.5,
  pupOvalWallEndZ: 78.5,
  mauiOasisMainZ: 164.0,
  elPuebloMainZ: 205.0,
};

/**
 * Transforms local Maui Oasis / El Pueblo boulevard coordinates (along, lateral)
 * into Three.js world (x, z) coordinates matching rotation.y = +boulevardAngleRad.
 * +along runs ENE toward South Anonas St; -along runs WSW toward El Pueblo Manila.
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
 * Returns non-overlapping East-side Anonas Street civic, commercial & neighborhood footprints
 * from PUP Oval Gate south through Barangay 630 Zone 63 Hall down to the Maui Oasis / Futura Centro junction.
 */
export function computeBarangay630Footprints(): CorridorBuildingFootprint[] {
  return [
    {
      id: 'anonas-alfamart',
      label: 'Alfamart Anonas',
      x: 100.6,
      z: 74.2,
      width: 6.4,
      depth: 7.8,
      side: 'east',
    },
    {
      id: 'barangay-630-hall',
      label: 'Barangay 630 Zone 63 Hall',
      x: 101.0,
      z: 84.5,
      width: 7.4,
      depth: 10.2,
      side: 'east',
    },
    {
      id: 'barangay-630-court',
      label: 'Barangay 630 Multi-Purpose Covered Court',
      x: 112.0,
      z: 84.5,
      width: 9.2,
      depth: 11.0,
      side: 'east',
    },
    {
      id: 'barangay-630-health',
      label: 'Barangay 630 Health Center & SK Annex',
      x: 101.2,
      z: 96.5,
      width: 7.4,
      depth: 9.2,
      side: 'east',
    },
    // Narrow Barangay 630 side alley (Kalye Eskinita) gap at z = 101.2..106.4 (center z = 103.8)!
    {
      id: 'anonas-sari-barber',
      label: 'Kuya Boy Barbershop & Sari-Sari Store',
      x: 100.8,
      z: 111.5,
      width: 6.8,
      depth: 8.8,
      side: 'east',
    },
    {
      id: 'anonas-bigasan-grocery',
      label: '630 Bigasan & Mini-Grocery',
      x: 101.0,
      z: 122.5,
      width: 7.2,
      depth: 9.2,
      side: 'east',
    },
    {
      id: 'anonas-vulcanizing',
      label: 'Anonas Moto-Fix Vulcanizing & Parts',
      x: 101.0,
      z: 133.8,
      width: 7.0,
      depth: 9.2,
      side: 'east',
    },
    {
      id: 'anonas-bakery-cafe',
      label: 'Sta. Mesa Panaderia & Milk Tea',
      x: 100.8,
      z: 145.0,
      width: 6.8,
      depth: 9.2,
      side: 'east',
    },
    {
      id: 'anonas-dorm-south',
      label: 'Anonas Student Dorm & Print Hub',
      x: 101.2,
      z: 156.4,
      width: 7.4,
      depth: 9.4,
      side: 'east',
    },
  ];
}

/**
 * Returns non-overlapping West-side South Anonas Street residential, dormitory & commercial footprints
 * continuing south of the PUP Oval / compound perimeter wall (z = 118..165) toward Maui Oasis.
 */
export function computeWestAnonasFootprints(): CorridorBuildingFootprint[] {
  return [
    {
      id: 'west-anonas-carinderia',
      label: "Mama Nena's Tapsilogan & Carinderia",
      x: 78.8,
      z: 123.5,
      width: 7.4,
      depth: 9.6,
      side: 'west',
    },
    {
      id: 'west-anonas-water-laundry',
      label: 'Aqua-630 Water Refilling & Laundry',
      x: 78.8,
      z: 135.5,
      width: 7.4,
      depth: 9.2,
      side: 'west',
    },
    {
      id: 'west-anonas-dorm-a',
      label: 'Sta. Mesa Iskolar Boarding House',
      x: 78.5,
      z: 147.8,
      width: 8.0,
      depth: 10.0,
      side: 'west',
    },
    {
      id: 'west-anonas-hardware',
      label: 'Anonas Hardware & Photocopy Center',
      x: 78.8,
      z: 160.0,
      width: 7.4,
      depth: 9.4,
      side: 'west',
    },
  ];
}

/**
 * Computes evenly spaced Meralco utility poles & cobra-head streetlamps along both
 * the extended South Anonas Street (z = 58..168) and the curving Maui Oasis / El Pueblo boulevard.
 */
export function computeMauiCorridorPoles(): BoulevardItemPlacement[] {
  const poles: BoulevardItemPlacement[] = [];

  // South Anonas Street East-side poles (from Oval Gate through Barangay 630 down to SE condo junction)
  for (const pz of [58.0, 72.5, 86.5, 102.0, 118.0, 134.0, 150.0, 166.0]) {
    poles.push({
      x: 96.0,
      z: pz,
      rotY: -Math.PI / 2,
      along: 0,
      lateral: 0,
    });
  }

  // Curving Maui Oasis / El Pueblo boulevard South-East sidewalk poles (cleanly on sidewalk at lateral = 10.2, clear of parked cars)
  for (const along of [34, 18, 2, -14, -30, -44]) {
    const pt = computeBoulevardWorldPoint(along, 10.2);
    poles.push({
      x: pt.x,
      z: pt.z,
      rotY: MAUI_CORRIDOR_CONFIG.boulevardAngleRad + Math.PI,
      along,
      lateral: 10.2,
    });
  }

  return poles;
}

/**
 * Computes asphalt speed humps along the extended South Anonas Street
 * and the curving Maui Oasis / El Pueblo boulevard.
 */
export function computeMauiSpeedHumps(): BoulevardItemPlacement[] {
  const humps: BoulevardItemPlacement[] = [
    // South Anonas St speed humps (fronting Barangay 630 Hall, mid-street dorm row, & approaching SE bend)
    { x: 90.42, z: 79.0, rotY: 0, along: 0, lateral: 0 },
    { x: 90.42, z: 107.0, rotY: 0, along: 0, lateral: 0 },
    { x: 90.42, z: 138.0, rotY: 0, along: 0, lateral: 0 },
    { x: 90.42, z: 165.5, rotY: 0, along: 0, lateral: 0 },
  ];

  // Curving Maui Oasis / El Pueblo boulevard speed humps (aligned perpendicular to road; split cleanly around median in builder)
  for (const along of [24.0, -2.0, -28.0]) {
    const pt = computeBoulevardWorldPoint(along, 0.0);
    humps.push({
      x: pt.x,
      z: pt.z,
      rotY: MAUI_CORRIDOR_CONFIG.boulevardAngleRad + Math.PI / 2,
      along,
      lateral: 0.0,
    });
  }

  return humps;
}
