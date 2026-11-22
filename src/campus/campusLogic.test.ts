import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeCampusDirections,
  computeSafeCameraDistance,
  dampAngle,
  estimateRealWorldDistanceMeters,
  findNearestLandmark,
  findOverlappingFootprints,
  getColliderDebugDescriptor,
  getCompassDirection,
  getNpcScheduleSlot,
  getSurfaceTypeAt,
  matchLandmarkFromQuery,
  resolveCircleAABBCollisions,
  resolveCircleCollisionsWithNormal,
  stepHorizontalVelocity,
} from './campusLogic';
import { CAMPUS_LANDMARKS, CAMPUS_NPCS, PLAYER_SPAWN } from './campusData';
import { computeGpsBearingDeg, haversineDistanceMeters, projectGpsToLocalMeters } from './geoProjection';
import { createScaledAABB, createScaledOBB, scaleWorldX, scaleWorldZ } from './worldScale';

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
  assert.equal(getSurfaceTypeAt(scaleWorldX(-28), scaleWorldZ(24)), 'interior'); // Main Building Central Dome
  assert.equal(getSurfaceTypeAt(scaleWorldX(-24), scaleWorldZ(-44)), 'interior'); // NALLRC Library Reading Hall
  assert.equal(getSurfaceTypeAt(scaleWorldX(-2), scaleWorldZ(42)), 'interior'); // Interfaith Chapel Sanctuary
  assert.equal(getSurfaceTypeAt(scaleWorldX(48), scaleWorldZ(44)), 'grass'); // PUP Oval infield
  assert.equal(getSurfaceTypeAt(scaleWorldX(39.5), scaleWorldZ(11.5)), 'grass'); // Mabini Shrine compound lawn
  assert.equal(getSurfaceTypeAt(scaleWorldX(70), scaleWorldZ(-4)), 'concrete'); // Main Gate boulevard
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

test('South Anonas path to Barangay 630, Maui Oasis, Futura Centro & El Pueblo Manila is searchable and routable from Main Gate', () => {
  assert.equal(matchLandmarkFromQuery('How do I walk to Maui Oasis by Filinvest?')?.id, 'maui-el-pueblo');
  assert.equal(matchLandmarkFromQuery('Directions to El Pueblo Manila Condominium')?.id, 'maui-el-pueblo');
  assert.equal(matchLandmarkFromQuery('Where is Futura Centro along South Anonas?')?.id, 'maui-el-pueblo');
  assert.equal(matchLandmarkFromQuery('Where is Barangay 630 Hall along South Anonas?')?.id, 'barangay-630-hall');
  assert.equal(matchLandmarkFromQuery('Show me the Pasig River ilog at Linear Park')?.id, 'linear-park');

  const route = computeCampusDirections('main-gate', 'maui-el-pueblo');
  assert.equal(route.found, true);
  assert.equal(route.landmarks[0].id, 'main-gate');
  assert.equal(route.landmarks[route.landmarks.length - 1].id, 'maui-el-pueblo');
  assert.ok(route.landmarks.some((l) => l.id === 'barangay-630-hall'));
  assert.ok(route.totalDistanceMeters >= 280 && route.totalDistanceMeters <= 520, `expected long walk >= 280m, got ${route.totalDistanceMeters}m`);
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

test('Barangay 630 Zone 63 Hall & far-south Maui Oasis corridor geometry are non-overlapping and authentically separated from PUP Oval', async () => {
  const {
    MAUI_CORRIDOR_CONFIG,
    computeBarangay630Footprints,
    computeWestAnonasFootprints,
    computeBoulevardWorldPoint,
    computeMauiCorridorPoles,
    computeMauiSpeedHumps,
  } = await import('./mauiCorridorGeometry');

  // Barangay 630 Hall resolves to its dedicated landmark
  assert.equal(matchLandmarkFromQuery('Where is Barangay 630 Zone 63 Hall?')?.id, 'barangay-630-hall');

  // Maui Oasis & El Pueblo are genuinely far south of PUP Oval wall (>= 120m real-world separation!)
  const ovalToMauiMeters = (MAUI_CORRIDOR_CONFIG.mauiOasisMainZ - MAUI_CORRIDOR_CONFIG.pupOvalWallEndZ) * 1.62;
  const ovalToElPuebloMeters = (MAUI_CORRIDOR_CONFIG.elPuebloMainZ - MAUI_CORRIDOR_CONFIG.pupOvalWallEndZ) * 1.62;
  assert.ok(ovalToMauiMeters >= 130, `expected Maui Oasis >= 130m south of PUP Oval, got ${ovalToMauiMeters}m`);
  assert.ok(ovalToElPuebloMeters >= 190, `expected El Pueblo >= 190m south of PUP Oval, got ${ovalToElPuebloMeters}m`);

  // East & West South Anonas civic/commercial buildings sit clear of roadway curbs with zero pairwise overlap
  const eastFps = computeBarangay630Footprints();
  const westFps = computeWestAnonasFootprints();
  assert.equal(eastFps.length, 9);
  assert.equal(westFps.length, 4);
  assert.ok(eastFps.some((f) => f.id === 'barangay-630-hall'));
  assert.ok(eastFps.some((f) => f.id === 'barangay-630-health'));
  for (const fp of eastFps) {
    assert.ok(fp.x - fp.width / 2 >= MAUI_CORRIDOR_CONFIG.anonasEastCurbX + 1.5, `${fp.id} encroaches on Anonas St`);
    assert.ok(fp.z - fp.depth / 2 >= 69.5, `${fp.id} overlaps PNR/NLEX viaduct north of z=70`);
  }
  for (const fp of westFps) {
    assert.ok(fp.x + fp.width / 2 <= MAUI_CORRIDOR_CONFIG.anonasWestCurbX - 2.0, `${fp.id} encroaches on Anonas St`);
  }
  const allFps = [...eastFps, ...westFps];
  for (let i = 0; i < allFps.length; i++) {
    for (let j = i + 1; j < allFps.length; j++) {
      const a = allFps[i];
      const b = allFps[j];
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

  // Poles & speed humps populate both extended South Anonas St and far-south Maui Oasis boulevard
  const poles = computeMauiCorridorPoles();
  const humps = computeMauiSpeedHumps();
  assert.equal(poles.length, 14);
  assert.equal(humps.length, 7);
});

test('solid wall physics stops head-on motion cleanly, prevents thin-wall tunneling, and slides smoothly along rotated OBB walls', () => {
  // 1) Head-on walk into a thin 0.4m concrete wall: player must stop outside & lose inward velocity
  const thinWall = [{ id: 'thin-wall', minX: 10.0, maxX: 10.4, minZ: -10, maxZ: 10 }];
  const headOn = resolveCircleCollisionsWithNormal(9.2, 0, 10.2, 0, 5.4, 0, 0.5, thinWall);
  assert.equal(headOn.collided, true);
  assert.ok(headOn.x <= 9.5001, `expected player stopped outside wall (x <= 9.5), got ${headOn.x}`);
  assert.ok(headOn.vx <= 0.001, `expected inward vx cancelled to 0, got ${headOn.vx}`);

  // 2) Anti-tunneling: huge single-frame 3.0m leap across a thin 0.4m wall must STILL stop on the near side (x <= 9.5)!
  const leap = resolveCircleCollisionsWithNormal(9.0, 0, 12.0, 0, 15.0, 0, 0.5, thinWall);
  assert.equal(leap.collided, true);
  assert.ok(leap.x <= 9.5001, `expected anti-tunneling stop on near side (x <= 9.5), got ${leap.x}`);
  assert.equal(leap.vx, 0);

  // 3) Diagonal walk into a rotated Maui Oasis vine wall OBB (rotY = 0.26) blocks inward motion while sliding tangentially
  const rotY = 0.26;
  const obbWall = [createScaledOBB('vine-wall-test', 60, 95, 20, 0.85, rotY)];
  const wCx = scaleWorldX(60);
  const wCz = scaleWorldZ(95);
  // Start 1.5m south of rotated wall center along wall's outward normal (+localZ -> world (+sin, +cos))
  const nx = Math.sin(rotY);
  const nz = Math.cos(rotY);
  const startX = wCx + nx * 1.6;
  const startZ = wCz + nz * 1.6;
  // Walk diagonally into the wall (-normal + tangent)
  const tx = Math.cos(rotY);
  const tz = -Math.sin(rotY);
  const vx = -nx * 4.0 + tx * 3.0;
  const vz = -nz * 4.0 + tz * 3.0;
  const obbRes = resolveCircleCollisionsWithNormal(startX, startZ, startX + vx * 0.5, startZ + vz * 0.5, vx, vz, 0.5, obbWall);
  assert.equal(obbRes.collided, true);
  // Verify signed distance along outward normal stays >= halfDepth + radius
  const signedOutwardDist = (obbRes.x - wCx) * nx + (obbRes.z - wCz) * nz;
  const minClearance = (0.85 * 1.62) / 2 + 0.5 - 0.01;
  assert.ok(signedOutwardDist >= minClearance, `expected OBB clearance >= ${minClearance}, got ${signedOutwardDist}`);
  // Verify tangential slide progressed along the wall
  const tangDisp = (obbRes.x - startX) * tx + (obbRes.z - startZ) * tz;
  assert.ok(tangDisp > 0.5, `expected smooth tangential slide > 0.5m, got ${tangDisp}`);
});

test('computeSafeCameraDistance pulls third-person camera cleanly below 2.1m down to 0.55m near AABB & OBB walls', () => {
  const wallBehind = [createScaledAABB('behind-wall', 10, 0, 1.0, 20.0)];
  const wallMaxX = wallBehind[0].maxX;
  // Player stands 1.1m east of wall facing east (camera boom reaches west into wall!)
  const safeDist = computeSafeCameraDistance(wallMaxX + 1.1, 0, 1, 0, 5.2, wallBehind, 0.55, 0.42);
  assert.ok(safeDist >= 0.55 && safeDist < 1.2, `expected tight safe camera pull-in in [0.55..1.2], got ${safeDist}`);
});

test('true 1:1 Google Maps world-space scale & query aliases match real Sta. Mesa landmark distances', () => {
  const gate = CAMPUS_LANDMARKS.find((l) => l.id === 'main-gate')!;
  const obelisk = CAMPUS_LANDMARKS.find((l) => l.id === 'obelisk-freedom-park')!;
  const stopShop = CAMPUS_LANDMARKS.find((l) => l.id === 'old-stamesa-stopshop')!;

  // True 1:1 Google Maps world-space Euclidean spans (no longer compressed to 60%!)
  const gateToStopShopWorldUnits = Math.hypot(stopShop.position.x - gate.position.x, stopShop.position.z - gate.position.z);
  assert.ok(
    gateToStopShopWorldUnits >= 185 && gateToStopShopWorldUnits <= 230,
    `expected ~207 world units (~1:1 meters) from Main Gate to Old Sta. Mesa, got ${gateToStopShopWorldUnits}`,
  );
  const gateToObeliskWorldUnits = Math.hypot(obelisk.position.x - gate.position.x, obelisk.position.z - gate.position.z);
  assert.ok(
    gateToObeliskWorldUnits >= 100 && gateToObeliskWorldUnits <= 135,
    `expected ~115 world units from Main Gate to Obelisk, got ${gateToObeliskWorldUnits}`,
  );

  // Query aliases for Tahanan ng Atleta ("Araneta Hall"), Barangay 630 Hall, and PUP Side Gate
  assert.equal(matchLandmarkFromQuery('Where is Araneta Hall?')?.id, 'tahanan-ng-atleta');
  assert.equal(matchLandmarkFromQuery('Where is Barangay 630 Hall?')?.id, 'barangay-630-hall');
  assert.equal(matchLandmarkFromQuery('Take me to the PUP side gate')?.id, 'visitors-lounge-courts');
});

test('getColliderDebugDescriptor & hitColliderIds match AABB, rotated OBB, and closed-door physics 1:1', () => {
  const aabb = createScaledAABB('test-aabb-wall', 20, -10, 4.0, 2.0);
  const aabbDesc = getColliderDebugDescriptor(aabb);
  assert.equal(aabbDesc.isOBB, false);
  assert.ok(Math.abs(aabbDesc.cx - scaleWorldX(20)) < 1e-6);
  assert.ok(Math.abs(aabbDesc.cz - scaleWorldZ(-10)) < 1e-6);
  assert.ok(Math.abs(aabbDesc.width - 4.0 * 1.62) < 1e-6);
  assert.ok(Math.abs(aabbDesc.depth - 2.0 * 1.62) < 1e-6);

  const chapelRot = Math.PI / 4;
  const obb = createScaledOBB('chapel-wall-1', -8.9, 35.1, 8.4, 1.45, chapelRot);
  const obbDesc = getColliderDebugDescriptor(obb);
  assert.equal(obbDesc.isOBB, true);
  assert.equal(obbDesc.rotY, chapelRot);
  assert.ok(Math.abs(obbDesc.width - 8.4 * 1.62) < 1e-6);
  assert.ok(Math.abs(obbDesc.depth - 1.45 * 1.62) < 1e-6);

  // Walking straight into a closed interactive door OBB reports its exact collider ID and blocks passage
  const closedDoor = createScaledOBB('door-chapel-closed', -2, 32.2, 3.85, 0.55, 0);
  const doorZ = scaleWorldZ(32.2);
  const doorX = scaleWorldX(-2);
  const blocked = resolveCircleCollisionsWithNormal(
    doorX,
    doorZ - 1.2,
    doorX,
    doorZ + 1.0,
    0,
    5.4,
    0.5,
    [closedDoor],
  );
  assert.equal(blocked.collided, true);
  assert.deepEqual(blocked.hitColliderIds, ['door-chapel-closed']);
  assert.ok(blocked.z < doorZ - 0.5, `expected closed door to stop player before doorway, got z=${blocked.z} vs doorZ=${doorZ}`);
  assert.equal(blocked.vz, 0);
});





