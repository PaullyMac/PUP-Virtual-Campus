import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeCampusDirections,
  dampAngle,
  estimateRealWorldDistanceMeters,
  findNearestLandmark,
  findOverlappingFootprints,
  getCompassDirection,
  getNpcScheduleSlot,
  getSurfaceTypeAt,
  matchLandmarkFromQuery,
  resolveCircleAABBCollisions,
  stepHorizontalVelocity,
} from './campusLogic';
import { CAMPUS_LANDMARKS, CAMPUS_NPCS, PLAYER_SPAWN } from './campusData';
import { computeGpsBearingDeg, haversineDistanceMeters, projectGpsToLocalMeters } from './geoProjection';

test('compass directions match Three.js PUP campus axes (+X East, -X West, -Z North, +Z South)', () => {
  assert.equal(getCompassDirection({ x: 0, z: 0 }, { x: 20, z: 0 }), 'east');
  assert.equal(getCompassDirection({ x: 0, z: 0 }, { x: -20, z: 0 }), 'west');
  assert.equal(getCompassDirection({ x: 0, z: 0 }, { x: 0, z: -20 }), 'north');
  assert.equal(getCompassDirection({ x: 0, z: 0 }, { x: 0, z: 20 }), 'south');
  assert.equal(getCompassDirection({ x: 0, z: 0 }, { x: -20, z: -20 }), 'northwest');
});

test('player spawn starts near Main Gate / Pylon trigger area', () => {
  const nearest = findNearestLandmark({ x: PLAYER_SPAWN.x, z: PLAYER_SPAWN.z });
  assert.equal(nearest.landmark.id, 'main-gate');
  assert.equal(nearest.insideTrigger, true);
});

test('computeCampusDirections finds verified walkable route from Main Building to NALLRC using Google Maps distances', () => {
  const route = computeCampusDirections('main-building', 'nallrc');
  assert.equal(route.found, true);
  assert.equal(route.landmarks[0].id, 'main-building');
  assert.equal(route.landmarks[route.landmarks.length - 1].id, 'nallrc');
  assert.ok(route.totalDistanceMeters > 120, `expected Google Maps route > 120m, got ${route.totalDistanceMeters}`);
  assert.ok(route.summary.includes('NALLRC'));
});

test('Google Maps WGS84 geodesy accurately computes real-world PUP Sta. Mesa landmark distances', () => {
  const gate = CAMPUS_LANDMARKS.find((l) => l.id === 'main-gate')!;
  const obelisk = CAMPUS_LANDMARKS.find((l) => l.id === 'obelisk-freedom-park')!;
  const mainBldg = CAMPUS_LANDMARKS.find((l) => l.id === 'main-building')!;

  const gateToObelisk = haversineDistanceMeters(gate.gps, obelisk.gps);
  assert.ok(gateToObelisk >= 150 && gateToObelisk <= 162, `expected ~156m, got ${gateToObelisk}`);

  const obeliskToMain = haversineDistanceMeters(obelisk.gps, mainBldg.gps);
  assert.ok(obeliskToMain >= 76 && obeliskToMain <= 86, `expected ~81m, got ${obeliskToMain}`);

  const proj = projectGpsToLocalMeters(gate.gps, obelisk.gps);
  assert.ok(proj.eastMeters > 45 && proj.southMeters < -120);

  const bearing = computeGpsBearingDeg(obelisk.gps, gate.gps);
  assert.ok(bearing > 10 && bearing < 45, `expected NNE bearing from Obelisk to Main Gate, got ${bearing}`);
});

test('outside-campus landmarks follow true 2026 drone & Google Maps order (Main Gate -> PNR/NLEX -> Teresa St -> Old Sta. Mesa)', () => {
  assert.equal(matchLandmarkFromQuery('Walk outside to Barangay 591 and Teresa Chapel on Teresa Street')?.id, 'anonas-teresa');
  assert.equal(matchLandmarkFromQuery('Where are the PNR Sta. Mesa train tracks and NLEX-SLEX viaduct?')?.id, 'pnr-stamesa');
  assert.equal(matchLandmarkFromQuery('Directions to Old Sta. Mesa Stop and Shop')?.id, 'old-stamesa-stopshop');
  assert.equal(matchLandmarkFromQuery('How do I get to the PUP Pasig River Ferry Station?')?.id, 'pup-ferry-station');

  const fullTeresaRoute = computeCampusDirections('main-gate', 'old-stamesa-stopshop');
  assert.equal(fullTeresaRoute.found, true);
  assert.equal(
    fullTeresaRoute.landmarks.map((l) => l.id).join('->'),
    'main-gate->pnr-stamesa->anonas-teresa->old-stamesa-stopshop',
  );
  // Real Google Maps walking distance from PUP Main Gate along Teresa St to Old Sta. Mesa Stop & Shop is ~215m
  assert.ok(
    fullTeresaRoute.totalDistanceMeters >= 195 && fullTeresaRoute.totalDistanceMeters <= 235,
    `expected ~215m real Google Maps distance along Teresa St, got ${fullTeresaRoute.totalDistanceMeters}m`,
  );

  // Calibrated world-space distance from Main Gate to Old Sta. Mesa matches real Google Maps scale (~210m)
  const gate = CAMPUS_LANDMARKS.find((l) => l.id === 'main-gate')!;
  const stopShop = CAMPUS_LANDMARKS.find((l) => l.id === 'old-stamesa-stopshop')!;
  const worldEstM = estimateRealWorldDistanceMeters(gate.position, stopShop.position);
  assert.ok(worldEstM >= 190 && worldEstM <= 230, `expected calibrated world distance ~207m, got ${worldEstM}m`);
});

test('stepHorizontalVelocity and dampAngle deliver smooth acceleration, deceleration, and shortest-arc camera turning', () => {
  // Smooth acceleration from rest does not snap to full target speed in a single 16ms frame
  const step1 = stepHorizontalVelocity(0, 0, 6.0, 0, 0.016, 15, 13);
  assert.ok(step1.vx > 0.8 && step1.vx < 2.2, `expected gradual ramp on frame 1, got ${step1.vx}`);

  // After ~0.4s of holding key, converges smoothly close to target speed
  let vx = 0;
  let vz = 0;
  for (let i = 0; i < 25; i++) {
    ({ vx, vz } = stepHorizontalVelocity(vx, vz, 6.0, 0, 0.016, 15, 13));
  }
  assert.ok(vx > 5.85 && vx <= 6.0, `expected smooth convergence near 6.0 m/s, got ${vx}`);

  // Smooth deceleration comes to a clean stop without overshoot
  for (let i = 0; i < 45; i++) {
    ({ vx, vz } = stepHorizontalVelocity(vx, vz, 0, 0, 0.016, 15, 13));
  }
  assert.equal(vx, 0);
  assert.equal(vz, 0);

  // Shortest-arc angle damping across the +PI/-PI wrap boundary turns smoothly rather than spinning 350 degrees
  const damped = dampAngle(Math.PI - 0.1, -Math.PI + 0.1, 20, 0.016);
  assert.ok(damped > Math.PI - 0.1 && damped < Math.PI + 0.1, `expected short positive wrap step, got ${damped}`);
});

test('resolveCircleAABBCollisions slides cleanly around wall and permits open doorway passage', () => {
  // Wall with a 4m wide doorway gap at z in [8, 12]
  const wallColliders = [
    { id: 'wall-north', minX: 20, maxX: 22, minZ: 0, maxZ: 8 },
    { id: 'wall-south', minX: 20, maxX: 22, minZ: 12, maxZ: 20 },
  ];

  // Trying to walk through solid wall gets pushed back outside x = 22 + radius
  const blocked = resolveCircleAABBCollisions(22.2, 4, 0.5, wallColliders);
  assert.ok(blocked.x >= 22.49, `expected x >= 22.5, got ${blocked.x}`);

  // Walking straight through doorway at z = 10 passes unimpeded
  const doorway = resolveCircleAABBCollisions(21, 10, 0.5, wallColliders);
  assert.equal(doorway.x, 21);
  assert.equal(doorway.z, 10);
});

test('NPC daily routine transitions by time of day including Manila Night', () => {
  const maya = CAMPUS_NPCS.find((n) => n.id === 'student-maya')!;
  assert.equal(getNpcScheduleSlot(maya, 'morning').landmarkId, 'obelisk-freedom-park');
  assert.equal(getNpcScheduleSlot(maya, 'midday').landmarkId, 'lagoon');
  assert.equal(getNpcScheduleSlot(maya, 'golden').landmarkId, 'nallrc');
  assert.equal(getNpcScheduleSlot(maya, 'dusk').landmarkId, 'linear-park');
  const nightSlot = getNpcScheduleSlot(maya, 'night');
  assert.equal(nightSlot.landmarkId, 'linear-park');
  assert.ok(nightSlot.activity.includes('evening campus lamps'));
});

test('query matcher resolves natural PUP landmark references', () => {
  assert.equal(matchLandmarkFromQuery('How do I get to the NALLRC library?')?.id, 'nallrc');
  assert.equal(matchLandmarkFromQuery('Take me to the Lagoon food stalls')?.id, 'lagoon');
  assert.equal(matchLandmarkFromQuery('Where is the Interfaith Chapel?')?.id, 'interfaith-chapel');
});

test('surface detection differentiates interior halls, grass turf, and outdoor concrete', () => {
  assert.equal(getSurfaceTypeAt(-28, 24), 'interior'); // Main Building Central Dome
  assert.equal(getSurfaceTypeAt(-24, -44), 'interior'); // NALLRC Library Reading Hall
  assert.equal(getSurfaceTypeAt(-2, 42), 'interior'); // Interfaith Chapel Sanctuary
  assert.equal(getSurfaceTypeAt(48, 44), 'grass'); // PUP Oval infield
  assert.equal(getSurfaceTypeAt(39.5, 11.5), 'grass'); // Mabini Shrine compound lawn
  assert.equal(getSurfaceTypeAt(70, -4), 'concrete'); // Main Gate boulevard
});

test('all 40+ major PUP campus structures have zero overlapping footprints', () => {
  const overlaps = findOverlappingFootprints();
  assert.deepEqual(
    overlaps,
    [],
    `Found overlapping campus structures: ${JSON.stringify(overlaps)}`,
  );
});

test('newly audited official PUP Vicinity Map buildings are searchable and connected by walkable routes', () => {
  assert.equal(matchLandmarkFromQuery('Where is the Sampaguita Building university canteen?')?.id, 'sampaguita-canteen');
  assert.equal(matchLandmarkFromQuery('Take me to Tahanan ng Alumni and CHK')?.id, 'tahanan-ng-alumni');
  assert.equal(matchLandmarkFromQuery('Where is the Food and Nutrition Building and Gabriela Silang?')?.id, 'food-nutrition-strip');
  assert.equal(matchLandmarkFromQuery('Directions to Tahanan ng Atleta')?.id, 'tahanan-ng-atleta');
  assert.equal(matchLandmarkFromQuery('Where is the PUP Souvenir Shop and Visitor Lounge?')?.id, 'visitors-lounge-courts');
  assert.equal(matchLandmarkFromQuery('Locate the Printing Press and PSMO')?.id, 'printing-psmo');

  const routeToAtleta = computeCampusDirections('main-gate', 'tahanan-ng-atleta');
  assert.equal(routeToAtleta.found, true);
  assert.ok(routeToAtleta.totalDistanceMeters > 100);

  const routeToSampaguita = computeCampusDirections('main-gate', 'sampaguita-canteen');
  assert.equal(routeToSampaguita.found, true);
  assert.ok(routeToSampaguita.totalDistanceMeters > 150);
});

test('South Anonas path to Maui Oasis, Futura Centro & El Pueblo Manila is searchable and routable from Main Gate', () => {
  assert.equal(matchLandmarkFromQuery('How do I walk to Maui Oasis by Filinvest?')?.id, 'maui-el-pueblo');
  assert.equal(matchLandmarkFromQuery('Directions to El Pueblo Manila Condominium')?.id, 'maui-el-pueblo');
  assert.equal(matchLandmarkFromQuery('Where is Futura Centro along South Anonas?')?.id, 'maui-el-pueblo');

  const route = computeCampusDirections('main-gate', 'maui-el-pueblo');
  assert.equal(route.found, true);
  assert.equal(route.landmarks[0].id, 'main-gate');
  assert.equal(route.landmarks[route.landmarks.length - 1].id, 'maui-el-pueblo');
  assert.ok(route.totalDistanceMeters >= 150 && route.totalDistanceMeters <= 320);
});

test('Frutiger Aero procedural soundtrack progression, sparkle arpeggio & atmosphere profile are deterministic', async () => {
  const {
    FRUTIGER_AERO_PROGRESSION,
    midiToFreq,
    selectAeroSparkleMidi,
    getAeroAtmosphereProfile,
  } = await import('../engine/frutigerAeroMusic');

  assert.equal(FRUTIGER_AERO_PROGRESSION.length, 8);
  assert.ok(Math.abs(midiToFreq(69) - 440) < 0.001);
  assert.ok(Math.abs(midiToFreq(60) - 261.6256) < 0.01);

  // Syncopated steps return valid high shimmer notes while rest steps return null
  const note0 = selectAeroSparkleMidi(0, 0);
  const rest1 = selectAeroSparkleMidi(0, 1);
  assert.ok(typeof note0 === 'number' && note0 >= 71 && note0 <= 88);
  assert.equal(rest1, null);

  // Midday outdoor brightness > night outdoor warmth; indoor acoustics soften cutoff
  const middayOut = getAeroAtmosphereProfile('midday', false);
  const nightOut = getAeroAtmosphereProfile('night', false);
  const middayIn = getAeroAtmosphereProfile('midday', true);
  assert.ok(middayOut.filterCutoffHz > nightOut.filterCutoffHz);
  assert.ok(middayIn.filterCutoffHz < middayOut.filterCutoffHz);
  assert.ok(middayIn.delayFeedback > middayOut.delayFeedback);
});

test('PUP Main Entrance forecourt curved sidewalks, tangent curbstones, Pylon podium & Teresa micro-stalls are geometrically accurate', async () => {
  const {
    PUP_FORECOURT_CONFIG,
    generateCurvedSidewalkPolygon,
    computeForecourtCurbSegments,
    computePylonPodiumTiers,
    computeTeresaStallBays,
  } = await import('./entranceGeometry');

  // 1) North & South curved sidewalk polygons preserve C1 start/end coordinates and exact 6.6m outer radius
  const northPoly = generateCurvedSidewalkPolygon('north', PUP_FORECOURT_CONFIG);
  const southPoly = generateCurvedSidewalkPolygon('south', PUP_FORECOURT_CONFIG);
  assert.ok(northPoly.length >= 40);
  assert.ok(southPoly.length >= 40);
  assert.deepEqual(northPoly[0], [PUP_FORECOURT_CONFIG.gateX, PUP_FORECOURT_CONFIG.drivewayNorthZ]);
  assert.deepEqual(southPoly[0], [PUP_FORECOURT_CONFIG.gateX, PUP_FORECOURT_CONFIG.drivewaySouthZ]);

  const arcStartX = PUP_FORECOURT_CONFIG.anonasCurbX - PUP_FORECOURT_CONFIG.curveRadius;
  const northCenterZ = PUP_FORECOURT_CONFIG.drivewayNorthZ - PUP_FORECOURT_CONFIG.curveRadius;
  for (let i = 1; i <= PUP_FORECOURT_CONFIG.arcSegments; i++) {
    const [px, pz] = northPoly[1 + i];
    const r = Math.hypot(px - arcStartX, pz - northCenterZ);
    assert.ok(Math.abs(r - PUP_FORECOURT_CONFIG.curveRadius) < 1e-6, `expected radius 6.6m, got ${r}`);
  }

  // 2) Tangent-aligned curbstones sweep smoothly from 0 to PI/2 with continuous indices
  const northCurbs = computeForecourtCurbSegments('north', PUP_FORECOURT_CONFIG);
  const southCurbs = computeForecourtCurbSegments('south', PUP_FORECOURT_CONFIG);
  assert.ok(northCurbs.length > 40);
  assert.ok(southCurbs.length > 40);
  assert.equal(northCurbs[0].rotY, 0);
  assert.equal(northCurbs[northCurbs.length - 1].rotY, Math.PI / 2);

  // 3) Pylon 3-tier stepped travertine/terracotta podium monotonically tapers upward
  const tiers = computePylonPodiumTiers();
  assert.equal(tiers.length, 3);
  assert.ok(tiers[0].width > tiers[1].width && tiers[1].width > tiers[2].width);
  assert.ok(tiers[0].depth > tiers[1].depth && tiers[1].depth > tiers[2].depth);
  assert.ok(tiers[0].yCenter < tiers[1].yCenter && tiers[1].yCenter < tiers[2].yCenter);

  // 4) Teresa Street shophouses subdivide into 2–3 narrow Manila micro-stalls cleanly within frontage
  const bays3 = computeTeresaStallBays(11.4, 2, 'carinderia');
  const bays2 = computeTeresaStallBays(8.0, 5, 'print-shop');
  assert.equal(bays3.length, 3);
  assert.equal(bays2.length, 2);
  assert.equal(bays3[0].kind, 'carinderia');
  assert.equal(bays2[0].kind, 'print-shop');
  assert.ok(bays3.every((b) => b.width > 2.4 && b.width < 4.4));
  assert.ok(bays2.every((b) => b.width > 2.4 && b.width < 4.4));
});

test('Barangay 630 Zone 63 Hall & Maui Oasis corridor geometry are non-overlapping and accurately transformed', async () => {
  const {
    MAUI_CORRIDOR_CONFIG,
    computeBarangay630Footprints,
    computeBoulevardWorldPoint,
    computeMauiCorridorPoles,
    computeMauiSpeedHumps,
  } = await import('./mauiCorridorGeometry');

  // Barangay 630 Hall is searchable in campus assistant
  assert.equal(matchLandmarkFromQuery('Where is Barangay 630 Zone 63 Hall near Maui Oasis?')?.id, 'maui-el-pueblo');

  // East Anonas civic/commercial buildings sit east of roadway curb with zero pairwise overlap
  const fps = computeBarangay630Footprints();
  assert.equal(fps.length, 3);
  assert.ok(fps.some((f) => f.id === 'barangay-630-hall'));
  for (const fp of fps) {
    assert.ok(fp.x - fp.width / 2 >= MAUI_CORRIDOR_CONFIG.anonasEastCurbX + 1.5, `${fp.id} encroaches on Anonas St`);
  }
  for (let i = 0; i < fps.length; i++) {
    for (let j = i + 1; j < fps.length; j++) {
      const a = fps[i];
      const b = fps[j];
      const overlapX = Math.abs(a.x - b.x) < (a.width + b.width) / 2;
      const overlapZ = Math.abs(a.z - b.z) < (a.depth + b.depth) / 2;
      assert.equal(overlapX && overlapZ, false, `Overlap between ${a.id} and ${b.id}`);
    }
  }

  // Boulevard world transform preserves exact Euclidean distances & orientation
  const p0 = computeBoulevardWorldPoint(0, 0);
  const p1 = computeBoulevardWorldPoint(10, 0);
  assert.ok(Math.abs(Math.hypot(p1.x - p0.x, p1.z - p0.z) - 10) < 1e-6);
  assert.ok(p1.x > p0.x && p1.z < p0.z);

  // Poles & speed humps populate both Anonas St and Maui Oasis boulevard
  const poles = computeMauiCorridorPoles();
  const humps = computeMauiSpeedHumps();
  assert.equal(poles.length, 8);
  assert.equal(humps.length, 4);
});



