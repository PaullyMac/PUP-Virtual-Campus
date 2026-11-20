import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { AABB, INSPECTABLE_ITEMS, InspectableItem } from '../campus/campusData';
import {
  computeForecourtCurbSegments,
  computePylonPodiumTiers,
  computeTeresaStallBays,
  generateCurvedSidewalkPolygon,
  PUP_FORECOURT_CONFIG,
} from '../campus/entranceGeometry';
import {
  computeBarangay630Footprints,
  computeBoulevardWorldPoint,
  computeMauiCorridorPoles,
  computeMauiSpeedHumps,
  MAUI_CORRIDOR_CONFIG,
} from '../campus/mauiCorridorGeometry';
import { CampusTextureSet, clearSignTextureCache, createSignTexture } from './textures';

export interface InteractiveDoor {
  id: string;
  label: string;
  position: THREE.Vector3;
  leftPivot: THREE.Group;
  rightPivot: THREE.Group;
  isOpen: boolean;
  openProgress: number;
  colliderIds: string[];
}

export interface InteractiveBench {
  id: string;
  label: string;
  sitPosition: THREE.Vector3;
  sitYaw: number;
}

export interface InteractiveObjectRef {
  item: InspectableItem;
  position: THREE.Vector3;
}

export interface BuiltCampusWorld {
  root: THREE.Group;
  colliders: AABB[];
  doors: InteractiveDoor[];
  benches: InteractiveBench[];
  inspectables: InteractiveObjectRef[];
  lampLights: THREE.PointLight[];
  lampBulbs: THREE.MeshStandardMaterial[];
  emissiveWindowMats: THREE.MeshStandardMaterial[];
  nightSkyGroup: THREE.Group;
  animatedFlags: THREE.Mesh[];
  craneJib: THREE.Group;
  waterMeshes: THREE.Mesh[];
  waterTimeUniform: { value: number };
  perfStats: {
    originalStaticMeshes: number;
    mergedStaticBatches: number;
  };
  dispose: () => void;
}

export function buildPupCampusWorld(
  scene: THREE.Scene,
  textures: CampusTextureSet,
  castShadow: boolean,
): BuiltCampusWorld {
  const root = new THREE.Group();
  root.name = 'PUP_Sta_Mesa_Campus';
  scene.add(root);

  const colliders: AABB[] = [];
  const doors: InteractiveDoor[] = [];
  const benches: InteractiveBench[] = [];
  const inspectables: InteractiveObjectRef[] = [];
  const lampLights: THREE.PointLight[] = [];
  const lampBulbs: THREE.MeshStandardMaterial[] = [];
  const emissiveWindowMats: THREE.MeshStandardMaterial[] = [];
  const animatedFlags: THREE.Mesh[] = [];
  const waterMeshes: THREE.Mesh[] = [];
  const ownedGeometries: THREE.BufferGeometry[] = [];
  const ownedMaterials: THREE.Material[] = [];
  const ownedTextures: THREE.Texture[] = [];
  const waterTimeUniform = { value: 0 };

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    ownedGeometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    ownedMaterials.push(m);
    return m;
  };

  // =========================================================================
  // CALIBRATED PBR CAMPUS MATERIALS (Photo-Referenced PUP Sta. Mesa Palette)
  // =========================================================================
  const matConcrete = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.concreteFacade,
      bumpMap: textures.concreteBump,
      bumpScale: 0.045,
      roughness: 0.84,
      metalness: 0.02,
    }),
  );
  const matBrightWhite = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf4f2ed,
      bumpMap: textures.concreteBump,
      bumpScale: 0.025,
      roughness: 0.64,
      metalness: 0.03,
    }),
  );
  const matCreamWall = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xece5d5,
      bumpMap: textures.concreteBump,
      bumpScale: 0.03,
      roughness: 0.72,
      metalness: 0.02,
    }),
  );
  const matRawConcrete = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x97948c,
      bumpMap: textures.concreteBump,
      bumpScale: 0.09,
      roughness: 0.92,
      metalness: 0.03,
    }),
  );
  const matMarble = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.marblePylon,
      roughness: 0.34,
      metalness: 0.08,
    }),
  );
  const matMaroon = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x7b1718,
      roughness: 0.56,
      metalness: 0.08,
    }),
  );
  const matDarkMaroonRoof = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x521b14,
      roughness: 0.62,
      metalness: 0.14,
    }),
  );
  const matDarkShadow = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x1d1a19,
      roughness: 0.92,
      metalness: 0.02,
    }),
  );
  const matGold = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe5a91a,
      roughness: 0.26,
      metalness: 0.78,
    }),
  );
  const matCharlieYellow = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe4b217,
      bumpMap: textures.concreteBump,
      bumpScale: 0.03,
      roughness: 0.68,
      metalness: 0.04,
    }),
  );
  const matGlass = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x264357,
      emissive: 0xffc670,
      emissiveIntensity: 0.0,
      roughness: 0.14,
      metalness: 0.68,
    }),
  );
  emissiveWindowMats.push(matGlass);
  const matCurbYellow = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe6b520,
      roughness: 0.72,
      metalness: 0.04,
    }),
  );
  const matTrafficCone = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe05218,
      roughness: 0.45,
      metalness: 0.05,
    }),
  );
  const matDarkSteel = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x2c3034,
      roughness: 0.4,
      metalness: 0.74,
    }),
  );
  const matSilverSteel = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xcbd0d6,
      roughness: 0.28,
      metalness: 0.85,
    }),
  );
  const matBronze = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x4b463d,
      roughness: 0.38,
      metalness: 0.72,
    }),
  );
  const matWood = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.woodPlank,
      roughness: 0.74,
      metalness: 0.02,
    }),
  );
  const matIntramuros = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.intramurosStone,
      bumpMap: textures.intramurosBump,
      bumpScale: 0.08,
      roughness: 0.9,
      metalness: 0.02,
    }),
  );
  const matChapelRoof = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.terracottaRoof,
      bumpMap: textures.terracottaBump,
      bumpScale: 0.09,
      roughness: 0.74,
      metalness: 0.04,
    }),
  );
  const matThatch = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.thatchRoof,
      bumpMap: textures.thatchBump,
      bumpScale: 0.11,
      roughness: 0.95,
      metalness: 0.0,
    }),
  );
  const matMintWood = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.mintWood,
      bumpMap: textures.mintWoodBump,
      bumpScale: 0.05,
      roughness: 0.72,
      metalness: 0.02,
    }),
  );
  const matRedOrangeTrim = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xd04b2d,
      roughness: 0.54,
      metalness: 0.2,
    }),
  );
  const matInteriorFloor = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.interiorTile,
      roughness: 0.34,
      metalness: 0.06,
    }),
  );
  const matPaver = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.paverWalkway,
      roughness: 0.86,
      metalness: 0.02,
    }),
  );
  const matFreedomGrid = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.freedomGrid,
      roughness: 0.84,
      metalness: 0.02,
    }),
  );
  const matLagoonBrick = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.lagoonBrick,
      roughness: 0.82,
      metalness: 0.02,
    }),
  );
  const matAsphalt = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.asphaltRoad,
      roughness: 0.88,
      metalness: 0.02,
    }),
  );
  const matGrass = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.grassTurf,
      roughness: 0.94,
      metalness: 0.0,
    }),
  );
  const matTrack = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.trackRed,
      roughness: 0.82,
      metalness: 0.02,
    }),
  );
  const matHoarding = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.constructionFence,
      roughness: 0.56,
      metalness: 0.34,
    }),
  );
  const matCraneYellow = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xdca018,
      roughness: 0.42,
      metalness: 0.55,
    }),
  );
  const matSafetyNet = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x246b45,
      transparent: true,
      opacity: 0.68,
      roughness: 0.88,
      side: THREE.DoubleSide,
    }),
  );
  const matContactShadow = trackMat(
    new THREE.MeshBasicMaterial({
      map: textures.contactShadow,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    }),
  );

  // Animated Shimmering PBR Water Material (onBeforeCompile wave shimmer + sky Fresnel glint)
  function createAnimatedWaterMaterial(baseHex: number, rippleScale: number): THREE.MeshStandardMaterial {
    const mat = new THREE.MeshStandardMaterial({
      color: baseHex,
      roughness: 0.14,
      metalness: 0.52,
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = waterTimeUniform;
      shader.uniforms.uRippleScale = { value: rippleScale };
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
          varying vec3 vWaterWorldPos;`,
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          vec4 wp = modelMatrix * vec4(transformed, 1.0);
          vWaterWorldPos = wp.xyz;`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          uniform float uTime;
          uniform float uRippleScale;
          varying vec3 vWaterWorldPos;`,
        )
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
          float w1 = sin(vWaterWorldPos.x * uRippleScale + uTime * 1.45) * cos(vWaterWorldPos.z * uRippleScale * 0.85 - uTime * 1.1);
          float w2 = sin((vWaterWorldPos.x + vWaterWorldPos.z) * uRippleScale * 1.6 - uTime * 1.9);
          float glint = smoothstep(0.58, 0.96, 0.5 + 0.35 * w1 + 0.25 * w2);
          diffuseColor.rgb = mix(diffuseColor.rgb * 0.88, diffuseColor.rgb * 1.18 + vec3(0.12, 0.17, 0.19), 0.5 + 0.32 * w1 + glint * 0.32);`,
        );
    };
    return trackMat(mat);
  }

  const matPasigWater = createAnimatedWaterMaterial(0x285f6e, 0.32);
  const matLagoonWater = createAnimatedWaterMaterial(0x2b7a78, 0.65);
  const matPoolWater = createAnimatedWaterMaterial(0x2692c8, 0.95);

  function addCollider(id: string, cx: number, cz: number, w: number, d: number) {
    colliders.push({
      id,
      minX: cx - w / 2,
      maxX: cx + w / 2,
      minZ: cz - d / 2,
      maxZ: cz + d / 2,
    });
  }

  const unitBoxGeo = trackGeo(new THREE.BoxGeometry(1, 1, 1));
  const unitPlaneGeo = trackGeo(new THREE.PlaneGeometry(1, 1));
  const signMatCache = new Map<string, THREE.MeshStandardMaterial>();
  const ownedTextureSet = new Set<THREE.Texture>();

  function addBox(
    parent: THREE.Object3D,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    mat: THREE.Material,
    shadows = true,
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(unitBoxGeo, mat);
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    mesh.castShadow = castShadow && shadows;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function addContactShadow(parent: THREE.Object3D, x: number, z: number, w: number, d: number, y = 0.052) {
    const plane = new THREE.Mesh(unitPlaneGeo, matContactShadow);
    plane.scale.set(w, d, 1);
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(x, y, z);
    parent.add(plane);
  }

  function addSignMesh(
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
  ) {
    const matKey = `${title}|${subtitle}|${opts?.bg ?? ''}|${opts?.border ?? ''}|${opts?.titleColor ?? ''}|${opts?.subtitleColor ?? ''}|${opts?.width ?? 1024}|${opts?.height ?? 256}|${opts?.badge ?? ''}`;
    let mat = signMatCache.get(matKey);
    if (!mat) {
      const tex = createSignTexture(title, subtitle, opts);
      if (!ownedTextureSet.has(tex)) {
        ownedTextureSet.add(tex);
        ownedTextures.push(tex);
      }
      mat = trackMat(
        new THREE.MeshStandardMaterial({
          map: tex,
          roughness: 0.42,
          metalness: 0.14,
        }),
      );
      signMatCache.set(matKey, mat);
    }
    const mesh = new THREE.Mesh(unitPlaneGeo, mat);
    mesh.scale.set(w, h, 1);
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotY;
    parent.add(mesh);
    return mesh;
  }

  function createInteractiveDoubleDoor(
    id: string,
    label: string,
    x: number,
    z: number,
    rotY: number,
    startOpen: boolean,
  ): InteractiveDoor {
    const frameGroup = new THREE.Group();
    frameGroup.position.set(x, 0, z);
    frameGroup.rotation.y = rotY;
    root.add(frameGroup);

    const leftPivot = new THREE.Group();
    leftPivot.position.set(-1.9, 0, 0);
    const leftLeaf = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.85, 3.2, 0.14)), matMaroon);
    leftLeaf.position.set(0.925, 1.6, 0);
    const leftGlass = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.2, 1.9, 0.17)), matGlass);
    leftGlass.position.set(0.925, 1.85, 0);
    const leftHandle = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.08, 0.45, 0.24)), matGold);
    leftHandle.position.set(1.65, 1.35, 0);
    leftPivot.add(leftLeaf, leftGlass, leftHandle);

    const rightPivot = new THREE.Group();
    rightPivot.position.set(1.9, 0, 0);
    const rightLeaf = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.85, 3.2, 0.14)), matMaroon);
    rightLeaf.position.set(-0.925, 1.6, 0);
    const rightGlass = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.2, 1.9, 0.17)), matGlass);
    rightGlass.position.set(-0.925, 1.85, 0);
    const rightHandle = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.08, 0.45, 0.24)), matGold);
    rightHandle.position.set(-1.65, 1.35, 0);
    rightPivot.add(rightLeaf, rightGlass, rightHandle);

    frameGroup.add(leftPivot, rightPivot);

    const initialProg = startOpen ? 1 : 0;
    leftPivot.rotation.y = -initialProg * 1.45;
    rightPivot.rotation.y = initialProg * 1.45;

    const door: InteractiveDoor = {
      id,
      label,
      position: new THREE.Vector3(x, 1.5, z),
      leftPivot,
      rightPivot,
      isOpen: startOpen,
      openProgress: initialProg,
      colliderIds: [],
    };
    doors.push(door);
    return door;
  }

  // =========================================================================
  // 1. TERRAIN, PASIG RIVER, LINEAR PARK, ROADS & REAL PUP STA. MESA PLAZAS
  // =========================================================================
  const ground = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(540, 540)), matGrass);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  root.add(ground);

  // Pasig River running along the western campus boundary (x = -76..-225)
  const river = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(150, 540)), matPasigWater);
  river.rotation.x = -Math.PI / 2;
  river.position.set(-151, 0.03, 0);
  river.receiveShadow = true;
  root.add(river);
  waterMeshes.push(river);

  // Concrete river seawall & Linear Park promenade along western edge (x = -76..-63)
  addBox(root, 1.4, 1.6, 176, -76.5, 0.45, 0, matConcrete, false);
  const linearWalk = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(12, 146)), matPaver);
  linearWalk.rotation.x = -Math.PI / 2;
  linearWalk.position.set(-69.5, 0.04, 2);
  linearWalk.receiveShadow = true;
  root.add(linearWalk);

  for (let z = -66; z <= 66; z += 5.5) {
    addBox(root, 0.24, 1.05, 0.24, -75.6, 0.55, z, matBrightWhite, false);
  }
  // Linear Park signature continuous concrete riverside bench/ledge + forest-green steel railings (linear_park.jpg!)
  const matLinearGreen = trackMat(new THREE.MeshStandardMaterial({ color: 0x225a3c, roughness: 0.58, metalness: 0.35 }));
  addBox(root, 0.72, 0.52, 134, -74.9, 0.26, 0, matRawConcrete, false);
  addBox(root, 0.14, 0.12, 134, -75.6, 1.18, 0, matLinearGreen, false);
  addBox(root, 0.12, 0.08, 134, -75.6, 0.76, 0, matLinearGreen, false);
  for (let lz = -64; lz <= 64; lz += 2.2) {
    addBox(root, 0.07, 0.7, 0.07, -75.6, 0.85, lz, matLinearGreen, false);
  }

  // PUP Pasig River Ferry Station pier at SW corner (-75, 56) — photo-matched to ferry.jpg & pup_ferry_wiki.jpg!
  const ferryGroup = new THREE.Group();
  ferryGroup.position.set(-75, 0, 56);
  const matFerrySteel = trackMat(new THREE.MeshStandardMaterial({ color: 0x566069, roughness: 0.52, metalness: 0.48 }));
  const matTireRubber = trackMat(new THREE.MeshStandardMaterial({ color: 0x1a1c1e, roughness: 0.92 }));
  // Floating concrete pontoon dock & mooring piers
  addBox(ferryGroup, 9.5, 0.72, 15.0, -3.5, 0.36, 0, matRawConcrete, false);
  for (const dz of [-6.2, -2.0, 2.0, 6.2]) {
    addBox(ferryGroup, 0.72, 2.6, 0.72, -7.8, 1.3, dz, matBrightWhite, false);
    addBox(ferryGroup, 0.72, 2.6, 0.72, 0.6, 1.3, dz, matBrightWhite, false);
    // Black rubber tire fenders bolted along the river edge (ferry.jpg!)
    const tire = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.42, 0.14, 8, 14)), matTireRubber);
    tire.rotation.y = Math.PI / 2;
    tire.position.set(-8.32, 0.35, dz);
    ferryGroup.add(tire);
  }
  // Curved arched steel-truss canopy over floating dock (ferry.jpg!)
  const ferryCanopy = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(7.8, 7.8, 9.6, 16, 1, true, -Math.PI * 0.32, Math.PI * 0.64)),
    matFerrySteel,
  );
  ferryCanopy.rotation.z = Math.PI / 2;
  ferryCanopy.scale.set(1, 0.24, 1);
  ferryCanopy.position.set(-3.5, 2.3, 0);
  ferryGroup.add(ferryCanopy);
  // Signature black-and-yellow diagonal hazard-striped I-beam girder (pup_ferry_wiki.jpg!)
  addBox(ferryGroup, 0.35, 0.42, 14.6, -7.8, 3.45, 0, matGold, false);
  for (let hz = -6.8; hz <= 6.8; hz += 1.0) {
    addBox(ferryGroup, 0.38, 0.43, 0.44, -7.8, 3.45, hz, matDarkSteel, false);
  }
  // Galvanized steel boarding railings & orange life ring
  addBox(ferryGroup, 0.08, 0.95, 11.5, -7.4, 1.2, 0, matSilverSteel, false);
  const lifeRing = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.32, 0.08, 8, 14)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0xe05d1e, roughness: 0.5 })),
  );
  lifeRing.rotation.y = Math.PI / 2;
  lifeRing.position.set(-7.2, 1.65, -3.5);
  ferryGroup.add(lifeRing);
  // Emerald-green MMDA signboard ("P.U.P. PASIG RIVER FERRY STATION" — pup_ferry_wiki.jpg!)
  addSignMesh(ferryGroup, 7.6, 1.25, -8.1, 3.05, 0, -Math.PI / 2, 'P.U.P. PASIG RIVER FERRY STATION', 'MMDA PASIG RIVER FERRY SERVICE', {
    bg: '#0c7c59',
    border: '#ffffff',
    titleColor: '#ffffff',
  });
  addSignMesh(ferryGroup, 7.6, 1.25, 1.1, 3.05, 0, Math.PI / 2, 'P.U.P. PASIG RIVER FERRY STATION', 'MMDA PASIG RIVER FERRY SERVICE', {
    bg: '#0c7c59',
    border: '#ffffff',
    titleColor: '#ffffff',
  });
  // White curved-roof terminal building behind dock with red "PUP STATION" lettering (ferry.jpg!)
  addBox(ferryGroup, 5.2, 4.2, 12.6, 3.8, 2.1, 0, matBrightWhite, false);
  addBox(ferryGroup, 5.4, 1.4, 9.8, 3.8, 2.8, 0, matGlass, false);
  const terminalRoof = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(6.8, 6.8, 5.8, 14, 1, false, -Math.PI * 0.35, Math.PI * 0.7)),
    matRawConcrete,
  );
  terminalRoof.rotation.z = Math.PI / 2;
  terminalRoof.scale.set(1, 0.25, 1);
  terminalRoof.position.set(3.8, 3.1, 0);
  ferryGroup.add(terminalRoof);
  addSignMesh(ferryGroup, 5.4, 0.85, 6.45, 3.85, 0, Math.PI / 2, 'PUP STATION', '', {
    bg: '#f4f0e8',
    border: 'none',
    titleColor: '#b51c1f',
  });
  root.add(ferryGroup);

  // =========================================================================
  // 1B. OUTSIDE-OF-CAMPUS STA. MESA & TERESA STREET CORRIDOR
  //     (Calibrated from Jan/Aug 2026 Aerial Drone Photos, July 2026 Teresa St &
  //      Teresa Chapel Street Photos, and Google Maps WGS84 Distances):
  //     - Anonas St. (x = 83..95.5, ~15m outside PUP Main Gate)
  //     - PNR Sta. Mesa Crossing & Twin-Deck NLEX-SLEX Connector Viaduct (x = 96.5..115.5, ~42m)
  //     - Detailed Teresa Street Student Food & Dorm Strip (x = 115.5..201.5, ~50m–205m)
  //     - Old Sta. Mesa Street & Stop & Shop Transit Junction (x = 201.5..226, ~215m)
  //     - Maui Oasis by Filinvest, Futura Centro & El Pueblo SE Condo Skyline
  // =========================================================================
  const outsideGroup = new THREE.Group();
  root.add(outsideGroup);

  // Extended urban ground apron East outside PUP Main Gate through Old Sta. Mesa St.
  const eastGround = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(184, 224)), matRawConcrete);
  eastGround.rotation.x = -Math.PI / 2;
  eastGround.position.set(174, 0.008, 0);
  eastGround.receiveShadow = true;
  outsideGroup.add(eastGround);

  // Shared PBR Materials for Authentic Manila / Sta. Mesa / Teresa Street Palette
  const matManilaBlue = trackMat(new THREE.MeshStandardMaterial({ color: 0x1756a9, roughness: 0.72 }));
  const matManilaYellow = trackMat(new THREE.MeshStandardMaterial({ color: 0xebb91b, roughness: 0.72 }));
  const matSidewalkConc = trackMat(new THREE.MeshStandardMaterial({ color: 0xb9b4aa, roughness: 0.9 }));
  const matAwning = trackMat(new THREE.MeshStandardMaterial({ color: 0x525b66, roughness: 0.68, metalness: 0.36 }));
  const matChapelAwning = trackMat(new THREE.MeshStandardMaterial({ color: 0x6b2f21, roughness: 0.66, metalness: 0.25 }));
  const matDormOchre = trackMat(new THREE.MeshStandardMaterial({ color: 0xdba33b, roughness: 0.82 }));
  const matBrgyBlue = trackMat(new THREE.MeshStandardMaterial({ color: 0x164ea6, roughness: 0.45 }));
  const matCable = trackMat(new THREE.MeshStandardMaterial({ color: 0x17191c, roughness: 0.82 }));
  const matTrikeRed = trackMat(new THREE.MeshStandardMaterial({ color: 0xa11e22, roughness: 0.44, metalness: 0.28 }));
  const matTrikeBlue = trackMat(new THREE.MeshStandardMaterial({ color: 0x1e5394, roughness: 0.44, metalness: 0.28 }));
  const matTrikeGreen = trackMat(new THREE.MeshStandardMaterial({ color: 0x206d44, roughness: 0.44, metalness: 0.28 }));
  const matJeepBlue = trackMat(new THREE.MeshStandardMaterial({ color: 0x1d4d8f, roughness: 0.38, metalness: 0.45 }));
  const matJeepRed = trackMat(new THREE.MeshStandardMaterial({ color: 0x9b1f22, roughness: 0.38, metalness: 0.45 }));
  const matUmbrellaRed = trackMat(new THREE.MeshStandardMaterial({ color: 0xb82428, roughness: 0.72 }));
  const matUmbrellaBlue = trackMat(new THREE.MeshStandardMaterial({ color: 0x1f5ca8, roughness: 0.72 }));
  const matUmbrellaOrange = trackMat(new THREE.MeshStandardMaterial({ color: 0xd96b1f, roughness: 0.72 }));
  const matTreeFoliage = trackMat(new THREE.MeshStandardMaterial({ color: 0x2f6930, roughness: 0.88 }));
  const matTreeTrunk = trackMat(new THREE.MeshStandardMaterial({ color: 0x594230, roughness: 0.92 }));
  const matWindowGlow = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xdcebf2,
      emissive: 0xffd58a,
      emissiveIntensity: 0.0,
      roughness: 0.22,
      metalness: 0.28,
    }),
  );
  emissiveWindowMats.push(matWindowGlow);

  // Shared emissive bulb material for Teresa Street Meralco lamps & Chapel sconces (zero extra PointLights!)
  const matTeresaBulb = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xfff3d4,
      emissive: 0xffc663,
      emissiveIntensity: 0.16,
      roughness: 0.2,
    }),
  );
  lampBulbs.push(matTeresaBulb);

  // --- 1B-1: ANONAS STREET, LONG CURVED FORECOURT SIDEWALKS, BARRIERS & PNR CONSTRUCTION FENCE (May 2026 Google Maps & Street View!) ---
  const anonasRoad = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(10.6, 190)), matAsphalt);
  anonasRoad.rotation.x = -Math.PI / 2;
  anonasRoad.position.set(90.6, 0.022, 0);
  anonasRoad.receiveShadow = true;
  outsideGroup.add(anonasRoad);
  // Deep flared concrete entrance forecourt roadway bridging Anonas St (x = 85.8) back to recessed Main Gate (x = 73.5)!
  const forecourtApron = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(14.5, 21.0)), matAsphalt);
  forecourtApron.rotation.x = -Math.PI / 2;
  forecourtApron.position.set(79.8, 0.024, -4.0);
  forecourtApron.receiveShadow = true;
  outsideGroup.add(forecourtApron);
  for (let az = -72; az <= 48; az += 6.5) {
    addBox(outsideGroup, 0.16, 0.03, 3.0, 90.6, 0.026, az, matGold, false);
  }
  // White pedestrian crosswalk zebra stripes across the wide curved mouth of PUP Main Gate & Dambanang Mabini
  for (let cz = -10.8; cz <= 2.8; cz += 1.25) {
    addBox(outsideGroup, 3.2, 0.03, 0.54, 87.2, 0.03, cz, matBrightWhite, false);
  }
  for (let cz = 16.5; cz <= 23.5; cz += 1.15) {
    addBox(outsideGroup, 3.2, 0.03, 0.5, 87.8, 0.03, cz, matBrightWhite, false);
  }

  // Helper to build exact smooth curved sidewalk slabs from world (x, z) polygon vertices
  const matForecourtBrick = trackMat(new THREE.MeshStandardMaterial({ color: 0x9b6b5c, roughness: 0.88 }));
  const addCurvedSlab = (
    parent: THREE.Object3D,
    ptsXZ: Array<[number, number]>,
    height: number,
    mat: THREE.Material,
    yBase = 0,
  ) => {
    if (ptsXZ.length < 3) return;
    const shape = new THREE.Shape();
    shape.moveTo(ptsXZ[0][0], -ptsXZ[0][1]);
    for (let i = 1; i < ptsXZ.length; i++) {
      shape.lineTo(ptsXZ[i][0], -ptsXZ[i][1]);
    }
    shape.closePath();
    const geo = trackGeo(new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false }));
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = yBase;
    mesh.receiveShadow = true;
    parent.add(mesh);
  };

  // NORTH & SOUTH SWEPT CURVED BRICK SIDEWALKS (C1-continuous 6.6m-radius quarter-circle forecourt curves — photo-matched to 2026 satellite 10m scale & street photos!)
  const northSwPts = generateCurvedSidewalkPolygon('north', PUP_FORECOURT_CONFIG);
  addCurvedSlab(outsideGroup, northSwPts, 0.16, matForecourtBrick, 0.01);

  const southSwPts = generateCurvedSidewalkPolygon('south', PUP_FORECOURT_CONFIG);
  addCurvedSlab(outsideGroup, southSwPts, 0.16, matForecourtBrick, 0.01);

  // Subtle recessed concrete pedestrian curb ramps & gutter storm-drain grates flanking both curved forecourt aprons
  for (const [rx, rz, rotY] of [
    [85.2, -11.4, -0.42],
    [85.2, 3.4, 0.42],
  ] as Array<[number, number, number]>) {
    const ramp = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.55, 0.09, 1.05)), matSidewalkConc);
    ramp.position.set(rx, 0.095, rz);
    ramp.rotation.y = rotY;
    outsideGroup.add(ramp);
  }
  for (const [gx, gz, rotY] of [
    [83.1, -10.4, 0.48],
    [85.85, -13.9, 1.18],
    [83.1, 2.4, -0.48],
    [85.85, 5.9, -1.18],
  ] as Array<[number, number, number]>) {
    const grate = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.76, 0.032, 0.42)), matDarkSteel);
    grate.position.set(gx, 0.038, gz);
    grate.rotation.y = rotY;
    outsideGroup.add(grate);
  }

  // SMOOTH TANGENT-ALIGNED ALTERNATING YELLOW-AND-BLACK CURBSTONES wrapping continuously along straight throat + 6.6m curved arcs + Anonas St!
  const addCurbBlock = (cx: number, cz: number, len: number, rotY: number, idx: number) => {
    const cMat = idx % 2 === 0 ? matManilaYellow : matDarkSteel;
    const blk = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(len, 0.19, 0.28)), cMat);
    blk.position.set(cx, 0.095, cz);
    blk.rotation.y = rotY;
    outsideGroup.add(blk);
  };
  for (const seg of computeForecourtCurbSegments('north', PUP_FORECOURT_CONFIG)) {
    addCurbBlock(seg.x, seg.z, seg.length, seg.rotY, seg.index);
  }
  for (const seg of computeForecourtCurbSegments('south', PUP_FORECOURT_CONFIG)) {
    addCurbBlock(seg.x, seg.z, seg.length, seg.rotY, seg.index);
  }

  // Signature vintage stone trash/ornament pedestal sitting right on the wide curved North brick corner
  addBox(outsideGroup, 0.52, 0.92, 0.52, 84.35, 0.62, -13.35, matRawConcrete, false);
  const pedTop = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.18, 0.28, 0.24, 8)), matDarkSteel);
  pedTop.position.set(84.35, 1.18, -13.35);
  outsideGroup.add(pedTop);

  // Iconic Yellow-and-Black Steel Mesh Crowd / Traffic Barriers lining the North Anonas curb
  const addCrowdBarrier = (bx: number, bz: number, len: number, rotY: number, label?: string, sub?: string) => {
    const bg = new THREE.Group();
    bg.position.set(bx, 0, bz);
    bg.rotation.y = rotY;
    addBox(bg, len, 0.07, 0.07, 0, 1.12, 0, matManilaYellow, false);
    addBox(bg, len, 0.07, 0.07, 0, 0.18, 0, matManilaYellow, false);
    addBox(bg, 0.07, 1.12, 0.07, -len / 2, 0.56, 0, matManilaYellow, false);
    addBox(bg, 0.07, 1.12, 0.07, len / 2, 0.56, 0, matManilaYellow, false);
    addBox(bg, 0.08, 0.06, 0.52, -len / 2 + 0.15, 0.03, 0, matDarkSteel, false);
    addBox(bg, 0.08, 0.06, 0.52, len / 2 - 0.15, 0.03, 0, matDarkSteel, false);
    for (let sx = -len / 2 + 0.25; sx <= len / 2 - 0.25; sx += 0.28) {
      addBox(bg, 0.025, 0.92, 0.025, sx, 0.65, 0, matDarkSteel, false);
    }
    if (label) {
      addSignMesh(bg, Math.min(len * 0.55, 1.15), 0.66, 0, 0.68, 0.06, 0, label, sub ?? '', {
        bg: '#f2ca38',
        border: '#1c1816',
        titleColor: '#9e1919',
        subtitleColor: '#1a1a1a',
        width: 320,
        height: 200,
      });
    }
    outsideGroup.add(bg);
  };
  addCrowdBarrier(86.65, -18.2, 2.8, Math.PI / 2, 'NO PARKING', 'NO LOADING / UNLOADING');
  addCrowdBarrier(86.65, -21.6, 2.8, Math.PI / 2, 'DROP OFF', 'ONLY · KEEP CLEAR');

  // Iconic Outside-PUP Street Food Pushcarts & Multi-Color Umbrellas along North Pylon Sidewalk
  const matCartGreen = trackMat(new THREE.MeshStandardMaterial({ color: 0x266b3a, roughness: 0.72 }));
  const matCartBlue = trackMat(new THREE.MeshStandardMaterial({ color: 0x2268b8, roughness: 0.72 }));
  addBox(outsideGroup, 1.25, 1.05, 1.75, 84.8, 0.68, -24.8, matCartGreen, false);
  addBox(outsideGroup, 1.38, 0.14, 1.9, 84.8, 1.98, -24.8, matTrikeRed, false);
  addBox(outsideGroup, 0.06, 0.9, 0.06, 84.25, 1.55, -25.6, matSilverSteel, false);
  addBox(outsideGroup, 0.06, 0.9, 0.06, 85.35, 1.55, -24.0, matSilverSteel, false);
  addBox(outsideGroup, 1.15, 0.98, 1.65, 84.8, 0.64, -27.6, matCartBlue, false);
  const vendorPole1 = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.03, 0.035, 2.4, 6)), matSilverSteel);
  vendorPole1.position.set(84.8, 1.2, -27.6);
  outsideGroup.add(vendorPole1);
  const vendorUmb1 = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(1.35, 0.48, 8)), matManilaYellow);
  vendorUmb1.position.set(84.8, 2.48, -27.6);
  outsideGroup.add(vendorUmb1);
  const vendorUmb2 = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(1.25, 0.44, 8)), matUmbrellaBlue);
  vendorUmb2.position.set(85.1, 2.42, -29.4);
  outsideGroup.add(vendorUmb2);

  // East Anonas Street Sidewalk + Forest-Green Corrugated PNR Construction Fence + Real 2026 Corner Kiosks (EQUALTEA · Jelly Citea · Julie Canteen!)
  const matAnonasGreenFence = trackMat(new THREE.MeshStandardMaterial({ color: 0x1d703b, roughness: 0.66, metalness: 0.28 }));
  const matJerseyConcrete = trackMat(new THREE.MeshStandardMaterial({ color: 0xb2b0a8, roughness: 0.92 }));
  addBox(outsideGroup, 2.1, 0.15, 44.0, 95.8, 0.075, -33.2, matSidewalkConc, false);
  addBox(outsideGroup, 2.1, 0.15, 44.0, 95.8, 0.075, 25.4, matSidewalkConc, false);
  for (const [fzStart, fzEnd] of [
    [-50.0, -11.4],
    [3.2, 48.0],
  ] as Array<[number, number]>) {
    const fLen = fzEnd - fzStart;
    const fMid = (fzStart + fzEnd) / 2;
    addBox(outsideGroup, 0.62, 0.92, fLen, 96.7, 0.46, fMid, matJerseyConcrete, false);
    addBox(outsideGroup, 0.14, 1.95, fLen, 96.76, 1.85, fMid, matAnonasGreenFence, false);
    addCollider(`anonas-pnr-fence-${fzStart > 0 ? 's' : 'n'}`, 96.75, fMid, 0.72, fLen);
  }
  // Compact sidewalk student kiosks along Anonas St East facing PUP Main Gate (2026 Google Maps: EQUALTEA, Jelly Citea Cafe, Julie Canteen!)
  const anonasKiosks: Array<{ z: number; title: string; sub: string; bg: string; canopy: THREE.Material }> = [
    { z: -14.4, title: 'EQUALTEA · ANONAS', sub: 'MILK TEA · FRUIT TEA · SNACKS', bg: '#1e5b46', canopy: matUmbrellaBlue },
    { z: -20.2, title: 'JELLY CITEA CAFE', sub: 'ICED COFFEE · PEARL SHAKES', bg: '#7d2f1e', canopy: matUmbrellaRed },
    { z: -26.2, title: 'JULIE CANTEEN', sub: 'STUDENT SILOG · LUTONG ULAM', bg: '#1c4d8a', canopy: matManilaYellow },
  ];
  for (const k of anonasKiosks) {
    addBox(outsideGroup, 1.25, 1.05, 3.6, 95.95, 0.62, k.z, matCreamWall, false);
    addBox(outsideGroup, 1.32, 0.08, 3.7, 95.95, 1.18, k.z, matSilverSteel, false);
    addBox(outsideGroup, 1.65, 0.12, 4.0, 95.75, 2.55, k.z, k.canopy, false);
    addBox(outsideGroup, 0.06, 2.4, 0.06, 95.1, 1.35, k.z - 1.75, matDarkSteel, false);
    addBox(outsideGroup, 0.06, 2.4, 0.06, 95.1, 1.35, k.z + 1.75, matDarkSteel, false);
    addSignMesh(outsideGroup, 3.4, 0.72, 95.02, 2.55, k.z, -Math.PI / 2, k.title, k.sub, {
      bg: k.bg,
      border: '#f5cb22',
      titleColor: '#ffffff',
      width: 440,
      height: 140,
    });
  }

  // Concrete Meralco Utility Poles flanking Anonas Street outside PUP Main Gate + Dense Overhead Manila Cable Bundle
  const anonasPoles: Array<[number, number, boolean]> = [
    [85.6, -22.2, false],
    [85.6, 15.6, false],
    [95.8, -12.2, true],
    [95.8, 4.2, false],
  ];
  for (const [px, pz, hazard] of anonasPoles) {
    const aPole = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.15, 0.22, 10.4, 8)), matRawConcrete);
    aPole.position.set(px, 5.2, pz);
    outsideGroup.add(aPole);
    addBox(outsideGroup, 1.35, 0.12, 0.12, px, 9.2, pz, matDarkSteel, false);
    if (hazard) {
      for (let hy = 0.45; hy <= 2.2; hy += 0.42) {
        const band = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.225, 0.23, 0.2, 8)),
          Math.round(hy * 10) % 2 === 0 ? matManilaYellow : matDarkSteel,
        );
        band.position.set(px, hy, pz);
        outsideGroup.add(band);
      }
    }
  }
  for (const [cx, cy] of [
    [85.6, 8.6],
    [85.6, 8.35],
    [85.6, 8.1],
    [95.8, 8.6],
    [95.8, 8.2],
  ] as Array<[number, number]>) {
    addBox(outsideGroup, 0.06, 0.06, 46.0, cx, cy, -3.5, matCable, false);
  }
  addBox(outsideGroup, 10.4, 0.04, 0.04, 90.7, 8.5, -12.2, matCable, false);
  addBox(outsideGroup, 10.4, 0.04, 0.04, 90.7, 8.4, 4.2, matCable, false);

  // --- 1B-2: PNR STA. MESA RAILWAY CROSSING & TWIN-DECK ELEVATED NLEX-SLEX CONNECTOR VIADUCT
  //           (x = 96.5..115.5, ~42m East of PUP Main Gate — exact 2026 drone photo order!) ---
  const matBallast = trackMat(new THREE.MeshStandardMaterial({ color: 0x5d6155, roughness: 0.96 }));
  const matRailSteel = trackMat(new THREE.MeshStandardMaterial({ color: 0x6f757a, roughness: 0.4, metalness: 0.72 }));
  const matPnrOrange = trackMat(new THREE.MeshStandardMaterial({ color: 0xe2581d, roughness: 0.42, metalness: 0.25 }));
  const matPnrBlue = trackMat(new THREE.MeshStandardMaterial({ color: 0x264b7c, roughness: 0.48, metalness: 0.25 }));
  const matPlatformCanopy = trackMat(new THREE.MeshStandardMaterial({ color: 0x7b4c3d, roughness: 0.72 }));
  const matViaduct = trackMat(new THREE.MeshStandardMaterial({ color: 0xa2a09a, roughness: 0.84 }));

  // Gravel railway bed running N–S immediately east of Anonas St (terminates cleanly south of z = 58 where tracks veer SE away from Brgy. 630 & Futura Centro)
  const railBed = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(14.0, 152)), matBallast);
  railBed.rotation.x = -Math.PI / 2;
  railBed.position.set(104.8, 0.024, -18);
  railBed.receiveShadow = true;
  outsideGroup.add(railBed);

  // Twin parallel rail tracks + timber sleepers (x = 102.0 & 107.0)
  for (const trackX of [102.0, 107.0]) {
    addBox(outsideGroup, 0.1, 0.13, 148, trackX - 0.55, 0.08, -18, matRailSteel, false);
    addBox(outsideGroup, 0.1, 0.13, 148, trackX + 0.55, 0.08, -18, matRailSteel, false);
    for (let sz = -74; sz <= 54; sz += 1.8) {
      if (sz > -9.2 && sz < 1.2) continue; // Smooth level-crossing concrete road planks along Teresa St
      addBox(outsideGroup, 1.85, 0.07, 0.22, trackX, 0.05, sz, matDarkSteel, false);
    }
  }
  // Level-crossing asphalt/concrete roadway apron bridging Anonas St -> PNR -> Teresa St
  const crossingDeck = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(22.0, 10.2)), matAsphalt);
  crossingDeck.rotation.x = -Math.PI / 2;
  crossingDeck.position.set(105.5, 0.032, -4.0);
  crossingDeck.receiveShadow = true;
  outsideGroup.add(crossingDeck);

  // Yellow-black PNR Level-Crossing Warning Signposts flanking Teresa St crossing
  for (const [cx, cz, ry, xOff] of [
    [98.6, -9.8, -Math.PI / 2, -0.14],
    [111.6, 1.8, Math.PI / 2, 0.14],
  ] as Array<[number, number, number, number]>) {
    addBox(outsideGroup, 0.14, 3.4, 0.14, cx, 1.7, cz, matManilaYellow, false);
    addBox(outsideGroup, 0.18, 0.45, 0.18, cx, 0.9, cz, matDarkSteel, false);
    addBox(outsideGroup, 0.18, 0.45, 0.18, cx, 1.9, cz, matDarkSteel, false);
    addBox(outsideGroup, 0.08, 0.66, 2.26, cx + xOff * 0.5, 3.1, cz, matDarkSteel, false);
    addSignMesh(outsideGroup, 2.2, 0.62, cx + xOff, 3.1, cz, ry, 'PNR CROSSING', 'STOP · LOOK · LISTEN', {
      bg: '#ebb91b',
      border: '#181818',
      titleColor: '#141414',
    });
  }

  // PNR Sta. Mesa Station twin covered commuter platforms (north of Teresa crossing, z = -17..-41)
  for (const [platId, platX] of [
    ['pnr-platform-west', 98.8],
    ['pnr-platform-east', 110.6],
  ] as Array<[string, number]>) {
    addBox(outsideGroup, 2.6, 0.68, 24, platX, 0.34, -29, matRawConcrete);
    addBox(outsideGroup, 3.0, 0.24, 24.4, platX, 3.6, -29, matPlatformCanopy);
    for (let pz = -38; pz <= -20; pz += 6) {
      addBox(outsideGroup, 0.24, 3.15, 0.24, platX, 1.92, pz, matRawConcrete, false);
    }
    addCollider(platId, platX, -29, 2.8, 24.0);
  }
  addSignMesh(outsideGroup, 5.4, 0.9, 97.4, 3.55, -24, -Math.PI / 2, 'PNR STA. MESA STATION', '42m FROM PUP MAIN GATE', {
    bg: '#1c3b68',
    border: '#e2581d',
    titleColor: '#ffffff',
  });
  // Orange plastic construction/safety barriers flanking rail track edges north of crossing
  for (let bz = -15.6; bz <= -11.4; bz += 1.4) {
    addBox(outsideGroup, 0.55, 0.88, 1.15, 98.8, 0.44, bz, matPnrOrange, false);
  }

  // Iconic PNR DEL #918 Orange Locomotive + 2 Blue-and-Silver Passenger Coaches parked on East Track
  const trainGroup = new THREE.Group();
  trainGroup.position.set(107.0, 0.16, -29);
  addBox(trainGroup, 2.75, 3.35, 10.5, 0, 1.9, 6.2, matPnrOrange);
  addBox(trainGroup, 2.85, 0.72, 10.9, 0, 0.48, 6.2, matDarkSteel);
  addBox(trainGroup, 1.9, 0.65, 0.14, 0, 2.75, 11.48, matGlass, false);
  addSignMesh(trainGroup, 1.8, 0.55, 0, 1.85, 11.52, 0, 'PNR 918', '', {
    bg: '#e2581d',
    border: 'none',
    titleColor: '#141414',
  });
  for (const cz of [-6.0, -19.2]) {
    addBox(trainGroup, 2.72, 3.15, 12.2, 0, 1.85, cz, matBrightWhite);
    addBox(trainGroup, 2.78, 1.2, 12.3, 0, 1.25, cz, matPnrBlue, false);
    addBox(trainGroup, 2.78, 0.25, 12.3, 0, 0.55, cz, matPnrOrange, false);
    addBox(trainGroup, 2.8, 0.9, 10.6, 0, 2.35, cz, matGlass, false);
  }
  outsideGroup.add(trainGroup);

  // TWIN-DECK ELEVATED NLEX-SLEX CONNECTOR EXPRESSWAY VIADUCT (directly above PNR at y = 10.8m, Jan 2026 drone photo!)
  // Two parallel concrete box-girder decks terminating cleanly past the z=56 pier where the real viaduct veers SE away from Maui Oasis & Futura Centro
  for (const deckX of [101.2, 110.4]) {
    addBox(outsideGroup, 6.4, 1.25, 158, deckX, 10.8, -19, matViaduct, false);
    addBox(outsideGroup, 0.42, 0.88, 158, deckX - 3.0, 11.82, -19, matRawConcrete, false);
    addBox(outsideGroup, 0.42, 0.88, 158, deckX + 3.0, 11.82, -19, matRawConcrete, false);
  }
  // Massive T-shaped concrete portal piers straddling the PNR corridor with a 22m wide clear span over Teresa St!
  const viaductPierZs = [-56, -34, -14.8, 7.6, 32, 56];
  for (let pi = 0; pi < viaductPierZs.length; pi++) {
    const vz = viaductPierZs[pi];
    // Twin vertical concrete portal columns + horizontal hammerhead cap beam
    addBox(outsideGroup, 1.75, 10.2, 1.85, 96.4, 5.1, vz, matRawConcrete, false);
    addBox(outsideGroup, 1.75, 10.2, 1.85, 114.6, 5.1, vz, matRawConcrete, false);
    addBox(outsideGroup, 20.6, 1.35, 2.1, 105.5, 9.85, vz, matRawConcrete, false);
    addCollider(`nlex-pier-w-${pi}`, 96.4, vz, 1.9, 2.0);
    addCollider(`nlex-pier-e-${pi}`, 114.6, vz, 1.9, 2.0);
    // Overhead expressway twin-arm LED lamp post on viaduct deck
    addBox(outsideGroup, 0.14, 4.4, 0.14, 105.8, 13.4, vz, matSilverSteel, false);
    addBox(outsideGroup, 2.8, 0.1, 0.14, 105.8, 15.5, vz, matSilverSteel, false);
  }
  // Iconic blue NLEX-SLEX Connector viaduct overhead gantry sign visible from Anonas & Teresa St
  addSignMesh(outsideGroup, 5.8, 1.15, 98.0, 12.1, -4.0, -Math.PI / 2, 'NLEX–SLEX CONNECTOR', 'STA. MESA · ESPAÑA · CALOOCAN', {
    bg: '#164d8c',
    border: '#ffffff',
    titleColor: '#ffffff',
  });

  // Overhead orange "Teresa RR XING ← Teresa Train Stn" sign right past PNR crossing (Instant Street View May 2026!)
  addBox(outsideGroup, 0.12, 6.2, 0.12, 115.6, 3.1, -9.2, matDarkSteel, false);
  addBox(outsideGroup, 0.12, 6.2, 0.12, 115.6, 3.1, 1.2, matDarkSteel, false);
  addBox(outsideGroup, 0.14, 0.18, 10.6, 115.6, 5.95, -4.0, matDarkSteel, false);
  addSignMesh(outsideGroup, 2.8, 0.92, 115.48, 5.5, -4.0, -Math.PI / 2, 'TERESA · RR XING', '← TERESA TRAIN STN', {
    bg: '#e59a24',
    border: '#3a2410',
    titleColor: '#1a120b',
  });
  addSignMesh(outsideGroup, 2.8, 0.92, 115.72, 5.5, -4.0, Math.PI / 2, 'TERESA · RR XING', 'TERESA TRAIN STN →', {
    bg: '#e59a24',
    border: '#3a2410',
    titleColor: '#1a120b',
  });

  // --- 1B-3: DETAILED, STREET-VIEW-VERIFIED TERESA STREET CORRIDOR (x = 115.5..201.5, z = -4.0) ---
  // Calibrated frame-by-frame from May 2026 Google Street View (Instant Street View) along Teresa St.
  // Continuous 2-lane asphalt street (~8.4m wide) from PNR/NLEX Connector straight to Old Sta. Mesa St.
  const teresaRoad = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(88.0, 8.4)), matAsphalt);
  teresaRoad.rotation.x = -Math.PI / 2;
  teresaRoad.position.set(158.8, 0.025, -4.0);
  teresaRoad.receiveShadow = true;
  outsideGroup.add(teresaRoad);

  // Subtle dashed centerline along Teresa St.
  for (let tx = 120; tx <= 196; tx += 6.2) {
    addBox(outsideGroup, 2.6, 0.024, 0.14, tx, 0.028, -4.0, matGold, false);
  }
  // Pedestrian crosswalks at West end (PNR exit) and East end (Old Sta. Mesa)
  for (const cwX of [117.6, 200.4]) {
    for (let cz = -7.6; cz <= -0.4; cz += 1.15) {
      addBox(outsideGroup, 2.4, 0.028, 0.5, cwX, 0.031, cz, matBrightWhite, false);
    }
  }

  // Raised concrete sidewalks flanking both North & South sides of Teresa Street
  addBox(outsideGroup, 86.0, 0.14, 2.2, 158.8, 0.07, -9.3, matSidewalkConc, false);
  addBox(outsideGroup, 86.0, 0.14, 2.2, 158.8, 0.07, 1.3, matSidewalkConc, false);

  // Authentic MANILA BLUE-AND-YELLOW STRIPED CURBS along the entire length of Teresa Street (May 2026 Street View!)
  let curbToggle = false;
  for (let cx = 116.8; cx <= 200.6; cx += 2.0) {
    const curbMat = curbToggle ? matManilaYellow : matManilaBlue;
    addBox(outsideGroup, 1.98, 0.17, 0.24, cx, 0.085, -8.22, curbMat, false);
    addBox(outsideGroup, 1.98, 0.17, 0.24, cx, 0.085, 0.22, curbMat, false);
    curbToggle = !curbToggle;
  }

  // Calibrated Google Maps Real Distance Signposts along North Curb of Teresa Street (facing walkers from PUP Gate!)
  const distanceMarkers: Array<{ x: number; title: string; sub: string }> = [
    { x: 117.0, title: 'TERESA ST · 50m', sub: 'BANANA ISLAND · RBS' },
    { x: 148.2, title: 'TERESA ST · 120m', sub: '7-ELEVEN · PST · SMILE POD' },
    { x: 179.0, title: 'TERESA ST · 175m', sub: "ESPERANZA · ANGEL'S · PALAWAN" },
    { x: 199.8, title: 'OLD STA. MESA · 215m', sub: 'COVERED COURT · BRGY. 591' },
  ];
  for (const dm of distanceMarkers) {
    const post = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.045, 0.055, 3.05, 6)), matDarkSteel);
    post.position.set(dm.x, 1.52, -8.58);
    outsideGroup.add(post);
    addBox(outsideGroup, 0.08, 0.62, 1.94, dm.x, 2.74, -8.58, matDarkSteel, false);
    addSignMesh(outsideGroup, 1.88, 0.56, dm.x - 0.06, 2.74, -8.58, -Math.PI / 2, dm.title, dm.sub, {
      bg: '#7b1113',
      border: '#e5a91a',
      titleColor: '#ffffff',
    });
    addSignMesh(outsideGroup, 1.88, 0.56, dm.x + 0.06, 2.74, -8.58, Math.PI / 2, dm.title, dm.sub, {
      bg: '#7b1113',
      border: '#e5a91a',
      titleColor: '#ffffff',
    });
  }

  // Additional authentic Street View palette materials for Teresa Street stalls
  const matLimePst = trackMat(new THREE.MeshStandardMaterial({ color: 0x7bc25c, roughness: 0.78 }));
  const matMintHealth = trackMat(new THREE.MeshStandardMaterial({ color: 0x84c2b7, roughness: 0.8 }));
  const matRbsBlue = trackMat(new THREE.MeshStandardMaterial({ color: 0x1a66ba, roughness: 0.74 }));
  const matRbsRust = trackMat(new THREE.MeshStandardMaterial({ color: 0x7d3028, roughness: 0.85 }));
  const matMustardSmile = trackMat(new THREE.MeshStandardMaterial({ color: 0xe3b126, roughness: 0.72 }));
  const matAngelOrange = trackMat(new THREE.MeshStandardMaterial({ color: 0xf08c16, roughness: 0.62 }));
  const matCorrugatedGreen = trackMat(new THREE.MeshStandardMaterial({ color: 0x2d4a3a, roughness: 0.76, metalness: 0.35 }));
  const matBrgySlate = trackMat(new THREE.MeshStandardMaterial({ color: 0x5c6678, roughness: 0.8 }));
  const matGrottoBlue = trackMat(new THREE.MeshStandardMaterial({ color: 0x2f85c4, roughness: 0.75 }));
  const matBanderitaOrange = trackMat(new THREE.MeshStandardMaterial({ color: 0xf27d16, side: THREE.DoubleSide, roughness: 0.65 }));
  const matBanderitaPink = trackMat(new THREE.MeshStandardMaterial({ color: 0xe84a76, side: THREE.DoubleSide, roughness: 0.65 }));
  const matBanderitaCyan = trackMat(new THREE.MeshStandardMaterial({ color: 0x2692e6, side: THREE.DoubleSide, roughness: 0.65 }));
  const matBanderitaYellow = trackMat(new THREE.MeshStandardMaterial({ color: 0xf5cb22, side: THREE.DoubleSide, roughness: 0.65 }));

  // Helper: sidewalk dining umbrella + student plastic table & stools
  const addSidewalkUmbrella = (ux: number, uz: number, canopyMat: THREE.Material) => {
    const pole = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.035, 0.04, 2.35, 6)), matSilverSteel);
    pole.position.set(ux, 1.2, uz);
    outsideGroup.add(pole);
    const canopy = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(1.18, 0.42, 8)), canopyMat);
    canopy.position.set(ux, 2.42, uz);
    outsideGroup.add(canopy);
    addBox(outsideGroup, 0.9, 0.06, 0.68, ux, 0.78, uz, matBrightWhite, false);
    addBox(outsideGroup, 0.08, 0.72, 0.08, ux, 0.4, uz, matDarkSteel, false);
  };

  // Helper: detailed multi-bay Manila Teresa Street shophouse with narrow micro-stalls, carinderia display counters,
  // Aice/Selecta freezers, perpendicular blade signs, awning support posts, upper jalousies & AC boxes!
  const matFreezerRed = trackMat(new THREE.MeshStandardMaterial({ color: 0xd92b2b, roughness: 0.42, metalness: 0.12 }));
  const matFoodWarmGlow = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xffe2a8, emissive: 0xffb84d, emissiveIntensity: 0.32, roughness: 0.35 }),
  );
  let teresaShopSeed = 1;
  const addTeresaShophouse = (opts: {
    id: string;
    x: number;
    z: number;
    w: number;
    h: number;
    d: number;
    color: number;
    sign: string;
    sub: string;
    signBg: string;
    signBorder?: string;
    signTitleColor?: string;
    awningMat?: THREE.Material;
    groundWallMat?: THREE.Material;
    shutterMat?: THREE.Material;
    glowGround?: boolean;
    umbrellaMat?: THREE.Material;
    stallKind?: 'carinderia' | 'print-shop' | 'kiosk' | 'shutter';
    bladeLabel?: string;
    bladeBg?: string;
  }) => {
    const seed = teresaShopSeed++;
    const facadeMat = trackMat(new THREE.MeshStandardMaterial({ color: opts.color, roughness: 0.84 }));
    addBox(outsideGroup, opts.w, opts.h, opts.d, opts.x, opts.h / 2, opts.z, facadeMat);
    addCollider(opts.id, opts.x, opts.z, opts.w, opts.d);

    const facingZ = opts.z < -4 ? opts.z + opts.d / 2 : opts.z - opts.d / 2;
    const faceDir = opts.z < -4 ? 1 : -1;
    const rotY = faceDir > 0 ? 0 : Math.PI;

    // Optional distinct ground-floor painted facade wrap (e.g. 7-Eleven yellow, Smile POD mustard, RBS cobalt blue)
    if (opts.groundWallMat) {
      addBox(outsideGroup, opts.w + 0.08, 3.35, 0.16, opts.x, 1.675, facingZ + faceDir * 0.02, opts.groundWallMat, false);
    }

    // Parapet roofline cornice + slim steel rain gutter
    addBox(outsideGroup, opts.w + 0.24, 0.36, opts.d + 0.24, opts.x, opts.h + 0.14, opts.z, matCreamWall, false);
    addBox(outsideGroup, opts.w + 0.18, 0.12, 0.14, opts.x, opts.h - 0.05, facingZ + faceDir * 0.18, matDarkSteel, false);

    // Subdivided narrow Manila micro-stall bays (~2.8–4.4m each) with authentic ground-floor variety!
    const bays = computeTeresaStallBays(opts.w, seed, opts.stallKind);
    for (let bi = 0; bi < bays.length; bi++) {
      const bay = bays[bi];
      const bx = opts.x + bay.localX;
      // Masonry divider pier between individual narrow stalls
      if (bi > 0) {
        const pierX = bx - bay.width / 2 - 0.08;
        addBox(outsideGroup, 0.22, 3.25, 0.28, pierX, 1.625, facingZ + faceDir * 0.1, matCreamWall, false);
      }

      if (bay.kind === 'carinderia') {
        // Open turo-turo eatery counter + warm stainless-steel glass food display case + monobloc stools
        addBox(outsideGroup, bay.width, 2.42, 0.2, bx, 1.28, facingZ + faceDir * 0.05, matFoodWarmGlow, false);
        addBox(outsideGroup, bay.width * 0.88, 0.88, 0.56, bx, 0.52, facingZ + faceDir * 0.38, matCreamWall, false);
        addBox(outsideGroup, bay.width * 0.9, 0.06, 0.62, bx, 0.98, facingZ + faceDir * 0.38, matSilverSteel, false);
        // Sneeze-guard glass food warmer box atop counter
        addBox(outsideGroup, bay.width * 0.72, 0.44, 0.44, bx, 1.22, facingZ + faceDir * 0.38, matGlass, false);
        // Pair of red/blue plastic monobloc stools right at counter edge
        for (const sx of [-0.55, 0.55]) {
          addBox(outsideGroup, 0.32, 0.44, 0.32, bx + sx, 0.3, facingZ + faceDir * 0.95, bi % 2 === 0 ? matTrikeRed : matManilaBlue, false);
        }
      } else if (bay.kind === 'print-shop') {
        // Recessed aluminum-framed photocopy/print shopfront + service pass-through counter
        addBox(outsideGroup, bay.width, 2.42, 0.22, bx, 1.28, facingZ + faceDir * 0.05, opts.glowGround ? matWindowGlow : matGlass, false);
        addBox(outsideGroup, bay.width + 0.04, 0.08, 0.28, bx, 2.48, facingZ + faceDir * 0.08, matSilverSteel, false);
        addBox(outsideGroup, bay.width * 0.82, 0.1, 0.46, bx, 0.96, facingZ + faceDir * 0.32, matSilverSteel, false);
        addBox(outsideGroup, 0.06, 2.4, 0.24, bx, 1.28, facingZ + faceDir * 0.08, matSilverSteel, false);
      } else if (bay.kind === 'kiosk') {
        // Sari-sari / snack kiosk window with steel security grille + colorful ice-cream chest freezer (Aice/Selecta!)
        addBox(outsideGroup, bay.width, 2.42, 0.2, bx, 1.28, facingZ + faceDir * 0.05, opts.glowGround ? matWindowGlow : matGlass, false);
        addBox(outsideGroup, bay.width, 0.92, 0.28, bx, 0.52, facingZ + faceDir * 0.12, opts.groundWallMat ?? matCreamWall, false);
        for (let gx = -bay.width * 0.38; gx <= bay.width * 0.38; gx += 0.34) {
          addBox(outsideGroup, 0.028, 1.38, 0.028, bx + gx, 1.72, facingZ + faceDir * 0.2, matDarkSteel, false);
        }
      } else {
        // Corrugated roll-up steel security shutter with bottom handle bar
        addBox(outsideGroup, bay.width, 2.44, 0.2, bx, 1.28, facingZ + faceDir * 0.06, opts.shutterMat ?? matSilverSteel, false);
        for (let sy = 0.45; sy <= 2.25; sy += 0.36) {
          addBox(outsideGroup, bay.width + 0.02, 0.03, 0.22, bx, sy, facingZ + faceDir * 0.07, matDarkSteel, false);
        }
      }

      if (bay.hasFreezer) {
        // Iconic red-and-white Aice / Selecta sidewalk ice cream chest freezer (bing_teresa_real.png!)
        addBox(outsideGroup, 0.96, 0.82, 0.58, bx + bay.width * 0.26, 0.52, facingZ + faceDir * 0.44, matBrightWhite, false);
        addBox(outsideGroup, 0.98, 0.32, 0.6, bx + bay.width * 0.26, 0.32, facingZ + faceDir * 0.44, matFreezerRed, false);
        addBox(outsideGroup, 0.92, 0.06, 0.52, bx + bay.width * 0.26, 0.95, facingZ + faceDir * 0.44, matGlass, false);
      }
    }

    // Sloped corrugated sidewalk awning canopy + slim tubular steel support struts at outer edge
    const awning = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(opts.w * 0.98, 0.11, 1.65)),
      opts.awningMat ?? matAwning,
    );
    awning.position.set(opts.x, 2.86, facingZ + faceDir * 0.84);
    awning.rotation.x = faceDir * 0.18;
    outsideGroup.add(awning);
    for (const postOff of [-opts.w * 0.44, opts.w * 0.44]) {
      addBox(outsideGroup, 0.065, 2.66, 0.065, opts.x + postOff, 1.4, facingZ + faceDir * 1.56, matDarkSteel, false);
    }

    // Perpendicular projecting hanging blade sign over sidewalk (authentic Teresa St visual density!)
    if (opts.bladeLabel) {
      const bladeX = opts.x + (seed % 2 === 0 ? opts.w * 0.4 : -opts.w * 0.4);
      addBox(outsideGroup, 0.06, 0.06, 1.05, bladeX, 3.68, facingZ + faceDir * 0.6, matDarkSteel, false);
      addSignMesh(outsideGroup, 0.92, 0.52, bladeX + 0.05, 3.42, facingZ + faceDir * 0.82, Math.PI / 2, opts.bladeLabel, '', {
        bg: opts.bladeBg ?? opts.signBg,
        border: '#ffffff',
        titleColor: '#ffffff',
        width: 240,
        height: 140,
      });
      addSignMesh(outsideGroup, 0.92, 0.52, bladeX - 0.05, 3.42, facingZ + faceDir * 0.82, -Math.PI / 2, opts.bladeLabel, '', {
        bg: opts.bladeBg ?? opts.signBg,
        border: '#ffffff',
        titleColor: '#ffffff',
        width: 240,
        height: 140,
      });
    }

    // Upper-floor residential/dorm window bands with vertical mullions + rain sun-hood + outdoor AC condenser units
    for (let fy = 4.65; fy < opts.h - 1.1; fy += 2.85) {
      addBox(outsideGroup, opts.w * 0.78, 1.24, 0.16, opts.x, fy, facingZ + faceDir * 0.05, matGlass, false);
      for (const mx of [-opts.w * 0.24, 0, opts.w * 0.24]) {
        addBox(outsideGroup, 0.08, 1.26, 0.2, opts.x + mx, fy, facingZ + faceDir * 0.08, matCreamWall, false);
      }
      addBox(outsideGroup, opts.w * 0.84, 0.12, 0.34, opts.x, fy - 0.65, facingZ + faceDir * 0.15, matCreamWall, false);
      addBox(outsideGroup, opts.w * 0.84, 0.1, 0.38, opts.x, fy + 0.66, facingZ + faceDir * 0.18, matRawConcrete, false);
      addBox(outsideGroup, 0.62, 0.44, 0.42, opts.x + opts.w * 0.29, fy - 0.3, facingZ + faceDir * 0.25, matBrightWhite, false);
    }

    // Crisp commercial signboard above awning
    addSignMesh(
      outsideGroup,
      Math.min(opts.w * 0.92, 7.8),
      0.98,
      opts.x,
      3.58,
      facingZ + faceDir * 0.18,
      rotY,
      opts.sign,
      opts.sub,
      {
        bg: opts.signBg,
        border: opts.signBorder ?? '#f2ca68',
        titleColor: opts.signTitleColor ?? '#ffffff',
      },
    );

    if (opts.umbrellaMat) {
      addSidewalkUmbrella(opts.x - opts.w * 0.24, facingZ + faceDir * 1.48, opts.umbrellaMat);
    }
  };

  // =========================================================================
  // NORTH SIDE OF TERESA STREET (Left side walking East — 2026 Google Maps & Street View!)
  // Order: Banana Island & Blaze Print → Wengdy's Foodhaus & Smile Barbershop / GCash →
  //        Shin K-Mart & Smokle Vape → 7-Eleven (1532) & Danpel Elegance Toga →
  //        Best BBQ Teresa & Compound → Esperanza Health Center →
  //        Teresa Chapel → Teresa Covered Court
  // =========================================================================

  // N1. BANANA ISLAND & BLAZE PRINTING SHOP (2026 Google Maps + Street View corner stall right past PNR tracks!)
  addTeresaShophouse({
    id: 'teresa-banana-island',
    x: 122.5,
    z: -14.3,
    w: 9.4,
    h: 7.8,
    d: 7.4,
    color: 0xece8df,
    sign: 'BANANA ISLAND · BLAZE PRINT',
    sub: 'XEROX · PRINTING · LADY BEDSPACE',
    signBg: '#f4f0e4',
    signBorder: '#b82428',
    signTitleColor: '#1d1a16',
    shutterMat: matTrikeRed,
    awningMat: matBrgyBlue,
    stallKind: 'print-shop',
    bladeLabel: 'XEROX · PRINT',
    bladeBg: '#b82428',
  });
  // Signature circular white overhang sign disk above Banana Island awning
  const bananaDisk = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.95, 0.95, 0.14, 16)), matBrightWhite);
  bananaDisk.rotation.x = Math.PI / 2;
  bananaDisk.position.set(121.0, 4.75, -9.85);
  outsideGroup.add(bananaDisk);

  // N2. WENGDY'S FOODHAUS · SMILE BARBERSHOP · GCash / LASER PRINT (2026 Google Maps!)
  addTeresaShophouse({
    id: 'teresa-gcash-xerox',
    x: 133.0,
    z: -14.3,
    w: 9.4,
    h: 8.6,
    d: 7.4,
    color: 0xd9d4c7,
    sign: "WENGDY'S FOODHAUS · GCASH · PRINT",
    sub: 'SMILE BARBERSHOP · RHANJ SWEETS · RUSH ID',
    signBg: '#1665c0',
    signBorder: '#ffffff',
    shutterMat: matDormOchre,
    stallKind: 'carinderia',
    bladeLabel: 'GCASH · LOAD',
    bladeBg: '#1470d6',
  });
  // Upstairs blue "GCash Para maka-load" awning banner
  addSignMesh(outsideGroup, 4.6, 0.72, 131.6, 5.1, -10.38, 0, 'GCash · Para maka-load', 'SMART · GLOBE · E-LOAD', {
    bg: '#1470d6',
    border: '#ffffff',
    titleColor: '#ffffff',
  });

  // N3. SHIN K-MART PUP BRANCH & SMOKLE VAPE SHOP (2026 Google Maps!)
  addTeresaShophouse({
    id: 'teresa-smokle-vape',
    x: 143.2,
    z: -14.3,
    w: 8.6,
    h: 9.2,
    d: 7.4,
    color: 0xe3ded3,
    sign: 'SHIN K-MART PUP · Smokle VAPE',
    sub: 'KOREAN RAMYUN · SNACKS · TERESA ST.',
    signBg: '#15171a',
    signBorder: '#f2f2f2',
    signTitleColor: '#ffffff',
    shutterMat: matDarkSteel,
    stallKind: 'kiosk',
    bladeLabel: 'K-MART · VAPE',
    bladeBg: '#1c1f24',
  });

  // N4. 7-ELEVEN (1532) PUP TERESA & DANPEL ELEGANCE TOGA / UNIFORM (2026 Google Maps!)
  addTeresaShophouse({
    id: 'teresa-7eleven',
    x: 153.4,
    z: -14.3,
    w: 9.4,
    h: 9.6,
    d: 7.4,
    color: 0xf0ece2,
    sign: '7-ELEVEN (1532) · DANPEL TOGA',
    sub: 'PUP TERESA · 24/7 · SCHOOL UNIFORMS',
    signBg: '#146b3a',
    signBorder: '#f07b1a',
    groundWallMat: matMustardSmile,
    glowGround: true,
    stallKind: 'kiosk',
    bladeLabel: '7-ELEVEN 24/7',
    bladeBg: '#146b3a',
  });
  // Signature 7-Eleven tri-color horizontal stripe fascia
  addBox(outsideGroup, 9.45, 0.22, 0.24, 153.4, 4.18, -10.48, matAngelOrange, false);
  addBox(outsideGroup, 9.45, 0.18, 0.24, 153.4, 4.38, -10.48, matTrikeRed, false);

  // N5. CORRUGATED GREEN/GRAY COMPOUND WALL + CLIMBING VINES & YELLOW FIESTA BANNER (s4_left.png!)
  addBox(outsideGroup, 9.4, 3.4, 0.28, 164.0, 1.7, -10.75, matCorrugatedGreen, false);
  addBox(outsideGroup, 4.2, 3.4, 0.3, 165.4, 1.7, -10.74, matAwning, false);
  addBox(outsideGroup, 9.4, 9.2, 6.2, 164.0, 4.6, -14.8, matCreamWall);
  addCollider('teresa-green-compound', 164.0, -14.3, 9.4, 7.4);
  // Lush climbing tree foliage draping over the compound wall & pole (s4_left.png!)
  const matTreeFoliageLight = trackMat(new THREE.MeshStandardMaterial({ color: 0x3f803c, roughness: 0.86, flatShading: true }));
  for (const [vx, vy, vz, vr] of [
    [167.2, 3.2, -10.2, 1.05],
    [167.8, 4.6, -10.1, 1.25],
    [166.2, 5.4, -10.5, 1.3],
    [168.1, 2.0, -10.15, 0.72],
  ] as Array<[number, number, number, number]>) {
    const vine = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(vr, 1)), matTreeFoliageLight);
    vine.position.set(vx, vy, vz);
    outsideGroup.add(vine);
  }
  // Yellow triangular fiesta flag mounted on wooden pole by the compound gate (s4_left.png!)
  addBox(outsideGroup, 0.08, 4.6, 0.08, 161.2, 2.3, -10.4, matTreeTrunk, false);
  const yellowFiestaFlag = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(1.15, 0.72)), matBanderitaYellow);
  yellowFiestaFlag.position.set(161.8, 4.15, -10.38);
  outsideGroup.add(yellowFiestaFlag);
  animatedFlags.push(yellowFiestaFlag);

  // N6. ESPERANZA HEALTH CENTER & LYING-IN CLINIC (s5_left.png & g2_left.png: iconic mint-green 2-storey clinic!)
  addBox(outsideGroup, 9.4, 7.8, 6.2, 174.6, 3.9, -15.0, matMintHealth);
  addCollider('teresa-esperanza-clinic', 174.6, -14.3, 9.4, 7.4);
  // Concrete entrance canopy + raised awning + PhilHealth signage
  addBox(outsideGroup, 8.8, 0.55, 1.5, 174.6, 3.55, -11.4, matMintHealth, false);
  addSignMesh(outsideGroup, 8.4, 0.72, 174.6, 3.62, -10.62, 0, 'ESPERANZA HEALTH CENTER', '& LYING-IN CLINIC · MANILA', {
    bg: '#75b5a9',
    border: '#1c423a',
    titleColor: '#132622',
  });
  addSignMesh(outsideGroup, 2.6, 0.52, 173.4, 2.68, -11.4, 0, 'PhilHealth', 'YAKAP PARTNER', {
    bg: '#c7d930',
    border: '#1a4a24',
    titleColor: '#122917',
  });
  // 2nd-floor jalousie windows + waving PH Flag
  for (let wx = 171.2; wx <= 178.0; wx += 1.7) {
    addBox(outsideGroup, 0.95, 1.35, 0.16, wx, 5.8, -11.88, matDarkSteel, false);
  }
  // Front iron fence + concrete pillars + white waiting tent awning (s5_left.png!)
  addBox(outsideGroup, 9.4, 0.65, 0.22, 174.6, 0.33, -10.68, matRawConcrete, false);
  for (let fx = 170.2; fx <= 179.0; fx += 0.55) {
    addBox(outsideGroup, 0.04, 1.65, 0.04, fx, 1.45, -10.68, matDarkSteel, false);
  }
  addBox(outsideGroup, 4.8, 0.12, 1.8, 172.8, 2.45, -11.1, matBrightWhite, false);
  // Tall tropical mango tree shading Esperanza & Chapel courtyard (g2_left.png!)
  const clinicTrunk = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.24, 0.34, 5.2, 7)), matTreeTrunk);
  clinicTrunk.position.set(179.2, 2.6, -11.1);
  outsideGroup.add(clinicTrunk);
  for (const [lx, ly, lz, lr, light] of [
    [179.2, 6.2, -11.0, 2.1, false],
    [177.8, 5.8, -10.6, 1.5, true],
    [180.6, 5.7, -10.5, 1.55, true],
  ] as Array<[number, number, number, number, boolean]>) {
    const cLobe = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(lr, 1)), light ? matTreeFoliageLight : matTreeFoliage);
    cLobe.scale.set(1.15, 0.78, 1.05);
    cLobe.position.set(lx, ly, lz);
    outsideGroup.add(cLobe);
  }

  // N7. TERESA CHAPEL — ALAY SA MAHAL NA KRUS (s5_left.png & g2_left.png: crisp white stucco + dark-brown base right beside Esperanza!)
  const teresaChapelGroup = new THREE.Group();
  teresaChapelGroup.position.set(185.2, 0, -14.3);
  outsideGroup.add(teresaChapelGroup);
  addCollider('teresa-chapel', 185.2, -14.3, 9.4, 7.4);
  addBox(teresaChapelGroup, 9.0, 6.8, 7.4, 0, 3.4, 0, matBrightWhite);
  // Signature mahogany-brown lower dado wainscot (g2_left.png!)
  addBox(teresaChapelGroup, 9.08, 1.25, 0.16, 0, 0.63, 3.68, matChapelAwning, false);
  // Stepped curved mission-gable parapet crowning the front facade
  addBox(teresaChapelGroup, 6.4, 1.15, 0.55, 0, 7.35, 3.45, matBrightWhite, false);
  addBox(teresaChapelGroup, 4.2, 1.05, 0.55, 0, 8.35, 3.45, matBrightWhite, false);
  const gableArch = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(1.45, 1.45, 0.55, 16, 1, false, 0, Math.PI)),
    matBrightWhite,
  );
  gableArch.rotation.x = Math.PI / 2;
  gableArch.rotation.z = Math.PI / 2;
  gableArch.position.set(0, 8.85, 3.45);
  teresaChapelGroup.add(gableArch);
  // Golden sunburst cross atop the curved white gable
  addBox(teresaChapelGroup, 0.18, 1.55, 0.14, 0, 10.65, 3.45, matGold, false);
  addBox(teresaChapelGroup, 0.96, 0.16, 0.14, 0, 10.92, 3.45, matGold, false);
  const sunRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.32, 0.045, 8, 16)), matGold);
  sunRing.position.set(0, 10.92, 3.48);
  teresaChapelGroup.add(sunRing);
  // Glass double entrance doors + sloped mahogany-brown chapel awning + twin warm sconces
  addBox(teresaChapelGroup, 3.1, 3.2, 0.22, 0, 1.6, 3.68, matGlass, false);
  addBox(teresaChapelGroup, 0.12, 3.2, 0.26, 0, 1.6, 3.74, matBrightWhite, false);
  const chapelAwning = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(8.8, 0.14, 1.6)), matChapelAwning);
  chapelAwning.position.set(0, 3.65, 4.46);
  chapelAwning.rotation.x = 0.22;
  teresaChapelGroup.add(chapelAwning);
  for (const sx of [-2.45, 2.45]) {
    addBox(teresaChapelGroup, 0.24, 0.36, 0.22, sx, 2.35, 3.8, matTeresaBulb, false);
  }
  addSignMesh(teresaChapelGroup, 5.8, 0.9, 0, 5.15, 3.74, 0, 'ALAY SA MAHAL NA KRUS', 'TERESA CHAPEL · STA. MESA', {
    bg: '#f5f2eb',
    border: '#7b1113',
    titleColor: '#6b1818',
  });

  // N8. TERESA COVERED COURT (s6_left.png: iconic white arched portal + ornate iron scrollwork fence + green roof at Old Sta. Mesa corner!)
  const courtGroup = new THREE.Group();
  courtGroup.position.set(195.6, 0, -14.3);
  outsideGroup.add(courtGroup);
  addCollider('teresa-covered-court', 195.6, -14.3, 9.0, 7.4);
  // Blue-painted barangay basketball court slab & rear wall + arched green corrugated canopy roof
  addBox(courtGroup, 8.8, 0.16, 7.2, 0, 0.08, 0, matManilaBlue, false);
  addBox(courtGroup, 8.8, 6.2, 0.45, 0, 3.1, -3.45, matCreamWall, false);
  addBox(courtGroup, 9.0, 0.42, 7.4, 0, 6.8, 0, matCorrugatedGreen, false);
  // White concrete perimeter low wall + ornate dark-gray iron fence grilles along Teresa St (s6_left.png!)
  addBox(courtGroup, 9.0, 1.15, 0.32, 0, 0.58, 3.55, matBrightWhite, false);
  for (let fx = -4.2; fx <= 4.2; fx += 0.55) {
    if (Math.abs(fx) < 1.25) continue; // Open arched entrance portal
    addBox(courtGroup, 0.06, 2.4, 0.06, fx, 2.35, 3.55, matDarkSteel, false);
  }
  addBox(courtGroup, 9.0, 0.12, 0.16, 0, 3.55, 3.55, matDarkSteel, false);
  // Iconic White Concrete Arched Entrance Gateway (s6_left.png!)
  addBox(courtGroup, 0.58, 4.6, 0.58, -1.45, 2.3, 3.55, matBrightWhite, false);
  addBox(courtGroup, 0.58, 4.6, 0.58, 1.45, 2.3, 3.55, matBrightWhite, false);
  addBox(courtGroup, 3.6, 0.95, 0.58, 0, 4.65, 3.55, matBrightWhite, false);
  addSignMesh(courtGroup, 5.8, 0.85, 0, 5.7, 3.62, 0, 'TERESA COVERED COURT', 'BRGY. 591 · OLD STA. MESA CORNER', {
    bg: '#164ea6',
    border: '#ffffff',
    titleColor: '#ffffff',
  });

  // =========================================================================
  // SOUTH SIDE OF TERESA STREET (Right side walking East — May 2026 Street View!)
  // Order: Blue PNR Fence → RBS Bookbinding & Palceso Printing → Chacha Canteen →
  //        PST (Pastil sa Tabi) & Takam (Lime Green!) → Eufrosino's / Ramos / RDP Graphics →
  //        Smile POD & Elegance → Angel's Burger & Palawan Pawnshop →
  //        Sari-Sari & Blue Apt Row → Brgy. 591 Hall & Mubyl + Blue Grotto
  // =========================================================================

  // Blue corrugated sheet fence flanking PNR exit on South side (test_f1.png!)
  addBox(outsideGroup, 4.2, 2.35, 0.18, 115.8, 1.18, 2.62, matRbsBlue, false);

  // S1. RBS BOOKBINDING · PALCESO PRINT · WHITE SUGAR CAFE (2026 Google Maps!)
  addTeresaShophouse({
    id: 'teresa-rbs-palceso',
    x: 122.0,
    z: 6.3,
    w: 8.4,
    h: 7.4,
    d: 7.4,
    color: 0x7d3028,
    sign: 'RBS BOOKBINDING · WHITE SUGAR CAFE',
    sub: 'PALCESO PRINT · THESIS BIND · XEROX',
    signBg: '#1b1a17',
    signBorder: '#e5b832',
    signTitleColor: '#f5d256',
    groundWallMat: matRbsBlue,
    shutterMat: matSilverSteel,
    awningMat: matRbsRust,
    umbrellaMat: matUmbrellaRed,
    stallKind: 'print-shop',
    bladeLabel: 'BOOKBIND',
    bladeBg: '#1a4f96',
  });
  // Street-food pushcart right in front of RBS Bookbinding
  addBox(outsideGroup, 1.55, 0.92, 0.78, 124.2, 0.68, 1.65, matRbsRust, false);
  addBox(outsideGroup, 1.62, 0.08, 0.85, 124.2, 1.16, 1.65, matSilverSteel, false);
  addBox(outsideGroup, 0.14, 0.42, 0.42, 123.6, 0.22, 1.65, matTireRubber, false);
  addBox(outsideGroup, 0.14, 0.42, 0.42, 124.8, 0.22, 1.65, matTireRubber, false);

  // S2. LCJBLAZE PRINTING SERVICES & CHACHA CANTEEN (2026 Google Maps!)
  addTeresaShophouse({
    id: 'teresa-chacha-canteen',
    x: 131.5,
    z: 6.3,
    w: 8.4,
    h: 7.8,
    d: 7.4,
    color: 0x5c8db5,
    sign: 'LCJBLAZE PRINT · CHACHA CANTEEN',
    sub: 'LUTONG ULAM · BUDGET RICE · PRINTING',
    signBg: '#a83c18',
    signBorder: '#f5c742',
    awningMat: matAwning,
    umbrellaMat: matUmbrellaOrange,
    stallKind: 'carinderia',
    bladeLabel: 'CANTEEN',
    bladeBg: '#a83c18',
  });

  // S3. PASTIL SA TABI (PST) · KIOSK STUFFED SIZZLING HOUSE (2026 Google Maps: bright lime-green facade!)
  addTeresaShophouse({
    id: 'teresa-pst-takam',
    x: 141.5,
    z: 6.3,
    w: 9.4,
    h: 8.6,
    d: 7.4,
    color: 0x7bc25c,
    sign: 'PASTIL SA TABI (PST) · SIZZLING',
    sub: 'CHICKEN PASTIL · SCHOOL SUPPLIES · TAKAM',
    signBg: '#f5f2eb',
    signBorder: '#e87917',
    signTitleColor: '#d45814',
    groundWallMat: matLimePst,
    awningMat: matAngelOrange,
    stallKind: 'carinderia',
    bladeLabel: 'PASTIL · PST',
    bladeBg: '#d45814',
  });
  // Round projecting "PST" sign disk on the lime-green facade
  const pstDisk = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.68, 0.68, 0.14, 16)), matBrightWhite);
  pstDisk.rotation.z = Math.PI / 2;
  pstDisk.position.set(137.4, 4.95, 2.05);
  outsideGroup.add(pstDisk);
  // Red-and-white street-food cart beside PST
  addBox(outsideGroup, 1.48, 0.9, 0.76, 145.0, 0.66, 1.65, matTrikeRed, false);
  addBox(outsideGroup, 1.54, 0.08, 0.82, 145.0, 1.14, 1.65, matBrightWhite, false);
  addBox(outsideGroup, 0.14, 0.42, 0.42, 144.4, 0.22, 1.65, matTireRubber, false);
  addBox(outsideGroup, 0.14, 0.42, 0.42, 145.6, 0.22, 1.65, matTireRubber, false);

  // S4. ANNE STORE · ZACKREUZ PRINTING · RAMOS / RDP GRAPHICS (2026 Google Maps!)
  addTeresaShophouse({
    id: 'teresa-eufrosino-rdp',
    x: 152.2,
    z: 6.3,
    w: 9.4,
    h: 9.2,
    d: 7.4,
    color: 0xd8dce3,
    sign: 'ANNE STORE · ZACKREUZ PRINT · RDP',
    sub: 'BOOKBINDING · TARPAULIN · GROCERIES',
    signBg: '#1c4f9c',
    signBorder: '#f2ca38',
    awningMat: matAwning,
    stallKind: 'print-shop',
    bladeLabel: 'ZACKREUZ',
    bladeBg: '#1c4f9c',
  });
  // Blue "RICE FOR SALE" coolers outside
  addBox(outsideGroup, 0.85, 0.62, 0.55, 149.4, 0.35, 1.85, matManilaBlue, false);
  addBox(outsideGroup, 0.72, 0.54, 0.52, 150.4, 0.31, 1.85, matManilaBlue, false);

  // S5. SMILE POD DENTAL CLINIC & ELEGANCE SALON
  addTeresaShophouse({
    id: 'teresa-smilepod-elegance',
    x: 162.8,
    z: 6.3,
    w: 9.4,
    h: 10.6,
    d: 7.4,
    color: 0xe6dfd2,
    sign: 'Smile POD DENTAL · ELEGANCE',
    sub: 'ORTHODONTICS · HAIR SALON · APT',
    signBg: '#e8b923',
    signBorder: '#473612',
    signTitleColor: '#2b1e08',
    groundWallMat: matMustardSmile,
    glowGround: true,
    stallKind: 'print-shop',
    bladeLabel: 'DENTAL',
    bladeBg: '#c99312',
  });

  // S6. ANGEL'S BURGER · PALAWAN PAWNSHOP / EXPRESS (PUP STA. MESA) · BEST BBQ
  addTeresaShophouse({
    id: 'teresa-angels-palawan',
    x: 173.4,
    z: 6.3,
    w: 9.4,
    h: 9.8,
    d: 7.4,
    color: 0xdcd5c9,
    sign: "Angel's BURGER · PALAWAN EXPRESS",
    sub: 'PAWNSHOP PUP STA. MESA · BEST BBQ',
    signBg: '#f09416',
    signBorder: '#b81d22',
    signTitleColor: '#ffffff',
    groundWallMat: matTrikeRed,
    awningMat: matDarkSteel,
    umbrellaMat: matUmbrellaRed,
    stallKind: 'carinderia',
    bladeLabel: "ANGEL'S",
    bladeBg: '#d92822',
  });
  // Distinct green-and-yellow Palawan Pawnshop / Palawan Express fascia beside Angel's Burger
  addSignMesh(outsideGroup, 4.4, 0.88, 175.6, 4.75, 2.42, Math.PI, 'PALAWAN PAWNSHOP', 'PALAWAN EXPRESS · PUP STA. MESA', {
    bg: '#1c6b3a',
    border: '#f0c724',
    titleColor: '#f5d43d',
  });
  // Signature orange-and-red Angel's Burger counter fascia on the West bay
  addBox(outsideGroup, 3.8, 1.05, 0.28, 170.8, 2.65, 2.35, matAngelOrange, false);

  // S7. PARES NI DES MOINES · TERESA SARI-SARI & SNACK ROW (2026 Google Maps!)
  addTeresaShophouse({
    id: 'teresa-sarisari-row',
    x: 184.0,
    z: 6.3,
    w: 9.4,
    h: 9.0,
    d: 7.4,
    color: 0x7ea2b8,
    sign: 'PARES NI DES MOINES · SNACK ROW',
    sub: 'BEEF PARES · COLD DRINKS · E-LOAD',
    signBg: '#bf2428',
    signBorder: '#ffffff',
    awningMat: matCorrugatedGreen,
    stallKind: 'carinderia',
    bladeLabel: 'PARES · BBQ',
    bladeBg: '#bf2428',
  });

  // S8. BARANGAY 591 HALL (BRGY. 591 ZONE 58 DIST. 6) & MUBYL + BLUE VIRGIN MARY GROTTO (s6_right.png!)
  addTeresaShophouse({
    id: 'teresa-brgy591-mubyl',
    x: 195.0,
    z: 6.3,
    w: 10.2,
    h: 9.6,
    d: 7.4,
    color: 0x5c6678,
    sign: 'BRGY. 591 HALL · ZONE 58 · MUBYL',
    sub: 'DIST. 6 MANILA · OLD STA. MESA CORNER',
    signBg: '#164ea6',
    signBorder: '#f2ca68',
    groundWallMat: matBrgySlate,
    shutterMat: matDarkSteel,
    awningMat: matDarkSteel,
  });
  // Waving Philippine Flag outside Barangay 591 Hall (s6_right.png!)
  const brgyFlagPole = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.03, 0.035, 3.2, 6)), matSilverSteel);
  brgyFlagPole.position.set(194.2, 5.2, 2.25);
  outsideGroup.add(brgyFlagPole);
  const brgyPhFlag = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(1.15, 0.62)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0x164ea6, side: THREE.DoubleSide, roughness: 0.7 })),
  );
  brgyPhFlag.position.set(194.75, 6.45, 2.25);
  outsideGroup.add(brgyPhFlag);
  animatedFlags.push(brgyPhFlag);

  // Iconic Sky-Blue Virgin Mary Corner Grotto right at Teresa St & Old Sta. Mesa St junction (s6_right.png!)
  addBox(outsideGroup, 1.45, 0.75, 1.25, 199.8, 0.38, 1.75, matGrottoBlue, false);
  const grottoArch = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.55, 0.62, 1.55, 10)), matGrottoBlue);
  grottoArch.position.set(199.8, 1.48, 1.75);
  outsideGroup.add(grottoArch);
  const grottoStatue = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.2, 0.85, 8)), matBrightWhite);
  grottoStatue.position.set(199.8, 1.38, 1.35);
  outsideGroup.add(grottoStatue);

  // --- MERALCO CONCRETE UTILITY POLES (BLUE-AND-YELLOW STRIPED BASE!), STREETLAMPS, CABLES & FIESTA BANDERITAS ---
  const teresaPoleXs = [118.2, 134.2, 150.2, 166.2, 182.2, 198.2];
  const banderitaMats = [matBanderitaOrange, matBanderitaYellow, matBanderitaPink, matBanderitaCyan];
  for (let i = 0; i < teresaPoleXs.length; i++) {
    const px = teresaPoleXs[i];
    for (const pz of [-8.65, 0.65]) {
      const pole = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.13, 0.2, 9.6, 8)), matRawConcrete);
      pole.position.set(px, 4.8, pz);
      outsideGroup.add(pole);
      // Authentic Manila yellow-and-blue painted lower bands on every Teresa St Meralco pole (s1..s4 Street View!)
      const blueBand = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.205, 0.21, 1.0, 8)), matManilaBlue);
      blueBand.position.set(px, 0.52, pz);
      outsideGroup.add(blueBand);
      const yellowBand = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.198, 0.205, 1.15, 8)), matManilaYellow);
      yellowBand.position.set(px, 1.58, pz);
      outsideGroup.add(yellowBand);
      // Horizontal steel cross-arms for Meralco power & telecom bundles
      addBox(outsideGroup, 0.12, 0.12, 1.55, px, 8.95, pz, matDarkSteel, false);
      addBox(outsideGroup, 0.1, 0.1, 1.15, px, 8.05, pz, matDarkSteel, false);
      // Glowing streetlight fixture extending over Teresa St on alternating poles
      if (i % 2 === (pz < 0 ? 0 : 1)) {
        const armDir = pz < 0 ? 1 : -1;
        addBox(outsideGroup, 0.08, 0.08, 1.45, px, 7.35, pz + armDir * 0.72, matSilverSteel, false);
        addBox(outsideGroup, 0.28, 0.14, 0.45, px, 7.26, pz + armDir * 1.38, matTeresaBulb, false);
      }
    }
    // Cross-street overhead wires spanning North <-> South
    addBox(outsideGroup, 0.035, 0.035, 9.4, px, 8.65, -4.0, matCable, false);
    addBox(outsideGroup, 0.03, 0.03, 9.4, px, 7.95, -4.0, matCable, false);
    // Festive overhead Teresa Street fiesta banderitas strung across the street (May 2026 Street View!)
    for (let bz = -7.6; bz <= -0.4; bz += 1.2) {
      const sag = Math.cos(((bz + 4.0) / 4.2) * (Math.PI / 2)) * 0.65;
      const pennant = new THREE.Mesh(
        trackGeo(new THREE.PlaneGeometry(0.36, 0.44)),
        banderitaMats[(i + Math.round(bz + 8)) % banderitaMats.length],
      );
      pennant.position.set(px, 7.25 - sag, bz);
      pennant.rotation.y = Math.PI / 2;
      outsideGroup.add(pennant);
    }
    // Longitudinal multi-strand cables connecting consecutive poles along Teresa St
    if (i < teresaPoleXs.length - 1) {
      const midX = (px + teresaPoleXs[i + 1]) / 2;
      const span = teresaPoleXs[i + 1] - px;
      for (const pz of [-8.65, 0.65]) {
        addBox(outsideGroup, span, 0.04, 0.04, midX, 8.9, pz - 0.35, matCable, false);
        addBox(outsideGroup, span, 0.04, 0.04, midX, 8.82, pz + 0.35, matCable, false);
        addBox(outsideGroup, span, 0.055, 0.055, midX, 8.0, pz, matCable, false);
      }
      // Mid-span cross-street fiesta streamer banner between poles
      for (let bz = -7.2; bz <= -0.8; bz += 1.6) {
        const sag = Math.cos(((bz + 4.0) / 4.2) * (Math.PI / 2)) * 0.72;
        const midFlag = new THREE.Mesh(
          trackGeo(new THREE.PlaneGeometry(0.34, 0.42)),
          banderitaMats[(i + 2 + Math.round(bz + 8)) % banderitaMats.length],
        );
        midFlag.position.set(midX, 7.1 - sag, bz);
        midFlag.rotation.y = Math.PI / 2;
        outsideGroup.add(midFlag);
      }
    }
  }

  // --- PARKED MANILA TRICYCLES, PEDICABS & STA. MESA JEEPNEYS ---
  const addTricycle = (tx: number, tz: number, rotY: number, bodyMat: THREE.Material) => {
    const tg = new THREE.Group();
    tg.position.set(tx, 0, tz);
    tg.rotation.y = rotY;
    // Sidecar cab + chrome canopy roof + motorcycle seat/bars + rubber wheels
    addBox(tg, 1.55, 0.92, 1.12, 0, 0.68, 0, bodyMat, false);
    addBox(tg, 1.48, 0.11, 1.24, 0, 1.58, 0, matSilverSteel, false);
    addBox(tg, 0.07, 0.58, 0.07, -0.62, 1.25, 0.48, matDarkSteel, false);
    addBox(tg, 0.07, 0.58, 0.07, 0.62, 1.25, 0.48, matDarkSteel, false);
    addBox(tg, 0.44, 0.44, 0.2, -0.52, 0.24, 0.52, matTireRubber, false);
    addBox(tg, 0.44, 0.44, 0.2, 0.52, 0.24, 0.52, matTireRubber, false);
    outsideGroup.add(tg);
  };
  // Anonas St tricycle queue (clear of Main Gate crosswalk)
  addTricycle(93.8, 4.4, Math.PI * 0.52, matTrikeRed);
  addTricycle(93.9, 7.6, Math.PI * 0.48, matTrikeBlue);
  // Teresa St tricycles neatly queued along curb edge (leaving wide unobstructed center lane & sidewalks!)
  addTricycle(121.2, -7.2, 0.04, matTrikeRed);
  addTricycle(126.4, -7.2, -0.02, matTrikeGreen);
  addTricycle(145.6, -0.85, Math.PI + 0.03, matTrikeBlue);
  addTricycle(169.5, -7.2, 0.02, matTrikeRed);
  addTricycle(189.2, -0.85, Math.PI - 0.03, matTrikeRed);

  // Helper: iconic Philippine Passenger Jeepney
  const addJeepney = (jx: number, jz: number, rotY: number, bodyMat: THREE.Material, routeLabel: string) => {
    const jeep = new THREE.Group();
    jeep.position.set(jx, 0, jz);
    jeep.rotation.y = rotY;
    addBox(jeep, 2.0, 1.55, 5.8, 0, 1.15, 0, bodyMat, false);
    addBox(jeep, 2.06, 0.32, 5.9, 0, 1.98, 0, matSilverSteel, false);
    addBox(jeep, 1.96, 0.55, 1.5, 0, 0.85, 2.8, matSilverSteel, false);
    addBox(jeep, 1.75, 0.62, 0.12, 0, 1.55, 2.15, matGlass, false);
    addBox(jeep, 0.3, 0.65, 0.65, -0.95, 0.35, 1.9, matTireRubber, false);
    addBox(jeep, 0.3, 0.65, 0.65, 0.95, 0.35, 1.9, matTireRubber, false);
    addBox(jeep, 0.3, 0.65, 0.65, -0.95, 0.35, -1.8, matTireRubber, false);
    addBox(jeep, 0.3, 0.65, 0.65, 0.95, 0.35, -1.8, matTireRubber, false);
    addSignMesh(jeep, 1.7, 0.38, 0, 1.96, 2.96, 0, routeLabel, '', {
      bg: '#e5a91a',
      border: 'none',
      titleColor: '#141414',
    });
    outsideGroup.add(jeep);
  };
  // Passing Anonas St jeepney (clear of Main Gate sightline)
  addJeepney(87.2, -32.5, 0, matJeepBlue, 'PUP · TERESA · STOP&SHOP');

  // --- 1B-4: OLD STA. MESA STREET & STOP & SHOP / CEBUANA JUNCTION (x = 201.5..226, ~215m East of PUP Gate) ---
  const oldStaMesaRoad = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(15.2, 190)), matAsphalt);
  oldStaMesaRoad.rotation.x = -Math.PI / 2;
  oldStaMesaRoad.position.set(209.0, 0.023, 0);
  oldStaMesaRoad.receiveShadow = true;
  outsideGroup.add(oldStaMesaRoad);
  // Double-yellow centerline + dashed white lane dividers along 4-lane Old Sta. Mesa St.
  addBox(outsideGroup, 0.12, 0.026, 176, 208.82, 0.027, 0, matGold, false);
  addBox(outsideGroup, 0.12, 0.026, 176, 209.18, 0.027, 0, matGold, false);
  for (let oz = -74; oz <= 74; oz += 7.0) {
    addBox(outsideGroup, 0.12, 0.025, 3.0, 205.2, 0.027, oz, matBrightWhite, false);
    addBox(outsideGroup, 0.12, 0.025, 3.0, 212.8, 0.027, oz, matBrightWhite, false);
  }
  // Traffic Signal Mast Arm at Teresa / Old Sta. Mesa Intersection
  addBox(outsideGroup, 0.24, 6.4, 0.24, 201.4, 3.2, -10.2, matDarkSteel, false);
  addBox(outsideGroup, 4.6, 0.2, 0.2, 203.7, 6.1, -10.2, matDarkSteel, false);
  addBox(outsideGroup, 0.42, 1.25, 0.32, 205.2, 5.55, -10.2, matDarkShadow, false);
  addBox(outsideGroup, 0.22, 0.22, 0.36, 205.2, 5.9, -10.2, matTrikeRed, false);
  addBox(outsideGroup, 0.22, 0.22, 0.36, 205.2, 5.55, -10.2, matManilaYellow, false);
  addBox(outsideGroup, 0.22, 0.22, 0.36, 205.2, 5.2, -10.2, matTrikeGreen, false);

  // Passing Sta. Mesa – Divisoria & Cubao – Stop & Shop Passenger Jeepneys along Old Sta. Mesa St.
  addJeepney(205.2, -24.0, 0, matJeepRed, 'DIVISORIA · STOP&SHOP');
  addJeepney(212.6, 14.0, Math.PI, matJeepBlue, 'CUBAO · STA. MESA · LRT2');

  // ACROSS OLD STA. MESA ST (Photo-matched to corner_east.png: white condo parking deck + Stop & Shop + Cebuana Lhuillier!)
  const stopShopBays: Array<{ z: number; h: number; d: number; color: number; sign: string; sub: string; bg: string; border?: string }> = [
    { z: -18.5, h: 16.5, d: 13.5, color: 0xe8e5de, sign: 'OLD STA. MESA CONDO & DECK', sub: 'TOWARD PUREZA · LRT-2', bg: '#2b475c' },
    { z: -4.0, h: 12.0, d: 14.5, color: 0xe6dac5, sign: 'OLD STA. MESA · STOP & SHOP', sub: 'TERESA JUNCTION · 215m FROM PUP', bg: '#8c1a1d' },
    { z: 11.0, h: 12.6, d: 13.5, color: 0xe6e1d8, sign: 'CEBUANA LHUILLIER', sub: 'STA. MESA · PAWNSHOP & REMITTANCE', bg: '#16356b', border: '#c41e26' },
  ];
  for (const bay of stopShopBays) {
    const bMat = trackMat(new THREE.MeshStandardMaterial({ color: bay.color, roughness: 0.82 }));
    addBox(outsideGroup, 9.6, bay.h, bay.d, 222.0, bay.h / 2, bay.z, bMat);
    addBox(outsideGroup, 0.24, 2.8, bay.d * 0.84, 217.16, 1.5, bay.z, matWindowGlow, false);
    addBox(outsideGroup, 1.65, 0.18, bay.d * 0.94, 216.4, 3.25, bay.z, matAwning, false);
    for (let fy = 5.2; fy < bay.h - 1.5; fy += 3.0) {
      addBox(outsideGroup, 0.16, 1.25, bay.d * 0.78, 217.15, fy, bay.z, matGlass, false);
    }
    addSignMesh(outsideGroup, Math.min(bay.d * 0.88, 10.5), 1.35, 217.05, 4.15, bay.z, -Math.PI / 2, bay.sign, bay.sub, {
      bg: bay.bg,
      border: bay.border ?? '#f2ca68',
      titleColor: '#ffffff',
    });
  }
  addCollider('old-stamesa-arcade', 222.0, -4.0, 9.6, 44.0);

  // =========================================================================
  // SOUTHEAST PATH TO MAUI OASIS BY FILINVEST, FUTURA CENTRO & EL PUEBLO MANILA
  // Photo-matched to May 2026 Google Street View (2281–2315 Anonas St & Condo Access Road)!
  // =========================================================================
  const mauiPathGroup = new THREE.Group();
  outsideGroup.add(mauiPathGroup);

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

  // 1. Extended South Anonas Street Sidewalk, Yellow Curb, Concrete Drainage Trench & Roadway (z = 52..94)
  // Matches south_2_oval_wall_mid.png (2281 Anonas St): concrete drainage trench & yellow curb right beneath the PUP Oval wall!
  addBox(mauiPathGroup, 2.6, 0.14, 34.0, 84.3, 0.07, 69.0, matSidewalkConc, false);
  for (let cz = 52.4; cz <= 85.2; cz += 0.95) {
    addBox(mauiPathGroup, 0.24, 0.19, 0.88, 85.65, 0.095, cz, matManilaYellow, false);
    // Recessed concrete drainage trench blocks along curb edge (south_2_oval_wall_mid.png!)
    addBox(mauiPathGroup, 0.56, 0.08, 0.82, 85.05, 0.06, cz, matRawConcrete, false);
    if (Math.round(cz * 2) % 3 === 0) {
      addBox(mauiPathGroup, 0.42, 0.025, 0.36, 85.05, 0.105, cz, matDarkSteel, false);
    }
  }
  // Overhanging tropical shrubs & roadside weed tufts hugging the PUP Oval wall plinth (south_2_oval_wall_mid.png!)
  const shrubGeo = trackGeo(new THREE.DodecahedronGeometry(0.42, 0));
  for (let bz = 30.0; bz <= 77.5; bz += 4.2) {
    if (bz > 51.5 && bz < 64.5) continue; // Keep Oval Gate clear
    const tuftA = new THREE.Mesh(shrubGeo, Math.round(bz) % 2 === 0 ? matVineLush : matVineBright);
    tuftA.scale.set(1.1, 0.72, 1.45);
    tuftA.position.set(83.25, 0.28, bz);
    mauiPathGroup.add(tuftA);
    const tuftB = new THREE.Mesh(shrubGeo, Math.round(bz) % 2 === 0 ? matVineBright : matVineLush);
    tuftB.scale.set(0.85, 0.56, 1.1);
    tuftB.position.set(83.35, 0.22, bz + 0.65);
    mauiPathGroup.add(tuftB);
  }

  // East-side Anonas sidewalk + blue-and-yellow Manila curb + parked Sta. Mesa tricycles (z = 52..92)
  addBox(mauiPathGroup, 2.8, 0.15, 42.0, 96.2, 0.075, 71.0, matSidewalkConc, false);
  for (let cz = 52.4; cz <= 89.2; cz += 0.95) {
    addBox(
      mauiPathGroup,
      0.24,
      0.19,
      0.88,
      94.85,
      0.095,
      cz,
      Math.round(cz) % 2 === 0 ? matManilaBlue : matManilaYellow,
      false,
    );
  }

  // Materials for Barangay 630 Zone 63 Hall, Alfamart, Street Furniture & Vehicles
  const matBrgy630Blue = trackMat(new THREE.MeshStandardMaterial({ color: 0x1652a8, roughness: 0.56 }));
  const matBrgyYellow = trackMat(new THREE.MeshStandardMaterial({ color: 0xf2c22e, roughness: 0.52 }));
  const matBrgyRoof = trackMat(new THREE.MeshStandardMaterial({ color: 0x1a417a, roughness: 0.52, metalness: 0.25 }));
  const matAlfamartRed = trackMat(new THREE.MeshStandardMaterial({ color: 0xd4222a, roughness: 0.48 }));
  const matWaterBlue = trackMat(new THREE.MeshStandardMaterial({ color: 0x2ea0dc, roughness: 0.24, metalness: 0.15 }));
  const matHydrantRed = trackMat(new THREE.MeshStandardMaterial({ color: 0xcf1f24, roughness: 0.45, metalness: 0.35 }));
  const matSedanSilver = trackMat(new THREE.MeshStandardMaterial({ color: 0xc2c8ce, roughness: 0.32, metalness: 0.58 }));
  const matSedanMaroon = trackMat(new THREE.MeshStandardMaterial({ color: 0x6e1b24, roughness: 0.34, metalness: 0.48 }));
  const matMauiPoolWater = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x26b2d4, roughness: 0.16, metalness: 0.12 }),
  );
  const matMirrorGlass = trackMat(new THREE.MeshStandardMaterial({ color: 0xdfe9f2, roughness: 0.08, metalness: 0.92 }));

  const wheelGeo = trackGeo(new THREE.CylinderGeometry(0.24, 0.24, 0.14, 10));
  const addParkedTricycle = (tx: number, tz: number, rotY = 0, isRed = true) => {
    const trike = new THREE.Group();
    trike.position.set(tx, 0, tz);
    trike.rotation.y = rotY;
    const tCol = isRed ? matTrikeRed : matTrikeBlue;
    addBox(trike, 1.25, 0.68, 1.95, 0, 0.52, 0, tCol, false);
    addBox(trike, 1.12, 0.44, 0.12, 0, 1.08, -0.88, matGlass, false);
    addBox(trike, 1.32, 0.1, 2.08, 0, 1.42, 0, matSilverSteel, false);
    for (const [px, pz] of [[-0.54, -0.86], [0.54, -0.86], [-0.54, 0.86], [0.54, 0.86]]) {
      addBox(trike, 0.05, 0.64, 0.05, px, 1.12, pz, matDarkSteel, false);
    }
    addBox(trike, 0.42, 0.56, 1.65, -0.93, 0.54, 0.05, matDarkSteel, false);
    for (const [wx, wz] of [[-0.93, -0.6], [-0.93, 0.65], [0.6, 0.25]]) {
      const wh = new THREE.Mesh(wheelGeo, matDarkSteel);
      wh.rotation.z = Math.PI / 2;
      wh.position.set(wx, 0.24, wz);
      trike.add(wh);
    }
    mauiPathGroup.add(trike);
  };
  // Queued tricycles along East Anonas St (north of Alfamart & at TODA terminal)
  addParkedTricycle(93.9, 53.2, 0, true);
  addParkedTricycle(93.9, 57.6, 0, false);

  // --- 1B. AUTHENTIC 630 ANONAS ST EAST CIVIC & COMMERCIAL BLOCK (2026 Google Maps: Alfamart -> Barangay 630 Zone 63 Hall -> Multi-Purpose Covered Court -> TODA Terminal!) ---
  const brgyFootprints = computeBarangay630Footprints();

  // (i) ALFAMART ANONAS STA. MESA (x = 100.4, z = 62.0, facing West onto Anonas St)
  const alfaFp = brgyFootprints[0];
  const alfaGrp = new THREE.Group();
  alfaGrp.position.set(alfaFp.x, 0, alfaFp.z);
  addBox(alfaGrp, alfaFp.width, 4.4, alfaFp.depth, 0, 2.2, 0, matBrightWhite);
  addBox(alfaGrp, 0.18, 0.46, alfaFp.depth + 0.2, -alfaFp.width / 2 - 0.05, 4.18, 0, matAlfamartRed, false);
  addBox(alfaGrp, 0.18, 0.22, alfaFp.depth + 0.2, -alfaFp.width / 2 - 0.05, 3.84, 0, matBrgyYellow, false);
  addBox(alfaGrp, 0.18, 0.2, alfaFp.depth + 0.2, -alfaFp.width / 2 - 0.05, 3.62, 0, matBrgy630Blue, false);
  // Glazed sliding storefront + glowing interior backing + ATM alcove + yellow sidewalk bollards
  addBox(alfaGrp, 0.16, 2.65, 4.8, -alfaFp.width / 2 - 0.02, 1.38, 0.2, matGlass, false);
  addBox(alfaGrp, 0.06, 2.65, 0.08, -alfaFp.width / 2 - 0.1, 1.38, -0.6, matSilverSteel, false);
  addBox(alfaGrp, 0.06, 2.65, 0.08, -alfaFp.width / 2 - 0.1, 1.38, 1.0, matSilverSteel, false);
  addBox(alfaGrp, 0.45, 1.45, 0.9, -alfaFp.width / 2 - 0.15, 0.95, -2.55, matBrgy630Blue, false);
  addBox(alfaGrp, 0.06, 0.48, 0.56, -alfaFp.width / 2 - 0.39, 1.25, -2.55, matMirrorGlass, false);
  for (const bz of [-3.1, -1.5, 1.8, 3.1]) {
    addBox(alfaGrp, 0.14, 0.85, 0.14, -alfaFp.width / 2 - 0.85, 0.425, bz, matManilaYellow, false);
  }
  addSignMesh(alfaGrp, 5.8, 0.95, -alfaFp.width / 2 - 0.16, 3.95, 0, -Math.PI / 2, 'ALFAMART · ANONAS', 'OPEN 24 HOURS · GROCERY & ATM', {
    bg: '#d4222a',
    border: '#f2c22e',
    titleColor: '#ffffff',
    subtitleColor: '#fff2b2',
  });
  mauiPathGroup.add(alfaGrp);
  addCollider(alfaFp.id, alfaFp.x, alfaFp.z, alfaFp.width + 0.4, alfaFp.depth + 0.2);

  // (ii) BARANGAY 630, ZONE 63, DISTRICT VI HALL (x = 100.8, z = 71.8 — photo-matched to real 630 Anonas St street photo!)
  const brgyFp = brgyFootprints[1];
  const brgyHallGrp = new THREE.Group();
  brgyHallGrp.position.set(brgyFp.x, 0, brgyFp.z);
  addContactShadow(brgyHallGrp, 0, 0, brgyFp.width + 1.8, brgyFp.depth + 1.4);
  // Concrete plinth + entry steps + 2-story bright-white masonry hall with royal-blue wainscot
  addBox(brgyHallGrp, brgyFp.width, 0.32, brgyFp.depth, 0, 0.16, 0, matSidewalkConc, false);
  addBox(brgyHallGrp, brgyFp.width, 6.7, brgyFp.depth, 0, 3.65, 0, matBrightWhite);
  addBox(brgyHallGrp, brgyFp.width + 0.12, 1.35, brgyFp.depth + 0.12, 0, 0.98, 0, matBrgy630Blue, false);
  // Golden-yellow civic belt course between 1st & 2nd floor + royal-blue top cornice
  addBox(brgyHallGrp, brgyFp.width + 0.22, 0.24, brgyFp.depth + 0.22, 0, 3.65, 0, matBrgyYellow, false);
  addBox(brgyHallGrp, brgyFp.width + 0.24, 0.34, brgyFp.depth + 0.24, 0, 6.88, 0, matBrgy630Blue, false);
  // Sloped royal-blue corrugated roof with crisp white overhanging soffit
  addBox(brgyHallGrp, brgyFp.width + 0.9, 0.18, brgyFp.depth + 0.9, 0, 7.12, 0, matBrightWhite, false);
  const brgyRoof = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(brgyFp.width + 1.1, 0.24, brgyFp.depth + 1.1)), matBrgyRoof);
  brgyRoof.position.set(0, 7.52, 0);
  brgyRoof.rotation.z = -0.14;
  brgyRoof.castShadow = castShadow;
  brgyHallGrp.add(brgyRoof);

  // Ground-floor covered entry porch canopy + blue steel columns + reception desk & sliding teller windows
  addBox(brgyHallGrp, 1.55, 0.18, 7.4, -brgyFp.width / 2 - 0.72, 3.28, 0, matBrgy630Blue, false);
  addBox(brgyHallGrp, 1.62, 0.1, 7.48, -brgyFp.width / 2 - 0.72, 3.4, 0, matBrgyYellow, false);
  for (const cz of [-3.4, 0.0, 3.4]) {
    addBox(brgyHallGrp, 0.16, 3.1, 0.16, -brgyFp.width / 2 - 1.32, 1.72, cz, matBrgy630Blue, false);
  }
  // Security-grilled entrance door + sliding aluminum reception window + community bulletin board
  addBox(brgyHallGrp, 0.14, 2.45, 1.75, -brgyFp.width / 2 - 0.02, 1.55, -1.65, matGlass, false);
  for (let gz = -2.35; gz <= -0.95; gz += 0.28) {
    addBox(brgyHallGrp, 0.04, 2.4, 0.04, -brgyFp.width / 2 - 0.11, 1.55, gz, matBrgy630Blue, false);
  }
  addBox(brgyHallGrp, 0.14, 1.45, 2.45, -brgyFp.width / 2 - 0.02, 1.95, 1.45, matGlass, false);
  addBox(brgyHallGrp, 0.34, 0.08, 2.55, -brgyFp.width / 2 - 0.16, 1.24, 1.45, matSilverSteel, false);
  // Community bulletin board with notices on front wall
  addBox(brgyHallGrp, 0.08, 1.15, 1.45, -brgyFp.width / 2 - 0.05, 1.95, 3.75, matBrgy630Blue, false);
  addBox(brgyHallGrp, 0.04, 0.92, 1.25, -brgyFp.width / 2 - 0.1, 1.95, 3.75, matBrightWhite, false);

  // Second-floor council office multi-pane aluminum windows + split AC condensers
  for (const wz of [-3.0, 0.0, 3.0]) {
    addBox(brgyHallGrp, 0.14, 1.55, 2.15, -brgyFp.width / 2 - 0.02, 5.25, wz, matGlass, false);
    addBox(brgyHallGrp, 0.06, 1.58, 0.06, -brgyFp.width / 2 - 0.09, 5.25, wz, matSilverSteel, false);
    addBox(brgyHallGrp, 0.32, 0.08, 2.28, -brgyFp.width / 2 - 0.14, 6.08, wz, matBrightWhite, false);
  }
  addBox(brgyHallGrp, 0.38, 0.56, 0.72, -brgyFp.width / 2 - 0.18, 4.15, -4.1, matCreamWall, false);
  addBox(brgyHallGrp, 0.38, 0.56, 0.72, -brgyFp.width / 2 - 0.18, 4.15, 4.1, matCreamWall, false);

  // Iconic Royal-Blue & Golden-Yellow Manila Barangay 630 Fascia Signboard
  addSignMesh(
    brgyHallGrp,
    7.8,
    1.15,
    -brgyFp.width / 2 - 0.16,
    6.45,
    0,
    -Math.PI / 2,
    'BARANGAY 630 · ZONE 63',
    'DISTRICT VI · CITY OF MANILA · 630 ANONAS ST.',
    {
      bg: '#144b9e',
      border: '#f2c22e',
      titleColor: '#ffffff',
      subtitleColor: '#fde078',
      width: 640,
      height: 150,
    },
  );
  addSignMesh(
    brgyHallGrp,
    4.4,
    0.72,
    -brgyFp.width / 2 - 1.58,
    3.42,
    0,
    -Math.PI / 2,
    'BRGY. 630 TANOD OUTPOST',
    '24/7 PEACE & ORDER · CLEARANCE DESK',
    {
      bg: '#f2c22e',
      border: '#144b9e',
      titleColor: '#0e2d64',
      subtitleColor: '#144b9e',
      width: 480,
      height: 110,
    },
  );

  // Philippine Flagpole standing proudly beside Barangay 630 Hall steps
  const brgy630FlagPole = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.045, 0.06, 7.6, 8)), matSilverSteel);
  brgy630FlagPole.position.set(-brgyFp.width / 2 - 1.25, 3.8, -4.55);
  brgyHallGrp.add(brgy630FlagPole);
  addBox(brgyHallGrp, 0.45, 0.36, 0.45, -brgyFp.width / 2 - 1.25, 0.18, -4.55, matBrgy630Blue, false);
  // Crisp Philippine Flag (royal blue top, scarlet bottom, white triangle hoist)
  addBox(brgyHallGrp, 0.03, 0.44, 1.35, -brgyFp.width / 2 - 1.25, 7.22, -3.85, matBrgy630Blue, false);
  addBox(brgyHallGrp, 0.03, 0.44, 1.35, -brgyFp.width / 2 - 1.25, 6.78, -3.85, matAlfamartRed, false);
  addBox(brgyHallGrp, 0.04, 0.88, 0.46, -brgyFp.width / 2 - 1.25, 7.0, -4.3, matBrightWhite, false);

  // Barangay Tanod Outpost Desk, Plastic Monobloc Chairs & Manila Steel Barriers out front
  addBox(brgyHallGrp, 0.65, 0.78, 1.25, -brgyFp.width / 2 - 0.82, 0.48, 3.45, matWood, false);
  addBox(brgyHallGrp, 0.44, 0.46, 0.44, -brgyFp.width / 2 - 0.85, 0.24, 4.35, matBrgy630Blue, false);
  addBox(brgyHallGrp, 0.44, 0.46, 0.44, -brgyFp.width / 2 - 0.85, 0.24, 2.55, matBrightWhite, false);
  for (const bz of [-4.2, 4.2]) {
    addBox(brgyHallGrp, 0.12, 0.92, 1.55, -brgyFp.width / 2 - 1.85, 0.46, bz, matBrgy630Blue, false);
    addBox(brgyHallGrp, 0.14, 0.22, 1.58, -brgyFp.width / 2 - 1.85, 0.76, bz, matBrgyYellow, false);
  }
  mauiPathGroup.add(brgyHallGrp);
  addCollider(brgyFp.id, brgyFp.x, brgyFp.z, brgyFp.width + 1.8, brgyFp.depth + 0.4);

  // White & Royal-Blue Barangay 630 Patrol Multicab parked right in front of Barangay Hall!
  const patrolCab = new THREE.Group();
  patrolCab.position.set(93.65, 0, 72.4);
  addBox(patrolCab, 1.62, 1.15, 1.55, 0, 0.86, -1.05, matBrightWhite);
  addBox(patrolCab, 1.65, 0.34, 1.58, 0, 0.56, -1.05, matBrgy630Blue, false);
  addBox(patrolCab, 1.48, 0.58, 0.08, 0, 1.12, -1.82, matGlass, false);
  // Covered rear patrol bench canopy + amber roof emergency lightbar
  addBox(patrolCab, 1.64, 0.62, 2.15, 0, 0.68, 0.78, matBrgy630Blue);
  addBox(patrolCab, 1.66, 0.12, 2.2, 0, 1.84, 0.78, matBrightWhite, false);
  for (const [px, pz] of [[-0.76, -0.22], [0.76, -0.22], [-0.76, 1.78], [0.76, 1.78]]) {
    addBox(patrolCab, 0.06, 0.92, 0.06, px, 1.38, pz, matSilverSteel, false);
  }
  addBox(patrolCab, 0.72, 0.14, 0.22, 0, 1.56, -1.05, matBrgyYellow, false);
  addSignMesh(patrolCab, 1.75, 0.34, -0.85, 0.72, 0.78, -Math.PI / 2, 'BRGY. 630 PATROL', '', {
    bg: '#144b9e',
    border: '#f2c22e',
    titleColor: '#ffffff',
    width: 320,
    height: 80,
  });
  for (const [wx, wz] of [[-0.78, -1.2], [0.78, -1.2], [-0.78, 1.15], [0.78, 1.15]]) {
    const wh = new THREE.Mesh(wheelGeo, matDarkSteel);
    wh.rotation.z = Math.PI / 2;
    wh.position.set(wx, 0.26, wz);
    patrolCab.add(wh);
  }
  mauiPathGroup.add(patrolCab);
  addCollider('brgy630-patrol-cab', 93.65, 72.4, 1.9, 3.9);

  // (iii) BARANGAY 630 MULTI-PURPOSE COVERED COURT / HALF-COURT ANNEX (x = 102.2, z = 83.2)
  const courtFp = brgyFootprints[2];
  const courtGrp = new THREE.Group();
  courtGrp.position.set(courtFp.x, 0, courtFp.z);
  // Painted concrete court slab + court markings
  addBox(courtGrp, courtFp.width, 0.14, courtFp.depth, 0, 0.07, 0, matBrgy630Blue, false);
  addBox(courtGrp, courtFp.width - 1.2, 0.15, courtFp.depth - 1.2, 0, 0.08, 0, matCondoTerra, false);
  addBox(courtGrp, 3.2, 0.16, 4.4, 2.2, 0.085, 0, matBrgy630Blue, false);
  // 6 steel roof columns + arched/pitched blue corrugated covered-court roof truss
  for (const cx of [-4.4, 4.4]) {
    for (const cz of [-4.8, 0, 4.8]) {
      addBox(courtGrp, 0.26, 5.4, 0.26, cx, 2.7, cz, matBrgy630Blue, false);
    }
  }
  const cRoofL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(5.6, 0.16, courtFp.depth + 0.8)), matBrgyRoof);
  cRoofL.position.set(-2.5, 5.95, 0);
  cRoofL.rotation.z = 0.24;
  courtGrp.add(cRoofL);
  const cRoofR = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(5.6, 0.16, courtFp.depth + 0.8)), matBrgyRoof);
  cRoofR.position.set(2.5, 5.95, 0);
  cRoofR.rotation.z = -0.24;
  courtGrp.add(cRoofR);
  // Basketball hoop stanchion + transparent backboard + orange rim + spectator bench
  addBox(courtGrp, 0.18, 3.4, 0.18, 4.1, 1.7, 0, matDarkSteel, false);
  addBox(courtGrp, 0.08, 1.05, 1.65, 3.55, 3.35, 0, matBrightWhite, false);
  addBox(courtGrp, 0.42, 0.06, 0.42, 3.25, 3.0, 0, matAlfamartRed, false);
  addBox(courtGrp, 0.55, 0.48, 5.2, -4.1, 0.24, 0, matSidewalkConc, false);
  addSignMesh(courtGrp, 6.2, 0.78, -4.65, 5.35, 0, -Math.PI / 2, 'BRGY. 630 COVERED COURT', 'MULTI-PURPOSE HALL · YOUTH & SPORTS', {
    bg: '#144b9e',
    border: '#f2c22e',
    titleColor: '#ffffff',
    subtitleColor: '#fde078',
  });
  mauiPathGroup.add(courtGrp);
  addCollider(courtFp.id, courtFp.x, courtFp.z, courtFp.width + 0.2, courtFp.depth + 0.2);

  // (iv) ANONAS–PUP TODA TRICYCLE TERMINAL WAITING SHED at SE Bend (x = 96.4, z = 91.2)
  const todaGrp = new THREE.Group();
  todaGrp.position.set(96.4, 0, 91.2);
  addBox(todaGrp, 2.2, 0.16, 4.6, 0, 0.08, 0, matSidewalkConc, false);
  for (const [px, pz] of [[-0.9, -2.0], [0.9, -2.0], [-0.9, 2.0], [0.9, 2.0]]) {
    addBox(todaGrp, 0.1, 2.55, 0.1, px, 1.32, pz, matCondoBalconyGreen, false);
  }
  const todaRoof = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.65, 0.12, 5.1)), matCondoBalconyGreen);
  todaRoof.position.set(0, 2.68, 0);
  todaRoof.rotation.z = -0.12;
  todaGrp.add(todaRoof);
  addBox(todaGrp, 0.55, 0.48, 3.6, 0.55, 0.34, 0, matWood, false);
  addSignMesh(todaGrp, 3.8, 0.58, -1.22, 2.52, 0, -Math.PI / 2, 'ANONAS–PUP TODA', 'TRICYCLE TERMINAL · MAUI OASIS · EL PUEBLO', {
    bg: '#1d663a',
    border: '#f2c22e',
    titleColor: '#ffffff',
    subtitleColor: '#f7e088',
  });
  mauiPathGroup.add(todaGrp);
  addCollider('anonas-toda-shed', 96.4, 91.2, 2.4, 4.8);
  addParkedTricycle(93.8, 89.2, 0.18, true);
  addParkedTricycle(93.1, 93.4, 0.42, false);

  // Southern Filinvest perimeter screen wall & tropical trees closing the far South horizon behind the SE curve
  const southCurveWallGrp = new THREE.Group();
  southCurveWallGrp.position.set(70.0, 0, 114.5);
  southCurveWallGrp.rotation.y = 0.26;
  addBox(southCurveWallGrp, 52.0, 2.5, 0.45, 0, 1.25, 0, matCondoCream, false);
  addBox(southCurveWallGrp, 52.2, 0.22, 0.58, 0, 2.58, 0, matCondoStone, false);
  for (let sx = -22; sx <= 22; sx += 5.5) {
    addBox(southCurveWallGrp, 0.48, 2.7, 0.62, sx, 1.35, 0, matCondoStone, false);
    const sTrunk = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.18, 0.24, 4.6, 7)), matTreeTrunk);
    sTrunk.position.set(sx + 1.8, 2.3, 1.8);
    southCurveWallGrp.add(sTrunk);
    const sCrown = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(2.8, 0)), matTreeFoliage);
    sCrown.scale.set(1.3, 0.85, 1.2);
    sCrown.position.set(sx + 1.8, 5.4, 1.6);
    southCurveWallGrp.add(sCrown);
  }
  mauiPathGroup.add(southCurveWallGrp);

  // 2. SE Curve Recessed Dark-Green Slotted-Iron Service Gate & Meralco Triple-Transformer Pole (2315 Anonas St — south_3_oval_wall_curve.png!)
  const seGateX = 82.6;
  addBox(mauiPathGroup, 0.68, 2.85, 0.68, seGateX, 1.425, 78.8, matCreamWall, false);
  addBox(mauiPathGroup, 0.82, 0.2, 0.82, seGateX, 2.9, 78.8, matMaroon, false);
  addBox(mauiPathGroup, 0.68, 2.85, 0.68, seGateX, 1.425, 84.4, matCreamWall, false);
  addBox(mauiPathGroup, 0.82, 0.2, 0.82, seGateX, 2.9, 84.4, matMaroon, false);
  // Recessed dark-green corrugated service panel + angled green slotted iron picket gate leaf
  const matServiceGateGreen = trackMat(new THREE.MeshStandardMaterial({ color: 0x2a5436, roughness: 0.62, metalness: 0.35 }));
  addBox(mauiPathGroup, 0.22, 2.35, 5.1, seGateX - 0.12, 1.22, 81.6, matRawConcrete, false);
  for (let pz = 79.3; pz <= 83.9; pz += 0.28) {
    addBox(mauiPathGroup, 0.05, 2.15, 0.06, seGateX + 0.22, 1.12, pz, matServiceGateGreen, false);
  }
  addBox(mauiPathGroup, 0.08, 0.08, 4.8, seGateX + 0.22, 1.95, 81.6, matServiceGateGreen, false);
  addBox(mauiPathGroup, 0.08, 0.08, 4.8, seGateX + 0.22, 0.42, 81.6, matServiceGateGreen, false);
  addSignMesh(mauiPathGroup, 1.85, 1.25, seGateX + 0.32, 1.32, 81.6, Math.PI / 2, 'NO PARKING', 'PUP PERIMETER · DRIVEWAY CLEAR', {
    bg: '#f6f3eb',
    border: '#b51d1d',
    titleColor: '#b51d1d',
    subtitleColor: '#1f2328',
    width: 384,
    height: 256,
  });
  addCollider('se-service-gate-wall', seGateX, 81.6, 0.9, 6.2);

  // Iconic Meralco Pole with Triple Cylindrical Gray Transformers + Convex Orange Traffic Mirror right at the 2315 Anonas St curve!
  const curvePole = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.18, 0.24, 11.4, 8)), matRawConcrete);
  curvePole.position.set(84.4, 5.7, 86.2);
  mauiPathGroup.add(curvePole);
  addBox(mauiPathGroup, 2.4, 0.14, 0.14, 84.4, 9.6, 86.2, matDarkSteel, false);
  addBox(mauiPathGroup, 2.4, 0.14, 0.14, 84.4, 8.2, 86.2, matDarkSteel, false);
  for (const dx of [-0.62, 0.0, 0.62]) {
    const xfrmr = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.24, 0.24, 0.92, 10)), matSilverSteel);
    xfrmr.position.set(84.4 + dx, 7.6, 85.85);
    mauiPathGroup.add(xfrmr);
  }
  // Convex orange-rimmed street safety mirror at the blind 2315 Anonas St curve
  const mirrorPole = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.055, 0.065, 3.1, 8)), matManilaYellow);
  mirrorPole.position.set(84.9, 1.55, 89.2);
  mauiPathGroup.add(mirrorPole);
  const mirrorRim = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.46, 0.46, 0.1, 14)), matAlfamartRed);
  mirrorRim.rotation.x = Math.PI / 2;
  mirrorRim.rotation.z = -0.65;
  mirrorRim.position.set(84.9, 2.95, 89.2);
  mauiPathGroup.add(mirrorRim);
  const mirrorDisc = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.39, 0.39, 0.12, 14)), matMirrorGlass);
  mirrorDisc.rotation.x = Math.PI / 2;
  mirrorDisc.rotation.z = -0.65;
  mirrorDisc.position.set(84.9, 2.95, 89.2);
  mauiPathGroup.add(mirrorDisc);

  // 3. Sweeping Divided Tree-Lined Boulevard Curving SW past Maui Oasis, Futura Centro & El Pueblo
  const mauiRoadApron = new THREE.Mesh(unitPlaneGeo, matAsphalt);
  mauiRoadApron.scale.set(66, 20, 1);
  mauiRoadApron.rotation.x = -Math.PI / 2;
  mauiRoadApron.rotation.z = MAUI_CORRIDOR_CONFIG.boulevardAngleRad;
  mauiRoadApron.position.set(MAUI_CORRIDOR_CONFIG.boulevardOrigin.x, 0.021, MAUI_CORRIDOR_CONFIG.boulevardOrigin.z);
  mauiRoadApron.receiveShadow = true;
  mauiPathGroup.add(mauiRoadApron);
  // Corner junction paving linking Anonas St (z = 84..96) into the SW boulevard
  const cornerRoad = new THREE.Mesh(unitPlaneGeo, matAsphalt);
  cornerRoad.scale.set(22, 22, 1);
  cornerRoad.rotation.x = -Math.PI / 2;
  cornerRoad.position.set(89.5, 0.022, 92.5);
  cornerRoad.receiveShadow = true;
  mauiPathGroup.add(cornerRoad);

  // Road Markings: Yellow Dashed Centerlines + Crisp White Pedestrian Crosswalks + Speed Humps!
  for (let dz = 53.5; dz <= 83.2; dz += 3.6) {
    if ((dz > 64.6 && dz < 71.8) || (dz > 83.6 && dz < 88.6)) continue;
    addBox(mauiPathGroup, 0.16, 0.018, 1.8, 90.4, 0.032, dz, matManilaYellow, false);
  }
  // Pedestrian crosswalks along South Anonas St (fronting Barangay 630 Hall & approaching SE bend)
  for (const cz of [69.6, 86.8]) {
    for (let cx = 86.6; cx <= 93.8; cx += 0.9) {
      addBox(mauiPathGroup, 0.45, 0.02, 2.4, cx, 0.035, cz, matBrightWhite, false);
    }
  }
  // Pedestrian crosswalks along curving Maui Oasis / El Pueblo boulevard
  for (const alongX of [2.5, -21.0]) {
    const xwalk = new THREE.Group();
    const xpt = computeBoulevardWorldPoint(alongX, 1.5);
    xwalk.position.set(xpt.x, 0.034, xpt.z);
    xwalk.rotation.y = MAUI_CORRIDOR_CONFIG.boulevardAngleRad;
    for (let lz = -5.2; lz <= 5.2; lz += 1.0) {
      addBox(xwalk, 2.2, 0.02, 0.46, 0, 0, lz, matBrightWhite, false);
    }
    mauiPathGroup.add(xwalk);
  }
  // Yellow-and-Black Asphalt Speed Humps (Rumble Bumps) along Anonas St & Maui Oasis Blvd
  for (const h of computeMauiSpeedHumps()) {
    const humpGrp = new THREE.Group();
    humpGrp.position.set(h.x, 0, h.z);
    humpGrp.rotation.y = h.rotY;
    for (let s = -4; s <= 4; s++) {
      addBox(
        humpGrp,
        0.78,
        0.095,
        0.76,
        s * 0.8,
        0.048,
        0,
        Math.abs(s) % 2 === 0 ? matManilaYellow : matDarkSteel,
        false,
      );
    }
    mauiPathGroup.add(humpGrp);
  }

  // Continuous Meralco Concrete Utility Poles + Cobra-Head Streetlamps + Overhead Manila Cable Runs!
  const corridorPoles = computeMauiCorridorPoles();
  for (let pi = 0; pi < corridorPoles.length; pi++) {
    const p = corridorPoles[pi];
    const poleGrp = new THREE.Group();
    poleGrp.position.set(p.x, 0, p.z);
    poleGrp.rotation.y = p.rotY;
    const shaft = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.13, 0.18, 9.6, 8)), matRawConcrete);
    shaft.position.set(0, 4.8, 0);
    poleGrp.add(shaft);
    // Blue-and-yellow Manila striped lower utility pole warning wrap
    addBox(poleGrp, 0.34, 0.85, 0.34, 0, 1.45, 0, matManilaBlue, false);
    addBox(poleGrp, 0.35, 0.55, 0.35, 0, 2.15, 0, matManilaYellow, false);
    // Crossbar + cobra-head LED streetlight arm projecting over road
    addBox(poleGrp, 1.8, 0.1, 0.12, 0, 8.6, 0, matDarkSteel, false);
    addBox(poleGrp, 0.1, 0.08, 2.1, 0, 7.6, 1.05, matSilverSteel, false);
    addBox(poleGrp, 0.36, 0.12, 0.65, 0, 7.55, 2.05, matTeresaBulb, false);
    mauiPathGroup.add(poleGrp);

    // Overhead power/fiber cables connecting consecutive poles along the same street segment
    if (pi !== 3 && pi + 1 < corridorPoles.length) {
      const next = corridorPoles[pi + 1];
      const dx = next.x - p.x;
      const dz = next.z - p.z;
      const span = Math.hypot(dx, dz);
      const midX = (p.x + next.x) / 2;
      const midZ = (p.z + next.z) / 2;
      const yaw = Math.atan2(dx, dz);
      for (const cy of [8.55, 7.95, 7.45]) {
        const wire = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.032, 0.032, span)), matDarkSteel);
        wire.position.set(midX, cy, midZ);
        wire.rotation.y = yaw;
        mauiPathGroup.add(wire);
      }
    }
  }

  // Manila Street Furniture: Fire Hydrants, Segregated Trash Bins, Regulatory Signs & Parked Sedans!
  for (const [hx, hz] of [
    [85.2, 63.2],
    [95.4, 77.2],
  ]) {
    const hyd = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.14, 0.16, 0.72, 8)), matHydrantRed);
    hyd.position.set(hx, 0.36, hz);
    mauiPathGroup.add(hyd);
    const hydCap = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.14, 8, 6)), matHydrantRed);
    hydCap.position.set(hx, 0.74, hz);
    mauiPathGroup.add(hydCap);
  }
  for (const [bx, bz] of [
    [95.4, 65.8],
    [95.4, 86.2],
  ]) {
    addBox(mauiPathGroup, 0.42, 0.78, 0.42, bx, 0.48, bz, matCondoBalconyGreen, false);
    addBox(mauiPathGroup, 0.42, 0.78, 0.42, bx, 0.48, bz + 0.52, matBrgy630Blue, false);
  }
  // Regulatory Street Signs along South Anonas St ("ANONAS ST. · BRGY. 630", "SPEED LIMIT 20 KPH")
  const addStreetSignPost = (sx: number, sz: number, rotY: number, title: string, sub: string, bg: string) => {
    const pole = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.045, 0.055, 3.1, 6)), matSilverSteel);
    pole.position.set(sx, 1.55, sz);
    mauiPathGroup.add(pole);
    addSignMesh(mauiPathGroup, 1.45, 0.62, sx, 2.85, sz, rotY, title, sub, {
      bg,
      border: '#ffffff',
      titleColor: '#ffffff',
      subtitleColor: '#f2e8b8',
      width: 360,
      height: 150,
    });
  };
  addStreetSignPost(95.3, 60.0, -Math.PI / 2, 'ANONAS ST.', 'BRGY. 630 · ZONE 63', '#155c38');
  addStreetSignPost(85.3, 73.5, Math.PI / 2, 'SPEED LIMIT 20', 'SLOW DOWN · BRGY. HALL', '#144b9e');

  // Landscaped Concrete Center Median Island with Shade Trees & Flared Street Lamps
  const medianGrp = new THREE.Group();
  medianGrp.position.set(66.0, 0, 102.2);
  medianGrp.rotation.y = MAUI_CORRIDOR_CONFIG.boulevardAngleRad;
  addBox(medianGrp, 34.0, 0.24, 2.8, 0, 0.12, 0, matSidewalkConc, false);
  addBox(medianGrp, 32.8, 0.16, 2.0, 0, 0.22, 0, matCondoStone, false);
  for (let mx = -14; mx <= 14; mx += 7.0) {
    const mTrunk = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.14, 0.2, 3.6, 7)), matTreeTrunk);
    mTrunk.position.set(mx, 1.95, 0);
    medianGrp.add(mTrunk);
    const mCrown = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(2.15, 0)), matTreeFoliage);
    mCrown.scale.set(1.25, 0.78, 1.15);
    mCrown.position.set(mx, 4.35, 0);
    medianGrp.add(mCrown);
    if (mx < 14) {
      const lampX = mx + 3.5;
      const lPost = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.06, 0.08, 4.2, 6)), matDarkSteel);
      lPost.position.set(lampX, 2.2, 0);
      medianGrp.add(lPost);
      const lCap = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.45, 0.24, 6)), matDarkSteel);
      lCap.position.set(lampX, 4.42, 0);
      lCap.rotation.x = Math.PI;
      medianGrp.add(lCap);
      addBox(medianGrp, 0.28, 0.16, 0.28, lampX, 4.22, 0, matTeresaBulb, false);
    }
  }
  mauiPathGroup.add(medianGrp);

  // --- 3B. SOUTH-EAST SIDE OF MAUI OASIS BOULEVARD: SIDEWALK, LOCAL SHOPS (WATER REFILLING, TAPSILOGAN, VULCANIZING) & PARKED CARS ---
  const southBlvdGrp = new THREE.Group();
  southBlvdGrp.position.set(MAUI_CORRIDOR_CONFIG.boulevardOrigin.x, 0, MAUI_CORRIDOR_CONFIG.boulevardOrigin.z);
  southBlvdGrp.rotation.y = MAUI_CORRIDOR_CONFIG.boulevardAngleRad;
  // Continuous raised SE pedestrian sidewalk + alternating yellow-black curbstones
  addBox(southBlvdGrp, 48.0, 0.16, 3.2, -2.0, 0.08, 9.6, matSidewalkConc, false);
  for (let cx = -25.0; cx <= 21.0; cx += 1.0) {
    addBox(
      southBlvdGrp,
      0.92,
      0.2,
      0.22,
      cx,
      0.1,
      8.0,
      Math.abs(Math.round(cx)) % 2 === 0 ? matManilaYellow : matDarkSteel,
      false,
    );
  }
  // Neighborhood commercial row facing Maui Oasis & El Pueblo Boulevard (z = +11.6..+15.6 in local boulevard space)
  const addBlvdStall = (
    lx: number,
    w: number,
    wallMat: THREE.Material,
    awningMat: THREE.Material,
    title: string,
    sub: string,
    signBg: string,
    kind: 'water' | 'carinderia' | 'vulcanizing',
  ) => {
    addBox(southBlvdGrp, w, 3.6, 4.2, lx, 1.8, 13.4, wallMat);
    addBox(southBlvdGrp, w + 0.2, 0.14, 2.2, lx, 2.85, 10.6, awningMat, false);
    addBox(southBlvdGrp, 0.07, 2.8, 0.07, lx - w / 2 + 0.18, 1.4, 9.65, matDarkSteel, false);
    addBox(southBlvdGrp, 0.07, 2.8, 0.07, lx + w / 2 - 0.18, 1.4, 9.65, matDarkSteel, false);
    addSignMesh(southBlvdGrp, w - 0.4, 0.72, lx, 3.25, 11.24, Math.PI, title, sub, {
      bg: signBg,
      border: '#ffffff',
      titleColor: '#ffffff',
      subtitleColor: '#f5ebb8',
    });
    if (kind === 'water') {
      // Stacked blue 5-gallon purified water jugs + stainless dispenser counter
      addBox(southBlvdGrp, w - 0.8, 1.0, 0.65, lx, 0.5, 11.1, matSilverSteel, false);
      for (const jx of [-1.4, -0.95, -0.5, 0.9, 1.35]) {
        const jug = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.15, 0.15, 0.44, 8)), matWaterBlue);
        jug.position.set(lx + jx, 0.36, 10.4);
        southBlvdGrp.add(jug);
      }
    } else if (kind === 'carinderia') {
      // Glass food display warmer + red monobloc stools + red/white Aice freezer
      addBox(southBlvdGrp, 2.4, 0.95, 0.72, lx - 0.8, 0.55, 10.9, matBrightWhite, false);
      addBox(southBlvdGrp, 2.2, 0.48, 0.62, lx - 0.8, 1.24, 10.9, matGlass, false);
      for (const sx of [-1.6, -0.8, 0.0]) {
        addBox(southBlvdGrp, 0.36, 0.44, 0.36, lx + sx, 0.28, 10.1, matAlfamartRed, false);
      }
      addBox(southBlvdGrp, 1.1, 0.82, 0.68, lx + 1.6, 0.48, 10.8, matBrightWhite, false);
      addBox(southBlvdGrp, 1.12, 0.24, 0.7, lx + 1.6, 0.72, 10.8, matAlfamartRed, false);
    } else {
      // Corrugated steel roll-up shutter + stacked rubber tires
      addBox(southBlvdGrp, w - 0.8, 2.35, 0.12, lx, 1.25, 11.28, matSilverSteel, false);
      for (let ty = 0; ty < 3; ty++) {
        const tire = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.28, 0.1, 6, 12)), matDarkSteel);
        tire.rotation.x = Math.PI / 2;
        tire.position.set(lx - 1.5, 0.22 + ty * 0.2, 10.45);
        southBlvdGrp.add(tire);
      }
    }
  };
  addBlvdStall(12.5, 6.4, matBrightWhite, matBrgy630Blue, '630 WATER & LAUNDRY', 'PURIFIED WATER · WASH & FOLD', '#1560a8', 'water');
  addBlvdStall(5.2, 6.8, matCreamWall, matAlfamartRed, 'TAPSILOGAN & CARINDERIA', 'SILOG MEALS · SARI-SARI · AICE', '#b51e22', 'carinderia');
  addBlvdStall(-2.2, 6.4, matCondoCream, matCondoBalconyGreen, 'MOTO-FIX & HARDWARE', 'VULCANIZING · MOTOR PARTS', '#22593a', 'vulcanizing');

  // Two parked compact sedans neatly parked along the SE boulevard lay-by
  for (const [cx, matCar] of [
    [15.5, matSedanSilver],
    [-9.5, matSedanMaroon],
  ] as Array<[number, THREE.Material]>) {
    const car = new THREE.Group();
    car.position.set(cx, 0, 6.4);
    addBox(car, 4.1, 0.72, 1.72, 0, 0.56, 0, matCar);
    addBox(car, 2.2, 0.58, 1.52, -0.15, 1.18, 0, matCar);
    addBox(car, 2.05, 0.44, 1.56, -0.15, 1.18, 0, matGlass, false);
    for (const [wx, wz] of [[-1.25, -0.86], [1.25, -0.86], [-1.25, 0.86], [1.25, 0.86]]) {
      const cw = new THREE.Mesh(wheelGeo, matDarkSteel);
      cw.rotation.x = Math.PI / 2;
      cw.position.set(wx, 0.25, wz);
      car.add(cw);
    }
    southBlvdGrp.add(car);
  }
  mauiPathGroup.add(southBlvdGrp);

  // 4. ICONIC WEATHERED MOSS-STREAKED VINE-DRAPED CONCRETE WALL WITH MAUI OASIS MAIN ENTRANCE GATEHOUSE BAY!
  const vineWallGrp = new THREE.Group();
  vineWallGrp.position.set(62.5, 0, 95.8);
  vineWallGrp.rotation.y = MAUI_CORRIDOR_CONFIG.boulevardAngleRad;
  // Split vine wall cleanly into West Wing (-22..-2.5) and East Wing (+7.5..+22) framing the Maui Oasis Main Gate Bay (local x = -2.5..+7.5)!
  for (const [segCenter, segLen] of [
    [-12.25, 19.5],
    [14.75, 14.5],
  ] as Array<[number, number]>) {
    addBox(vineWallGrp, segLen, 2.35, 0.42, segCenter, 1.175, 0, matWeatheredMossWall, true);
    addBox(vineWallGrp, segLen + 0.15, 0.18, 0.54, segCenter, 2.4, 0, matRawConcrete, false);
    addBox(vineWallGrp, segLen + 0.15, 0.28, 0.58, segCenter, 0.14, 0, matSidewalkConc, false);
  }
  // Concrete wall piers & cascading lush creeping tropical vines draped down from top coping!
  for (let wx = -20.5; wx <= 20.5; wx += 4.1) {
    if (wx > -3.2 && wx < 8.0) continue; // Keep Maui Oasis Main Gate driveway open!
    addBox(vineWallGrp, 0.42, 2.52, 0.56, wx, 1.26, 0, matRawConcrete, false);
    addBox(vineWallGrp, 2.4, 0.52, 0.72, wx + 1.2, 2.42, 0.12, matVineLush, false);
    addBox(vineWallGrp, 1.35, 0.85, 0.28, wx + 0.7, 1.96, 0.26, matVineBright, false);
    if (Math.round(wx) % 2 === 0) {
      const wtTrunk = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.18, 0.24, 4.4, 7)), matTreeTrunk);
      wtTrunk.position.set(wx + 0.5, 2.2, -1.35);
      vineWallGrp.add(wtTrunk);
      const wtCrown = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(2.5, 0)), matTreeFoliage);
      wtCrown.scale.set(1.3, 0.82, 1.2);
      wtCrown.position.set(wx + 0.5, 5.1, -0.6);
      vineWallGrp.add(wtCrown);
    }
  }

  // HAWAIIAN STONE-CLAD MAUI OASIS BY FILINVEST MAIN ENTRANCE ARCHWAY, GUARDHOUSE & BOOM BARRIER (local x = +2.5)!
  const mauiGate = new THREE.Group();
  mauiGate.position.set(2.5, 0, 0);
  // Stone-clad Hawaiian gate columns + overhanging dark-brown hipped gatehouse roof
  for (const gx of [-4.6, 4.6]) {
    addBox(mauiGate, 1.25, 1.5, 1.25, gx, 0.75, 0, matCondoStone);
    addBox(mauiGate, 1.05, 2.6, 1.05, gx, 2.75, 0, matCondoCream);
    addBox(mauiGate, 1.38, 0.24, 1.38, gx, 4.12, 0, matCondoRoof, false);
    // Flanking tropical planter beds & palms
    addBox(mauiGate, 1.8, 0.45, 1.4, gx + (gx < 0 ? -1.4 : 1.4), 0.225, 0.4, matCondoStone, false);
    addBox(mauiGate, 1.5, 0.55, 1.1, gx + (gx < 0 ? -1.4 : 1.4), 0.65, 0.4, matVineLush, false);
  }
  // Overhead Maui Oasis entrance fascia beam + tropical hipped canopy
  addBox(mauiGate, 10.6, 0.85, 1.2, 0, 4.45, 0, matCondoCream);
  addBox(mauiGate, 11.2, 0.35, 2.2, 0, 5.0, 0, matCondoRoof, false);
  addSignMesh(mauiGate, 7.2, 0.82, 0, 4.46, 0.64, 0, 'MAUI OASIS BY FILINVEST', 'MAIN ENTRANCE · 630 ANONAS ST.', {
    bg: '#2b4d38',
    border: '#e5c16c',
    titleColor: '#fff9eb',
    subtitleColor: '#e5d4a6',
  });
  // Center Hawaiian security guardhouse booth + motorized boom barrier
  addBox(mauiGate, 1.85, 1.2, 1.85, 0, 0.6, -1.1, matCondoStone);
  addBox(mauiGate, 1.78, 1.15, 1.78, 0, 1.76, -1.1, matGlass, false);
  addBox(mauiGate, 2.45, 0.22, 2.45, 0, 2.44, -1.1, matCondoRoof, false);
  addBox(mauiGate, 3.2, 0.09, 0.09, 2.4, 0.96, -0.4, matAlfamartRed, false);
  addBox(mauiGate, 3.2, 0.09, 0.09, -2.4, 0.96, -0.4, matBrightWhite, false);
  vineWallGrp.add(mauiGate);

  // Exact May 2026 red-and-white "PRIVATE PROPERTY / NO PARKING / CLAMPING & TOW AWAY ZONE" wall sign
  addSignMesh(vineWallGrp, 2.1, 1.45, 12.2, 1.45, 0.24, 0, 'PRIVATE PROPERTY', 'NO PARKING · CLAMPING & TOW AWAY ZONE', {
    bg: '#f7f4ee',
    border: '#c9231f',
    titleColor: '#1d4487',
    subtitleColor: '#c9231f',
    width: 448,
    height: 300,
  });
  addSignMesh(vineWallGrp, 2.8, 1.0, 18.2, 1.55, 0.24, 0, 'MAUI OASIS · EL PUEBLO', 'ANONAS STREET · BRGY. 630', {
    bg: '#1c4230',
    border: '#e5a91a',
    titleColor: '#ffffff',
    subtitleColor: '#f2ca68',
    width: 512,
    height: 200,
  });
  mauiPathGroup.add(vineWallGrp);
  // Colliders approximating the split vine wall wings along Maui Oasis road
  addCollider('maui-vine-wall-e', 76.2, 92.2, 14.0, 1.4);
  addCollider('maui-vine-wall-w', 51.0, 98.8, 18.0, 1.4);

  // 5. PHOTO-MATCHED MAUI OASIS BY FILINVEST (Hawaiian cream stucco mid-rises + Central Resort Swimming Pool & Clubhouse!)
  const buildMauiOasisWing = (cx: number, cz: number, w: number, h: number, d: number, label?: string) => {
    addBox(mauiPathGroup, w, h, d, cx, h / 2, cz, matCondoCream, true);
    addBox(mauiPathGroup, w + 0.25, 2.8, d + 0.25, cx, 1.4, cz, matCondoStone, false);
    addBox(mauiPathGroup, w + 1.6, 0.45, d + 1.6, cx, h + 0.22, cz, matCondoRoof, false);
    const hipRoof = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(Math.max(w, d) * 0.62, 3.6, 4)), matCondoRoof);
    hipRoof.rotation.y = Math.PI / 4;
    hipRoof.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d));
    hipRoof.position.set(cx, h + 2.15, cz);
    mauiPathGroup.add(hipRoof);
    for (let fy = 4.2; fy < h - 1.2; fy += 3.2) {
      addBox(mauiPathGroup, w + 0.22, 0.32, d + 0.22, cx, fy, cz, matCondoCream, false);
      addBox(mauiPathGroup, w * 0.84, 1.15, d + 0.16, cx, fy + 1.25, cz, matGlass, false);
      addBox(mauiPathGroup, w * 0.88, 0.88, d + 0.28, cx, fy + 0.56, cz, matCondoBalconyGreen, false);
    }
    if (label) {
      addSignMesh(mauiPathGroup, 7.6, 1.35, cx, 3.55, cz + d / 2 + 0.24, 0, label, 'FILINVEST · ANONAS ST., STA. MESA', {
        bg: '#2b4d38',
        border: '#e5c16c',
        titleColor: '#fff9eb',
        subtitleColor: '#e5d4a6',
      });
    }
  };
  buildMauiOasisWing(58.0, 86.2, 20.5, 16.5, 11.4, 'MAUI OASIS BY FILINVEST');
  buildMauiOasisWing(29.0, 87.0, 16.8, 15.2, 11.4);
  // Central Maui Oasis Resort Swimming Pool & Clubhouse Deck visible between the Hawaiian wings!
  addBox(mauiPathGroup, 9.8, 0.18, 9.2, 43.2, 0.09, 86.6, matCondoCream, false);
  addBox(mauiPathGroup, 6.4, 0.14, 5.2, 43.2, 0.14, 86.6, matMauiPoolWater, false);
  for (const ux of [40.2, 46.2]) {
    addBox(mauiPathGroup, 0.06, 2.2, 0.06, ux, 1.1, 89.2, matWood, false);
    const poolUmb = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(1.15, 0.45, 8)), matBrightWhite);
    poolUmb.position.set(ux, 2.25, 89.2);
    mauiPathGroup.add(poolUmb);
  }
  addCollider('maui-oasis-bldg-main', 58.0, 86.2, 21.2, 11.8);
  addCollider('maui-oasis-bldg-west', 29.0, 87.0, 17.4, 11.8);

  // 6. PHOTO-MATCHED FUTURA CENTRO BY FILINVEST + EL PUEBLO TRIANGLE CONDOMINIUM (South-East Skyline!)
  const fcX = 103.0;
  const fcZ = 104.0;
  addBox(mauiPathGroup, 19.0, 32.0, 20.0, fcX, 16.0, fcZ, matFuturaGray, false);
  addBox(mauiPathGroup, 19.8, 1.0, 20.8, fcX, 32.5, fcZ, matFuturaBlueGray, false);
  for (const dz of [-7.0, 0, 7.0]) {
    addBox(mauiPathGroup, 19.64, 31.8, 1.6, fcX, 15.9, fcZ + dz, matFuturaBlueGray, false);
  }
  for (let fy = 4.0; fy < 30.5; fy += 3.2) {
    addBox(mauiPathGroup, 19.44, 0.36, 20.44, fcX, fy, fcZ, matBrightWhite, false);
    addBox(mauiPathGroup, 19.28, 1.25, 17.2, fcX, fy + 1.2, fcZ, matGlass, false);
  }
  addSignMesh(mauiPathGroup, 9.0, 1.5, fcX - 9.86, 4.4, fcZ, -Math.PI / 2, 'FUTURA CENTRO', 'BY FILINVEST · STA. MESA', {
    bg: '#234266',
    border: '#d6e3f0',
    titleColor: '#ffffff',
    subtitleColor: '#a8cbe8',
  });
  addCollider('futura-centro-tower', fcX, fcZ, 19.6, 20.6);

  // El Pueblo Triangle Condominium (modern angled white & terracotta tower along the SE curve)
  const triX = 78.0;
  const triZ = 126.0;
  const triGrp = new THREE.Group();
  triGrp.position.set(triX, 0, triZ);
  triGrp.rotation.y = 0.26;
  addBox(triGrp, 18.0, 28.0, 14.0, 0, 14.0, 0, matBrightWhite, false);
  // Crisp non-coplanar terracotta front accent cladding protruding 0.30m proud of white core (zero Z-fighting)
  addBox(triGrp, 18.5, 28.0, 2.8, 0, 14.0, -5.9, matCondoTerra, false);
  addBox(triGrp, 18.8, 0.9, 15.2, 0, 28.45, 0, matCondoRoof, false);
  for (let fy = 4.0; fy < 26.5; fy += 3.2) {
    addBox(triGrp, 18.7, 0.32, 15.04, 0, fy, 0, matCondoCream, false);
    addBox(triGrp, 15.6, 1.15, 14.88, 0, fy + 1.15, 0, matGlass, false);
  }
  addSignMesh(triGrp, 7.4, 1.1, 0, 4.4, -7.62, Math.PI, 'EL PUEBLO TRIANGLE', '8010 ANONAS ST. · CONDOMINIUM', {
    bg: '#8a3524',
    border: '#f2ca68',
    titleColor: '#ffffff',
    subtitleColor: '#f7d996',
  });
  mauiPathGroup.add(triGrp);

  // 7. PHOTO-MATCHED EL PUEBLO MANILA CONDOMINIUM, ARCHED GATEHOUSE & COMMERCIAL GROUND FLOOR (630 Anonas St!)
  const epX = 30.0;
  const epZ = 116.0;
  addBox(mauiPathGroup, 3.4, 3.5, 3.4, 41.8, 1.75, 106.5, matBrightWhite, false);
  addBox(mauiPathGroup, 4.1, 0.45, 4.1, 41.8, 3.65, 106.5, matCondoRoof, false);
  addBox(mauiPathGroup, 0.35, 1.35, 1.8, 43.55, 1.9, 106.5, matGlass, false);
  // Motorized boom barrier + pedestrian guard rail at El Pueblo Gatehouse
  addBox(mauiPathGroup, 0.22, 0.95, 0.22, 43.5, 0.48, 104.2, matAlfamartRed, false);
  addBox(mauiPathGroup, 0.08, 0.08, 3.4, 43.5, 0.92, 102.4, matBrightWhite, false);
  addSignMesh(mauiPathGroup, 4.8, 1.15, 43.6, 3.1, 106.5, Math.PI / 2, 'EL PUEBLO MANILA', '630 ANONAS ST. CONDOMINIUM', {
    bg: '#8a3524',
    border: '#f2ca68',
    titleColor: '#ffffff',
    subtitleColor: '#f7d996',
  });
  // Warm terracotta / salmon-ochre twin residential towers + lively ground-floor commercial storefronts
  addBox(mauiPathGroup, 24.0, 34.0, 14.0, epX, 17.0, epZ, matCondoTerra, false);
  addBox(mauiPathGroup, 24.8, 0.9, 14.8, epX, 34.45, epZ, matCondoRoof, false);
  // Ground-floor commercial strip facing the boulevard (7-Eleven / Coffee / Laundry)
  addBox(mauiPathGroup, 22.0, 3.4, 0.6, epX, 1.7, epZ - 7.18, matBrightWhite, false);
  addBox(mauiPathGroup, 18.0, 2.2, 0.24, epX, 1.45, epZ - 7.52, matGlass, false);
  addSignMesh(mauiPathGroup, 10.5, 0.85, epX, 3.35, epZ - 7.66, Math.PI, 'EL PUEBLO COMMERCIAL', 'CONVENIENCE · COFFEE · LAUNDRY · WATER', {
    bg: '#1c4230',
    border: '#f2ca68',
    titleColor: '#ffffff',
    subtitleColor: '#f2ca68',
  });
  for (let fy = 4.6; fy < 32.0; fy += 3.6) {
    addBox(mauiPathGroup, 24.54, 0.42, 14.54, epX, fy, epZ, matCondoCream, false);
    addBox(mauiPathGroup, 21.0, 1.25, 14.34, epX, fy + 1.35, epZ, matGlass, false);
  }
  addCollider('el-pueblo-condo', epX, epZ, 24.8, 15.0);

  // Subtle street signpost at PUP Main Gate South corner pointing down Anonas St toward Barangay 630, Maui Oasis & El Pueblo
  const dirPole = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.05, 0.06, 3.2, 6)), matSilverSteel);
  dirPole.position.set(84.8, 1.6, 27.6);
  mauiPathGroup.add(dirPole);
  addSignMesh(mauiPathGroup, 2.4, 0.78, 84.8, 2.95, 27.6, Math.PI / 2, 'ANONAS ST. SOUTH →', 'BRGY. 630 HALL · MAUI OASIS · EL PUEBLO', {
    bg: '#165a3c',
    border: '#ffffff',
    titleColor: '#ffffff',
    subtitleColor: '#e4f2ea',
    width: 540,
    height: 170,
  });

  // Distant Manila urban skyline blocks across the Pasig River (West), East beyond Old Sta. Mesa, & North horizon
  const skylineMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x8f969e, roughness: 0.9, metalness: 0.04 }));
  const skylineWarmMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xa89f92, roughness: 0.9, metalness: 0.04 }));
  const skylineBlocks: Array<[number, number, number, number, number]> = [
    [-222, -98, 22, 28, 20],
    [-230, -52, 26, 44, 22],
    [-218, -8, 22, 26, 24],
    [-232, 36, 28, 48, 24],
    [-222, 84, 24, 32, 26],
    [254, -68, 24, 28, 22],
    [258, -8, 24, 34, 24],
    [254, 46, 26, 32, 24],
    [-20, -124, 34, 26, 22],
    [38, -126, 30, 24, 22],
    [-12, 124, 32, 28, 22],
  ];
  skylineBlocks.forEach(([sx, sz, sw, sh, sd], i) => {
    addBox(root, sw, sh, sd, sx, sh / 2, sz, i % 2 === 0 ? skylineMat : skylineWarmMat, false);
  });

  // Helper for campus roads & walkways (distinct Y elevation to prevent Z-fighting)
  const addPaving = (
    x: number,
    z: number,
    w: number,
    d: number,
    mat: THREE.Material,
    y = 0.032,
    rotY = 0,
  ) => {
    const m = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(w, d)), mat);
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = -rotY;
    m.position.set(x, y, z);
    m.receiveShadow = true;
    root.add(m);
    return m;
  };

  // Anonas Street approach & Main Gate Boulevard straight West to the Obelisk (x = 14..114, z = -4)
  addPaving(66, -4, 96, 11.5, matAsphalt, 0.025);
  // July 2026 University Avenue bright yellow-painted sidewalk curbs + orange center divider line (univ_ave_2026.jpg!)
  addBox(root, 49, 0.16, 0.34, 52, 0.08, -9.85, matCurbYellow, false);
  addBox(root, 49, 0.16, 0.34, 52, 0.08, 1.85, matCurbYellow, false);
  addBox(root, 48, 0.025, 0.16, 52, 0.032, -4.0, matRedOrangeTrim, false);
  // Orange-and-white reflective Manila traffic cones along University Ave center line (univ_ave_2026.jpg!)
  for (const coneX of [66, 56, 46, 36]) {
    addBox(root, 0.42, 0.06, 0.42, coneX, 0.05, -4.0, matDarkSteel, false);
    const cone = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.18, 0.62, 10)), matTrafficCone);
    cone.position.set(coneX, 0.38, -4.0);
    root.add(cone);
    const coneStripe = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.1, 0.13, 0.14, 10)), matBrightWhite);
    coneStripe.position.set(coneX, 0.44, -4.0);
    root.add(coneStripe);
  }

  // Iconic Yellow-Black Striped Speed Bumps across Main Boulevard (matches catwalk.jpg!)
  for (const bX of [61, 41]) {
    addBox(root, 1.3, 0.08, 11.2, bX, 0.04, -4, matGold, false);
    for (let bz = -9.0; bz <= 1.0; bz += 0.9) {
      addBox(root, 1.32, 0.09, 0.38, bX, 0.045, bz, matDarkSteel, false);
    }
  }

  // Obelisk Circular Roundabout Paving + Road branches
  const roundabout = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(16.5, 16.5, 0.04, 36)), matAsphalt);
  roundabout.position.set(14, 0.015, -4);
  roundabout.receiveShadow = true;
  root.add(roundabout);

  // Road heading North from Obelisk toward Swimming Pool, Gymnasium & NALLRC
  addPaving(8, -26, 9, 44, matAsphalt, 0.026);
  addPaving(22, -34, 96, 8, matAsphalt, 0.026);
  // Road heading SW/South from Obelisk around Freedom Park, Interfaith Chapel & Oval
  addPaving(22, 18, 8, 40, matPaver, 0.032, -0.58);
  addPaving(-4, 24, 38, 10, matPaver, 0.032);
  addPaving(-40, 2, 10, 74, matPaver, 0.032);
  addPaving(-46, -28, 42, 8, matPaver, 0.032);
  addPaving(-14, 56, 60, 8, matPaver, 0.032);
  addPaving(-8, 60.2, 92, 5.2, matPaver, 0.031); // Southern strip walkway connecting FMO, Food & Nutrition, Gabriela Silang & Tahanan ng Atleta
  addPaving(-36, -63.5, 58, 4.6, matPaver, 0.031); // Northern utility/research lane linking Printing Press, PSMO & NFTRDC
  addPaving(54, 16, 8, 52, matAsphalt, 0.026);

  // Freedom Park Rose-Terracotta Geometric Grid Plaza (SW of Obelisk, facing Main Building)
  addPaving(4, 10, 26, 22, matFreedomGrid, 0.038);
  // White plaza curb trim
  addBox(root, 26.4, 0.14, 0.25, 4, 0.07, -1.1, matBrightWhite, false);
  addBox(root, 26.4, 0.14, 0.25, 4, 0.07, 21.1, matBrightWhite, false);

  // =========================================================================
  // 2. PHOTO-MATCHED PUP MAIN GATE, JULY 2026 GOLD-LETTERED PYLON,
  //    ELEVATED TERRACOTTA BRASS MURAL & ENTRANCE CHECKPOINT (x = 74..83.4)
  //    Forensically modeled from 2018–2026 Wikimedia & PUP Kiosk photographs!
  // =========================================================================
  const gateGroup = new THREE.Group();
  root.add(gateGroup);

  const matRedBrickPier = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x8f2e24,
      map: textures.intramurosStone,
      bumpMap: textures.intramurosBump,
      bumpScale: 0.14,
      roughness: 0.84,
    }),
  );
  const matLintelMaroon = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x5c211d,
      roughness: 0.44,
      metalness: 0.24,
    }),
  );
  const matGalvSteel = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xc2c7cc,
      roughness: 0.36,
      metalness: 0.68,
    }),
  );
  const matTerracottaGloss = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x883527,
      roughness: 0.32,
      metalness: 0.08,
    }),
  );
  const matTerracottaWall = matTerracottaGloss;
  const matOxidizedBronze = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x3b443e,
      roughness: 0.38,
      metalness: 0.64,
    }),
  );
  const matTrafficRed = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xc92a22,
      roughness: 0.45,
      metalness: 0.12,
    }),
  );
  const matGableRed = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x9b2420,
      roughness: 0.46,
      metalness: 0.28,
    }),
  );
  const matGoldBrass = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xdcb13e,
      roughness: 0.26,
      metalness: 0.78,
    }),
  );
  const matSantanLeaf = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x265421,
      roughness: 0.9,
      flatShading: true,
    }),
  );
  const matSantanFlower = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe84824,
      roughness: 0.68,
    }),
  );
  const matSignCyan = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x4ca9d1,
      emissive: 0x1b4e68,
      emissiveIntensity: 0.35,
      roughness: 0.34,
      metalness: 0.14,
    }),
  );

  // --- 2A. RECESSED MAIN GATE ARCHWAY (x = 73.8, set back 12m deep behind the sweeping curved forecourt — matches 2026 satellite & architectural photos!) ---
  for (const pz of [-10.6, 2.6]) {
    addBox(gateGroup, 1.78, 3.35, 1.58, 73.45, 1.675, pz, matRedBrickPier);
    // Stepped cream stone cap cornices atop rusticated brick-stone pier base
    addBox(gateGroup, 1.92, 0.14, 1.72, 73.45, 3.4, pz, matCreamWall, false);
    addBox(gateGroup, 1.64, 0.1, 1.46, 73.45, 3.51, pz, matBrightWhite, false);
    // Tall classical cream column shaft with subtle architectural reveal molding
    addBox(gateGroup, 0.9, 6.44, 0.98, 73.92, 3.22, pz, matCreamWall);
    addBox(gateGroup, 0.96, 0.14, 1.04, 73.92, 4.78, pz, matBrightWhite, false);
    addBox(gateGroup, 1.16, 0.2, 1.22, 73.88, 6.48, pz, matBrightWhite, false);
    addBox(gateGroup, 0.4, 0.24, 0.44, 73.85, 6.68, pz, matDarkSteel, false);
  }
  addCollider('main-gate-pier-n', 73.6, -10.6, 1.8, 1.6);
  addCollider('main-gate-pier-s', 73.6, 2.6, 1.8, 1.6);

  // Deep maroon enameled steel lintel beam spanning driveway (z = -10.1..+2.1)
  addBox(gateGroup, 0.92, 1.24, 12.25, 73.85, 5.5, -4.0, matLintelMaroon);
  addBox(gateGroup, 1.08, 0.18, 12.44, 73.85, 6.18, -4.0, matCreamWall, false);
  addBox(gateGroup, 1.0, 0.07, 12.3, 73.85, 4.86, -4.0, matDarkSteel, false);
  // Twin angled floodlight arms illuminating the raised metallic silver lintel lettering
  for (const fz of [-7.4, -0.6]) {
    addBox(gateGroup, 0.72, 0.06, 0.06, 74.55, 4.78, fz, matDarkSteel, false);
    const floodHead = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.24, 0.14, 0.34)), matDarkSteel);
    floodHead.position.set(74.88, 4.86, fz);
    floodHead.rotation.z = 0.55;
    gateGroup.add(floodHead);
  }

  // Dedicated high-resolution full-width raised metallic silver "POLYTECHNIC UNIVERSITY OF THE PHILIPPINES" lintel banner
  const lintelCanvas = document.createElement('canvas');
  lintelCanvas.width = 2048;
  lintelCanvas.height = 192;
  const lCtx = lintelCanvas.getContext('2d')!;
  const lBgGrad = lCtx.createLinearGradient(0, 0, 0, 192);
  lBgGrad.addColorStop(0, '#682621');
  lBgGrad.addColorStop(0.5, '#59201c');
  lBgGrad.addColorStop(1, '#4c1a16');
  lCtx.fillStyle = lBgGrad;
  lCtx.fillRect(0, 0, 2048, 192);
  lCtx.strokeStyle = 'rgba(35, 12, 10, 0.35)';
  lCtx.lineWidth = 3;
  for (let sx = 256; sx < 2048; sx += 256) {
    lCtx.beginPath();
    lCtx.moveTo(sx, 0);
    lCtx.lineTo(sx, 192);
    lCtx.stroke();
  }
  lCtx.textAlign = 'center';
  lCtx.textBaseline = 'middle';
  lCtx.font = '800 84px "Inter", "Segoe UI", Arial, sans-serif';
  lCtx.fillStyle = 'rgba(20, 8, 7, 0.65)';
  lCtx.fillText('POLYTECHNIC UNIVERSITY OF THE PHILIPPINES', 1028, 102, 1940);
  const silverGrad = lCtx.createLinearGradient(0, 48, 0, 148);
  silverGrad.addColorStop(0, '#ffffff');
  silverGrad.addColorStop(0.45, '#e8edf2');
  silverGrad.addColorStop(1, '#bfc7d1');
  lCtx.fillStyle = silverGrad;
  lCtx.fillText('POLYTECHNIC UNIVERSITY OF THE PHILIPPINES', 1024, 98, 1940);
  const lintelTex = new THREE.CanvasTexture(lintelCanvas);
  lintelTex.colorSpace = THREE.SRGBColorSpace;
  lintelTex.anisotropy = 8;
  ownedTextures.push(lintelTex);
  const lintelFaceMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: lintelTex,
      roughness: 0.34,
      metalness: 0.28,
    }),
  );
  const lintelEast = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(12.1, 1.14)), lintelFaceMat);
  lintelEast.position.set(74.33, 5.5, -4.0);
  lintelEast.rotation.y = Math.PI / 2;
  gateGroup.add(lintelEast);
  const lintelWest = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(12.1, 1.14)), lintelFaceMat);
  lintelWest.position.set(73.37, 5.5, -4.0);
  lintelWest.rotation.y = -Math.PI / 2;
  gateGroup.add(lintelWest);

  // Signature 3 Ornate Star-Gear Medallions + Sweeping Wrought-Iron Arch Scrollwork
  const emblemSpecs: Array<[number, number, number]> = [
    [-4.95, 0.36, 6.62],
    [-4.0, 0.46, 6.8],
    [-3.05, 0.36, 6.62],
  ];
  for (const [ez, rad, ey] of emblemSpecs) {
    const outerRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(rad, 0.055, 8, 20)), matGalvSteel);
    outerRing.rotation.y = Math.PI / 2;
    outerRing.position.set(73.88, ey, ez);
    gateGroup.add(outerRing);
    const innerDisc = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(rad * 0.86, rad * 0.86, 0.07, 16)), matBrightWhite);
    innerDisc.rotation.z = Math.PI / 2;
    innerDisc.position.set(73.88, ey, ez);
    gateGroup.add(innerDisc);
    for (let sp = 0; sp < 4; sp++) {
      const spoke = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.11, rad * 1.48, 0.05)), matDarkSteel);
      spoke.position.set(73.88, ey, ez);
      spoke.rotation.x = (sp * Math.PI) / 4;
      gateGroup.add(spoke);
    }
  }
  for (const side of [-1, 1]) {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(73.88, 6.24, -4.0 + side * 1.32),
      new THREE.Vector3(73.88, 7.05, -4.0 + side * 2.55),
      new THREE.Vector3(73.88, 6.24, -4.0 + side * 4.35),
    );
    const scrollTube = new THREE.Mesh(trackGeo(new THREE.TubeGeometry(curve, 16, 0.032, 6, false)), matDarkSteel);
    gateGroup.add(scrollTube);
    const curl = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.22, 0.028, 6, 12)), matDarkSteel);
    curl.rotation.y = Math.PI / 2;
    curl.position.set(73.88, 6.46, -4.0 + side * 2.45);
    gateGroup.add(curl);
  }

  // Heavy-Duty Galvanized Silver-Gray Vertical-Bar Sliding Steel Gates (retracted on both flanks right in front of Main Gate piers — isv_wide_forecourt.png!)
  const buildSlidingSteelGate = (centerZ: number, spanZ: number, xPos: number) => {
    const sg = new THREE.Group();
    sg.position.set(xPos, 0, centerZ);
    addBox(sg, 0.09, 0.09, spanZ, 0, 2.86, 0, matGalvSteel, false);
    addBox(sg, 0.09, 0.09, spanZ, 0, 1.48, 0, matGalvSteel, false);
    addBox(sg, 0.09, 0.1, spanZ, 0, 0.18, 0, matGalvSteel, false);
    addBox(sg, 0.09, 2.75, 0.1, 0, 1.52, -spanZ / 2, matGalvSteel, false);
    addBox(sg, 0.09, 2.75, 0.1, 0, 1.52, spanZ / 2, matGalvSteel, false);
    const count = Math.max(4, Math.floor(spanZ / 0.22));
    for (let i = 1; i < count; i++) {
      const bz = -spanZ / 2 + (i / count) * spanZ;
      addBox(sg, 0.045, 2.66, 0.045, 0, 1.52, bz, matGalvSteel, false);
    }
    for (const wz of [-spanZ * 0.35, spanZ * 0.35]) {
      const wheel = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.08, 0.08, 0.08, 8)), matDarkSteel);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(0, 0.08, wz);
      sg.add(wheel);
    }
    gateGroup.add(sg);
  };
  buildSlidingSteelGate(0.95, 3.1, 74.35);
  addSignMesh(gateGroup, 1.65, 1.22, 74.44, 1.88, 0.32, Math.PI / 2, 'PUP ADVISORY', 'WEAR ID · KEEP CAMPUS SAFE', {
    bg: '#ddd8cc',
    border: '#6d1215',
    titleColor: '#5c0c0f',
    subtitleColor: '#1a1513',
    width: 480,
    height: 360,
  });
  addSignMesh(gateGroup, 1.15, 0.96, 74.44, 1.95, 1.82, Math.PI / 2, 'WE MAKE', 'CHANGE WORK', {
    bg: '#4e2778',
    border: '#f0b823',
    titleColor: '#ffffff',
    subtitleColor: '#f7d86c',
    width: 360,
    height: 300,
  });
  const flagPole = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.025, 0.028, 1.75, 6)), matWood);
  flagPole.position.set(74.65, 2.75, 2.1);
  flagPole.rotation.x = -0.58;
  gateGroup.add(flagPole);
  const flagStripeColors = [0xe40303, 0xff8c00, 0xffed00, 0x008026, 0x24408e, 0x732982];
  flagStripeColors.forEach((col, idx) => {
    const stripe = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.03, 0.11, 0.88)),
      trackMat(new THREE.MeshStandardMaterial({ color: col, roughness: 0.72 })),
    );
    stripe.position.set(74.66, 3.12 - idx * 0.11, 1.48);
    gateGroup.add(stripe);
  });
  buildSlidingSteelGate(-10.85, 2.3, 74.38);

  // --- 2B. SOUTH FORECOURT WING: FLARED "THE MURAL" WALL + RECESSED COVERED "EXIT" WALKWAY (isv_south_curve.png!) ---
  // Projects forward along the South side of the 12m entrance forecourt, angled slightly outward toward Anonas St!
  const muralCorridor = new THREE.Group();
  muralCorridor.position.set(78.6, 0, 5.4);
  muralCorridor.rotation.y = Math.PI / 2 - 0.16; // Faces NNE directly into the entrance forecourt & Anonas St (isv_south_curve.png!)
  root.add(muralCorridor);
  // Recessed glossy maroon-tiled EXIT corridor wall + white overhanging canopy slab
  addBox(muralCorridor, 0.75, 3.35, 8.8, -1.65, 1.675, 0, matTerracottaGloss);
  addBox(muralCorridor, 1.15, 3.35, 0.55, -0.65, 1.675, 4.35, matRedBrickPier);
  addBox(muralCorridor, 1.15, 3.35, 0.55, -0.65, 1.675, -4.35, matRedBrickPier);
  // White front structural columns + open pedestrian steel door + silver tubular pedestrian guardrail (isv_south_curve.png!)
  for (const colZ of [-4.05, 0.0, 4.05]) {
    addBox(muralCorridor, 0.38, 3.35, 0.38, 1.48, 1.675, colZ, matBrightWhite);
  }
  addBox(muralCorridor, 0.06, 0.06, 7.6, 1.65, 1.02, 0.2, matGalvSteel, false);
  addBox(muralCorridor, 0.06, 0.06, 7.6, 1.65, 0.18, 0.2, matGalvSteel, false);
  for (let rz = -3.4; rz <= 3.8; rz += 0.34) {
    addBox(muralCorridor, 0.04, 0.84, 0.04, 1.65, 0.6, rz, matGalvSteel, false);
  }
  // White overhanging canopy slab + red "EXIT" plaque
  addBox(muralCorridor, 3.85, 0.34, 9.1, -0.1, 3.45, 0, matBrightWhite);
  addSignMesh(muralCorridor, 1.15, 0.38, 1.86, 3.44, -1.8, Math.PI / 2, 'EXIT', '', {
    bg: '#f4f2ec',
    border: '#b81d18',
    titleColor: '#b81d18',
    width: 320,
    height: 120,
  });

  // ELEVATED GLOSSY TERRACOTTA FACADE WALL + 3D SCULPTURAL OXIDIZED-BRONZE "THE MURAL" (facing NNE into forecourt & Anonas St!)
  const muralWall = new THREE.Group();
  muralWall.position.set(-1.1, 3.6, 0);
  muralCorridor.add(muralWall);
  addBox(muralWall, 1.1, 3.25, 8.8, 0, 1.625, 0, matTerracottaGloss);
  addBox(muralWall, 1.38, 0.24, 9.1, 0.08, 3.35, 0, matBrightWhite, false);
  addBox(muralWall, 1.28, 0.14, 9.0, 0.05, 3.18, 0, matCreamWall, false);
  for (const lz of [-3.0, 0, 3.0]) {
    addBox(muralWall, 0.36, 0.24, 0.42, 2.0, 0.14, lz, matDarkSteel, false);
  }
  const muralArtMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.muralRelief,
      roughness: 0.38,
      metalness: 0.48,
    }),
  );
  const muralFrontFace = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(8.4, 2.95)), muralArtMat);
  muralFrontFace.position.set(0.58, 1.6, 0);
  muralFrontFace.rotation.y = Math.PI / 2;
  muralWall.add(muralFrontFace);
  const muralBackFace = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(8.4, 2.95)), muralArtMat);
  muralBackFace.position.set(-0.58, 1.6, 0);
  muralBackFace.rotation.y = -Math.PI / 2;
  muralWall.add(muralBackFace);

  // Sculpted Multi-Part 3D Oxidized-Bronze Bas-Relief on forecourt-facing facade
  const gearCenterZ = 1.45;
  const gearRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.82, 0.17, 8, 18)), matOxidizedBronze);
  gearRing.rotation.y = Math.PI / 2;
  gearRing.position.set(0.74, 1.38, gearCenterZ);
  muralWall.add(gearRing);
  for (let t = 0; t < 12; t++) {
    const a = (t / 12) * Math.PI * 2;
    const tooth = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.26, 0.25, 0.19)), matOxidizedBronze);
    tooth.position.set(0.76, 1.38 + Math.sin(a) * 0.98, gearCenterZ + Math.cos(a) * 0.98);
    tooth.rotation.x = -a;
    muralWall.add(tooth);
  }
  addBox(muralWall, 0.34, 0.44, 0.38, 0.76, 2.28, 0.05, matOxidizedBronze, false);
  addBox(muralWall, 0.32, 1.35, 0.82, 0.72, 1.32, 0.05, matOxidizedBronze, false);
  const bookLeft = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.24, 0.56, 0.38)), matOxidizedBronze);
  bookLeft.position.set(0.84, 1.62, 0.22);
  bookLeft.rotation.y = 0.28;
  muralWall.add(bookLeft);
  const bookRight = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.24, 0.56, 0.38)), matOxidizedBronze);
  bookRight.position.set(0.84, 1.62, -0.14);
  bookRight.rotation.y = -0.28;
  muralWall.add(bookRight);
  const workerBody = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.32, 0.52, 2.05)), matOxidizedBronze);
  workerBody.position.set(0.76, 1.62, -1.45);
  workerBody.rotation.x = -0.58;
  muralWall.add(workerBody);
  const hammerShaft = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 0.14, 1.35)), matOxidizedBronze);
  hammerShaft.position.set(0.82, 2.18, -2.25);
  hammerShaft.rotation.x = -0.45;
  muralWall.add(hammerShaft);
  addBox(muralWall, 0.32, 0.28, 0.46, 0.84, 2.52, -2.8, matOxidizedBronze, false);
  const leftShard = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.28, 1.5, 1.65)), matOxidizedBronze);
  leftShard.position.set(0.72, 1.62, 3.2);
  leftShard.rotation.x = 0.18;
  muralWall.add(leftShard);
  const rightShard = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.28, 1.4, 1.75)), matOxidizedBronze);
  rightShard.position.set(0.72, 1.38, -3.3);
  rightShard.rotation.x = -0.14;
  muralWall.add(rightShard);
  for (const sz of [-3.65, -3.28, -2.9]) {
    addBox(muralWall, 0.26, 0.95, 0.16, 0.78, 2.05, sz, matOxidizedBronze, false);
  }
  addCollider('pup-mural-wall', 78.8, 6.2, 7.6, 2.4);

  // --- 2B-2. "DAMBANA NG KABAYANIHAN" MONUMENT WALL, "DAMBANANG MABINI SA PUP" PLAQUE & SIDE GATE (z = 9.2..27.2 along South Anonas St!) ---
  const dambanaGrp = new THREE.Group();
  root.add(dambanaGrp);
  addBox(dambanaGrp, 1.15, 6.2, 8.1, 81.8, 3.1, 13.4, matTerracottaGloss);
  addBox(dambanaGrp, 1.4, 0.24, 8.3, 81.85, 6.28, 13.4, matBrightWhite, false);
  addBox(dambanaGrp, 0.14, 4.4, 6.8, 82.42, 3.45, 13.4, matDarkSteel, false);
  addSignMesh(
    dambanaGrp,
    6.4,
    3.95,
    82.52,
    3.48,
    13.4,
    Math.PI / 2,
    'DAMBANA NG KABAYANIHAN',
    'PUP · EDSA PEOPLE POWER MONUMENT',
    {
      bg: '#1c1d1f',
      border: '#d6d2c8',
      titleColor: '#f5f2eb',
      subtitleColor: '#c9c4b8',
      width: 920,
      height: 440,
    },
  );
  addBox(dambanaGrp, 1.55, 0.68, 7.6, 83.1, 0.34, 13.4, matTerracottaGloss, false);
  for (let rz = 10.4; rz <= 16.3; rz += 1.15) {
    const rock = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(0.42, 0)), matBrightWhite);
    rock.scale.set(0.9, 0.58, 1.15);
    rock.position.set(83.15, 0.82, rz);
    dambanaGrp.add(rock);
  }
  addCollider('dambana-kabayanihan', 82.5, 13.4, 2.2, 8.1);

  // "DAMBANANG MABINI SA PUP" weathered rose-maroon wall + arched green NHCP marker + 4 yellow sidewalk bollards
  const matMabiniStucco = trackMat(new THREE.MeshStandardMaterial({ color: 0x9c6e72, roughness: 0.88 }));
  addBox(dambanaGrp, 0.72, 4.1, 5.1, 82.2, 2.05, 20.35, matMabiniStucco);
  addSignMesh(dambanaGrp, 2.1, 1.65, 82.6, 2.15, 20.35, Math.PI / 2, 'DAMBANANG MABINI', 'SA PUP · NHCP HISTORICAL SITE', {
    bg: '#1e5c34',
    border: '#e5e0d4',
    titleColor: '#ffffff',
    subtitleColor: '#d9ebd8',
    width: 440,
    height: 340,
  });
  for (const bz of [18.1, 19.4, 20.9, 22.3]) {
    const bollard = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.08, 0.085, 0.96, 8)), matGold);
    bollard.position.set(84.7, 0.52, bz);
    dambanaGrp.add(bollard);
  }
  // Concrete pedestrian utility side gate ("ENTRANCE") just south of Dambanang Mabini
  addBox(dambanaGrp, 0.85, 3.6, 3.8, 82.2, 1.8, 25.0, matCreamWall);
  addBox(dambanaGrp, 0.14, 2.55, 2.6, 82.62, 1.3, 25.0, matGalvSteel, false);
  addSignMesh(dambanaGrp, 1.05, 0.36, 82.66, 2.85, 24.2, Math.PI / 2, 'ENTRANCE', '', {
    bg: '#f2eee4',
    border: '#a8221e',
    titleColor: '#a8221e',
    width: 280,
    height: 110,
  });
  addCollider('dambanang-mabini-wall', 82.2, 22.4, 1.1, 9.0);

  // --- 2C. NORTH FORECOURT CANTILEVERED PEDESTRIAN "ENTRANCE" CANOPY & CURBSIDE PILLAR (isv_north_curve.png & isv_wide_forecourt.png!) ---
  const northEntrance = new THREE.Group();
  root.add(northEntrance);
  // Red-brick pedestrian entrance portal flanking the Main Gate North pier (x = 73.8, z = -12.6..-10.6)
  addBox(northEntrance, 0.55, 3.35, 0.55, 73.6, 1.675, -13.0, matRedBrickPier);
  addBox(northEntrance, 0.08, 2.8, 1.65, 74.15, 1.48, -11.9, matGalvSteel, false); // Pedestrian entry gate frame
  // Signature LONG white cantilevered concrete pedestrian canopy projecting East along the North forecourt sidewalk right through the Pylon base!
  addBox(northEntrance, 7.6, 0.32, 3.15, 77.4, 3.42, -11.35, matBrightWhite);
  // Iconic slim white rectangular concrete column standing squarely on the yellow-and-black striped forecourt curb (isv_north_curve.png center!)
  addBox(northEntrance, 0.44, 3.35, 0.44, 79.45, 1.68, -9.95, matBrightWhite);
  addSignMesh(northEntrance, 1.45, 0.36, 81.24, 3.42, -11.35, Math.PI / 2, 'ENTRANCE', '', {
    bg: '#f4f2ec',
    border: 'none',
    titleColor: '#b81d18',
    width: 380,
    height: 110,
  });
  // Bright yellow "STRICTLY NO I.D. NO ENTRY" sign mounted on the curbside white concrete pillar (isv_wide_forecourt.png!)
  addSignMesh(northEntrance, 0.46, 0.64, 79.7, 2.28, -9.95, Math.PI / 2, 'STRICTLY', 'NO I.D. NO ENTRY', {
    bg: '#f2ca2c',
    border: '#1c1816',
    titleColor: '#1a1412',
    subtitleColor: '#1a1412',
    width: 240,
    height: 300,
  });
  addBox(northEntrance, 0.05, 0.92, 0.96, 74.38, 2.32, -10.6, matLintelMaroon, false);
  addSignMesh(northEntrance, 0.92, 0.86, 74.42, 2.32, -10.6, Math.PI / 2, 'Please Wear Your ID', 'at all times', {
    bg: '#8a1b19',
    border: '#f0ece4',
    titleColor: '#ffffff',
    subtitleColor: '#f5d47a',
    width: 380,
    height: 350,
  });
  addBox(northEntrance, 0.65, 0.95, 1.05, 73.1, 0.48, -12.3, matWood, false);

  // --- 2D. FORWARD-PROJECTING PUP PYLON (3-TIER STEPPED TRAVERTINE/TERRACOTTA PODIUM + MATCHED R=6.6M CURVED FENCE) ---
  const pylonGroup = new THREE.Group();
  pylonGroup.position.set(78.4, 0, -17.3);
  pylonGroup.rotation.y = 0.22; // Subtly angled ESE toward Anonas St / Teresa intersection per 2026 satellite & Wikimedia photos
  addContactShadow(pylonGroup, 0, 0, 5.8, 9.0);
  const matPylonTile = trackMat(new THREE.MeshStandardMaterial({ color: 0xa64b3e, roughness: 0.68 }));
  const matTravertine = trackMat(new THREE.MeshStandardMaterial({ color: 0xe6dcc9, roughness: 0.72 }));

  // Authentic 3-tier stepped travertine & terracotta podium (from Wikimedia Category:PUP_Pylon)
  const podiumTiers = computePylonPodiumTiers();
  let podiumTopY = 0;
  for (let ti = 0; ti < podiumTiers.length; ti++) {
    const tier = podiumTiers[ti];
    addBox(pylonGroup, tier.width, tier.height, tier.depth, 0, tier.yCenter, 0, ti === 1 ? matPylonTile : matTravertine);
    // Thin terracotta tread trim atop each cream tier
    addBox(
      pylonGroup,
      tier.width - 0.12,
      0.035,
      tier.depth - 0.12,
      0,
      tier.yCenter + tier.height / 2 + 0.015,
      0,
      matPylonTile,
      false,
    );
    podiumTopY = tier.yCenter + tier.height / 2 + 0.03;
  }

  // Twin sloped terracotta pyramidal corner buttress planters flanking the East steps
  for (const bz of [-3.15, 3.15]) {
    const buttress = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.32, 0.72, 0.92, 4)), matPylonTile);
    buttress.rotation.y = Math.PI / 4;
    buttress.position.set(1.78, 0.46, bz);
    buttress.castShadow = castShadow;
    buttress.receiveShadow = true;
    pylonGroup.add(buttress);
    addBox(pylonGroup, 0.54, 0.08, 0.54, 1.78, 0.94, bz, matTravertine, false);
  }

  // Crisp white plaster front planter box filled with lush Santan hedges & red-orange flower clusters
  addBox(pylonGroup, 0.96, 0.72, 5.55, 1.1, podiumTopY + 0.36, 0, matCreamWall);
  addBox(pylonGroup, 0.78, 0.18, 5.25, 1.1, podiumTopY + 0.72, 0, matSantanLeaf, false);
  for (let fz = -2.35; fz <= 2.35; fz += 0.52) {
    const bush = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(0.42, 1)), matSantanLeaf);
    bush.position.set(1.11 + (Math.abs(fz) % 0.15) * 0.4, podiumTopY + 0.98, fz);
    bush.scale.set(0.95, 0.82, 1.1);
    pylonGroup.add(bush);
    const flower = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(0.11, 0)), matSantanFlower);
    flower.position.set(1.41, podiumTopY + 1.06 + (fz % 0.12), fz + 0.1);
    pylonGroup.add(flower);
  }
  for (const lz of [-2.35, 2.35]) {
    addBox(pylonGroup, 0.36, 0.32, 0.36, 1.76, podiumTopY + 0.16, lz, matPylonTile, false);
    const housing = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.28, 0.22, 0.34)), matDarkSteel);
    housing.position.set(1.76, podiumTopY + 0.42, lz);
    housing.rotation.z = 0.45;
    pylonGroup.add(housing);
  }
  const pylonNightLight = new THREE.PointLight(0xfff1d6, 0, 26, 1.45);
  pylonNightLight.position.set(2.05, podiumTopY + 1.85, 0);
  pylonGroup.add(pylonNightLight);
  lampLights.push(pylonNightLight);

  const pylonSpecs: Array<{ dz: number; h: number; tex: THREE.CanvasTexture; letter: 'P' | 'U' }> = [
    { dz: -1.78, h: 11.8, tex: textures.pylonP, letter: 'P' },
    { dz: 0.0, h: 11.4, tex: textures.pylonU, letter: 'U' },
    { dz: 1.78, h: 11.0, tex: textures.pylonP, letter: 'P' },
  ];
  for (const ps of pylonSpecs) {
    const faceMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: ps.tex,
        roughness: 0.32,
        metalness: 0.1,
      }),
    );
    const slabMats = [faceMat, faceMat, matMarble, matMarble, matMarble, matMarble];
    const slab = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.22, ps.h, 1.5)), slabMats);
    slab.position.set(-0.24, podiumTopY + ps.h / 2, ps.dz);
    slab.castShadow = castShadow;
    slab.receiveShadow = true;
    pylonGroup.add(slab);
  }
  gateGroup.add(pylonGroup);
  addCollider('pup-pylon', 78.4, -17.3, 5.2, 8.4);

  // CURVED RED-PLINTH + GALVANIZED STEEL-PICKET PYLON FENCE aligned smoothly to R = 6.6m North Forecourt inner sidewalk edge!
  const addFencePostAndPlinth = (fx: number, fz: number, segLen: number, rotY: number) => {
    const fg = new THREE.Group();
    fg.position.set(fx, 0, fz);
    fg.rotation.y = rotY;
    addBox(fg, segLen + 0.04, 0.68, 0.36, 0, 0.34, 0, matRedBrickPier, false);
    addBox(fg, segLen + 0.05, 0.08, 0.42, 0, 0.71, 0, matCreamWall, false);
    addBox(fg, segLen + 0.04, 0.065, 0.065, 0, 1.55, 0, matGalvSteel, false);
    addBox(fg, segLen + 0.04, 0.065, 0.065, 0, 2.75, 0, matGalvSteel, false);
    const picketCount = Math.max(1, Math.round(segLen / 0.28));
    for (let p = 0; p < picketCount; p++) {
      const lx = -segLen / 2 + ((p + 0.5) / picketCount) * segLen;
      addBox(fg, 0.042, 2.65, 0.042, lx, 2.02, 0, matGalvSteel, false);
    }
    gateGroup.add(fg);
  };
  // 1) Straight East-West fence along North forecourt sidewalk (x = 74.2..79.8, z = -12.95)
  addFencePostAndPlinth(77.0, -12.95, 5.6, 0);
  // 2) Smooth 90° curved red plinth + iron-picket corner (center = (79.8, -16.4), radius = 3.45 -> curves seamlessly to (83.25, -16.4)!)
  for (let i = 0; i < 14; i++) {
    const a = (Math.PI / 2) * (1 - (i + 0.5) / 14);
    const fx = 79.8 + 3.45 * Math.cos(a);
    const fz = -16.4 + 3.45 * Math.sin(a);
    addFencePostAndPlinth(fx, fz, 0.42, Math.PI / 2 - a);
  }
  // 3) Straight North-South fence along Anonas St in front of Pylon (x = 83.25, z = -16.4..-23.8)
  addFencePostAndPlinth(83.25, -20.1, 7.4, Math.PI / 2);

  // Iconic Cobalt-Blue Industrial Water-Main Pipe Manifold behind Pylon Anonas fence
  const matWaterPipeBlue = trackMat(new THREE.MeshStandardMaterial({ color: 0x1a56b8, roughness: 0.38, metalness: 0.55 }));
  const pipeHeader = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.11, 0.11, 4.0, 10)), matWaterPipeBlue);
  pipeHeader.rotation.x = Math.PI / 2;
  pipeHeader.position.set(82.55, 1.28, -20.6);
  gateGroup.add(pipeHeader);
  for (let wz = -22.2; wz <= -19.0; wz += 0.8) {
    const riser = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.085, 0.085, 1.15, 8)), matWaterPipeBlue);
    riser.position.set(82.55, 0.72, wz);
    gateGroup.add(riser);
    const valve = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.11, 0.025, 6, 12)), matTrafficRed);
    valve.position.set(82.55, 1.48, wz);
    gateGroup.add(valve);
  }

  // --- 2E. ARCHITECTURAL CENTER-LANE GUARDHOUSE ON STRIPED CONCRETE TRAFFIC ISLAND, TWIN BOOM BARRIERS & SECURITY OFFICE PAVILION ---
  const kioskGroup = new THREE.Group();
  kioskGroup.position.set(69.8, 0, -4.2);
  gateGroup.add(kioskGroup);
  addContactShadow(kioskGroup, 0, 0, 5.4, 2.9);

  // 1) Elevated Rounded-Nose Black-and-Yellow Striped Concrete Traffic Island (4.8m x 2.35m x 0.18m)
  const islandH = 0.18;
  const matIslandConcrete = trackMat(new THREE.MeshStandardMaterial({ color: 0xbcb8ae, roughness: 0.88 }));
  const matHazardYellow = trackMat(new THREE.MeshStandardMaterial({ color: 0xf0be26, roughness: 0.56 }));
  const matHazardBlack = trackMat(new THREE.MeshStandardMaterial({ color: 0x1f2228, roughness: 0.68 }));
  const matSteelSill = trackMat(new THREE.MeshStandardMaterial({ color: 0xd4d9de, roughness: 0.28, metalness: 0.78 }));
  const matBoothGlass = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x264454,
      roughness: 0.14,
      metalness: 0.35,
      transparent: true,
      opacity: 0.58,
    }),
  );

  // Straight central concrete slab + rounded East/West semicircular noses
  addBox(kioskGroup, 2.7, islandH, 2.32, 0, islandH / 2, 0, matIslandConcrete);
  for (const nx of [-1.35, 1.35]) {
    const nose = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(1.16, 1.18, islandH, 16)), matIslandConcrete);
    nose.position.set(nx, islandH / 2, 0);
    nose.receiveShadow = true;
    kioskGroup.add(nose);
    // Alternating yellow/black hazard curb blocks around rounded nose
    for (let s = 0; s < 6; s++) {
      const ang = -Math.PI / 2 + ((s + 0.5) / 6) * Math.PI;
      const sx = nx + (nx > 0 ? 1 : -1) * Math.cos(ang) * 1.14;
      const sz = Math.sin(ang) * 1.14;
      const curbSeg = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.14, islandH + 0.015, 0.52)),
        s % 2 === 0 ? matHazardYellow : matHazardBlack,
      );
      curbSeg.position.set(sx, islandH / 2, sz);
      curbSeg.rotation.y = nx > 0 ? -ang : ang;
      kioskGroup.add(curbSeg);
    }
  }
  // Straight North & South striped island curb edge
  for (const iz of [-1.14, 1.14]) {
    for (let s = 0; s < 6; s++) {
      const sx = -1.125 + s * 0.45;
      addBox(
        kioskGroup,
        0.44,
        islandH + 0.015,
        0.12,
        sx,
        islandH / 2,
        iz,
        s % 2 === 0 ? matHazardYellow : matHazardBlack,
        false,
      );
    }
  }

  // 4 Protective Yellow-and-Black Steel Crash Bollards guarding East & West ends of the traffic island
  for (const bx of [-2.18, 2.18]) {
    for (const bz of [-0.52, 0.52]) {
      const bollard = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.085, 0.095, 0.86, 10)), matHazardYellow);
      bollard.position.set(bx, islandH + 0.43, bz);
      bollard.castShadow = castShadow;
      kioskGroup.add(bollard);
      const band1 = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.089, 0.089, 0.14, 10)), matHazardBlack);
      band1.position.set(bx, islandH + 0.66, bz);
      kioskGroup.add(band1);
      const band2 = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.089, 0.089, 0.14, 10)), matHazardBlack);
      band2.position.set(bx, islandH + 0.34, bz);
      kioskGroup.add(band2);
      const cap = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.085, 8, 6)), matHazardBlack);
      cap.position.set(bx, islandH + 0.86, bz);
      kioskGroup.add(cap);
    }
  }

  // 2) Enclosed Guardhouse Lower Masonry Wainscot + Molded Belt Course + Inspection Sill (y = 0.18..1.32m)
  addBox(kioskGroup, 2.48, 0.24, 1.88, 0, islandH + 0.12, 0, matLintelMaroon);
  addBox(kioskGroup, 2.42, 0.86, 1.82, 0, islandH + 0.67, 0, matBrightWhite);
  // Recessed maroon wainscot decorative panels on North/South/West walls
  addBox(kioskGroup, 1.85, 0.56, 1.86, 0, islandH + 0.66, 0, matLintelMaroon, false);
  addBox(kioskGroup, 2.46, 0.56, 1.32, -0.02, islandH + 0.66, 0, matLintelMaroon, false);
  // Molded white concrete belt course + projecting stainless-steel inspection counter sill
  addBox(kioskGroup, 2.58, 0.09, 1.98, 0, islandH + 1.12, 0, matCreamWall, false);
  addBox(kioskGroup, 2.68, 0.06, 2.1, 0, islandH + 1.18, 0, matSteelSill, false);

  // Classic East-facing "NO PUP STICKER · NO ENTRY" gate signboard mounted cleanly on the wainscot
  addSignMesh(kioskGroup, 1.44, 0.86, 1.24, islandH + 0.64, 0, Math.PI / 2, 'NO PUP STICKER', 'NO ENTRY', {
    bg: '#dedad0',
    border: '#102052',
    titleColor: '#9e0b0b',
    subtitleColor: '#0f1f4f',
    width: 440,
    height: 280,
  });

  // 3) 360° Wraparound Aluminum-Mullioned Tinted Sliding Glass Observation Enclosure (y = 1.38..2.48m)
  for (const [kx, kz] of [
    [-1.15, -0.85],
    [1.15, -0.85],
    [-1.15, 0.85],
    [1.15, 0.85],
  ]) {
    addBox(kioskGroup, 0.13, 1.18, 0.13, kx, islandH + 1.76, kz, matLintelMaroon, false);
  }
  // Translucent security window glazing on all 4 facades
  addBox(kioskGroup, 2.22, 1.04, 0.04, 0, islandH + 1.74, -0.84, matBoothGlass, false);
  addBox(kioskGroup, 2.22, 1.04, 0.04, 0, islandH + 1.74, 0.84, matBoothGlass, false);
  addBox(kioskGroup, 0.04, 1.04, 1.62, 1.14, islandH + 1.74, 0, matBoothGlass, false);
  addBox(kioskGroup, 0.04, 1.04, 1.62, -1.14, islandH + 1.74, 0, matBoothGlass, false);
  // Crisp anodized aluminum window frames, vertical sliding mullions & transom rail
  addBox(kioskGroup, 2.34, 0.055, 1.74, 0, islandH + 2.04, 0, matGalvSteel, false);
  for (const mx of [-0.38, 0.38]) {
    addBox(kioskGroup, 0.045, 1.06, 0.055, mx, islandH + 1.74, -0.84, matGalvSteel, false);
    addBox(kioskGroup, 0.045, 1.06, 0.055, mx, islandH + 1.74, 0.84, matGalvSteel, false);
  }
  for (const mz of [-0.32, 0.32]) {
    addBox(kioskGroup, 0.055, 1.06, 0.045, 1.14, islandH + 1.74, mz, matGalvSteel, false);
    addBox(kioskGroup, 0.055, 1.06, 0.045, -1.14, islandH + 1.74, mz, matGalvSteel, false);
  }

  // Interior guard logbook desk + glowing CCTV monitor + warm ceiling LED strip visible inside the glass booth
  addBox(kioskGroup, 1.72, 0.07, 0.62, 0.12, islandH + 1.14, 0, matWood, false);
  addBox(kioskGroup, 0.08, 0.34, 0.48, 0.42, islandH + 1.38, -0.18, matDarkSteel, false);
  const matCctvScreen = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x3b86b8,
      emissive: 0x266c9e,
      emissiveIntensity: 0.72,
      roughness: 0.22,
    }),
  );
  addBox(kioskGroup, 0.02, 0.26, 0.4, 0.37, islandH + 1.38, -0.18, matCctvScreen, false);
  const kioskBulbMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xfff4d4, emissive: 0xffd584, emissiveIntensity: 0.55, roughness: 0.2 }),
  );
  lampBulbs.push(kioskBulbMat);
  addBox(kioskGroup, 1.15, 0.05, 0.16, 0, islandH + 2.26, 0, kioskBulbMat, false);

  // 4) Deep Overhanging White Fascia Soffit + Stepped Pyramidal-Hipped Corrugated Maroon Roof (y = 2.48..3.76m)
  addBox(kioskGroup, 3.38, 0.16, 2.78, 0, islandH + 2.38, 0, matBrightWhite);
  addBox(kioskGroup, 3.46, 0.08, 2.86, 0, islandH + 2.48, 0, matLintelMaroon, false);
  // Pyramidal-hipped corrugated maroon roof (4-sided hip pyramid scaled to booth footprint)
  const hipRoof = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(1.0, 1.08, 4)), matGableRed);
  hipRoof.rotation.y = Math.PI / 4;
  hipRoof.scale.set(2.52, 1.0, 2.08);
  hipRoof.position.set(0, islandH + 3.04, 0);
  hipRoof.castShadow = castShadow;
  hipRoof.receiveShadow = true;
  kioskGroup.add(hipRoof);
  // Raised maroon standing-seam corner hip ribs & crown finial
  addBox(kioskGroup, 0.58, 0.12, 0.42, 0, islandH + 3.58, 0, matDarkMaroonRoof, false);
  addBox(kioskGroup, 0.66, 0.05, 0.48, 0, islandH + 3.65, 0, matBrightWhite, false);
  // Mounted CCTV security dome camera under East roof overhang
  const cctvDomeBase = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 10)), matBrightWhite);
  cctvDomeBase.position.set(1.42, islandH + 2.27, 0);
  kioskGroup.add(cctvDomeBase);
  const cctvDomeLens = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.085, 8, 6)), matHazardBlack);
  cctvDomeLens.position.set(1.42, islandH + 2.22, 0);
  kioskGroup.add(cctvDomeLens);

  // Iconic Guard Umbrella tucked on West deck corner
  const matGuardUmb = trackMat(new THREE.MeshStandardMaterial({ color: 0x224c38, roughness: 0.78 }));
  const gUmbPole = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.025, 0.025, 2.22, 6)), matDarkSteel);
  gUmbPole.position.set(-1.62, islandH + 1.12, 0.58);
  kioskGroup.add(gUmbPole);
  const gUmbCap = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.84, 0.32, 8)), matGuardUmb);
  gUmbCap.position.set(-1.62, islandH + 2.26, 0.58);
  kioskGroup.add(gUmbCap);
  addCollider('guard-booth', 69.8, -4.2, 4.7, 2.3);

  // Stationed PUP Security Guard standing on duty beside the Guardhouse island
  const guardFigure = new THREE.Group();
  guardFigure.position.set(70.6, 0, -5.85);
  guardFigure.rotation.y = Math.PI / 2;
  const matGuardShirt = trackMat(new THREE.MeshStandardMaterial({ color: 0xb9cfe3, roughness: 0.78 }));
  const matGuardPants = trackMat(new THREE.MeshStandardMaterial({ color: 0x1d2738, roughness: 0.85 }));
  const matGuardSkin = trackMat(new THREE.MeshStandardMaterial({ color: 0xd4a47e, roughness: 0.76 }));
  addBox(guardFigure, 0.16, 0.78, 0.16, -0.1, 0.39, 0, matGuardPants, false);
  addBox(guardFigure, 0.16, 0.78, 0.16, 0.1, 0.39, 0, matGuardPants, false);
  addBox(guardFigure, 0.44, 0.62, 0.24, 0, 1.08, 0, matGuardShirt, false);
  addBox(guardFigure, 0.12, 0.52, 0.12, -0.28, 1.05, 0, matGuardShirt, false);
  addBox(guardFigure, 0.12, 0.52, 0.12, 0.28, 1.05, 0, matGuardShirt, false);
  const guardHead = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.14, 10, 8)), matGuardSkin);
  guardHead.position.set(0, 1.54, 0);
  guardFigure.add(guardHead);
  addBox(guardFigure, 0.3, 0.09, 0.32, 0, 1.66, 0.02, matGuardPants, false);
  gateGroup.add(guardFigure);

  // TWIN Motorized Red-and-White Striped Vehicle Boom Barrier Gates mounted on the East traffic island apron
  for (const [bz, dir] of [
    [-5.05, -1],
    [-3.35, 1],
  ] as Array<[number, number]>) {
    addBox(gateGroup, 0.38, 1.04, 0.38, 71.25, islandH + 0.52, bz, matTrafficRed, false);
    addBox(gateGroup, 0.42, 0.1, 0.42, 71.25, islandH + 1.06, bz, matHazardYellow, false);
    const boomArm = new THREE.Group();
    boomArm.position.set(71.25, islandH + 0.94, bz);
    boomArm.rotation.x = dir * -0.92;
    for (let seg = 0; seg < 6; seg++) {
      addBox(boomArm, 0.075, 0.085, 0.52, 0, 0, dir * (0.34 + seg * 0.54), seg % 2 === 0 ? matTrafficRed : matBrightWhite, false);
    }
    gateGroup.add(boomArm);
  }

  // MAIN PUP SECURITY OFFICE / GUARDHOUSE PAVILION IMMEDIATELY INSIDE NORTH ENTRANCE (x = 68.6, z = -12.7)
  const secOffice = new THREE.Group();
  secOffice.position.set(68.6, 0, -12.7);
  gateGroup.add(secOffice);
  addContactShadow(secOffice, 0, 0, 5.8, 3.2);
  // Rusticated brick lower wall + crisp concrete windowsill + stainless-steel ID-check counter ledge
  addBox(secOffice, 5.4, 1.22, 2.7, 0, 0.61, 0, matRedBrickPier);
  addBox(secOffice, 5.56, 0.1, 2.86, 0, 1.24, 0, matCreamWall, false);
  addBox(secOffice, 4.4, 0.06, 0.48, 0, 1.26, 1.56, matSteelSill, false);
  // Multi-pane aluminum-mullioned security teller windows (3 sliding teller bays + dark interior backing)
  addBox(secOffice, 5.2, 1.62, 2.52, 0, 2.08, 0, matBoothGlass, false);
  addBox(secOffice, 4.9, 1.48, 2.2, 0, 2.04, 0, matCreamWall, false);
  for (const wx of [-2.58, -0.88, 0.88, 2.58]) {
    addBox(secOffice, 0.14, 1.66, 0.14, wx, 2.08, 1.28, matLintelMaroon, false);
    addBox(secOffice, 0.14, 1.66, 0.14, wx, 2.08, -1.28, matLintelMaroon, false);
  }
  for (const tx of [-1.73, 0, 1.73]) {
    // Vertical aluminum sliding teller mullions + projecting white concrete sun-hood above each teller bay
    addBox(secOffice, 0.045, 1.56, 0.05, tx, 2.08, 1.29, matGalvSteel, false);
    addBox(secOffice, 1.54, 0.09, 0.46, tx, 2.74, 1.52, matBrightWhite, false);
  }
  addBox(secOffice, 5.32, 0.05, 0.06, 0, 2.46, 1.29, matGalvSteel, false);
  // Crisp white overhanging soffit fascia + ribbed maroon hipped roof + CCTV camera
  addBox(secOffice, 6.05, 0.16, 3.45, 0, 2.98, 0, matBrightWhite);
  addBox(secOffice, 6.14, 0.08, 3.54, 0, 3.08, 0, matLintelMaroon, false);
  const secRoofN = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(6.2, 0.14, 2.25)), matGableRed);
  secRoofN.position.set(0, 3.54, -0.82);
  secRoofN.rotation.x = -0.34;
  secRoofN.castShadow = castShadow;
  secOffice.add(secRoofN);
  const secRoofS = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(6.2, 0.14, 2.25)), matGableRed);
  secRoofS.position.set(0, 3.54, 0.82);
  secRoofS.rotation.x = 0.34;
  secRoofS.castShadow = castShadow;
  secOffice.add(secRoofS);
  for (let rx = -2.75; rx <= 2.75; rx += 0.55) {
    const ribS = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.05, 0.16, 2.22)), matDarkMaroonRoof);
    ribS.position.set(rx, 3.56, 0.82);
    ribS.rotation.x = 0.34;
    secOffice.add(ribS);
  }
  addBox(secOffice, 6.26, 0.22, 0.22, 0, 3.92, 0, matBrightWhite, false);
  // CCTV dome camera under South eaves overlooking ID check queue
  const secCam = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.09, 8, 6)), matHazardBlack);
  secCam.position.set(2.45, 2.86, 1.48);
  secOffice.add(secCam);

  addSignMesh(secOffice, 3.6, 0.54, 0, 3.16, 1.78, 0, 'PUP SECURITY OFFICE', 'MAIN GATE GUARDHOUSE · ID CHECK', {
    bg: '#7b1113',
    border: '#f2ca68',
    titleColor: '#ffffff',
  });
  // Galvanized steel student ID-check queue railing
  addBox(secOffice, 6.2, 0.05, 0.05, -0.4, 0.96, 2.25, matGalvSteel, false);
  addBox(secOffice, 6.2, 0.05, 0.05, -0.4, 0.48, 2.25, matGalvSteel, false);
  for (let rx = -3.4; rx <= 2.6; rx += 1.2) {
    addBox(secOffice, 0.05, 0.96, 0.05, rx, 0.48, 2.25, matGalvSteel, false);
  }
  addCollider('pup-security-office', 68.6, -12.7, 5.5, 2.9);

  // Red-and-White Striped Plastic Traffic Barrier & Orange Cones beside Main Gate lane
  const barrierGrp = new THREE.Group();
  barrierGrp.position.set(72.9, 0, -9.2);
  addBox(barrierGrp, 0.52, 0.85, 1.38, 0, 0.425, 0, matTrafficRed, false);
  for (const sz of [-0.42, 0, 0.42]) {
    addBox(barrierGrp, 0.55, 0.52, 0.16, 0, 0.48, sz, matBrightWhite, false);
  }
  gateGroup.add(barrierGrp);
  for (const [cx, cz] of [
    [72.6, -8.1],
    [72.4, -2.1],
  ]) {
    const cone = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.18, 0.64, 10)), matTrafficRed);
    cone.position.set(cx, 0.32, cz);
    gateGroup.add(cone);
    addBox(gateGroup, 0.42, 0.05, 0.42, cx, 0.025, cz, matDarkSteel, false);
  }

  // Parked Security / Student Motorcycles beside guardhouse
  const addParkedScooter = (mx: number, mz: number, rotY: number, bodyMat: THREE.Material) => {
    const moto = new THREE.Group();
    moto.position.set(mx, 0, mz);
    moto.rotation.y = rotY;
    for (const wz of [-0.55, 0.55]) {
      const tire = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.24, 0.24, 0.12, 10)), matTireRubber);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(0, 0.24, wz);
      moto.add(tire);
    }
    addBox(moto, 0.38, 0.46, 1.28, 0, 0.56, 0, bodyMat, false);
    addBox(moto, 0.32, 0.16, 0.68, 0, 0.82, -0.18, matDarkSteel, false);
    addBox(moto, 0.58, 0.06, 0.08, 0, 0.98, 0.48, matGalvSteel, false);
    addBox(moto, 0.34, 0.28, 0.34, 0, 0.96, -0.58, matDarkSteel, false);
    gateGroup.add(moto);
  };
  addParkedScooter(68.8, -3.5, -0.25, matTrafficRed);
  addParkedScooter(65.0, 0.6, 0.4, matDarkSteel);

  // Center-Lane Yellow "OBSERVE SPEED LIMIT 10 KPH" Signpost on Concrete Drum Base
  const speedBase = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.24, 0.28, 0.36, 10)), matRawConcrete);
  speedBase.position.set(64.2, 0.18, -4.0);
  gateGroup.add(speedBase);
  addBox(gateGroup, 0.06, 1.55, 0.06, 64.2, 0.95, -4.0, matGold, false);
  addSignMesh(gateGroup, 0.52, 0.64, 64.26, 1.62, -4.0, Math.PI / 2, 'SPEED LIMIT', '10 KPH', {
    bg: '#f2ca2c',
    border: '#1a1816',
    titleColor: '#141414',
    subtitleColor: '#141414',
    width: 240,
    height: 300,
  });

  // --- 2E-2. AUTHENTIC UNIVERSITY AVENUE SIDEWALKS, HERRINGBONE BRICK PAVERS, BLACK-WHITE CURBS & ROPE BOLLARDS (x = 26..73.2!) ---
  const matBrickSidewalk = trackMat(new THREE.MeshStandardMaterial({ color: 0x8a5b4a, roughness: 0.88 }));
  addBox(gateGroup, 47.2, 0.14, 3.0, 49.6, 0.07, -11.1, matBrickSidewalk, false);
  addBox(gateGroup, 47.2, 0.14, 2.8, 49.6, 0.07, 3.0, matBrickSidewalk, false);
  for (let bx = 28.0; bx <= 71.0; bx += 4.5) {
    addBox(gateGroup, 0.18, 0.146, 3.02, bx, 0.073, -11.1, matBrightWhite, false);
    addBox(gateGroup, 0.18, 0.146, 2.82, bx, 0.073, 3.0, matBrightWhite, false);
  }
  addBox(gateGroup, 47.2, 0.146, 0.16, 49.6, 0.073, -12.5, matBrightWhite, false);
  addBox(gateGroup, 47.2, 0.146, 0.16, 49.6, 0.073, 4.32, matBrightWhite, false);

  let uniCurbToggle = false;
  for (let cx = 27.0; cx <= 72.5; cx += 1.4) {
    const cMat = uniCurbToggle ? matBrightWhite : matDarkSteel;
    addBox(gateGroup, 1.38, 0.17, 0.22, cx, 0.085, -9.52, cMat, false);
    addBox(gateGroup, 1.38, 0.17, 0.22, cx, 0.085, 1.52, cMat, false);
    uniCurbToggle = !uniCurbToggle;
  }
  addBox(gateGroup, 46.0, 0.022, 0.12, 49.5, 0.038, -9.1, matBrightWhite, false);
  addBox(gateGroup, 46.0, 0.022, 0.12, 49.5, 0.038, 1.1, matBrightWhite, false);
  addBox(gateGroup, 46.0, 0.022, 0.16, 49.5, 0.038, -4.0, matGold, false);
  for (let cz = -8.6; cz <= 0.6; cz += 0.92) {
    addBox(gateGroup, 2.4, 0.026, 0.42, 53.5, 0.039, cz, matBrightWhite, false);
  }

  // Black-and-White Striped Cylindrical Rope Bollards along North Sidewalk Curb (isv_south_looking_n.png!)
  for (let bx = 32.0; bx <= 64.0; bx += 3.4) {
    const bBase = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.18, 0.2, 0.1, 8)), matRawConcrete);
    bBase.position.set(bx, 0.14, -9.75);
    gateGroup.add(bBase);
    addBox(gateGroup, 0.07, 0.34, 0.07, bx, 0.35, -9.75, matDarkSteel, false);
    addBox(gateGroup, 0.07, 0.32, 0.07, bx, 0.68, -9.75, matBrightWhite, false);
    addBox(gateGroup, 0.07, 0.24, 0.07, bx, 0.96, -9.75, matDarkSteel, false);
    if (bx + 3.4 <= 64.0) {
      addBox(gateGroup, 3.4, 0.025, 0.025, bx + 1.7, 0.88, -9.75, matBrightWhite, false);
    }
  }

  // Steel Trench Drainage Plates across Main Gate Forecourt Threshold
  for (let dz = -5.4; dz <= -2.4; dz += 1.0) {
    addBox(gateGroup, 1.25, 0.025, 0.92, 75.5, 0.036, dz, matConcrete, false);
    addBox(gateGroup, 1.3, 0.02, 0.96, 75.5, 0.032, dz, matDarkSteel, false);
  }

  // South Covered Walkway ("Catwalk") Silver Guardrails & PUP Heritage Photo Exhibit Panels
  addBox(gateGroup, 16.0, 0.05, 0.05, 62.5, 0.98, 1.95, matGalvSteel, false);
  addBox(gateGroup, 16.0, 0.05, 0.05, 62.5, 0.5, 1.95, matGalvSteel, false);
  for (let rx = 54.5; rx <= 70.5; rx += 2.25) {
    addBox(gateGroup, 0.05, 0.98, 0.05, rx, 0.49, 1.95, matGalvSteel, false);
  }
  for (const [ex, title, sub] of [
    [66.8, 'PUP HERITAGE 1904', 'MANILA BUSINESS SCHOOL'],
    [62.2, 'ISKOLAR NG BAYAN', 'THE COUNTRY’S 1ST POLYTECHNIC U'],
    [57.6, 'A. MABINI CAMPUS', 'STA. MESA, MANILA'],
  ] as Array<[number, string, string]>) {
    addSignMesh(gateGroup, 2.5, 1.22, ex, 1.78, 2.45, Math.PI, title, sub, {
      bg: '#24201e',
      border: '#e5e0d4',
      titleColor: '#f5f2eb',
      subtitleColor: '#d9c8a2',
      width: 480,
      height: 240,
    });
  }

  // --- 2F. INSIDE-GATE ENTRANCE PLAZA LANDMARKS ---
  const charterGrp = new THREE.Group();
  charterGrp.position.set(61.4, 0, -13.65);
  gateGroup.add(charterGrp);
  addBox(charterGrp, 6.2, 2.35, 0.22, 0, 1.55, 0, matCreamWall);
  addBox(charterGrp, 1.95, 2.38, 0.24, 2.15, 1.55, 0, matLintelMaroon, false);
  const charterSealRing = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.62, 0.06, 8, 20)), matGoldBrass);
  charterSealRing.position.set(2.15, 1.78, 0.14);
  charterGrp.add(charterSealRing);
  const charterSealStar = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.36, 0)), matGoldBrass);
  charterSealStar.position.set(2.15, 1.78, 0.14);
  charterSealStar.scale.set(1, 1, 0.22);
  charterGrp.add(charterSealStar);
  addSignMesh(charterGrp, 4.0, 1.95, -0.95, 1.58, 0.13, 0, 'PUP CITIZEN’S CHARTER', 'OFFICE SERVICES · REGISTRAR · ADMISSION', {
    bg: '#f5f2ea',
    border: '#7b1113',
    titleColor: '#6d1215',
    subtitleColor: '#2c2420',
    width: 640,
    height: 320,
  });

  const pupSignGrp = new THREE.Group();
  pupSignGrp.position.set(67.2, 0, 4.8);
  gateGroup.add(pupSignGrp);
  addBox(pupSignGrp, 0.65, 4.4, 0.85, 1.65, 2.2, 0, matBrightWhite);
  addBox(pupSignGrp, 0.85, 1.55, 2.35, 1.65, 3.85, 0, matGalvSteel);
  addSignMesh(pupSignGrp, 2.05, 1.22, 1.65, 3.85, -0.45, Math.PI, 'MABUHAY ISKOLAR NG BAYAN!', 'PUP STA. MESA · MANILA', {
    bg: '#141112',
    border: '#33363b',
    titleColor: '#ff7043',
    subtitleColor: '#ffd54f',
    width: 512,
    height: 280,
  });
  const build3DLetter = (lx: number, kind: 'P' | 'U') => {
    const lg = new THREE.Group();
    lg.position.set(lx, 0, -0.3);
    if (kind === 'P') {
      addBox(lg, 0.34, 1.95, 0.45, -0.34, 0.98, 0, matSignCyan, false);
      addBox(lg, 0.65, 0.28, 0.45, 0.08, 1.82, 0, matSignCyan, false);
      addBox(lg, 0.65, 0.28, 0.45, 0.08, 1.12, 0, matSignCyan, false);
      addBox(lg, 0.28, 0.96, 0.45, 0.34, 1.48, 0, matSignCyan, false);
    } else {
      addBox(lg, 0.32, 1.92, 0.45, -0.36, 0.98, 0, matSignCyan, false);
      addBox(lg, 0.32, 1.92, 0.45, 0.36, 0.98, 0, matSignCyan, false);
      addBox(lg, 1.04, 0.3, 0.45, 0, 0.16, 0, matSignCyan, false);
    }
    pupSignGrp.add(lg);
  };
  build3DLetter(-1.25, 'P');
  build3DLetter(-0.05, 'U');
  build3DLetter(1.12, 'P');

  // =========================================================================
  // AUTHENTIC PUP STA. MESA RIBBED CREAM-AND-MAROON PERIMETER WALLS
  // Photo-matched to May 2026 Google Street View (2281 Anonas St — south_2_oval_wall_mid.png!):
  // - Weathered concrete foundation plinth + warm cream stucco body
  // - 3 continuous raised horizontal concrete rib moldings (signature PUP wall detail!)
  // - Crisp deep maroon top coping band + protruding pilasters every 4.6m
  // - Angled rusted-steel security posts + 4 taut barbed-wire strands + solar security lamps
  // =========================================================================
  const matWireRust = trackMat(new THREE.MeshStandardMaterial({ color: 0x3b3532, roughness: 0.78, metalness: 0.45 }));
  const matSolarPanel = trackMat(new THREE.MeshStandardMaterial({ color: 0x1d2d44, roughness: 0.28, metalness: 0.55 }));

  const addPupRibbedWallSegment = (
    parent: THREE.Object3D,
    x1: number,
    z1: number,
    x2: number,
    z2: number,
    colliderId?: string,
  ) => {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    if (len < 0.5) return;
    const midX = (x1 + x2) / 2;
    const midZ = (z1 + z2) / 2;
    const rotY = Math.atan2(-dz, dx); // Local +X runs along wall from p1 -> p2

    const wg = new THREE.Group();
    wg.position.set(midX, 0, midZ);
    wg.rotation.y = rotY;

    // 1. Weathered concrete lower plinth base
    addBox(wg, len, 0.44, 0.54, 0, 0.22, 0, matRawConcrete, false);
    // 2. Warm cream stucco main wall body
    addBox(wg, len, 2.08, 0.44, 0, 1.48, 0, matCreamWall, true);
    // 3. THREE iconic horizontal raised concrete rib moldings on BOTH sides (2281 Anonas St!)
    for (const ry of [0.84, 1.48, 2.1]) {
      addBox(wg, len, 0.085, 0.54, 0, ry, 0, matBrightWhite, false);
    }
    // 4. Deep maroon top coping band + overhanging top cap
    addBox(wg, len, 0.34, 0.5, 0, 2.66, 0, matMaroon, false);
    addBox(wg, len + 0.08, 0.1, 0.58, 0, 2.86, 0, matMaroon, false);

    // 5. Protruding masonry pilasters every ~4.6m + barbed-wire security fence posts every ~2.3m
    const bayCount = Math.max(1, Math.round(len / 4.6));
    for (let i = 0; i <= bayCount; i++) {
      const px = -len / 2 + (i / bayCount) * len;
      addBox(wg, 0.38, 2.92, 0.6, px, 1.46, 0, matCreamWall, false);
      addBox(wg, 0.44, 0.32, 0.64, px, 2.74, 0, matMaroon, false);
      // Small mounted solar security light every ~3rd bay (visible on 2281 Anonas St wall!)
      if (i > 0 && i < bayCount && i % 3 === 0) {
        addBox(wg, 0.34, 0.28, 0.08, px, 3.12, 0.18, matSolarPanel, false);
      }
    }
    const postCount = Math.max(2, Math.round(len / 2.3));
    for (let i = 0; i <= postCount; i++) {
      const px = -len / 2 + (i / postCount) * len;
      addBox(wg, 0.045, 0.95, 0.045, px, 3.36, 0, matWireRust, false);
      // Slight diagonal barbed-wire extension arm at top
      const arm = addBox(wg, 0.04, 0.38, 0.04, px, 3.9, 0.12, matWireRust, false);
      arm.rotation.x = 0.55;
    }
    // 4 taut horizontal barbed-wire / security fence strands
    for (const wy of [3.12, 3.38, 3.64, 3.92]) {
      addBox(wg, len, 0.025, 0.025, 0, wy, wy > 3.8 ? 0.16 : 0, matWireRust, false);
    }

    parent.add(wg);
    if (colliderId) {
      const isNS = Math.abs(dz) >= Math.abs(dx);
      addCollider(colliderId, midX, midZ, isNS ? 0.85 : len, isNS ? len : 0.85);
    }
  };

  // East Campus Perimeter Wall along Anonas St (x = 82.6): North of Gym Gate + South Oval Wall (2281–2315 Anonas St!)
  addPupRibbedWallSegment(gateGroup, 82.6, -69.5, 82.6, -32.5, 'pup-wall-anonas-north');
  addPupRibbedWallSegment(gateGroup, 82.6, 27.1, 82.6, 53.5, 'pup-wall-anonas-oval-n');
  addPupRibbedWallSegment(gateGroup, 82.6, 62.5, 82.6, 78.5, 'pup-wall-anonas-oval-s');
  // South Campus Boundary Wall separating PUP's South Academic Strip (FMO / Food & Nutrition / Gabriela Silang / Tahanan ng Atleta) from Maui Oasis!
  addPupRibbedWallSegment(gateGroup, -54.0, 76.5, 82.0, 76.5, 'pup-south-perimeter-wall');

  // =========================================================================
  // 3. TWIN PARALLEL PUP CATWALKS (Both North & South Sides of Main Avenue!)
  // =========================================================================
  const catwalkGroup = new THREE.Group();
  root.add(catwalkGroup);

  const matCatwalkRoof = trackMat(new THREE.MeshStandardMaterial({ color: 0x2a543c, roughness: 0.62, metalness: 0.24 }));
  // Cleanly spans x = 27.5..64.5 (leaving full room for recessed Main Gate & Security Office Pavilion!)
  for (const sideZ of [-11.4, 3.4]) {
    addPaving(46, sideZ, 37, 3.6, matPaver, 0.045);
    addBox(catwalkGroup, 37.0, 0.16, 3.8, 46, 3.15, sideZ, matCatwalkRoof);
    addBox(catwalkGroup, 37.1, 0.18, 0.16, 46, 3.16, sideZ + 1.88, matBrightWhite, false);
    addBox(catwalkGroup, 37.1, 0.18, 0.16, 46, 3.16, sideZ - 1.88, matBrightWhite, false);
    for (let cx = 28.5; cx <= 63.5; cx += 5.0) {
      for (const dz of [-1.55, 1.55]) {
        addBox(catwalkGroup, 0.34, 0.34, 0.34, cx, 0.17, sideZ + dz, matMaroon, false);
        const post = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.075, 0.085, 2.85, 8)), matBrightWhite);
        post.position.set(cx, 1.72, sideZ + dz);
        post.castShadow = castShadow;
        catwalkGroup.add(post);
      }
      addBox(catwalkGroup, 0.12, 0.14, 3.3, cx, 3.02, sideZ, matBrightWhite, false);
    }
  }
  // Angled NW Catwalk branch skirting north of the Obelisk toward the Courts & Lagoon (matches pup_map.png!)
  const catBranch = new THREE.Group();
  catBranch.position.set(17, 0, -17.5);
  catBranch.rotation.y = Math.PI * 0.27;
  addBox(catBranch, 16, 0.16, 3.4, 0, 3.15, 0, matCatwalkRoof);
  for (let lx = -6.5; lx <= 6.5; lx += 4.3) {
    addBox(catBranch, 0.32, 0.32, 0.32, lx, 0.16, -1.4, matMaroon, false);
    addBox(catBranch, 0.32, 0.32, 0.32, lx, 0.16, 1.4, matMaroon, false);
    addBox(catBranch, 0.13, 2.85, 0.13, lx, 1.72, -1.4, matBrightWhite, false);
    addBox(catBranch, 0.13, 2.85, 0.13, lx, 1.72, 1.4, matBrightWhite, false);
  }
  catwalkGroup.add(catBranch);

  // =========================================================================
  // 4. PUP OBELISK ROUNDABOUT, FREEDOM PARK & FOUNTAIN PARK (x = 14, z = -4)
  //    Photo-matched directly to PaullyMac/PUPKiosk obelisk.png & vicinity_map.jpg!
  // =========================================================================
  const obeliskGroup = new THREE.Group();
  obeliskGroup.position.set(14, 0, -4);
  root.add(obeliskGroup);

  // Iconic Black-and-White Striped Circular Roundabout Curb Ring (exact match to obelisk.png!)
  for (let seg = 0; seg < 48; seg++) {
    const a = (seg / 48) * Math.PI * 2;
    const curbBlock = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.45, 0.22, 1.32)),
      seg % 2 === 0 ? matBrightWhite : matDarkSteel,
    );
    curbBlock.position.set(Math.cos(a) * 10.6, 0.11, Math.sin(a) * 10.6);
    curbBlock.rotation.y = -a;
    obeliskGroup.add(curbBlock);
  }
  const outerWalkRing = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(10.5, 10.55, 0.16, 36)), matRawConcrete);
  outerWalkRing.position.y = 0.08;
  outerWalkRing.receiveShadow = true;
  obeliskGroup.add(outerWalkRing);

  // Cream-White Circular Planter Retaining Wall + Raised Landscaped Mound (matches obelisk.png!)
  const planterWall = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(8.9, 9.0, 1.12, 36)), matCreamWall);
  planterWall.position.y = 0.56;
  planterWall.receiveShadow = true;
  obeliskGroup.add(planterWall);

  const islandGrass = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(8.6, 8.7, 0.22, 32)), matGrass);
  islandGrass.position.y = 1.08;
  islandGrass.receiveShadow = true;
  obeliskGroup.add(islandGrass);

  const islandTopPad = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(3.4, 3.7, 0.58, 24)), matCreamWall);
  islandTopPad.position.y = 1.45;
  islandTopPad.receiveShadow = true;
  obeliskGroup.add(islandTopPad);

  // FOUR Iconic Diagonal Sloped White Concrete Ramps with Red-Maroon Approach Steps (exact signature of obelisk.png!)
  for (let r = 0; r < 4; r++) {
    const rampGroup = new THREE.Group();
    rampGroup.rotation.y = (r * Math.PI) / 2 + Math.PI / 4;
    // Wide red-maroon entrance steps at base of ramp
    for (let s = 0; s < 3; s++) {
      addBox(rampGroup, 2.8, 0.16, 0.45, 0, 0.16 + s * 0.16, 9.6 - s * 0.44, matMaroon, false);
    }
    // Sloped cream-white concrete walkway ramp climbing from z=8.6 up to central pad z=3.3
    const rampSlab = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.45, 0.26, 5.6)), matCreamWall);
    rampSlab.position.set(0, 1.15, 6.0);
    rampSlab.rotation.x = 0.21;
    rampSlab.receiveShadow = true;
    rampGroup.add(rampSlab);
    // Low cream side parapets framing each sloped ramp (exact match to obelisk.png!)
    for (const sx of [-1.25, 1.25]) {
      const cheek = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.24, 0.62, 5.8)), matCreamWall);
      cheek.position.set(sx, 1.32, 6.0);
      cheek.rotation.x = 0.21;
      rampGroup.add(cheek);
    }
    obeliskGroup.add(rampGroup);
  }

  // Sculpted Green Hedge Ring + Rounded Ornamental Shrubs inside the circular retaining wall (matches obelisk.png!)
  const shrubMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x356428, roughness: 0.92 }));
  const shrubLightMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x457b33, roughness: 0.9 }));
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    if (Math.abs(Math.sin(a * 2)) > 0.78) continue; // Keep clear of the 4 diagonal ramps
    const sh = new THREE.Mesh(
      trackGeo(new THREE.DodecahedronGeometry(1.05, 1)),
      i % 2 === 0 ? shrubMat : shrubLightMat,
    );
    sh.scale.set(1.25, 0.68, 1.15);
    sh.position.set(Math.cos(a) * 6.8, 1.32, Math.sin(a) * 6.8);
    sh.castShadow = castShadow;
    obeliskGroup.add(sh);
  }

  // Authentic Weathered Concrete Gray-White PUP Obelisk + Mabini Bust Plaque Base + Top Star Relief (obelisk.png!)
  const matObeliskStone = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xd9d6ce,
      map: textures.concreteFacade,
      bumpMap: textures.concreteBump,
      bumpScale: 0.04,
      roughness: 0.76,
    }),
  );
  addBox(obeliskGroup, 2.25, 0.75, 2.25, 0, 2.08, 0, matObeliskStone);
  const obeliskShaft = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.56, 0.94, 15.8, 4)),
    matObeliskStone,
  );
  obeliskShaft.rotation.y = Math.PI / 4;
  obeliskShaft.position.y = 10.3;
  obeliskShaft.castShadow = castShadow;
  obeliskShaft.receiveShadow = true;
  obeliskGroup.add(obeliskShaft);

  // Authentic Gold 5-Point Star Medallion Relief right at the VERY TOP of the Obelisk (matches obelisk.png!)
  for (const ang of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const star = new THREE.Mesh(trackGeo(new THREE.OctahedronGeometry(0.36, 0)), matGold);
    star.scale.set(1, 1, 0.35);
    star.position.set(Math.sin(ang) * 0.44, 17.55, Math.cos(ang) * 0.44);
    star.rotation.y = ang;
    obeliskGroup.add(star);
  }
  // Two Stacked Dark-Bronze Historical Plaques ("Apolinario Mabini" & "The Obelisk") + Golden Bronze Bust (obelisk_2026.jpg!)
  addBox(obeliskGroup, 0.24, 1.05, 0.92, 0.95, 3.55, 0, matDarkMaroonRoof, false);
  addBox(obeliskGroup, 0.24, 0.95, 0.96, 0.95, 2.38, 0, matDarkMaroonRoof, false);
  addBox(obeliskGroup, 0.36, 0.36, 0.94, 0.98, 4.25, 0, matObeliskStone, false);
  const mabiniHead = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.24, 10, 8)), matGold);
  mabiniHead.position.set(1.06, 4.92, 0);
  const mabiniBust = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.22, 0.38, 0.52, 8)), matGold);
  mabiniBust.position.set(1.06, 4.55, 0);
  obeliskGroup.add(mabiniHead, mabiniBust);
  addCollider('obelisk-island', 14, -4, 18.2, 18.2);

  // PUP FOUNTAIN PARK (#12 on vicinity_map.jpg & main_dome.jpg — Blue Tiled Basin between Freedom Park & Interfaith Chapel!)
  const fountainGroup = new THREE.Group();
  fountainGroup.position.set(6.5, 0, 24.5);
  root.add(fountainGroup);
  const fRim = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(4.4, 4.6, 0.48, 24)), matBrightWhite);
  fRim.scale.set(1.25, 1, 0.85);
  fRim.position.y = 0.24;
  const fPool = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(3.95, 3.95, 0.32, 24)), matPoolWater);
  fPool.scale.set(1.25, 1, 0.85);
  fPool.position.y = 0.36;
  const fStem = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.32, 0.55, 1.75, 12)), matBrightWhite);
  fStem.position.y = 0.95;
  const fBowl1 = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(1.55, 0.72, 0.36, 16)), matBrightWhite);
  fBowl1.position.y = 1.35;
  const fBowl2 = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.85, 0.35, 0.28, 14)), matBrightWhite);
  fBowl2.position.y = 1.98;
  fountainGroup.add(fRim, fPool, fStem, fBowl1, fBowl2);
  waterMeshes.push(fPool);
  addCollider('fountain-park', 6.5, 24.5, 10.6, 7.6);

  // Freedom Park Iconic Flagpole on Maroon Truncated-Pyramid Pedestal + Angled White Planters (matches main_bldg.jpg & freedompark.jpg!)
  const flagPlaza = new THREE.Group();
  flagPlaza.position.set(1.5, 0, 11.5);
  root.add(flagPlaza);
  addBox(flagPlaza, 5.2, 0.25, 5.2, 0, 0.12, 0, matCreamWall, false);
  const flagPedestal = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.32, 0.62, 1.15, 4)), matMaroon);
  flagPedestal.rotation.y = Math.PI / 4;
  flagPedestal.position.y = 0.72;
  flagPlaza.add(flagPedestal);
  const phPole = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.055, 0.095, 16.5, 10)), matSilverSteel);
  phPole.position.y = 9.0;
  flagPlaza.add(phPole);

  // Angled white concrete planters flanking the flagpole (exact match to main_bldg.jpg!)
  for (const pz of [-2.4, 2.4]) {
    addBox(flagPlaza, 1.6, 0.78, 2.6, 0, 0.45, pz, matBrightWhite);
    addBox(flagPlaza, 1.2, 0.38, 2.2, 0, 0.95, pz, shrubMat, false);
  }
  addCollider('flagpole-base', 1.5, 11.5, 2.2, 6.8);

  // Philippine Flag animated in Manila breeze
  const [fCanvas] = [document.createElement('canvas')];
  fCanvas.width = 256;
  fCanvas.height = 144;
  const fCtx = fCanvas.getContext('2d')!;
  fCtx.fillStyle = '#0038a8';
  fCtx.fillRect(0, 0, 256, 72);
  fCtx.fillStyle = '#ce1126';
  fCtx.fillRect(0, 72, 256, 72);
  fCtx.fillStyle = '#ffffff';
  fCtx.beginPath();
  fCtx.moveTo(0, 0);
  fCtx.lineTo(106, 72);
  fCtx.lineTo(0, 144);
  fCtx.closePath();
  fCtx.fill();
  fCtx.fillStyle = '#fcd116';
  fCtx.beginPath();
  fCtx.arc(38, 72, 18, 0, Math.PI * 2);
  fCtx.fill();
  const phTex = new THREE.CanvasTexture(fCanvas);
  phTex.colorSpace = THREE.SRGBColorSpace;
  ownedTextures.push(phTex);
  const phFlag = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(3.0, 1.65, 6, 2)),
    trackMat(new THREE.MeshStandardMaterial({ map: phTex, side: THREE.DoubleSide, roughness: 0.68 })),
  );
  phFlag.position.set(1.55, 15.8, 0);
  flagPlaza.add(phFlag);
  animatedFlags.push(phFlag);

  // =========================================================================
  // 5. MUSEO NI APOLINARIO MABINI / MABINI SHRINE (x = 39.5, z = 13.0)
  //    Cleanly positioned south of South Catwalk (z <= 5.3) & north of Track Oval (z >= 21.5)!
  //    Faithfully modeled from mabini.jpg & Jul 2026 NHCP Shrine photos!
  // =========================================================================
  const mabiniGroup = new THREE.Group();
  mabiniGroup.position.set(39.5, 0, 13.0);
  root.add(mabiniGroup);
  addContactShadow(mabiniGroup, 0, 0, 15, 10);

  // Main house volume: Mint-green vertical slatted lower skirt + upper wooden house
  addBox(mabiniGroup, 9.6, 2.2, 7.0, -1.2, 1.1, 0, matMintWood);
  // Concrete corner plinth piers matching mabini.jpg
  for (const px of [-6.0, -1.2, 3.6]) {
    for (const pz of [-3.5, 3.5]) {
      addBox(mabiniGroup, 0.52, 0.85, 0.52, px, 0.42, pz, matRawConcrete, false);
    }
  }
  // Upper recessed dark shuttered window band + mint-green balustrade gallery
  addBox(mabiniGroup, 9.8, 1.85, 7.2, -1.2, 3.12, 0, matDarkShadow);
  // Mint-green corner posts & balustrade rails along upper perimeter
  for (const bx of [-6.0, -3.6, -1.2, 1.2, 3.6]) {
    addBox(mabiniGroup, 0.34, 1.9, 0.34, bx, 3.12, -3.6, matMintWood, false);
    addBox(mabiniGroup, 0.34, 1.9, 0.34, bx, 3.12, 3.6, matMintWood, false);
  }
  addBox(mabiniGroup, 9.9, 0.82, 0.24, -1.2, 2.62, -3.62, matMintWood, false);
  addBox(mabiniGroup, 9.9, 0.82, 0.24, -1.2, 2.62, 3.62, matMintWood, false);
  addBox(mabiniGroup, 0.24, 0.82, 7.25, -6.05, 2.62, 0, matMintWood, false);
  addBox(mabiniGroup, 0.24, 0.82, 7.25, 3.65, 2.62, 0, matMintWood, false);

  // Corrugated red-orange metal eave apron around roof base (matches mabini.jpg!)
  addBox(mabiniGroup, 11.2, 0.16, 8.6, -1.2, 4.08, 0, matRedOrangeTrim);

  // Iconic Steep Cogon/Nipa Thatched Hip Roof + Bright Red-Orange Metal Ridge Cap!
  const mainThatch = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(8.0, 5.2, 4)), matThatch);
  mainThatch.rotation.y = Math.PI / 4;
  mainThatch.scale.set(1.06, 1.0, 0.8);
  mainThatch.position.set(-1.2, 6.65, 0);
  mainThatch.castShadow = castShadow;
  mabiniGroup.add(mainThatch);
  // Truncated red-orange ridge box crowning the steep cogon roof (exact signature from mabini.jpg!)
  addBox(mabiniGroup, 3.2, 0.65, 0.72, -1.2, 9.12, 0, matRedOrangeTrim);

  // Attached secondary mint-green entry annex & smaller thatched roof on East wing
  addBox(mabiniGroup, 4.8, 3.4, 4.8, 5.4, 1.7, 0.4, matMintWood);
  addBox(mabiniGroup, 5.4, 0.15, 5.4, 5.4, 3.48, 0.4, matRedOrangeTrim);
  const annexThatch = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(4.1, 2.5, 4)), matThatch);
  annexThatch.rotation.y = Math.PI / 4;
  annexThatch.position.set(5.4, 4.7, 0.4);
  annexThatch.castShadow = castShadow;
  mabiniGroup.add(annexThatch);
  addBox(mabiniGroup, 2.0, 0.45, 0.55, 5.4, 5.88, 0.4, matRedOrangeTrim);

  // Covered front entry porch & wooden steps facing north toward University Avenue
  addBox(mabiniGroup, 2.6, 0.14, 1.8, -1.2, 2.8, -4.4, matRedOrangeTrim, false);
  for (let s = 0; s < 4; s++) {
    addBox(mabiniGroup, 2.2, 0.25, 0.36, -1.2, 0.15 + s * 0.24, -3.7 - (3 - s) * 0.3, matWood, false);
  }

  // Low white-pillared perimeter garden fence (cleanly inside Z = [6.5..16.5])
  for (let fx = -7.0; fx <= 8.2; fx += 3.8) {
    addBox(mabiniGroup, 0.32, 1.05, 0.32, fx, 0.52, -4.9, matBrightWhite, false);
    addBox(mabiniGroup, 0.32, 1.05, 0.32, fx, 0.52, 4.9, matBrightWhite, false);
  }
  addBox(mabiniGroup, 15.6, 0.24, 0.18, 0.6, 0.78, 4.9, matBrightWhite, false);
  addSignMesh(
    mabiniGroup,
    5.2,
    1.05,
    0.4,
    1.7,
    -5.05,
    Math.PI,
    'MUSEO NI APOLINARIO MABINI',
    'NHCP HISTORICAL SHRINE · PUP STA. MESA',
    { bg: '#214d43', border: '#e5a91a' },
  );
  addCollider('mabini-shrine', 40.2, 13.0, 15.6, 10.0);

  // =========================================================================
  // 6. PUP MAIN ACADEMIC BUILDING — AUTHENTIC STAR/Y-WING STRUCTURE (x = -28, z = 24)
  //    Modeled directly from pup_map.png, main_bldg.jpg, northwing.jpg & dome.png!
  // =========================================================================
  const mainBldg = new THREE.Group();
  root.add(mainBldg);

  /**
   * Builds an authentic 6-storey PUP Sta. Mesa academic wing with:
   * - Recessed dark-shadowed open-air corridors on every floor
   * - Crisp cream-white cantilevered balcony parapets with signature MAROON underside stripe
   * - Thin top pipe railing & rhythmic vertical piers
   * - Iconic overhanging dark brown/maroon cantilevered roof fascia (main_bldg.jpg)
   * - Optional exterior zig-zag cantilevered staircase facade at the wing end!
   */
  // Authentic PUP Main Building Pitched Roof Materials (from real drone aerial main_dome.jpg!)
  const matMainSalmonRoof = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xc25b44, roughness: 0.68, metalness: 0.14 }),
  );
  const matSouthTealRoof = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x2c8a85, roughness: 0.65, metalness: 0.16 }),
  );

  function buildPupWing(
    parent: THREE.Object3D,
    length: number,
    width: number,
    includeGroundWalls: boolean,
    addZigZagStairEnd: boolean,
    roofStyle: 'salmon-atrium' | 'teal-south' = 'salmon-atrium',
  ) {
    const wing = new THREE.Group();
    const floorH = 3.4;
    const startFloor = includeGroundWalls ? 0 : 1;

    // Ground floor colonnade / base piers if solid exterior wing
    if (includeGroundWalls) {
      addBox(wing, width - 1.4, floorH, length - 0.8, 0, floorH / 2, length / 2, matDarkShadow);
      for (let z = 3; z <= length - 2; z += 5.2) {
        addBox(wing, 0.55, floorH, 0.55, -width / 2 + 0.3, floorH / 2, z, matCreamWall, false);
        addBox(wing, 0.55, floorH, 0.55, width / 2 - 0.3, floorH / 2, z, matCreamWall, false);
      }
    }

    // 6-storey stacked cream cantilevered balconies + dark shadowed open corridors + maroon underside stripes
    for (let f = startFloor; f < 6; f++) {
      const fy = f * floorH + (f === 0 ? 0.1 : 0);
      // Recessed classroom core wall behind shadowed open corridor
      addBox(wing, width - 2.6, floorH - 0.35, length - 1.0, 0, fy + floorH / 2, length / 2, matDarkShadow, false);
      // Recessed louver/glass classroom window bands inside corridor shadow
      addBox(wing, width - 2.4, 1.35, length - 1.6, 0, fy + 2.05, length / 2, matGlass, false);

      // Cantilevered white concrete floor slab
      addBox(wing, width + 0.5, 0.28, length + 0.5, 0, fy + 0.14, length / 2, matCreamWall);
      // Signature PUP MAROON underside drip stripe running along every balcony slab (main_academic.jpg!)
      addBox(wing, width + 0.64, 0.2, length + 0.64, 0, fy + 0.04, length / 2, matMaroon, false);

      // Cream solid parapet band along corridor edges
      addBox(wing, 0.22, 0.95, length + 0.35, -width / 2 - 0.12, fy + 0.72, length / 2, matCreamWall, false);
      addBox(wing, 0.22, 0.95, length + 0.35, width / 2 + 0.12, fy + 0.72, length / 2, matCreamWall, false);
      addBox(wing, width + 0.35, 0.95, 0.22, 0, fy + 0.72, length + 0.12, matCreamWall, false);

      // Rounded end-corner balcony cylinders matching main_academic.jpg curved cantilevered balconies!
      for (const side of [-1, 1]) {
        const cornerCap = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.52, 0.52, 0.96, 10)), matCreamWall);
        cornerCap.position.set(side * (width / 2 + 0.05), fy + 0.72, length + 0.1);
        wing.add(cornerCap);
      }

      // Crisp dark steel top pipe rail above parapet
      addBox(wing, 0.08, 0.08, length + 0.38, -width / 2 - 0.12, fy + 1.36, length / 2, matDarkSteel, false);
      addBox(wing, 0.08, 0.08, length + 0.38, width / 2 + 0.12, fy + 1.36, length / 2, matDarkSteel, false);
      addBox(wing, width + 0.38, 0.08, 0.08, 0, fy + 1.36, length + 0.12, matDarkSteel, false);
    }

    // Rhythmic full-height cream vertical concrete columns framing bays
    for (let z = 3.2; z <= length - 1.5; z += 5.4) {
      addBox(wing, 0.45, 5 * floorH, 0.55, -width / 2 - 0.05, floorH + 2.5 * floorH, z, matCreamWall, false);
      addBox(wing, 0.45, 5 * floorH, 0.55, width / 2 + 0.05, floorH + 2.5 * floorH, z, matCreamWall, false);
    }

    // Iconic Overhanging Dark Brown/Maroon Roof Fascia + Pitched Salmon-Terracotta / Teal Roof with Central Atrium Lightwell (main_dome.jpg!)
    const roofY = 6 * floorH;
    addBox(wing, width + 2.2, 0.24, length + 2.2, 0, roofY + 0.12, length / 2, matBrightWhite);
    addBox(wing, width + 2.4, 1.25, length + 2.4, 0, roofY + 0.85, length / 2, matDarkMaroonRoof);
    const pitchedMat = roofStyle === 'teal-south' ? matSouthTealRoof : matMainSalmonRoof;
    // Two sloped roof decks flanking the iconic open central lightwell slot down the spine of every PUP wing (main_dome.jpg!)
    const halfSpan = (width + 1.4) * 0.39;
    for (const side of [-1, 1]) {
      const slope = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(halfSpan, 0.28, length + 1.4)), pitchedMat);
      slope.position.set(side * (width * 0.27), roofY + 2.05, length / 2);
      slope.rotation.z = -side * 0.28;
      slope.castShadow = castShadow;
      wing.add(slope);
    }
    // End hip cap closing the pitched roof over the stair tower + recessed dark atrium spine slot
    addBox(wing, width * 0.36, 0.22, length - 4.0, 0, roofY + 1.45, length / 2, matDarkShadow, false);
    const endHip = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(width * 0.62, 1.9, 4)), pitchedMat);
    endHip.rotation.y = Math.PI / 4;
    endHip.scale.set(1.15, 1, 0.55);
    endHip.position.set(0, roofY + 2.25, length - 0.8);
    wing.add(endHip);

    // Signature Exterior Zig-Zag Cantilevered Staircase Facade on the wing end (exact match to main_academic.jpg!)
    if (addZigZagStairEnd) {
      for (let f = 0; f < 5; f++) {
        const sy = f * floorH + 1.7;
        const stairRamp = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(5.6, 1.1, 1.8)), matCreamWall);
        stairRamp.position.set(1.6, sy + 0.85, length + 0.95);
        stairRamp.rotation.z = -0.36;
        stairRamp.castShadow = castShadow;
        wing.add(stairRamp);

        const stairStripe = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(5.7, 0.18, 1.9)), matMaroon);
        stairStripe.position.set(1.6, sy + 0.32, length + 0.95);
        stairStripe.rotation.z = -0.36;
        wing.add(stairStripe);
      }
      // Bold Left Vertical Cream Elevator/Stair Core Pier + Right Pier (exact silhouette of main_academic.jpg!)
      addBox(wing, 1.9, 6 * floorH, 1.5, -3.5, 3 * floorH, length + 0.65, matCreamWall);
      addBox(wing, 1.15, 6 * floorH, 1.3, 4.4, 3 * floorH, length + 0.6, matCreamWall);
    }

    parent.add(wing);
    return wing;
  }

  // --- Central Dome Rotunda (x = -28, z = 24) — Authentic Flat-Crowned 6-Storey Octagonal Core ---
  const domeCenter = { x: -28, z: 24 };
  addContactShadow(mainBldg, domeCenter.x, domeCenter.z, 30, 30);

  // Walkable terrazzo ground floor spanning Dome Rotunda + East Wing Room E-104
  const domeFloor = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(11.4, 11.4, 0.1, 24)), matInteriorFloor);
  domeFloor.position.set(domeCenter.x, 0.06, domeCenter.z);
  domeFloor.receiveShadow = true;
  mainBldg.add(domeFloor);

  const eastFloor = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(11.8, 28)), matInteriorFloor);
  eastFloor.rotation.x = -Math.PI / 2;
  eastFloor.position.set(domeCenter.x, 0.065, 37);
  eastFloor.receiveShadow = true;
  mainBldg.add(eastFloor);

  // Inlaid PUP Seal Medallion on Rotunda floor
  const sealDisc = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(3.2, 3.2, 0.03, 24)), matMaroon);
  sealDisc.position.set(domeCenter.x, 0.115, domeCenter.z);
  mainBldg.add(sealDisc);
  const sealRing = new THREE.Mesh(trackGeo(new THREE.RingGeometry(2.4, 2.85, 24)), matGold);
  sealRing.rotation.x = -Math.PI / 2;
  sealRing.position.set(domeCenter.x, 0.135, domeCenter.z);
  mainBldg.add(sealRing);

  // Authentic PUP Rotunda Ground-Floor Columns (Maroon lower half + Cream upper half — matches dome.png!)
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2 + Math.PI / 8;
    const px = domeCenter.x + Math.cos(ang) * 9.5;
    const pz = domeCenter.z + Math.sin(ang) * 9.5;
    const colLow = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.46, 0.48, 1.8, 14)), matMaroon);
    colLow.position.set(px, 0.9, pz);
    const colHigh = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.45, 0.46, 2.2, 14)), matCreamWall);
    colHigh.position.set(px, 2.9, pz);
    mainBldg.add(colLow, colHigh);
  }
  // Row of silver steel gang-chairs inside the Dome Rotunda (exact detail from dome.png!)
  addBox(mainBldg, 5.2, 0.95, 0.22, domeCenter.x - 5.8, 0.48, domeCenter.z + 2.2, matMaroon, false);
  for (let s = 0; s < 6; s++) {
    addBox(mainBldg, 0.56, 0.52, 0.08, domeCenter.x - 7.8 + s * 0.8, 0.78, domeCenter.z + 1.9, matSilverSteel, false);
    addBox(mainBldg, 0.56, 0.08, 0.46, domeCenter.x - 7.8 + s * 0.8, 0.48, domeCenter.z + 1.68, matSilverSteel, false);
  }

  // Ma'am Clara's Reception Desk inside Central Rotunda
  addBox(mainBldg, 4.4, 1.08, 1.15, domeCenter.x, 0.54, domeCenter.z + 5.2, matMaroon);
  addBox(mainBldg, 4.6, 0.14, 1.35, domeCenter.x, 1.14, domeCenter.z + 5.2, matWood);
  addCollider('main-reception-desk', domeCenter.x, domeCenter.z + 5.2, 4.6, 1.45);

  // Upper 5 Storeys of the Authentic Broad Octagonal/Cylindrical PUP Dome Core (y = 3.8..21.5m)
  for (let f = 1; f < 6; f++) {
    const fy = f * 3.4;
    const coreCyl = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(10.6, 10.6, 3.2, 16)), matDarkShadow);
    coreCyl.position.set(domeCenter.x, fy + 1.6, domeCenter.z);
    const slabRing = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(11.9, 11.9, 0.34, 16)), matCreamWall);
    slabRing.position.set(domeCenter.x, fy + 0.15, domeCenter.z);
    slabRing.castShadow = castShadow;
    const maroonRing = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(12.0, 12.0, 0.2, 16)), matMaroon);
    maroonRing.position.set(domeCenter.x, fy + 0.03, domeCenter.z);
    const parapetRing = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(11.75, 11.75, 0.92, 16, 1, true)), matCreamWall);
    parapetRing.position.set(domeCenter.x, fy + 0.72, domeCenter.z);
    mainBldg.add(coreCyl, slabRing, maroonRing, parapetRing);
  }
  // Authentic PUP Hexagonal Pitched Terracotta-Salmon Central Dome Roof (exact match to drone aerial main_dome.jpg!)
  const domeRoofFascia = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(13.2, 12.8, 1.35, 6)), matDarkMaroonRoof);
  domeRoofFascia.position.set(domeCenter.x, 21.2, domeCenter.z);
  domeRoofFascia.castShadow = castShadow;
  const domeHippedRoof = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(13.1, 4.2, 6)), matMainSalmonRoof);
  domeHippedRoof.position.set(domeCenter.x, 23.95, domeCenter.z);
  domeHippedRoof.castShadow = castShadow;
  mainBldg.add(domeRoofFascia, domeHippedRoof);

  // Warm interior lobby light inside the Dome Rotunda
  const lobbyLight = new THREE.PointLight(0xffe6bf, 1.6, 30, 1.6);
  lobbyLight.position.set(domeCenter.x, 3.2, domeCenter.z + 4);
  mainBldg.add(lobbyLight);

  // --- WING 1: EAST WING (extending straight South +Z from Dome, z = 24..51, ENTERABLE!) ---
  const eastWing = buildPupWing(mainBldg, 26, 11.8, false, true);
  eastWing.position.set(domeCenter.x, 0, domeCenter.z);
  // Enterable Ground-Floor walls of East Wing (doorway on East wall facing Interfaith Chapel at z = 34!)
  addBox(mainBldg, 0.6, 3.6, 26.5, domeCenter.x - 5.8, 1.8, 37.2, matCreamWall);
  addCollider('east-wing-west-wall', domeCenter.x - 5.8, 37.2, 0.9, 26.8);
  addBox(mainBldg, 12.2, 3.6, 0.6, domeCenter.x, 1.8, 50.4, matCreamWall);
  addCollider('east-wing-end-wall', domeCenter.x, 50.4, 12.4, 0.9);
  // East-facing wall with 4.2m wide doorway gap at z in [31.9, 36.1]
  addBox(mainBldg, 0.6, 3.6, 7.2, domeCenter.x + 5.8, 1.8, 28.2, matCreamWall);
  addCollider('east-wing-e1', domeCenter.x + 5.8, 28.2, 0.9, 7.4);
  addBox(mainBldg, 0.6, 3.6, 14.2, domeCenter.x + 5.8, 1.8, 43.3, matCreamWall);
  addCollider('east-wing-e2', domeCenter.x + 5.8, 43.3, 0.9, 14.4);
  // Entrance portico canopy & signage facing East toward Interfaith Chapel & Freedom Park
  addBox(mainBldg, 3.2, 0.35, 6.8, domeCenter.x + 7.4, 3.45, 34, matDarkMaroonRoof);
  addSignMesh(
    mainBldg,
    9.2,
    1.35,
    domeCenter.x + 6.3,
    4.6,
    34,
    Math.PI / 2,
    'PUP MAIN ACADEMIC BUILDING',
    'CENTRAL DOME ROTUNDA · EAST WING ENTRANCE',
  );
  createInteractiveDoubleDoor('door-main-east', 'Main Building East Wing Doors', domeCenter.x + 5.8, 34, Math.PI / 2, true);

  // Interior Classroom Room E-104 furnishings inside South end of East Wing
  addBox(mainBldg, 5.2, 1.5, 0.14, domeCenter.x, 1.9, 49.9, trackMat(new THREE.MeshStandardMaterial({ color: 0x1c4532, roughness: 0.85 })), false);
  addBox(mainBldg, 1.4, 1.1, 0.8, domeCenter.x, 0.55, 46.6, matWood);
  addCollider('e104-lectern', domeCenter.x, 46.6, 1.5, 0.95);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const dx = domeCenter.x - 3.2 + col * 3.2;
      const dz = 38.5 + row * 2.2;
      addBox(mainBldg, 1.1, 0.08, 0.62, dx, 0.74, dz, matWood, false);
      addBox(mainBldg, 0.95, 0.72, 0.48, dx, 0.36, dz, matDarkSteel, false);
    }
  }
  addSignMesh(mainBldg, 2.4, 0.55, domeCenter.x + 2.4, 3.0, 37.0, Math.PI, 'ROOM E-104', 'EAST WING LECTURE HALL');

  // Seal NE edge of Dome ground floor toward active North Wing construction site
  addBox(mainBldg, 10.6, 3.6, 0.6, domeCenter.x + 5.2, 1.8, domeCenter.z - 8.2, matCreamWall);
  addCollider('rotunda-north-seal', domeCenter.x + 5.2, domeCenter.z - 8.2, 10.8, 1.2);
  addSignMesh(
    mainBldg,
    4.6,
    1.0,
    domeCenter.x + 5.2,
    2.1,
    domeCenter.z - 7.8,
    0,
    'NORTH WING CLOSED',
    '9-STOREY DPWH RECONSTRUCTION IN PROGRESS',
    { bg: '#7c2d12', border: '#f59e0b' },
  );

  // --- WING 2: WEST WING (radiating cleanly NW at -0.78*PI from Dome — zero overlap with South Wing or Lagoon!) ---
  const westWing = buildPupWing(mainBldg, 22, 10.8, true, true);
  westWing.position.set(domeCenter.x, 0, domeCenter.z);
  westWing.rotation.y = -Math.PI * 0.78;
  addCollider('west-wing-col-1', -38, 13, 10, 10);
  addCollider('west-wing-col-2', -44, 6, 10, 10);

  // --- WING 3: SOUTH WING (radiating cleanly WSW at -0.48*PI with iconic TEAL-GREEN roof courtyard from main_dome.jpg!) ---
  const southWing = buildPupWing(mainBldg, 20, 10.2, true, false, 'teal-south');
  southWing.position.set(domeCenter.x, 0, domeCenter.z);
  southWing.rotation.y = -Math.PI * 0.48;
  // Parallel rear teal-roofed South courtyard block (clean 9m courtyard gap from East Wing!)
  const southCross = buildPupWing(mainBldg, 18, 7.2, true, false, 'teal-south');
  southCross.position.set(domeCenter.x - 19, 0, domeCenter.z + 2.5);
  southCross.rotation.y = 0;
  addCollider('south-wing-col-1', -41, 25, 11, 11);
  addCollider('south-wing-col-2', -47, 36, 9, 17);

  // =========================================================================
  // 7. NEW 9-STOREY NORTH WING — ACTIVE DPWH CONSTRUCTION SITE (x = -10, z = 13)
  //    Aligned along the REAL NE North Wing axis radiating from the Dome toward Freedom Park!
  // =========================================================================
  const constrGroup = new THREE.Group();
  constrGroup.position.set(-12.5, 0, 11.5);
  constrGroup.rotation.y = Math.PI * 0.34; // Angled NE directly matching real North Wing on pup_map.png!
  root.add(constrGroup);

  const sitePad = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(13.8, 18.4)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0x7b756b, roughness: 0.96 })),
  );
  sitePad.rotation.x = -Math.PI / 2;
  sitePad.position.y = 0.042;
  constrGroup.add(sitePad);

  // Corrugated blue/yellow GI construction hoarding perimeter
  addBox(constrGroup, 13.8, 2.4, 0.25, 0, 1.2, 9.2, matHoarding);
  addBox(constrGroup, 0.25, 2.4, 18.4, -6.9, 1.2, 0, matHoarding);
  addBox(constrGroup, 0.25, 2.4, 18.4, 6.9, 1.2, 0, matHoarding);
  addCollider('north-wing-site-1', -14.5, 12.5, 13.5, 12.5);
  addCollider('north-wing-site-2', -8.5, 8.8, 10.5, 10.0);

  // Unfinished 5-level reinforced concrete skeleton (columns, poured slabs, rusty rebar starter bars)
  const colXs = [-4.4, -1.5, 1.5, 4.4];
  const colZs = [-6.8, -2.3, 2.3, 6.8];
  const slabLevels = [3.8, 7.2, 10.6, 14.0, 17.4];

  for (const cx of colXs) {
    for (const cz of colZs) {
      addBox(constrGroup, 0.62, 18.8, 0.62, cx, 9.4, cz, matRawConcrete);
      for (const rx of [-0.16, 0.16]) {
        addBox(constrGroup, 0.06, 1.9, 0.06, cx + rx, 19.8, cz, matDarkSteel, false);
      }
    }
  }
  for (let lv = 0; lv < slabLevels.length; lv++) {
    const sy = slabLevels[lv];
    const slabLenZ = lv < 3 ? 16.4 : lv === 3 ? 12.0 : 6.6;
    const slabOffZ = lv < 3 ? 0 : -2.2;
    addBox(constrGroup, 10.8, 0.34, slabLenZ, 0, sy, slabOffZ, matRawConcrete);
    if (lv >= 3) {
      addBox(constrGroup, 11.2, 0.4, 0.18, 0, sy + 0.15, slabOffZ + slabLenZ / 2, matWood, false);
    }
  }

  // Steel Scaffolding & Translucent Green Construction Safety Netting
  const netSide = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(16.2, 14.2)), matSafetyNet);
  netSide.position.set(5.6, 9.2, 0);
  netSide.rotation.y = Math.PI / 2;
  constrGroup.add(netSide);
  const netEnd = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(10.8, 11.2)), matSafetyNet);
  netEnd.position.set(0, 7.8, 8.2);
  constrGroup.add(netEnd);

  for (let scZ = -7.6; scZ <= 7.6; scZ += 3.8) {
    addBox(constrGroup, 0.08, 16.0, 0.08, 5.7, 8.0, scZ, matDarkSteel, false);
  }
  for (let scY = 3.4; scY <= 15.0; scY += 2.9) {
    addBox(constrGroup, 0.08, 0.08, 16.4, 5.7, scY, 0, matDarkSteel, false);
  }

  // Towering Yellow Slewing Crane beside North Wing construction
  const craneBase = new THREE.Group();
  craneBase.position.set(-6.0, 0, 8.8);
  addBox(craneBase, 2.2, 1.2, 2.2, 0, 0.6, 0, matRawConcrete);
  for (const mx of [-0.55, 0.55]) {
    for (const mz of [-0.55, 0.55]) {
      addBox(craneBase, 0.16, 28, 0.16, mx, 14.6, mz, matCraneYellow, false);
    }
  }
  for (let my = 3; my <= 27; my += 3) {
    addBox(craneBase, 1.25, 0.12, 1.25, 0, my, 0, matCraneYellow, false);
  }
  const craneJib = new THREE.Group();
  craneJib.position.set(0, 28.6, 0);
  addBox(craneJib, 1.5, 1.8, 1.6, 0.9, -0.4, 0, matBrightWhite, false);
  addBox(craneJib, 24, 0.9, 0.9, -7.5, 0.6, 0, matCraneYellow, false);
  addBox(craneJib, 7, 1.1, 1.4, 5.5, 0.6, 0, matRawConcrete, false);
  addBox(craneJib, 0.35, 4.2, 0.35, 0, 2.8, 0, matCraneYellow, false);
  addBox(craneJib, 0.08, 9.5, 0.08, -14, -4.5, 0, matDarkSteel, false);
  addBox(craneJib, 0.55, 0.65, 0.35, -14, -9.4, 0, matCraneYellow, false);
  craneBase.add(craneJib);
  constrGroup.add(craneBase);

  // Official DPWH / PUP Project Billboard facing Freedom Park (x = 1.2, z = 9.8)
  const billboardGroup = new THREE.Group();
  billboardGroup.position.set(1.2, 0, 9.8);
  billboardGroup.rotation.y = Math.PI * 0.28;
  addBox(billboardGroup, 5.4, 3.2, 0.25, 0, 1.6, 0, matDarkSteel);
  addSignMesh(
    billboardGroup,
    5.2,
    2.5,
    0,
    1.85,
    0.16,
    0,
    'NEW 9-STOREY PUP NORTH WING',
    'DPWH REDEVELOPMENT · UNDER CONSTRUCTION (TARGET 2027)',
    { bg: '#1e3a5f', border: '#f59e0b', badge: 'PROJECT SITE — AUTHORIZED PERSONNEL ONLY' },
  );
  root.add(billboardGroup);

  // =========================================================================
  // 8. PUP INTERFAITH CHAPEL (x = -2, z = 42) — ENTERABLE OCTAGONAL PYRAMID!
  //    Faithfully modeled from chapel.jpg inside its circular garden island!
  // =========================================================================
  const chapelGroup = new THREE.Group();
  chapelGroup.position.set(-2, 0, 42);
  root.add(chapelGroup);

  // Circular tree-ringed garden island around the Chapel (matches pup_map.png!)
  const chapelLawn = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(16.2, 16.4, 0.14, 32)), matGrass);
  chapelLawn.position.y = 0.07;
  chapelLawn.receiveShadow = true;
  chapelGroup.add(chapelLawn);
  const chapelCurb = new THREE.Mesh(trackGeo(new THREE.RingGeometry(15.6, 16.3, 32)), matBrightWhite);
  chapelCurb.rotation.x = -Math.PI / 2;
  chapelCurb.position.y = 0.145;
  chapelGroup.add(chapelCurb);

  // Raised octagonal concrete podium & interior sanctuary floor
  const chapelFloor = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(10.8, 11.4, 0.65, 8)), matInteriorFloor);
  chapelFloor.position.y = 0.33;
  chapelFloor.receiveShadow = true;
  chapelGroup.add(chapelFloor);

  // 8 Steeply Sloped White Concrete Buttress Ribs rising to the Open Spire Apex (exact signature of chapel.jpg!)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const rib = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.92, 14.8, 1.05)), matBrightWhite);
    rib.position.set(Math.cos(a) * 6.5, 5.6, Math.sin(a) * 6.5);
    // Tilt rib inward toward apex (0, 12.2, 0)
    const dir = new THREE.Vector3(-Math.cos(a), 0, -Math.sin(a)).normalize();
    const target = new THREE.Vector3(0, 12.2, 0);
    const base = new THREE.Vector3(Math.cos(a) * 11.8, 0.2, Math.sin(a) * 11.8);
    const mid = base.clone().add(target).multiplyScalar(0.5);
    rib.position.copy(mid);
    rib.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), target.clone().sub(base).normalize());
    rib.castShadow = castShadow;
    rib.receiveShadow = true;
    chapelGroup.add(rib);

    // Lower angled white concrete wall segments + louvered ribbon windows + bougainvillea planters on 7 sides (leave North -Z side open for doorway!)
    const segYaw = (i / 8) * Math.PI * 2;
    const isEntranceSide = i === 0; // Local (0, y, -9.8) with rotation.y = 0 faces North (-Z) toward Freedom Park!
    const segGroup = new THREE.Group();
    segGroup.rotation.y = segYaw;
    if (!isEntranceSide) {
      addBox(segGroup, 7.6, 1.45, 0.45, 0, 1.35, -9.8, matBrightWhite);
      addBox(segGroup, 7.2, 1.15, 0.22, 0, 2.65, -9.7, matGlass, false);
      addBox(segGroup, 7.8, 0.16, 0.9, 0, 3.3, -10.0, matBrightWhite, false); // Window sunshade louver
      // Bougainvillea crimson-flowered planter boxes (matches chapel.jpg!)
      addBox(segGroup, 6.2, 0.55, 0.75, 0, 1.85, -10.25, shrubMat, false);
      const bloomMat = trackMat(new THREE.MeshStandardMaterial({ color: 0xc92a58, roughness: 0.85 }));
      addBox(segGroup, 5.6, 0.24, 0.52, 0, 2.18, -10.25, bloomMat, false);

      // Wall collider matching actual rotated local (0, 0, -9.8) world offset
      const cx = -2 - Math.sin(segYaw) * 9.8;
      const cz = 42 - Math.cos(segYaw) * 9.8;
      addCollider(`chapel-wall-${i}`, cx, cz, 3.6, 3.6);
    } else {
      // North Entrance Portal Header + Wide Concrete Steps + Silver Handrails (matches chapel.jpg!)
      addBox(segGroup, 8.2, 1.45, 0.8, 0, 4.1, -9.8, matBrightWhite);
      addBox(segGroup, 2.0, 3.5, 0.7, -3.2, 1.75, -9.8, matBrightWhite);
      addBox(segGroup, 2.0, 3.5, 0.7, 3.2, 1.75, -9.8, matBrightWhite);
      for (let st = 0; st < 4; st++) {
        addBox(segGroup, 5.6, 0.16, 0.45, 0, 0.08 + st * 0.15, -10.2 - (3 - st) * 0.42, matRawConcrete, false);
      }
      addBox(segGroup, 0.08, 0.9, 1.8, -2.7, 0.85, -10.9, matSilverSteel, false);
      addBox(segGroup, 0.08, 0.9, 1.8, 2.7, 0.85, -10.9, matSilverSteel, false);
    }
    chapelGroup.add(segGroup);
  }

  // Steeply Pitched Octagonal Terracotta Spanish Clay Tile Roof (matches chapel.jpg!)
  const chapelRoof = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(10.8, 8.2, 8)), matChapelRoof);
  chapelRoof.position.y = 7.6;
  chapelRoof.rotation.y = Math.PI / 8;
  chapelRoof.castShadow = castShadow;
  chapelGroup.add(chapelRoof);

  // Open White Concrete Lantern Spire & Finial atop apex (matches chapel.jpg!)
  for (let s = 0; s < 4; s++) {
    const a = (s / 4) * Math.PI * 2;
    const strut = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.28, 3.2, 0.28)), matBrightWhite);
    strut.position.set(Math.cos(a) * 0.85, 12.6, Math.sin(a) * 0.85);
    strut.rotation.z = Math.cos(a) * 0.26;
    strut.rotation.x = -Math.sin(a) * 0.26;
    chapelGroup.add(strut);
  }
  const spireTip = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.05, 0.12, 2.6, 8)), matBrightWhite);
  spireTip.position.y = 14.8;
  chapelGroup.add(spireTip);

  // Enterable Chapel Doors (facing North at (-2, 32.2)) & Interior Pews + Ecumenical Altar
  createInteractiveDoubleDoor('door-chapel', 'Interfaith Chapel Sanctuary Doors', -2, 32.2, 0, true);
  addBox(chapelGroup, 3.0, 1.05, 1.2, 0, 1.15, 3.8, matWood);
  addBox(chapelGroup, 0.2, 2.4, 0.2, 0, 2.6, 4.4, matGold, false);
  addBox(chapelGroup, 1.4, 0.2, 0.2, 0, 3.1, 4.4, matGold, false);
  for (const rowZ of [-3.5, -1.5, 0.5]) {
    for (const sideX of [-3.0, 3.0]) {
      addBox(chapelGroup, 3.2, 0.45, 0.55, sideX, 0.88, rowZ, matWood, false);
      addBox(chapelGroup, 3.2, 0.45, 0.12, sideX, 1.22, rowZ - 0.22, matWood, false);
    }
  }
  addSignMesh(chapelGroup, 5.2, 0.92, 0, 4.1, -10.25, Math.PI, 'PUP INTERFAITH CHAPEL', 'ECUMENICAL SANCTUARY', {
    bg: '#4b2d22',
    border: '#e5a91a',
  });

  // =========================================================================
  // 9. PUP LAGOON PARK, INTRAMUROS BASTION WALL, BRICK PLAZA & AMPHITHEATER (x = -16, z = -16)
  //    Modeled from lagoon.jpg, freedompark.jpg (left bastion wall!) & pup_map.png!
  // =========================================================================
  const lagoonGroup = new THREE.Group();
  root.add(lagoonGroup);

  // Redeveloped Lagoon Terracotta Brick Plaza with White Concrete Inlay Rings (matches lagoon.jpg!)
  addPaving(-16, -15, 28, 28, matLagoonBrick, 0.036);
  const plazaRing1 = new THREE.Mesh(trackGeo(new THREE.RingGeometry(4.2, 4.75, 28)), matBrightWhite);
  plazaRing1.rotation.x = -Math.PI / 2;
  plazaRing1.position.set(-8.5, 0.045, -11.5);
  const plazaRing2 = new THREE.Mesh(trackGeo(new THREE.RingGeometry(7.2, 7.65, 32)), matBrightWhite);
  plazaRing2.rotation.x = -Math.PI / 2;
  plazaRing2.position.set(-8.5, 0.045, -11.5);
  lagoonGroup.add(plazaRing1, plazaRing2);

  // Iconic Hexagonal Raised Planter + Bold Red-Orange "PUP Lagoon" Sign (exact match to lagoon.jpg!)
  const signPlanter = new THREE.Group();
  signPlanter.position.set(-8.5, 0, -11.5);
  const hexBase = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(2.4, 2.5, 0.72, 6)), matLagoonBrick);
  hexBase.position.y = 0.36;
  const hexBench = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(2.7, 2.65, 0.14, 6)), matBrightWhite);
  hexBench.position.y = 0.76;
  const hexRim = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(2.2, 2.2, 0.25, 6)), matRedOrangeTrim);
  hexRim.position.y = 0.92;
  const hexFoliage = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(2.0, 2.1, 0.42, 6)), shrubMat);
  hexFoliage.position.y = 1.12;
  signPlanter.add(hexBase, hexBench, hexRim, hexFoliage);
  addSignMesh(
    signPlanter,
    3.6,
    1.2,
    0,
    1.85,
    0.05,
    Math.PI * 0.22,
    'PUP',
    'Lagoon',
    { bg: '#c84228', border: '#f5f2eb', titleColor: '#ffffff', subtitleColor: '#fde8cc', width: 512, height: 192 },
  );
  addSignMesh(
    signPlanter,
    3.6,
    1.2,
    0,
    1.85,
    -0.05,
    Math.PI * 1.22,
    'PUP',
    'Lagoon',
    { bg: '#c84228', border: '#f5f2eb', titleColor: '#ffffff', subtitleColor: '#fde8cc', width: 512, height: 192 },
  );
  lagoonGroup.add(signPlanter);
  addCollider('lagoon-sign-planter', -8.5, -11.5, 5.2, 5.2);

  // Intramuros-Style Gray Stone Bastion Wall & Corner Watchtower Garita along East Edge (matches freedompark.jpg!)
  const addStoneWall = (x: number, z: number, w: number, d: number, id: string) => {
    addBox(lagoonGroup, w, 3.0, d, x, 1.5, z, matIntramuros);
    addBox(lagoonGroup, w + 0.25, 0.28, d + 0.25, x, 3.08, z, matBrightWhite, false);
    addCollider(id, x, z, w + 0.3, d + 0.3);
  };
  addStoneWall(-1.5, -24.5, 0.9, 13, 'lagoon-wall-e1');
  addStoneWall(-1.5, -5.0, 0.9, 10, 'lagoon-wall-e2');
  // Iconic Intramuros Corner Watchtower Turret (Garita) facing Freedom Park!
  const garita = new THREE.Group();
  garita.position.set(-1.3, 0, -0.5);
  const gBase = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(1.1, 0.65, 1.8, 12)), matIntramuros);
  gBase.position.y = 2.4;
  const gDrum = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(1.15, 1.15, 1.8, 12)), matIntramuros);
  gDrum.position.y = 4.1;
  const gDome = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(1.18, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5)), matIntramuros);
  gDome.position.y = 5.0;
  garita.add(gBase, gDrum, gDome);
  lagoonGroup.add(garita);

  // Monumental Fort Santiago-Style Spanish-Colonial Baroque Stone Lagoon Archway (exact match to lagoon_gate.jpg & obelisk.png!)
  const gateArch = new THREE.Group();
  gateArch.position.set(-1.5, 0, -14.0);
  // Wide carved stone portal piers with twin fluted pilasters on each side
  addBox(gateArch, 1.7, 5.4, 2.2, 0, 2.7, -3.5, matIntramuros);
  addBox(gateArch, 1.7, 5.4, 2.2, 0, 2.7, 3.5, matIntramuros);
  for (const pz of [-4.2, -2.8, 2.8, 4.2]) {
    addBox(gateArch, 1.95, 4.9, 0.38, 0.1, 2.55, pz, matRawConcrete, false);
  }
  // Semicircular carved stone arch header & upper baroque entablature
  addBox(gateArch, 1.7, 1.45, 9.6, 0, 5.45, 0, matIntramuros);
  addBox(gateArch, 2.15, 0.42, 10.2, 0, 6.25, 0, matRawConcrete, false); // Heavy molded stone cornice
  const archRing = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(2.35, 0.38, 10, 20, Math.PI)),
    matIntramuros,
  );
  archRing.rotation.y = Math.PI / 2;
  archRing.position.set(0.15, 3.25, 0);
  gateArch.add(archRing);
  // Sculpted Baroque Upper Tablet + Fluted Pilasters + Triangular Crowning Pediment (exact silhouette of lagoon_gate.jpg!)
  addBox(gateArch, 1.4, 2.3, 4.4, 0, 7.55, 0, matIntramuros);
  addBox(gateArch, 1.55, 2.15, 0.42, 0.1, 7.55, -2.0, matRawConcrete, false);
  addBox(gateArch, 1.55, 2.15, 0.42, 0.1, 7.55, 2.0, matRawConcrete, false);
  // Sloped baroque scroll volutes flanking the upper tablet
  for (const s of [-1, 1]) {
    const vol = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.25, 1.15, 2.3)), matIntramuros);
    vol.position.set(0, 6.95, s * 3.1);
    vol.rotation.x = s * 0.42;
    gateArch.add(vol);
  }
  // Triangular Baroque Pediment Cap + Central Carved Heraldic Crest Shield
  const ped = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(2.7, 1.55, 4)), matIntramuros);
  ped.rotation.y = Math.PI / 4;
  ped.scale.set(0.45, 1, 1.35);
  ped.position.set(0, 9.4, 0);
  gateArch.add(ped);
  addBox(gateArch, 0.36, 1.15, 0.92, 0.92, 5.45, 0, matRawConcrete, false); // Carved keystone coat of arms
  addSignMesh(
    gateArch,
    3.6,
    1.15,
    0.78,
    7.55,
    0,
    Math.PI / 2,
    'PUP LAGOON',
    'CENTENNIAL GATE',
    { bg: '#6e6a62', border: '#c7c1b5', titleColor: '#f5f2eb', subtitleColor: '#e5a91a', width: 512, height: 192 },
  );
  lagoonGroup.add(gateArch);

  // July 2026 Lagoon Arch Octagonal Maroon-Trimmed Center Flower Planter + Maroon Plaza Curbs (lagoon_arch_2026.jpg!)
  const archPlanter = new THREE.Group();
  archPlanter.position.set(-5.8, 0, -14.0);
  const apBase = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(1.35, 1.4, 0.58, 8)), matMaroon);
  apBase.position.y = 0.29;
  const apCap = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(1.48, 1.45, 0.1, 8)), matBrightWhite);
  apCap.position.y = 0.62;
  const apShrub = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(0.85, 1)), shrubLightMat);
  apShrub.scale.set(1.25, 0.65, 1.25);
  apShrub.position.y = 0.95;
  archPlanter.add(apBase, apCap, apShrub);
  lagoonGroup.add(archPlanter);
  // Maroon concrete walkway border curbs inside the Lagoon plaza (lagoon_arch_2026.jpg & lagoon_1_2026.jpg!)
  addBox(lagoonGroup, 10.5, 0.24, 0.26, -7.2, 0.12, -21.2, matMaroon, false);
  addBox(lagoonGroup, 10.5, 0.24, 0.26, -7.2, 0.12, -6.8, matMaroon, false);

  // Animated Reflective Lagoon Pond (-26..-13, -24..-10) with July 2026 White/Brick Balusters & Black Scroll Railings (lagoon_1_2026.jpg!)
  const pond = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(13, 16)), matLagoonWater);
  pond.rotation.x = -Math.PI / 2;
  pond.position.set(-19.5, 0.055, -17.5);
  pond.receiveShadow = true;
  lagoonGroup.add(pond);
  waterMeshes.push(pond);
  addBox(lagoonGroup, 13.8, 0.36, 0.55, -19.5, 0.18, -9.4, matIntramuros, false);
  addBox(lagoonGroup, 13.8, 0.36, 0.55, -19.5, 0.18, -25.6, matIntramuros, false);
  addBox(lagoonGroup, 0.55, 0.36, 16.6, -26.2, 0.18, -17.5, matIntramuros, false);
  addBox(lagoonGroup, 0.55, 0.36, 16.6, -12.8, 0.18, -17.5, matIntramuros, false);
  // White square concrete balusters with terracotta-brick faces + black wrought-iron railings along Lagoon East & West banks (lagoon_1_2026.jpg!)
  for (let bz = -25.0; bz <= -10.0; bz += 3.0) {
    if (Math.abs(bz - -17.5) < 1.8) continue; // Keep footbridge entrance clear
    for (const bx of [-12.8, -26.2]) {
      addBox(lagoonGroup, 0.44, 0.92, 0.44, bx, 0.68, bz, matBrightWhite, false);
      addBox(lagoonGroup, 0.52, 0.12, 0.52, bx, 1.18, bz, matBrightWhite, false);
      addBox(lagoonGroup, 0.46, 0.52, 0.24, bx, 0.68, bz, matTerracottaWall, false);
    }
  }
  addBox(lagoonGroup, 0.08, 0.08, 6.2, -12.8, 0.96, -22.2, matDarkSteel, false);
  addBox(lagoonGroup, 0.08, 0.08, 6.2, -12.8, 0.96, -12.8, matDarkSteel, false);
  addBox(lagoonGroup, 0.08, 0.08, 6.2, -26.2, 0.96, -22.2, matDarkSteel, false);
  addBox(lagoonGroup, 0.08, 0.08, 6.2, -26.2, 0.96, -12.8, matDarkSteel, false);
  // Walkable Footbridge across Lagoon pond (z = -17.5)
  addBox(lagoonGroup, 14.2, 0.24, 3.0, -19.5, 0.28, -17.5, matWood);
  addBox(lagoonGroup, 14.2, 0.85, 0.14, -19.5, 0.78, -19.0, matMaroon, false);
  addBox(lagoonGroup, 14.2, 0.85, 0.14, -19.5, 0.78, -16.0, matMaroon, false);
  addCollider('lagoon-pond-n', -19.5, -22.2, 12.6, 5.8);
  addCollider('lagoon-pond-s', -19.5, -12.8, 12.6, 5.8);

  // Modern 2-Storey White PUP Lagoon Commercial Stalls with Black Windows & Living Vertical Green Walls (lagoon_stalls.jpg!)
  const matLivingWall = trackMat(new THREE.MeshStandardMaterial({ color: 0x3f7831, roughness: 0.9 }));
  for (let i = 0; i < 5; i++) {
    const sz = -25 + i * 4.4;
    addBox(lagoonGroup, 3.6, 5.2, 4.1, -30.6, 2.6, sz, matBrightWhite);
    addBox(lagoonGroup, 4.0, 0.22, 4.2, -30.3, 2.7, sz, matBrightWhite, false); // Mid-floor canopy ledge
    addBox(lagoonGroup, 4.1, 0.32, 4.2, -30.4, 5.3, sz, matDarkMaroonRoof);
    // Tall black-mullioned vertical glass window bays (exact signature of lagoon_stalls.jpg!)
    addBox(lagoonGroup, 0.18, 2.1, 1.15, -28.78, 1.2, sz - 0.95, matGlass, false);
    addBox(lagoonGroup, 0.18, 2.1, 1.15, -28.78, 3.9, sz - 0.95, matGlass, false);
    // Iconic vertical steel-trellis living plant wall panels beside each stall!
    addBox(lagoonGroup, 0.18, 2.0, 1.25, -28.72, 1.25, sz + 0.9, matDarkSteel, false);
    addBox(lagoonGroup, 0.26, 1.82, 1.12, -28.66, 1.25, sz + 0.9, matLivingWall, false);
    addBox(lagoonGroup, 0.16, 1.85, 1.25, -28.72, 3.85, sz + 0.9, matDarkSteel, false);
  }
  addCollider('lagoon-stalls', -30.6, -16.2, 4.0, 22.0);

  // Elevated Curved White Concrete PUP Amphitheater on Brown Brick Piers (exact match to amphitheater.jpg!)
  const amphiGroup = new THREE.Group();
  amphiGroup.position.set(-20.5, 0, -3.5);
  // Brown brick piers supporting elevated crescent deck
  for (let p = 0; p < 5; p++) {
    const a = (p / 4) * Math.PI;
    addBox(amphiGroup, 0.65, 1.25, 0.65, Math.cos(a) * 6.4, 0.62, Math.sin(a) * 6.4, matTerracottaWall, false);
  }
  // Curved white concrete outer fascia wall & tiered seating steps
  const amphiOuter = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(7.2, 7.2, 1.65, 18, 1, true, 0, Math.PI)),
    matBrightWhite,
  );
  amphiOuter.position.y = 1.95;
  amphiGroup.add(amphiOuter);
  for (let t = 0; t < 4; t++) {
    const rad = 3.2 + t * 1.05;
    const step = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(rad, rad + 0.08, 0.44, 16, 1, false, 0, Math.PI)),
      matRawConcrete,
    );
    step.position.y = 0.72 + t * 0.42;
    step.receiveShadow = true;
    amphiGroup.add(step);
  }
  // Curved silver pipe safety rail + central white performance stage & backdrop wall (amphitheater.jpg!)
  const amphiRail = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(7.15, 0.055, 8, 22, Math.PI)),
    matSilverSteel,
  );
  amphiRail.rotation.x = Math.PI / 2;
  amphiRail.position.y = 3.1;
  amphiGroup.add(amphiRail);
  addBox(amphiGroup, 4.8, 2.2, 0.35, 0, 1.65, -0.6, matBrightWhite, false);
  lagoonGroup.add(amphiGroup);

  // =========================================================================
  // 10. NINOY AQUINO LIBRARY & LEARNING RESOURCES CENTER — NALLRC (x = -24, z = -44)
  //     Authentic T-Shaped Bright WHITE Modernist Library from nallrc.jpg & pup_map.png!
  // =========================================================================
  const nallrcGroup = new THREE.Group();
  nallrcGroup.position.set(-24, 0, -44);
  root.add(nallrcGroup);
  addContactShadow(nallrcGroup, 0, 0, 32, 26);

  // Walkable Ground-Floor Reading Hall Floor
  const libFloor = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(24, 15)), matInteriorFloor);
  libFloor.rotation.x = -Math.PI / 2;
  libFloor.position.set(0, 0.06, 0);
  libFloor.receiveShadow = true;
  nallrcGroup.add(libFloor);

  // Ground-floor perimeter walls with wide South-facing entrance facing the Lagoon (z = +7.5)
  addBox(nallrcGroup, 24.4, 4.4, 0.6, 0, 2.2, -7.5, matBrightWhite);
  addCollider('nallrc-n', -24, -51.5, 24.8, 0.9);
  addBox(nallrcGroup, 0.6, 4.4, 15.4, -12.0, 2.2, 0, matBrightWhite);
  addCollider('nallrc-w', -36, -44, 0.9, 15.6);
  addBox(nallrcGroup, 0.6, 4.4, 15.4, 12.0, 2.2, 0, matBrightWhite);
  addCollider('nallrc-e', -12, -44, 0.9, 15.6);
  // South front wall with wide doorway opening at x in [-2.2, +2.2]
  addBox(nallrcGroup, 9.8, 4.4, 0.6, -7.1, 2.2, 7.5, matBrightWhite);
  addCollider('nallrc-s1', -31.1, -36.5, 10.0, 0.9);
  addBox(nallrcGroup, 9.8, 4.4, 0.6, 7.1, 2.2, 7.5, matBrightWhite);
  addCollider('nallrc-s2', -16.9, -36.5, 10.0, 0.9);

  // Authentic Bright White Upper 3 Storeys (T-shaped block matching pup_map.png & nallrc.jpg!)
  // Main horizontal bar (28m wide x 15m deep, y = 4.4..16.5m)
  addBox(nallrcGroup, 26.8, 11.4, 14.2, 0, 10.1, 0, matDarkShadow);
  // Bright white roof parapet & structural side frames (exact match to nallrc.jpg!)
  addBox(nallrcGroup, 28.0, 2.2, 15.6, 0, 15.2, 0, matBrightWhite);
  addBox(nallrcGroup, 2.8, 12.0, 15.6, -12.6, 10.0, 0, matBrightWhite);
  addBox(nallrcGroup, 2.8, 12.0, 15.6, 12.6, 10.0, 0, matBrightWhite);
  // Bold Cantilevered White Balconies with Recessed Dark Window Bands (exact signature of nallrc.jpg!)
  for (const by of [4.6, 8.6, 12.2]) {
    addBox(nallrcGroup, 27.4, 1.25, 16.4, 0, by, 0.3, matBrightWhite);
    addBox(nallrcGroup, 25.0, 1.9, 14.8, 0, by + 1.5, 0, matGlass, false);
  }
  // Vertical white concrete louver ribs flanking the central portico (matches nallrc.jpg!)
  for (const fx of [-5.8, -5.2, -4.6, 4.6, 5.2, 5.8]) {
    addBox(nallrcGroup, 0.22, 11.2, 0.65, fx, 10.0, 8.1, matBrightWhite, false);
  }
  // Rear North T-wing extension (matches T-footprint on pup_map.png!)
  addBox(nallrcGroup, 11.2, 15.8, 14.0, 0, 7.9, -13.5, matBrightWhite);
  addCollider('nallrc-twing', -24, -57.5, 11.8, 14.2);

  // Terraced Green Concrete Planters flanking the NALLRC Entrance (matches nallrc.jpg foreground!)
  addBox(nallrcGroup, 8.2, 0.9, 4.2, -7.8, 0.45, 10.6, matBrightWhite);
  addBox(nallrcGroup, 7.6, 0.22, 3.6, -7.8, 0.95, 10.6, matGrass, false);
  addBox(nallrcGroup, 8.2, 0.9, 4.2, 7.8, 0.45, 10.6, matBrightWhite);
  addBox(nallrcGroup, 7.6, 0.22, 3.6, 7.8, 0.95, 10.6, matGrass, false);
  addCollider('nallrc-planter-w', -31.8, -33.4, 8.4, 4.4);
  addCollider('nallrc-planter-e', -16.2, -33.4, 8.4, 4.4);

  // Crisp Dark Lettering on White Portico Fascia (matches nallrc.jpg!)
  addSignMesh(
    nallrcGroup,
    13.5,
    1.15,
    0,
    4.65,
    8.55,
    0,
    'NINOY AQUINO LIBRARY',
    'AND LEARNING RESOURCES CENTER',
    { bg: '#f3f1ec', border: 'none', titleColor: '#1f2326', subtitleColor: '#561012', width: 1024, height: 180 },
  );

  createInteractiveDoubleDoor('door-nallrc', 'NALLRC Main Library Doors', -24, -36.5, 0, true);

  // Enterable 1F NALLRC Reading Hall Interior (Book stacks, Study tables, OPAC terminals, Circulation counter)
  const libLight = new THREE.PointLight(0xfff4df, 1.5, 28, 1.6);
  libLight.position.set(0, 3.8, 0);
  nallrcGroup.add(libLight);
  addBox(nallrcGroup, 5.2, 1.05, 1.1, 4.8, 0.52, 2.2, matWood);
  addCollider('nallrc-desk', -19.2, -41.8, 5.4, 1.4);
  // OPAC Catalog Computer Desk at (-25.5, -41.5)
  addBox(nallrcGroup, 3.2, 0.82, 0.95, -1.5, 0.41, 2.5, matWood);
  for (const cx of [-2.3, -1.5, -0.7]) {
    addBox(nallrcGroup, 0.55, 0.42, 0.08, cx, 1.08, 2.5, matDarkSteel, false);
    addBox(nallrcGroup, 0.48, 0.34, 0.09, cx, 1.08, 2.52, trackMat(new THREE.MeshStandardMaterial({ color: 0x2c6e9b, emissive: 0x164160, emissiveIntensity: 0.7 })), false);
  }
  addCollider('nallrc-opac', -25.5, -41.5, 3.4, 1.2);
  // Wooden Book Stacks along rear half
  for (const sx of [-7.5, -3.5, 0.5, 4.5, 8.5]) {
    addBox(nallrcGroup, 0.75, 2.4, 4.8, sx, 1.2, -4.0, matWood);
    addBox(nallrcGroup, 0.82, 2.0, 4.4, sx, 1.2, -4.0, matMaroon, false);
    addCollider(`nallrc-stack-${sx}`, -24 + sx, -48.0, 1.0, 5.0);
  }

  // =========================================================================
  // 11. CHARLIE DEL ROSARIO HALL & LAB HIGH SCHOOL / COC WINGS (x = -54, z = -12)
  //     Authentic Maroon Piers + White Canopy + BRIGHT GOLDEN-YELLOW FINS (charlie.jpg!)
  // =========================================================================
  const charlieGroup = new THREE.Group();
  charlieGroup.position.set(-54, 0, -12);
  charlieGroup.rotation.y = Math.PI * 0.14; // Tilted along the Pasig River bank like pup_map.png!
  root.add(charlieGroup);
  addContactShadow(charlieGroup, 0, 0, 18, 24);

  // Main 3-storey cream building block
  addBox(charlieGroup, 13.5, 11.2, 22, 0, 5.6, 0, matCreamWall);
  // Bold Maroon Ground-Floor Structural Piers flanking glass entrance (matches charlie.jpg!)
  addBox(charlieGroup, 2.2, 3.8, 2.6, 6.4, 1.9, -4.6, matMaroon);
  addBox(charlieGroup, 2.2, 3.8, 2.6, 6.4, 1.9, 4.6, matMaroon);
  addBox(charlieGroup, 0.5, 3.6, 6.8, 6.5, 1.8, 0, matGlass, false);
  // Wide Bright White Cantilevered Entrance Canopy carrying silver lettering (charlie.jpg!)
  addBox(charlieGroup, 3.8, 0.95, 15.2, 7.6, 4.05, 0, matBrightWhite);
  addSignMesh(
    charlieGroup,
    13.8,
    0.85,
    9.53,
    4.05,
    0,
    Math.PI / 2,
    'CHARLIE DEL ROSARIO BUILDING',
    '',
    { bg: '#f2f0eb', border: 'none', titleColor: '#363b40', width: 1024, height: 120 },
  );
  // Iconic Vibrant GOLDEN-YELLOW Vertical Concrete Fins on 2nd Floor under Maroon Roofline (exact signature of charlie.jpg!)
  addBox(charlieGroup, 1.2, 3.6, 9.6, 6.6, 6.4, 0, matDarkShadow, false);
  for (let fz = -4.2; fz <= 4.2; fz += 1.4) {
    addBox(charlieGroup, 0.95, 3.7, 0.55, 7.2, 6.4, fz, matCharlieYellow);
  }
  addBox(charlieGroup, 14.6, 1.15, 22.8, 0, 11.4, 0, matMaroon);
  addCollider('charlie-hall', -54, -12, 15.5, 23.0);

  // Iconic Brick-Red PUP Laboratory High School (#26 — cleanly west of Water Tower & NALLRC, X = [-66.5..-52.5], Z = [-50.5..-25.0]!)
  const matLabRed = trackMat(new THREE.MeshStandardMaterial({ color: 0xa63c2e, roughness: 0.78 }));
  const lhsGroup = new THREE.Group();
  lhsGroup.position.set(-59.5, 0, -37.5);
  lhsGroup.rotation.y = Math.PI * 0.08;
  root.add(lhsGroup);
  addBox(lhsGroup, 4.0, 9.6, 23, -4.2, 4.8, 0, matLabRed);
  addBox(lhsGroup, 4.5, 0.7, 23.5, -4.2, 9.8, 0, matDarkMaroonRoof);
  for (const wz of [-9, -3, 3, 9]) {
    addBox(lhsGroup, 11.2, 9.6, 3.2, 1.0, 4.8, wz, matLabRed);
    addBox(lhsGroup, 11.6, 0.65, 3.6, 1.0, 9.8, wz, matDarkMaroonRoof);
    for (const fy of [2.4, 5.2, 8.0]) {
      addBox(lhsGroup, 10.9, 1.15, 3.38, 1.0, fy, wz, matBrightWhite, false);
      addBox(lhsGroup, 10.6, 0.85, 3.42, 1.0, fy, wz, matGlass, false);
    }
  }
  addCollider('lab-high-school', -59.5, -37.5, 14.0, 25.0);

  // ICONIC PUP OCTAGONAL MUSHROOM WATER TOWER (#29 — cleanly separated NW of NALLRC at (-44, -58.5), >= 3.5m clear on every side!)
  const wtGroup = new THREE.Group();
  wtGroup.position.set(-44.0, 0, -58.5);
  root.add(wtGroup);
  // White walled base enclosure
  addBox(wtGroup, 7.8, 1.3, 7.8, 0, 0.65, 0, matBrightWhite);
  // Tapered octagonal concrete lower tower shaft (y = 0..13m) + waisted neck (y = 13..16.5m)
  const wtShaft = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(1.5, 3.0, 13.5, 8)), matObeliskStone);
  wtShaft.position.y = 6.75;
  wtShaft.castShadow = castShadow;
  const wtNeck = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(2.3, 1.5, 3.4, 8)), matObeliskStone);
  wtNeck.position.y = 15.2;
  // Iconic maroon-rimmed circular porthole windows climbing the octagonal shaft (exact detail from water_tower.jpg!)
  for (const py of [3.2, 6.2, 9.2, 12.0, 14.6]) {
    const r = py > 13.5 ? 1.9 : 2.95 - (py / 13.5) * 1.35;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const portRim = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.28, 0.07, 6, 10)), matMaroon);
      portRim.position.set(Math.cos(a) * r, py, Math.sin(a) * r);
      portRim.rotation.y = -a + Math.PI / 2;
      wtGroup.add(portRim);
    }
  }
  // Inverted-pyramid octagonal concrete mushroom tank + crown slab (exact silhouette of water_tower.jpg!)
  const wtFlare = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(6.4, 2.3, 3.6, 8)), matObeliskStone);
  wtFlare.position.y = 18.6;
  wtFlare.castShadow = castShadow;
  const wtTank = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(6.6, 6.4, 1.8, 8)), matRawConcrete);
  wtTank.position.y = 21.3;
  const wtLid = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(6.8, 6.7, 0.45, 8)), matDarkSteel);
  wtLid.position.y = 22.35;
  wtGroup.add(wtShaft, wtNeck, wtFlare, wtTank, wtLid);
  addCollider('pup-water-tower', -44.0, -58.5, 8.0, 8.0);

  // =========================================================================
  // 12. PUP TRACK & FIELD OVAL & CANTILEVERED GRANDSTAND (x = 48, z = 44)
  //     Southeastern Quadrant + Diagonal NE-SW Orientation — zero overlap with Mabini Shrine!
  // =========================================================================
  const ovalGroup = new THREE.Group();
  ovalGroup.position.set(48, 0, 44);
  ovalGroup.rotation.y = -Math.PI * 0.16; // Authentic NE-SW tilt from official PUP map!
  root.add(ovalGroup);

  const outerTrack = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(18.5, 18.5, 0.05, 40)), matTrack);
  outerTrack.scale.set(0.84, 1, 1.24);
  outerTrack.position.y = 0.025;
  outerTrack.receiveShadow = true;
  ovalGroup.add(outerTrack);

  const innerField = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(14.0, 14.0, 0.06, 36)), matGrass);
  innerField.scale.set(0.82, 1, 1.25);
  innerField.position.y = 0.036;
  innerField.receiveShadow = true;
  ovalGroup.add(innerField);

  const trackLine = new THREE.Mesh(trackGeo(new THREE.RingGeometry(14.3, 14.6, 36)), matBrightWhite);
  trackLine.rotation.x = -Math.PI / 2;
  trackLine.scale.set(0.83, 1.24, 1);
  trackLine.position.y = 0.068;
  ovalGroup.add(trackLine);

  // Authentic PUP Grandstand on the NW straightaway overlooking the Oval (world center ~(32.1, 32.4), zero overlap!)
  const gsGroup = new THREE.Group();
  gsGroup.position.set(-19.5, 0, -2.5);
  // Lower cream wall with crisp maroon bottom base stripe (exact match to grandstand.jpg!)
  addBox(gsGroup, 2.0, 0.55, 24, 3.8, 0.28, 0, matMaroon);
  addBox(gsGroup, 2.0, 0.95, 24, 3.8, 1.02, 0, matCreamWall);
  // Tiered gray concrete bleacher steps
  for (let t = 0; t < 6; t++) {
    addBox(gsGroup, 1.25, 0.55 + t * 0.45, 23.4, 2.5 - t * 1.05, (0.55 + t * 0.45) / 2 + 0.6, 0, matRawConcrete);
  }
  // Rear cream-yellow press box & vertical structural fin columns supporting ribbed cantilevered roof (grandstand.jpg!)
  addBox(gsGroup, 1.2, 5.4, 24, -3.8, 2.7, 0, matCreamWall);
  addBox(gsGroup, 1.3, 1.6, 18, -3.7, 4.1, 0, matDarkShadow, false);
  for (let cz = -10.5; cz <= 10.5; cz += 4.2) {
    addBox(gsGroup, 0.75, 6.6, 0.52, -3.3, 3.3, cz, matCreamWall, false);
    const beam = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(9.2, 0.58, 0.36)), matCreamWall);
    beam.position.set(0.3, 6.28, cz);
    beam.rotation.z = 0.11;
    gsGroup.add(beam);
  }
  // Iconic Forward-Cantilevered Cream-Yellow Concrete Roof Slab
  const gsRoof = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(9.6, 0.42, 25.4)), matCreamWall);
  gsRoof.position.set(0.2, 6.68, 0);
  gsRoof.rotation.z = 0.11;
  gsRoof.castShadow = castShadow;
  gsGroup.add(gsRoof);
  // Central red ceremonial canopy tent on Grandstand podium (signature detail from grandstand.jpg!)
  const tentTop = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(2.5, 1.1, 4)), matMaroon);
  tentTop.rotation.y = Math.PI / 4;
  tentTop.position.set(3.2, 3.6, 0);
  gsGroup.add(tentTop);
  // Stainless steel bleacher aisle handrails
  for (const rz of [-7.5, 0, 7.5]) {
    const rail = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(6.2, 0.08, 0.08)), matSilverSteel);
    rail.position.set(0.2, 2.9, rz);
    rail.rotation.z = -0.38;
    gsGroup.add(rail);
  }
  addSignMesh(gsGroup, 11.0, 1.1, 4.85, 7.05, 0, Math.PI / 2, 'PUP GRANDSTAND', 'TRACK & FIELD OVAL', {
    bg: '#7b1718',
    border: '#e5a91a',
  });
  ovalGroup.add(gsGroup);
  addCollider('pup-grandstand', 32.1, 32.4, 9.6, 22.0);

  // =========================================================================
  // 13. NORTHEAST SPORTS COMPLEX: COURTS (#4-#6), GYMNASIUM (#38), POOL (#37),
  //     CHK (#35), TAHANAN NG ALUMNI (#36), NFTRDC (#34) & ESRC (#39)
  // =========================================================================
  const matCourtBlue = trackMat(new THREE.MeshStandardMaterial({ color: 0x265985, roughness: 0.82 }));
  const matCourtGreen = trackMat(new THREE.MeshStandardMaterial({ color: 0x2f6b4b, roughness: 0.84 }));
  const matHoopOrange = trackMat(new THREE.MeshStandardMaterial({ color: 0xc95a1e, roughness: 0.5, metalness: 0.45 }));

  // #6 OUTDOOR BASKETBALL & VOLLEYBALL COURT (x = 31.0, z = -24.0 — photo-matched to p04_open_court.jpg & p06_basketball_court.jpg!)
  const bballGroup = new THREE.Group();
  bballGroup.position.set(31.0, 0, -24.0);
  root.add(bballGroup);
  const bbSlab = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(13.6, 14.0)), matConcrete);
  bbSlab.rotation.x = -Math.PI / 2;
  bbSlab.position.y = 0.036;
  bbSlab.receiveShadow = true;
  bballGroup.add(bbSlab);
  // Crisp white sidelines, baseline, center line & center circle
  addBox(bballGroup, 12.2, 0.02, 0.12, 0, 0.048, -5.8, matBrightWhite, false);
  addBox(bballGroup, 12.2, 0.02, 0.12, 0, 0.048, 5.8, matBrightWhite, false);
  addBox(bballGroup, 0.12, 0.02, 11.7, -6.1, 0.048, 0, matBrightWhite, false);
  addBox(bballGroup, 0.12, 0.02, 11.7, 6.1, 0.048, 0, matBrightWhite, false);
  addBox(bballGroup, 0.12, 0.02, 11.7, 0, 0.048, 0, matBrightWhite, false);
  const centerCircle = new THREE.Mesh(trackGeo(new THREE.RingGeometry(1.5, 1.65, 24)), matBrightWhite);
  centerCircle.rotation.x = -Math.PI / 2;
  centerCircle.position.y = 0.05;
  bballGroup.add(centerCircle);
  // Twin authentic orange steel-truss cantilevered basketball hoop stands (p04_open_court.jpg!)
  for (const side of [-1, 1]) {
    addBox(bballGroup, 0.9, 0.6, 1.4, side * 6.3, 0.3, 0, matRawConcrete, false);
    addBox(bballGroup, 0.16, 3.6, 0.16, side * 6.2, 1.9, -0.45, matHoopOrange, false);
    addBox(bballGroup, 0.16, 3.6, 0.16, side * 6.2, 1.9, 0.45, matHoopOrange, false);
    const arm = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.6, 0.14, 0.7)), matHoopOrange);
    arm.position.set(side * 5.6, 3.45, 0);
    bballGroup.add(arm);
    // Backboard with orange square frame & hoop rim
    addBox(bballGroup, 0.08, 1.15, 1.75, side * 4.95, 3.55, 0, matBrightWhite, false);
    addBox(bballGroup, 0.11, 1.2, 0.09, side * 4.95, 3.55, -0.88, matHoopOrange, false);
    addBox(bballGroup, 0.11, 1.2, 0.09, side * 4.95, 3.55, 0.88, matHoopOrange, false);
    const rim = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.24, 0.035, 6, 12)), matHoopOrange);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(side * 4.65, 3.12, 0);
    bballGroup.add(rim);
  }

  // #5 LAWN TENNIS COURT (x = 46.5, z = -24.0 — blue-and-green acrylic court, net, fence & umpire chair!)
  const tennisGroup = new THREE.Group();
  tennisGroup.position.set(46.5, 0, -24.0);
  root.add(tennisGroup);
  const tennisOuter = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(14.6, 14.0)), matCourtGreen);
  tennisOuter.rotation.x = -Math.PI / 2;
  tennisOuter.position.y = 0.036;
  tennisOuter.receiveShadow = true;
  tennisGroup.add(tennisOuter);
  const tennisInner = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(11.6, 8.8)), matCourtBlue);
  tennisInner.rotation.x = -Math.PI / 2;
  tennisInner.position.y = 0.044;
  tennisInner.receiveShadow = true;
  tennisGroup.add(tennisInner);
  // Crisp white tennis lines + center net & steel perimeter posts
  addBox(tennisGroup, 11.6, 0.02, 0.1, 0, 0.052, -4.4, matBrightWhite, false);
  addBox(tennisGroup, 11.6, 0.02, 0.1, 0, 0.052, 4.4, matBrightWhite, false);
  addBox(tennisGroup, 0.1, 0.02, 8.8, -5.8, 0.052, 0, matBrightWhite, false);
  addBox(tennisGroup, 0.1, 0.02, 8.8, 5.8, 0.052, 0, matBrightWhite, false);
  addBox(tennisGroup, 6.2, 0.02, 0.09, 0, 0.052, 0, matBrightWhite, false);
  addBox(tennisGroup, 0.08, 1.05, 9.4, 0, 0.54, 0, matDarkSteel, false);
  addBox(tennisGroup, 0.12, 0.1, 9.6, 0, 1.06, 0, matBrightWhite, false);
  // Corner fence posts & top rail
  for (const fx of [-7.1, 0, 7.1]) {
    for (const fz of [-6.8, 6.8]) {
      addBox(tennisGroup, 0.1, 3.2, 0.1, fx, 1.6, fz, matDarkSteel, false);
    }
  }
  addBox(tennisGroup, 14.2, 0.07, 0.07, 0, 3.15, -6.8, matDarkSteel, false);
  addBox(tennisGroup, 14.2, 0.07, 0.07, 0, 3.15, 6.8, matDarkSteel, false);

  // #4 OPEN MULTI-SPORT COURT (x = 60.0, z = -26.0 — right beside Visitor's Lounge & Gym Gate!)
  const openCourt = new THREE.Group();
  openCourt.position.set(60.0, 0, -26.0);
  root.add(openCourt);
  const ocDeck = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(9.6, 9.0)), matCourtBlue);
  ocDeck.rotation.x = -Math.PI / 2;
  ocDeck.position.y = 0.038;
  ocDeck.receiveShadow = true;
  openCourt.add(ocDeck);
  addBox(openCourt, 8.6, 0.02, 0.1, 0, 0.05, -3.8, matBrightWhite, false);
  addBox(openCourt, 8.6, 0.02, 0.1, 0, 0.05, 3.8, matBrightWhite, false);
  addBox(openCourt, 0.08, 1.6, 7.6, 0, 0.8, 0, matDarkSteel, false);

  // Monumental Barrel-Vault PUP Gymnasium (#38, x = 44, z = -48)
  const gymGroup = new THREE.Group();
  gymGroup.position.set(44, 0, -48);
  root.add(gymGroup);
  addContactShadow(gymGroup, 0, 0, 32, 22);
  addBox(gymGroup, 28, 7.2, 18.5, 0, 3.6, 0, matBrightWhite);
  addBox(gymGroup, 28.4, 1.4, 18.9, 0, 0.7, 0, matMaroon);
  // Clerestory daylight windows along upper gym walls (matching gymnasium.jpg interior windows!)
  addBox(gymGroup, 25.5, 1.8, 18.8, 0, 5.4, 0, matGlass, false);
  // Monumental Deep-Maroon Curved Barrel-Vault PUP Gymnasium (#38 on vicinity_map.jpg!)
  const gymVault = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(9.6, 9.6, 28.8, 20, 1, false, 0, Math.PI)),
    matDarkMaroonRoof,
  );
  gymVault.rotation.z = Math.PI / 2;
  gymVault.rotation.x = -Math.PI / 2;
  gymVault.scale.set(1, 0.46, 1);
  gymVault.position.y = 7.1;
  gymVault.castShadow = castShadow;
  gymGroup.add(gymVault);
  addBox(gymGroup, 29.0, 0.55, 19.2, 0, 7.25, 0, matBrightWhite);
  addSignMesh(gymGroup, 13.0, 1.4, 0, 5.8, 9.4, 0, 'PUP GYMNASIUM & SPORTS CENTER', 'COLLEGE OF HUMAN KINETICS');
  addCollider('pup-gymnasium', 44, -48, 29.0, 19.5);

  // UPGRADED #39 ENGINEERING & SCIENCE RESEARCH CENTER (x = 68, z = -48 — photo-matched to p39_esrc.jpg & bj_gymgate.png!)
  const esrcGroup = new THREE.Group();
  esrcGroup.position.set(68, 0, -48);
  root.add(esrcGroup);
  addContactShadow(esrcGroup, 0, 0, 16, 20);
  addBox(esrcGroup, 12.6, 14.5, 16.5, 0, 7.25, 0, matCreamWall);
  // Double-height black-mullioned glass curtain-wall entrance lobby framed by maroon columns (p39_esrc.jpg!)
  addBox(esrcGroup, 10.2, 5.6, 0.4, 0, 2.8, 8.2, matGlass, false);
  for (const cx of [-5.4, -1.8, 1.8, 5.4]) {
    addBox(esrcGroup, 0.55, 6.2, 0.85, cx, 3.1, 8.35, matMaroon);
  }
  addBox(esrcGroup, 13.4, 0.65, 2.2, 0, 6.1, 8.9, matBrightWhite); // Cantilevered lobby portico slab
  addBox(esrcGroup, 13.0, 0.4, 2.0, 0, 5.7, 8.8, matDarkMaroonRoof, false); // Maroon portico soffit
  // Upper-floor ribbon glazing & horizontal white sunshade ledges
  for (const fy of [8.2, 11.4]) {
    addBox(esrcGroup, 12.9, 1.65, 14.6, 0, fy, 0, matGlass, false);
    addBox(esrcGroup, 13.3, 0.35, 17.1, 0, fy - 1.0, 0, matBrightWhite, false);
  }
  addBox(esrcGroup, 13.2, 1.25, 17.1, 0, 14.65, 0, matDarkMaroonRoof);
  // Exterior maroon steel fire-escape zig-zag stairs on the West flank (bj_gymgate.png!)
  for (let st = 0; st < 3; st++) {
    addBox(esrcGroup, 1.6, 0.16, 3.6, -7.0, 3.2 + st * 3.2, 2.8, matMaroon, false);
    const flight = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 0.2, 3.8)), matMaroon);
    flight.position.set(-7.1, 4.7 + st * 3.2, 0.6);
    flight.rotation.x = st % 2 === 0 ? 0.62 : -0.62;
    esrcGroup.add(flight);
  }
  addSignMesh(esrcGroup, 10.6, 1.15, 0, 13.2, 8.45, 0, 'ENGINEERING & SCIENCE RESEARCH CENTER', 'PUP STA. MESA', {
    bg: '#5a1214',
    border: '#e5a91a',
  });
  addCollider('pup-esrc', 68, -48, 13.5, 17.5);

  // PUP Competition Olympic Swimming Pool (#37, x = 16, z = -48 — photo-matched to pool.jpg!)
  const poolGroup = new THREE.Group();
  poolGroup.position.set(16, 0, -48);
  root.add(poolGroup);
  // Dark asphalt surround deck + crisp white pool rim coping (pool.jpg!)
  addBox(poolGroup, 21.8, 0.22, 14.8, 0, 0.11, 0, matAsphalt, false);
  addBox(poolGroup, 18.4, 0.26, 11.0, 0, 0.13, 0, matBrightWhite, false);
  const poolWater = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(17.5, 10.2)), matPoolWater);
  poolWater.rotation.x = -Math.PI / 2;
  poolWater.position.y = 0.28;
  poolGroup.add(poolWater);
  waterMeshes.push(poolWater);
  // Dark submerged tile lane lines & T-marks + diving starting blocks (pool.jpg!)
  const matPoolLane = trackMat(new THREE.MeshStandardMaterial({ color: 0x1a5f72, roughness: 0.4 }));
  for (let lz = -3.4; lz <= 3.4; lz += 1.7) {
    addBox(poolGroup, 16.0, 0.03, 0.14, 0, 0.295, lz, matPoolLane, false);
    addBox(poolGroup, 0.14, 0.03, 0.85, -7.8, 0.295, lz, matPoolLane, false);
    addBox(poolGroup, 0.14, 0.03, 0.85, 7.8, 0.295, lz, matPoolLane, false);
    // Diving starting block pedestals at both ends
    addBox(poolGroup, 0.55, 0.42, 0.55, -9.1, 0.42, lz, matDarkSteel, false);
    addBox(poolGroup, 0.55, 0.42, 0.55, 9.1, 0.42, lz, matDarkSteel, false);
  }
  // Authentic Tiered Concrete Spectator Bleachers + Cantilevered Ribbed White Concrete Canopy (pool.jpg!)
  const matPoolStand = trackMat(new THREE.MeshStandardMaterial({ color: 0x7398a8, roughness: 0.78 }));
  for (let t = 0; t < 4; t++) {
    addBox(poolGroup, 19.6, 0.45, 0.85, 0, 0.4 + t * 0.45, -6.9 - t * 0.82, matPoolStand);
  }
  // Rear columns & cantilevered ribbed concrete canopy roof overhanging the bleachers (pool.jpg!)
  addBox(poolGroup, 20.6, 0.34, 4.6, 0, 4.35, -8.2, matBrightWhite);
  for (let px = -9.0; px <= 9.0; px += 3.0) {
    addBox(poolGroup, 0.32, 3.8, 0.32, px, 2.35, -9.9, matBrightWhite, false);
    addBox(poolGroup, 0.22, 0.28, 4.4, px, 4.12, -8.2, matRawConcrete, false);
  }
  addCollider('pup-pool', 16, -48, 22.0, 19.0);

  // UPGRADED #35 COLLEGE OF HUMAN KINETICS (CHK) BUILDING (x = -2, z = -47 — photo-matched to p35_chk.jpg!)
  const chkGroup = new THREE.Group();
  chkGroup.position.set(-2, 0, -47);
  root.add(chkGroup);
  addContactShadow(chkGroup, 0, 0, 11.5, 21.5);
  // Recessed dark classroom core + 2-storey open-corridor colonnade facing East toward Pool & Plaza
  addBox(chkGroup, 6.2, 8.2, 18.2, -1.0, 4.1, 0, matCreamWall);
  addBox(chkGroup, 0.4, 2.1, 16.4, 2.15, 2.1, 0, matGlass, false);
  addBox(chkGroup, 0.4, 2.1, 16.4, 2.15, 5.9, 0, matGlass, false);
  // Iconic textured aggregate-gray concrete 2nd-floor balcony parapet (exact signature of p35_chk.jpg!)
  addBox(chkGroup, 2.2, 0.32, 18.6, 3.1, 4.05, 0, matCreamWall);
  addBox(chkGroup, 0.32, 1.35, 18.4, 4.1, 4.82, 0, matRawConcrete);
  // Structural cream colonnade piers & pitched overhanging dark maroon roof fascia
  for (let pz = -8.6; pz <= 8.6; pz += 4.3) {
    addBox(chkGroup, 0.42, 8.2, 0.42, 4.1, 4.1, pz, matCreamWall);
  }
  addBox(chkGroup, 9.2, 0.65, 19.4, 0.1, 8.45, 0, matDarkMaroonRoof);
  addBox(chkGroup, 9.4, 0.24, 19.6, 0.1, 8.15, 0, matBrightWhite, false);
  addSignMesh(chkGroup, 9.2, 1.05, 4.32, 4.85, 0, Math.PI / 2, 'COLLEGE OF HUMAN KINETICS', 'PUP STA. MESA · CHK BUILDING', {
    bg: '#f2eee6',
    border: '#7b1718',
    titleColor: '#561012',
    subtitleColor: '#3a3532',
  });
  addCollider('pup-pe-bldg', -2, -47, 9.0, 19.2);

  // =========================================================================
  // 13B. COMPLETE OFFICIAL PUP VICINITY MAP BUILDINGS (#3, #7, #9, #15, #18-#23,
  //      #27-#28, #34, #36, GYMNASIUM GATE & OVAL GATE — ZERO OVERLAPS!)
  // =========================================================================
  const matAlumniOchre = trackMat(new THREE.MeshStandardMaterial({ color: 0xd99b44, roughness: 0.72 }));
  const matBrickWall = trackMat(new THREE.MeshStandardMaterial({ color: 0x9b543a, roughness: 0.82 }));
  const matSlateBlue = trackMat(new THREE.MeshStandardMaterial({ color: 0x6e859c, roughness: 0.78 }));
  const matPumpBlue = trackMat(new THREE.MeshStandardMaterial({ color: 0x255a9c, roughness: 0.42, metalness: 0.45 }));

  // #3 VISITOR'S LOUNGE (x = 67.0, z = -17.5 — photo-matched to p03_visitors_lounge.png!)
  const loungeGroup = new THREE.Group();
  loungeGroup.position.set(67.0, 0, -17.5);
  root.add(loungeGroup);
  addContactShadow(loungeGroup, 0, 0, 10.5, 8.0);
  addBox(loungeGroup, 8.2, 3.2, 5.8, 0, 1.6, 0, matBrickWall);
  // Dark-mullioned glass entrance doors & display bay facing South toward Avenue
  addBox(loungeGroup, 6.2, 2.4, 0.22, 0, 1.45, 2.95, matGlass, false);
  for (const mx of [-3.0, -1.0, 1.0, 3.0]) {
    addBox(loungeGroup, 0.12, 2.45, 0.28, mx, 1.45, 2.98, matDarkSteel, false);
  }
  // Signature curved arched maroon barrel-vault roof + raised clerestory transom (p03_visitors_lounge.png!)
  const loungeRoof = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(4.4, 4.4, 9.2, 16, 1, false, -Math.PI * 0.32, Math.PI * 0.64)),
    matDarkMaroonRoof,
  );
  loungeRoof.rotation.z = Math.PI / 2;
  loungeRoof.scale.set(1, 0.34, 1);
  loungeRoof.position.set(0, 2.4, 0);
  loungeRoof.castShadow = castShadow;
  loungeGroup.add(loungeRoof);
  addBox(loungeGroup, 7.6, 1.0, 2.4, 0, 4.15, -0.8, matCreamWall);
  addBox(loungeGroup, 8.0, 0.22, 2.8, 0, 4.72, -0.8, matDarkMaroonRoof);
  // Silver pedestrian guardrail along front terrace (p03_visitors_lounge.png!)
  addBox(loungeGroup, 8.4, 0.08, 0.08, 0, 0.92, 3.35, matSilverSteel, false);
  addSignMesh(loungeGroup, 5.6, 0.72, 0, 3.65, 3.02, 0, 'PUP VISITOR’S LOUNGE', 'WELCOME CENTER · MAIN GATE', {
    bg: '#5a1818',
    border: '#e5a91a',
  });
  addCollider('visitors-lounge', 67.0, -17.5, 8.8, 6.6);

  // #40 GYMNASIUM GATE (x = 82.6, z = -28.0) & #7 OVAL GATE (x = 82.6, z = 58.0) — aligned with Anonas frontage!
  const buildSideGate = (id: string, zPos: number, label: string, sub: string) => {
    const sg = new THREE.Group();
    sg.position.set(82.6, 0, zPos);
    root.add(sg);
    for (const pz of [-3.4, 3.4]) {
      addBox(sg, 1.3, 1.2, 2.2, 0, 0.6, pz, matMaroon);
      addBox(sg, 1.2, 2.1, 2.1, 0, 2.25, pz, matBrightWhite);
    }
    addBox(sg, 0.14, 2.5, 2.2, 0, 1.35, -1.2, matMaroon, false);
    for (let bz = -2.1; bz <= -0.3; bz += 0.3) {
      addBox(sg, 0.16, 2.35, 0.06, 0, 1.35, bz, matDarkMaroonRoof, false);
    }
    addBox(sg, 1.5, 0.75, 8.8, 0, 3.65, 0, matDarkMaroonRoof);
    addSignMesh(sg, 6.4, 0.68, -0.78, 3.65, 0, -Math.PI / 2, label, sub, {
      bg: '#521b14',
      border: '#e5a91a',
    });
    addSignMesh(sg, 6.4, 0.68, 0.78, 3.65, 0, Math.PI / 2, label, sub, {
      bg: '#521b14',
      border: '#e5a91a',
    });
    addCollider(`${id}-n`, 82.6, zPos - 3.4, 1.6, 2.4);
    addCollider(`${id}-s`, 82.6, zPos + 3.4, 1.6, 2.4);
  };
  buildSideGate('gym-gate', -28.0, 'PUP GYMNASIUM GATE', 'EAST SPORTS ACCESS');
  buildSideGate('oval-gate', 58.0, 'PUP OVAL GATE', 'ANONAS ST. SOUTH ACCESS');

  // #7 PUP SOUVENIR SHOP (x = 57.5, z = 11.2 — photo-matched to p07_souvenir_shop.jpg!)
  const souvGroup = new THREE.Group();
  souvGroup.position.set(57.5, 0, 11.2);
  root.add(souvGroup);
  addContactShadow(souvGroup, 0, 0, 11.0, 7.6);
  addBox(souvGroup, 8.8, 3.4, 5.4, 0, 1.7, 0, matCreamWall);
  // Wide dark-mullioned display glass storefront facing North toward South Catwalk (p07_souvenir_shop.jpg!)
  addBox(souvGroup, 7.2, 2.5, 0.2, 0, 1.4, -2.72, matGlass, false);
  for (let gx = -3.5; gx <= 3.5; gx += 1.4) {
    addBox(souvGroup, 0.12, 2.55, 0.25, gx, 1.4, -2.75, matDarkSteel, false);
  }
  // Overhanging corrugated maroon pitched roof & fascia
  addBox(souvGroup, 9.6, 0.42, 6.6, 0, 3.6, -0.2, matDarkMaroonRoof);
  // Iconic angled rooftop signboard "P U P / SOUVENIR SHOP" (p07_souvenir_shop.jpg!)
  const souvSign = addSignMesh(souvGroup, 4.6, 1.05, 0, 4.35, -2.8, Math.PI, 'P U P', 'SOUVENIR SHOP', {
    bg: '#ece5d6',
    border: '#7b1718',
    titleColor: '#8c1c1e',
    subtitleColor: '#2a2a2c',
  });
  souvSign.rotation.x = 0.16;
  // Festive colorful campus banderitas pennants strung along front eave (p07_souvenir_shop.jpg!)
  const pennantColors = [0xd62828, 0xf77f00, 0xfcbf49, 0x2a9d8f, 0x266dd3];
  for (let px = -4.0; px <= 4.0; px += 0.9) {
    const pMat = trackMat(new THREE.MeshStandardMaterial({ color: pennantColors[Math.abs(Math.round(px)) % pennantColors.length], roughness: 0.7 }));
    const penn = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.22, 0.42, 3)), pMat);
    penn.rotation.z = Math.PI;
    penn.position.set(px, 3.22, -3.45);
    souvGroup.add(penn);
  }
  // Red outdoor wooden picnic table beside Souvenir Shop
  addBox(souvGroup, 1.8, 0.72, 1.0, -5.6, 0.36, -1.2, matMaroon, false);
  addCollider('souvenir-shop', 57.5, 11.2, 9.4, 6.0);

  // #9 MUSEO NI MABINI-PUP GALLERY ANNEX (x = 24.0, z = 13.2 — photo-matched to p09_mabini_museum.jpg!)
  const musGroup = new THREE.Group();
  musGroup.position.set(24.0, 0, 13.2);
  root.add(musGroup);
  addContactShadow(musGroup, 0, 0, 11.2, 9.0);
  // White colonial-modernist heritage gallery hall with maroon lower dado & dark-grilled casement windows
  addBox(musGroup, 8.8, 4.0, 6.6, 0, 2.0, 0.3, matBrightWhite);
  addBox(musGroup, 9.0, 0.95, 6.8, 0, 0.48, 0.3, matMaroon);
  for (const wx of [-2.8, 0, 2.8]) {
    addBox(musGroup, 1.8, 1.55, 0.18, wx, 2.35, -3.02, matGlass, false);
  }
  // Steeply pitched dark-maroon gable roof with crisp white gable end
  const musRoof = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(6.6, 2.4, 4)), matDarkMaroonRoof);
  musRoof.rotation.y = Math.PI / 4;
  musRoof.scale.set(1.06, 1, 0.85);
  musRoof.position.set(0, 5.15, 0.3);
  musRoof.castShadow = castShadow;
  musGroup.add(musRoof);
  // Low white perimeter fence piers + black iron museum gate + NHCP signboard (p09_mabini_museum.jpg!)
  addBox(musGroup, 3.2, 1.0, 0.28, -3.0, 0.5, -3.65, matBrightWhite, false);
  addBox(musGroup, 3.2, 1.0, 0.28, 3.0, 0.5, -3.65, matBrightWhite, false);
  addBox(musGroup, 2.6, 1.45, 0.12, 0, 0.78, -3.65, matDarkSteel, false);
  addSignMesh(musGroup, 3.0, 1.05, -2.9, 1.35, -3.82, Math.PI, 'MUSEO NI MABINI-PUP', 'NHCP · TUE–SUN 8AM–4PM', {
    bg: '#f5f2eb',
    border: '#7b1718',
    titleColor: '#8c1c1e',
    subtitleColor: '#2a2a2c',
  });
  addCollider('mabini-museum', 24.0, 13.2, 9.6, 7.6);

  // #15 TWIN SHADED OCTAGONAL PUP CAMPUS GAZEBOS (East at (17.0, 29.0) & SW at (-41.0, 52.0)!)
  const buildPupGazebo = (id: string, gx: number, gz: number) => {
    const gzGrp = new THREE.Group();
    gzGrp.position.set(gx, 0, gz);
    root.add(gzGrp);
    addContactShadow(gzGrp, 0, 0, 7.4, 7.4);
    const plinth = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(3.0, 3.2, 0.36, 8)), matRawConcrete);
    plinth.position.y = 0.18;
    plinth.receiveShadow = true;
    gzGrp.add(plinth);
    const benchRing = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(2.65, 2.65, 0.45, 8, 1, true)), matBrightWhite);
    benchRing.position.y = 0.58;
    gzGrp.add(benchRing);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const col = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.11, 0.13, 3.1, 8)), matBrightWhite);
      col.position.set(Math.cos(a) * 2.55, 1.85, Math.sin(a) * 2.55);
      gzGrp.add(col);
    }
    const roof = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(3.55, 1.65, 8)), matDarkMaroonRoof);
    roof.position.y = 4.15;
    roof.castShadow = castShadow;
    gzGrp.add(roof);
    const finial = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.18, 8, 8)), matGold);
    finial.position.y = 5.05;
    gzGrp.add(finial);
    addCollider(id, gx, gz, 6.2, 6.2);
  };
  buildPupGazebo('gazebo-east', 17.0, 29.0);
  buildPupGazebo('gazebo-sw', -41.0, 52.0);

  // #18 TAHANAN NG ATLETA (x = 26.0, z = 67.5 — photo-matched to p18_tahanan_atleta.jpg!)
  const atletaGroup = new THREE.Group();
  atletaGroup.position.set(26.0, 0, 67.5);
  root.add(atletaGroup);
  addContactShadow(atletaGroup, 0, 0, 17.0, 11.8);
  // Deep maroon rusticated ground floor + warm cream upper 2 floors divided by crisp white pilasters (p18_tahanan_atleta.jpg!)
  addBox(atletaGroup, 14.6, 3.8, 9.4, 0, 1.9, 0, matMaroon);
  addBox(atletaGroup, 14.6, 5.4, 9.4, 0, 6.5, 0, matCreamWall);
  // Crisp white horizontal stringcourse & vertical bay pilasters
  addBox(atletaGroup, 15.0, 0.28, 9.8, 0, 3.85, 0, matBrightWhite, false);
  addBox(atletaGroup, 15.0, 0.28, 9.8, 0, 6.75, 0, matBrightWhite, false);
  addBox(atletaGroup, 15.0, 0.35, 9.8, 0, 9.3, 0, matBrightWhite, false);
  for (const px of [-7.1, -2.4, 2.4, 7.1]) {
    addBox(atletaGroup, 0.38, 5.4, 9.7, px, 6.5, 0, matBrightWhite, false);
  }
  // Signature 3 white-trimmed semicircular arched openings on North front facade + entry steps (p18_tahanan_atleta.jpg!)
  for (const ax of [-4.6, 0, 4.6]) {
    const isDoor = ax === 0;
    const archR = isDoor ? 1.05 : 1.3;
    const archY = isDoor ? 2.55 : 2.45;
    addBox(atletaGroup, isDoor ? 2.1 : 2.6, isDoor ? 2.5 : 1.9, 0.22, ax, isDoor ? 1.35 : 1.55, -4.74, matGlass, false);
    const fanlight = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(archR - 0.04, 16, 0, Math.PI)), matGlass);
    fanlight.position.set(ax, archY, -4.75);
    fanlight.rotation.y = Math.PI;
    atletaGroup.add(fanlight);
    const archTrim = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(archR, 0.12, 8, 16, Math.PI)), matBrightWhite);
    archTrim.position.set(ax, archY, -4.76);
    atletaGroup.add(archTrim);
    // Upper-floor jalousie & transom windows
    addBox(atletaGroup, 2.5, 1.45, 0.18, ax, 5.2, -4.74, matGlass, false);
    addBox(atletaGroup, 2.5, 1.15, 0.18, ax, 8.0, -4.74, matGlass, false);
  }
  addBox(atletaGroup, 4.2, 0.32, 1.6, 0, 0.16, -5.3, matRawConcrete, false);
  // Pitched dark maroon roof & bold raised maroon "★ TAHANAN NG ATLETA" fascia lettering (p18_tahanan_atleta.jpg!)
  addBox(atletaGroup, 15.2, 0.65, 10.0, 0, 9.75, 0, matDarkMaroonRoof);
  addSignMesh(atletaGroup, 11.4, 0.9, 0, 6.75, -4.92, Math.PI, '★ TAHANAN NG ATLETA', 'PUP ALUMNI ASSOCIATION-USA', {
    bg: '#ece5d5',
    border: 'none',
    titleColor: '#7b1718',
    subtitleColor: '#4a1b1b',
  });
  addCollider('tahanan-ng-atleta', 26.0, 67.5, 15.0, 10.0);

  // #19 GABRIELA SILANG BUILDING (x = 7.0, z = 67.5 — southern heritage academic hall beside Tahanan ng Atleta!)
  const gsBldg = new THREE.Group();
  gsBldg.position.set(7.0, 0, 67.5);
  root.add(gsBldg);
  addContactShadow(gsBldg, 0, 0, 16.5, 11.5);
  addBox(gsBldg, 14.4, 7.6, 9.2, 0, 3.8, 0, matCreamWall);
  addBox(gsBldg, 14.7, 1.2, 9.5, 0, 0.6, 0, matBrickWall);
  addBox(gsBldg, 14.8, 0.3, 9.6, 0, 4.1, 0, matMaroon, false);
  for (const wx of [-4.8, -1.6, 1.6, 4.8]) {
    addBox(gsBldg, 2.2, 1.5, 0.18, wx, 2.35, -4.64, matGlass, false);
    addBox(gsBldg, 2.2, 1.5, 0.18, wx, 5.75, -4.64, matGlass, false);
  }
  // Covered entrance porch on columns facing North
  addBox(gsBldg, 5.2, 0.35, 2.4, 0, 3.6, -5.6, matDarkMaroonRoof);
  addBox(gsBldg, 0.36, 3.5, 0.36, -2.2, 1.75, -6.4, matBrightWhite);
  addBox(gsBldg, 0.36, 3.5, 0.36, 2.2, 1.75, -6.4, matBrightWhite);
  const gsRoofH = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(9.6, 2.2, 4)), matDarkMaroonRoof);
  gsRoofH.rotation.y = Math.PI / 4;
  gsRoofH.scale.set(1.18, 1, 0.78);
  gsRoofH.position.y = 8.7;
  gsRoofH.castShadow = castShadow;
  gsBldg.add(gsRoofH);
  addSignMesh(gsBldg, 8.8, 0.88, 0, 4.35, -4.85, Math.PI, 'GABRIELA SILANG BUILDING', 'PUP ACADEMIC ANNEX', {
    bg: '#5a1214',
    border: '#e5a91a',
  });
  addCollider('gabriela-silang', 7.0, 67.5, 15.0, 10.0);

  // #20 FOOD AND NUTRITION BUILDING (x = -16.5, z = 67.5 — photo-matched to p20_food_nutrition.jpg!)
  const foodGroup = new THREE.Group();
  foodGroup.position.set(-16.5, 0, 67.5);
  root.add(foodGroup);
  addContactShadow(foodGroup, 0, 0, 26.5, 11.6);
  addBox(foodGroup, 24.4, 7.8, 9.0, 0, 3.9, 0, matCreamWall);
  // Crisp horizontal maroon roof & mid-floor fascia bands (exact match to p20_food_nutrition.jpg!)
  addBox(foodGroup, 25.2, 0.55, 10.0, 0, 7.95, 0, matDarkMaroonRoof);
  addBox(foodGroup, 25.0, 0.32, 9.8, 0, 4.1, 0, matMaroon, false);
  // Projecting central open covered entrance portico on 3 concrete steps with bulletin board (p20_food_nutrition.jpg!)
  addBox(foodGroup, 9.6, 0.45, 2.8, 0, 3.85, -5.6, matCreamWall);
  addBox(foodGroup, 9.8, 0.28, 2.95, 0, 4.18, -5.6, matMaroon);
  addBox(foodGroup, 0.55, 3.8, 0.55, -4.4, 1.9, -6.6, matCreamWall);
  addBox(foodGroup, 0.55, 3.8, 0.55, 4.4, 1.9, -6.6, matCreamWall);
  addBox(foodGroup, 9.8, 0.32, 1.2, 0, 0.16, -6.8, matRawConcrete, false);
  // Central lobby bulletin board inside portico
  addBox(foodGroup, 2.6, 1.45, 0.16, 0, 1.75, -5.1, matBrightWhite, false);
  addBox(foodGroup, 2.75, 1.58, 0.12, 0, 1.75, -5.06, matMaroon, false);
  // Recessed dark upper-floor classroom window bays & brown vertical balcony rails (p20_food_nutrition.jpg!)
  for (const fx of [-8.8, -3.2, 3.2, 8.8]) {
    addBox(foodGroup, 4.4, 1.85, 0.2, fx, 5.85, -4.55, matGlass, false);
    addBox(foodGroup, 4.4, 1.15, 0.14, fx, 4.85, -4.82, matWood, false);
  }
  addSignMesh(foodGroup, 10.2, 0.88, 0, 7.25, -4.95, Math.PI, 'FOOD AND NUTRITION BUILDING', 'COLLEGE OF TOURISM & NUTRITION', {
    bg: '#5a1214',
    border: '#e5a91a',
  });
  addCollider('food-nutrition-bldg', -16.5, 67.5, 25.0, 10.0);

  // #21 FACILITY MANAGEMENT OFFICE (FMO) (x = -41.5, z = 67.5 — southern operations building + campus utility van!)
  const fmoGroup = new THREE.Group();
  fmoGroup.position.set(-41.5, 0, 67.5);
  root.add(fmoGroup);
  addContactShadow(fmoGroup, 0, 0, 19.2, 11.4);
  addBox(fmoGroup, 17.4, 7.2, 9.0, 0, 3.6, 0, matCreamWall);
  addBox(fmoGroup, 18.0, 0.6, 9.8, 0, 7.45, 0, matDarkMaroonRoof);
  addBox(fmoGroup, 17.6, 0.3, 9.3, 0, 3.7, 0, matMaroon, false);
  for (const wx of [-5.8, -1.8, 2.2, 6.2]) {
    addBox(fmoGroup, 2.8, 1.5, 0.18, wx, 5.4, -4.55, matGlass, false);
    addBox(fmoGroup, 2.8, 1.6, 0.18, wx, 2.1, -4.55, matGlass, false);
  }
  // Covered maintenance loading canopy + parked white PUP utility service van
  addBox(fmoGroup, 5.2, 0.25, 2.6, -5.2, 3.5, -5.7, matDarkSteel, false);
  addBox(fmoGroup, 1.9, 1.65, 4.2, -5.2, 1.0, -5.9, matBrightWhite, false);
  addBox(fmoGroup, 1.94, 0.5, 1.2, -5.2, 1.35, -7.4, matGlass, false);
  addSignMesh(fmoGroup, 9.4, 0.85, 1.2, 6.85, -4.65, Math.PI, 'FACILITY MANAGEMENT OFFICE', 'CAMPUS MAINTENANCE · FMO', {
    bg: '#4b2a1c',
    border: '#e5a91a',
  });
  addCollider('facility-mgmt-office', -41.5, 67.5, 18.0, 10.0);

  // #22 SAMPAGUITA BUILDING — UNIVERSITY CANTEEN (x = -58.0, z = 12.0 — photo-matched to p22_sampaguita.jpg & bj_univcanteen.jpg!)
  const sampaGroup = new THREE.Group();
  sampaGroup.position.set(-58.0, 0, 12.0);
  root.add(sampaGroup);
  addContactShadow(sampaGroup, 0, 0, 11.2, 14.8);
  // White lower University Canteen floor with wide gridded glass windows (bj_univcanteen.jpg!)
  addBox(sampaGroup, 8.2, 3.6, 12.2, 0, 1.8, 0, matBrightWhite);
  addBox(sampaGroup, 0.22, 2.1, 9.8, 4.12, 1.85, 0, matGlass, false);
  // Iconic projecting cantilevered terracotta-orange/maroon sloped mid-floor balcony ribbon (bj_univcanteen.jpg!)
  addBox(sampaGroup, 9.4, 1.65, 13.4, 0.2, 4.45, 0, matTerracottaWall);
  addBox(sampaGroup, 8.8, 1.85, 12.6, 0, 6.0, 0, matGlass, false);
  addBox(sampaGroup, 9.2, 1.25, 13.0, 0, 7.4, 0, matTerracottaWall);
  // Iconic Slate-Blue Vertical Stairwell Bay with Full-Height Gridded Window on South flank (p22_sampaguita.jpg!)
  addBox(sampaGroup, 3.6, 8.4, 2.6, -2.4, 4.2, 5.4, matSlateBlue);
  addBox(sampaGroup, 1.8, 6.8, 0.22, -2.4, 4.0, 6.75, matGlass, false);
  // Split Clerestory Overhanging Maroon Metal Roof (exact silhouette of p22_sampaguita.jpg & bj_univcanteen.jpg!)
  const sRoof1 = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(5.6, 0.26, 14.0)), matDarkMaroonRoof);
  sRoof1.position.set(-2.2, 9.1, 0);
  sRoof1.rotation.z = 0.24;
  sRoof1.castShadow = castShadow;
  const sRoof2 = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(5.8, 0.26, 14.0)), matDarkMaroonRoof);
  sRoof2.position.set(2.3, 8.65, 0);
  sRoof2.rotation.z = -0.22;
  sRoof2.castShadow = castShadow;
  sampaGroup.add(sRoof1, sRoof2);
  // Covered ground-floor canteen awning & student dining tables on East apron
  addBox(sampaGroup, 2.2, 0.18, 9.4, 5.1, 3.25, 0, matDarkSteel, false);
  for (const tz of [-2.8, 0, 2.8]) {
    addBox(sampaGroup, 1.1, 0.72, 1.5, 5.1, 0.36, tz, matMaroon, false);
  }
  addSignMesh(sampaGroup, 9.2, 0.92, 4.95, 4.45, 0, Math.PI / 2, 'SAMPAGUITA BUILDING', 'PUP UNIVERSITY CANTEEN', {
    bg: '#7b1718',
    border: '#f2ca68',
  });
  addCollider('sampaguita-bldg', -58.0, 12.0, 9.0, 13.0);

  // #23 PUP STUDENT CENTER (x = -40.5, z = -20.5 — photo-matched to p23_student_center.jpg!)
  const scGroup = new THREE.Group();
  scGroup.position.set(-40.5, 0, -20.5);
  root.add(scGroup);
  addContactShadow(scGroup, 0, 0, 9.2, 9.6);
  addBox(scGroup, 7.2, 10.6, 7.8, 0, 5.3, 0, matBrightWhite);
  // Recessed dark corridor floors with vibrant terracotta-orange balcony spandrels (p23_student_center.jpg!)
  for (const fy of [3.4, 6.4, 9.2]) {
    addBox(scGroup, 7.45, 1.35, 6.8, 0, fy - 0.85, 0, matDarkShadow, false);
    addBox(scGroup, 7.55, 0.55, 7.4, 0, fy, 0, matRedOrangeTrim, false);
  }
  addBox(scGroup, 1.8, 0.75, 4.6, 4.2, 3.2, 0, matRedOrangeTrim); // Projecting orange entrance canopy
  addSignMesh(scGroup, 6.2, 0.82, 3.72, 10.0, 0, Math.PI / 2, 'PUP STUDENT CENTER', 'STUDENT AFFAIRS & CANTEEN', {
    bg: '#f2eee6',
    border: '#c84b28',
    titleColor: '#561012',
    subtitleColor: '#3a3532',
  });
  addCollider('student-center', -40.5, -20.5, 7.6, 8.2);

  // #27 PUP PRINTING PRESS BUILDING (x = -59.5, z = -58.5 — photo-matched to p27_printing_press.jpg!)
  const pressGroup = new THREE.Group();
  pressGroup.position.set(-59.5, 0, -58.5);
  root.add(pressGroup);
  addContactShadow(pressGroup, 0, 0, 14.5, 10.4);
  addBox(pressGroup, 12.2, 7.6, 7.6, 0, 3.8, -0.5, matCreamWall);
  // Shaded ground & 2nd-floor colonnade porch along South face with black railings & accessible ramp (p27_printing_press.jpg!)
  addBox(pressGroup, 12.4, 0.34, 2.2, 0, 3.85, 3.6, matCreamWall);
  addBox(pressGroup, 12.4, 0.95, 0.12, 0, 4.5, 4.4, matDarkSteel, false);
  for (const px of [-5.8, -2.0, 2.0, 5.8]) {
    addBox(pressGroup, 0.42, 7.6, 0.42, px, 3.8, 4.35, matCreamWall);
  }
  for (const wx of [-4.0, 0, 4.0]) {
    addBox(pressGroup, 2.4, 1.65, 0.2, wx, 2.1, 3.35, matGlass, false);
    addBox(pressGroup, 2.4, 1.65, 0.2, wx, 5.65, 3.35, matGlass, false);
  }
  addBox(pressGroup, 13.0, 0.65, 9.6, 0, 7.9, 0.2, matDarkMaroonRoof);
  addSignMesh(pressGroup, 8.2, 0.85, 0, 3.88, 4.74, 0, 'PUP PRINTING PRESS BUILDING', 'UNIVERSITY PUBLICATIONS & PRESS', {
    bg: '#f2eee6',
    border: 'none',
    titleColor: '#282c30',
    subtitleColor: '#7b1718',
  });
  addCollider('printing-press', -59.5, -58.5, 13.0, 9.0);

  // #28 PROPERTY & SUPPLY MANAGEMENT OFFICE (PSMO) + WATER PUMP FACILITY (x = -44.0, z = -68.5 — photo-matched to bj_waterpump.jpg!)
  const psmoGroup = new THREE.Group();
  psmoGroup.position.set(-44.0, 0, -68.5);
  root.add(psmoGroup);
  addContactShadow(psmoGroup, 0, 0, 16.2, 8.4);
  // Left wing: PSMO warehouse & office hall
  addBox(psmoGroup, 9.6, 6.2, 6.4, -2.6, 3.1, 0, matCreamWall);
  addBox(psmoGroup, 10.0, 0.55, 6.9, -2.6, 6.45, 0, matDarkMaroonRoof);
  addBox(psmoGroup, 7.6, 1.5, 0.2, -2.6, 4.4, 3.24, matGlass, false);
  addBox(psmoGroup, 2.8, 2.6, 0.2, -2.6, 1.35, 3.24, matDarkSteel, false); // Roll-up supply bay door
  addSignMesh(psmoGroup, 7.8, 0.8, -2.6, 5.8, 3.32, 0, 'PROPERTY & SUPPLY OFFICE', 'PSMO · UNIVERSITY SUPPLY', {
    bg: '#5a1214',
    border: '#e5a91a',
  });
  // Right wing: Exposed Industrial Water Pump Facility (bj_waterpump.jpg: blue motors, orange couplings, red overhead manifold!)
  addBox(psmoGroup, 4.8, 0.45, 5.4, 5.0, 0.22, 0, matRawConcrete, false);
  addBox(psmoGroup, 4.4, 0.16, 0.16, 5.0, 2.8, 0, matBrickWall, false); // Overhead manifold header
  for (let px = 3.4; px <= 6.6; px += 1.05) {
    addBox(psmoGroup, 0.65, 0.65, 1.25, px, 0.78, 0.4, matPumpBlue, false);
    addBox(psmoGroup, 0.42, 0.42, 0.35, px, 0.78, -0.35, matHoopOrange, false);
    const pipe = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.11, 0.11, 2.1, 8)), matBrickWall);
    pipe.position.set(px, 1.8, 0);
    psmoGroup.add(pipe);
  }
  addCollider('psmo-water-pump', -44.0, -68.5, 15.0, 7.0);

  // #34 NFTRDC (NUTRITION & FOOD TECHNOLOGY RESEARCH & DEVELOPMENT CENTER) (x = -12.0, z = -66.5 — photo-matched to p34_nftrdc.jpg!)
  const nftrdcGroup = new THREE.Group();
  nftrdcGroup.position.set(-12.0, 0, -66.5);
  root.add(nftrdcGroup);
  addContactShadow(nftrdcGroup, 0, 0, 12.6, 10.4);
  addBox(nftrdcGroup, 10.6, 10.8, 8.6, 0, 5.4, 0, matCreamWall);
  // Signature bold rounded vertical concrete columns + terracotta-red spandrels under gridded lab windows (p34_nftrdc.jpg!)
  for (const cx of [-4.6, -1.6, 1.6, 4.6]) {
    const rCol = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.45, 0.45, 10.4, 12)), matCreamWall);
    rCol.position.set(cx, 5.2, 4.4);
    nftrdcGroup.add(rCol);
  }
  for (const fy of [4.2, 7.4]) {
    addBox(nftrdcGroup, 9.8, 0.9, 0.25, 0, fy - 0.6, 4.25, matLabRed, false);
    addBox(nftrdcGroup, 9.6, 1.4, 0.2, 0, fy + 0.55, 4.22, matGlass, false);
  }
  // Projecting flat concrete entrance canopy & roof parapet (p34_nftrdc.jpg!)
  addBox(nftrdcGroup, 5.4, 0.55, 2.4, 0, 3.25, 5.4, matBrightWhite);
  addBox(nftrdcGroup, 11.2, 1.1, 9.2, 0, 10.9, 0, matCreamWall);
  addBox(nftrdcGroup, 11.3, 0.3, 9.3, 0, 11.55, 0, matDarkMaroonRoof);
  addSignMesh(nftrdcGroup, 9.2, 0.88, 0, 10.8, 4.65, 0, 'NFTRDC RESEARCH CENTER', 'FOOD & NUTRITION TECHNOLOGY', {
    bg: '#f2eee6',
    border: '#7b1718',
    titleColor: '#561012',
    subtitleColor: '#3a3532',
  });
  addCollider('nftrdc-bldg', -12.0, -66.5, 11.0, 9.0);

  // #36 PUP TAHANAN NG ALUMNI (x = 17.5, z = -24.5 — photo-matched to p36_tahanan_alumni.jpg & p35_chk.jpg!)
  const alumniGroup = new THREE.Group();
  alumniGroup.position.set(17.5, 0, -24.5);
  root.add(alumniGroup);
  addContactShadow(alumniGroup, 0, 0, 9.6, 10.8);
  // Iconic 3-storey warm golden-ochre alumni building with 4 bold full-height maroon vertical pilasters (p36_tahanan_alumni.jpg!)
  addBox(alumniGroup, 7.6, 10.2, 8.6, 0, 5.1, 0, matAlumniOchre);
  for (const pz of [-3.9, -1.35, 1.35, 3.9]) {
    addBox(alumniGroup, 0.48, 9.6, 0.42, -3.92, 4.8, pz, matMaroon);
  }
  // Dark tinted window bays on ground & 2nd floor + recessed glass lobby entrance facing West toward Plaza (p36_tahanan_alumni.jpg!)
  for (const wy of [2.1, 5.5]) {
    addBox(alumniGroup, 0.22, 2.1, 2.0, -3.84, wy, -2.6, matGlass, false);
    addBox(alumniGroup, 0.22, 2.1, 2.2, -3.84, wy, 0, matGlass, false);
    addBox(alumniGroup, 0.22, 2.1, 2.0, -3.84, wy, 2.6, matGlass, false);
    // Thin horizontal maroon sunshade eyebrow ledges over each window bay
    addBox(alumniGroup, 0.55, 0.16, 7.6, -4.05, wy + 1.15, 0, matDarkMaroonRoof, false);
  }
  // Upper clerestory glass band + cantilevered flat white/maroon roof eave (exact silhouette of p36_tahanan_alumni.jpg!)
  addBox(alumniGroup, 7.8, 1.0, 7.2, 0, 9.1, 0, matGlass, false);
  addBox(alumniGroup, 8.8, 0.42, 9.8, -0.2, 10.3, 0, matBrightWhite);
  addBox(alumniGroup, 8.95, 0.22, 9.95, -0.2, 10.58, 0, matDarkMaroonRoof);
  // Entry terrace steps & crisp raised white "PUP TAHANAN NG ALUMNI" lettering
  addBox(alumniGroup, 1.2, 0.36, 4.4, -4.3, 0.18, 0, matRawConcrete, false);
  addSignMesh(alumniGroup, 7.6, 0.85, -4.05, 8.2, 0, -Math.PI / 2, 'PUP TAHANAN NG ALUMNI', 'FEDAAPI · ALUMNI CENTER', {
    bg: '#d99b44',
    border: 'none',
    titleColor: '#ffffff',
    subtitleColor: '#4e1616',
  });
  addCollider('tahanan-ng-alumni', 17.5, -24.5, 8.0, 9.0);

  // CAMPUS DIRECTIONAL WAYFINDING SIGNPOSTS at key pedestrian intersections
  const addWayfinder = (wx: number, wz: number, rotY: number) => {
    const wg = new THREE.Group();
    wg.position.set(wx, 0, wz);
    wg.rotation.y = rotY;
    addBox(wg, 0.12, 2.6, 0.12, 0, 1.3, 0, matDarkSteel, false);
    addBox(wg, 1.1, 0.26, 0.08, 0.45, 2.32, 0, matMaroon, false);
    addBox(wg, 1.1, 0.26, 0.08, -0.45, 1.98, 0, matGold, false);
    addBox(wg, 1.1, 0.26, 0.08, 0.45, 1.64, 0, matMaroon, false);
    root.add(wg);
  };
  addWayfinder(26, -11, 0.3);
  addWayfinder(-2, 24, 0);
  addWayfinder(-46, 2, -0.4);
  addWayfinder(6, -34, 0);

  // =========================================================================
  // 14. INTERACTIVE BENCHES (White-and-Black Freedom Park Style!), PLAQUES & LAMPS
  // =========================================================================
  function addCampusBench(id: string, label: string, x: number, z: number, rotY: number) {
    const bg = new THREE.Group();
    bg.position.set(x, 0, z);
    bg.rotation.y = rotY;
    addContactShadow(bg, 0, 0, 2.8, 1.5);
    // White sculpted concrete end legs + dark slatted seat & backrest (matches freedompark.jpg!)
    addBox(bg, 0.22, 0.72, 0.65, -0.95, 0.36, 0, matBrightWhite, false);
    addBox(bg, 0.22, 0.72, 0.65, 0.95, 0.36, 0, matBrightWhite, false);
    addBox(bg, 2.0, 0.1, 0.52, 0, 0.48, 0.04, matDarkSteel, false);
    addBox(bg, 2.0, 0.44, 0.09, 0, 0.8, -0.22, matDarkSteel, false);
    root.add(bg);
    benches.push({ id, label, sitPosition: new THREE.Vector3(x, 0, z), sitYaw: rotY });
  }

  addCampusBench('bench-fp-1', 'Freedom Park Bench', 8, 8, Math.PI * 0.25);
  addCampusBench('bench-fp-2', 'Freedom Park Bench', 2, 16, 0);
  addCampusBench('bench-fp-3', 'Freedom Park Bench', 11, 14, -Math.PI * 0.3);
  addCampusBench('bench-lagoon-1', 'Lagoon Brick Plaza Bench', -6, -16, Math.PI / 2);
  addCampusBench('bench-lagoon-2', 'Lagoon Waterside Bench', -10, -22, 0);
  addCampusBench('bench-chapel-1', 'Interfaith Chapel Garden Bench', 8, 36, Math.PI * 0.75);
  addCampusBench('bench-linear-1', 'Linear Park Pasig River Bench', -67, -2, -Math.PI / 2);
  addCampusBench('bench-linear-2', 'Linear Park Pasig River Bench', -67, 22, -Math.PI / 2);

  // Inspectable Plaques & Notice Boards synced directly with INSPECTABLE_ITEMS
  for (const item of INSPECTABLE_ITEMS) {
    inspectables.push({ item, position: new THREE.Vector3(item.position.x, item.position.y, item.position.z) });
    if (item.kind === 'plaque') {
      const pg = new THREE.Group();
      pg.position.set(item.position.x, 0, item.position.z);
      addBox(pg, 0.82, 1.15, 0.42, 0, 0.58, 0, matIntramuros);
      addBox(pg, 0.92, 0.12, 0.56, 0, 1.2, 0, matGold, false);
      root.add(pg);
    } else if (item.kind === 'board' && item.id !== 'board-north-wing-dpwh') {
      const brd = new THREE.Group();
      brd.position.set(item.position.x, 0, item.position.z);
      addBox(brd, 0.15, 2.2, 0.15, -1.1, 1.1, 0, matDarkSteel, false);
      addBox(brd, 0.15, 2.2, 0.15, 1.1, 1.1, 0, matDarkSteel, false);
      addBox(brd, 2.5, 1.35, 0.16, 0, 1.75, 0, matMaroon);
      addBox(brd, 2.25, 1.12, 0.2, 0, 1.75, 0, matCreamWall, false);
      root.add(brd);
    }
  }

  // Campus & Teresa St. Lamp Posts with Warm Dusk & Night Lanterns (6 strategic PointLights keep SwiftShader fast!)
  const lampPositions: Array<[number, number, boolean]> = [
    [68.0, -9.8, true],  // Main Gate & Guardhouse uplight wash (cleanly behind recessed arch!)
    [54, -8.8, true],    // University Ave & Catwalks
    [34, -8.8, false],
    [25.6, -1.2, true],  // PUP Obelisk & Mabini Monument floodlight (cleanly outside 10.8m roundabout curb!)
    [14, 8.8, false],
    [-8, -14, true],     // PUP Lagoon Plaza & Fort Santiago Arch
    [-12, 30, true],     // Main Building East Wing & Freedom Park
    [-66, 8, false],     // Linear Park Pasig River
    [28, 22, false],     // Grandstand / Mabini road
    [-22, -32, false],   // NALLRC plaza
    [146, -9.2, true],   // Mid-Teresa Street (Chapel & Eatery strip) warm night illumination
    [184, 1.4, false],   // East Teresa Street toward Old Sta. Mesa
    [60, 6.2, false],    // South Catwalk / Mabini path
  ];
  for (const [lx, lz, hasLight] of lampPositions) {
    const pole = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.06, 0.11, 5.2, 8)), matDarkSteel);
    pole.position.set(lx, 2.6, lz);
    root.add(pole);
    const bulbMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xfff0cc,
        emissive: 0xffc766,
        emissiveIntensity: 0.15,
        roughness: 0.2,
      }),
    );
    lampBulbs.push(bulbMat);
    const lantern = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.3, 10, 8)), bulbMat);
    lantern.position.set(lx, 5.3, lz);
    root.add(lantern);
    if (hasLight) {
      const pl = new THREE.PointLight(0xffbe63, 0, 34, 1.55);
      pl.position.set(lx, 5.2, lz);
      root.add(pl);
      lampLights.push(pl);
    }
  }

  // Procedural Manila Night Sky Group (700 twinkling stars + luminous crescent/full moon — visible at Dusk/Night!)
  const nightSkyGroup = new THREE.Group();
  nightSkyGroup.visible = false;
  const starCount = 700;
  const starPos = new Float32Array(starCount * 3);
  const starCol = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(0.16 + Math.random() * 0.84); // Overhead hemisphere above Manila skyline
    const r = 340 + Math.random() * 40;
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.cos(phi);
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    const tint = 0.82 + Math.random() * 0.18;
    starCol[i * 3] = tint;
    starCol[i * 3 + 1] = tint;
    starCol[i * 3 + 2] = Math.min(1, tint + (i % 4 === 0 ? 0.12 : 0));
  }
  const starGeo = trackGeo(new THREE.BufferGeometry());
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
  const starMat = trackMat(
    new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      fog: false,
      depthWrite: false,
    }),
  );
  const nightStars = new THREE.Points(starGeo, starMat);
  nightSkyGroup.add(nightStars);

  // Soft Luminous Manila Full Moon hovering above the western Pasig skyline
  const moonMesh = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(9.5, 16, 12)),
    trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xf4f0dc,
        fog: false,
      }),
    ),
  );
  moonMesh.position.set(-195, 155, -135);
  nightSkyGroup.add(moonMesh);
  const moonHalo = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(16.5, 16, 12)),
    trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x8fb8e8,
        transparent: true,
        opacity: 0.16,
        fog: false,
        depthWrite: false,
      }),
    ),
  );
  moonHalo.position.copy(moonMesh.position);
  nightSkyGroup.add(moonHalo);
  root.add(nightSkyGroup);

  // =========================================================================
  // 15. LUSH MANILA ACACIA / RAIN TREES & MULTI-FROND ROYAL PALMS (InstancedMesh!)
  //     All trunks verified clear of Catwalks, Mabini Shrine, Water Tower & Wings!
  // =========================================================================
  const acaciaCoords: Array<[number, number, number]> = [
    // Iconic overarching Acacia canopy framing the Main Gate lintel & Twin Catwalks (matches 2022/2026 gate photos!)
    [73.8, -14.6, 1.28], [74.0, 8.2, 1.32], [56, -15.4, 1.25], [44, -15.4, 1.25], [32, -15.4, 1.2],
    [66, 7.2, 1.25], [50.2, 7.2, 1.2], [29, 7.2, 1.15],
    // Dense green canopy shading the redeveloped PUP Lagoon (lagoon_1_2026.jpg!)
    [-6, -24, 1.25], [-14, -27, 1.35], [-26, -26, 1.25], [-24, -8, 1.2], [-8, -6, 1.15],
    // Tree-lined circular garden surrounding the Interfaith Chapel (kept clear of Main Building East Wing entrance!)
    [-12, 52, 1.05], [-16, 46, 1.08], [-10, 54.5, 1.05], [5, 57, 1.1], [13, 48, 1.1], [12, 34, 1.05],
    // Mabini Shrine & Museum border trees (cleanly flanking Mabini Museum & Shrine!)
    [18.2, 14.5, 1.05], [50.8, 14.5, 1.1], [29.5, 20.5, 1.05],
    // Around NALLRC, Gym, Oval, Southern Strip & Linear Park (cleanly clear of all new buildings!)
    [-43, -46, 1.15], [-10, -54, 1.15], [6, -54, 1.15],
    [66, 22, 1.2], [68, 46, 1.15], [58, 66, 1.1], [16.5, 58.0, 1.1],
    [-68, -26, 1.05], [-68, 28, 1.1], [-66, 48, 1.15],
  ];

  const trunkMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x4b3a2b, roughness: 0.94 }));
  const canopyMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, flatShading: true }),
  );

  const trunkGeo = trackGeo(new THREE.CylinderGeometry(0.28, 0.54, 4.6, 8));
  const branchGeo = trackGeo(new THREE.CylinderGeometry(0.11, 0.24, 3.4, 6));
  const canopyGeo = trackGeo(new THREE.IcosahedronGeometry(2.35, 1));
  const shadowPlaneGeo = trackGeo(new THREE.PlaneGeometry(1, 1));
  shadowPlaneGeo.rotateX(-Math.PI / 2);

  const nTrees = acaciaCoords.length;
  const clustersPerTree = 7;
  const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, nTrees);
  const branchInst = new THREE.InstancedMesh(branchGeo, trunkMat, nTrees * 3);
  const canopyInst = new THREE.InstancedMesh(canopyGeo, canopyMat, nTrees * clustersPerTree);
  const treeShadowInst = new THREE.InstancedMesh(shadowPlaneGeo, matContactShadow, nTrees);
  trunkInst.castShadow = castShadow;
  canopyInst.castShadow = castShadow;
  canopyInst.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const cColor = new THREE.Color();
  // Rich Manila Acacia foliage shading: deep under-canopy shade -> tropical emerald -> sunlit crown highlights
  const shadeTones = [0x1f4520, 0x265224, 0x2c5c29];
  const midTones = [0x33692c, 0x3b7430, 0x2f632a];
  const sunTones = [0x478436, 0x528f3c, 0x3f7c33];

  let bIdx = 0;
  let cIdx = 0;
  acaciaCoords.forEach(([tx, tz, sc], i) => {
    // Trunk
    dummy.position.set(tx, 2.25 * sc, tz);
    dummy.rotation.set(0, i * 1.1, 0);
    dummy.scale.set(sc, sc, sc);
    dummy.updateMatrix();
    trunkInst.setMatrixAt(i, dummy.matrix);

    // Soft ground contact shadow under every Acacia tree
    dummy.position.set(tx, 0.056, tz);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(9.8 * sc, 1, 9.8 * sc);
    dummy.updateMatrix();
    treeShadowInst.setMatrixAt(i, dummy.matrix);

    // 3 spreading angled boughs
    for (let b = 0; b < 3; b++) {
      const ang = (b / 3) * Math.PI * 2 + i * 0.7;
      dummy.position.set(tx + Math.cos(ang) * 1.05 * sc, 4.65 * sc, tz + Math.sin(ang) * 1.05 * sc);
      dummy.rotation.set(Math.sin(ang) * 0.68, 0, -Math.cos(ang) * 0.68);
      dummy.scale.set(sc, sc, sc);
      dummy.updateMatrix();
      branchInst.setMatrixAt(bIdx++, dummy.matrix);
    }

    // 7 organic layered umbrella foliage clusters (deep inner shade + spreading outer boughs + sunlit top crown)
    const offsets: Array<[number, number, number, number, number, 'shade' | 'mid' | 'sun']> = [
      [0, 5.4, 0, 1.55, 0.52, 'shade'],
      [2.2, 5.75, 1.3, 1.12, 0.56, 'mid'],
      [-2.3, 5.7, 1.15, 1.08, 0.54, 'mid'],
      [0.3, 5.8, -2.35, 1.14, 0.56, 'mid'],
      [-1.3, 6.25, -1.35, 1.02, 0.58, 'sun'],
      [1.4, 6.35, -0.7, 0.98, 0.56, 'sun'],
      [0.1, 6.85, 0.4, 1.24, 0.54, 'sun'],
    ];
    offsets.forEach(([ox, oy, oz, sx, sy, tier], oi) => {
      dummy.position.set(tx + ox * sc, oy * sc, tz + oz * sc);
      dummy.rotation.set((oi % 3) * 0.22, (i + oi) * 1.15, (oi % 2) * 0.18);
      dummy.scale.set(sx * sc, sy * sc, sx * sc);
      dummy.updateMatrix();
      canopyInst.setMatrixAt(cIdx, dummy.matrix);
      const palette = tier === 'shade' ? shadeTones : tier === 'mid' ? midTones : sunTones;
      cColor.setHex(palette[(i + oi) % palette.length]);
      canopyInst.setColorAt(cIdx, cColor);
      cIdx++;
    });
  });

  trunkInst.instanceMatrix.needsUpdate = true;
  branchInst.instanceMatrix.needsUpdate = true;
  canopyInst.instanceMatrix.needsUpdate = true;
  if (canopyInst.instanceColor) canopyInst.instanceColor.needsUpdate = true;
  treeShadowInst.instanceMatrix.needsUpdate = true;
  trunkInst.computeBoundingSphere();
  branchInst.computeBoundingSphere();
  canopyInst.computeBoundingSphere();
  treeShadowInst.computeBoundingSphere();
  root.add(trunkInst, branchInst, canopyInst, treeShadowInst);

  // Ornamental Royal Palms (tapered arched two-tier fronds flanking NALLRC, Interfaith Chapel & Linear Park!)
  const palmCoords: Array<[number, number, number]> = [
    [-29, -31.5, 0.95], [-19, -31.5, 0.95],
    [-6.5, 30.2, 0.92], [2.5, 30.2, 0.92], [10, 42, 0.95],
    [-64, -12, 1.05], [-64, 4, 1.0], [-64, 22, 1.05],
    [22.6, -19.0, 0.95], [12.5, -29.5, 0.95],
  ];
  const palmTrunkGeo = trackGeo(new THREE.CylinderGeometry(0.14, 0.25, 6.2, 8));
  const palmCrownGeo = trackGeo(new THREE.CylinderGeometry(0.17, 0.16, 1.15, 8));
  // Tapered leaf-blade frond geometry (pointed tip, natural width)
  const frondGeo = trackGeo(new THREE.ConeGeometry(0.32, 3.0, 4));
  frondGeo.rotateX(Math.PI / 2);
  frondGeo.scale(1.15, 0.18, 1.0);
  frondGeo.translate(0, 0, 1.45);

  const palmTrunkMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x7b7265, roughness: 0.9 }));
  const palmCrownMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x3b6e35, roughness: 0.78 }));
  const frondMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82, flatShading: true }),
  );

  const nPalms = palmCoords.length;
  const frondsPerPalm = 10;
  const pTrunks = new THREE.InstancedMesh(palmTrunkGeo, palmTrunkMat, nPalms);
  const pCrowns = new THREE.InstancedMesh(palmCrownGeo, palmCrownMat, nPalms);
  const pFronds = new THREE.InstancedMesh(frondGeo, frondMat, nPalms * frondsPerPalm);
  pTrunks.castShadow = castShadow;
  pFronds.castShadow = castShadow;

  let pfIdx = 0;
  palmCoords.forEach(([px, pz, sc], i) => {
    dummy.position.set(px, 3.1 * sc, pz);
    dummy.rotation.set(0, i * 0.8, 0);
    dummy.scale.set(sc, sc, sc);
    dummy.updateMatrix();
    pTrunks.setMatrixAt(i, dummy.matrix);

    dummy.position.set(px, 6.5 * sc, pz);
    dummy.scale.set(sc, sc, sc);
    dummy.updateMatrix();
    pCrowns.setMatrixAt(i, dummy.matrix);

    for (let f = 0; f < frondsPerPalm; f++) {
      const upperTier = f >= 6;
      const tierCount = upperTier ? 4 : 6;
      const tierIdx = upperTier ? f - 6 : f;
      const yaw = (tierIdx / tierCount) * Math.PI * 2 + (upperTier ? 0.45 : 0) + i * 0.5;
      const droopPitch = upperTier ? -0.18 : 0.34;
      dummy.position.set(px, (upperTier ? 7.0 : 6.82) * sc, pz);
      dummy.rotation.set(droopPitch, yaw, 0, 'YXZ');
      dummy.scale.set(sc * (upperTier ? 0.82 : 1.05), sc, sc * (upperTier ? 0.82 : 1.05));
      dummy.updateMatrix();
      pFronds.setMatrixAt(pfIdx, dummy.matrix);
      cColor.setHex(upperTier ? 0x4f913e : f % 2 === 0 ? 0x336e2c : 0x3e7e34);
      pFronds.setColorAt(pfIdx, cColor);
      pfIdx++;
    }
  });
  pTrunks.instanceMatrix.needsUpdate = true;
  pCrowns.instanceMatrix.needsUpdate = true;
  pFronds.instanceMatrix.needsUpdate = true;
  if (pFronds.instanceColor) pFronds.instanceColor.needsUpdate = true;
  pTrunks.computeBoundingSphere();
  pCrowns.computeBoundingSphere();
  pFronds.computeBoundingSphere();
  root.add(pTrunks, pCrowns, pFronds);

  // =========================================================================
  // ZERO-TRADEOFF LOSSLESS STATIC MESH MERGING PASS
  // Collapses ~3,000+ static campus meshes sharing identical (material, shadow)
  // states into ~90–130 GPU draw calls with 100% identical visuals & lighting!
  // =========================================================================
  const protectedSubtrees = new Set<THREE.Object3D>([nightSkyGroup, craneJib]);
  for (const d of doors) {
    protectedSubtrees.add(d.leftPivot);
    protectedSubtrees.add(d.rightPivot);
  }
  const protectedMeshes = new Set<THREE.Object3D>([...animatedFlags, ...waterMeshes]);

  const isInsideProtected = (obj: THREE.Object3D): boolean => {
    let cur: THREE.Object3D | null = obj;
    while (cur) {
      if (protectedSubtrees.has(cur) || protectedMeshes.has(cur)) return true;
      if (!cur.visible) return true;
      cur = cur.parent;
    }
    return false;
  };

  root.updateMatrixWorld(true);

  interface MergeBucket {
    material: THREE.Material;
    castShadow: boolean;
    receiveShadow: boolean;
    renderOrder: number;
    meshes: THREE.Mesh[];
  }
  const buckets = new Map<string, MergeBucket>();
  let originalStaticMeshes = 0;

  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    if (!obj.visible) return;
    if (obj instanceof THREE.InstancedMesh) return;
    if (Array.isArray(obj.material)) return;
    if (obj.userData?.noMerge) return;
    if (isInsideProtected(obj)) return;

    const mat = obj.material as THREE.Material;
    // Preserve depth-sorted transparent meshes (only batch opaque or flat depthWrite:false decals)
    if (mat.transparent && mat.depthWrite !== false) return;
    // Skip negative-determinant mirrored matrices to preserve triangle winding
    if (obj.matrixWorld.determinant() < 0) return;

    const geo = obj.geometry;
    if (!geo || !geo.attributes?.position) return;

    const hasNormal = Boolean(geo.attributes.normal);
    const hasUv = Boolean(geo.attributes.uv);
    const key = `${mat.uuid}|${obj.castShadow ? 1 : 0}|${obj.receiveShadow ? 1 : 0}|${obj.renderOrder}|${hasNormal ? 1 : 0}|${hasUv ? 1 : 0}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        material: mat,
        castShadow: obj.castShadow,
        receiveShadow: obj.receiveShadow,
        renderOrder: obj.renderOrder,
        meshes: [],
      };
      buckets.set(key, bucket);
    }
    bucket.meshes.push(obj);
    originalStaticMeshes++;
  });

  const mergedStaticGroup = new THREE.Group();
  mergedStaticGroup.name = 'PUP_Merged_Static_Batches';
  let mergedStaticBatches = 0;

  for (const bucket of buckets.values()) {
    if (bucket.meshes.length < 2) continue;

    const clonedGeos: THREE.BufferGeometry[] = [];

    for (const m of bucket.meshes) {
      const src = m.geometry;
      const g = src.index ? src.toNonIndexed() : src.clone();
      // Keep only standard position/normal/uv attributes so mergeGeometries never rejects mismatched extra attrs
      for (const attrName of Object.keys(g.attributes)) {
        if (attrName !== 'position' && attrName !== 'normal' && attrName !== 'uv') {
          g.deleteAttribute(attrName);
        }
      }
      g.applyMatrix4(m.matrixWorld);
      clonedGeos.push(g);
    }

    const merged = mergeGeometries(clonedGeos, false);
    for (const cg of clonedGeos) cg.dispose();

    if (merged) {
      merged.computeBoundingSphere();
      trackGeo(merged);
      const batchMesh = new THREE.Mesh(merged, bucket.material);
      batchMesh.castShadow = bucket.castShadow;
      batchMesh.receiveShadow = bucket.receiveShadow;
      batchMesh.renderOrder = bucket.renderOrder;
      mergedStaticGroup.add(batchMesh);
      mergedStaticBatches++;

      for (const m of bucket.meshes) {
        m.parent?.remove(m);
      }
    }
  }
  root.add(mergedStaticGroup);

  return {
    root,
    colliders,
    doors,
    benches,
    inspectables,
    lampLights,
    lampBulbs,
    emissiveWindowMats,
    nightSkyGroup,
    animatedFlags,
    craneJib,
    waterMeshes,
    waterTimeUniform,
    perfStats: {
      originalStaticMeshes,
      mergedStaticBatches,
    },
    dispose: () => {
      for (const g of ownedGeometries) g.dispose();
      for (const m of ownedMaterials) m.dispose();
      for (const t of ownedTextures) t.dispose();
      clearSignTextureCache();
    },
  };
}
