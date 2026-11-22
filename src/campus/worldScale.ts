import type { AABB, Vec2 } from './campusData';

/**
 * Google Maps WGS84 calibrated scale factors converting PUP blueprint coordinates
 * into true real-world meters:
 * - Main Gate -> Old Sta. Mesa (Stop & Shop): ~214m (Google Maps: 215m)
 * - Main Gate -> PUP Obelisk: ~115m (Google Maps: ~118–130m)
 * - Main Gate -> Main Building Dome: ~188m straight / ~230m walking path
 * - Main Gate -> Barangay 630 Hall / Maui Oasis curve: ~165m
 *
 * Vertical scale (1.18) preserves authentic grand 3.8m university floor heights
 * while keeping human avatars & NPCs at true 1:1 scale (~1.72m).
 */
export const CAMPUS_XZ_SCALE = 1.62;
export const CAMPUS_Y_SCALE = 1.18;

/**
 * Width compensation multiplier for addSignMesh so signage text preserves
 * its exact 1:1 visual aspect ratio inside the XZ/Y scaled blueprint root.
 */
export const SIGN_ASPECT_COMPENSATION = CAMPUS_Y_SCALE / CAMPUS_XZ_SCALE;

export function scaleWorldX(x: number): number {
  return Number((x * CAMPUS_XZ_SCALE).toFixed(3));
}

export function scaleWorldZ(z: number): number {
  return Number((z * CAMPUS_XZ_SCALE).toFixed(3));
}

export function scaleWorldY(y: number): number {
  return Number((y * CAMPUS_Y_SCALE).toFixed(3));
}

export function scaleWorldPoint(pt: Vec2): Vec2 {
  return {
    x: scaleWorldX(pt.x),
    z: scaleWorldZ(pt.z),
  };
}

export function unscaleWorldPoint(pt: Vec2): Vec2 {
  return {
    x: pt.x / CAMPUS_XZ_SCALE,
    z: pt.z / CAMPUS_XZ_SCALE,
  };
}

export function scaleWorldBounds(bounds: {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}): { minX: number; maxX: number; minZ: number; maxZ: number } {
  return {
    minX: scaleWorldX(bounds.minX),
    maxX: scaleWorldX(bounds.maxX),
    minZ: scaleWorldZ(bounds.minZ),
    maxZ: scaleWorldZ(bounds.maxZ),
  };
}

export function createScaledAABB(id: string, cx: number, cz: number, w: number, d: number): AABB {
  const scx = cx * CAMPUS_XZ_SCALE;
  const scz = cz * CAMPUS_XZ_SCALE;
  const sw = w * CAMPUS_XZ_SCALE;
  const sd = d * CAMPUS_XZ_SCALE;
  return {
    id,
    minX: scx - sw / 2,
    maxX: scx + sw / 2,
    minZ: scz - sd / 2,
    maxZ: scz + sd / 2,
  };
}

export function createScaledOBB(
  id: string,
  cx: number,
  cz: number,
  w: number,
  d: number,
  rotY: number,
): AABB {
  const scx = cx * CAMPUS_XZ_SCALE;
  const scz = cz * CAMPUS_XZ_SCALE;
  const halfW = (w * CAMPUS_XZ_SCALE) / 2;
  const halfD = (d * CAMPUS_XZ_SCALE) / 2;
  const c = Math.abs(Math.cos(rotY));
  const s = Math.abs(Math.sin(rotY));
  const extX = halfW * c + halfD * s;
  const extZ = halfW * s + halfD * c;
  return {
    id,
    minX: scx - extX,
    maxX: scx + extX,
    minZ: scz - extZ,
    maxZ: scz + extZ,
    cx: scx,
    cz: scz,
    halfW,
    halfD,
    rotY,
  };
}
