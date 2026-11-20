import * as THREE from 'three';

export interface CampusTextureSet {
  concreteFacade: THREE.CanvasTexture;
  concreteBump: THREE.CanvasTexture;
  marblePylon: THREE.CanvasTexture;
  asphaltRoad: THREE.CanvasTexture;
  paverWalkway: THREE.CanvasTexture;
  freedomGrid: THREE.CanvasTexture;
  lagoonBrick: THREE.CanvasTexture;
  intramurosStone: THREE.CanvasTexture;
  intramurosBump: THREE.CanvasTexture;
  terracottaRoof: THREE.CanvasTexture;
  terracottaBump: THREE.CanvasTexture;
  thatchRoof: THREE.CanvasTexture;
  thatchBump: THREE.CanvasTexture;
  mintWood: THREE.CanvasTexture;
  mintWoodBump: THREE.CanvasTexture;
  grassTurf: THREE.CanvasTexture;
  trackRed: THREE.CanvasTexture;
  woodPlank: THREE.CanvasTexture;
  interiorTile: THREE.CanvasTexture;
  constructionFence: THREE.CanvasTexture;
  muralRelief: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  pylonP: THREE.CanvasTexture;
  pylonU: THREE.CanvasTexture;
  weatheredWall: THREE.CanvasTexture;
  dispose: () => void;
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function configureTexture(
  canvas: HTMLCanvasElement,
  maxAnisotropy: number,
  isColor: boolean,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

function seededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Fast ImageData pixel-buffer speckle synthesizer: produces rich procedural grain
 * ~10x faster than thousands of individual Canvas2D fillRect + rgba() calls with zero visual loss.
 */
function blendSpecklesFast(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  count: number,
  rand: () => number,
  boxW: number,
  boxH: number,
  alpha: number,
  colorFn: () => [number, number, number],
) {
  const img = ctx.getImageData(0, 0, w, h);
  const data = img.data;
  const invA = 1 - alpha;
  for (let i = 0; i < count; i++) {
    const x0 = (rand() * w) | 0;
    const y0 = (rand() * h) | 0;
    const [r, g, b] = colorFn();
    const x1 = Math.min(w, x0 + boxW);
    const y1 = Math.min(h, y0 + boxH);
    for (let y = y0; y < y1; y++) {
      let idx = (y * w + x0) * 4;
      for (let x = x0; x < x1; x++) {
        data[idx] = (data[idx] * invA + r * alpha) | 0;
        data[idx + 1] = (data[idx + 1] * invA + g * alpha) | 0;
        data[idx + 2] = (data[idx + 2] * invA + b * alpha) | 0;
        idx += 4;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

function drawMarbleBase(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  const rand = seededRandom(seed);
  ctx.fillStyle = '#e8eceb';
  ctx.fillRect(0, 0, w, h);

  // Soft cloudy mineral variations
  for (let i = 0; i < 90; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = 24 + rand() * 85;
    const g = ctx.createRadialGradient(x, y, 2, x, y, r);
    const v = 205 + Math.floor(rand() * 32);
    g.addColorStop(0, `rgba(${v},${v + 4},${v + 3},0.16)`);
    g.addColorStop(1, 'rgba(232,236,235,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Subtle gray-teal marble veins
  for (let v = 0; v < 22; v++) {
    ctx.strokeStyle = `rgba(118, 129, 126, ${0.14 + rand() * 0.22})`;
    ctx.lineWidth = 0.8 + rand() * 2.2;
    ctx.beginPath();
    let vx = rand() * w;
    let vy = rand() * h;
    ctx.moveTo(vx, vy);
    for (let s = 0; s < 14; s++) {
      vx += (rand() - 0.35) * 42;
      vy += (rand() - 0.35) * 42;
      ctx.lineTo(vx, vy);
    }
    ctx.stroke();
  }

  // Horizontal marble slab ashlar seams (matches real PUP Pylon marble cladding!)
  ctx.strokeStyle = 'rgba(110, 114, 112, 0.32)';
  ctx.lineWidth = 2;
  for (let y = 64; y < h; y += 96) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

export function createCampusTextures(renderer: THREE.WebGLRenderer): CampusTextureSet {
  const maxAniso = Math.min(16, renderer.capabilities.getMaxAnisotropy());
  const allTextures: THREE.CanvasTexture[] = [];

  const register = (
    canvas: HTMLCanvasElement,
    isColor: boolean,
    rx = 1,
    ry = 1,
  ): THREE.CanvasTexture => {
    const t = configureTexture(canvas, maxAniso, isColor, rx, ry);
    allTextures.push(t);
    return t;
  };

  // 1. Weathered Institutional Cream Concrete Plaster + Bump (Main Building & NALLRC)
  const [concC, concCtx] = makeCanvas(512, 512);
  const rand1 = seededRandom(1904);
  concCtx.fillStyle = '#ece6d9';
  concCtx.fillRect(0, 0, 512, 512);
  blendSpecklesFast(concCtx, 512, 512, 6500, rand1, 4, 3, 0.16, () => {
    const v = 216 + ((rand1() * 32) | 0);
    return [v, v - 5, v - 13];
  });
  // Subtle Manila tropical rain drip streaks near top edge
  for (let i = 0; i < 65; i++) {
    const x = rand1() * 512;
    const h = 18 + rand1() * 64;
    const g = concCtx.createLinearGradient(x, 0, x, h);
    g.addColorStop(0, 'rgba(95, 88, 78, 0.16)');
    g.addColorStop(1, 'rgba(95, 88, 78, 0)');
    concCtx.fillStyle = g;
    concCtx.fillRect(x, 0, 3 + rand1() * 5, h);
  }
  concCtx.strokeStyle = 'rgba(135, 126, 114, 0.2)';
  concCtx.lineWidth = 1.5;
  for (let y = 0; y < 512; y += 128) {
    concCtx.beginPath();
    concCtx.moveTo(0, y);
    concCtx.lineTo(512, y);
    concCtx.stroke();
  }
  const concreteFacade = register(concC, true, 2, 2);

  const [concBC, concBCtx] = makeCanvas(256, 256);
  const rand1b = seededRandom(1978);
  concBCtx.fillStyle = '#808080';
  concBCtx.fillRect(0, 0, 256, 256);
  blendSpecklesFast(concBCtx, 256, 256, 4200, rand1b, 2, 2, 1.0, () => {
    const v = 96 + ((rand1b() * 64) | 0);
    return [v, v, v];
  });
  const concreteBump = register(concBC, false, 2, 2);

  // 2. Veined White Marble for the Iconic PUP Pylon Slabs (matches pylon.jpg!)
  const [marbC, marbCtx] = makeCanvas(512, 512);
  drawMarbleBase(marbCtx, 512, 512, 1984);
  const marblePylon = register(marbC, true, 1, 2);

  const makePylonLetterTex = (letter: string, seed: number) => {
    const [c, ctx] = makeCanvas(256, 1024);
    drawMarbleBase(ctx, 256, 1024, seed);
    // Subtle vertical marble slab seam & realistic tropical weathering streaks near upper seams (pylon_2026.jpg!)
    ctx.strokeStyle = 'rgba(95, 102, 100, 0.24)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(128, 0);
    ctx.lineTo(128, 1024);
    ctx.stroke();
    const stainGrad = ctx.createLinearGradient(0, 260, 0, 420);
    stainGrad.addColorStop(0, 'rgba(65, 62, 56, 0.14)');
    stainGrad.addColorStop(1, 'rgba(65, 62, 56, 0)');
    ctx.fillStyle = stainGrad;
    ctx.fillRect(16, 260, 224, 160);

    // Refurbished July 2026 brushed GOLD-BRASS embossed serif letter (matches PUP_Pylon_Jul_2026.jpg!)
    ctx.save();
    ctx.font = '900 176px Georgia, "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Crisp 3D cast drop shadow onto marble
    ctx.fillStyle = 'rgba(28, 22, 14, 0.42)';
    ctx.fillText(letter, 134, 236);
    // Metallic bevel dark edge
    ctx.strokeStyle = '#6e4c14';
    ctx.lineWidth = 6;
    ctx.strokeText(letter, 128, 230);
    // Brushed gold gradient face
    const goldGrad = ctx.createLinearGradient(70, 150, 185, 310);
    goldGrad.addColorStop(0, '#f3d46b');
    goldGrad.addColorStop(0.35, '#d6a432');
    goldGrad.addColorStop(0.68, '#f0cc5e');
    goldGrad.addColorStop(1, '#9c6e1b');
    ctx.fillStyle = goldGrad;
    ctx.fillText(letter, 128, 230);
    ctx.restore();
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAniso;
    tex.needsUpdate = true;
    allTextures.push(tex);
    return tex;
  };
  const pylonP = makePylonLetterTex('P', 2001);
  const pylonU = makePylonLetterTex('U', 2002);

  // 3. Weathered Manila Campus Concrete/Asphalt Boulevard
  const [aspC, aspCtx] = makeCanvas(512, 512);
  const rand2 = seededRandom(2026);
  aspCtx.fillStyle = '#6c6b68';
  aspCtx.fillRect(0, 0, 512, 512);
  blendSpecklesFast(aspCtx, 512, 512, 11000, rand2, 2, 2, 0.36, () => {
    const v = 88 + ((rand2() * 44) | 0);
    return [v, v - 1, v - 3];
  });
  // Concrete road slab expansion joints
  aspCtx.strokeStyle = 'rgba(54, 52, 48, 0.45)';
  aspCtx.lineWidth = 3;
  for (let p = 0; p < 512; p += 128) {
    aspCtx.beginPath();
    aspCtx.moveTo(0, p);
    aspCtx.lineTo(512, p);
    aspCtx.stroke();
  }
  const asphaltRoad = register(aspC, true, 2, 2);

  // 4. General Campus Concrete Walkway Pavers
  const [pavC, pavCtx] = makeCanvas(512, 512);
  const rand3 = seededRandom(3030);
  pavCtx.fillStyle = '#999288';
  pavCtx.fillRect(0, 0, 512, 512);
  const tile = 64;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const shade = 166 + Math.floor(rand3() * 20);
      pavCtx.fillStyle = `rgb(${shade},${shade - 5},${shade - 12})`;
      pavCtx.fillRect(col * tile + 2, row * tile + 2, tile - 4, tile - 4);
    }
  }
  const paverWalkway = register(pavC, true, 6, 6);

  // 5. Authentic PUP Freedom Park Geometric Rose-Terracotta Grid Plaza (matches freedompark.jpg!)
  const [fpC, fpCtx] = makeCanvas(512, 512);
  const randFp = seededRandom(3141);
  // Crisp off-white concrete divider bands
  fpCtx.fillStyle = '#dcd7ce';
  fpCtx.fillRect(0, 0, 512, 512);
  const cell = 128;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const warm = (r + c) % 2 === 0;
      const baseR = warm ? 156 : 142;
      const baseG = warm ? 128 : 122;
      const baseB = warm ? 122 : 118;
      fpCtx.fillStyle = `rgb(${baseR},${baseG},${baseB})`;
      fpCtx.fillRect(c * cell + 8, r * cell + 8, cell - 16, cell - 16);
      // Subtle weathered mottling inside each tile panel
      for (let k = 0; k < 140; k++) {
        const d = Math.floor(randFp() * 18) - 9;
        fpCtx.fillStyle = `rgba(${baseR + d},${baseG + d},${baseB + d},0.35)`;
        fpCtx.fillRect(c * cell + 10 + randFp() * (cell - 22), r * cell + 10 + randFp() * (cell - 22), 4, 4);
      }
    }
  }
  const freedomGrid = register(fpC, true, 4, 4);

  // 6. Redeveloped PUP Lagoon Terracotta Brick Pavers (matches lagoon.jpg!)
  const [lbC, lbCtx] = makeCanvas(512, 512);
  const randLb = seededRandom(4242);
  lbCtx.fillStyle = '#6f5a4b';
  lbCtx.fillRect(0, 0, 512, 512);
  const bw = 48;
  const bh = 24;
  for (let r = 0; r < 22; r++) {
    const off = (r % 2) * (bw / 2);
    for (let c = -1; c < 12; c++) {
      const bx = c * bw + off;
      const by = r * bh;
      const rr = 152 + Math.floor(randLb() * 34);
      const gg = 92 + Math.floor(randLb() * 24);
      const bb = 66 + Math.floor(randLb() * 18);
      lbCtx.fillStyle = `rgb(${rr},${gg},${bb})`;
      lbCtx.fillRect(bx + 2, by + 2, bw - 3, bh - 3);
    }
  }
  const lagoonBrick = register(lbC, true, 5, 5);

  // 7. Intramuros-Style Cut Heritage Stone Wall + Bump (matches freedompark.jpg left bastion wall!)
  const [stC, stCtx] = makeCanvas(512, 512);
  const [stBC, stBCtx] = makeCanvas(256, 256);
  const randSt = seededRandom(4040);
  stCtx.fillStyle = '#7c7870';
  stCtx.fillRect(0, 0, 512, 512);
  stBCtx.fillStyle = '#404040';
  stBCtx.fillRect(0, 0, 256, 256);
  const stoneH = 42;
  const stoneW = 84;
  for (let r = 0; r < 13; r++) {
    const offset = (r % 2) * (stoneW / 2);
    for (let c = -1; c < 8; c++) {
      const bx = c * stoneW + offset;
      const by = r * stoneH;
      const v = 148 + Math.floor(randSt() * 32);
      stCtx.fillStyle = `rgb(${v},${v - 4},${v - 11})`;
      stCtx.fillRect(bx + 2, by + 2, stoneW - 4, stoneH - 4);
      // Moss/tropical weathering hint
      if (randSt() > 0.72) {
        stCtx.fillStyle = 'rgba(72, 84, 62, 0.22)';
        stCtx.fillRect(bx + 4, by + 4, stoneW - 8, stoneH - 8);
      }
      const bv = 175 + Math.floor(randSt() * 55);
      stBCtx.fillStyle = `rgb(${bv},${bv},${bv})`;
      stBCtx.fillRect((bx + 2) * 0.5, (by + 2) * 0.5, (stoneW - 4) * 0.5, (stoneH - 4) * 0.5);
    }
  }
  const intramurosStone = register(stC, true, 3, 1.4);
  const intramurosBump = register(stBC, false, 3, 1.4);

  // 8. Spanish Terracotta Clay Roof Tiles + Bump (Interfaith Chapel roof from chapel.jpg!)
  const [trC, trCtx] = makeCanvas(512, 512);
  const [trBC, trBCtx] = makeCanvas(256, 256);
  const randTr = seededRandom(5555);
  trCtx.fillStyle = '#6f2920';
  trCtx.fillRect(0, 0, 512, 512);
  trBCtx.fillStyle = '#383838';
  trBCtx.fillRect(0, 0, 256, 256);
  const tw = 32;
  const th = 42;
  for (let r = 0; r < 13; r++) {
    for (let c = 0; c < 16; c++) {
      const x = c * tw;
      const y = r * th;
      const rr = 144 + Math.floor(randTr() * 28);
      const gg = 58 + Math.floor(randTr() * 18);
      const bb = 44 + Math.floor(randTr() * 14);
      const grad = trCtx.createLinearGradient(x, y, x + tw, y);
      grad.addColorStop(0, `rgb(${rr - 32},${gg - 18},${bb - 14})`);
      grad.addColorStop(0.5, `rgb(${rr + 18},${gg + 12},${bb + 10})`);
      grad.addColorStop(1, `rgb(${rr - 38},${gg - 20},${bb - 15})`);
      trCtx.fillStyle = grad;
      trCtx.beginPath();
      trCtx.roundRect(x + 1, y + 1, tw - 2, th - 4, [4, 4, 14, 14]);
      trCtx.fill();

      const bGrad = trBCtx.createLinearGradient(x * 0.5, y * 0.5, (x + tw) * 0.5, y * 0.5);
      bGrad.addColorStop(0, '#444');
      bGrad.addColorStop(0.5, '#eee');
      bGrad.addColorStop(1, '#444');
      trBCtx.fillStyle = bGrad;
      trBCtx.fillRect(x * 0.5 + 1, y * 0.5 + 1, tw * 0.5 - 1, th * 0.5 - 2);
    }
  }
  const terracottaRoof = register(trC, true, 4, 4);
  const terracottaBump = register(trBC, false, 4, 4);

  // 9. Cogon / Nipa Thatch Roof + Bump (Mabini Shrine from mabini.jpg!)
  const [thC, thCtx] = makeCanvas(512, 512);
  const [thBC, thBCtx] = makeCanvas(256, 256);
  const randTh = seededRandom(6161);
  thCtx.fillStyle = '#8b744d';
  thCtx.fillRect(0, 0, 512, 512);
  thBCtx.fillStyle = '#707070';
  thBCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 6000; i++) {
    const x = randTh() * 512;
    const y = randTh() * 512;
    const len = 18 + randTh() * 44;
    const tone = Math.floor(randTh() * 55);
    thCtx.strokeStyle = `rgb(${115 + tone},${96 + Math.floor(tone * 0.85)},${66 + Math.floor(tone * 0.65)})`;
    thCtx.lineWidth = 1.2 + randTh() * 1.6;
    thCtx.beginPath();
    thCtx.moveTo(x, y);
    thCtx.lineTo(x + (randTh() - 0.5) * 6, y + len);
    thCtx.stroke();

    const bv = 90 + Math.floor(randTh() * 130);
    thBCtx.strokeStyle = `rgb(${bv},${bv},${bv})`;
    thBCtx.lineWidth = 1;
    thBCtx.beginPath();
    thBCtx.moveTo(x * 0.5, y * 0.5);
    thBCtx.lineTo(x * 0.5, (y + len) * 0.5);
    thBCtx.stroke();
  }
  const thatchRoof = register(thC, true, 3, 2);
  const thatchBump = register(thBC, false, 3, 2);

  // 10. Mint-Green Vertical Wooden Slats + Bump (Mabini Shrine walls from mabini.jpg!)
  const [mwC, mwCtx] = makeCanvas(512, 512);
  const [mwBC, mwBCtx] = makeCanvas(256, 256);
  const randMw = seededRandom(6262);
  mwCtx.fillStyle = '#8cd4c3';
  mwCtx.fillRect(0, 0, 512, 512);
  mwBCtx.fillStyle = '#505050';
  mwBCtx.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 512; x += 12) {
    const d = Math.floor(randMw() * 16) - 8;
    mwCtx.fillStyle = `rgb(${136 + d},${208 + d},${190 + d})`;
    mwCtx.fillRect(x + 1, 0, 9, 512);
    mwCtx.fillStyle = 'rgba(42, 86, 78, 0.34)';
    mwCtx.fillRect(x, 0, 2, 512);
    mwBCtx.fillStyle = '#d8d8d8';
    mwBCtx.fillRect(x * 0.5 + 1, 0, 4, 256);
  }
  const mintWood = register(mwC, true, 3, 1);
  const mintWoodBump = register(mwBC, false, 3, 1);

  // 11. Lush Manila Tropical Grass Turf
  const [grsC, grsCtx] = makeCanvas(512, 512);
  const rand5 = seededRandom(5050);
  grsCtx.fillStyle = '#4e7b3a';
  grsCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 45; i++) {
    const x = rand5() * 512;
    const y = rand5() * 512;
    const r = 30 + rand5() * 70;
    const g = grsCtx.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(0, rand5() > 0.5 ? 'rgba(98, 138, 62, 0.28)' : 'rgba(54, 88, 38, 0.25)');
    g.addColorStop(1, 'rgba(78, 123, 58, 0)');
    grsCtx.fillStyle = g;
    grsCtx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  blendSpecklesFast(grsCtx, 512, 512, 11000, rand5, 2, 5, 0.46, () => [
    56 + ((rand5() * 32) | 0),
    96 + ((rand5() * 48) | 0),
    36 + ((rand5() * 22) | 0),
  ]);
  const grassTurf = register(grsC, true, 18, 18);

  // 12. Terracotta Track & Field Oval Surface
  const [trkC, trkCtx] = makeCanvas(512, 512);
  const rand6 = seededRandom(6060);
  trkCtx.fillStyle = '#9c4532';
  trkCtx.fillRect(0, 0, 512, 512);
  blendSpecklesFast(trkCtx, 512, 512, 7000, rand6, 3, 3, 0.45, () => {
    const v = (rand6() * 26) | 0;
    return [145 + v, 62 + ((v * 0.6) | 0), 46 + ((v * 0.4) | 0)];
  });
  const trackRed = register(trkC, true, 4, 4);

  // 13. Heritage Hardwood Plank (Benches, Lagoon Footbridge, Desks)
  const [wdC, wdCtx] = makeCanvas(512, 512);
  const rand7 = seededRandom(7070);
  wdCtx.fillStyle = '#6c4930';
  wdCtx.fillRect(0, 0, 512, 512);
  for (let p = 0; p < 16; p++) {
    const y = p * 32;
    const tone = Math.floor(rand7() * 22) - 10;
    wdCtx.fillStyle = `rgb(${108 + tone},${73 + Math.floor(tone * 0.7)},${48 + Math.floor(tone * 0.5)})`;
    wdCtx.fillRect(0, y + 1, 512, 30);
    wdCtx.fillStyle = 'rgba(40,24,12,0.38)';
    wdCtx.fillRect(0, y, 512, 2);
  }
  const woodPlank = register(wdC, true, 2, 2);

  // 14. Polished Interior Lobby / Library Terrazzo Tile
  const [intC, intCtx] = makeCanvas(512, 512);
  const rand8 = seededRandom(8080);
  intCtx.fillStyle = '#e5ded2';
  intCtx.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      intCtx.fillStyle = (row + col) % 2 === 0 ? '#eae3d7' : '#e0d8c9';
      intCtx.fillRect(col * 128 + 2, row * 128 + 2, 124, 124);
    }
  }
  for (let i = 0; i < 1800; i++) {
    intCtx.fillStyle = rand8() > 0.5 ? 'rgba(130,115,100,0.18)' : 'rgba(255,255,255,0.28)';
    intCtx.fillRect(rand8() * 512, rand8() * 512, 2, 2);
  }
  const interiorTile = register(intC, true, 5, 5);

  // 15. Corrugated GI Construction Hoarding Fence (North Wing DPWH Site)
  const [fC, fCtx] = makeCanvas(512, 256);
  fCtx.fillStyle = '#2b547c';
  fCtx.fillRect(0, 0, 512, 256);
  for (let x = 0; x < 512; x += 16) {
    fCtx.fillStyle = 'rgba(255,255,255,0.12)';
    fCtx.fillRect(x, 0, 6, 256);
    fCtx.fillStyle = 'rgba(0,0,0,0.2)';
    fCtx.fillRect(x + 8, 0, 6, 256);
  }
  fCtx.fillStyle = '#e5a91a';
  fCtx.fillRect(0, 212, 512, 26);
  fCtx.fillStyle = '#1b1917';
  for (let x = -32; x < 544; x += 36) {
    fCtx.beginPath();
    fCtx.moveTo(x, 238);
    fCtx.lineTo(x + 18, 212);
    fCtx.lineTo(x + 34, 212);
    fCtx.lineTo(x + 16, 238);
    fCtx.closePath();
    fCtx.fill();
  }
  const constructionFence = register(fC, true, 4, 1);

  // 16. Authentic PUP Entrance Mural (dark oxidized-bronze relief on glossy terracotta tile wall — matches mural.jpg!)
  const [mC, mCtx] = makeCanvas(1024, 384);
  const mGrad = mCtx.createLinearGradient(0, 0, 1024, 384);
  mGrad.addColorStop(0, '#964734');
  mGrad.addColorStop(0.5, '#a8533d');
  mGrad.addColorStop(1, '#853c2c');
  mCtx.fillStyle = mGrad;
  mCtx.fillRect(0, 0, 1024, 384);
  // Subtle square terracotta marble wall tiles behind the bronze sculpture
  mCtx.strokeStyle = 'rgba(255, 224, 200, 0.22)';
  mCtx.lineWidth = 2;
  for (let x = 0; x < 1024; x += 96) {
    mCtx.beginPath();
    mCtx.moveTo(x, 0);
    mCtx.lineTo(x, 384);
    mCtx.stroke();
  }
  for (let y = 0; y < 384; y += 96) {
    mCtx.beginPath();
    mCtx.moveTo(0, y);
    mCtx.lineTo(1024, y);
    mCtx.stroke();
  }
  // Dramatic dark oxidized-bronze bas-relief composition (industrial gear, scholar reading book, rising worker with hammer, factory spires)
  const drawBronzeShape = (drawFn: () => void) => {
    mCtx.save();
    mCtx.translate(8, 10);
    mCtx.fillStyle = 'rgba(24, 14, 10, 0.55)';
    drawFn();
    mCtx.restore();
    mCtx.fillStyle = '#3c433e';
    drawFn();
    mCtx.strokeStyle = '#9aa89e';
    mCtx.lineWidth = 3.5;
    drawFn();
    mCtx.stroke();
  };
  // Glazed reddish-terracotta square tile grid visible behind the bronze relief (matches gh_2_THE_MURAL.jpg!)
  mCtx.strokeStyle = 'rgba(235, 200, 185, 0.28)';
  mCtx.lineWidth = 2;
  for (let gx = 0; gx <= 1024; gx += 64) {
    mCtx.beginPath();
    mCtx.moveTo(gx, 0);
    mCtx.lineTo(gx, 384);
    mCtx.stroke();
  }
  for (let gy = 0; gy <= 384; gy += 64) {
    mCtx.beginPath();
    mCtx.moveTo(0, gy);
    mCtx.lineTo(1024, gy);
    mCtx.stroke();
  }
  // Giant industrial gear left-center
  drawBronzeShape(() => {
    mCtx.beginPath();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const r = i % 2 === 0 ? 108 : 84;
      const px = 340 + Math.cos(a) * r;
      const py = 225 + Math.sin(a) * r;
      if (i === 0) mCtx.moveTo(px, py);
      else mCtx.lineTo(px, py);
    }
    mCtx.closePath();
    mCtx.fill();
  });
  mCtx.fillStyle = '#8b3a2b';
  mCtx.beginPath();
  mCtx.arc(340, 225, 42, 0, Math.PI * 2);
  mCtx.fill();
  // Scholar reading an open book at center
  drawBronzeShape(() => {
    mCtx.beginPath();
    mCtx.arc(495, 118, 28, 0, Math.PI * 2);
    mCtx.fill();
    mCtx.fillRect(455, 152, 82, 165);
  });
  mCtx.fillStyle = '#626c64';
  mCtx.beginPath();
  mCtx.moveTo(458, 198);
  mCtx.lineTo(495, 214);
  mCtx.lineTo(534, 198);
  mCtx.lineTo(526, 250);
  mCtx.lineTo(495, 260);
  mCtx.lineTo(466, 250);
  mCtx.closePath();
  mCtx.fill();
  // Diagonal striving figure lifting a hammer (right-center)
  drawBronzeShape(() => {
    mCtx.beginPath();
    mCtx.moveTo(540, 325);
    mCtx.lineTo(665, 155);
    mCtx.lineTo(795, 108);
    mCtx.lineTo(806, 134);
    mCtx.lineTo(695, 192);
    mCtx.lineTo(585, 342);
    mCtx.closePath();
    mCtx.fill();
    // Hammer head
    mCtx.fillRect(780, 76, 46, 26);
  });
  // Left & right angular modernist sculptural slabs (agriculture & industry)
  drawBronzeShape(() => {
    mCtx.beginPath();
    mCtx.moveTo(45, 280);
    mCtx.lineTo(135, 125);
    mCtx.lineTo(240, 155);
    mCtx.lineTo(255, 300);
    mCtx.lineTo(90, 315);
    mCtx.closePath();
    mCtx.fill();
  });
  drawBronzeShape(() => {
    mCtx.beginPath();
    mCtx.moveTo(745, 290);
    mCtx.lineTo(820, 180);
    mCtx.lineTo(875, 150);
    mCtx.lineTo(960, 195);
    mCtx.lineTo(980, 305);
    mCtx.lineTo(785, 325);
    mCtx.closePath();
    mCtx.fill();
  });
  const muralRelief = register(mC, true, 1, 1);

  // 17. Soft Radial Ground Contact Shadow Disc (grounds buildings/trees/props even on SwiftShader!)
  const [csC, csCtx] = makeCanvas(256, 256);
  const csGrad = csCtx.createRadialGradient(128, 128, 12, 128, 128, 124);
  csGrad.addColorStop(0, 'rgba(12, 14, 12, 0.56)');
  csGrad.addColorStop(0.55, 'rgba(12, 14, 12, 0.28)');
  csGrad.addColorStop(1, 'rgba(12, 14, 12, 0)');
  csCtx.fillStyle = csGrad;
  csCtx.fillRect(0, 0, 256, 256);
  const contactShadow = new THREE.CanvasTexture(csC);
  contactShadow.colorSpace = THREE.SRGBColorSpace;
  contactShadow.needsUpdate = true;
  allTextures.push(contactShadow);

  // 18. Weathered Tropical Moss-Streaked Concrete Perimeter Wall (Maui Oasis / El Pueblo access road!)
  const [wwC, wwCtx] = makeCanvas(512, 256);
  const randWw = seededRandom(2315);
  wwCtx.fillStyle = '#c5c1b5';
  wwCtx.fillRect(0, 0, 512, 256);
  blendSpecklesFast(wwCtx, 512, 256, 3600, randWw, 4, 3, 0.22, () => {
    const v = 148 + ((randWw() * 56) | 0);
    return [v, v - 2, v - 8];
  });
  // Vertical tropical rain-stain & dark moss streaks running down from top coping (south_4/5_maui_oasis.png!)
  for (let i = 0; i < 78; i++) {
    const x = randWw() * 512;
    const h = 42 + randWw() * 175;
    const w = 4 + randWw() * 14;
    const g = wwCtx.createLinearGradient(x, 0, x, h);
    g.addColorStop(0, randWw() > 0.35 ? 'rgba(56, 62, 46, 0.48)' : 'rgba(64, 60, 52, 0.42)');
    g.addColorStop(0.55, 'rgba(72, 74, 58, 0.22)');
    g.addColorStop(1, 'rgba(90, 88, 76, 0)');
    wwCtx.fillStyle = g;
    wwCtx.fillRect(x, 0, w, h);
  }
  // Subtle lower dampness & splash zone near road base
  const baseGrad = wwCtx.createLinearGradient(0, 196, 0, 256);
  baseGrad.addColorStop(0, 'rgba(58, 56, 48, 0)');
  baseGrad.addColorStop(1, 'rgba(52, 50, 44, 0.46)');
  wwCtx.fillStyle = baseGrad;
  wwCtx.fillRect(0, 196, 512, 60);
  const weatheredWall = register(wwC, true, 3, 1);

  return {
    concreteFacade,
    concreteBump,
    marblePylon,
    asphaltRoad,
    paverWalkway,
    freedomGrid,
    lagoonBrick,
    intramurosStone,
    intramurosBump,
    terracottaRoof,
    terracottaBump,
    thatchRoof,
    thatchBump,
    mintWood,
    mintWoodBump,
    grassTurf,
    trackRed,
    woodPlank,
    interiorTile,
    constructionFence,
    muralRelief,
    contactShadow,
    pylonP,
    pylonU,
    weatheredWall,
    dispose: () => {
      for (const tex of allTextures) tex.dispose();
    },
  };
}

const signTextureCache = new Map<string, THREE.CanvasTexture>();

export function clearSignTextureCache() {
  for (const tex of signTextureCache.values()) {
    tex.dispose();
  }
  signTextureCache.clear();
}

/**
 * Generates (and memoizes) a crisp procedural university signboard texture (no external/AI images).
 */
export function createSignTexture(
  title: string,
  subtitle: string,
  options: {
    bg?: string;
    border?: string;
    titleColor?: string;
    subtitleColor?: string;
    width?: number;
    height?: number;
    badge?: string;
  } = {},
): THREE.CanvasTexture {
  const cacheKey = `${title}|${subtitle}|${options.bg ?? ''}|${options.border ?? ''}|${options.titleColor ?? ''}|${options.subtitleColor ?? ''}|${options.width ?? 1024}|${options.height ?? 256}|${options.badge ?? ''}`;
  const cached = signTextureCache.get(cacheKey);
  if (cached) return cached;

  const w = options.width ?? 1024;
  const h = options.height ?? 256;
  const [canvas, ctx] = makeCanvas(w, h);

  ctx.fillStyle = options.bg ?? '#6f1114';
  ctx.fillRect(0, 0, w, h);

  if (options.border !== 'none') {
    ctx.strokeStyle = options.border ?? '#e5a91a';
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, w - 20, h - 20);
  }

  if (options.badge) {
    ctx.fillStyle = '#e5a91a';
    ctx.font = '700 28px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(options.badge, w / 2, 58);
  }

  ctx.fillStyle = options.titleColor ?? '#ffffff';
  ctx.font = `700 ${title.length > 36 ? 38 : 50}px "Lora", Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, w / 2, options.badge ? h * 0.5 : subtitle ? h * 0.42 : h * 0.5);

  if (subtitle) {
    ctx.fillStyle = options.subtitleColor ?? '#f2d388';
    ctx.font = '600 26px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(subtitle, w / 2, options.badge ? h * 0.78 : h * 0.72);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  signTextureCache.set(cacheKey, tex);
  return tex;
}
