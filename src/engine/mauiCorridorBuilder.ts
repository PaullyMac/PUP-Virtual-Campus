import * as THREE from 'three';
import {
  computeBarangay630Footprints,
  computeBoulevardWorldPoint,
  computeMauiCorridorPoles,
  computeMauiSpeedHumps,
  computeWestAnonasFootprints,
  MAUI_CORRIDOR_CONFIG,
} from '../campus/mauiCorridorGeometry';
import { CampusTextureSet, createSignTexture } from './textures';

export interface MauiCorridorBuilderDeps {
  parent: THREE.Group;
  textures: CampusTextureSet;
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T;
  trackMat: <T extends THREE.Material>(m: T) => T;
  addBox: (
    parent: THREE.Object3D,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    mat: THREE.Material,
    shadows?: boolean,
  ) => THREE.Mesh;
  addCollider: (id: string, cx: number, cz: number, w: number, d: number) => void;
  addOBBCollider: (id: string, cx: number, cz: number, w: number, d: number, rotY: number) => void;
  addSignMesh: (
    parent: THREE.Object3D,
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
    rotY: number,
    title: string,
    subtitle: string,
    opts?: Parameters<typeof createSignTexture>[2],
  ) => THREE.Mesh;
  createAnimatedWaterMaterial: (baseHex: number, rippleScale: number) => THREE.MeshStandardMaterial;
  animatedFlags: THREE.Mesh[];
  waterMeshes: THREE.Mesh[];
  mats: {
    matSidewalkConc: THREE.Material;
    matAsphalt: THREE.Material;
    matRawConcrete: THREE.Material;
    matCreamWall: THREE.Material;
    matBrightWhite: THREE.Material;
    matMaroon: THREE.Material;
    matGold: THREE.Material;
    matGlass: THREE.Material;
    matDarkSteel: THREE.Material;
    matSilverSteel: THREE.Material;
    matWood: THREE.Material;
    matManilaBlue: THREE.Material;
    matManilaYellow: THREE.Material;
    matTrikeRed: THREE.Material;
    matTrikeBlue: THREE.Material;
    matTrikeGreen: THREE.Material;
    matTreeTrunk: THREE.Material;
    matTreeFoliage: THREE.Material;
    matCable: THREE.Material;
    matTeresaBulb: THREE.Material;
    matWindowGlow: THREE.Material;
    matDormOchre: THREE.Material;
    matUmbrellaRed: THREE.Material;
    matUmbrellaOrange: THREE.Material;
    matGrass: THREE.Material;
  };
}

/**
 * Builds the full-length South Anonas / Barangay 630 Street (z = 52..174)
 * and the far-south sweeping Maui Oasis by Filinvest, Futura Centro & El Pueblo Manila
 * divided boulevard (~140m+ south of PUP's Track & Field Oval).
 */
export function buildMauiCorridor(deps: MauiCorridorBuilderDeps): void {
  const {
    parent,
    textures,
    trackGeo,
    trackMat,
    addBox,
    addCollider,
    addOBBCollider,
    addSignMesh,
    createAnimatedWaterMaterial,
    animatedFlags,
    waterMeshes,
    mats,
  } = deps;

  const {
    matSidewalkConc,
    matAsphalt,
    matRawConcrete,
    matCreamWall,
    matBrightWhite,
    matMaroon,
    matGold,
    matGlass,
    matDarkSteel,
    matSilverSteel,
    matWood,
    matManilaBlue,
    matManilaYellow,
    matTrikeRed,
    matTrikeBlue,
    matTrikeGreen,
    matTreeTrunk,
    matTreeFoliage,
    matCable,
    matTeresaBulb,
    matWindowGlow,
    matDormOchre,
    matUmbrellaRed,
    matUmbrellaOrange,
    matGrass,
  } = mats;

  const mauiPathGroup = new THREE.Group();
  parent.add(mauiPathGroup);

  const matWeatheredMossWall = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.weatheredWall,
      bumpMap: textures.concreteBump,
      bumpScale: 0.06,
      roughness: 0.9,
      metalness: 0.02,
    }),
  );
  const matVineLush = trackMat(new THREE.MeshStandardMaterial({ color: 0x2c5c26, roughness: 0.88 }));
  const matVineBright = trackMat(new THREE.MeshStandardMaterial({ color: 0x457d32, roughness: 0.86 }));
  const matCondoCream = trackMat(new THREE.MeshStandardMaterial({ color: 0xebe1cf, roughness: 0.78 }));
  const matCondoStone = trackMat(new THREE.MeshStandardMaterial({ color: 0x9b8972, roughness: 0.88 }));
  const matCondoTerra = trackMat(new THREE.MeshStandardMaterial({ color: 0xc26d4f, roughness: 0.82 }));
  const matCondoRoof = trackMat(new THREE.MeshStandardMaterial({ color: 0x5c3627, roughness: 0.78 }));
  const matCondoBalconyGreen = trackMat(new THREE.MeshStandardMaterial({ color: 0x244734, roughness: 0.65, metalness: 0.25 }));
  const matFuturaGray = trackMat(new THREE.MeshStandardMaterial({ color: 0xc8d0d8, roughness: 0.72 }));
  const matFuturaBlueGray = trackMat(new THREE.MeshStandardMaterial({ color: 0x6f8296, roughness: 0.68 }));
  const matBrgy630Blue = trackMat(new THREE.MeshStandardMaterial({ color: 0x1652a8, roughness: 0.56 }));
  const matAlfamartRed = trackMat(new THREE.MeshStandardMaterial({ color: 0xd4222a, roughness: 0.48 }));
  const matClinicTeal = trackMat(new THREE.MeshStandardMaterial({ color: 0x1c7c7d, roughness: 0.58 }));
  const matServiceGateGreen = trackMat(new THREE.MeshStandardMaterial({ color: 0x2a5436, roughness: 0.62, metalness: 0.35 }));
  const matBakeryOrange = trackMat(new THREE.MeshStandardMaterial({ color: 0xd97324, roughness: 0.62 }));
  const matMintStall = trackMat(new THREE.MeshStandardMaterial({ color: 0x3b8c66, roughness: 0.68 }));
  const matWarmStucco = trackMat(new THREE.MeshStandardMaterial({ color: 0xdfd3be, roughness: 0.84 }));
  const matAquaJug = trackMat(new THREE.MeshStandardMaterial({ color: 0x2994d1, roughness: 0.28, metalness: 0.1 }));
  const matMauiPoolWater = trackMat(createAnimatedWaterMaterial(0x28b8d6, 2.4));

  const shrubGeo = trackGeo(new THREE.DodecahedronGeometry(0.42, 0));
  const canopyGeo = trackGeo(new THREE.DodecahedronGeometry(1.45, 1));
  const tireGeo = trackGeo(new THREE.TorusGeometry(0.32, 0.12, 6, 12));
  const jugGeo = trackGeo(new THREE.CylinderGeometry(0.16, 0.17, 0.44, 8));

  const buildStreetTrike = (x: number, z: number, rotY: number, bodyMat: THREE.Material) => {
    const trike = new THREE.Group();
    trike.position.set(x, 0, z);
    trike.rotation.y = rotY;
    addBox(trike, 0.92, 1.12, 1.52, 0.42, 0.82, 0, bodyMat, false);
    addBox(trike, 0.98, 0.1, 1.62, 0.42, 1.44, 0, matDarkSteel, false);
    addBox(trike, 0.34, 0.72, 1.45, -0.35, 0.58, 0, matDarkSteel, false);
    addBox(trike, 0.24, 0.24, 0.08, -0.35, 0.86, 0.74, matGold, false);
    for (const [wx, wz] of [
      [-0.35, 0.58],
      [-0.35, -0.58],
      [0.72, -0.45],
    ]) {
      addBox(trike, 0.14, 0.46, 0.46, wx, 0.23, wz, matDarkSteel, false);
    }
    mauiPathGroup.add(trike);
  };

  const buildStreetTree = (container: THREE.Object3D, x: number, z: number, scale = 1.0) => {
    const trunk = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.16 * scale, 0.24 * scale, 2.6 * scale, 6)),
      matTreeTrunk,
    );
    trunk.position.set(x, 1.3 * scale, z);
    container.add(trunk);
    const c1 = new THREE.Mesh(canopyGeo, matTreeFoliage);
    c1.scale.set(1.15 * scale, 0.85 * scale, 1.1 * scale);
    c1.position.set(x, 3.2 * scale, z);
    container.add(c1);
    const c2 = new THREE.Mesh(canopyGeo, matVineBright);
    c2.scale.set(0.85 * scale, 0.72 * scale, 0.9 * scale);
    c2.position.set(x + 0.55 * scale, 3.65 * scale, z - 0.35 * scale);
    container.add(c2);
  };

  // 1. Overhanging roadside shrubs along PUP Oval wall plinth (z = 30..77.5)
  for (let bz = 30.0; bz <= 77.5; bz += 4.2) {
    if (bz > 51.5 && bz < 64.5) continue;
    const tuftA = new THREE.Mesh(shrubGeo, Math.round(bz) % 2 === 0 ? matVineLush : matVineBright);
    tuftA.scale.set(1.1, 0.72, 1.45);
    tuftA.position.set(83.25, 0.28, bz);
    mauiPathGroup.add(tuftA);
  }

  // 2. Full-length South Anonas East & West Sidewalks + Manila Blue-and-Yellow Curbstones (z = 52..172)
  addBox(mauiPathGroup, 2.6, 0.15, 120.0, 96.5, 0.075, 112.0, matSidewalkConc, false);
  addBox(mauiPathGroup, 2.3, 0.15, 86.0, 84.55, 0.075, 128.0, matSidewalkConc, false);
  for (let cz = 52.5; cz <= 169.5; cz += 1.2) {
    const isBlue = Math.round(cz) % 2 === 0;
    addBox(mauiPathGroup, 0.24, 0.19, 1.05, 95.32, 0.095, cz, isBlue ? matManilaBlue : matManilaYellow, false);
    if (cz >= 85.0 && cz <= 168.0) {
      addBox(mauiPathGroup, 0.24, 0.19, 1.05, 85.62, 0.095, cz, isBlue ? matManilaYellow : matManilaBlue, false);
    }
  }
  // Parked tricycles along the northern half of South Anonas (near PUP Oval Gate)
  buildStreetTrike(94.1, 61.5, Math.PI, matTrikeRed);
  buildStreetTrike(94.1, 66.2, Math.PI, matTrikeBlue);

  // 3. EAST-SIDE SOUTH ANONAS / BARANGAY 630 ZONE 63 BUILDINGS (All 9 non-overlapping footprints!)
  const [
    alfaFp,
    brgyFp,
    courtFp,
    healthFp,
    barberFp,
    bigasanFp,
    vulcFp,
    bakeryFp,
    dormSouthFp,
  ] = computeBarangay630Footprints();

  // (i) ALFAMART ANONAS (z = 74.2)
  const alfaGrp = new THREE.Group();
  alfaGrp.position.set(alfaFp.x, 0, alfaFp.z);
  addBox(alfaGrp, alfaFp.width, 4.4, alfaFp.depth, 0, 2.2, 0, matBrightWhite, true);
  addBox(alfaGrp, 0.18, 0.46, alfaFp.depth + 0.2, -alfaFp.width / 2 - 0.05, 4.18, 0, matAlfamartRed, false);
  addBox(alfaGrp, 0.18, 0.22, alfaFp.depth + 0.2, -alfaFp.width / 2 - 0.05, 3.84, 0, matManilaYellow, false);
  addBox(alfaGrp, 0.18, 0.2, alfaFp.depth + 0.2, -alfaFp.width / 2 - 0.05, 3.62, 0, matBrgy630Blue, false);
  addBox(alfaGrp, 0.14, 2.4, alfaFp.depth * 0.68, -alfaFp.width / 2 - 0.03, 1.45, 0.25, matGlass, false);
  addBox(alfaGrp, 0.45, 1.45, 0.9, -alfaFp.width / 2 - 0.18, 0.95, -2.55, matBrgy630Blue, false);
  addBox(alfaGrp, 0.55, 0.55, 0.72, -alfaFp.width / 2 - 0.28, 0.34, 2.75, matAlfamartRed, false);
  addSignMesh(alfaGrp, 5.2, 0.92, -alfaFp.width / 2 - 0.16, 4.02, 0, -Math.PI / 2, 'Alfamart', 'ANONAS ST. · BRGY. 630 · 24 HRS', {
    bg: '#d4222a',
    border: '#ebb91b',
    titleColor: '#ffffff',
    subtitleColor: '#fff2b8',
  });
  mauiPathGroup.add(alfaGrp);
  addCollider(alfaFp.id, alfaFp.x, alfaFp.z, alfaFp.width + 0.5, alfaFp.depth + 0.5);

  // (ii) BARANGAY 630 ZONE 63 HALL + TANOD OUTPOST + FLAGPOLE + PATROL MULTICAB (z = 84.5)
  const brgyHallGrp = new THREE.Group();
  brgyHallGrp.position.set(brgyFp.x, 0, brgyFp.z);
  addBox(brgyHallGrp, brgyFp.width, 6.9, brgyFp.depth, 0, 3.45, 0, matBrightWhite, true);
  addBox(brgyHallGrp, brgyFp.width + 0.14, 1.35, brgyFp.depth + 0.14, 0, 0.98, 0, matBrgy630Blue, false);
  addBox(brgyHallGrp, brgyFp.width + 0.24, 0.36, brgyFp.depth + 0.24, 0, 6.88, 0, matBrgy630Blue, false);
  addBox(brgyHallGrp, brgyFp.width + 0.28, 0.18, brgyFp.depth + 0.28, 0, 3.45, 0, matManilaYellow, false);
  addBox(brgyHallGrp, 0.18, 1.65, 6.8, -brgyFp.width / 2 - 0.04, 4.95, 0, matWindowGlow, false);
  for (let gz = -3.2; gz <= 3.2; gz += 0.8) {
    addBox(brgyHallGrp, 0.05, 1.05, 0.05, -brgyFp.width / 2 - 0.16, 4.15, gz, matSilverSteel, false);
  }
  addBox(brgyHallGrp, 0.08, 0.08, 6.8, -brgyFp.width / 2 - 0.16, 4.65, 0, matSilverSteel, false);
  // Entry overhang canopy + twin columns + Tanod Outpost desk
  addBox(brgyHallGrp, 1.65, 0.2, 7.2, -brgyFp.width / 2 - 0.78, 3.25, 0, matBrgy630Blue, false);
  for (const cz of [-3.3, 3.3]) {
    addBox(brgyHallGrp, 0.18, 3.15, 0.18, -brgyFp.width / 2 - 1.42, 1.65, cz, matBrgy630Blue, false);
  }
  addBox(brgyHallGrp, 0.14, 2.35, 3.2, -brgyFp.width / 2 - 0.04, 1.35, -0.5, matGlass, false);
  addBox(brgyHallGrp, 0.75, 1.05, 2.1, -brgyFp.width / 2 - 0.55, 0.58, 2.5, matCreamWall, false);
  addSignMesh(brgyHallGrp, 6.6, 1.15, -brgyFp.width / 2 - 0.16, 6.18, 0, -Math.PI / 2, 'BARANGAY 630 · ZONE 63', 'DISTRICT VI · STA. MESA, MANILA', {
    bg: '#144a9c',
    border: '#ebb91b',
    titleColor: '#ffffff',
    subtitleColor: '#fde58a',
  });
  addSignMesh(brgyHallGrp, 2.4, 0.58, -brgyFp.width / 2 - 1.56, 2.85, 2.45, -Math.PI / 2, 'TANOD OUTPOST', '24/7 PEACE & ORDER', {
    bg: '#0f2c5c',
    border: '#ffffff',
    titleColor: '#ffffff',
    subtitleColor: '#cbdcf7',
  });
  // Animated Philippine flagpole in front of Barangay Hall
  addBox(brgyHallGrp, 0.48, 0.38, 0.48, -brgyFp.width / 2 - 1.25, 0.19, -4.35, matBrgy630Blue, false);
  const brgyPole = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.04, 0.055, 7.4, 8)), matSilverSteel);
  brgyPole.position.set(-brgyFp.width / 2 - 1.25, 3.88, -4.35);
  brgyHallGrp.add(brgyPole);
  const brgyFlagMesh = addBox(brgyHallGrp, 0.03, 0.42, 1.32, -brgyFp.width / 2 - 1.25, 7.26, -3.69, matBrgy630Blue, false);
  addBox(brgyHallGrp, 0.03, 0.42, 1.32, -brgyFp.width / 2 - 1.25, 6.84, -3.69, matAlfamartRed, false);
  addBox(brgyHallGrp, 0.04, 0.84, 0.36, -brgyFp.width / 2 - 1.25, 7.05, -4.17, matBrightWhite, false);
  animatedFlags.push(brgyFlagMesh);
  for (const bz of [-3.6, 4.1]) {
    addBox(brgyHallGrp, 0.12, 0.92, 1.55, -brgyFp.width / 2 - 1.75, 0.46, bz, matBrgy630Blue, false);
  }
  mauiPathGroup.add(brgyHallGrp);
  addCollider(brgyFp.id, brgyFp.x, brgyFp.z, brgyFp.width + 0.5, brgyFp.depth + 0.5);

  // Barangay 630 Patrol Multicab parked at curb in front of Barangay Hall
  const patrolCab = new THREE.Group();
  patrolCab.position.set(94.1, 0, 84.5);
  addBox(patrolCab, 1.62, 0.52, 3.65, 0, 0.46, 0, matBrightWhite, false);
  addBox(patrolCab, 1.64, 0.34, 1.58, 0, 0.56, -1.02, matBrgy630Blue, false);
  addBox(patrolCab, 1.52, 0.78, 1.32, 0, 1.12, -1.02, matBrightWhite, false);
  addBox(patrolCab, 1.46, 0.5, 0.1, 0, 1.18, -1.68, matGlass, false);
  addBox(patrolCab, 1.62, 0.62, 2.08, 0, 0.68, 0.76, matBrgy630Blue, false);
  addBox(patrolCab, 1.58, 0.1, 2.12, 0, 1.65, 0.76, matBrightWhite, false);
  addBox(patrolCab, 0.78, 0.16, 0.24, 0, 1.58, -1.0, matAlfamartRed, false);
  addSignMesh(patrolCab, 1.85, 0.38, -0.84, 0.72, 0.75, -Math.PI / 2, 'BRGY. 630 PATROL', 'EMERGENCY RESPONSE', {
    bg: '#1652a8',
    border: '#ebb91b',
    titleColor: '#ffffff',
    subtitleColor: '#fde58a',
  });
  mauiPathGroup.add(patrolCab);
  addCollider('brgy630-patrol-cab', 94.1, 84.5, 1.9, 3.9);

  // (iii) BARANGAY 630 MULTI-PURPOSE COVERED COURT (behind Hall at x = 112.0, z = 84.5)
  const courtGrp = new THREE.Group();
  courtGrp.position.set(courtFp.x, 0, courtFp.z);
  addBox(courtGrp, courtFp.width, 0.14, courtFp.depth, 0, 0.07, 0, matBrgy630Blue, false);
  addBox(courtGrp, courtFp.width - 1.2, 0.15, courtFp.depth - 1.4, 0, 0.08, 0, matCondoTerra, false);
  for (const cx of [-courtFp.width / 2 + 0.3, courtFp.width / 2 - 0.3]) {
    for (const cz of [-courtFp.depth / 2 + 0.4, 0, courtFp.depth / 2 - 0.4]) {
      addBox(courtGrp, 0.26, 5.4, 0.26, cx, 2.7, cz, matBrgy630Blue, false);
    }
  }
  const courtRoof = new THREE.Mesh(
    trackGeo(
      new THREE.CylinderGeometry(
        courtFp.width * 0.56,
        courtFp.width * 0.56,
        courtFp.depth + 0.8,
        12,
        1,
        true,
        -Math.PI / 2.2,
        Math.PI / 1.1,
      ),
    ),
    matSilverSteel,
  );
  courtRoof.rotation.x = Math.PI / 2;
  courtRoof.scale.set(1, 1, 0.42);
  courtRoof.position.set(0, 4.65, 0);
  courtGrp.add(courtRoof);
  addBox(courtGrp, 0.16, 3.6, 0.16, 3.8, 1.8, 0, matDarkSteel, false);
  addBox(courtGrp, 0.08, 1.05, 1.55, 3.45, 3.3, 0, matBrightWhite, false);
  addBox(courtGrp, 0.42, 0.06, 0.42, 3.15, 2.95, 0, matAlfamartRed, false);
  mauiPathGroup.add(courtGrp);
  addCollider(courtFp.id, courtFp.x, courtFp.z, courtFp.width + 0.4, courtFp.depth + 0.4);

  // (iv) BARANGAY 630 HEALTH CENTER & SK ANNEX (z = 96.5)
  const healthGrp = new THREE.Group();
  healthGrp.position.set(healthFp.x, 0, healthFp.z);
  addBox(healthGrp, healthFp.width, 6.2, healthFp.depth, 0, 3.1, 0, matBrightWhite, true);
  addBox(healthGrp, healthFp.width + 0.16, 1.15, healthFp.depth + 0.16, 0, 0.68, 0, matClinicTeal, false);
  addBox(healthGrp, healthFp.width + 0.22, 0.34, healthFp.depth + 0.22, 0, 6.2, 0, matClinicTeal, false);
  addBox(healthGrp, 0.14, 2.3, 4.4, -healthFp.width / 2 - 0.04, 1.38, 0, matGlass, false);
  addBox(healthGrp, 0.14, 1.5, 5.4, -healthFp.width / 2 - 0.04, 4.45, 0, matWindowGlow, false);
  addBox(healthGrp, 1.4, 0.16, 5.2, -healthFp.width / 2 - 0.65, 2.95, 0, matClinicTeal, false);
  addBox(healthGrp, 0.12, 0.82, 0.24, -healthFp.width / 2 - 0.08, 5.55, -3.2, matAlfamartRed, false);
  addBox(healthGrp, 0.12, 0.24, 0.82, -healthFp.width / 2 - 0.08, 5.55, -3.2, matAlfamartRed, false);
  addSignMesh(healthGrp, 5.8, 0.96, -healthFp.width / 2 - 0.14, 3.52, 0.3, -Math.PI / 2, 'BRGY. 630 HEALTH CENTER', 'SANGGUNIANG KABATAAN ANNEX', {
    bg: '#136b6c',
    border: '#ffffff',
    titleColor: '#ffffff',
    subtitleColor: '#d7f7f7',
  });
  mauiPathGroup.add(healthGrp);
  addCollider(healthFp.id, healthFp.x, healthFp.z, healthFp.width + 0.5, healthFp.depth + 0.5);

  // (v) KALYE ESKINITA — AUTHENTIC NARROW BARANGAY 630 SIDE ALLEY ARCH (z = 103.8)
  const alleyGrp = new THREE.Group();
  alleyGrp.position.set(98.4, 0, 103.8);
  for (const az of [-2.05, 2.05]) {
    addBox(alleyGrp, 0.18, 4.1, 0.18, 0, 2.05, az, matBrgy630Blue, false);
  }
  addBox(alleyGrp, 0.2, 0.22, 4.3, 0, 4.05, 0, matManilaYellow, false);
  addSignMesh(alleyGrp, 3.8, 0.64, -0.14, 3.85, 0, -Math.PI / 2, 'KALYE ESKINITA · BRGY. 630', 'INTERIOR RESIDENTIAL ALLEY', {
    bg: '#1652a8',
    border: '#ebb91b',
    titleColor: '#ffffff',
    subtitleColor: '#fde58a',
  });
  addBox(alleyGrp, 18.0, 0.08, 4.4, 9.0, 0.04, 0, matSidewalkConc, false);
  addBox(alleyGrp, 5.6, 5.6, 7.0, 15.5, 2.8, 0, matWarmStucco, false);
  addBox(alleyGrp, 0.12, 1.4, 2.8, 12.66, 3.8, 0, matWindowGlow, false);
  mauiPathGroup.add(alleyGrp);
  addCollider('eskinita-end-house', 113.9, 103.8, 5.8, 7.2);

  // Reusable helper for East & West South Anonas Neighborhood Shophouses & Student Dorms
  const addAnonasShophouse = (
    fp: { id: string; x: number; z: number; width: number; depth: number; side: 'east' | 'west' },
    floors: number,
    wallMat: THREE.Material,
    trimMat: THREE.Material,
    title: string,
    subtitle: string,
    signBg: string,
    kind: 'barber' | 'bigasan' | 'vulc' | 'bakery' | 'dorm' | 'carinderia' | 'water' | 'hardware',
  ) => {
    const grp = new THREE.Group();
    grp.position.set(fp.x, 0, fp.z);
    const dir = fp.side === 'east' ? -1 : 1;
    const faceX = dir * (fp.width / 2);
    const signRotY = fp.side === 'east' ? -Math.PI / 2 : Math.PI / 2;
    const h = floors * 3.15 + 0.4;

    addBox(grp, fp.width, h, fp.depth, 0, h / 2, 0, wallMat, true);
    addBox(grp, fp.width + 0.2, 0.34, fp.depth + 0.2, 0, h + 0.12, 0, trimMat, false);
    addBox(grp, 1.35, 0.14, fp.depth - 0.6, faceX + dir * 0.62, 2.88, 0, trimMat, false);
    addBox(grp, 0.14, 2.25, fp.depth * 0.62, faceX + dir * 0.04, 1.3, 0, matGlass, false);

    for (let fl = 1; fl < floors; fl++) {
      const fy = fl * 3.15 + 1.55;
      addBox(grp, 0.14, 1.25, fp.depth * 0.68, faceX + dir * 0.04, fy, 0, matWindowGlow, false);
      addBox(grp, 0.38, 0.42, 0.68, faceX + dir * 0.18, fy - 0.52, -fp.depth * 0.3, matBrightWhite, false);
      addBox(grp, 0.16, 0.22, fp.depth + 0.1, faceX + dir * 0.06, fl * 3.15, 0, trimMat, false);
    }

    addSignMesh(grp, Math.min(fp.depth - 1.1, 6.2), 0.88, faceX + dir * 0.14, 3.42, 0, signRotY, title, subtitle, {
      bg: signBg,
      border: '#f2ca68',
      titleColor: '#ffffff',
      subtitleColor: '#f5ead6',
    });

    if (kind === 'barber') {
      const bPole = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.11, 0.11, 1.05, 8)), matAlfamartRed);
      bPole.position.set(faceX + dir * 0.36, 1.85, -fp.depth * 0.36);
      grp.add(bPole);
      addBox(grp, 0.45, 0.92, 1.65, faceX + dir * 0.38, 0.54, 1.8, matWood, false);
    } else if (kind === 'bigasan') {
      for (const rz of [-1.8, -0.6, 0.6, 1.8]) {
        addBox(grp, 0.68, 0.72, 0.86, faceX + dir * 0.48, 0.42, rz, matCondoCream, false);
      }
    } else if (kind === 'vulc') {
      for (let ti = 0; ti < 3; ti++) {
        const tire = new THREE.Mesh(tireGeo, matDarkSteel);
        tire.rotation.x = Math.PI / 2;
        tire.position.set(faceX + dir * 0.62, 0.18 + ti * 0.24, -2.2);
        grp.add(tire);
      }
      const tank = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.24, 0.24, 1.05, 8)), matAlfamartRed);
      tank.rotation.z = Math.PI / 2;
      tank.position.set(faceX + dir * 0.55, 0.42, 2.2);
      grp.add(tank);
    } else if (kind === 'bakery') {
      addBox(grp, 0.65, 1.15, 2.6, faceX + dir * 0.42, 0.64, -0.6, matGlass, false);
      addBox(grp, 0.42, 0.48, 0.42, faceX + dir * 0.78, 0.3, 2.2, matBakeryOrange, false);
      addBox(grp, 0.42, 0.48, 0.42, faceX + dir * 0.78, 0.3, 2.9, matBakeryOrange, false);
    } else if (kind === 'carinderia') {
      addBox(grp, 0.72, 1.1, 3.2, faceX + dir * 0.48, 0.62, 0, matGlass, false);
      addBox(grp, 0.92, 0.68, 0.64, faceX + dir * 0.65, 0.4, -2.6, matAlfamartRed, false);
      for (const sz of [1.9, 2.65]) {
        addBox(grp, 0.38, 0.46, 0.38, faceX + dir * 0.82, 0.28, sz, matManilaBlue, false);
      }
    } else if (kind === 'water') {
      for (let j = 0; j < 6; j++) {
        const jug = new THREE.Mesh(jugGeo, matAquaJug);
        jug.position.set(faceX + dir * (0.45 + (j % 2) * 0.36), 0.32, -2.0 + Math.floor(j / 2) * 0.5);
        grp.add(jug);
      }
    } else if (kind === 'hardware') {
      for (let p = 0; p < 4; p++) {
        addBox(grp, 0.08, 2.6, 0.08, faceX + dir * 0.42, 1.35, -2.4 + p * 0.22, matAquaJug, false);
      }
      addBox(grp, 0.65, 0.92, 1.8, faceX + dir * 0.45, 0.52, 2.1, matManilaYellow, false);
    } else if (kind === 'dorm') {
      addBox(grp, 0.45, 0.08, fp.depth * 0.72, faceX + dir * 0.24, 3.2, 0, matSilverSteel, false);
      addBox(grp, 0.08, 0.88, fp.depth * 0.72, faceX + dir * 0.44, 3.65, 0, matDarkSteel, false);
    }

    mauiPathGroup.add(grp);
    addCollider(fp.id, fp.x, fp.z, fp.width + 0.5, fp.depth + 0.5);
  };

  // East-side commercial & neighborhood strip south of Kalye Eskinita (z = 111.5..156.4)
  addAnonasShophouse(barberFp, 2, matWarmStucco, matBrgy630Blue, 'KUYA BOY BARBERSHOP', 'SARI-SARI STORE · LOADING STATION', '#17488a', 'barber');
  addAnonasShophouse(bigasanFp, 2, matCreamWall, matMintStall, '630 BIGASAN & GROCERY', 'WELL-MILLED RICE · COLD DRINKS', '#1f6a46', 'bigasan');
  addAnonasShophouse(vulcFp, 2, matRawConcrete, matAlfamartRed, 'ANONAS MOTO-FIX', 'VULCANIZING · MOTOR PARTS · OIL', '#a31f24', 'vulc');
  addAnonasShophouse(bakeryFp, 2, matCondoCream, matBakeryOrange, 'STA. MESA PANADERIA', 'HOT PANDESAL · MILK TEA · KAPE', '#c45b18', 'bakery');
  addAnonasShophouse(dormSouthFp, 3, matDormOchre, matMaroon, 'ANONAS STUDENT DORM', 'BEDSPACE · XEROX & PRINT HUB', '#7c1a1d', 'dorm');

  // (vi) ANONAS–PUP TODA TERMINAL & QUEUED TRICYCLES (East corner at z = 166.0 before SE curve)
  const todaGrp = new THREE.Group();
  todaGrp.position.set(100.2, 0, 166.0);
  addBox(todaGrp, 3.4, 0.16, 6.4, 0, 0.08, 0, matSidewalkConc, false);
  for (const tz of [-2.7, 2.7]) {
    addBox(todaGrp, 0.14, 2.8, 0.14, -1.35, 1.4, tz, matBrgy630Blue, false);
    addBox(todaGrp, 0.14, 2.6, 0.14, 1.35, 1.3, tz, matBrgy630Blue, false);
  }
  addBox(todaGrp, 3.6, 0.14, 6.8, 0, 2.86, 0, matBrgy630Blue, false);
  addBox(todaGrp, 0.55, 0.45, 4.4, 0.8, 0.3, 0, matWood, false);
  addSignMesh(todaGrp, 5.4, 0.72, -1.72, 2.65, 0, -Math.PI / 2, 'ANONAS–PUP TODA', 'STA. MESA · MAUI OASIS · EL PUEBLO', {
    bg: '#1652a8',
    border: '#ebb91b',
    titleColor: '#ffffff',
    subtitleColor: '#fde58a',
  });
  mauiPathGroup.add(todaGrp);
  addCollider('anonas-toda-shed', 100.2, 166.0, 3.8, 6.8);
  buildStreetTrike(94.1, 162.8, Math.PI, matTrikeGreen);
  buildStreetTrike(94.1, 166.6, Math.PI, matTrikeRed);
  buildStreetTrike(94.1, 170.2, Math.PI, matTrikeBlue);

  // 4. WEST SIDE OF SOUTH ANONAS: SE SERVICE GATE (FLUSH WITH PUP OVAL WALL AT x = 82.6), COMPOUND WALL + MURAL + 4 WEST BUILDINGS
  const seGateX = 82.6;
  addBox(mauiPathGroup, 0.68, 2.85, 0.68, seGateX, 1.425, 78.8, matCreamWall, false);
  addBox(mauiPathGroup, 0.82, 0.2, 0.82, seGateX, 2.9, 78.8, matMaroon, false);
  addBox(mauiPathGroup, 0.68, 2.85, 0.68, seGateX, 1.425, 84.4, matCreamWall, false);
  addBox(mauiPathGroup, 0.82, 0.2, 0.82, seGateX, 2.9, 84.4, matMaroon, false);
  addBox(mauiPathGroup, 0.22, 2.35, 5.1, seGateX - 0.12, 1.22, 81.6, matRawConcrete, false);
  for (let pz = 79.35; pz <= 83.85; pz += 0.36) {
    addBox(mauiPathGroup, 0.05, 2.15, 0.06, seGateX + 0.22, 1.12, pz, matServiceGateGreen, false);
  }
  addBox(mauiPathGroup, 0.08, 0.08, 4.8, seGateX + 0.22, 1.95, 81.6, matServiceGateGreen, false);
  addBox(mauiPathGroup, 0.08, 0.08, 4.8, seGateX + 0.22, 0.42, 81.6, matServiceGateGreen, false);
  addSignMesh(mauiPathGroup, 1.85, 1.25, seGateX + 0.32, 1.32, 81.6, Math.PI / 2, 'NO PARKING', 'PUP PERIMETER · DRIVEWAY CLEAR', {
    bg: '#c82027',
    border: '#ffffff',
    titleColor: '#ffffff',
    subtitleColor: '#fde58a',
  });
  addCollider('pup-se-service-gate', seGateX, 81.6, 0.9, 6.2);

  // PUP Oval South Perimeter Closure Wall (closing the south edge of PUP's Track & Field Oval at z = 78.5)
  addBox(mauiPathGroup, 44.0, 2.5, 0.46, 60.6, 1.25, 78.5, matWeatheredMossWall, false);
  addBox(mauiPathGroup, 44.2, 0.16, 0.58, 60.6, 2.56, 78.5, matRawConcrete, false);
  addCollider('pup-oval-south-wall', 60.6, 78.5, 44.5, 0.9);

  // Long weathered compound perimeter wall south of SE Service Gate (z = 84.8..116.8 = ~52m!)
  addBox(mauiPathGroup, 0.48, 2.65, 32.0, seGateX, 1.325, 100.8, matWeatheredMossWall, true);
  addBox(mauiPathGroup, 0.62, 0.16, 32.2, seGateX, 2.7, 100.8, matRawConcrete, false);
  for (let wz = 86.0; wz <= 116.0; wz += 4.2) {
    addBox(mauiPathGroup, 0.66, 2.82, 0.42, seGateX, 1.41, wz, matRawConcrete, false);
  }
  addSignMesh(mauiPathGroup, 5.4, 1.25, seGateX + 0.34, 1.55, 96.5, Math.PI / 2, 'BAWAL MAGTAPON NG BASURA', 'CLEAN & GREEN · BARANGAY 630 ZONE 63', {
    bg: '#1c5c3e',
    border: '#ebb91b',
    titleColor: '#ffffff',
    subtitleColor: '#fde58a',
  });
  addCollider('west-anonas-compound-wall', seGateX, 100.8, 0.9, 32.4);
  for (const tz of [89.0, 99.0, 109.5, 115.5]) {
    buildStreetTree(mauiPathGroup, 79.4, tz, 1.05);
  }

  // Authentic Manila Fishball / Kikiam & Buko Juice Street Cart on West sidewalk (z = 104.2)
  const cartGrp = new THREE.Group();
  cartGrp.position.set(84.45, 0, 104.2);
  addBox(cartGrp, 0.95, 0.92, 1.55, 0, 0.56, 0, matWood, false);
  addBox(cartGrp, 0.85, 0.48, 1.35, 0, 1.22, 0, matGlass, false);
  addBox(cartGrp, 0.08, 2.35, 0.08, 0, 1.25, 0, matSilverSteel, false);
  const cartUmb = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(1.38, 0.48, 8)), matUmbrellaRed);
  cartUmb.position.set(0, 2.48, 0);
  cartGrp.add(cartUmb);
  addSignMesh(cartGrp, 1.35, 0.42, 0.5, 0.68, 0, Math.PI / 2, 'FISHBALL · KIKIAM', 'BUKO JUICE · ₱10', {
    bg: '#ebb91b',
    border: '#a11e22',
    titleColor: '#1b1414',
    subtitleColor: '#8a171a',
  });
  mauiPathGroup.add(cartGrp);

  // All 4 West-side neighborhood buildings (z = 123.5..160.0)
  const [westCarinderiaFp, westWaterFp, westDormFp, westHardwareFp] = computeWestAnonasFootprints();
  addAnonasShophouse(westCarinderiaFp, 2, matWarmStucco, matAlfamartRed, "MAMA NENA'S TAPSILOGAN", 'CARINDERIA · LUTONG BAHAY', '#b31e24', 'carinderia');
  addAnonasShophouse(westWaterFp, 2, matBrightWhite, matBrgy630Blue, 'AQUA-630 WATER & LAUNDRY', 'PURIFIED WATER · WASH & FOLD', '#1560a8', 'water');
  addAnonasShophouse(westDormFp, 3, matCondoCream, matCondoBalconyGreen, 'ISKOLAR BOARDING HOUSE', 'PUP STUDENT DORM · FREE WIFI', '#214d38', 'dorm');
  addAnonasShophouse(westHardwareFp, 2, matDormOchre, matDarkSteel, 'ANONAS HARDWARE & PRINT', 'ELECTRICAL · XEROX · SCHOOL SUPPLIES', '#2b323b', 'hardware');

  // Triple-transformer Meralco utility pole + convex blind-corner mirror at the z = 169.5 bend
  const curvePole = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.16, 0.22, 10.6, 8)), matRawConcrete);
  curvePole.position.set(84.4, 5.3, 169.5);
  mauiPathGroup.add(curvePole);
  addCollider('curve-meralco-pole', 84.4, 169.5, 0.65, 0.65);
  addBox(mauiPathGroup, 2.4, 0.14, 0.14, 84.4, 9.6, 169.5, matDarkSteel, false);
  addBox(mauiPathGroup, 2.4, 0.14, 0.14, 84.4, 8.2, 169.5, matDarkSteel, false);
  for (const tx of [83.75, 84.4, 85.05]) {
    const xfrmr = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.24, 0.24, 0.92, 8)), matFuturaBlueGray);
    xfrmr.position.set(tx, 7.65, 169.5);
    mauiPathGroup.add(xfrmr);
  }
  const mirrorPole = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.05, 0.06, 3.2, 6)), matSilverSteel);
  mirrorPole.position.set(85.1, 1.6, 171.2);
  mauiPathGroup.add(mirrorPole);
  const mirrorRim = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.46, 0.46, 0.1, 14)), matAlfamartRed);
  mirrorRim.rotation.z = Math.PI / 2;
  mirrorRim.rotation.y = 0.65;
  mirrorRim.position.set(85.1, 2.95, 171.2);
  mauiPathGroup.add(mirrorRim);

  // 5. SOUTH ANONAS ROADWAY MARKINGS, CROSSWALKS, SPEED HUMPS, POLES, HYDRANTS & SIGNAGE
  for (let dz = 53.0; dz <= 171.5; dz += 5.2) {
    addBox(mauiPathGroup, 0.16, 0.02, 2.2, 90.5, 0.032, dz, matManilaYellow, false);
  }
  for (const cz of [78.0, 104.0, 136.0, 168.0]) {
    for (let cx = 86.6; cx <= 94.4; cx += 1.05) {
      addBox(mauiPathGroup, 0.45, 0.022, 2.2, cx, 0.035, cz, matBrightWhite, false);
    }
  }
  const addHumpStripes = (parent: THREE.Object3D, span: number) => {
    addBox(parent, span, 0.14, 0.85, 0, 0, 0, matDarkSteel, false);
    const half = span / 2 - 0.65;
    for (let hx = -half; hx <= half; hx += 1.48) {
      addBox(parent, 0.7, 0.155, 0.87, hx, 0.005, 0, matManilaYellow, false);
    }
  };
  for (const h of computeMauiSpeedHumps()) {
    if (h.along === 0) {
      // South Anonas Street speed humps cleanly inside curb-to-curb asphalt (width 8.4m)
      const humpGrp = new THREE.Group();
      humpGrp.position.set(h.x, 0.06, h.z);
      humpGrp.rotation.y = h.rotY;
      addHumpStripes(humpGrp, 8.4);
      mauiPathGroup.add(humpGrp);
    }
  }
  const corridorPoles = computeMauiCorridorPoles();
  for (let i = 0; i < corridorPoles.length; i++) {
    const p = corridorPoles[i];
    const poleGrp = new THREE.Group();
    poleGrp.position.set(p.x, 0, p.z);
    poleGrp.rotation.y = p.rotY;
    const shaft = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.12, 0.17, 9.2, 6)), matRawConcrete);
    shaft.position.y = 4.6;
    poleGrp.add(shaft);
    addBox(poleGrp, 0.12, 0.12, 1.85, 0, 8.6, 0, matDarkSteel, false);
    addBox(poleGrp, 1.55, 0.08, 0.08, 0.78, 7.4, 0, matSilverSteel, false);
    addBox(poleGrp, 0.46, 0.1, 0.22, 1.48, 7.34, 0, matTeresaBulb, false);
    mauiPathGroup.add(poleGrp);
    addCollider(`meralco-corridor-pole-${i}`, p.x, p.z, 0.52, 0.52);

    if (i > 0 && ((i <= 7 && p.along === 0) || (i > 8 && p.along !== 0))) {
      const prev = corridorPoles[i - 1];
      const dx = p.x - prev.x;
      const dz = p.z - prev.z;
      const dist = Math.hypot(dx, dz);
      for (const wy of [8.62, 8.22]) {
        const wire = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.04, 0.04, dist)), matCable);
        wire.position.set((p.x + prev.x) / 2, wy, (p.z + prev.z) / 2);
        wire.rotation.y = Math.atan2(dx, dz);
        mauiPathGroup.add(wire);
      }
    }
  }
  for (const [hx, hz] of [
    [95.6, 80.5],
    [85.2, 116.2],
    [95.6, 149.2],
  ]) {
    const hyd = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.14, 0.16, 0.76, 8)), matAlfamartRed);
    hyd.position.set(hx, 0.44, hz);
    mauiPathGroup.add(hyd);
  }
  for (const [bx, bz] of [
    [95.7, 90.2],
    [95.7, 128.0],
    [85.0, 142.0],
  ]) {
    addBox(mauiPathGroup, 0.42, 0.78, 0.42, bx, 0.48, bz, matCondoBalconyGreen, false);
    addBox(mauiPathGroup, 0.42, 0.78, 0.42, bx, 0.48, bz + 0.52, matBrgy630Blue, false);
  }
  for (const [sx, sz, rotY, title, sub] of [
    [85.2, 30.2, Math.PI / 2, 'ANONAS ST. SOUTH →', 'BRGY. 630 (110m) · MAUI OASIS (300m)'],
    [95.8, 91.5, -Math.PI / 2, 'MAUI OASIS & EL PUEBLO →', 'CONTINUE SOUTH · 150 METERS AHEAD'],
    [85.0, 132.0, Math.PI / 2, 'SLOW DOWN · SCHOOL ZONE', 'BRGY. 630 · STA. MESA, MANILA'],
    [95.8, 169.5, -Math.PI / 2, '← MAUI OASIS · EL PUEBLO', 'FUTURA CENTRO · CONDO BOULEVARD'],
  ] as Array<[number, number, number, string, string]>) {
    const sp = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.05, 0.06, 3.2, 6)), matSilverSteel);
    sp.position.set(sx, 1.6, sz);
    mauiPathGroup.add(sp);
    addSignMesh(mauiPathGroup, 2.35, 0.74, sx, 2.95, sz, rotY, title, sub, {
      bg: '#165a3c',
      border: '#ffffff',
      titleColor: '#ffffff',
      subtitleColor: '#e4f2ea',
      width: 540,
      height: 170,
    });
  }

  // =========================================================================
  // 6. FAR-SOUTH SWEEPING CONDO BOULEVARD (origin: (46, 186), rotY: +0.24, len: 112)
  // Houses Maui Oasis by Filinvest, Futura Centro & El Pueblo Manila (~140m+ south of PUP Oval!)
  // =========================================================================
  const blvdOrigin = MAUI_CORRIDOR_CONFIG.boulevardOrigin;
  const blvdAngle = MAUI_CORRIDOR_CONFIG.boulevardAngleRad;
  const blvdGroup = new THREE.Group();
  blvdGroup.position.set(blvdOrigin.x, 0, blvdOrigin.z);
  blvdGroup.rotation.y = blvdAngle;
  mauiPathGroup.add(blvdGroup);

  const cornerApron = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(12.2, 12.2, 0.06, 20)), matAsphalt);
  cornerApron.position.set(90.2, 0.015, 175.0);
  cornerApron.receiveShadow = true;
  mauiPathGroup.add(cornerApron);

  const blvdRoad = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(116.0, 19.6)), matAsphalt);
  blvdRoad.rotation.x = -Math.PI / 2;
  blvdRoad.position.set(0, 0.028, 0);
  blvdRoad.receiveShadow = true;
  blvdGroup.add(blvdRoad);
  addBox(blvdGroup, 114.0, 0.16, 2.4, 0, 0.08, -9.8, matSidewalkConc, false);
  addBox(blvdGroup, 114.0, 0.16, 2.8, 0, 0.08, 10.2, matSidewalkConc, false);

  for (const [mStart, mEnd] of [
    [9, 36],
    [-36, -9],
  ]) {
    const mLen = mEnd - mStart;
    const mMid = (mStart + mEnd) / 2;
    addBox(blvdGroup, mLen, 0.24, 1.85, mMid, 0.12, 0, matSidewalkConc, false);
    addBox(blvdGroup, mLen - 0.8, 0.28, 1.35, mMid, 0.14, 0, matGrass, false);
    for (let tx = mStart + 3.5; tx <= mEnd - 3.5; tx += 7.5) {
      buildStreetTree(blvdGroup, tx, 0, 0.88);
    }
    const medWorld = computeBoulevardWorldPoint(mMid, 0);
    addOBBCollider(`maui-blvd-median-${mMid > 0 ? 'e' : 'w'}`, medWorld.x, medWorld.z, mLen, 1.9, blvdAngle);
  }
  for (let lx = -48; lx <= 42; lx += 5.5) {
    addBox(blvdGroup, 2.2, 0.02, 0.16, lx, 0.036, -4.4, matManilaYellow, false);
    addBox(blvdGroup, 2.2, 0.02, 0.16, lx, 0.036, 4.4, matManilaYellow, false);
  }
  // Boulevard speed humps inside blvdGroup — split cleanly per lane beside grassy medians, full-span at open gatehouse crossing!
  for (const h of computeMauiSpeedHumps()) {
    if (h.along === 0) continue;
    if (Math.abs(h.along) > 9) {
      for (const laneLat of [-4.7, 4.7]) {
        const laneHump = new THREE.Group();
        laneHump.position.set(h.along, 0.06, laneLat);
        laneHump.rotation.y = Math.PI / 2;
        addHumpStripes(laneHump, 6.2);
        blvdGroup.add(laneHump);
      }
    } else {
      const fullHump = new THREE.Group();
      fullHump.position.set(h.along, 0.06, 0);
      fullHump.rotation.y = Math.PI / 2;
      addHumpStripes(fullHump, 15.2);
      blvdGroup.add(fullHump);
    }
  }

  // (A) LONG WEATHERED VINE-DRAPED MAUI OASIS PERIMETER WALL (lateral = -11.0, split around Gatehouse!)
  for (const [wId, wStart, wEnd] of [
    ['maui-vine-wall-east', 8.5, 42.0],
    ['maui-vine-wall-west', -44.0, -8.5],
  ] as Array<[string, number, number]>) {
    const wLen = wEnd - wStart;
    const wMid = (wStart + wEnd) / 2;
    addBox(blvdGroup, wLen, 2.95, 0.52, wMid, 1.475, -11.0, matWeatheredMossWall, true);
    addBox(blvdGroup, wLen + 0.2, 0.18, 0.72, wMid, 3.0, -11.0, matCondoStone, false);
    for (let px = wStart + 1.0; px <= wEnd - 1.0; px += 4.8) {
      addBox(blvdGroup, 0.52, 3.12, 0.68, px, 1.56, -11.0, matCondoStone, false);
      const vine = new THREE.Mesh(shrubGeo, Math.round(px) % 2 === 0 ? matVineLush : matVineBright);
      vine.scale.set(1.6, 0.85, 0.9);
      vine.position.set(px + 1.8, 2.85, -10.65);
      blvdGroup.add(vine);
    }
    const wallWorld = computeBoulevardWorldPoint(wMid, -11.0);
    addOBBCollider(wId, wallWorld.x, wallWorld.z, wLen + 0.4, 0.9, blvdAngle);
  }

  // (B) MAUI OASIS BY FILINVEST HAWAIIAN STONE-CLAD MAIN GATEHOUSE (along = 0, lateral = -11.4)
  const mauiGate = new THREE.Group();
  mauiGate.position.set(0, 0, -11.4);
  addBox(mauiGate, 3.8, 3.6, 3.6, -5.8, 1.8, 0, matCondoStone, true);
  addBox(mauiGate, 4.4, 0.45, 4.2, -5.8, 3.72, 0, matCondoRoof, false);
  addBox(mauiGate, 3.8, 3.6, 3.6, 5.8, 1.8, 0, matCondoStone, true);
  addBox(mauiGate, 4.4, 0.45, 4.2, 5.8, 3.72, 0, matCondoRoof, false);
  addBox(mauiGate, 15.8, 0.75, 4.6, 0, 4.45, 0, matCondoCream, true);
  const gateRoof = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(9.6, 2.1, 4)), matCondoRoof);
  gateRoof.rotation.y = Math.PI / 4;
  gateRoof.scale.set(1.2, 1.0, 0.42);
  gateRoof.position.set(0, 5.85, 0);
  mauiGate.add(gateRoof);
  addBox(mauiGate, 0.24, 0.96, 0.24, -3.5, 0.48, 0.6, matAlfamartRed, false);
  addBox(mauiGate, 3.2, 0.09, 0.09, -1.8, 0.94, 0.6, matBrightWhite, false);
  addSignMesh(mauiGate, 8.8, 1.35, 0, 4.45, 2.38, 0, 'MAUI OASIS BY FILINVEST', 'HAWAIIAN RESORT CONDOMINIUM · STA. MESA', {
    bg: '#3f281c',
    border: '#f2ca68',
    titleColor: '#ffffff',
    subtitleColor: '#f5d993',
  });
  blvdGroup.add(mauiGate);
  const gLeftW = computeBoulevardWorldPoint(-5.8, -11.4);
  const gRightW = computeBoulevardWorldPoint(5.8, -11.4);
  addOBBCollider('maui-gate-booth-w', gLeftW.x, gLeftW.z, 4.1, 3.9, blvdAngle);
  addOBBCollider('maui-gate-booth-e', gRightW.x, gRightW.z, 4.1, 3.9, blvdAngle);

  // (C) 3 MAUI OASIS HAWAIIAN MID-RISE CONDOMINIUM WINGS + RESORT SWIMMING POOL (lateral = -25..-38)
  const mauiWings: Array<[string, number, number, number, number, number, string]> = [
    ['maui-oasis-bldg-1', 21.0, -25.5, 19.0, 17.5, 11.0, 'MAUI OASIS · BLDG. 1 (KOA)'],
    ['maui-oasis-bldg-2', -2.0, -34.0, 21.0, 18.5, 11.5, 'MAUI OASIS · BLDG. 2 (ALOHA)'],
    ['maui-oasis-bldg-3', -24.5, -25.5, 18.5, 17.5, 11.0, 'MAUI OASIS · BLDG. 3 (MAILE)'],
  ];
  for (const [id, lx, lz, w, h, d, label] of mauiWings) {
    addBox(blvdGroup, w, h, d, lx, h / 2, lz, matCondoCream, true);
    addBox(blvdGroup, w + 0.26, 2.8, d + 0.26, lx, 1.4, lz, matCondoStone, false);
    addBox(blvdGroup, w + 1.5, 0.45, d + 1.5, lx, h + 0.22, lz, matCondoRoof, false);
    const hipRoof = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(Math.max(w, d) * 0.68, 2.8, 4)), matCondoRoof);
    hipRoof.rotation.y = Math.PI / 4;
    hipRoof.scale.set(1.05, 1.0, (d / w) * 1.05);
    hipRoof.position.set(lx, h + 1.7, lz);
    blvdGroup.add(hipRoof);
    for (let fy = 3.6; fy < h - 1.2; fy += 3.1) {
      addBox(blvdGroup, w + 0.22, 0.3, d + 0.22, lx, fy, lz, matCondoCream, false);
      addBox(blvdGroup, w * 0.84, 1.15, d + 0.16, lx, fy + 1.25, lz, matGlass, false);
      addBox(blvdGroup, w * 0.88, 0.86, d + 0.28, lx, fy + 0.56, lz, matCondoBalconyGreen, false);
    }
    addSignMesh(blvdGroup, 7.6, 1.28, lx, 3.55, lz + d / 2 + 0.22, 0, label, 'FILINVEST · ANONAS ST., STA. MESA', {
      bg: '#4b2d1f',
      border: '#f2ca68',
      titleColor: '#ffffff',
      subtitleColor: '#f7d996',
    });
    const wPt = computeBoulevardWorldPoint(lx, lz);
    addOBBCollider(id, wPt.x, wPt.z, w + 0.8, d + 0.8, blvdAngle);
  }
  addBox(blvdGroup, 13.5, 0.18, 9.6, 0, 0.09, -22.2, matCondoCream, false);
  const mauiPool = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(9.6, 5.8)), matMauiPoolWater);
  mauiPool.rotation.x = -Math.PI / 2;
  mauiPool.position.set(0, 0.22, -22.2);
  blvdGroup.add(mauiPool);
  waterMeshes.push(mauiPool);
  for (const ux of [-3.6, 3.6]) {
    addBox(blvdGroup, 0.06, 2.2, 0.06, ux, 1.1, -18.8, matWood, false);
    const poolUmb = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(1.25, 0.45, 8)), matUmbrellaOrange);
    poolUmb.position.set(ux, 2.28, -18.8);
    blvdGroup.add(poolUmb);
  }

  // (D) SOUTH-EAST BOULEVARD COMMERCIAL STALLS & PARKED SEDANS (lateral = +14.8)
  const blvdStalls: Array<[string, number, number, THREE.Material, THREE.Material, string, string, string]> = [
    ['blvd-7eleven', 24.0, 8.2, matBrightWhite, matMintStall, '7-ELEVEN ANONAS', 'OPEN 24 HOURS · ATM · COFFEE', '#1a6b42'],
    ['blvd-maui-cafe', 13.5, 7.8, matCondoCream, matBakeryOrange, 'MAUI BREW & BITES', 'ICED COFFEE · RICE BOWLS · WI-FI', '#8c3b16'],
    ['blvd-laundry', 3.5, 7.6, matBrightWhite, matBrgy630Blue, 'CONDOCARE LAUNDRY', 'WASH · DRY · FOLD · DELIVERY', '#1558a0'],
    ['blvd-pharmacy', -6.8, 8.0, matWarmStucco, matClinicTeal, 'STA. MESA BOTIKA', 'PHARMACY · VITAMINS · GROCERY', '#12696b'],
  ];
  for (const [id, lx, sw, wMat, tMat, title, sub, bg] of blvdStalls) {
    addBox(blvdGroup, sw, 4.2, 5.8, lx, 2.1, 14.8, wMat, true);
    addBox(blvdGroup, sw + 0.2, 0.36, 6.0, lx, 4.28, 14.8, tMat, false);
    addBox(blvdGroup, sw * 0.72, 2.15, 0.16, lx, 1.32, 11.88, matGlass, false);
    addSignMesh(blvdGroup, sw - 0.8, 0.84, lx, 3.45, 11.82, Math.PI, title, sub, {
      bg,
      border: '#f2ca68',
      titleColor: '#ffffff',
      subtitleColor: '#f2eadc',
    });
    const sPt = computeBoulevardWorldPoint(lx, 14.8);
    addOBBCollider(id, sPt.x, sPt.z, sw + 0.5, 6.2, blvdAngle);
  }
  for (const [cx, cMat] of [
    [22.5, matSilverSteel],
    [-1.5, matFuturaBlueGray],
    [-20.0, matMaroon],
  ] as Array<[number, THREE.Material]>) {
    addBox(blvdGroup, 3.9, 0.62, 1.72, cx, 0.48, 7.35, cMat, false);
    addBox(blvdGroup, 2.1, 0.54, 1.56, cx - 0.15, 1.02, 7.35, matGlass, false);
    const cPt = computeBoulevardWorldPoint(cx, 7.35);
    addOBBCollider(`maui-blvd-car-${Math.round(cx)}`, cPt.x, cPt.z, 4.1, 1.9, blvdAngle);
  }

  // (E) FUTURA CENTRO BY FILINVEST HIGH-RISE TOWER (East of the SE curve: x = 110.0, z = 186.5)
  const fcX = 110.0;
  const fcZ = 186.5;
  addBox(mauiPathGroup, 19.0, 34.0, 20.0, fcX, 17.0, fcZ, matFuturaGray, false);
  addBox(mauiPathGroup, 19.8, 1.0, 20.8, fcX, 34.5, fcZ, matFuturaBlueGray, false);
  for (const dz of [-8.0, 0, 8.0]) {
    addBox(mauiPathGroup, 19.64, 33.8, 1.6, fcX, 16.9, fcZ + dz, matFuturaBlueGray, false);
  }
  for (let fy = 4.2; fy < 32.5; fy += 3.4) {
    addBox(mauiPathGroup, 19.44, 0.36, 20.44, fcX, fy, fcZ, matBrightWhite, false);
    addBox(mauiPathGroup, 19.28, 1.25, 17.2, fcX, fy + 1.2, fcZ, matGlass, false);
  }
  addSignMesh(mauiPathGroup, 9.0, 1.5, fcX - 9.86, 4.4, fcZ, -Math.PI / 2, 'FUTURA CENTRO', 'BY FILINVEST · STA. MESA', {
    bg: '#1c3a5e',
    border: '#79c2e6',
    titleColor: '#ffffff',
    subtitleColor: '#cde8f7',
  });
  addCollider('futura-centro-tower', fcX, fcZ, 19.8, 20.8);

  // (F) EL PUEBLO TRIANGLE LANDMARK PAVILION (SE corner behind boulevard: x = 76.0, z = 205.0)
  const triGrp = new THREE.Group();
  triGrp.position.set(76.0, 0, 205.0);
  addBox(triGrp, 10.5, 4.6, 9.0, 0, 2.3, 0, matCondoCream, true);
  addBox(triGrp, 11.2, 0.45, 9.6, 0, 4.72, 0, matCondoTerra, false);
  addBox(triGrp, 8.2, 2.3, 0.2, 0, 1.4, -4.55, matGlass, false);
  addSignMesh(triGrp, 7.6, 1.15, 0, 3.65, -4.65, Math.PI, 'EL PUEBLO TRIANGLE', 'FOOD HUB · CONVENIENCE · STA. MESA', {
    bg: '#8a3524',
    border: '#f2ca68',
    titleColor: '#ffffff',
    subtitleColor: '#f7d996',
  });
  mauiPathGroup.add(triGrp);
  addCollider('el-pueblo-triangle', 76.0, 205.0, 11.0, 9.6);

  // (G) EL PUEBLO MANILA GATEHOUSE + TWIN TERRACOTTA RESIDENTIAL TOWERS (West end of boulevard!)
  const epGateW = computeBoulevardWorldPoint(-42.0, 7.2);
  addBox(mauiPathGroup, 3.5, 3.5, 3.5, epGateW.x, 1.75, epGateW.z, matBrightWhite, false);
  addBox(mauiPathGroup, 4.2, 0.45, 4.2, epGateW.x, 3.65, epGateW.z, matCondoRoof, false);
  addBox(mauiPathGroup, 0.35, 1.35, 1.8, epGateW.x + 1.8, 1.9, epGateW.z, matGlass, false);
  addBox(mauiPathGroup, 0.22, 0.95, 0.22, epGateW.x + 1.8, 0.48, epGateW.z - 2.3, matAlfamartRed, false);
  addBox(mauiPathGroup, 0.08, 0.08, 3.4, epGateW.x + 1.8, 0.92, epGateW.z - 4.0, matBrightWhite, false);
  addSignMesh(mauiPathGroup, 4.8, 1.15, epGateW.x + 1.88, 3.1, epGateW.z, Math.PI / 2, 'EL PUEBLO MANILA', '630 ANONAS ST. CONDOMINIUM', {
    bg: '#8a3524',
    border: '#f2ca68',
    titleColor: '#ffffff',
    subtitleColor: '#f7d996',
  });
  addCollider('el-pueblo-gatehouse', epGateW.x, epGateW.z, 3.8, 3.8);

  const epX = -10.0;
  const epZ = 204.0;
  addBox(mauiPathGroup, 24.0, 36.0, 16.0, epX, 18.0, epZ, matCondoTerra, false);
  addBox(mauiPathGroup, 24.8, 0.9, 16.8, epX, 36.45, epZ, matCondoRoof, false);
  addBox(mauiPathGroup, 0.6, 3.5, 14.0, epX + 12.15, 1.75, epZ, matBrightWhite, false);
  addBox(mauiPathGroup, 0.24, 2.2, 11.4, epX + 12.52, 1.45, epZ, matGlass, false);
  addSignMesh(mauiPathGroup, 10.5, 0.92, epX + 12.66, 3.45, epZ, Math.PI / 2, 'EL PUEBLO MANILA COMMERCIAL', 'CONVENIENCE · COFFEE · LAUNDRY · WATER', {
    bg: '#1c4230',
    border: '#f2ca68',
    titleColor: '#ffffff',
    subtitleColor: '#f2ca68',
  });
  for (let fy = 4.6; fy < 34.0; fy += 3.6) {
    addBox(mauiPathGroup, 24.54, 0.42, 16.54, epX, fy, epZ, matCondoCream, false);
    addBox(mauiPathGroup, 21.0, 1.25, 16.34, epX, fy + 1.35, epZ, matGlass, false);
  }
  addCollider('el-pueblo-condo', epX, epZ, 24.8, 16.8);

  // Southern district boundary trees framing the far-south horizon cleanly
  for (let sx = -18; sx <= 102; sx += 16) {
    buildStreetTree(mauiPathGroup, sx, 224.0, 1.35);
  }
}
