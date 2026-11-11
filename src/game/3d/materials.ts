import * as THREE from 'three';

/**
 * Procedural texture and PBR material library for 3D Optimum Hill Climb.
 * Strictly adheres to zero-404 procedural guidelines using CanvasTexture.
 */

// Generate procedural silver Optimum infinity logo texture for car doors
function createInfinityDoorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Matte black door background
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, 512, 256);

  // Door edge bevel
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 504, 248);

  // Silver Optimum Infinity Logo centered
  const cx = 256;
  const cy = 128;
  const w = 240;
  const h = 120;

  // Chrome silver gradient
  const grad = ctx.createLinearGradient(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2);
  grad.addColorStop(0, '#f8fafc');
  grad.addColorStop(0.3, '#cbd5e1');
  grad.addColorStop(0.5, '#ffffff');
  grad.addColorStop(0.7, '#94a3b8');
  grad.addColorStop(1, '#e2e8f0');

  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineWidth = 36;
  ctx.lineCap = 'round';
  ctx.strokeStyle = grad;

  const r = 58;
  ctx.beginPath();
  ctx.arc(-r, 0, r, Math.PI * 0.25, Math.PI * 1.75);
  ctx.bezierCurveTo(-r * 0.3, -r, r * 0.3, r, r, r);
  ctx.arc(r, 0, r, Math.PI * 0.25, -Math.PI * 0.25);
  ctx.bezierCurveTo(r * 0.3, -r, -r * 0.3, r, -r, r);
  ctx.stroke();

  // Specular shine line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Checkered finish banner texture
function createCheckeredTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const tileSize = 32;
  for (let y = 0; y < 128; y += tileSize) {
    for (let x = 0; x < 256; x += tileSize) {
      ctx.fillStyle = (x / tileSize + y / tileSize) % 2 === 0 ? '#ffffff' : '#0f172a';
      ctx.fillRect(x, y, tileSize, tileSize);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// Road asphalt & center line texture
function createRoadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Dark road asphalt
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle road grain
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  for (let i = 0; i < 2000; i++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 512;
    ctx.fillRect(rx, ry, 2, 2);
  }

  // White road borders
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(16, 0, 16, 512);
  ctx.fillRect(480, 0, 16, 512);

  // Dashed glowing center lane divider
  ctx.fillStyle = '#38bdf8';
  for (let y = 0; y < 512; y += 64) {
    ctx.fillRect(250, y + 10, 12, 44);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 10);
  return tex;
}

export class GameMaterials3D {
  public static doorTexture = createInfinityDoorTexture();
  public static roadTexture = createRoadTexture();
  public static checkeredTexture = createCheckeredTexture();

  // Car Body Materials
  public static whiteBody = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.22,
    metalness: 0.12,
  });

  public static blueStripe = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.3,
    metalness: 0.2,
  });

  public static blackBody = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.45,
    metalness: 0.15,
  });

  public static doorPanel = new THREE.MeshStandardMaterial({
    map: GameMaterials3D.doorTexture,
    roughness: 0.4,
    metalness: 0.2,
  });

  // Neon glowing cyan light pipes (as seen on rear fender & rocker)
  public static cyanNeon = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x00f0ff,
    emissiveIntensity: 2.4,
    roughness: 0.1,
  });

  // Roll cage steel tubing
  public static rollCage = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.4,
    metalness: 0.7,
  });

  public static rearDiagonalStrut = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.45,
    metalness: 0.5,
  });

  // 3 Amber roof lights
  public static amberLight = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xf59e0b,
    emissiveIntensity: 2.2,
    roughness: 0.15,
  });

  public static lightHousing = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.5,
    metalness: 0.4,
  });

  // Front headlight
  public static headlightLens = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfbbf24,
    emissiveIntensity: 2.5,
    roughness: 0.1,
  });

  // Taillight
  public static taillightLens = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: 0xea580c,
    emissiveIntensity: 1.8,
  });

  // Wheels & Tires
  public static tireRubber = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.88,
    metalness: 0.05,
  });

  public static darkSteelRim = new THREE.MeshStandardMaterial({
    color: 0x18202f,
    roughness: 0.35,
    metalness: 0.75,
  });

  public static silverRimLip = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.2,
    metalness: 0.9,
  });

  public static brakeCaliper = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.3,
    metalness: 0.2,
  });

  public static brakeRotor = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.25,
    metalness: 0.85,
  });

  // Muscat Mascot Materials
  public static muscatHead = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.28,
    metalness: 0.05,
  });

  public static muscatVisor = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.08,
    metalness: 0.4,
  });

  public static muscatVisorFrame = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
  });

  public static muscatHoodie = new THREE.MeshStandardMaterial({
    color: 0x181f2a,
    roughness: 0.82,
    metalness: 0.05,
  });

  public static muscatGloves = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.4,
  });

  public static cyanFlameRings = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 2.8,
    roughness: 0.1,
  });

  // Silver Optimum Infinity Collectible Coin Material
  public static silverCoin = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.14,
    metalness: 0.96,
  });

  // Road and track materials
  public static road = new THREE.MeshStandardMaterial({
    map: GameMaterials3D.roadTexture,
    roughness: 0.75,
    metalness: 0.1,
  });

  public static checkeredBanner = new THREE.MeshStandardMaterial({
    map: GameMaterials3D.checkeredTexture,
    roughness: 0.4,
  });

  // Red Fuel Canister Material
  public static fuelCan = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.35,
    metalness: 0.2,
  });

  public static fuelCap = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.25,
    metalness: 0.6,
  });
}
