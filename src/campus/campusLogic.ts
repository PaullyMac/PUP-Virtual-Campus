import {
  AABB,
  CAMPUS_BOUNDS,
  CAMPUS_LANDMARKS,
  CampusLandmark,
  NpcProfile,
  TimeOfDayPreset,
  Vec2,
} from './campusData';
import { haversineDistanceMeters } from './geoProjection';

export interface NearestLandmarkResult {
  landmark: CampusLandmark;
  distance: number;
  insideTrigger: boolean;
}

export interface RouteStep {
  from: CampusLandmark;
  to: CampusLandmark;
  distanceMeters: number;
  compass: string;
}

export interface CampusRouteResult {
  found: boolean;
  landmarks: CampusLandmark[];
  steps: RouteStep[];
  totalDistanceMeters: number;
  summary: string;
}

export function distance2D(a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  return Math.hypot(dx, dz);
}

/**
 * Calibrated meters-per-Three.js-world-unit ratio derived from Google Maps WGS84
 * measurements across PUP Main Gate -> Obelisk (~156m) and Main Gate -> Old Sta. Mesa (~215m).
 */
export const CAMPUS_METERS_PER_WORLD_UNIT = 1.68;

export function estimateRealWorldDistanceMeters(a: Vec2, b: Vec2): number {
  return Math.round(distance2D(a, b) * CAMPUS_METERS_PER_WORLD_UNIT);
}

/**
 * Frame-rate-independent exponential smoothing for horizontal walking velocity.
 * Eliminates harsh 0 -> maxSpeed -> 0 velocity snapping when pressing or releasing movement keys.
 */
export function stepHorizontalVelocity(
  curVx: number,
  curVz: number,
  targetVx: number,
  targetVz: number,
  dt: number,
  accel = 15,
  decel = 13,
): { vx: number; vz: number } {
  const safeDt = Math.max(0, Math.min(dt, 0.1));
  const targetSpeedSq = targetVx * targetVx + targetVz * targetVz;
  const rate = targetSpeedSq > 1e-4 ? accel : decel;
  const alpha = 1 - Math.exp(-rate * safeDt);
  let vx = curVx + (targetVx - curVx) * alpha;
  let vz = curVz + (targetVz - curVz) * alpha;
  if (targetSpeedSq <= 1e-4 && vx * vx + vz * vz < 0.0004) {
    vx = 0;
    vz = 0;
  }
  return { vx, vz };
}

/**
 * Shortest-arc frame-rate-independent exponential angular damping (radians).
 */
export function dampAngle(current: number, target: number, rate: number, dt: number): number {
  const safeDt = Math.max(0, Math.min(dt, 0.1));
  let diff = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  const alpha = 1 - Math.exp(-rate * safeDt);
  return current + diff * alpha;
}

/**
 * Computes compass bearing in our Three.js PUP campus coordinate system:
 * +X = East, -X = West, -Z = North, +Z = South
 */
export function getCompassDirection(from: Vec2, to: Vec2): string {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  if (Math.hypot(dx, dz) < 0.01) return 'here';

  // Angle where 0 = East (+X), PI/2 = South (+Z), -PI/2 = North (-Z)
  const deg = (Math.atan2(dz, dx) * 180) / Math.PI;
  if (deg >= -22.5 && deg < 22.5) return 'east';
  if (deg >= 22.5 && deg < 67.5) return 'southeast';
  if (deg >= 67.5 && deg < 112.5) return 'south';
  if (deg >= 112.5 && deg < 157.5) return 'southwest';
  if (deg >= 157.5 || deg < -157.5) return 'west';
  if (deg >= -157.5 && deg < -112.5) return 'northwest';
  if (deg >= -112.5 && deg < -67.5) return 'north';
  return 'northeast';
}

export function findNearestLandmark(
  pos: Vec2,
  landmarks: CampusLandmark[] = CAMPUS_LANDMARKS,
): NearestLandmarkResult {
  let best = landmarks[0];
  let bestDist = Infinity;

  for (const lm of landmarks) {
    const d = distance2D(pos, lm.position);
    if (d < bestDist) {
      bestDist = d;
      best = lm;
    }
  }

  return {
    landmark: best,
    distance: Math.round(bestDist),
    insideTrigger: bestDist <= best.triggerRadius,
  };
}

export function findNearbyLandmarks(
  pos: Vec2,
  limit = 4,
  landmarks: CampusLandmark[] = CAMPUS_LANDMARKS,
): Array<{ landmark: CampusLandmark; distance: number; direction: string }> {
  return landmarks
    .map((landmark) => ({
      landmark,
      distance: Math.round(distance2D(pos, landmark.position)),
      direction: getCompassDirection(pos, landmark.position),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

/**
 * Resolves a player circle (x, z, radius) against static campus AABB obstacles
 * and outer playable campus bounds using smooth axis separation (sliding collision).
 */
export function resolveCircleAABBCollisions(
  x: number,
  z: number,
  radius: number,
  colliders: AABB[],
  bounds = CAMPUS_BOUNDS,
): Vec2 {
  let px = Math.max(bounds.minX + radius, Math.min(bounds.maxX - radius, x));
  let pz = Math.max(bounds.minZ + radius, Math.min(bounds.maxZ - radius, z));

  // Two passes stabilize corner slides cleanly
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < colliders.length; i++) {
      const box = colliders[i];
      const closestX = Math.max(box.minX, Math.min(px, box.maxX));
      const closestZ = Math.max(box.minZ, Math.min(pz, box.maxZ));

      const dx = px - closestX;
      const dz = pz - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius) {
        if (distSq > 1e-8) {
          const dist = Math.sqrt(distSq);
          const overlap = radius - dist;
          px += (dx / dist) * overlap;
          pz += (dz / dist) * overlap;
        } else {
          // Center is inside box: push out along minimum penetration axis
          const penLeft = Math.abs(px - box.minX);
          const penRight = Math.abs(box.maxX - px);
          const penTop = Math.abs(pz - box.minZ);
          const penBottom = Math.abs(box.maxZ - pz);
          const minPen = Math.min(penLeft, penRight, penTop, penBottom);

          if (minPen === penLeft) px = box.minX - radius;
          else if (minPen === penRight) px = box.maxX + radius;
          else if (minPen === penTop) pz = box.minZ - radius;
          else pz = box.maxZ + radius;
        }
      }
    }
  }

  px = Math.max(bounds.minX + radius, Math.min(bounds.maxX - radius, px));
  pz = Math.max(bounds.minZ + radius, Math.min(bounds.maxZ - radius, pz));

  return { x: px, z: pz };
}

/**
 * Shortest-path campus navigation along verified interconnected pathways (Dijkstra).
 */
export function computeCampusDirections(
  fromId: string,
  toId: string,
  landmarks: CampusLandmark[] = CAMPUS_LANDMARKS,
): CampusRouteResult {
  const byId = new Map(landmarks.map((l) => [l.id, l]));
  const start = byId.get(fromId);
  const end = byId.get(toId);

  if (!start || !end) {
    return {
      found: false,
      landmarks: [],
      steps: [],
      totalDistanceMeters: 0,
      summary: 'One or both specified campus landmarks could not be found in the verified map.',
    };
  }

  if (start.id === end.id) {
    return {
      found: true,
      landmarks: [start],
      steps: [],
      totalDistanceMeters: 0,
      summary: `You are already at ${start.name}.`,
    };
  }

  const dist = new Map<string, number>();
  const prev = new Map<string, string>();
  const unvisited = new Set<string>(landmarks.map((l) => l.id));

  for (const lm of landmarks) {
    dist.set(lm.id, lm.id === start.id ? 0 : Infinity);
  }

  while (unvisited.size > 0) {
    let currId: string | null = null;
    let currDist = Infinity;
    for (const id of unvisited) {
      const d = dist.get(id) ?? Infinity;
      if (d < currDist) {
        currDist = d;
        currId = id;
      }
    }

    if (!currId || currDist === Infinity) break;
    if (currId === end.id) break;
    unvisited.delete(currId);

    const curr = byId.get(currId)!;
    for (const neighborId of curr.connectedTo) {
      if (!unvisited.has(neighborId)) continue;
      const neighbor = byId.get(neighborId);
      if (!neighbor) continue;
      const alt = currDist + haversineDistanceMeters(curr.gps, neighbor.gps);
      if (alt < (dist.get(neighborId) ?? Infinity)) {
        dist.set(neighborId, alt);
        prev.set(neighborId, currId);
      }
    }
  }

  if (!prev.has(end.id)) {
    return {
      found: false,
      landmarks: [],
      steps: [],
      totalDistanceMeters: 0,
      summary: `No walkable pathway was found between ${start.shortName} and ${end.shortName}.`,
    };
  }

  const pathIds: string[] = [];
  let cursor: string | undefined = end.id;
  while (cursor) {
    pathIds.unshift(cursor);
    cursor = prev.get(cursor);
  }

  const pathLandmarks = pathIds.map((id) => byId.get(id)!);
  const steps: RouteStep[] = [];
  let total = 0;

  for (let i = 0; i < pathLandmarks.length - 1; i++) {
    const a = pathLandmarks[i];
    const b = pathLandmarks[i + 1];
    const segDist = Math.round(haversineDistanceMeters(a.gps, b.gps));
    total += segDist;
    steps.push({
      from: a,
      to: b,
      distanceMeters: segDist,
      compass: getCompassDirection(a.position, b.position),
    });
  }

  const stepText = steps
    .map(
      (s, idx) =>
        `${idx + 1}. From ${s.from.shortName}, head ${s.compass} (~${s.distanceMeters}m real Google Maps distance) toward ${s.to.shortName}.`,
    )
    .join(' ');

  return {
    found: true,
    landmarks: pathLandmarks,
    steps,
    totalDistanceMeters: total,
    summary: `Walk from ${start.shortName} to ${end.shortName} (~${total}m real Google Maps distance): ${stepText}`,
  };
}

export function getNpcScheduleSlot(npc: NpcProfile, timeOfDay: TimeOfDayPreset) {
  switch (timeOfDay) {
    case 'morning':
      return npc.schedule.morning;
    case 'midday':
      return npc.schedule.midday;
    case 'golden':
      return npc.schedule.afternoon;
    case 'dusk':
      return npc.schedule.dusk;
    case 'night':
      return {
        ...npc.schedule.dusk,
        activity: `${npc.schedule.dusk.activity} under the evening campus lamps`,
      };
  }
}

export function matchLandmarkFromQuery(
  query: string,
  landmarks: CampusLandmark[] = CAMPUS_LANDMARKS,
): CampusLandmark | null {
  const q = query.toLowerCase();
  const aliases: Array<[string, string[]]> = [
    ['sampaguita-canteen', ['sampaguita', 'university canteen', 'student canteen', 'student center', 'canteen']],
    ['tahanan-ng-alumni', ['alumni', 'tahanan ng alumni', 'chk', 'human kinetics', 'pe building', 'nftrdc', 'food technology']],
    ['food-nutrition-strip', ['food and nutrition', 'gabriela silang', 'fmo', 'facility management', 'maintenance', 'gazebo']],
    ['tahanan-ng-atleta', ['atleta', 'tahanan ng atleta', 'athletes', 'oval gate']],
    ['visitors-lounge-courts', ['visitor', 'lounge', 'souvenir', 'tennis', 'basketball', 'open court', 'gym gate']],
    ['printing-psmo', ['printing press', 'psmo', 'property', 'supply', 'water tower', 'water pump']],
    ['old-stamesa-stopshop', ['old sta mesa', 'old santa mesa', 'stop and shop', 'stop & shop', 'stop&shop', 'cebuana', 'jeepney terminal', 'pureza']],
    ['pnr-stamesa', ['pnr', 'train', 'railway', 'railroad', 'tracks', 'viaduct', 'nlex', 'slex', 'connector', 'skyway', 'rr xing']],
    ['anonas-teresa', ['teresa', 'teresa chapel', 'mahal na krus', 'brgy 591', 'barangay 591', '591', 'banana island', 'rbs', 'palceso', 'chacha', 'pst', 'pastil', 'takam', 'smokle', '7-eleven', '7 eleven', 'eufrosino', 'ramos', 'rdp', 'smile pod', 'elegance', 'angels burger', 'palawan', 'esperanza', 'covered court', 'mubyl', 'outside', 'tricycle', 'dorm', 'photocopy']],
    ['maui-el-pueblo', ['maui', 'maui oasis', 'el pueblo', 'futura', 'futura centro', 'condo', 'condominium', 'oval wall', 'south anonas', 'anonas']],
    ['pup-ferry-station', ['ferry', 'mmda', 'pier', 'dock', 'boat', 'pureza ferry']],
    ['north-wing-construction', ['north wing', 'construction', 'under construction', 'dpwh', 'crane', 'unfinished', 'redevelopment']],
    ['nallrc', ['nallrc', 'library', 'ninoy aquino', 'books']],
    ['main-building', ['main building', 'dome', 'south wing', 'east wing', 'west wing', 'classroom', 's-104']],
    ['lagoon', ['lagoon', 'amphitheater', 'food stall', 'kiosk']],
    ['obelisk-freedom-park', ['obelisk', 'freedom park', 'star', 'flagpole', 'prudente']],
    ['main-gate', ['main gate', 'pylon', 'mural', 'entrance']],
    ['catwalk', ['catwalk', 'covered walkway']],
    ['mabini-shrine', ['mabini shrine', 'mabini museum', 'museo', 'shrine', 'nhcp']],
    ['charlie-del-rosario', ['charlie', 'student council', 'org']],
    ['interfaith-chapel', ['chapel', 'interfaith', 'church', 'prayer']],
    ['oval-grandstand', ['oval', 'grandstand', 'track', 'field', 'bleachers']],
    ['gymnasium', ['gym', 'gymnasium', 'swimming pool', 'pool', 'esrc']],
    ['linear-park', ['linear park', 'pasig river', 'river', 'promenade']],
  ];

  for (const [id, terms] of aliases) {
    if (terms.some((t) => q.includes(t))) {
      return landmarks.find((l) => l.id === id) ?? null;
    }
  }
  return null;
}

export function getSurfaceTypeAt(x: number, z: number): 'concrete' | 'grass' | 'interior' | 'water' {
  // Inside Main Building ground floor (Central Dome Rotunda + East Wing Room E-104)
  if (
    Math.hypot(x - -28, z - 24) < 11.2 ||
    (x > -34 && x < -22 && z >= 24 && z < 50)
  ) {
    return 'interior';
  }
  // Inside NALLRC ground floor (T-wing white library)
  if (x > -34 && x < -14 && z > -50 && z < -36) {
    return 'interior';
  }
  // Inside Interfaith Chapel (octagonal sanctuary at (-2, 42))
  if (Math.hypot(x - -2, z - 42) < 9.8) {
    return 'interior';
  }
  // PUP Track & Field Oval turf infield centered at (48, 44)
  if (Math.pow((x - 48) / 13.5, 2) + Math.pow((z - 44) / 18, 2) < 1) {
    return 'grass';
  }
  // Mabini Shrine lawn (39.5, 11.5) & Interfaith Chapel garden ring (-2, 42)
  if (
    (x > 31 && x < 49 && z > 6 && z < 17) ||
    (Math.hypot(x - -2, z - 42) >= 9.8 && Math.hypot(x - -2, z - 42) < 15.5)
  ) {
    return 'grass';
  }
  return 'concrete';
}

export interface StructureFootprint {
  id: string;
  label: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/**
 * Authoritative non-overlapping 2D footprints of distinct PUP Sta. Mesa campus structures
 * synchronized with campusBuilder.ts so automated tests guarantee zero building/structure collisions.
 */
export const CAMPUS_STRUCTURE_FOOTPRINTS: StructureFootprint[] = [
  { id: 'main-gate', label: 'PUP Main Gate', minX: 72.0, maxX: 75.5, minZ: -13.8, maxZ: 2.8 },
  { id: 'pup-security-office', label: 'PUP Security Office / Guardhouse Pavilion', minX: 65.8, maxX: 71.4, minZ: -14.1, maxZ: -11.3 },
  { id: 'pup-pylon', label: 'PUP Pylon & Curved Courtyard', minX: 76.0, maxX: 82.8, minZ: -21.8, maxZ: -12.4 },
  { id: 'pup-mural', label: 'PUP Mural & South Exit Wing', minX: 75.6, maxX: 82.6, minZ: 3.4, maxZ: 7.8 },
  { id: 'dambana-kabayanihan', label: 'Dambana ng Kabayanihan Monument', minX: 81.1, maxX: 84.0, minZ: 9.2, maxZ: 17.6 },
  { id: 'dambanang-mabini-wall', label: 'Dambanang Mabini sa PUP & South Side Gate', minX: 81.6, maxX: 83.2, minZ: 17.8, maxZ: 27.2 },
  { id: 'visitors-lounge', label: 'Visitor’s Lounge (#3)', minX: 62.6, maxX: 71.4, minZ: -20.8, maxZ: -14.2 },
  { id: 'gym-gate', label: 'Gymnasium Gate (#40)', minX: 81.4, maxX: 84.0, minZ: -32.5, maxZ: -23.5 },
  { id: 'oval-gate', label: 'Oval Gate (#7)', minX: 81.4, maxX: 84.0, minZ: 53.5, maxZ: 62.5 },
  { id: 'open-court-east', label: 'Open Multi-Sport Court (#4)', minX: 55.2, maxX: 64.8, minZ: -30.5, maxZ: -21.5 },
  { id: 'tennis-court', label: 'Lawn Tennis Court (#5)', minX: 39.2, maxX: 53.8, minZ: -31.0, maxZ: -17.0 },
  { id: 'basketball-court', label: 'Basketball & Volleyball Court (#6)', minX: 24.2, maxX: 37.8, minZ: -31.0, maxZ: -17.0 },
  { id: 'souvenir-shop', label: 'PUP Souvenir Shop (#7)', minX: 52.8, maxX: 62.2, minZ: 8.2, maxZ: 14.2 },
  { id: 'north-catwalk', label: 'North Catwalk', minX: 27.5, maxX: 64.5, minZ: -13.3, maxZ: -9.5 },
  { id: 'south-catwalk', label: 'South Catwalk', minX: 27.5, maxX: 64.5, minZ: 1.5, maxZ: 5.3 },
  { id: 'obelisk-roundabout', label: 'PUP Obelisk Roundabout', minX: 3.2, maxX: 24.8, minZ: -14.8, maxZ: 6.8 },
  { id: 'fountain-park', label: 'Fountain Park (#12)', minX: 1.0, maxX: 12.0, minZ: 20.6, maxZ: 28.4 },
  { id: 'mabini-museum', label: 'Museo ni Mabini Gallery (#9)', minX: 19.2, maxX: 28.8, minZ: 9.4, maxZ: 17.0 },
  { id: 'mabini-shrine', label: 'Mabini Shrine (#8)', minX: 32.2, maxX: 48.2, minZ: 8.0, maxZ: 18.0 },
  { id: 'gazebo-east', label: 'PUP Gazebo East (#15)', minX: 13.8, maxX: 20.2, minZ: 25.8, maxZ: 32.2 },
  { id: 'gazebo-sw', label: 'PUP Gazebo SW (#15)', minX: -44.2, maxX: -37.8, minZ: 48.8, maxZ: 55.2 },
  { id: 'pup-grandstand', label: 'PUP Grandstand (#16)', minX: 27.3, maxX: 36.9, minZ: 21.4, maxZ: 43.4 },
  { id: 'interfaith-chapel', label: 'Interfaith Chapel (#13)', minX: -13.5, maxX: 9.5, minZ: 30.5, maxZ: 53.5 },
  { id: 'tahanan-ng-atleta', label: 'Tahanan ng Atleta (#18)', minX: 18.5, maxX: 33.5, minZ: 62.5, maxZ: 72.5 },
  { id: 'gabriela-silang', label: 'Gabriela Silang Building (#19)', minX: -0.5, maxX: 14.5, minZ: 62.5, maxZ: 72.5 },
  { id: 'food-nutrition-bldg', label: 'Food & Nutrition Building (#20)', minX: -29.0, maxX: -4.0, minZ: 62.5, maxZ: 72.5 },
  { id: 'facility-mgmt-office', label: 'Facility Management Office (#21)', minX: -50.5, maxX: -32.5, minZ: 62.5, maxZ: 72.5 },
  { id: 'main-east-wing', label: 'Main Bldg East Wing', minX: -34.2, maxX: -21.8, minZ: 24.0, maxZ: 50.8 },
  { id: 'main-south-cross', label: 'Main Bldg South Courtyard Wing', minX: -50.8, maxX: -43.2, minZ: 26.5, maxZ: 44.5 },
  { id: 'sampaguita-bldg', label: 'Sampaguita Bldg / Univ Canteen (#22)', minX: -62.5, maxX: -53.5, minZ: 5.5, maxZ: 18.5 },
  { id: 'student-center', label: 'Student Center (#23)', minX: -44.3, maxX: -36.7, minZ: -24.6, maxZ: -16.4 },
  { id: 'north-wing-construction', label: 'North Wing Construction', minX: -21.0, maxX: -3.5, minZ: 3.5, maxZ: 19.0 },
  { id: 'lagoon-pond', label: 'Lagoon Pond (#33)', minX: -26.5, maxX: -12.5, minZ: -25.8, maxZ: -9.2 },
  { id: 'lagoon-stalls', label: 'Lagoon Stalls (#31)', minX: -32.6, maxX: -28.6, minZ: -27.2, maxZ: -5.2 },
  { id: 'nallrc-main', label: 'NALLRC Library (#30)', minX: -36.5, maxX: -11.5, minZ: -52.0, maxZ: -36.0 },
  { id: 'nallrc-twing', label: 'NALLRC North T-Wing (#30)', minX: -29.9, maxX: -18.1, minZ: -64.6, maxZ: -52.1 },
  { id: 'nftrdc-bldg', label: 'NFTRDC Research Bldg (#34)', minX: -17.5, maxX: -6.5, minZ: -71.0, maxZ: -62.0 },
  { id: 'pup-water-tower', label: 'PUP Water Tower (#29)', minX: -48.0, maxX: -40.0, minZ: -62.5, maxZ: -54.5 },
  { id: 'psmo-water-pump', label: 'PSMO & Water Pump Facility (#28)', minX: -51.5, maxX: -36.5, minZ: -72.0, maxZ: -65.0 },
  { id: 'printing-press', label: 'Printing Press Building (#27)', minX: -66.0, maxX: -53.0, minZ: -63.0, maxZ: -54.0 },
  { id: 'lab-high-school', label: 'Lab High School (#26)', minX: -66.5, maxX: -52.5, minZ: -50.5, maxZ: -25.0 },
  { id: 'charlie-hall', label: 'Charlie del Rosario Hall (#24)', minX: -61.8, maxX: -46.2, minZ: -23.5, maxZ: -0.5 },
  { id: 'tahanan-ng-alumni', label: 'Tahanan ng Alumni (#36)', minX: 13.5, maxX: 21.5, minZ: -29.0, maxZ: -20.0 },
  { id: 'pup-pe-bldg', label: 'Human Kinetics Bldg / CHK (#35)', minX: -6.5, maxX: 2.5, minZ: -56.6, maxZ: -37.4 },
  { id: 'pup-pool', label: 'Olympic Swimming Pool (#37)', minX: 5.0, maxX: 27.0, minZ: -57.5, maxZ: -38.5 },
  { id: 'pup-gymnasium', label: 'PUP Gymnasium (#38)', minX: 29.5, maxX: 58.5, minZ: -57.8, maxZ: -38.2 },
  { id: 'pup-esrc', label: 'Engineering & Science Research Center (#39)', minX: 61.2, maxX: 74.8, minZ: -56.8, maxZ: -39.2 },
  // Outside PUP: PNR Sta. Mesa Station Platforms & May 2026 Street-View-Verified Teresa Street North/South Stalls + Old Sta. Mesa
  { id: 'pnr-platform-west', label: 'PNR Sta. Mesa West Platform', minX: 97.4, maxX: 100.2, minZ: -41.0, maxZ: -17.0 },
  { id: 'pnr-platform-east', label: 'PNR Sta. Mesa East Platform', minX: 109.2, maxX: 112.0, minZ: -41.0, maxZ: -17.0 },
  { id: 'teresa-banana-island', label: 'Banana Island Stall', minX: 117.8, maxX: 127.2, minZ: -18.0, maxZ: -10.6 },
  { id: 'teresa-gcash-xerox', label: 'GCash · Tarpaulin & Xerox Print Row', minX: 128.3, maxX: 137.7, minZ: -18.0, maxZ: -10.6 },
  { id: 'teresa-smokle-vape', label: 'Smokle Vape Shop', minX: 138.9, maxX: 147.5, minZ: -18.0, maxZ: -10.6 },
  { id: 'teresa-7eleven', label: '7-Eleven Teresa Street', minX: 148.7, maxX: 158.1, minZ: -18.0, maxZ: -10.6 },
  { id: 'teresa-green-compound', label: 'Teresa Green Corrugated Compound', minX: 159.3, maxX: 168.7, minZ: -18.0, maxZ: -10.6 },
  { id: 'teresa-esperanza-clinic', label: 'Esperanza Health Center & Lying-In Clinic', minX: 169.9, maxX: 179.3, minZ: -18.0, maxZ: -10.6 },
  { id: 'teresa-chapel', label: 'Teresa Chapel (Alay sa Mahal na Krus)', minX: 180.5, maxX: 189.9, minZ: -18.0, maxZ: -10.6 },
  { id: 'teresa-covered-court', label: 'Teresa Covered Court', minX: 191.1, maxX: 200.1, minZ: -18.0, maxZ: -10.6 },
  { id: 'teresa-rbs-palceso', label: 'RBS Bookbinding & Palceso Printing Services', minX: 117.8, maxX: 126.2, minZ: 2.6, maxZ: 10.0 },
  { id: 'teresa-chacha-canteen', label: 'Chacha Canteen & Angelina’s Store', minX: 127.3, maxX: 135.7, minZ: 2.6, maxZ: 10.0 },
  { id: 'teresa-pst-takam', label: 'PST (Pastil sa Tabi) & Takam', minX: 136.8, maxX: 146.2, minZ: 2.6, maxZ: 10.0 },
  { id: 'teresa-eufrosino-rdp', label: 'Eufrosino’s Fruit, Ramos Print & RDP Graphics', minX: 147.5, maxX: 156.9, minZ: 2.6, maxZ: 10.0 },
  { id: 'teresa-smilepod-elegance', label: 'Smile POD Dental Clinic & Elegance Salon', minX: 158.1, maxX: 167.5, minZ: 2.6, maxZ: 10.0 },
  { id: 'teresa-angels-palawan', label: 'Angel’s Burger & Palawan Pawnshop / Express', minX: 168.7, maxX: 178.1, minZ: 2.6, maxZ: 10.0 },
  { id: 'teresa-sarisari-row', label: 'Teresa Blue Apt & Sari-Sari Row', minX: 179.3, maxX: 188.7, minZ: 2.6, maxZ: 10.0 },
  { id: 'teresa-brgy591-mubyl', label: 'Barangay 591 Hall (Zone 58) & Mubyl', minX: 189.9, maxX: 200.1, minZ: 2.6, maxZ: 10.0 },
  { id: 'old-stamesa-arcade', label: 'Old Sta. Mesa Commercial Block & Cebuana Lhuillier', minX: 217.2, maxX: 226.8, minZ: -26.0, maxZ: 18.0 },
  // South Anonas PUP Perimeter Wall, Maui Oasis, Futura Centro & El Pueblo Manila Condominium
  { id: 'pup-south-perimeter-wall', label: 'PUP South Boundary Wall (Maui Oasis Border)', minX: -54.0, maxX: 82.0, minZ: 75.8, maxZ: 77.2 },
  { id: 'maui-oasis-bldg-west', label: 'Maui Oasis by Filinvest (West Wing)', minX: 20.0, maxX: 38.0, minZ: 80.5, maxZ: 93.5 },
  { id: 'maui-oasis-bldg-main', label: 'Maui Oasis by Filinvest (Main Tropical Building)', minX: 46.0, maxX: 70.0, minZ: 80.5, maxZ: 93.5 },
  { id: 'futura-centro-tower', label: 'Futura Centro by Filinvest Tower', minX: 93.0, maxX: 113.0, minZ: 91.0, maxZ: 113.0 },
  { id: 'el-pueblo-condo', label: 'El Pueblo Manila Condominium & Gatehouse', minX: 16.0, maxX: 44.0, minZ: 108.0, maxZ: 124.0 },
];

export function findOverlappingFootprints(
  footprints: StructureFootprint[] = CAMPUS_STRUCTURE_FOOTPRINTS,
): Array<{ a: string; b: string; overlapX: number; overlapZ: number }> {
  const overlaps: Array<{ a: string; b: string; overlapX: number; overlapZ: number }> = [];
  for (let i = 0; i < footprints.length; i++) {
    for (let j = i + 1; j < footprints.length; j++) {
      const a = footprints[i];
      const b = footprints[j];
      const ox = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
      const oz = Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ);
      if (ox > 0.05 && oz > 0.05) {
        overlaps.push({
          a: a.id,
          b: b.id,
          overlapX: Number(ox.toFixed(2)),
          overlapZ: Number(oz.toFixed(2)),
        });
      }
    }
  }
  return overlaps;
}
