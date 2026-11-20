import * as THREE from 'three';
import { AABB, CAMPUS_NPCS, NpcProfile, TimeOfDayPreset, Vec2 } from '../campus/campusData';
import { getNpcScheduleSlot, resolveCircleAABBCollisions } from '../campus/campusLogic';

export interface ArticulatedHuman {
  root: THREE.Group;
  bodyPivot: THREE.Group;
  headGroup: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
}

export interface NamedNpcEntity {
  profile: NpcProfile;
  rig: ArticulatedHuman;
  position: THREE.Vector3;
  yaw: number;
  target: Vec2;
  walkPhase: number;
  wanderOffset: Vec2;
  wanderTimer: number;
  currentActivity: string;
  isTalking: boolean;
}

interface AmbientWalker {
  rig: ArticulatedHuman;
  waypoints: Vec2[];
  currentWp: number;
  speed: number;
  walkPhase: number;
  pauseTimer: number;
  yaw: number;
}

export interface NpcSystemHandle {
  namedNpcs: NamedNpcEntity[];
  update: (
    dt: number,
    elapsed: number,
    playerPos: THREE.Vector3,
    timeOfDay: TimeOfDayPreset,
    talkingNpcId: string | null,
    colliders: AABB[],
  ) => void;
  getNpcSnapshot: () => Array<{ id: string; name: string; roleCategory: string; x: number; z: number }>;
  dispose: () => void;
}

// Shared reusable geometries for all human figures (keeps draw/memory footprint crisp)
function createSharedHumanGeometries() {
  return {
    head: new THREE.SphereGeometry(0.155, 14, 12),
    hairCap: new THREE.SphereGeometry(0.168, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.56),
    hairLong: new THREE.BoxGeometry(0.32, 0.28, 0.14),
    hairBun: new THREE.SphereGeometry(0.075, 10, 8),
    capBrim: new THREE.CylinderGeometry(0.17, 0.17, 0.025, 12, 1, false, -Math.PI * 0.4, Math.PI * 0.8),
    neck: new THREE.CylinderGeometry(0.055, 0.065, 0.09, 8),
    torso: new THREE.BoxGeometry(0.38, 0.52, 0.22),
    collar: new THREE.BoxGeometry(0.24, 0.07, 0.23),
    lanyard: new THREE.BoxGeometry(0.06, 0.26, 0.235),
    idBadge: new THREE.BoxGeometry(0.075, 0.1, 0.015),
    hips: new THREE.BoxGeometry(0.35, 0.14, 0.21),
    arm: new THREE.CylinderGeometry(0.052, 0.044, 0.48, 8),
    hand: new THREE.SphereGeometry(0.048, 8, 8),
    leg: new THREE.CylinderGeometry(0.068, 0.054, 0.64, 8),
    shoe: new THREE.BoxGeometry(0.11, 0.08, 0.22),
    backpack: new THREE.BoxGeometry(0.28, 0.36, 0.14),
    clipboard: new THREE.BoxGeometry(0.18, 0.24, 0.02),
    glassesFrame: new THREE.BoxGeometry(0.22, 0.045, 0.03),
    shadowDisc: new THREE.CircleGeometry(0.36, 16),
  };
}

export type SharedHumanGeos = ReturnType<typeof createSharedHumanGeometries>;

/**
 * Builds a composite 12+ part articulated 3D human figure pivoted at bottom-center (y = 0)
 * with distinct roughness contrast, clothing, PUP ID lanyard, hair/cap, and contact shadow.
 */
export function buildArticulatedHuman(
  geos: SharedHumanGeos,
  appearance: NpcProfile['appearance'],
  castShadow: boolean,
): ArticulatedHuman {
  const root = new THREE.Group();

  // Contact shadow disc grounded cleanly at y = 0.018
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x0b0a0a,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(geos.shadowDisc, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.018;
  root.add(shadow);

  const skinMat = new THREE.MeshStandardMaterial({ color: appearance.skinTone, roughness: 0.68, metalness: 0.0 });
  const hairMat = new THREE.MeshStandardMaterial({ color: appearance.hairColor, roughness: 0.82, metalness: 0.05 });
  const topMat = new THREE.MeshStandardMaterial({ color: appearance.topColor, roughness: 0.78, metalness: 0.02 });
  const bottomMat = new THREE.MeshStandardMaterial({ color: appearance.bottomColor, roughness: 0.85, metalness: 0.0 });
  const accentMat = new THREE.MeshStandardMaterial({ color: appearance.accentColor, roughness: 0.42, metalness: 0.25 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x201e1d, roughness: 0.52, metalness: 0.1 });

  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  // Legs (pivoted at hip y = 0.74)
  const makeLeg = (xOff: number) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(xOff, 0.74, 0);
    const legMesh = new THREE.Mesh(geos.leg, bottomMat);
    legMesh.position.y = -0.34;
    legMesh.castShadow = castShadow;
    legPivot.add(legMesh);

    const shoe = new THREE.Mesh(geos.shoe, shoeMat);
    shoe.position.set(0, -0.68, 0.045);
    shoe.castShadow = castShadow;
    legPivot.add(shoe);
    return legPivot;
  };
  const leftLeg = makeLeg(-0.1);
  const rightLeg = makeLeg(0.1);
  bodyPivot.add(leftLeg, rightLeg);

  // Hips & Torso
  const hips = new THREE.Mesh(geos.hips, bottomMat);
  hips.position.y = 0.78;
  hips.castShadow = castShadow;
  bodyPivot.add(hips);

  const torso = new THREE.Mesh(geos.torso, topMat);
  torso.position.y = 1.1;
  torso.castShadow = castShadow;
  bodyPivot.add(torso);

  const collar = new THREE.Mesh(geos.collar, accentMat);
  collar.position.y = 1.34;
  bodyPivot.add(collar);

  // PUP ID Lanyard & Badge
  if (appearance.hasLanyard) {
    const lanyard = new THREE.Mesh(geos.lanyard, accentMat);
    lanyard.position.set(0, 1.18, 0.01);
    bodyPivot.add(lanyard);

    const badgeMat = new THREE.MeshStandardMaterial({ color: 0xf7f4ed, roughness: 0.3, metalness: 0.1 });
    const badge = new THREE.Mesh(geos.idBadge, badgeMat);
    badge.position.set(0, 1.0, 0.125);
    bodyPivot.add(badge);
  }

  // Optional Backpack
  if (appearance.hasBackpack) {
    const packMat = new THREE.MeshStandardMaterial({ color: 0x2f2d2c, roughness: 0.82, metalness: 0.05 });
    const pack = new THREE.Mesh(geos.backpack, packMat);
    pack.position.set(0, 1.1, -0.17);
    pack.castShadow = castShadow;
    bodyPivot.add(pack);
  }

  // Arms (pivoted at shoulder y = 1.30)
  const makeArm = (xOff: number, holdClipboard: boolean) => {
    const armPivot = new THREE.Group();
    armPivot.position.set(xOff, 1.3, 0);
    const armMesh = new THREE.Mesh(geos.arm, topMat);
    armMesh.position.y = -0.22;
    armMesh.castShadow = castShadow;
    armPivot.add(armMesh);

    const hand = new THREE.Mesh(geos.hand, skinMat);
    hand.position.y = -0.47;
    armPivot.add(hand);

    if (holdClipboard) {
      const boardMat = new THREE.MeshStandardMaterial({ color: 0x7c5432, roughness: 0.65, metalness: 0.05 });
      const board = new THREE.Mesh(geos.clipboard, boardMat);
      board.position.set(0, -0.44, 0.11);
      board.rotation.x = -0.7;
      armPivot.add(board);
    }
    return armPivot;
  };
  const leftArm = makeArm(-0.255, false);
  const rightArm = makeArm(0.255, Boolean(appearance.hasClipboard));
  bodyPivot.add(leftArm, rightArm);

  // Head group (pivoted at neck y = 1.38)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.38, 0);
  bodyPivot.add(headGroup);

  const neck = new THREE.Mesh(geos.neck, skinMat);
  neck.position.y = 0.04;
  headGroup.add(neck);

  const head = new THREE.Mesh(geos.head, skinMat);
  head.position.y = 0.19;
  head.castShadow = castShadow;
  headGroup.add(head);

  // Hair / Cap silhouette
  if (appearance.hairStyle === 'cap') {
    const capMat = new THREE.MeshStandardMaterial({ color: appearance.bottomColor, roughness: 0.65 });
    const cap = new THREE.Mesh(geos.hairCap, capMat);
    cap.position.y = 0.21;
    headGroup.add(cap);
    const brim = new THREE.Mesh(geos.capBrim, capMat);
    brim.position.set(0, 0.22, 0.09);
    headGroup.add(brim);
  } else {
    const cap = new THREE.Mesh(geos.hairCap, hairMat);
    cap.position.y = 0.2;
    headGroup.add(cap);

    if (appearance.hairStyle === 'long') {
      const backHair = new THREE.Mesh(geos.hairLong, hairMat);
      backHair.position.set(0, 0.12, -0.09);
      headGroup.add(backHair);
    } else if (appearance.hairStyle === 'bun') {
      const bun = new THREE.Mesh(geos.hairBun, hairMat);
      bun.position.set(0, 0.25, -0.15);
      headGroup.add(bun);
    }
  }

  // Optional Glasses
  if (appearance.hasGlasses) {
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x1e2024, roughness: 0.25, metalness: 0.6 });
    const glasses = new THREE.Mesh(geos.glassesFrame, glassMat);
    glasses.position.set(0, 0.2, 0.145);
    headGroup.add(glasses);
  }

  return {
    root,
    bodyPivot,
    headGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
  };
}

export function animateHumanWalk(
  rig: ArticulatedHuman,
  phase: number,
  speedRatio: number,
  elapsed: number,
  isTalking = false,
) {
  const swing = Math.sin(phase) * 0.65 * speedRatio;
  rig.leftLeg.rotation.x = swing;
  rig.rightLeg.rotation.x = -swing;
  rig.leftArm.rotation.x = -swing * 0.8;
  rig.rightArm.rotation.x = isTalking
    ? -0.35 + Math.sin(elapsed * 4.2) * 0.18
    : swing * 0.8;

  // Subtle vertical gait bounce synced to walk cycle
  rig.bodyPivot.position.y = Math.abs(Math.sin(phase)) * 0.045 * speedRatio;
  rig.headGroup.rotation.y = isTalking ? Math.sin(elapsed * 2.1) * 0.12 : 0;
  rig.headGroup.rotation.x = isTalking ? Math.sin(elapsed * 3.4) * 0.05 : 0;
}

// Crisp floating nameplate sprite above named NPCs (drawn on 2D canvas, visible when nearby)
function createNpcLabelSprite(name: string, roleCategory: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 112;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(20, 17, 18, 0.86)';
  ctx.beginPath();
  ctx.roundRect(14, 10, 484, 92, 16);
  ctx.fill();

  ctx.strokeStyle = 'rgba(229, 169, 26, 0.72)';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 32px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name, 256, 52);

  ctx.fillStyle = '#e5a91a';
  ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(roleCategory, 256, 84);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.9, 0.42, 1);
  sprite.position.set(0, 2.08, 0);
  return sprite;
}

const AMBIENT_PATH_LOOPS: Vec2[][] = [
  // Main Boulevard & Catwalk -> Obelisk Ring -> Freedom Park -> Mabini Shrine walk
  [
    { x: 64, z: -9.5 },
    { x: 42, z: -9.5 },
    { x: 24, z: -9.5 },
    { x: 14, z: 6 },
    { x: 26, z: 3 },
    { x: 54, z: 1.5 },
  ],
  // Lagoon Promenade -> NALLRC Forecourt -> Charlie del Rosario -> Lagoon
  [
    { x: -2, z: -14 },
    { x: -12, z: -31 },
    { x: -38, z: -28 },
    { x: -42, z: -10 },
    { x: -36, z: 2 },
    { x: -10, z: -6 },
  ],
  // Freedom Park -> Main Building East Wing -> Interfaith Chapel -> Grandstand Plaza
  [
    { x: 10, z: 14 },
    { x: -11, z: 26 },
    { x: -11, z: 38 },
    { x: 12, z: 32 },
    { x: 22, z: 24 },
  ],
  // Linear Park Pasig Riverfront Promenade
  [
    { x: -65, z: -36 },
    { x: -65, z: -8 },
    { x: -65, z: 24 },
    { x: -65, z: 48 },
    { x: -63, z: 10 },
  ],
  // Catwalk North -> Gym & Courts -> NALLRC East -> Obelisk North
  [
    { x: 48, z: -16 },
    { x: 44, z: -31 },
    { x: 20, z: -31 },
    { x: 4, z: -24 },
    { x: 22, z: -14 },
  ],
  // Southeastern Oval Track Joggers Loop (tilted NE-SW around (44, 40))
  [
    { x: 30, z: 38 },
    { x: 44, z: 28 },
    { x: 58, z: 40 },
    { x: 44, z: 52 },
  ],
];

const AMBIENT_TOP_COLORS = ['#7b1113', '#f0ece3', '#2e4c73', '#d99b1e', '#3c6e57', '#4a4a52', '#8e2d31'];
const AMBIENT_SKIN_TONES = ['#d8a684', '#c78f68', '#b87d56', '#e0b494'];

export function createNpcSystem(scene: THREE.Scene, castShadow: boolean): NpcSystemHandle {
  const group = new THREE.Group();
  group.name = 'PUP_Living_NPCs';
  scene.add(group);

  const geos = createSharedHumanGeometries();
  const namedNpcs: NamedNpcEntity[] = [];
  const labelSprites: THREE.Sprite[] = [];

  for (const profile of CAMPUS_NPCS) {
    const rig = buildArticulatedHuman(geos, profile.appearance, castShadow);
    rig.root.position.set(profile.spawn.x, 0, profile.spawn.z);
    const label = createNpcLabelSprite(profile.name, profile.roleCategory);
    rig.root.add(label);
    labelSprites.push(label);
    group.add(rig.root);

    namedNpcs.push({
      profile,
      rig,
      position: new THREE.Vector3(profile.spawn.x, 0, profile.spawn.z),
      yaw: 0,
      target: { ...profile.spawn },
      walkPhase: Math.random() * Math.PI * 2,
      wanderOffset: { x: 0, z: 0 },
      wanderTimer: 3 + Math.random() * 6,
      currentActivity: profile.schedule.morning.activity,
      isTalking: false,
    });
  }

  // Populate 18 ambient Iskolar ng Bayan students distributed evenly across campus pathways
  const ambientWalkers: AmbientWalker[] = [];
  for (let i = 0; i < 18; i++) {
    const loopIdx = i % AMBIENT_PATH_LOOPS.length;
    const rankInLoop = Math.floor(i / AMBIENT_PATH_LOOPS.length); // 0, 1, or 2
    const loop = AMBIENT_PATH_LOOPS[loopIdx];
    const frac = (rankInLoop / 3 + 0.12) % 1;
    const exactIdx = frac * loop.length;
    const segIdx = Math.floor(exactIdx) % loop.length;
    const nextIdx = (segIdx + 1) % loop.length;
    const segT = exactIdx - Math.floor(exactIdx);
    const a = loop[segIdx];
    const b = loop[nextIdx];

    const rig = buildArticulatedHuman(
      geos,
      {
        skinTone: AMBIENT_SKIN_TONES[i % AMBIENT_SKIN_TONES.length],
        hairColor: i % 5 === 0 ? '#2b221e' : '#191716',
        hairStyle: i % 3 === 0 ? 'long' : i % 3 === 1 ? 'short' : 'bun',
        topColor: AMBIENT_TOP_COLORS[i % AMBIENT_TOP_COLORS.length],
        bottomColor: i % 2 === 0 ? '#263040' : '#2f2d2b',
        accentColor: i % 2 === 0 ? '#7b1113' : '#e5a91a',
        hasBackpack: true,
        hasLanyard: true,
      },
      false,
    );
    const startX = a.x + (b.x - a.x) * segT;
    const startZ = a.z + (b.z - a.z) * segT;
    rig.root.position.set(startX, 0, startZ);
    group.add(rig.root);

    ambientWalkers.push({
      rig,
      waypoints: loop,
      currentWp: nextIdx,
      speed: loop === AMBIENT_PATH_LOOPS[5] ? 3.2 : 1.55 + (i % 4) * 0.22,
      walkPhase: i * 1.1,
      pauseTimer: 0,
      yaw: Math.atan2(b.x - a.x, b.z - a.z),
    });
  }

  function dampAngle(current: number, target: number, lambda: number, dt: number): number {
    let diff = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (diff < -Math.PI) diff += Math.PI * 2;
    return current + diff * (1 - Math.exp(-lambda * dt));
  }

  return {
    namedNpcs,
    update(dt, elapsed, playerPos, timeOfDay, talkingNpcId, colliders) {
      // 1. Update named intelligent NPCs
      for (let i = 0; i < namedNpcs.length; i++) {
        const npc = namedNpcs[i];
        const slot = getNpcScheduleSlot(npc.profile, timeOfDay);
        npc.currentActivity = slot.activity;
        npc.isTalking = talkingNpcId === npc.profile.id;

        const distToPlayer = Math.hypot(
          playerPos.x - npc.position.x,
          playerPos.z - npc.position.z,
        );

        // Show nameplate smoothly only when within 18m
        const label = labelSprites[i];
        label.visible = distToPlayer < 18;
        if (label.visible) {
          (label.material as THREE.SpriteMaterial).opacity = THREE.MathUtils.clamp(
            1 - (distToPlayer - 11) / 7,
            0.15,
            1,
          );
        }

        // Periodic gentle local stroll near their scheduled post so they feel alive
        npc.wanderTimer -= dt;
        if (npc.wanderTimer <= 0 && !npc.isTalking) {
          npc.wanderTimer = 5 + Math.random() * 6;
          const angle = Math.random() * Math.PI * 2;
          const rad = 1.2 + Math.random() * 2.0;
          npc.wanderOffset.x = Math.cos(angle) * rad;
          npc.wanderOffset.z = Math.sin(angle) * rad;
        }

        const goalX = slot.position.x + npc.wanderOffset.x;
        const goalZ = slot.position.z + npc.wanderOffset.z;
        const dx = goalX - npc.position.x;
        const dz = goalZ - npc.position.z;
        const distGoal = Math.hypot(dx, dz);

        let speedRatio = 0;

        if (npc.isTalking || distToPlayer < 3.6) {
          // Turn politely toward the player when approached or in conversation
          const faceYaw = Math.atan2(playerPos.x - npc.position.x, playerPos.z - npc.position.z);
          npc.yaw = dampAngle(npc.yaw, faceYaw, 7, dt);
        } else if (distGoal > 0.35) {
          // Walk smoothly toward scheduled station (teleport only if across entire campus after time-of-day jump)
          if (distGoal > 45) {
            npc.position.set(slot.position.x, 0, slot.position.z);
          } else {
            const moveSpeed = 1.85;
            const step = Math.min(distGoal, moveSpeed * dt);
            const nextX = npc.position.x + (dx / distGoal) * step;
            const nextZ = npc.position.z + (dz / distGoal) * step;
            const resolved = resolveCircleAABBCollisions(nextX, nextZ, 0.35, colliders);
            npc.position.x = resolved.x;
            npc.position.z = resolved.z;

            const moveYaw = Math.atan2(dx, dz);
            npc.yaw = dampAngle(npc.yaw, moveYaw, 6, dt);
            npc.walkPhase += step * 4.5;
            speedRatio = 1;
          }
        }

        npc.rig.root.position.set(npc.position.x, 0, npc.position.z);
        npc.rig.root.rotation.y = npc.yaw;
        animateHumanWalk(npc.rig, npc.walkPhase, speedRatio, elapsed + i, npc.isTalking);
      }

      // 2. Update ambient student walkers
      for (let i = 0; i < ambientWalkers.length; i++) {
        const w = ambientWalkers[i];
        if (w.pauseTimer > 0) {
          w.pauseTimer -= dt;
          animateHumanWalk(w.rig, w.walkPhase, 0, elapsed + i * 0.7, false);
          continue;
        }
        const target = w.waypoints[w.currentWp];
        const dx = target.x - w.rig.root.position.x;
        const dz = target.z - w.rig.root.position.z;
        const dist = Math.hypot(dx, dz);

        if (dist < 0.8) {
          w.currentWp = (w.currentWp + 1) % w.waypoints.length;
          if (Math.random() < 0.35) {
            w.pauseTimer = 1.5 + Math.random() * 3.0;
          }
        } else {
          const step = Math.min(dist, w.speed * dt);
          w.rig.root.position.x += (dx / dist) * step;
          w.rig.root.position.z += (dz / dist) * step;
          const moveYaw = Math.atan2(dx, dz);
          w.yaw = dampAngle(w.yaw, moveYaw, 5, dt);
          w.rig.root.rotation.y = w.yaw;
          w.walkPhase += step * 4.6;
          animateHumanWalk(w.rig, w.walkPhase, 1, elapsed + i, false);
        }
      }
    },
    getNpcSnapshot() {
      return namedNpcs.map((n) => ({
        id: n.profile.id,
        name: n.profile.name,
        roleCategory: n.profile.roleCategory,
        x: n.position.x,
        z: n.position.z,
      }));
    },
    dispose() {
      Object.values(geos).forEach((g) => g.dispose());
      labelSprites.forEach((s) => {
        (s.material as THREE.SpriteMaterial).map?.dispose();
        s.material.dispose();
      });
      scene.remove(group);
    },
  };
}
