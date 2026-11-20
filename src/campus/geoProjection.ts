export interface GpsCoord {
  lat: number;
  lng: number;
}

/**
 * Verified Google Maps anchor: PUP Obelisk, A. Mabini Main Campus, Sta. Mesa, Manila.
 */
export const PUP_OBELISK_GPS: GpsCoord = {
  lat: 14.59779,
  lng: 121.011035,
};

const EARTH_RADIUS_M = 6_371_000;

/**
 * Exact WGS84 great-circle distance in meters between two Google Maps coordinates.
 */
export function haversineDistanceMeters(a: GpsCoord, b: GpsCoord): number {
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Projects a WGS84 Google Maps coordinate to local tangent-plane meters
 * relative to an origin (+eastMeters = East, +southMeters = South, matching Three.js +X/+Z).
 */
export function projectGpsToLocalMeters(
  coord: GpsCoord,
  origin: GpsCoord = PUP_OBELISK_GPS,
): { eastMeters: number; southMeters: number } {
  const meanLatRad = (((coord.lat + origin.lat) * 0.5) * Math.PI) / 180;
  const eastMeters = (coord.lng - origin.lng) * 111_320 * Math.cos(meanLatRad);
  const southMeters = -(coord.lat - origin.lat) * 110_540;
  return { eastMeters, southMeters };
}

/**
 * Computes true-north compass bearing in degrees [0, 360) from GPS point a to b.
 */
export function computeGpsBearingDeg(a: GpsCoord, b: GpsCoord): number {
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const deg = (Math.atan2(y, x) * 180) / Math.PI;
  return (deg + 360) % 360;
}

/**
 * Converts a compass bearing [0, 360) into a human-readable cardinal/intercardinal direction.
 */
export function bearingToCompass(deg: number): string {
  const norm = ((deg % 360) + 360) % 360;
  const dirs = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
  return dirs[Math.round(norm / 45) % 8];
}
