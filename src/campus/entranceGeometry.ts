export interface ForecourtSidewalkConfig {
  gateX: number;
  anonasCurbX: number;
  drivewayNorthZ: number;
  drivewaySouthZ: number;
  curveRadius: number;
  sidewalkWidth: number;
  anonasNorthEndZ: number;
  anonasSouthEndZ: number;
  arcSegments: number;
}

export const PUP_FORECOURT_CONFIG: ForecourtSidewalkConfig = {
  gateX: 73.2,
  anonasCurbX: 86.4,
  drivewayNorthZ: -9.8,
  drivewaySouthZ: 1.8,
  curveRadius: 6.6,
  sidewalkWidth: 3.1,
  anonasNorthEndZ: -56.0,
  anonasSouthEndZ: 53.0,
  arcSegments: 24,
};

export interface CurbSegment {
  x: number;
  z: number;
  length: number;
  rotY: number;
  index: number;
}

/**
 * Generates a C1-continuous swept sidewalk polygon in world [x, z] coordinates
 * for the North or South curved PUP Main Entrance forecourt meeting Anonas Street.
 */
export function generateCurvedSidewalkPolygon(
  side: 'north' | 'south',
  cfg: ForecourtSidewalkConfig = PUP_FORECOURT_CONFIG,
): Array<[number, number]> {
  const {
    gateX,
    anonasCurbX,
    drivewayNorthZ,
    drivewaySouthZ,
    curveRadius: R,
    sidewalkWidth: W,
    anonasNorthEndZ,
    anonasSouthEndZ,
    arcSegments,
  } = cfg;

  const arcStartX = anonasCurbX - R; // 79.8
  const innerR = Math.max(1.2, R - W);
  const pts: Array<[number, number]> = [];

  if (side === 'north') {
    const centerZ = drivewayNorthZ - R; // -16.4
    // Outer curb edge: Gate -> straight throat -> smooth 90° arc -> Anonas St North
    pts.push([gateX, drivewayNorthZ]);
    pts.push([arcStartX, drivewayNorthZ]);
    for (let i = 1; i <= arcSegments; i++) {
      const a = (Math.PI / 2) * (1 - i / arcSegments); // +PI/2 -> 0
      pts.push([arcStartX + R * Math.cos(a), centerZ + R * Math.sin(a)]);
    }
    pts.push([anonasCurbX, anonasNorthEndZ]);

    // Inner back edge returning along Pylon plaza & North Entrance canopy
    const innerAnonasX = anonasCurbX - W;
    pts.push([innerAnonasX, anonasNorthEndZ]);
    pts.push([innerAnonasX, centerZ]);
    for (let i = 1; i <= Math.max(10, Math.round(arcSegments / 2)); i++) {
      const steps = Math.max(10, Math.round(arcSegments / 2));
      const a = (Math.PI / 2) * (i / steps); // 0 -> +PI/2
      pts.push([arcStartX + innerR * Math.cos(a), centerZ + innerR * Math.sin(a)]);
    }
    pts.push([gateX, drivewayNorthZ - W]);
  } else {
    const centerZ = drivewaySouthZ + R; // +8.4
    // Outer curb edge: Gate -> straight throat -> smooth 90° arc -> Anonas St South
    pts.push([gateX, drivewaySouthZ]);
    pts.push([arcStartX, drivewaySouthZ]);
    for (let i = 1; i <= arcSegments; i++) {
      const a = (-Math.PI / 2) * (1 - i / arcSegments); // -PI/2 -> 0
      pts.push([arcStartX + R * Math.cos(a), centerZ + R * Math.sin(a)]);
    }
    pts.push([anonasCurbX, anonasSouthEndZ]);

    // Inner back edge returning along Dambana & flared Mural EXIT walkway
    const innerAnonasX = anonasCurbX - W;
    pts.push([innerAnonasX, anonasSouthEndZ]);
    pts.push([innerAnonasX, centerZ]);
    for (let i = 1; i <= Math.max(10, Math.round(arcSegments / 2)); i++) {
      const steps = Math.max(10, Math.round(arcSegments / 2));
      const a = (-Math.PI / 2) * (i / steps); // 0 -> -PI/2
      pts.push([arcStartX + innerR * Math.cos(a), centerZ + innerR * Math.sin(a)]);
    }
    pts.push([gateX, drivewaySouthZ + W]);
  }

  return pts;
}

/**
 * Generates smoothly tangent-aligned curbstone blocks along the straight throat,
 * quarter-circle forecourt curve, and Anonas Street straightaway so alternating
 * yellow/black curb stripes wrap with zero visual discontinuities.
 */
export function computeForecourtCurbSegments(
  side: 'north' | 'south',
  cfg: ForecourtSidewalkConfig = PUP_FORECOURT_CONFIG,
): CurbSegment[] {
  const {
    gateX,
    anonasCurbX,
    drivewayNorthZ,
    drivewaySouthZ,
    curveRadius: R,
    anonasNorthEndZ,
    anonasSouthEndZ,
  } = cfg;

  const arcStartX = anonasCurbX - R;
  const segments: CurbSegment[] = [];
  let idx = 0;

  const straightLen = arcStartX - gateX;
  const throatCount = Math.max(4, Math.round(straightLen / 0.74));
  const throatStep = straightLen / throatCount;
  const throatZ = side === 'north' ? drivewayNorthZ : drivewaySouthZ;

  // 1. Straight forecourt throat curb
  for (let i = 0; i < throatCount; i++) {
    segments.push({
      x: gateX + (i + 0.5) * throatStep,
      z: throatZ,
      length: throatStep + 0.02,
      rotY: 0,
      index: idx++,
    });
  }

  // 2. Smooth 90-degree curved corner curb (tangent-aligned)
  const arcLen = (Math.PI / 2) * R;
  const arcCount = Math.max(12, Math.round(arcLen / 0.58));
  const chordLen = arcLen / arcCount + 0.04;
  const centerZ = side === 'north' ? drivewayNorthZ - R : drivewaySouthZ + R;

  for (let i = 0; i < arcCount; i++) {
    const t = (i + 0.5) / arcCount;
    if (side === 'north') {
      const a = (Math.PI / 2) * (1 - t); // +PI/2 -> 0
      segments.push({
        x: arcStartX + R * Math.cos(a),
        z: centerZ + R * Math.sin(a),
        length: chordLen,
        rotY: Math.PI / 2 - a,
        index: idx++,
      });
    } else {
      const a = (-Math.PI / 2) * (1 - t); // -PI/2 -> 0
      segments.push({
        x: arcStartX + R * Math.cos(a),
        z: centerZ + R * Math.sin(a),
        length: chordLen,
        rotY: -(Math.PI / 2 + a),
        index: idx++,
      });
    }
  }

  // 3. Straight Anonas Street curb extending North or South
  if (side === 'north') {
    for (let cz = centerZ - 0.5; cz >= anonasNorthEndZ + 0.5; cz -= 0.9) {
      segments.push({
        x: anonasCurbX,
        z: cz,
        length: 0.88,
        rotY: Math.PI / 2,
        index: idx++,
      });
    }
  } else {
    for (let cz = centerZ + 0.5; cz <= anonasSouthEndZ - 0.5; cz += 0.9) {
      segments.push({
        x: anonasCurbX,
        z: cz,
        length: 0.88,
        rotY: Math.PI / 2,
        index: idx++,
      });
    }
  }

  return segments;
}

export interface PylonPodiumTier {
  width: number;
  depth: number;
  height: number;
  yCenter: number;
}

/**
 * Computes the authentic 3-tier stepped travertine/terracotta podium underneath
 * the three PUP Pylon monoliths (matching Wikimedia Commons architectural photos).
 */
export function computePylonPodiumTiers(): PylonPodiumTier[] {
  const tiers: Array<{ w: number; d: number; h: number }> = [
    { w: 5.1, d: 8.3, h: 0.2 },
    { w: 4.5, d: 7.6, h: 0.2 },
    { w: 3.9, d: 6.9, h: 0.22 },
  ];
  let y = 0;
  return tiers.map((t) => {
    const yCenter = y + t.h / 2;
    y += t.h;
    return { width: t.w, depth: t.d, height: t.h, yCenter };
  });
}

export interface MicroStallBay {
  localX: number;
  width: number;
  kind: 'carinderia' | 'print-shop' | 'kiosk' | 'shutter';
  hasFreezer: boolean;
  hasBladeSign: boolean;
}

/**
 * Subdivides a Teresa Street shophouse frontage into realistic narrow Manila
 * micro-stall bays (~2.6m–4.5m each) with authentic street-level variety.
 */
export function computeTeresaStallBays(
  totalWidth: number,
  seed: number,
  preferredKind?: MicroStallBay['kind'],
): MicroStallBay[] {
  const bayCount = totalWidth >= 8.8 ? 3 : 2;
  const usableWidth = totalWidth - 0.36;
  const bayW = usableWidth / bayCount;
  const kinds: MicroStallBay['kind'][] = ['carinderia', 'print-shop', 'kiosk', 'shutter'];
  const bays: MicroStallBay[] = [];

  for (let i = 0; i < bayCount; i++) {
    const localX = -usableWidth / 2 + (i + 0.5) * bayW;
    const kind =
      i === 0 && preferredKind
        ? preferredKind
        : kinds[Math.abs(seed * 3 + i) % kinds.length];
    bays.push({
      localX,
      width: bayW - 0.16,
      kind,
      hasFreezer: kind === 'kiosk' || (kind === 'carinderia' && (seed + i) % 2 === 0),
      hasBladeSign: i === 0 || (bayCount === 3 && i === 2),
    });
  }

  return bays;
}
