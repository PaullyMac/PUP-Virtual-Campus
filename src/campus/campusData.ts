export type VerificationStatus = 'verified' | 'approximated';

export interface Vec2 {
  x: number;
  z: number;
}

export interface AABB {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY?: number;
  maxY?: number;
}

export interface CampusLandmark {
  id: string;
  name: string;
  shortName: string;
  category: 'landmark' | 'academic' | 'student-life' | 'heritage' | 'sports' | 'park';
  /** Verified OpenStreetMap real-world GPS coordinates (Sta. Mesa, Manila) */
  gps: { lat: number; lng: number };
  position: Vec2;
  /** Safe standing spot in front of the landmark for fast travel & navigation */
  approachPoint: Vec2;
  /** Facing yaw in radians when teleporting to approachPoint (0=-Z, PI/2=-X, PI=+Z, -PI/2=+X) */
  approachYaw: number;
  triggerRadius: number;
  enterable: boolean;
  summary: string;
  architecturalNotes: string;
  verificationStatus: VerificationStatus;
  verifiedFeatures: string[];
  approximatedFeatures: string[];
  connectedTo: string[];
  mapColor: string;
}

export type NpcRoleCategory =
  | 'Student'
  | 'Professor'
  | 'Security Guard'
  | 'Librarian'
  | 'Admin Staff'
  | 'Maintenance'
  | 'Visitor';

export interface NpcProfile {
  id: string;
  name: string;
  role: string;
  roleCategory: NpcRoleCategory;
  department: string;
  personality: string;
  appearance: {
    skinTone: string;
    hairColor: string;
    hairStyle: 'short' | 'long' | 'bun' | 'cap';
    topColor: string;
    bottomColor: string;
    accentColor: string;
    hasBackpack?: boolean;
    hasLanyard?: boolean;
    hasClipboard?: boolean;
    hasGlasses?: boolean;
  };
  greeting: string;
  knowledgeScope: string;
  homeLandmarkId: string;
  spawn: Vec2;
  schedule: {
    morning: { landmarkId: string; position: Vec2; activity: string; sitting?: boolean };
    midday: { landmarkId: string; position: Vec2; activity: string; sitting?: boolean };
    afternoon: { landmarkId: string; position: Vec2; activity: string; sitting?: boolean };
    dusk: { landmarkId: string; position: Vec2; activity: string; sitting?: boolean };
  };
  sampleQuestions: string[];
}

export interface InspectableItem {
  id: string;
  title: string;
  subtitle: string;
  kind: 'board' | 'plaque' | 'computer' | 'desk';
  landmarkId: string;
  position: { x: number; y: number; z: number };
  body: string[];
  verificationNote?: string;
}

export type TimeOfDayPreset = 'morning' | 'midday' | 'golden' | 'dusk' | 'night';
export type WeatherPreset = 'clear' | 'overcast' | 'rain';

export const CAMPUS_BOUNDS = {
  minX: -78,
  maxX: 215,
  minZ: -76,
  maxZ: 120,
};

export const PLAYER_SPAWN = {
  x: 94.2,
  y: 0,
  z: -5.2,
  // Facing West (-X) across Anonas St directly toward the iconic PUP Main Gate, towering P-U-P Pylon, Brass Mural & Obelisk avenue
  yaw: Math.PI / 2,
};

export const CAMPUS_LANDMARKS: CampusLandmark[] = [
  {
    id: 'main-gate',
    name: 'Main Gate, PUP Pylon & The Mural',
    shortName: 'Pylon & Main Gate',
    category: 'landmark',
    gps: { lat: 14.599086, lng: 121.011583 },
    position: { x: 85.0, z: -4 },
    approachPoint: { x: 94.2, z: -5.2 },
    approachYaw: Math.PI / 2,
    triggerRadius: 15,
    enterable: false,
    summary:
      'The iconic Anonas Street entrance to PUP A. Mabini Campus, featuring the maroon steel gate archway with three star-gear medallions, the three veined-marble P-U-P Pylon monoliths in gold lettering behind the open steel picket fence, and the terracotta Brass Mural crowning the south EXIT corridor.',
    architecturalNotes:
      'Modeled directly from 2018–2026 PUP Sta. Mesa entrance photographs: brick-red lower piers and white concrete pillars carrying the maroon POLYTECHNIC UNIVERSITY OF THE PHILIPPINES steel lintel and wrought-iron scrollwork; pitched red-roof center guard kiosk with boom barrier; north ENTRANCE canopy and open steel picket fence framing the refurbished gold-lettered veined-marble Pylon and Santan planter; and south EXIT corridor topped by the glossy terracotta wall bearing the 3D oxidized-bronze sculptural Mural.',
    verificationStatus: 'verified',
    verifiedFeatures: [
      'Maroon gate lintel with silver POLYTECHNIC UNIVERSITY OF THE PHILIPPINES lettering, 3 ornate star-gear medallions, and wrought-iron arch scrollwork',
      'Three stepped white veined-marble Pylon monoliths with refurbished 2026 gold P-U-P letters, terracotta podium, Santan flower planter, and open steel picket fence',
      'Elevated terracotta-tiled facade above the south pedestrian EXIT corridor bearing the 3D oxidized-bronze sculptural Mural',
      'Pitched red-roof center-lane guard kiosk, pivoting boom barrier, Citizen’s Charter PUP Seal wall, and giant 3D P-U-P letters just inside the gate',
    ],
    approximatedFeatures: [
      'Sculptural relief artwork on the Mural rendered via layered 3D bronze geometry and procedural relief texture',
      'Anonas Street exterior apron connects directly east across the PNR/NLEX Connector into the full Teresa Street corridor',
    ],
    connectedTo: ['catwalk', 'obelisk-freedom-park', 'mabini-shrine', 'pnr-stamesa', 'maui-el-pueblo'],
    mapColor: '#e5a91a',
  },
  {
    id: 'catwalk',
    name: 'The PUP Catwalk',
    shortName: 'Catwalk',
    category: 'park',
    gps: { lat: 14.59875, lng: 121.01125 },
    position: { x: 46, z: -10.5 },
    approachPoint: { x: 52, z: -10.5 },
    approachYaw: Math.PI / 2,
    triggerRadius: 14,
    enterable: false,
    summary:
      'The iconic low-roofed shaded pedestrian walkway running along the north flank of the acacia-lined main avenue from the Main Gate toward the Obelisk, Tennis Courts, and Lagoon.',
    architecturalNotes:
      'Straight covered sidewalk colonnade supported by slim dark-steel posts along the main driveway, angling northwest past the Obelisk roundabout toward the courts and Lagoon entrance.',
    verificationStatus: 'verified',
    verifiedFeatures: [
      'Covered walkway running parallel along the north side of the main entrance boulevard',
      'Tall overarching acacia canopy framing the road, speed bumps, and straight vista to the Obelisk',
    ],
    approximatedFeatures: [
      'Roof framing and sidewalk paving intervals simplified for real-time 3D rendering',
    ],
    connectedTo: ['main-gate', 'obelisk-freedom-park', 'gymnasium', 'visitors-lounge-courts', 'tahanan-ng-alumni'],
    mapColor: '#b87a3d',
  },
  {
    id: 'obelisk-freedom-park',
    name: 'PUP Obelisk & Nemesio E. Prudente Freedom Park',
    shortName: 'Obelisk & Freedom Park',
    category: 'landmark',
    gps: { lat: 14.59779, lng: 121.011035 },
    position: { x: 14, z: -4 },
    approachPoint: { x: 26, z: -4 },
    approachYaw: Math.PI / 2,
    triggerRadius: 18,
    enterable: false,
    summary:
      'The iconic civic centerpiece directly aligned with the Main Gate avenue—anchored by the tall white PUP Obelisk on its circular green lawn island and red steps, opening southwest into the geometric tiled Freedom Park plaza.',
    architecturalNotes:
      'Modeled from real campus photographs: slender gleaming-white tapered concrete Obelisk rising from a circular raised grass mound with white curbing, manicured hedges, and red-maroon steps; adjacent Freedom Park features rose-terracotta square paving grids with white concrete bands, arched benches, and the central flagpole.',
    verificationStatus: 'verified',
    verifiedFeatures: [
      'Tall white square-tapered Obelisk centered on a circular green lawn roundabout directly west of the Main Gate',
      'Red/maroon stepped approach and white circular curb around the Obelisk island',
      'Freedom Park geometric rose-and-white grid plaza with flagpole pedestal and white-and-black benches',
    ],
    approximatedFeatures: [
      'Apolinario Mabini bust and plaque simplified with composite bronze geometry',
    ],
    connectedTo: [
      'main-gate',
      'catwalk',
      'mabini-shrine',
      'lagoon',
      'north-wing-construction',
      'main-building',
      'interfaith-chapel',
    ],
    mapColor: '#e5a91a',
  },
  {
    id: 'mabini-shrine',
    name: 'Museo ni Apolinario Mabini (Mabini Shrine)',
    shortName: 'Mabini Shrine',
    category: 'heritage',
    gps: { lat: 14.598205, lng: 121.011152 },
    position: { x: 39.5, z: 13.0 },
    approachPoint: { x: 39.5, z: 6.4 },
    approachYaw: Math.PI,
    triggerRadius: 14,
    enterable: false,
    summary:
      'The relocated historic residence of Apolinario Mabini, instantly recognizable inside PUP Sta. Mesa for its mint-green vertical wood siding, steep cogon thatched hip roof with red-orange ridge caps, and NHCP historical marker.',
    architecturalNotes:
      'Modeled directly from archival photographs: pastel mint-aqua timber stilt house with vertical slatted skirt, turned balusters, recessed dark shuttered windows, steep cogon/nipa thatched hip roofs crowned with red-orange metal ridge caps, corrugated red eave trim, and landscaped lawn south of the entrance road.',
    verificationStatus: 'verified',
    verifiedFeatures: [
      'Authentic pastel mint-green vertical wood siding and white-mint balustrade railings',
      'Steep thatched cogon/nipa hip roof with signature red-orange ridge caps and corrugated red eaves',
      'Positioned in its real-world grassy compound south of the main boulevard between Freedom Park and the Grandstand',
    ],
    approximatedFeatures: [
      'Exterior heritage reconstruction; museum gallery exhibits are summarized on the interactive NHCP plaque',
    ],
    connectedTo: ['main-gate', 'obelisk-freedom-park', 'oval-grandstand', 'interfaith-chapel'],
    mapColor: '#3aa88b',
  },
  {
    id: 'main-building',
    name: 'PUP Main Academic Building & Central Dome',
    shortName: 'Main Building & Dome',
    category: 'academic',
    gps: { lat: 14.597142, lng: 121.010699 },
    position: { x: -28, z: 24 },
    approachPoint: { x: -13.5, z: 33.8 },
    approachYaw: Math.PI / 2,
    triggerRadius: 24,
    enterable: true,
    summary:
      'The unmistakable 6-storey multi-wing heart of PUP Sta. Mesa—featuring its authentic star-shaped radiating wings (East, South, West, and the rebuilding North Wing) converging at the Central Dome Rotunda.',
    architecturalNotes:
      'Recreated from OSM footprints, the official PUP campus map, and facade photographs: 6 stacked cream-white cantilevered balcony corridors with crisp maroon soffit stripes, dark shadowed open-air hallways, curved-arc maroon steel railings, exterior zig-zag stairwell tower, overhanging dark maroon roof fascia, and an enterable ground-floor Dome Rotunda & East Wing Room E-104.',
    verificationStatus: 'verified',
    verifiedFeatures: [
      'Real-world PUP star/Y-wing plan radiating from the Central Dome (East Wing south, West Wing NW, South Wing SW courtyard, North Wing NE construction)',
      '6-storey cream cantilevered floor slabs with maroon underside stripes, dark open corridors, and dark brown overhanging roof fascia',
      'Exterior zig-zag cantilevered staircase tower and enterable ground-floor Dome Rotunda with maroon-and-cream columns & steel gang-chairs',
    ],
    approximatedFeatures: [
      'Ground-floor East Wing entrance, Dome Rotunda, and Room E-104 are walkable interiors; floors 2F–6F are architectural exterior',
    ],
    connectedTo: [
      'obelisk-freedom-park',
      'north-wing-construction',
      'lagoon',
      'charlie-del-rosario',
      'sampaguita-canteen',
      'interfaith-chapel',
      'food-nutrition-strip',
      'linear-park',
      'pup-ferry-station',
    ],
    mapColor: '#9b1c1f',
  },
  {
    id: 'north-wing-construction',
    name: 'New 9-Storey North Wing (Under Construction)',
    shortName: 'North Wing Construction',
    category: 'academic',
    gps: { lat: 14.59748, lng: 121.01092 },
    position: { x: -10, z: 13 },
    approachPoint: { x: 2, z: 7 },
    approachYaw: Math.PI * 0.35,
    triggerRadius: 15,
    enterable: false,
    summary:
      'Active DPWH/PUP redevelopment site along the real North Wing NE axis facing Freedom Park—replacing the demolished old North Wing with a 9-storey disaster-resilient academic building.',
    architecturalNotes:
      'Aligned along the actual northeast wing footprint radiating from the Main Building Dome toward Freedom Park: enclosed by corrugated GI hoarding and caution stripes, featuring unfinished concrete columns and floor slabs, exposed rebar starter bars, steel scaffolding, green safety netting, slewing yellow tower crane, and DPWH project billboard.',
    verificationStatus: 'verified',
    verifiedFeatures: [
      'Positioned on the true northeast North Wing footprint radiating from the Dome toward Freedom Park',
      'Exposed multi-level reinforced concrete structural skeleton, rebar cages, green safety netting, scaffolding, tower crane, and DPWH billboard',
    ],
    approximatedFeatures: [
      'Current pour stage and crane boom orientation represent recent 2024–2026 campus construction reports',
    ],
    connectedTo: ['main-building', 'obelisk-freedom-park', 'lagoon'],
    mapColor: '#d97706',
  },
  {
    id: 'lagoon',
    name: 'PUP Lagoon Park, Food Stalls & Amphitheater',
    shortName: 'PUP Lagoon',
    category: 'student-life',
    gps: { lat: 14.597642, lng: 121.010257 },
    position: { x: -16, z: -16 },
    approachPoint: { x: -4, z: -14 },
    approachYaw: Math.PI * 0.55,
    triggerRadius: 19,
    enterable: false,
    summary:
      'The newly redeveloped shaded heart of student life between Freedom Park, the Main Building, and NALLRC—bordered by the Intramuros-style stone bastion wall and Centennial Gate, with herringbone brick plazas, the bold PUP Lagoon planter sign, pond, concessionaire stalls, and Amphitheater.',
    architecturalNotes:
      'Modeled from OSM coordinates and modern Lagoon photographs: gray stone Intramuros-style perimeter wall with corner garita watchtower, circular terracotta brick paving with white concrete rings, raised hexagonal planter bearing the red-orange PUP Lagoon landmark sign, animated water lagoon with footbridge, concessionaire kiosks, and semicircular Amphitheater steps.',
    verificationStatus: 'verified',
    verifiedFeatures: [
      'Real-world location directly north of the Main Building Dome and west of the Obelisk',
      'Intramuros-style stone perimeter wall with bastion turret (garita) and Centennial arched gateway',
      'Redeveloped terracotta brick circular plaza, red PUP Lagoon planter signage, pond with footbridge, food kiosks, and Amphitheater',
    ],
    approximatedFeatures: [
      'Individual food kiosk menus and seating arrangements are representative composites',
    ],
    connectedTo: ['obelisk-freedom-park', 'main-building', 'north-wing-construction', 'nallrc', 'charlie-del-rosario'],
    mapColor: '#2e8b7a',
  },
  {
    id: 'nallrc',
    name: 'Ninoy Aquino Library & Learning Resources Center (NALLRC)',
    shortName: 'NALLRC Library',
    category: 'academic',
    gps: { lat: 14.59782, lng: 121.00958 },
    position: { x: -24, z: -44 },
    approachPoint: { x: -12, z: -32 },
    approachYaw: Math.PI * 0.2,
    triggerRadius: 19,
    enterable: true,
    summary:
      'PUP’s iconic T-shaped bright-white modernist library and research hub immediately north of the Lagoon—one of Southeast Asia’s largest academic library buildings.',
    architecturalNotes:
      'Recreated from official map footprints and exterior photographs: crisp white 4-storey T-wing concrete facade, cantilevered white balconies with perforated square cutouts, dark horizontal window strips, vertical louver fins, wide terraced entry stairs framed by curved white planters and ornamental palms, and an enterable 1F Reading Hall with OPAC terminals.',
    verificationStatus: 'verified',
    verifiedFeatures: [
      'Authentic T-shaped footprint positioned north of the Lagoon and west of the PE Building/Swimming Pool',
      'Bright white modernist facade with cantilevered perforated balconies, vertical white fins, and terraced front stairs',
      'Enterable ground-floor reading hall with book stacks, circulation counter, study tables, and OPAC computers',
    ],
    approximatedFeatures: [
      'Ground-floor reading hall is modeled as a walkable interior; upper floors (2F–4F) are architectural exterior',
    ],
    connectedTo: ['lagoon', 'charlie-del-rosario', 'gymnasium', 'linear-park', 'tahanan-ng-alumni', 'printing-psmo'],
    mapColor: '#3b6d9c',
  },
  {
    id: 'charlie-del-rosario',
    name: 'Charlie del Rosario Student Development Center',
    shortName: 'Charlie del Rosario Hall',
    category: 'student-life',
    gps: { lat: 14.597311, lng: 121.009126 },
    position: { x: -54, z: -12 },
    approachPoint: { x: -42, z: -8 },
    approachYaw: Math.PI * 0.6,
    triggerRadius: 16,
    enterable: false,
    summary:
      'The vibrant hub of PUP student organizations, the Central Student Council, and campus publications—located along the northwest academic strip near the Lab High School wings and Pasig River.',
    architecturalNotes:
      'Modeled directly from facade photography: bold maroon structural columns framing dark-mullioned glass entrance doors under a wide white cantilevered canopy bearing silver CHARLIE DEL ROSARIO BUILDING lettering, crowned by iconic golden-yellow vertical concrete fins on the upper floor, adjacent to the parallel comb-shaped Lab High School / COC wings.',
    verificationStatus: 'verified',
    verifiedFeatures: [
      'Signature maroon piers, white cantilevered canopy with CHARLIE DEL ROSARIO BUILDING lettering, and bright golden-yellow upper vertical fins',
      'Real-world location along the northwest block beside the parallel Laboratory High School wings and Linear Park',
    ],
    approximatedFeatures: [
      'Exterior architectural reconstruction paired with an interactive outdoor student organizations notice board',
    ],
    connectedTo: ['main-building', 'lagoon', 'nallrc', 'linear-park', 'sampaguita-canteen', 'printing-psmo'],
    mapColor: '#d99b1e',
  },
  {
    id: 'interfaith-chapel',
    name: 'PUP Interfaith Chapel',
    shortName: 'Interfaith Chapel',
    category: 'landmark',
    gps: { lat: 14.597145, lng: 121.011435 },
    position: { x: -2, z: 42 },
    approachPoint: { x: -2, z: 27 },
    approachYaw: Math.PI,
    triggerRadius: 15,
    enterable: true,
    summary:
      'PUP’s unmistakable octagonal pyramidal sanctuary nestled in a circular tree-ringed garden directly east of the Main Building East Wing—welcoming students and faculty of all faiths.',
    architecturalNotes:
      'Modeled faithfully from chapel photography: eight steeply sloping white concrete buttress ribs rising to an open white concrete lantern spire, steeply pitched terracotta Spanish clay tile roof panels, horizontal louvered ribbon windows over bougainvillea planters, front concrete steps with stainless steel handrails, and an enterable octagonal sanctuary with pews and altar.',
    verificationStatus: 'verified',
    verifiedFeatures: [
      'Authentic octagonal pyramidal form with 8 bold white concrete buttress ribs and open white spire finial',
      'Steeply pitched terracotta clay-tile roof, concrete entry steps with handrails, and bougainvillea planter ledges',
      'Positioned inside its real-world circular garden island directly east of the Main Building East Wing',
    ],
    approximatedFeatures: [
      'Interior pew arrangement and ecumenical sanctuary lighting are streamlined for smooth real-time rendering',
    ],
    connectedTo: ['obelisk-freedom-park', 'main-building', 'mabini-shrine', 'oval-grandstand', 'food-nutrition-strip'],
    mapColor: '#b34b3b',
  },
  {
    id: 'oval-grandstand',
    name: 'PUP Track & Field Oval & Grandstand',
    shortName: 'Oval & Grandstand',
    category: 'sports',
    gps: { lat: 14.598015, lng: 121.01185 },
    position: { x: 48, z: 44 },
    approachPoint: { x: 28, z: 32 },
    approachYaw: -Math.PI * 0.65,
    triggerRadius: 24,
    enterable: false,
    summary:
      'The university’s sprawling southeastern athletic oval, green field, and cantilevered concrete Grandstand—venue for P.E. classes, intramurals, ROTC formations, and major campus assemblies.',
    architecturalNotes:
      'Positioned in its real-world southeastern quadrant tilted NE–SW as shown on the official PUP map: oval running track enclosing a lush turf field, overlooked from the northwest straightaway by the authentic PUP Grandstand with cream-and-maroon base wall, tiered gray bleachers with steel handrails, and cantilevered cream roof slab.',
    verificationStatus: 'verified',
    verifiedFeatures: [
      'Real-world southeastern quadrant position and diagonal NE–SW orientation',
      'Authentic PUP Grandstand featuring cream-and-maroon lower fascia, tiered concrete bleachers, steel railings, and cantilevered cream roof slab',
    ],
    approximatedFeatures: [
      'Oval field scale is proportionally compacted to keep cross-campus walks comfortable',
    ],
    connectedTo: ['mabini-shrine', 'interfaith-chapel', 'main-gate', 'tahanan-ng-atleta'],
    mapColor: '#c45b3b',
  },
  {
    id: 'gymnasium',
    name: 'PUP Gymnasium, Swimming Pool & Courts',
    shortName: 'Gym, Pool & Courts',
    category: 'sports',
    gps: { lat: 14.599241, lng: 121.010745 },
    position: { x: 44, z: -46 },
    approachPoint: { x: 36, z: -32 },
    approachYaw: 0,
    triggerRadius: 20,
    enterable: false,
    summary:
      'PUP’s northeastern sports and research complex directly north of the Catwalk—comprising the arched-roof PUP Gymnasium, outdoor Tennis & Basketball Courts, 25m Swimming Pool, PE Building, and Engineering & Science Research Center.',
    architecturalNotes:
      'Laid out directly from the official PUP map and OSM footprints: outdoor tennis/basketball courts flanking the north side of the Catwalk, large white-and-maroon barrel-vault Gymnasium hall, adjacent blue competition Swimming Pool with viewing bleachers, and the 4-storey Engineering & Science Research Center to the east.',
    verificationStatus: 'verified',
    verifiedFeatures: [
      'Real-world northeastern campus zone north of the Catwalk',
      'Arched barrel-vault Gymnasium paired with the Swimming Pool directly to its west and outdoor courts to its south',
    ],
    approximatedFeatures: [
      'Exterior architectural models with visible animated pool water and marked outdoor courts',
    ],
    connectedTo: ['catwalk', 'nallrc', 'obelisk-freedom-park', 'tahanan-ng-alumni', 'visitors-lounge-courts'],
    mapColor: '#4c8066',
  },
  {
    id: 'linear-park',
    name: 'PUP Linear Park & Pasig River Promenade',
    shortName: 'Linear Park',
    category: 'park',
    gps: { lat: 14.596103, lng: 121.010835 },
    position: { x: -67, z: 12 },
    approachPoint: { x: -65, z: 12 },
    approachYaw: Math.PI / 2,
    triggerRadius: 20,
    enterable: false,
    summary:
      'The scenic riverside walkway stretching along the entire western edge of PUP Sta. Mesa beside the shimmering Pasig River and leading down to the PUP Pasig River Ferry Station.',
    architecturalNotes:
      'Continuous paved riverfront promenade lined with concrete balustrades, tropical trees, shaded benches, animated Pasig River water reflections, and the maroon-roofed PUP Ferry Station pier at the southwestern corner.',
    verificationStatus: 'verified',
    verifiedFeatures: [
      'Western riverfront promenade running beside the Pasig River from the Lab High School block down to the PUP Ferry Station',
      'Concrete riverside seawall, balustrades, benches, and ferry terminal pier',
    ],
    approximatedFeatures: [
      'Across-the-river Manila urban silhouettes are atmospheric horizon approximations',
    ],
    connectedTo: ['nallrc', 'charlie-del-rosario', 'main-building', 'pup-ferry-station'],
    mapColor: '#3a7ca5',
  },
  {
    id: 'pup-ferry-station',
    name: 'PUP Pasig River Ferry Station (MMDA)',
    shortName: 'PUP Ferry Station',
    category: 'landmark',
    gps: { lat: 14.59605, lng: 121.01085 },
    position: { x: -75, z: 56 },
    approachPoint: { x: -64, z: 42 },
    approachYaw: Math.PI * 0.78,
    triggerRadius: 15,
    enterable: false,
    summary:
      'The riverside MMDA Pasig River Ferry Service terminal south of the PUP Main Building along the Linear Park—featuring its curved steel-truss pontoon dock, black-and-yellow striped girder, emerald-green MMDA signboard, and curved-roof white PUP Station hall.',
    architecturalNotes:
      'Modeled directly from Wikimedia Commons and PRRC riverfront photographs: concrete pontoon pier with rubber tire fenders, curved steel truss canopy over black-and-yellow hazard-striped crossbeams, emerald-green P.U.P. PASIG RIVER FERRY STATION signage, and the white curved-roof terminal building bearing raised red PUP STATION letters.',
    verificationStatus: 'verified',
    verifiedFeatures: [
      'Curved arched steel truss canopy with black-and-yellow striped I-beam and emerald-green MMDA ferry station sign',
      'Floating concrete dock with black tire fenders, galvanized railings, and white curved-roof terminal with red PUP STATION lettering',
    ],
    approximatedFeatures: [
      'Riverfront floating dock is stationary; boarding turnstiles and interior ticket booth are simplified exterior details',
    ],
    connectedTo: ['linear-park', 'main-building'],
    mapColor: '#1f8a6e',
  },
  {
    id: 'pnr-stamesa',
    name: 'PNR Sta. Mesa Crossing & NLEX-SLEX Connector Viaduct',
    shortName: 'PNR & NLEX Viaduct',
    category: 'landmark',
    gps: { lat: 14.59930, lng: 121.01190 },
    position: { x: 106, z: -4 },
    approachPoint: { x: 96.5, z: -4 },
    approachYaw: -Math.PI / 2,
    triggerRadius: 14,
    enterable: false,
    summary:
      'Located ~42m east of the PUP Main Gate right across Anonas Street: the historic PNR Sta. Mesa twin-track railway crossing and station platforms, spanned directly overhead by the twin-deck elevated concrete NLEX-SLEX Connector expressway viaduct.',
    architecturalNotes:
      'Modeled directly from 2024–2026 aerial drone photography of PUP Sta. Mesa and Google Maps measurements: twin parallel steel tracks on timber sleepers and gravel ballast immediately east of Anonas St, PNR Sta. Mesa Station twin covered commuter platforms with orange DEL #918 locomotive and passenger coaches, yellow-black level-crossing warning posts, and the twin parallel elevated concrete NLEX-SLEX Connector viaduct decks supported on T-shaped concrete portal piers spanning clear over Teresa Street.',
    verificationStatus: 'verified',
    verifiedFeatures: [
      'True real-world Google Maps position (~42m east of PUP Main Gate, immediately between Anonas Street and Teresa Street)',
      'Twin parallel elevated NLEX-SLEX Connector concrete box-girder decks on T-shaped portal piers verified from 2026 drone imagery',
      'PNR Sta. Mesa twin tracks, covered commuter platforms, orange DEL #918 locomotive with blue-silver coaches, and level-crossing barriers',
    ],
    approximatedFeatures: [
      'PNR commuter train is displayed parked at the Sta. Mesa platform; expressway traffic above the viaduct is static',
    ],
    connectedTo: ['main-gate', 'anonas-teresa'],
    mapColor: '#d95d24',
  },
  {
    id: 'anonas-teresa',
    name: 'Teresa Street Strip (Banana Island, PST, 7-Eleven, Esperanza & Brgy. 591)',
    shortName: 'Teresa Street Strip',
    category: 'student-life',
    gps: { lat: 14.59978, lng: 121.01248 },
    position: { x: 140, z: -4 },
    approachPoint: { x: 125, z: -4 },
    approachYaw: -Math.PI / 2,
    triggerRadius: 34,
    enterable: false,
    summary:
      'The iconic ~200m Sta. Mesa student street stretching east from the PNR RR XING viaduct to Old Sta. Mesa Street—mapped frame-by-frame from May 2026 Street View: Banana Island, RBS Bookbinding & Palceso Print, Chacha Canteen, lime-green PST (Pastil sa Tabi), Smokle Vape Shop, 7-Eleven, Eufrosino’s / Ramos Print / RDP Graphics, Smile POD, Angel’s Burger & Palawan Express, Esperanza Health Center, Teresa Chapel, Teresa Covered Court, and Barangay 591 Hall.',
    architecturalNotes:
      'Rebuilt block-by-block from May 2026 Google Street View (Instant Street View) captures along Teresa Street: overhead "Teresa RR XING" gantry sign, blue-and-yellow Manila curbs and striped Meralco poles, colorful fiesta banderitas strung across the street, North-side stalls (Banana Island, GCash / Tarpaulin & Xerox Print, Smokle Vape Shop, yellow-trimmed 7-Eleven, green corrugated compound with vines, mint-green Esperanza Health Center & Lying-In Clinic, white-and-mahogany Teresa Chapel, and arched Teresa Covered Court) and South-side stalls (cobalt-blue RBS Bookbinding & Palceso Printing, Chacha Canteen & Angelina’s Store, lime-green PST Pastil sa Tabi & Takam, Eufrosino’s Fruit / Ramos Print / RDP Graphics, mustard-yellow Smile POD Dental & Elegance, Angel’s Burger & Palawan Pawnshop/Express PUP Sta. Mesa, sari-sari row, slate-gray Barangay 591 Hall & Mubyl, and the blue Virgin Mary corner grotto).',
    verificationStatus: 'verified',
    verifiedFeatures: [
      'Frame-by-frame May 2026 Google Street View storefront names & colors on both North and South sides of Teresa Street',
      'True real-world Google Maps sequence & distance (~42m PNR/NLEX -> ~124m Mid-Teresa Strip -> ~215m Old Sta. Mesa)',
      'Authentic Manila blue-and-yellow striped curbs & Meralco utility poles, fiesta banderitas, tricycle queues, and corner Virgin Mary grotto',
    ],
    approximatedFeatures: [
      'Individual shopfront interiors are non-enterable facades; street pedestrian & stall density is balanced for smooth real-time 3D frame rate',
    ],
    connectedTo: ['pnr-stamesa', 'old-stamesa-stopshop'],
    mapColor: '#c97b2c',
  },
  {
    id: 'old-stamesa-stopshop',
    name: 'Old Sta. Mesa Street, Stop & Shop & Cebuana Lhuillier Junction',
    shortName: 'Old Sta. Mesa / Stop & Shop',
    category: 'student-life',
    gps: { lat: 14.60028, lng: 121.01315 },
    position: { x: 208, z: -4 },
    approachPoint: { x: 196, z: -4 },
    approachYaw: -Math.PI / 2,
    triggerRadius: 18,
    enterable: false,
    summary:
      'The bustling ~215m eastern terminus of Teresa Street between Teresa Covered Court and Barangay 591 Hall / Virgin Mary Grotto, meeting 4-lane Old Sta. Mesa Street across from Cebuana Lhuillier and Stop & Shop.',
    architecturalNotes:
      'Modeled from May 2026 Street View and Google Maps geometry: wide 4-lane Old Sta. Mesa Street intersecting Teresa Street with pedestrian crosswalks, traffic signals, Cebuana Lhuillier Sta. Mesa, Stop & Shop commercial frontage, adjacent white condo parking deck, and Divisoria–Cubao–Stop & Shop passenger jeepneys.',
    verificationStatus: 'verified',
    verifiedFeatures: [
      'Real-world ~215m Google Maps walking distance east from PUP Main Gate along Teresa Street',
      'Street-View-verified Teresa Covered Court, Brgy. 591 Hall, blue Virgin Mary corner grotto, and Cebuana Lhuillier across Old Sta. Mesa St',
    ],
    approximatedFeatures: [
      'Exterior streetscape terminus; buildings beyond Old Sta. Mesa Street form the surrounding Manila urban horizon',
    ],
    connectedTo: ['anonas-teresa'],
    mapColor: '#b56727',
  },
  {
    id: 'visitors-lounge-courts',
    name: 'Visitor’s Lounge, Open Courts & PUP Souvenir Shop',
    shortName: 'Visitor’s Lounge & Courts',
    category: 'student-life',
    gps: { lat: 14.59888, lng: 121.01142 },
    position: { x: 56, z: -18 },
    approachPoint: { x: 60, z: -12.5 },
    approachYaw: 0.25,
    triggerRadius: 15,
    enterable: false,
    summary:
      'The lively entrance-zone complex right inside the Main Gate—comprising the curved-roof brick Visitor’s Lounge (#3), Open Basketball & Lawn Tennis Courts (#4–#6), Gymnasium Gate, and the festive PUP Souvenir Shop (#7) across the avenue.',
    architecturalNotes:
      'Modeled directly from official PUP Vicinity Map positions and reference photographs: brick Visitor’s Lounge with arched maroon barrel roof, concrete basketball court with orange truss hoops, fenced blue-green lawn tennis court, and cream stucco PUP Souvenir Shop with angled rooftop sign and banderitas.',
    verificationStatus: 'verified',
    verifiedFeatures: [
      'Brick-clad Visitor’s Lounge (#3) with curved maroon barrel roof immediately northwest of the Pylon',
      'Outdoor Basketball, Volleyball & Lawn Tennis Courts (#4–#6) with orange hoop trusses and perimeter fencing',
      'PUP Souvenir Shop (#7) on the south entrance flank beside Mabini Shrine with rooftop sign and festive banderitas',
    ],
    approximatedFeatures: [
      'Souvenir shop merchandise display and court bleachers simplified for real-time 3D rendering',
    ],
    connectedTo: ['main-gate', 'catwalk', 'gymnasium', 'mabini-shrine'],
    mapColor: '#c76d2e',
  },
  {
    id: 'sampaguita-canteen',
    name: 'Sampaguita Building (University Canteen) & Student Center',
    shortName: 'Sampaguita & Canteen',
    category: 'student-life',
    gps: { lat: 14.59705, lng: 121.00985 },
    position: { x: -58, z: 12 },
    approachPoint: { x: -46.5, z: 12 },
    approachYaw: Math.PI / 2,
    triggerRadius: 15,
    enterable: false,
    summary:
      'PUP’s beloved riverside student dining and activity hub—anchored by the modernist Sampaguita Building / University Canteen (#22) and adjacent Student Center (#23) linking Charlie del Rosario Hall, the Main Building West Wing, and Linear Park.',
    architecturalNotes:
      'Recreated directly from campus photographs: white lower dining hall with shaded outdoor tables, projecting angled terracotta-maroon upper balcony band, full-height gridded stairwell glazing, split clerestory maroon metal roof, and nearby cream-and-orange Student Center (#23).',
    verificationStatus: 'verified',
    verifiedFeatures: [
      'Distinctive cantilevered terracotta-maroon upper balcony ribbon and split clerestory maroon roof on Sampaguita Bldg (#22)',
      'Full-height gridded stairwell window overlooking the Pasig River and Linear Park',
      'Adjacent Student Center (#23) connecting Charlie del Rosario Hall to the Lagoon stalls',
    ],
    approximatedFeatures: [
      'Exterior dining courtyard and awning seating represent typical campus canteen activity',
    ],
    connectedTo: ['main-building', 'charlie-del-rosario', 'lagoon', 'linear-park'],
    mapColor: '#cf5c36',
  },
  {
    id: 'tahanan-ng-alumni',
    name: 'PUP Tahanan ng Alumni, CHK & NFTRDC Complex',
    shortName: 'Tahanan ng Alumni & CHK',
    category: 'academic',
    gps: { lat: 14.59852, lng: 121.01028 },
    position: { x: 17.5, z: -24.5 },
    approachPoint: { x: 6.5, z: -24.5 },
    approachYaw: -Math.PI / 2,
    triggerRadius: 16,
    enterable: false,
    summary:
      'The northern academic and alumni hub bridging the Obelisk, Swimming Pool, and NALLRC—featuring the golden-ochre PUP Tahanan ng Alumni (#36), the open-corridor College of Human Kinetics Building (#35), and the NFTRDC research center (#34).',
    architecturalNotes:
      'Modeled directly from reference photographs: 3-storey golden-ochre Tahanan ng Alumni framed by four bold maroon vertical pilasters and raised white facade lettering; 2-storey College of Human Kinetics (CHK) building with aggregate-gray balcony parapet and maroon roof fascia; and the 3-storey NFTRDC lab building north of NALLRC.',
    verificationStatus: 'verified',
    verifiedFeatures: [
      'Golden-ochre PUP Tahanan ng Alumni (#36) with four tall maroon pilasters and projecting flat roof eave',
      '2-storey open-corridor College of Human Kinetics (CHK, #35) with aggregate balcony wall beside the Swimming Pool',
      '3-storey Nutrition & Food Technology Research & Development Center (NFTRDC, #34) with rounded columns and terracotta spandrels',
    ],
    approximatedFeatures: [
      'Exterior architectural models with landscaped courtyard steps and signage',
    ],
    connectedTo: ['obelisk-freedom-park', 'catwalk', 'gymnasium', 'nallrc'],
    mapColor: '#d48a28',
  },
  {
    id: 'food-nutrition-strip',
    name: 'Food & Nutrition Bldg, Gabriela Silang & FMO Strip',
    shortName: 'Food & Nutrition / FMO',
    category: 'academic',
    gps: { lat: 14.59668, lng: 121.01125 },
    position: { x: -16.5, z: 67.5 },
    approachPoint: { x: -16.5, z: 51.5 },
    approachYaw: Math.PI,
    triggerRadius: 18,
    enterable: false,
    summary:
      'The full southern academic and operations corridor behind the Main Building and Interfaith Chapel—housing the Food & Nutrition Building (#20), Gabriela Silang Building (#19), Facility Management Office (#21), and shaded campus Gazebos (#15).',
    architecturalNotes:
      'Positioned strictly from the official PUP Vicinity Map south edge: long 2-storey cream-and-maroon Food & Nutrition Building with wide covered entrance portico and central bulletin board; 2-storey terracotta-and-cream Gabriela Silang Building; utilitarian Facility Management Office (FMO) with campus utility bay; and twin octagonal campus Gazebos (#15).',
    verificationStatus: 'verified',
    verifiedFeatures: [
      '2-storey Food & Nutrition Building (#20) with covered central entrance portico, bulletin board, and maroon fascia stripes',
      'Gabriela Silang Building (#19) and Facility Management Office (#21) completing the southern campus perimeter',
      'Twin shaded octagonal PUP Gazebos (#15) along the Chapel/Grandstand and Main Building lawns',
    ],
    approximatedFeatures: [
      'Exterior architectural models; interior laboratories and offices are non-enterable',
    ],
    connectedTo: ['main-building', 'interfaith-chapel', 'tahanan-ng-atleta', 'pup-ferry-station'],
    mapColor: '#a63e32',
  },
  {
    id: 'tahanan-ng-atleta',
    name: 'Tahanan ng Atleta & PUP Oval Gate',
    shortName: 'Tahanan ng Atleta',
    category: 'sports',
    gps: { lat: 14.59735, lng: 121.01212 },
    position: { x: 26, z: 67.5 },
    approachPoint: { x: 26, z: 53.0 },
    approachYaw: Math.PI,
    triggerRadius: 15,
    enterable: false,
    summary:
      'The dedicated varsity athletes’ residence and training hall (#18) overlooking the southern bend of the PUP Track & Field Oval, alongside the southeastern Oval Gate facing Anonas Street.',
    architecturalNotes:
      'Modeled directly from inauguration photographs: iconic 2.5-storey hall with deep maroon rusticated ground floor featuring three crisp white-trimmed semicircular arched windows and central arched doorway on concrete steps, warm cream upper stories divided by white pilasters, and raised maroon TAHANAN NG ATLETA lettering.',
    verificationStatus: 'verified',
    verifiedFeatures: [
      'Deep maroon rusticated ground floor with three white-framed semicircular arched openings on steps',
      'Warm cream upper stories with white pilasters, jalousie windows, and raised TAHANAN NG ATLETA lettering',
      'Southeastern Oval Gate flanking the Anonas Street campus perimeter',
    ],
    approximatedFeatures: [
      'Exterior architectural model overlooking the Oval running track',
    ],
    connectedTo: ['oval-grandstand', 'food-nutrition-strip', 'maui-el-pueblo'],
    mapColor: '#8f2426',
  },
  {
    id: 'printing-psmo',
    name: 'Printing Press, Water Tower & Property/Supply Office',
    shortName: 'Printing Press & PSMO',
    category: 'academic',
    gps: { lat: 14.59762, lng: 121.00895 },
    position: { x: -52, z: -58.5 },
    approachPoint: { x: -51.5, z: -52.5 },
    approachYaw: 0.35,
    triggerRadius: 16,
    enterable: false,
    summary:
      'PUP’s northwestern university operations and heritage-utility district—comprising the 2-storey Printing Press Building (#27), the iconic octagonal mushroom Water Tower (#29), the Property & Supply Management Office (#28), and the industrial Water Pump Facility.',
    architecturalNotes:
      'Mapped from official PUP kiosk footprints north of Laboratory High School and NALLRC: colonnaded 2-storey cream Printing Press with shaded walkways and entry ramp, towering octagonal Water Tower with maroon portholes, cream-and-maroon PSMO warehouse, and exposed blue-and-red piping at the Water Pump Facility.',
    verificationStatus: 'verified',
    verifiedFeatures: [
      '2-storey colonnaded PUP Printing Press Building (#27) with accessible ramp and upper dark railings',
      'Octagonal mushroom Water Tower (#29) paired with PSMO (#28) and exposed Water Pump manifold station',
    ],
    approximatedFeatures: [
      'Exterior utility and printing press buildings; pump station piping simplified for real-time rendering',
    ],
    connectedTo: ['nallrc', 'charlie-del-rosario', 'linear-park'],
    mapColor: '#5c6b78',
  },
  {
    id: 'maui-el-pueblo',
    name: 'South Anonas, Barangay 630 Hall, Maui Oasis, Futura Centro & El Pueblo',
    shortName: 'Brgy. 630 · Maui Oasis & El Pueblo',
    category: 'student-life',
    gps: { lat: 14.59735, lng: 121.01275 },
    position: { x: 76, z: 92 },
    approachPoint: { x: 89.2, z: 57.8 },
    approachYaw: Math.PI - 0.14,
    triggerRadius: 26,
    enterable: false,
    summary:
      'The bustling 630 Anonas Street corridor running past PUP’s ribbed Oval perimeter wall, Alfamart Anonas, the two-story royal-blue & yellow Barangay 630 Zone 63 Hall, Barangay Covered Court, and Anonas–PUP TODA tricycle terminal, curving southwest past Maui Oasis by Filinvest’s main archway & pool courtyard, roadside carinderias/water-refilling stalls, Futura Centro, El Pueblo Triangle, and El Pueblo Manila Condominium.',
    architecturalNotes:
      'Photo-matched directly to 2026 Google Maps satellite imagery and street-level photography of 630 Anonas Street (Barangay 630, Zone 63, District VI, Manila): two-story royal-blue, yellow & white Barangay 630 Hall with Tanod outpost, flagpole & Patrol Multicab; adjacent covered basketball half-court; Alfamart convenience store; Anonas–PUP TODA waiting shed; Meralco poles with overhead cables, convex corner traffic mirror, pedestrian crosswalks, speed humps, fire hydrants & parked vehicles; Hawaiian stone-clad Maui Oasis main gatehouse & resort pool; South-East carinderia/water-refilling/vulcanizing shops; Futura Centro, El Pueblo Triangle, and El Pueblo Manila commercial gatehouse.',
    verificationStatus: 'verified',
    verifiedFeatures: [
      'Two-story Barangay 630 Zone 63 Hall (630 Anonas St) with Tanod outpost, Philippine flagpole, Patrol Multicab, and adjacent Covered Multi-Purpose Court',
      'Alfamart Anonas, Anonas–PUP TODA tricycle terminal, SE roadside water-refilling/laundry/carinderia/vulcanizing stalls, Meralco poles, crosswalks, speed humps & convex traffic mirror',
      'PUP cream-and-maroon Oval perimeter wall (2281–2315 Anonas St), vine-draped wall with Hawaiian Maui Oasis Main Gatehouse & pool courtyard, Futura Centro, El Pueblo Triangle & El Pueblo Manila',
    ],
    approximatedFeatures: [
      'Condominium interiors and private resident driveways beyond the gatehouses are exterior architectural reconstructions',
    ],
    connectedTo: ['main-gate', 'tahanan-ng-atleta'],
    mapColor: '#b36b43',
  },
];

export const CAMPUS_NPCS: NpcProfile[] = [
  {
    id: 'guard-jun',
    name: 'Kuya Jun Mendoza',
    role: 'Chief Gate Security Officer',
    roleCategory: 'Security Guard',
    department: 'PUP University Security Office',
    personality:
      'Warm, vigilant, respectful, and deeply proud of keeping PUP Sta. Mesa safe for over 14 years. Uses polite Filipino-English ("po", "Isko/Iska") naturally without overdoing it.',
    appearance: {
      skinTone: '#c68d65',
      hairColor: '#1d1b1a',
      hairStyle: 'cap',
      topColor: '#25426b',
      bottomColor: '#1b2434',
      accentColor: '#e5a91a',
      hasLanyard: true,
      hasClipboard: true,
    },
    greeting:
      'Magandang araw po! Welcome to PUP A. Mabini Main Campus. Straight ahead down the avenue is the Obelisk and Freedom Park—let me know if you need directions to any building!',
    knowledgeScope:
      'Knows every entrance, gate procedure, Pylon and Mural history, the Catwalk, Obelisk roundabout, Lagoon, NALLRC, Mabini Shrine, and the active North Wing DPWH reconstruction. Does not invent private student records.',
    homeLandmarkId: 'main-gate',
    spawn: { x: 67.2, z: -2.0 },
    schedule: {
      morning: { landmarkId: 'main-gate', position: { x: 67.2, z: -2.0 }, activity: 'Checking student IDs inside the Main Gate near the P-U-P Pylon & Mural' },
      midday: { landmarkId: 'catwalk', position: { x: 56, z: -8.5 }, activity: 'Monitoring pedestrian flow along the Catwalk and main avenue' },
      afternoon: { landmarkId: 'main-gate', position: { x: 67.2, z: -2.0 }, activity: 'Directing visitors past the Pylon and Bronze Mural' },
      dusk: { landmarkId: 'main-gate', position: { x: 73, z: -5.5 }, activity: 'Supervising evening dismissal at the Anonas Street Main Gate' },
    },
    sampleQuestions: [
      'Where is the NALLRC library from here?',
      'What do the three marble pillars of the Pylon symbolize?',
      'What is under construction near the Main Building?',
    ],
  },
  {
    id: 'student-maya',
    name: 'Maya Santos',
    role: '3rd Year BS Computer Science Student',
    roleCategory: 'Student',
    department: 'College of Computer and Information Sciences (CCIS)',
    personality:
      'Enthusiastic, witty, practical Iskolar ng Bayan who loves Lagoon iced coffee, coding marathons, and helping freshmen navigate the Main Building star wings.',
    appearance: {
      skinTone: '#d4a17e',
      hairColor: '#1e1918',
      hairStyle: 'long',
      topColor: '#7b1113',
      bottomColor: '#2c3647',
      accentColor: '#e5a91a',
      hasBackpack: true,
      hasLanyard: true,
      hasGlasses: true,
    },
    greeting:
      'Hey! Exploring Sta. Mesa campus? From the Obelisk here you can walk straight into Freedom Park, duck into the Lagoon for food, or head to the Main Building!',
    knowledgeScope:
      'Knows student life, redeveloped Lagoon plaza & food stalls, Freedom Park tambayan spots, NALLRC study tables, Main Building star-wing orientation, and CCIS student life.',
    homeLandmarkId: 'obelisk-freedom-park',
    spawn: { x: 24, z: -1.5 },
    schedule: {
      morning: { landmarkId: 'obelisk-freedom-park', position: { x: 24, z: -1.5 }, activity: 'Waiting for classmates beside the PUP Obelisk roundabout' },
      midday: { landmarkId: 'lagoon', position: { x: -10, z: -14 }, activity: 'Grabbing lunch and iced coffee in the redeveloped PUP Lagoon' },
      afternoon: { landmarkId: 'nallrc', position: { x: -24, z: -42 }, activity: 'Reviewing data structures inside the NALLRC reading room', sitting: false },
      dusk: { landmarkId: 'linear-park', position: { x: -65, z: 6 }, activity: 'Watching the Pasig River sunset along Linear Park' },
    },
    sampleQuestions: [
      'What do students usually do around the Lagoon?',
      'How do I get from here to the Main Building lobby?',
      'Where is the Interfaith Chapel?',
    ],
  },
  {
    id: 'prof-reyes',
    name: 'Prof. Ernesto Reyes',
    role: 'Associate Professor of Philippine History',
    roleCategory: 'Professor',
    department: 'College of Social Sciences and Development (CSSD)',
    personality:
      'Articulate, thoughtful, and passionate about Apolinario Mabini, PUP’s history from Manila Business School (1904) to Polytechnic University, and civic engagement.',
    appearance: {
      skinTone: '#bd8764',
      hairColor: '#5c5856',
      hairStyle: 'short',
      topColor: '#e8e2d5',
      bottomColor: '#363331',
      accentColor: '#7b1113',
      hasLanyard: true,
      hasGlasses: true,
      hasClipboard: true,
    },
    greeting:
      'Good day! Always wonderful to see visitors pausing by the mint-green Mabini Shrine. Care to discuss Apolinario Mabini or PUP’s architectural heritage?',
    knowledgeScope:
      'Expert on PUP history, Apolinario Mabini and the relocated Mabini Shrine, Freedom Park’s legacy, and the 1960s origins of the radiating Main Academic Building.',
    homeLandmarkId: 'mabini-shrine',
    spawn: { x: 24, z: 4.5 },
    schedule: {
      morning: { landmarkId: 'mabini-shrine', position: { x: 24, z: 4.5 }, activity: 'Preparing lecture notes outside the Museo ni Apolinario Mabini' },
      midday: { landmarkId: 'main-building', position: { x: -28, z: 26 }, activity: 'Greeting students inside the Main Building Dome Rotunda' },
      afternoon: { landmarkId: 'main-building', position: { x: -28, z: 41 }, activity: 'Holding an open history discussion in East Wing Room E-104' },
      dusk: { landmarkId: 'obelisk-freedom-park', position: { x: 8, z: 6 }, activity: 'Strolling across the tiled Freedom Park plaza' },
    },
    sampleQuestions: [
      'Why is the Mabini Shrine located inside PUP?',
      'Tell me about the history of the Main Building.',
      'What is the significance of Freedom Park?',
    ],
  },
  {
    id: 'admin-clara',
    name: 'Ma’am Clara Villanueva',
    role: 'University Administrative Officer',
    roleCategory: 'Admin Staff',
    department: 'Office of Student Services & Main Building Reception',
    personality:
      'Organized, courteous, clear-spoken, and helpful with campus orientation, the Main Building’s radiating wings, and administrative guidance.',
    appearance: {
      skinTone: '#d9aa87',
      hairColor: '#2b201c',
      hairStyle: 'bun',
      topColor: '#f3efe6',
      bottomColor: '#580b0d',
      accentColor: '#e5a91a',
      hasLanyard: true,
      hasClipboard: true,
    },
    greeting:
      'Welcome inside the PUP Main Building Central Dome Rotunda! Let me know if you need help navigating our East, South, or West Wings—or checking updates on the North Wing reconstruction.',
    knowledgeScope:
      'Knows the Main Building star-wing layout (East, South, West, and rebuilding North Wing), Dome Rotunda, Room E-104, and campus offices.',
    homeLandmarkId: 'main-building',
    spawn: { x: -28, z: 27 },
    schedule: {
      morning: { landmarkId: 'main-building', position: { x: -28, z: 27 }, activity: 'Assisting students at the Main Building Dome Rotunda' },
      midday: { landmarkId: 'main-building', position: { x: -28, z: 27 }, activity: 'Coordinating campus visitors at the Central Rotunda' },
      afternoon: { landmarkId: 'main-building', position: { x: -28, z: 36 }, activity: 'Checking bulletin notices along the East Wing hallway' },
      dusk: { landmarkId: 'main-building', position: { x: -28, z: 27 }, activity: 'Wrapping up afternoon inquiries in the Dome Rotunda' },
    },
    sampleQuestions: [
      'How are the wings of the Main Building arranged?',
      'Where can I find student organizations on campus?',
      'Is there a classroom open on the ground floor?',
    ],
  },
  {
    id: 'librarian-elena',
    name: 'Ms. Elena Corpuz',
    role: 'Head Reference Librarian',
    roleCategory: 'Librarian',
    department: 'Ninoy Aquino Library & Learning Resources Center (NALLRC)',
    personality:
      'Calm, scholarly, encouraging, and softly spoken—always glad to help students locate study spaces, Filipiniana collections, and digital catalogs.',
    appearance: {
      skinTone: '#d29f7d',
      hairColor: '#251e1c',
      hairStyle: 'bun',
      topColor: '#355470',
      bottomColor: '#232830',
      accentColor: '#e5a91a',
      hasGlasses: true,
      hasLanyard: true,
    },
    greeting:
      'Hello, and welcome to the Ninoy Aquino Library and Learning Resources Center. Feel free to explore the reading hall and check our OPAC catalog terminal.',
    knowledgeScope:
      'Knows NALLRC layout, study etiquette, reading rooms, OPAC terminals, and nearby campus landmarks (Lagoon, Charlie del Rosario Hall, Gymnasium, Linear Park).',
    homeLandmarkId: 'nallrc',
    spawn: { x: -22, z: -43 },
    schedule: {
      morning: { landmarkId: 'nallrc', position: { x: -22, z: -43 }, activity: 'Welcoming researchers at the NALLRC ground-floor circulation hall' },
      midday: { landmarkId: 'nallrc', position: { x: -27, z: -45 }, activity: 'Organizing reference shelves inside the NALLRC reading room' },
      afternoon: { landmarkId: 'nallrc', position: { x: -22, z: -43 }, activity: 'Assisting thesis students near the NALLRC OPAC computers' },
      dusk: { landmarkId: 'nallrc', position: { x: -18, z: -38 }, activity: 'Preparing evening library closing reminders near the NALLRC doors' },
    },
    sampleQuestions: [
      'What facilities are inside the NALLRC?',
      'Where is the quietest spot to study on campus?',
      'How do I walk from the Library to the Linear Park?',
    ],
  },
  {
    id: 'student-marco',
    name: 'Marco Dizon',
    role: '4th Year BS Civil Engineering Student',
    roleCategory: 'Student',
    department: 'College of Engineering (CEA)',
    personality:
      'Friendly, observant, loves discussing structural engineering, the Main Building’s cantilevered balconies, the 9-storey North Wing DPWH project, and Lagoon food stalls.',
    appearance: {
      skinTone: '#c18963',
      hairColor: '#1a1817',
      hairStyle: 'short',
      topColor: '#e2e5ea',
      bottomColor: '#2d3748',
      accentColor: '#7b1113',
      hasBackpack: true,
      hasLanyard: true,
    },
    greeting:
      'Yo! Checking out the redeveloped PUP Lagoon? Between classes I usually grab iced coffee here or check the progress on the 9-storey North Wing concrete frame!',
    knowledgeScope:
      'Knows Lagoon food culture and redeveloped brick plaza, Amphitheater hangouts, Main Building concrete engineering, the ongoing 9-storey North Wing DPWH concrete skeleton, and nearby NALLRC and Gym.',
    homeLandmarkId: 'lagoon',
    spawn: { x: -6, z: -12 },
    schedule: {
      morning: { landmarkId: 'lagoon', position: { x: -6, z: -12 }, activity: 'Sketching architectural notes near the PUP Lagoon brick plaza' },
      midday: { landmarkId: 'lagoon', position: { x: -22, z: -18 }, activity: 'Waiting in line at the Lagoon concessionaire stalls' },
      afternoon: { landmarkId: 'north-wing-construction', position: { x: 1, z: 7 }, activity: 'Observing the 9-storey North Wing DPWH structural columns from Freedom Park' },
      dusk: { landmarkId: 'oval-grandstand', position: { x: 28, z: 36 }, activity: 'Jogging cool-down laps around the PUP Oval' },
    },
    sampleQuestions: [
      'Why do students love hanging out at the Lagoon?',
      'What is happening with the North Wing construction?',
      'What makes the Main Building architecture unique?',
    ],
  },
  {
    id: 'student-trisha',
    name: 'Trisha Alcantara',
    role: 'Campus Journalist & BA Journalism Senior',
    roleCategory: 'Student',
    department: 'College of Communication / Student Development Hub',
    personality:
      'Curious, articulate, socially aware, always covering student council events, cultural showcases, and campus life around Charlie del Rosario Hall and Freedom Park.',
    appearance: {
      skinTone: '#d7a582',
      hairColor: '#221a17',
      hairStyle: 'short',
      topColor: '#d99b1e',
      bottomColor: '#232326',
      accentColor: '#7b1113',
      hasBackpack: true,
      hasLanyard: true,
    },
    greeting:
      'Hi there! Working on a campus feature outside Charlie del Rosario Hall. Are you visiting the student org offices or heading down to Linear Park?',
    knowledgeScope:
      'Knows Charlie del Rosario Student Development Center, student org culture, Freedom Park assemblies, and routes to Linear Park, Lagoon, and the Main Building West Wing.',
    homeLandmarkId: 'charlie-del-rosario',
    spawn: { x: -45, z: -10 },
    schedule: {
      morning: { landmarkId: 'charlie-del-rosario', position: { x: -45, z: -10 }, activity: 'Posting updates by the Charlie del Rosario Hall entrance' },
      midday: { landmarkId: 'obelisk-freedom-park', position: { x: 6, z: 8 }, activity: 'Interviewing students at Freedom Park' },
      afternoon: { landmarkId: 'charlie-del-rosario', position: { x: -45, z: -10 }, activity: 'Editing articles outside Charlie del Rosario Hall' },
      dusk: { landmarkId: 'linear-park', position: { x: -65, z: -4 }, activity: 'Unwinding along the Pasig River at Linear Park' },
    },
    sampleQuestions: [
      'Who was Charlie del Rosario?',
      'What happens at Freedom Park?',
      'How do I get to the Pasig River Linear Park?',
    ],
  },
  {
    id: 'maint-ramon',
    name: 'Mang Ramon Bautista',
    role: 'Campus Grounds & Facilities Caretaker',
    roleCategory: 'Maintenance',
    department: 'PUP Physical Facilities Management Office',
    personality:
      'Kind-hearted, practical, knows every shortcut, tree, bench, and quiet corner of the campus. Takes great pride in keeping the grounds clean and green.',
    appearance: {
      skinTone: '#b57b55',
      hairColor: '#3a3735',
      hairStyle: 'cap',
      topColor: '#3d6b4c',
      bottomColor: '#383430',
      accentColor: '#d4c39a',
      hasLanyard: true,
    },
    greeting:
      'Magandang araw! Enjoy the breeze coming off the Pasig River here at Linear Park—we just trimmed the bougainvillea and swept under the acacia trees.',
    knowledgeScope:
      'Knows all walkways, shaded benches, Linear Park promenade, Pasig River Ferry Station, Interfaith Chapel garden, and Oval grounds.',
    homeLandmarkId: 'linear-park',
    spawn: { x: -65, z: 14 },
    schedule: {
      morning: { landmarkId: 'linear-park', position: { x: -65, z: 14 }, activity: 'Tending the palms and riverfront benches at Linear Park' },
      midday: { landmarkId: 'interfaith-chapel', position: { x: -2, z: 29 }, activity: 'Maintaining the circular garden around the Interfaith Chapel' },
      afternoon: { landmarkId: 'lagoon', position: { x: -10, z: -22 }, activity: 'Checking the walkways around the PUP Lagoon' },
      dusk: { landmarkId: 'oval-grandstand', position: { x: 24, z: 32 }, activity: 'Tidying the bleachers at the PUP Grandstand' },
    },
    sampleQuestions: [
      'Where is the PUP Pasig River Ferry Station?',
      'How do I walk from here to the Interfaith Chapel?',
      'Do you know where the Oval is?',
    ],
  },
  {
    id: 'prof-diane',
    name: 'Coach Diane Navarro',
    role: 'Physical Education Instructor',
    roleCategory: 'Professor',
    department: 'College of Human Kinetics (CHK)',
    personality:
      'Energetic, encouraging, organized, coaches track drills and student wellness classes at the Oval, Grandstand, Tennis Courts, and Gymnasium.',
    appearance: {
      skinTone: '#c9936d',
      hairColor: '#1f1918',
      hairStyle: 'bun',
      topColor: '#8c191c',
      bottomColor: '#1d2128',
      accentColor: '#f5f2eb',
      hasLanyard: true,
      hasClipboard: true,
    },
    greeting:
      'Hey! Great weather for a lap around the PUP Oval! The Grandstand is right here, and the Gym, Pool, and Tennis Courts are just north across the avenue.',
    knowledgeScope:
      'Knows the Track & Field Oval, Grandstand, Gymnasium, Swimming Pool, Tennis Courts, and nearby Mabini Shrine and Interfaith Chapel.',
    homeLandmarkId: 'oval-grandstand',
    spawn: { x: 26, z: 32 },
    schedule: {
      morning: { landmarkId: 'oval-grandstand', position: { x: 26, z: 32 }, activity: 'Supervising morning track warm-ups by the PUP Grandstand' },
      midday: { landmarkId: 'gymnasium', position: { x: 38, z: -32 }, activity: 'Coordinating indoor P.E. sessions outside the PUP Gymnasium' },
      afternoon: { landmarkId: 'oval-grandstand', position: { x: 26, z: 32 }, activity: 'Timing afternoon running drills at the PUP Oval' },
      dusk: { landmarkId: 'interfaith-chapel', position: { x: 8, z: 38 }, activity: 'Pausing for a quiet evening moment outside the Interfaith Chapel' },
    },
    sampleQuestions: [
      'What sports facilities are here on campus?',
      'Where is the Swimming Pool located?',
      'Can I go inside the Interfaith Chapel nearby?',
    ],
  },
  {
    id: 'visitor-leo',
    name: 'Leo Pangilinan',
    role: 'Prospective PUPCET Applicant & Visitor',
    roleCategory: 'Visitor',
    department: 'Senior High School Visitor from Quezon City',
    personality:
      'Excited, slightly nervous about taking the PUPCET entrance exam, amazed by the pyramidal Interfaith Chapel, the towering white Obelisk, and the scale of the Main Building.',
    appearance: {
      skinTone: '#d9ac8c',
      hairColor: '#1d1a19',
      hairStyle: 'short',
      topColor: '#3f729b',
      bottomColor: '#3c3a37',
      accentColor: '#f5f2eb',
      hasBackpack: true,
    },
    greeting:
      'Oh hi! Are you a PUP student? I’m visiting ahead of the PUPCET—seeing the white Obelisk right from the Main Gate and this octagonal Interfaith Chapel is way cooler in person!',
    knowledgeScope:
      'Knows basic visitor impressions of the Main Gate, P-U-P Pylon, Obelisk, Interfaith Chapel, and Main Building exterior; honestly admits he is still exploring.',
    homeLandmarkId: 'interfaith-chapel',
    spawn: { x: -2, z: 28 },
    schedule: {
      morning: { landmarkId: 'interfaith-chapel', position: { x: -2, z: 28 }, activity: 'Admiring the white concrete ribs and terracotta roof of the Interfaith Chapel' },
      midday: { landmarkId: 'obelisk-freedom-park', position: { x: 18, z: 2 }, activity: 'Taking photos of the PUP Obelisk and Freedom Park' },
      afternoon: { landmarkId: 'lagoon', position: { x: -8, z: -16 }, activity: 'Exploring the redeveloped Lagoon plaza and food stalls for the first time' },
      dusk: { landmarkId: 'main-gate', position: { x: 65, z: -6 }, activity: 'Heading back toward the Main Gate along the Catwalk' },
    },
    sampleQuestions: [
      'What has impressed you most about the campus so far?',
      'Which course are you hoping to study at PUP?',
      'Have you visited the NALLRC library yet?',
    ],
  },
];

export const INSPECTABLE_ITEMS: InspectableItem[] = [
  {
    id: 'sign-pylon-plaque',
    title: 'The PUP Pylon & Mural Marker',
    subtitle: 'Main Entrance · Anonas Street, Sta. Mesa (14.5991°N, 121.0116°E)',
    kind: 'plaque',
    landmarkId: 'main-gate',
    position: { x: 75.2, y: 1.4, z: -12.2 },
    body: [
      'The iconic triad of white veined-marble Pylon pillars bearing the letters P, U, and P symbolizes Truth, Excellence, and Wisdom—originally conceived as the True, the Good, and the Beautiful.',
      'Flanking the south side of the entrance stands the terracotta-clad wall carrying the dark oxidized-bronze sculptural Mural depicting Filipino scholars, industrial workers, gears, and books driving national progress.',
      'Founded in 1904 as the Manila Business School and elevated to university status in 1978, PUP A. Mabini Campus in Sta. Mesa is the flagship campus of the country’s first Polytechnic University.',
    ],
    verificationNote: 'Modeled directly from PUP Sta. Mesa entrance photography and OSM coordinates.',
  },
  {
    id: 'sign-mabini-nhcp',
    title: 'Museo ni Apolinario Mabini — Historical Marker',
    subtitle: 'NHCP Shrine · South of Main Avenue (14.5982°N, 121.0112°E)',
    kind: 'plaque',
    landmarkId: 'mabini-shrine',
    position: { x: 39.5, y: 1.35, z: 7.2 },
    body: [
      'This historic mint-green timber and cogon-thatched residence—originally standing in Nagtahan, Pandacan—was the home where Apolinario Mabini (1864–1903), the "Sublime Paralytic" and chief adviser to the Philippine Revolution, lived during his final years.',
      'Carefully relocated to the PUP Sta. Mesa grounds, it is maintained as a national shrine and museum by the National Historical Commission of the Philippines (NHCP).',
      'The PUP Main Campus bears the official name A. Mabini Campus in honor of his intellect, integrity, and lifelong dedication to public service.',
    ],
    verificationNote: 'Verified NHCP shrine placement and exterior mint-green & cogon-thatch architecture.',
  },
  {
    id: 'board-main-lobby',
    title: 'Main Building Dome Rotunda Directory',
    subtitle: 'Central Dome · Ground Floor (14.5971°N, 121.0107°E)',
    kind: 'board',
    landmarkId: 'main-building',
    position: { x: -21.5, y: 1.8, z: 28.5 },
    body: [
      'RADIATING WING DIRECTORY: East Wing (extending south with Ground-Floor Room E-104), South Wing (southwest double courtyard academic wing), West Wing (northwest wing toward Charlie del Rosario Hall & Linear Park), Central Dome (Rotunda & Reception).',
      'NORTH WING ADVISORY: The northeast North Wing axis facing Freedom Park is closed for the ongoing DPWH 9-Storey Main Academic Building Redevelopment.',
      'REMINDER: Keep corridors clear, observe quiet hours near lecture rooms, and visit the NALLRC immediately north of the Lagoon for digital library access.',
    ],
    verificationNote: 'Matches PUP Main Building star-wing geometry from official campus maps & OSM.',
  },
  {
    id: 'board-north-wing-dpwh',
    title: 'DPWH / PUP Project Billboard — New 9-Storey North Wing',
    subtitle: 'Active Campus Construction Site · Northeast Axis Facing Freedom Park',
    kind: 'board',
    landmarkId: 'north-wing-construction',
    position: { x: 1.2, y: 1.7, z: 9.8 },
    body: [
      'PROJECT: Construction of the New 9-Storey Disaster-Resilient PUP Main Academic Building (North Wing Replacement) — Planned capacity of ~300 classrooms.',
      'STATUS UPDATE: Groundbreaking took place in September 2022 under DPWH Phase 1 funding (~₱187M). Following bidding delays and capital outlay shortfalls, the concrete structural frame and rebar columns have stood partially finished while PUP and DPWH pursue roughly ₱500M in additional funding targeting completion by 2027.',
      'SAFETY NOTICE: Authorized construction personnel only beyond the corrugated GI hoarding. Use Freedom Park or the Lagoon pathways when walking between the Main Building and the Obelisk.',
    ],
    verificationNote: 'Grounded in verified public PUP & Philippine infrastructure news updates (2022–2026).',
  },
  {
    id: 'desk-classroom-s104',
    title: 'Room E-104 — Lecture Schedule & Chalkboard Notes',
    subtitle: 'Main Building East Wing · Ground Floor',
    kind: 'desk',
    landmarkId: 'main-building',
    position: { x: -28, y: 1.3, z: 46.5 },
    body: [
      'GEED 10013 — Life and Works of Rizal / Philippine History (Prof. Ernesto Reyes, CSSD)',
      'Today’s Seminar Topic: "Apolinario Mabini’s True Decalogue and Public Higher Education in the Philippines."',
      'Next Period: COMP 20163 — Data Structures & Algorithms Review Session (CCIS).',
    ],
    verificationNote: 'Representative PUP ground-floor lecture classroom inside the operational East Wing.',
  },
  {
    id: 'computer-nallrc-opac',
    title: 'NALLRC Digital Research & Catalog Terminal',
    subtitle: 'Ninoy Aquino Library & Learning Resources Center · 1F Reading Hall',
    kind: 'computer',
    landmarkId: 'nallrc',
    position: { x: -25.5, y: 1.25, z: -41.5 },
    body: [
      'PUP NALLRC LIBRARY DIRECTORY — Ground Floor: Circulation Counter, General Reference, OPAC Search Terminals & Study Hall.',
      'Upper Floors (Architectural Exterior in 3D): Filipiniana & Archives, Periodicals & Thesis Repository, E-Learning Hub, Graduate School & College of Law Reading Sections.',
      'Tip: Ask Ms. Elena Corpuz at the circulation desk or open the AI Campus Assistant [Tab] for guided navigation to any campus building.',
    ],
    verificationNote: 'Verified NALLRC institutional role and T-wing modernist white concrete architecture.',
  },
  {
    id: 'board-charlie-orgs',
    title: 'Student Organizations & Campus Life Board',
    subtitle: 'Charlie del Rosario Student Development Center',
    kind: 'board',
    landmarkId: 'charlie-del-rosario',
    position: { x: -46.8, y: 1.7, z: -11.5 },
    body: [
      'CHARLIE DEL ROSARIO HALL: Dedicated to PUP alumnus and student leader Charlie del Rosario, serving as the home of the Central Student Council, campus publications, and accredited student organizations.',
      'WEEKLY ACTIVITIES: Cultural rehearsals at the Lagoon Amphitheater (4:00 PM), Freshmen Orientation Walk starting at the PUP Obelisk, and Track & Field conditioning at the PUP Oval.',
      'STUDENT WELFARE: Shaded seating and river views are steps away along the Linear Park promenade.',
    ],
    verificationNote: 'Verified student hub placement alongside Lab High School and Linear Park.',
  },
  {
    id: 'plaque-mabini-museum',
    title: 'Museo ni Mabini-PUP Gallery Annex (#9)',
    subtitle: 'NHCP Exhibition Hall · West of Mabini Shrine',
    kind: 'plaque',
    landmarkId: 'mabini-shrine',
    position: { x: 24.0, y: 1.35, z: 8.6 },
    body: [
      'MUSEO NI MABINI-PUP: Maintained by the National Historical Commission of the Philippines (NHCP) directly beside Apolinario Mabini’s relocated nipa-and-timber home (#8).',
      'GALLERY HOURS: Open Tuesday to Sunday, 8:00 AM – 4:00 PM (Closed Mondays for maintenance). Exhibits highlight Mabini’s manuscripts, revolutionary decrees, and personal artifacts.',
      'Just east along the avenue sits the PUP Souvenir Shop (#7) offering official university apparel and Iskolar ng Bayan keepsakes.',
    ],
    verificationNote: 'Modeled directly from official PUP Vicinity Map (#9) and NHCP signboard photography.',
  },
  {
    id: 'board-sampaguita-canteen',
    title: 'Sampaguita Building & University Canteen Directory (#22)',
    subtitle: 'Riverside Student Dining Hub · Between West Wing & Charlie Hall',
    kind: 'board',
    landmarkId: 'sampaguita-canteen',
    position: { x: -51.8, y: 1.7, z: 16.5 },
    body: [
      'SAMPAGUITA BUILDING (#22): PUP’s iconic multi-storey University Canteen overlooking Linear Park and the Pasig River, serving budget student meals, rice bowls, snacks, and cold drinks.',
      'STUDENT CENTER (#23): Directly northeast toward Charlie del Rosario Hall and the Lagoon stalls, hosting student affairs desks and meeting rooms.',
      'TIP: Walk west onto the Linear Park promenade for shaded riverside seating or south to the PUP Pasig River Ferry Station.',
    ],
    verificationNote: 'Matches PUP Vicinity Map (#22–#23) and Sampaguita Building exterior photography.',
  },
  {
    id: 'plaque-tahanan-alumni',
    title: 'PUP Tahanan ng Alumni & Varsity Athletes’ Corridor (#36 & #18)',
    subtitle: 'Alumni & College of Human Kinetics Complex · North Campus',
    kind: 'plaque',
    landmarkId: 'tahanan-ng-alumni',
    position: { x: 12.6, y: 1.35, z: -24.5 },
    body: [
      'PUP TAHANAN NG ALUMNI (#36): Built in partnership with FEDAAPI and PUP Alumni Associations as a welcoming home for returning Iskolar ng Bayan alumni, conferences, and scholarship programs.',
      'COLLEGE OF HUMAN KINETICS (#35) & SPORTS COMPLEX: Directly adjacent are the 2-storey CHK Academic Building, 25m Olympic Swimming Pool (#37), arched Gymnasium (#38), and NFTRDC research building (#34).',
      'Across the Oval to the south stands the PUP Alumni Association–USA sponsored Tahanan ng Atleta (#18) supporting university varsity athletes.',
    ],
    verificationNote: 'Grounded in official PUP Sta. Mesa maps and Tahanan ng Alumni / Tahanan ng Atleta photos.',
  },
  {
    id: 'sign-teresa-brgy591',
    title: 'Teresa Street — PNR Entry & Student Strip Guide',
    subtitle: 'Teresa St., Brgy. 591, Sta. Mesa · ~65m East of PUP Main Gate',
    kind: 'plaque',
    landmarkId: 'anonas-teresa',
    position: { x: 122.5, y: 1.35, z: -9.6 },
    body: [
      'WELCOME TO TERESA STREET (BRGY. 591, ZONE 58, STA. MESA, MANILA): Stepping out of PUP’s Main Gate across Anonas Street (~15m) and the PNR Sta. Mesa / NLEX-SLEX Connector RR XING (~42m) opens directly onto Teresa Street.',
      'NORTH SIDE (LEFT): Banana Island → GCash / Tarpaulin & Xerox Print → Smokle Vape Shop → 7-Eleven Teresa → Esperanza Health Center & Lying-In Clinic → Teresa Chapel (Alay sa Mahal na Krus) → Teresa Covered Court.',
      'SOUTH SIDE (RIGHT): RBS Bookbinding & Palceso Printing → Chacha Canteen & Angelina’s Store → PST (Pastil sa Tabi) & Takam → Eufrosino’s Fruit / Ramos Print / RDP Graphics → Smile POD Dental & Elegance → Angel’s Burger & Palawan Express (PUP Sta. Mesa) → Barangay 591 Hall & Mubyl → Old Sta. Mesa St. & Cebuana Lhuillier (~215m).',
    ],
    verificationNote: 'Mapped frame-by-frame from May 2026 Google Street View (Instant Street View) and Google Maps WGS84 coordinates.',
  },
  {
    id: 'sign-teresa-chapel',
    title: 'Esperanza Health Center, Teresa Chapel & Covered Court',
    subtitle: 'East Teresa Street, Brgy. 591 · ~180m East of PUP Main Gate',
    kind: 'plaque',
    landmarkId: 'anonas-teresa',
    position: { x: 185.2, y: 1.35, z: -9.6 },
    body: [
      'ESPERANZA HEALTH CENTER & TERESA CHAPEL: Standing side-by-side along the north side of east Teresa Street are the mint-green Esperanza Health Center & Lying-In Clinic (PhilHealth YAKAP), the white-and-mahogany Teresa Chapel (Alay sa Mahal na Krus), and the white arched gateway of Teresa Covered Court.',
      'Directly across the street stand Angel’s Burger, Palawan Pawnshop & Palawan Express (PUP Sta. Mesa), Barangay 591 Hall (Zone 58, Dist. 6), Mubyl, and the blue Virgin Mary corner grotto.',
      'Step ~25m further east to reach the Old Sta. Mesa Street & Stop & Shop / Cebuana Lhuillier junction (~215m total from PUP Main Gate).',
    ],
    verificationNote: 'Modeled directly from May 2026 Instant Street View captures along Teresa Street and Old Sta. Mesa St.',
  },
];
