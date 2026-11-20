import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Sky } from 'three/addons/objects/Sky.js';
import {
  CAMPUS_LANDMARKS,
  CampusLandmark,
  InspectableItem,
  NpcProfile,
  PLAYER_SPAWN,
  TimeOfDayPreset,
  WeatherPreset,
} from '../campus/campusData';
import {
  dampAngle,
  findNearestLandmark,
  getSurfaceTypeAt,
  resolveCircleAABBCollisions,
  stepHorizontalVelocity,
} from '../campus/campusLogic';
import { CampusAudioEngine } from './audioEngine';
import { buildPupCampusWorld, BuiltCampusWorld } from './campusBuilder';
import {
  animateHumanWalk,
  ArticulatedHuman,
  buildArticulatedHuman,
  createNpcSystem,
  NpcSystemHandle,
} from './npcSystem';
import { createCampusTextures, CampusTextureSet } from './textures';

export type CameraPerspective = 'first-person' | 'third-person';
export type GraphicsQuality = 'high' | 'balanced';

export interface InteractionPrompt {
  kind: 'npc' | 'door' | 'bench' | 'inspect';
  id: string;
  label: string;
  sublabel?: string;
}

export interface SimulationHudSnapshot {
  playerX: number;
  playerZ: number;
  playerYaw: number;
  currentLandmark: CampusLandmark;
  insideLandmarkZone: boolean;
  isIndoors: boolean;
  isSitting: boolean;
  prompt: InteractionPrompt | null;
  npcs: Array<{ id: string; name: string; roleCategory: string; x: number; z: number }>;
  activeWaypointId: string | null;
}

export interface SimulationCallbacks {
  onHudUpdate: (snapshot: SimulationHudSnapshot) => void;
  onTalkToNpc: (npc: NpcProfile, currentActivity: string) => void;
  onInspectItem: (item: InspectableItem) => void;
  onLandmarkEntered: (landmark: CampusLandmark) => void;
}

const TIME_PRESETS: Record<
  TimeOfDayPreset,
  {
    sunPos: [number, number, number];
    sunColor: number;
    sunIntensity: number;
    fillColor: number;
    fillIntensity: number;
    hemiSky: number;
    hemiGround: number;
    hemiIntensity: number;
    skyColor: number;
    fogDensity: number;
    turbidity: number;
    rayleigh: number;
    mieCoefficient: number;
    mieDirectionalG: number;
    lampIntensity: number;
    lampEmissive: number;
    windowEmissive: number;
    envIntensity: number;
    showNightSky: boolean;
    exposure: number;
  }
> = {
  morning: {
    sunPos: [95, 62, -40],
    sunColor: 0xfff0d4,
    sunIntensity: 2.35,
    fillColor: 0x99c4ea,
    fillIntensity: 0.42,
    hemiSky: 0x9ad0f5,
    hemiGround: 0x5c5344,
    hemiIntensity: 0.9,
    skyColor: 0xb6dbf2,
    fogDensity: 0.0028,
    turbidity: 4.2,
    rayleigh: 1.35,
    mieCoefficient: 0.0045,
    mieDirectionalG: 0.78,
    lampIntensity: 0,
    lampEmissive: 0.14,
    windowEmissive: 0.0,
    envIntensity: 0.95,
    showNightSky: false,
    exposure: 1.06,
  },
  midday: {
    sunPos: [30, 120, 18],
    sunColor: 0xfffaf2,
    sunIntensity: 2.6,
    fillColor: 0x9fc9ee,
    fillIntensity: 0.48,
    hemiSky: 0x8cc9f5,
    hemiGround: 0x6b604e,
    hemiIntensity: 0.96,
    skyColor: 0xa2d4f7,
    fogDensity: 0.0023,
    turbidity: 3.2,
    rayleigh: 1.05,
    mieCoefficient: 0.0035,
    mieDirectionalG: 0.74,
    lampIntensity: 0,
    lampEmissive: 0.08,
    windowEmissive: 0.0,
    envIntensity: 1.0,
    showNightSky: false,
    exposure: 1.08,
  },
  golden: {
    sunPos: [-98, 28, 26],
    sunColor: 0xffb363,
    sunIntensity: 2.25,
    fillColor: 0x86a3cc,
    fillIntensity: 0.36,
    hemiSky: 0xf0b284,
    hemiGround: 0x4b3830,
    hemiIntensity: 0.76,
    skyColor: 0xe6ae82,
    fogDensity: 0.0035,
    turbidity: 7.5,
    rayleigh: 2.35,
    mieCoefficient: 0.0085,
    mieDirectionalG: 0.84,
    lampIntensity: 2.0,
    lampEmissive: 1.25,
    windowEmissive: 0.14,
    envIntensity: 0.68,
    showNightSky: false,
    exposure: 1.02,
  },
  dusk: {
    sunPos: [-102, 10, 38],
    sunColor: 0xff8252,
    sunIntensity: 0.75,
    fillColor: 0x4b6396,
    fillIntensity: 0.25,
    hemiSky: 0x3b4d78,
    hemiGround: 0x201c24,
    hemiIntensity: 0.48,
    skyColor: 0x222c45,
    fogDensity: 0.0046,
    turbidity: 9.5,
    rayleigh: 3.0,
    mieCoefficient: 0.012,
    mieDirectionalG: 0.86,
    lampIntensity: 7.5,
    lampEmissive: 2.6,
    windowEmissive: 0.48,
    envIntensity: 0.3,
    showNightSky: true,
    exposure: 0.96,
  },
  night: {
    sunPos: [-65, 85, -45],
    sunColor: 0x8bb0e6,
    sunIntensity: 0.34,
    fillColor: 0x1e3259,
    fillIntensity: 0.14,
    hemiSky: 0x1c2f59,
    hemiGround: 0x0c0a10,
    hemiIntensity: 0.26,
    skyColor: 0x081022,
    fogDensity: 0.0044,
    turbidity: 10.0,
    rayleigh: 4.0,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.7,
    lampIntensity: 18.0,
    lampEmissive: 4.0,
    windowEmissive: 0.85,
    envIntensity: 0.13,
    showNightSky: true,
    exposure: 0.98,
  },
};

export class CampusSimulation {
  private container: HTMLElement;
  private callbacks: SimulationCallbacks;
  private isSoftwareGl: boolean;

  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private skyDome: Sky;
  private sunLight: THREE.DirectionalLight;
  private fillLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private fog: THREE.FogExp2;
  private envRT: THREE.WebGLRenderTarget | null = null;

  private textures: CampusTextureSet;
  private world: BuiltCampusWorld;
  private npcSystem: NpcSystemHandle;
  private audio: CampusAudioEngine;

  // Player avatar & smooth kinematics
  private playerAvatar: ArticulatedHuman;
  private playerPos = new THREE.Vector3(PLAYER_SPAWN.x, 0, PLAYER_SPAWN.z);
  private playerVelX = 0;
  private playerVelZ = 0;
  private playerVelY = 0;
  private playerYaw = PLAYER_SPAWN.yaw;
  private playerPitch = -0.05;
  private targetYaw = PLAYER_SPAWN.yaw;
  private targetPitch = -0.05;
  private playerWalkPhase = 0;
  private footstepAccum = 0;
  private isGrounded = true;
  private isSitting = false;
  private seatedBenchReturnPos = new THREE.Vector3();

  // Camera smoothing, zoom & mode
  private perspective: CameraPerspective = 'third-person';
  private smoothCamPos = new THREE.Vector3(75, 2.8, -4);
  private smoothCamTarget = new THREE.Vector3(14, 4.2, -4);
  private thirdPersonDist = 5.2;
  private targetThirdPersonDist = 5.2;
  private mouseSensitivity = 0.0024;
  private isPointerDragging = false;
  private lastPointerX = 0;
  private lastPointerY = 0;

  // Simulation mode & settings
  private mode: 'title' | 'playing' | 'paused' | 'ui-focus' = 'title';
  private timeOfDay: TimeOfDayPreset = 'morning';
  private weather: WeatherPreset = 'clear';
  private talkingNpcId: string | null = null;
  private activeWaypointId: string | null = null;
  private waypointBeacon: THREE.Group;

  // Pooled rain particles
  private rainPoints: THREE.Points;
  private rainPositions: Float32Array;

  // Input state (Keyboard + Tablet/Mobile Virtual Touch Controls)
  private keys = new Set<string>();
  private virtualMoveX = 0;
  private virtualMoveY = 0;
  private virtualSprint = false;
  private currentPrompt: InteractionPrompt | null = null;
  private lastEnteredLandmarkId: string | null = null;

  // Loop & throttling (performance.now replaces deprecated THREE.Clock)
  private lastFrameMs = performance.now();
  private elapsed = 0;
  private hudTimer = 0;
  private frameId = 0;
  private disposed = false;

  // Scratch vectors (zero GC in loop)
  private readonly _moveDir = new THREE.Vector3();
  private readonly _desiredCamPos = new THREE.Vector3();
  private readonly _desiredCamTarget = new THREE.Vector3();
  private readonly _skyColor = new THREE.Color();

  constructor(container: HTMLElement, callbacks: SimulationCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.isSoftwareGl = CampusSimulation.detectSoftwareWebGL();

    // Renderer setup (per Three.js skill & software WebGL rules)
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2),
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);

    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    // Scene & Studio PMREM Environment
    this.scene = new THREE.Scene();
    this.fog = new THREE.FogExp2(0xb6dbf2, 0.0036);
    this.scene.fog = this.fog;
    this.scene.background = new THREE.Color(0xb6dbf2);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    this.scene.environment = this.envRT.texture;
    pmrem.dispose();

    // Camera (extended far plane for physical Sky dome)
    const aspect = (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight);
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.15, 620);

    // Physical Atmospheric Sky Dome (Manila tropical sky gradients & solar scattering)
    this.skyDome = new Sky();
    this.skyDome.scale.setScalar(460);
    this.scene.add(this.skyDome);

    // Warm Key Sun + Cool Sky/Ground Hemisphere + Subtle Opposite Sky-Bounce Fill Light
    this.hemiLight = new THREE.HemisphereLight(0x9ad0f5, 0x5c5344, 0.9);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff0d4, 2.35);
    this.sunLight.position.set(95, 62, -40);
    this.sunLight.castShadow = !this.isSoftwareGl;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 290;
    const d = 104;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.00045;
    this.sunLight.shadow.normalBias = 0.032;
    this.scene.add(this.sunLight);

    this.fillLight = new THREE.DirectionalLight(0x99c4ea, 0.42);
    this.fillLight.position.set(-72, 42, 48);
    this.fillLight.castShadow = false;
    this.scene.add(this.fillLight);

    // Procedural Textures, World Architecture, Living NPCs & Audio
    const t0 = performance.now();
    this.textures = createCampusTextures(this.renderer);
    const t1 = performance.now();
    this.world = buildPupCampusWorld(this.scene, this.textures, !this.isSoftwareGl);
    const t2 = performance.now();
    this.npcSystem = createNpcSystem(this.scene, !this.isSoftwareGl);
    this.audio = new CampusAudioEngine();
    (window as unknown as Record<string, unknown>).__PUP_PERF__ = {
      textureMs: Math.round(t1 - t0),
      worldBuildMs: Math.round(t2 - t1),
      originalStaticMeshes: this.world.perfStats.originalStaticMeshes,
      mergedStaticBatches: this.world.perfStats.mergedStaticBatches,
      drawCalls: 0,
    };
    (window as unknown as Record<string, unknown>).__PUP_INSPECT_POSE__ = (
      x: number,
      z: number,
      yaw: number,
      pitch = -0.05,
    ) => {
      this.isSitting = false;
      this.playerPos.set(x, 0, z);
      this.playerYaw = yaw;
      this.targetYaw = yaw;
      this.playerPitch = pitch;
      this.targetPitch = pitch;
      this.playerVelX = 0;
      this.playerVelZ = 0;
      this.playerVelY = 0;
      this.playerAvatar.root.position.copy(this.playerPos);
      this.playerAvatar.root.rotation.y = this.playerYaw + Math.PI;
      this.snapCameraToPlayer();
      this.renderer.render(this.scene, this.camera);
      this.emitHudSnapshot();
    };

    // Player Articulated Iskolar ng Bayan Avatar (visible in 3rd-person mode)
    const playerGeos = {
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
      shadowDisc: new THREE.CircleGeometry(0.38, 16),
    };
    this.playerAvatar = buildArticulatedHuman(
      playerGeos,
      {
        skinTone: '#d4a07d',
        hairColor: '#1b1918',
        hairStyle: 'short',
        topColor: '#f5f2eb',
        bottomColor: '#253145',
        accentColor: '#7b1113',
        hasBackpack: true,
        hasLanyard: true,
      },
      !this.isSoftwareGl,
    );
    this.playerAvatar.root.position.copy(this.playerPos);
    this.playerAvatar.root.rotation.y = this.playerYaw + Math.PI;
    this.scene.add(this.playerAvatar.root);

    // 3D Waypoint Navigation Pillar Beacon
    this.waypointBeacon = this.createWaypointBeacon();
    this.waypointBeacon.visible = false;
    this.scene.add(this.waypointBeacon);

    // Pooled Tropical Rain Particle Field
    const rainCount = 700;
    this.rainPositions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      this.rainPositions[i * 3] = (Math.random() - 0.5) * 60;
      this.rainPositions[i * 3 + 1] = Math.random() * 26;
      this.rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0xcbe4f5,
      size: 0.14,
      transparent: true,
      opacity: 0.68,
    });
    this.rainPoints = new THREE.Points(rainGeo, rainMat);
    this.rainPoints.visible = false;
    this.scene.add(this.rainPoints);

    this.applyEnvironmentPreset();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.tick();
  }

  private static detectSoftwareWebGL(): boolean {
    try {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      return true;
    }
  }

  private createWaypointBeacon(): THREE.Group {
    const g = new THREE.Group();
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.7, 28, 12, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xe5a91a,
        transparent: true,
        opacity: 0.32,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    beam.position.y = 14;
    g.add(beam);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.1, 1.55, 24),
      new THREE.MeshBasicMaterial({
        color: 0xe5a91a,
        transparent: true,
        opacity: 0.78,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.12;
    g.add(ring);
    return g;
  }

  // --- Public Control Methods (called cleanly from React HUD) ---

  public setMode(mode: 'title' | 'playing' | 'paused' | 'ui-focus') {
    const prev = this.mode;
    this.mode = mode;
    this.keys.clear();
    this.virtualMoveX = 0;
    this.virtualMoveY = 0;
    this.playerVelX = 0;
    this.playerVelZ = 0;
    this.isPointerDragging = false;
    this.lastFrameMs = performance.now();

    if (mode !== 'playing' && document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock?.();
    }

    if (mode === 'playing') {
      this.audio.unlock();
      if (prev === 'title') {
        // Snap smoothly behind player on start transition so first frame faces Main Gate, Pylon & Mural
        this.snapCameraToPlayer();
        this.emitHudSnapshot();
      }
    }
  }

  public setPerspective(p: CameraPerspective) {
    this.perspective = p;
    this.playerAvatar.root.visible = p === 'third-person';
  }

  public togglePerspective(): CameraPerspective {
    const next: CameraPerspective = this.perspective === 'first-person' ? 'third-person' : 'first-person';
    this.setPerspective(next);
    return next;
  }

  public setTimeOfDay(preset: TimeOfDayPreset) {
    this.timeOfDay = preset;
    this.applyEnvironmentPreset();
    this.renderer.render(this.scene, this.camera);
  }

  public setWeather(preset: WeatherPreset) {
    this.weather = preset;
    this.rainPoints.visible = preset === 'rain';
    this.applyEnvironmentPreset();
    this.renderer.render(this.scene, this.camera);
  }

  public setGraphicsQuality(quality: GraphicsQuality) {
    if (this.isSoftwareGl) return;
    this.renderer.setPixelRatio(quality === 'high' ? Math.min(window.devicePixelRatio, 2) : 1);
    this.renderer.shadowMap.enabled = quality === 'high';
    this.sunLight.castShadow = quality === 'high';
  }

  public setAudioVolumes(master: number, ambient: number, sfx: number, muted: boolean, music?: number) {
    this.audio.setVolumes(master, ambient, sfx, music);
    this.audio.setMuted(muted);
  }

  public setAeroMusicEnabled(enabled: boolean) {
    this.audio.unlock();
    this.audio.setAeroMusicEnabled(enabled);
    this.audio.playAeroUiClick();
  }

  public playAeroUiClick() {
    this.audio.unlock();
    this.audio.playAeroUiClick();
  }

  public setMouseSensitivity(val: number) {
    this.mouseSensitivity = val;
  }

  public setVirtualJoystick(x: number, y: number) {
    this.virtualMoveX = THREE.MathUtils.clamp(x, -1, 1);
    this.virtualMoveY = THREE.MathUtils.clamp(y, -1, 1);
  }

  public setVirtualSprint(active: boolean) {
    this.virtualSprint = active;
  }

  public triggerJump() {
    if (this.mode !== 'playing') return;
    this.audio.unlock();
    if (this.isSitting) {
      this.isSitting = false;
      this.playerPos.copy(this.seatedBenchReturnPos);
      this.emitHudSnapshot();
      return;
    }
    if (this.isGrounded) {
      this.playerVelY = 6.2;
      this.isGrounded = false;
    }
  }

  public applyTouchLookDelta(dx: number, dy: number) {
    if (this.mode !== 'playing') return;
    this.audio.unlock();
    this.targetYaw -= dx * this.mouseSensitivity * 1.9;
    this.targetPitch = THREE.MathUtils.clamp(
      this.targetPitch - dy * this.mouseSensitivity * 1.55,
      -0.62,
      0.58,
    );
  }

  public setTalkingNpc(npcId: string | null) {
    this.talkingNpcId = npcId;
  }

  public setWaypoint(landmarkId: string | null) {
    this.activeWaypointId = landmarkId;
    if (!landmarkId) {
      this.waypointBeacon.visible = false;
      this.emitHudSnapshot();
      return;
    }
    const lm = CAMPUS_LANDMARKS.find((l) => l.id === landmarkId);
    if (lm) {
      this.waypointBeacon.position.set(lm.approachPoint.x, 0, lm.approachPoint.z);
      this.waypointBeacon.visible = true;
      this.audio.playInteractChime();
      this.emitHudSnapshot();
    }
  }

  public teleportToLandmark(landmarkId: string) {
    const lm = CAMPUS_LANDMARKS.find((l) => l.id === landmarkId);
    if (!lm) return;
    this.isSitting = false;
    this.playerPos.set(lm.approachPoint.x, 0, lm.approachPoint.z);
    this.playerYaw = lm.approachYaw;
    this.targetYaw = lm.approachYaw;
    this.playerPitch = -0.05;
    this.targetPitch = -0.05;
    this.playerVelX = 0;
    this.playerVelZ = 0;
    this.playerVelY = 0;
    this.playerAvatar.root.position.copy(this.playerPos);
    this.playerAvatar.root.rotation.y = this.playerYaw + Math.PI;
    this.snapCameraToPlayer();
    this.renderer.render(this.scene, this.camera);
    this.currentPrompt = this.computeNearestInteraction();
    this.audio.playInteractChime();
    this.emitHudSnapshot();
  }

  public getPlayerPosition() {
    return { x: this.playerPos.x, z: this.playerPos.z };
  }

  public triggerInteract() {
    if (this.mode !== 'playing') return;

    if (this.isSitting) {
      this.isSitting = false;
      this.playerPos.copy(this.seatedBenchReturnPos);
      this.audio.playInteractChime();
      this.emitHudSnapshot();
      return;
    }

    const prompt = this.currentPrompt;
    if (!prompt) return;

    if (prompt.kind === 'npc') {
      const entity = this.npcSystem.namedNpcs.find((n) => n.profile.id === prompt.id);
      if (entity) {
        this.audio.playInteractChime();
        this.callbacks.onTalkToNpc(entity.profile, entity.currentActivity);
      }
    } else if (prompt.kind === 'door') {
      const door = this.world.doors.find((d) => d.id === prompt.id);
      if (door) {
        door.isOpen = !door.isOpen;
        this.audio.playDoorSound(door.isOpen);
      }
    } else if (prompt.kind === 'bench') {
      const bench = this.world.benches.find((b) => b.id === prompt.id);
      if (bench) {
        this.seatedBenchReturnPos.copy(this.playerPos);
        this.playerPos.set(bench.sitPosition.x, 0, bench.sitPosition.z);
        this.playerYaw = bench.sitYaw + Math.PI;
        this.targetYaw = this.playerYaw;
        this.playerVelX = 0;
        this.playerVelZ = 0;
        this.isSitting = true;
        this.audio.playInteractChime();
        this.emitHudSnapshot();
      }
    } else if (prompt.kind === 'inspect') {
      const ref = this.world.inspectables.find((i) => i.item.id === prompt.id);
      if (ref) {
        this.audio.playInteractChime();
        this.callbacks.onInspectItem(ref.item);
      }
    }
  }

  private applyEnvironmentPreset() {
    const p = TIME_PRESETS[this.timeOfDay];
    const overcastMult = this.weather === 'rain' ? 0.52 : this.weather === 'overcast' ? 0.72 : 1.0;

    this.sunLight.position.set(...p.sunPos);
    this.sunLight.color.setHex(p.sunColor);
    this.sunLight.intensity = p.sunIntensity * overcastMult;

    this.fillLight.position.set(-p.sunPos[0] * 0.75, Math.max(26, p.sunPos[1] * 0.65), -p.sunPos[2] * 0.75);
    this.fillLight.color.setHex(p.fillColor);
    this.fillLight.intensity = p.fillIntensity * (this.weather === 'rain' ? 0.85 : 1.0);

    this.hemiLight.color.setHex(this.weather === 'clear' ? p.hemiSky : 0x8999ab);
    this.hemiLight.groundColor.setHex(p.hemiGround);
    this.hemiLight.intensity = p.hemiIntensity;

    this._skyColor.setHex(p.skyColor);
    if (this.weather === 'overcast') this._skyColor.lerp(new THREE.Color(0x9aa5b1), 0.58);
    if (this.weather === 'rain') this._skyColor.lerp(new THREE.Color(0x506072), 0.76);

    // Sync Three.js physical atmospheric Sky shader on clear daytime/dusk; use starlit Manila night sky at night
    const isNight = this.timeOfDay === 'night';
    this.skyDome.visible = this.weather === 'clear' && !isNight;
    if (this.skyDome.visible) {
      const uniforms = this.skyDome.material.uniforms;
      uniforms['turbidity'].value = p.turbidity;
      uniforms['rayleigh'].value = p.rayleigh;
      uniforms['mieCoefficient'].value = p.mieCoefficient;
      uniforms['mieDirectionalG'].value = p.mieDirectionalG;
      const sunDir = new THREE.Vector3(...p.sunPos).normalize();
      uniforms['sunPosition'].value.copy(sunDir);
    }

    this.world.nightSkyGroup.visible = p.showNightSky && this.weather !== 'rain';

    this.scene.environmentIntensity = p.envIntensity;
    this.scene.background = this._skyColor.clone();
    this.fog.color.copy(this._skyColor);
    this.fog.density = p.fogDensity * (this.weather === 'rain' ? 1.8 : this.weather === 'overcast' ? 1.3 : 1.0);
    this.renderer.toneMappingExposure = p.exposure;

    for (const pl of this.world.lampLights) {
      pl.intensity = p.lampIntensity;
    }
    for (const bulb of this.world.lampBulbs) {
      bulb.emissiveIntensity = p.lampEmissive;
    }
    for (const wMat of this.world.emissiveWindowMats) {
      wMat.emissiveIntensity = p.windowEmissive;
    }
  }

  private snapCameraToPlayer() {
    this.targetYaw = this.playerYaw;
    this.targetPitch = this.playerPitch;
    this.thirdPersonDist = this.targetThirdPersonDist;
    const forwardX = -Math.sin(this.playerYaw);
    const forwardZ = -Math.cos(this.playerYaw);
    if (this.perspective === 'first-person') {
      this.smoothCamPos.set(this.playerPos.x, this.playerPos.y + 1.62, this.playerPos.z);
      this.smoothCamTarget.set(
        this.playerPos.x + forwardX * 6,
        this.playerPos.y + 1.55 + Math.sin(this.playerPitch) * 6,
        this.playerPos.z + forwardZ * 6,
      );
    } else {
      this.smoothCamPos.set(
        this.playerPos.x - forwardX * this.thirdPersonDist,
        this.playerPos.y + 2.55,
        this.playerPos.z - forwardZ * this.thirdPersonDist,
      );
      this.smoothCamTarget.set(
        this.playerPos.x + forwardX * 4.5,
        this.playerPos.y + 1.45,
        this.playerPos.z + forwardZ * 4.5,
      );
    }
    this.camera.position.copy(this.smoothCamPos);
    this.camera.lookAt(this.smoothCamTarget);
  }

  // --- Event Listeners ---

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.mode !== 'playing') return;
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    const code = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
      e.preventDefault();
    }

    if (!this.keys.has(code)) {
      if (code === 'Space' && this.isGrounded && !this.isSitting) {
        this.playerVelY = 6.2;
        this.isGrounded = false;
      } else if (code === 'KeyE') {
        this.triggerInteract();
      }
    }
    this.keys.add(code);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private onWindowBlur = () => {
    this.keys.clear();
    this.isPointerDragging = false;
  };

  private onPointerDown = (e: MouseEvent) => {
    if (this.mode !== 'playing') return;
    if (e.target !== this.renderer.domElement) return;
    this.audio.unlock();
    this.isPointerDragging = true;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
  };

  private onPointerUp = () => {
    this.isPointerDragging = false;
  };

  private onPointerMove = (e: MouseEvent) => {
    if (this.mode !== 'playing') return;
    if (document.pointerLockElement === this.renderer.domElement) {
      this.targetYaw -= e.movementX * this.mouseSensitivity;
      this.targetPitch = THREE.MathUtils.clamp(
        this.targetPitch - e.movementY * this.mouseSensitivity,
        -0.62,
        0.58,
      );
    } else if (this.isPointerDragging) {
      const dx = e.clientX - this.lastPointerX;
      const dy = e.clientY - this.lastPointerY;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      this.targetYaw -= dx * this.mouseSensitivity * 1.45;
      this.targetPitch = THREE.MathUtils.clamp(
        this.targetPitch - dy * this.mouseSensitivity * 1.25,
        -0.62,
        0.58,
      );
    }
  };

  private onWheel = (e: WheelEvent) => {
    if (this.mode !== 'playing') return;
    if (this.perspective !== 'third-person') return;
    e.preventDefault();
    this.targetThirdPersonDist = THREE.MathUtils.clamp(
      this.targetThirdPersonDist + Math.sign(e.deltaY) * 0.45,
      3.0,
      8.6,
    );
  };

  private onDoubleClickCanvas = (e: MouseEvent) => {
    if (this.mode !== 'playing') return;
    if (e.target !== this.renderer.domElement) return;
    if (document.pointerLockElement !== this.renderer.domElement) {
      this.renderer.domElement.requestPointerLock?.();
    }
  };

  private onResize = () => {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private bindEvents() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onWindowBlur);
    window.addEventListener('resize', this.onResize);
    window.addEventListener('mousemove', this.onPointerMove);
    window.addEventListener('mouseup', this.onPointerUp);
    this.renderer.domElement.addEventListener('mousedown', this.onPointerDown);
    this.renderer.domElement.addEventListener('dblclick', this.onDoubleClickCanvas);
    this.renderer.domElement.addEventListener('wheel', this.onWheel, { passive: false });
  }

  // --- Simulation Update & Software-WebGL Paced Render Loop ---

  private updatePlayer(dt: number) {
    if (this.mode !== 'playing') return;

    // Smooth keyboard camera turning (ArrowLeft / ArrowRight + Q) so trackpad/laptop exploration is effortless
    const keyTurn =
      (this.keys.has('ArrowLeft') || this.keys.has('KeyQ') ? 1 : 0) -
      (this.keys.has('ArrowRight') ? 1 : 0);
    if (keyTurn !== 0) {
      this.targetYaw += keyTurn * 2.15 * dt;
    }

    // Damped angular look smoothing (eliminates jagged raw pointer/turn steps)
    this.playerYaw = dampAngle(this.playerYaw, this.targetYaw, 22, dt);
    const pitchAlpha = 1 - Math.exp(-22 * dt);
    this.playerPitch += (this.targetPitch - this.playerPitch) * pitchAlpha;

    // Camera-relative keyboard (WASD + Up/Down) + Virtual Touch Joystick movement
    const keyForward =
      (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0) -
      (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0);
    const keyStrafe = (this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('KeyA') ? 1 : 0);

    const forwardInput = THREE.MathUtils.clamp(keyForward + this.virtualMoveY, -1, 1);
    const strafeInput = THREE.MathUtils.clamp(keyStrafe + this.virtualMoveX, -1, 1);
    const inputMag = Math.min(1, Math.hypot(forwardInput, strafeInput));

    // Stand up automatically if player presses movement while seated on a bench
    if (this.isSitting && inputMag > 0.15) {
      this.isSitting = false;
      this.playerPos.copy(this.seatedBenchReturnPos);
    }

    const sprinting = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.virtualSprint;
    const maxSpeed = sprinting ? 10.6 : 6.2;

    let targetVx = 0;
    let targetVz = 0;
    if (!this.isSitting && inputMag > 0.04) {
      const sinY = Math.sin(this.playerYaw);
      const cosY = Math.cos(this.playerYaw);
      const fx = -sinY;
      const fz = -cosY;
      const rx = cosY;
      const rz = -sinY;

      this._moveDir.set(fx * forwardInput + rx * strafeInput, 0, fz * forwardInput + rz * strafeInput);
      if (this._moveDir.lengthSq() > 0.0001) {
        this._moveDir.normalize();
        const desiredSpeed = maxSpeed * inputMag;
        targetVx = this._moveDir.x * desiredSpeed;
        targetVz = this._moveDir.z * desiredSpeed;
      }
    }

    // Exponentially smoothed horizontal velocity (silky acceleration & natural glide-stop)
    const stepped = stepHorizontalVelocity(
      this.playerVelX,
      this.playerVelZ,
      targetVx,
      targetVz,
      dt,
      15,
      13,
    );
    this.playerVelX = stepped.vx;
    this.playerVelZ = stepped.vz;

    let movedDist = 0;
    const horizSpeed = Math.hypot(this.playerVelX, this.playerVelZ);
    if (!this.isSitting && horizSpeed > 0.01) {
      const totalStep = horizSpeed * dt;
      // Sub-step large moves so wall/curb sliding never snags on corners
      const subSteps = totalStep > 0.25 ? 2 : 1;
      const subDt = dt / subSteps;
      const startX = this.playerPos.x;
      const startZ = this.playerPos.z;

      for (let s = 0; s < subSteps; s++) {
        const resolved = resolveCircleAABBCollisions(
          this.playerPos.x + this.playerVelX * subDt,
          this.playerPos.z + this.playerVelZ * subDt,
          0.46,
          this.world.colliders,
        );
        this.playerPos.x = resolved.x;
        this.playerPos.z = resolved.z;
      }

      movedDist = Math.hypot(this.playerPos.x - startX, this.playerPos.z - startZ);

      // Rotate 3rd-person avatar smoothly toward actual travel direction
      if (movedDist > 0.002) {
        const moveDx = this.playerPos.x - startX;
        const moveDz = this.playerPos.z - startZ;
        const targetAvatarYaw = Math.atan2(moveDx, moveDz);
        this.playerAvatar.root.rotation.y = dampAngle(
          this.playerAvatar.root.rotation.y,
          targetAvatarYaw,
          12,
          dt,
        );
      }
    }

    // Vertical jump & gravity
    if (!this.isGrounded || this.playerVelY !== 0) {
      this.playerVelY -= 17.5 * dt;
      this.playerPos.y += this.playerVelY * dt;
      if (this.playerPos.y <= 0) {
        this.playerPos.y = 0;
        this.playerVelY = 0;
        this.isGrounded = true;
      }
    }

    // Smooth dynamic sprint FOV feedback
    const isActuallySprinting = sprinting && movedDist > 0.01 && horizSpeed > 7.5;
    const targetFov = isActuallySprinting ? 64.2 : 60;
    if (Math.abs(this.camera.fov - targetFov) > 0.04) {
      this.camera.fov += (targetFov - this.camera.fov) * (1 - Math.exp(-8 * dt));
      this.camera.updateProjectionMatrix();
    }

    // Footstep sound & gait animation
    const speedRatio = dt > 1e-4 ? Math.min(1, movedDist / (maxSpeed * dt)) : 0;
    this.playerWalkPhase += movedDist * 3.8;
    if (this.isGrounded && movedDist > 0.002) {
      this.footstepAccum += movedDist;
      const stride = sprinting ? 2.35 : 1.75;
      if (this.footstepAccum >= stride) {
        this.footstepAccum = 0;
        const surf = getSurfaceTypeAt(this.playerPos.x, this.playerPos.z);
        this.audio.playFootstep(surf, sprinting);
      }
    }

    this.playerAvatar.root.position.set(
      this.playerPos.x,
      this.isSitting ? 0.22 : this.playerPos.y,
      this.playerPos.z,
    );
    this.playerAvatar.root.visible = this.perspective === 'third-person';
    animateHumanWalk(this.playerAvatar, this.playerWalkPhase, this.isSitting ? 0 : speedRatio, this.elapsed);

    // Clear waypoint automatically on arrival
    if (this.activeWaypointId) {
      const targetLm = CAMPUS_LANDMARKS.find((l) => l.id === this.activeWaypointId);
      if (
        targetLm &&
        Math.hypot(this.playerPos.x - targetLm.approachPoint.x, this.playerPos.z - targetLm.approachPoint.z) < 6.5
      ) {
        this.setWaypoint(null);
      }
    }
  }

  private computeSafeThirdPersonDist(desiredDist: number, forwardX: number, forwardZ: number): number {
    // Sample along camera boom to pull inward cleanly near narrow sidewalks & building facades
    const samples = 5;
    const margin = 0.55;
    for (let i = 1; i <= samples; i++) {
      const t = i / samples;
      const sx = this.playerPos.x - forwardX * desiredDist * t;
      const sz = this.playerPos.z - forwardZ * desiredDist * t;
      for (let c = 0; c < this.world.colliders.length; c++) {
        const box = this.world.colliders[c];
        if (
          sx >= box.minX - margin &&
          sx <= box.maxX + margin &&
          sz >= box.minZ - margin &&
          sz <= box.maxZ + margin
        ) {
          return Math.max(2.1, desiredDist * ((i - 1) / samples));
        }
      }
    }
    return desiredDist;
  }

  private updateCamera(dt: number) {
    if (this.mode === 'title') {
      // Live World Camera Tour: elevated aerial sweep framing PUP Main Building star wings,
      // NE North Wing tower crane, Interfaith Chapel terracotta pyramid, Freedom Park, Obelisk & Lagoon
      const t = this.elapsed * 0.12 + 0.12;
      const camX = -2 + Math.cos(t) * 52;
      const camZ = 8 + Math.sin(t) * 38;
      const camY = 23.5 + Math.sin(t * 1.2) * 2.5;
      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(-12, 8.5, 12);
      return;
    }

    const sinY = Math.sin(this.playerYaw);
    const cosY = Math.cos(this.playerYaw);
    const forwardX = -sinY;
    const forwardZ = -cosY;
    const damp = 1 - Math.exp(-15 * dt);

    if (this.perspective === 'first-person') {
      const horizSpeed = Math.hypot(this.playerVelX, this.playerVelZ);
      const bobAmp = this.isGrounded && !this.isSitting ? Math.min(1, horizSpeed / 6.2) * 0.032 : 0;
      const eyeY = (this.isSitting ? 1.25 : this.playerPos.y + 1.62) + Math.sin(this.playerWalkPhase * 2) * bobAmp;
      this._desiredCamPos.set(this.playerPos.x, eyeY, this.playerPos.z);
      this._desiredCamTarget.set(
        this.playerPos.x + forwardX * 8 * Math.cos(this.playerPitch),
        eyeY + Math.sin(this.playerPitch) * 8,
        this.playerPos.z + forwardZ * 8 * Math.cos(this.playerPitch),
      );
      this.smoothCamPos.lerp(this._desiredCamPos, Math.min(1, damp * 1.45));
      this.smoothCamTarget.lerp(this._desiredCamTarget, Math.min(1, damp * 1.45));
    } else {
      const surface = getSurfaceTypeAt(this.playerPos.x, this.playerPos.z);
      this.thirdPersonDist += (this.targetThirdPersonDist - this.thirdPersonDist) * (1 - Math.exp(-10 * dt));
      const baseDist = surface === 'interior' ? Math.min(3.2, this.thirdPersonDist) : this.thirdPersonDist;
      const camDist = this.computeSafeThirdPersonDist(baseDist, forwardX, forwardZ);
      const camHeight = surface === 'interior' ? 2.15 : 2.55 - this.playerPitch * 2.1;

      this._desiredCamPos.set(
        this.playerPos.x - forwardX * camDist,
        Math.max(0.85, this.playerPos.y + camHeight),
        this.playerPos.z - forwardZ * camDist,
      );
      this._desiredCamTarget.set(
        this.playerPos.x + forwardX * 3.8,
        this.playerPos.y + 1.45 + this.playerPitch * 2.6,
        this.playerPos.z + forwardZ * 3.8,
      );

      this.smoothCamPos.lerp(this._desiredCamPos, damp);
      this.smoothCamTarget.lerp(this._desiredCamTarget, damp);
    }

    this.camera.position.copy(this.smoothCamPos);
    this.camera.lookAt(this.smoothCamTarget);
  }

  private updateWorldAnimations(dt: number) {
    // Hinged doors smooth spring swing
    for (const door of this.world.doors) {
      const target = door.isOpen ? 1 : 0;
      door.openProgress += (target - door.openProgress) * (1 - Math.exp(-8 * dt));
      door.leftPivot.rotation.y = -door.openProgress * 1.45;
      door.rightPivot.rotation.y = door.openProgress * 1.45;
    }

    // Gentle Manila breeze on Philippine & PUP flags
    for (let i = 0; i < this.world.animatedFlags.length; i++) {
      const flag = this.world.animatedFlags[i];
      flag.rotation.y = Math.sin(this.elapsed * 2.6 + i * 1.5) * 0.16;
    }

    // Animated PBR water wave glints (Pasig River, Lagoon pond, Swimming Pool)
    this.world.waterTimeUniform.value = this.elapsed;

    // North Wing Tower Crane slow atmospheric wind sway
    this.world.craneJib.rotation.y = 0.45 + Math.sin(this.elapsed * 0.18) * 0.14;

    // Waypoint beacon rotation
    if (this.waypointBeacon.visible) {
      this.waypointBeacon.rotation.y = this.elapsed * 1.2;
    }

    // Tropical Rain particles falling around player
    if (this.weather === 'rain') {
      const arr = this.rainPositions;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 1] -= 22 * dt;
        if (arr[i + 1] < 0) {
          arr[i] = this.playerPos.x + (Math.random() - 0.5) * 56;
          arr[i + 1] = 22 + Math.random() * 6;
          arr[i + 2] = this.playerPos.z + (Math.random() - 0.5) * 56;
        }
      }
      this.rainPoints.geometry.attributes.position.needsUpdate = true;
    }
  }

  private computeNearestInteraction(): InteractionPrompt | null {
    if (this.isSitting) {
      return { kind: 'bench', id: 'stand-up', label: 'Stand Up', sublabel: 'Press [E] or move' };
    }

    let best: InteractionPrompt | null = null;
    let bestDist = 4.2;

    // 1. Named Intelligent NPCs (highest priority)
    for (const npc of this.npcSystem.namedNpcs) {
      const d = Math.hypot(this.playerPos.x - npc.position.x, this.playerPos.z - npc.position.z);
      if (d < bestDist) {
        bestDist = d;
        best = {
          kind: 'npc',
          id: npc.profile.id,
          label: `Talk to ${npc.profile.name}`,
          sublabel: npc.profile.role,
        };
      }
    }

    // 2. Campus Information Boards, Historical Plaques & Library Terminals
    for (const ref of this.world.inspectables) {
      const d = Math.hypot(this.playerPos.x - ref.position.x, this.playerPos.z - ref.position.z);
      if (d < Math.min(bestDist, 3.8)) {
        bestDist = d;
        best = {
          kind: 'inspect',
          id: ref.item.id,
          label: `Inspect ${ref.item.title}`,
          sublabel: ref.item.subtitle,
        };
      }
    }

    // 3. Functional Building Doors
    for (const door of this.world.doors) {
      const d = Math.hypot(this.playerPos.x - door.position.x, this.playerPos.z - door.position.z);
      if (d < Math.min(bestDist, 3.6)) {
        bestDist = d;
        best = {
          kind: 'door',
          id: door.id,
          label: `${door.isOpen ? 'Close' : 'Open'} ${door.label}`,
          sublabel: 'Building Entrance',
        };
      }
    }

    // 4. Campus Benches
    for (const bench of this.world.benches) {
      const d = Math.hypot(this.playerPos.x - bench.sitPosition.x, this.playerPos.z - bench.sitPosition.z);
      if (d < Math.min(bestDist, 2.7)) {
        bestDist = d;
        best = {
          kind: 'bench',
          id: bench.id,
          label: `Sit on ${bench.label}`,
          sublabel: 'Rest & observe campus',
        };
      }
    }

    return best;
  }

  private emitHudSnapshot() {
    const nearest = findNearestLandmark({ x: this.playerPos.x, z: this.playerPos.z });
    const surface = getSurfaceTypeAt(this.playerPos.x, this.playerPos.z);

    if (nearest.insideTrigger && nearest.landmark.id !== this.lastEnteredLandmarkId) {
      this.lastEnteredLandmarkId = nearest.landmark.id;
      if (this.mode === 'playing') {
        this.callbacks.onLandmarkEntered(nearest.landmark);
      }
    }

    this.callbacks.onHudUpdate({
      playerX: this.playerPos.x,
      playerZ: this.playerPos.z,
      playerYaw: this.playerYaw,
      currentLandmark: nearest.landmark,
      insideLandmarkZone: nearest.insideTrigger,
      isIndoors: surface === 'interior',
      isSitting: this.isSitting,
      prompt: this.currentPrompt,
      npcs: this.npcSystem.getNpcSnapshot(),
      activeWaypointId: this.activeWaypointId,
    });
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = () => {
    if (this.disposed) return;

    const nowMs = performance.now();
    const rawDt = (nowMs - this.lastFrameMs) / 1000;
    this.lastFrameMs = nowMs;
    const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

    if (this.mode !== 'paused') {
      this.elapsed += dt;
      this.updatePlayer(dt);
      this.updateWorldAnimations(dt);
      this.npcSystem.update(
        dt,
        this.elapsed,
        this.playerPos,
        this.timeOfDay,
        this.talkingNpcId,
        this.world.colliders,
      );
      this.updateCamera(dt);

      const isIndoors = getSurfaceTypeAt(this.playerPos.x, this.playerPos.z) === 'interior';
      this.audio.updateSpatialAmbience(dt, this.playerPos.x, this.playerPos.z, isIndoors, this.weather, this.timeOfDay);

      this.hudTimer += dt;
      if (this.hudTimer >= 0.14) {
        this.hudTimer = 0;
        this.currentPrompt = this.computeNearestInteraction();
        this.emitHudSnapshot();
      }
    }

    this.renderer.render(this.scene, this.camera);
    const perf = (window as unknown as Record<string, { drawCalls?: number }>).__PUP_PERF__;
    if (perf) perf.drawCalls = this.renderer.info.render.calls;

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onWindowBlur);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onPointerMove);
    window.removeEventListener('mouseup', this.onPointerUp);
    this.renderer.domElement.removeEventListener('mousedown', this.onPointerDown);
    this.renderer.domElement.removeEventListener('dblclick', this.onDoubleClickCanvas);
    this.renderer.domElement.removeEventListener('wheel', this.onWheel);

    this.world.dispose();
    this.npcSystem.dispose();
    this.textures.dispose();
    this.audio.dispose();
    this.envRT?.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
