import { assetManager } from './assets.ts';
import { VehiclePhysics } from './physics.ts';
import { TerrainManager } from './terrain.ts';
import { BiomeType, FloatingText, Particle } from './types.ts';

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // Camera
  public camX: number = 0;
  public camY: number = 300;
  public zoom: number = 1.0;
  public screenShake: number = 0;

  // Visual particles & floating messages
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private nextTextId: number = 1;

  // Background clouds
  private clouds: { x: number; y: number; scale: number; speed: number }[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;

    // Initialize decorative clouds
    for (let i = 0; i < 10; i++) {
      this.clouds.push({
        x: Math.random() * 2000,
        y: 40 + Math.random() * 120,
        scale: 0.6 + Math.random() * 0.8,
        speed: 0.2 + Math.random() * 0.4,
      });
    }
  }

  public resize(width: number, height: number) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  public resetCamera(x: number, y: number) {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.camX = x - width * 0.35;
    this.camY = y - height * 0.58;
  }

  public addFloatingText(x: number, y: number, text: string, color: string = '#f8fafc') {
    this.floatingTexts.push({
      id: this.nextTextId++,
      x,
      y,
      text,
      color,
      alpha: 1,
      scale: 1,
      lifetime: 0,
      maxLifetime: 1.4,
    });
  }

  public addCoinSparkles(x: number, y: number) {
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 2 + Math.random() * 3.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        radius: 3 + Math.random() * 3,
        color: Math.random() > 0.4 ? '#ffffff' : '#cbd5e1',
        alpha: 1,
        decay: 0.035,
        type: 'coinStar',
      });
    }
  }

  public addFuelSplash(x: number, y: number) {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        radius: 3 + Math.random() * 2.5,
        color: Math.random() > 0.3 ? '#ef4444' : '#fbbf24',
        alpha: 1,
        decay: 0.04,
        type: 'fuelDrop',
      });
    }
  }

  public addExhaustSmoke(x: number, y: number, isAccelerating: boolean) {
    if (Math.random() > (isAccelerating ? 0.35 : 0.8)) return;
    this.particles.push({
      x,
      y,
      vx: -1.5 - Math.random() * 1.5,
      vy: -0.5 - Math.random() * 1.0,
      radius: isAccelerating ? 4.5 + Math.random() * 3 : 2.5,
      color: isAccelerating && Math.random() < 0.25 ? '#fbbf24' : '#94a3b8',
      alpha: 0.65,
      decay: 0.025,
      type: 'smoke',
    });
  }

  public addTireDirt(x: number, y: number, vx: number) {
    if (Math.random() > 0.4) return;
    this.particles.push({
      x,
      y,
      vx: -vx * 0.3 + (Math.random() * 2 - 1),
      vy: -1 - Math.random() * 2.5,
      radius: 2 + Math.random() * 2,
      color: '#78350f',
      alpha: 0.8,
      decay: 0.05,
      type: 'dirt',
    });
  }

  public addCrashExplosion(x: number, y: number) {
    this.screenShake = 18;
    for (let i = 0; i < 32; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3.5,
        radius: 3 + Math.random() * 4,
        color: ['#ef4444', '#f97316', '#fbbf24', '#64748b', '#ffffff'][Math.floor(Math.random() * 5)],
        alpha: 1,
        decay: 0.022,
        type: 'spark',
      });
    }
  }

  public addConfetti(x: number, y: number) {
    const colors = ['#f59e0b', '#38bdf8', '#10b981', '#ec4899', '#8b5cf6', '#ffffff'];
    for (let i = 0; i < 48; i++) {
      const angle = (Math.PI * 2 * i) / 48 + Math.random() * 0.2;
      const speed = 2.5 + Math.random() * 6.0;
      this.particles.push({
        x,
        y: y - 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 5.5,
        radius: 3.5 + Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 0.012,
        type: 'confetti',
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() * 2 - 1) * 0.25,
      });
    }
  }

  public updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.type === 'smoke') {
        p.radius += 0.25;
        p.vy -= 0.02;
      } else if (p.type === 'confetti') {
        p.vy += 0.08; // Gentle flutter
        p.vx *= 0.98;
      } else {
        p.vy += 0.12; // Gravity on debris/dirt
      }

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.lifetime += dt;
      ft.y -= 1.2;
      ft.scale = Math.min(1.2, 1.0 + ft.lifetime * 0.2);
      ft.alpha = Math.max(0, 1 - ft.lifetime / ft.maxLifetime);
      if (ft.lifetime >= ft.maxLifetime) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  /**
   * Main rendering loop
   */
  public render(
    vehicle: VehiclePhysics,
    terrain: TerrainManager,
    isAccelerating: boolean,
    dt: number
  ) {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (width === 0 || height === 0) return;

    // Smooth camera tracking
    // Keep 30% larger vehicle comfortably framed with road ahead visible
    const targetCamX = vehicle.x - width * 0.33;
    const targetCamY = vehicle.y - height * 0.55;

    this.camX += (targetCamX - this.camX) * 0.12;
    this.camY += (targetCamY - this.camY) * 0.08;

    // Camera screen shake upon crash impact
    if (this.screenShake > 0) {
      this.camX += (Math.random() * 2 - 1) * this.screenShake;
      this.camY += (Math.random() * 2 - 1) * this.screenShake;
      this.screenShake = Math.max(0, this.screenShake - dt * 30);
    }

    // Speed-based dynamic camera zoom (calibrated for 30% larger car)
    const targetZoom = Math.max(0.82, 0.96 - (Math.abs(vehicle.vx) / 24) * 0.12);
    this.zoom += (targetZoom - this.zoom) * 0.05;

    const currentBiome = terrain.getBiome(vehicle.x);

    this.ctx.save();
    // Clear canvas
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, width, height);

    // 1. Draw Parallax Backgrounds
    this.drawParallaxSky(width, height, currentBiome);

    // Camera transform for world objects
    this.ctx.save();
    this.ctx.translate(width / 2, height / 2);
    this.ctx.scale(this.zoom, this.zoom);
    this.ctx.translate(-width / 2, -height / 2);
    this.ctx.translate(-this.camX, -this.camY);

    // 2. Draw Distant Parallax Hills
    this.drawMidgroundHills(vehicle.x, width, height, currentBiome);

    // 3. Draw Terrain (Ground, grass, layers, bridges, milestones)
    this.drawTerrain(terrain, vehicle.x, width, height, currentBiome);

    // 4. Draw Collectibles (Silver Optimum Coins & Fuel Cans)
    this.drawCollectibles(terrain.getCollectibles());

    // 5. Draw Exhaust / Dirt Particles
    if (!vehicle.isCrashed) {
      const cosA = Math.cos(vehicle.angle);
      const sinA = Math.sin(vehicle.angle);
      const exhaustX = vehicle.x - 42 * cosA + 10 * sinA;
      const exhaustY = vehicle.y - 42 * sinA - 10 * cosA;
      this.addExhaustSmoke(exhaustX, exhaustY, isAccelerating);

      if (vehicle.rearWheel.isGrounded && Math.abs(vehicle.vx) > 2) {
        this.addTireDirt(vehicle.rearWheel.x, vehicle.rearWheel.y + 12, vehicle.vx);
      }
    }

    this.drawParticles();

    // 6. Draw Vehicle & Muscat Mascot Driver!
    this.drawVehicle(vehicle);

    // 7. Draw Floating Stunt Texts
    this.drawFloatingTexts();

    this.ctx.restore(); // Restore camera transform

    this.ctx.restore(); // Restore canvas base
  }

  /**
   * Sky gradient and floating clouds matching current biome
   */
  private drawParallaxSky(w: number, h: number, biome: BiomeType) {
    const ctx = this.ctx;
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);

    if (biome === 'meadow') {
      skyGrad.addColorStop(0, '#38bdf8'); // Sky blue
      skyGrad.addColorStop(0.65, '#bae6fd');
      skyGrad.addColorStop(1, '#f0fdf4'); // Soft horizon
    } else if (biome === 'desert') {
      skyGrad.addColorStop(0, '#f97316'); // Golden orange
      skyGrad.addColorStop(0.65, '#fde047');
      skyGrad.addColorStop(1, '#fef3c7');
    } else if (biome === 'snow') {
      skyGrad.addColorStop(0, '#64748b'); // Cool slate blue
      skyGrad.addColorStop(0.65, '#cbd5e1');
      skyGrad.addColorStop(1, '#f8fafc');
    } else {
      skyGrad.addColorStop(0, '#4c1d95'); // Sunset canyon violet
      skyGrad.addColorStop(0.65, '#f43f5e');
      skyGrad.addColorStop(1, '#fde047');
    }

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Radiant Sun
    const sunX = w * 0.78;
    const sunY = h * 0.22;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 90);
    sunGlow.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    sunGlow.addColorStop(0.3, 'rgba(254, 240, 138, 0.6)');
    sunGlow.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 90, 0, Math.PI * 2);
    ctx.fill();

    // Drifting clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    for (const c of this.clouds) {
      c.x += c.speed;
      if (c.x > w + 200) c.x = -200;
      const cx = (c.x - this.camX * 0.05) % (w + 400) - 100;
      this.drawCloud(cx, c.y, c.scale);
    }
  }

  private drawCloud(x: number, y: number, s: number) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(x, y, 22 * s, 0, Math.PI * 2);
    ctx.arc(x + 18 * s, y - 8 * s, 26 * s, 0, Math.PI * 2);
    ctx.arc(x + 38 * s, y - 2 * s, 20 * s, 0, Math.PI * 2);
    ctx.arc(x + 52 * s, y + 4 * s, 16 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Midground mountain and hill silhouettes
   */
  private drawMidgroundHills(playerX: number, w: number, h: number, biome: BiomeType) {
    const ctx = this.ctx;
    const startX = this.camX - 200;
    const endX = this.camX + w + 200;

    // Distant mountain ridge (parallax factor 0.12)
    ctx.fillStyle = biome === 'snow' ? '#94a3b8' : biome === 'desert' ? '#d97706' : biome === 'canyon' ? '#831843' : '#86efac';
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(startX, this.camY + h);
    for (let x = startX; x <= endX; x += 30) {
      const my = 280 + Math.sin(x * 0.0008) * 80 + Math.cos(x * 0.0022) * 45;
      ctx.lineTo(x, my);
    }
    ctx.lineTo(endX, this.camY + h);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }

  /**
   * Main rolling hills terrain with layers, grass, bridges, and milestone flags
   */
  private drawTerrain(
    terrain: TerrainManager,
    playerX: number,
    w: number,
    h: number,
    biome: BiomeType
  ) {
    const ctx = this.ctx;
    const startX = Math.floor(this.camX - 200);
    const endX = Math.ceil(this.camX + w + 200);
    const step = 8; // Smooth 8px polygon resolution

    // Colors per biome
    let grassColor = '#22c55e';
    let grassEdgeColor = '#16a34a';
    let dirtColorTop = '#78350f';
    let dirtColorBottom = '#451a03';

    if (biome === 'desert') {
      grassColor = '#facc15';
      grassEdgeColor = '#eab308';
      dirtColorTop = '#b45309';
      dirtColorBottom = '#78350f';
    } else if (biome === 'snow') {
      grassColor = '#f8fafc';
      grassEdgeColor = '#e2e8f0';
      dirtColorTop = '#475569';
      dirtColorBottom = '#1e293b';
    } else if (biome === 'canyon') {
      grassColor = '#f43f5e';
      grassEdgeColor = '#e11d48';
      dirtColorTop = '#881337';
      dirtColorBottom = '#4c0519';
    }

    // 1. Draw ground fill
    ctx.beginPath();
    ctx.moveTo(startX, this.camY + h + 200);
    for (let x = startX; x <= endX; x += step) {
      const y = terrain.getY(x);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(endX, this.camY + h + 200);
    ctx.closePath();

    const groundGrad = ctx.createLinearGradient(0, this.camY, 0, this.camY + h + 100);
    groundGrad.addColorStop(0, dirtColorTop);
    groundGrad.addColorStop(1, dirtColorBottom);
    ctx.fillStyle = groundGrad;
    ctx.fill();

    // 2. Draw thick top grass/surface strip
    ctx.beginPath();
    for (let x = startX; x <= endX; x += step) {
      const y = terrain.getY(x);
      if (x === startX) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineWidth = 10;
    ctx.strokeStyle = grassEdgeColor;
    ctx.stroke();

    ctx.lineWidth = 5;
    ctx.strokeStyle = grassColor;
    ctx.stroke();

    // 3. Draw Suspension Bridges
    for (const b of terrain.getBridges()) {
      if (b.endX < startX || b.startX > endX) continue;

      // Draw suspension cables
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(b.startX, b.planks[0]?.y ?? 400);
      for (const p of b.planks) {
        ctx.lineTo(p.x, p.y - 12);
      }
      ctx.stroke();

      // Draw wooden planks
      for (const p of b.planks) {
        ctx.fillStyle = '#92400e';
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 1.5;
        ctx.fillRect(p.x - 6, p.y - 3, 12, 7);
        ctx.strokeRect(p.x - 6, p.y - 3, 12, 7);
      }
    }

    // 4. Draw Milestone Road Signs and Finish Line Checkpoint
    for (const s of terrain.getRoadSigns()) {
      if (s.x < startX || s.x > endX) continue;
      const groundY = terrain.getY(s.x);

      if (s.isFinish) {
        // Grand Checkered Finish Line Arch!
        ctx.save();
        const archW = 72;
        const archH = 110;
        const leftPillarX = s.x - archW / 2;
        const rightPillarX = s.x + archW / 2;

        // Ground checkered starting line
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(s.x - 24, groundY - 4, 48, 8);
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#0f172a';
          ctx.fillRect(s.x - 24 + i * 8, groundY - 4, 8, 4);
          ctx.fillStyle = i % 2 === 1 ? '#ffffff' : '#0f172a';
          ctx.fillRect(s.x - 24 + i * 8, groundY, 8, 4);
        }

        // Left and Right Steel Truss Towers
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 3;
        ctx.fillRect(leftPillarX - 5, groundY - archH, 10, archH);
        ctx.strokeRect(leftPillarX - 5, groundY - archH, 10, archH);
        ctx.fillRect(rightPillarX - 5, groundY - archH, 10, archH);
        ctx.strokeRect(rightPillarX - 5, groundY - archH, 10, archH);

        // Overhead Banner Board
        const bannerY = groundY - archH;
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(leftPillarX - 12, bannerY - 14, archW + 24, 32, 6);
        ctx.fill();
        ctx.stroke();

        // Checkered Top and Bottom Trim on Banner
        const tileW = 8;
        const tileCount = Math.floor((archW + 24) / tileW);
        for (let t = 0; t < tileCount; t++) {
          ctx.fillStyle = t % 2 === 0 ? '#ffffff' : '#0f172a';
          ctx.fillRect(leftPillarX - 12 + t * tileW, bannerY - 14, tileW, 6);
          ctx.fillRect(leftPillarX - 12 + t * tileW, bannerY + 12, tileW, 6);
        }

        // Bold Glowing "FINISH" Text
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#fef08a';
        ctx.font = '900 16px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('FINISH', s.x, bannerY + 7);
        ctx.shadowBlur = 0;

        // Waving Checkered Flags on Tops of Both Towers
        const flagWave = Math.sin(Date.now() * 0.006) * 4;
        // Left Flag
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(leftPillarX, bannerY - 14);
        ctx.lineTo(leftPillarX - 22, bannerY - 26 + flagWave);
        ctx.lineTo(leftPillarX - 18, bannerY - 14);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Right Flag
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(rightPillarX, bannerY - 14);
        ctx.lineTo(rightPillarX + 22, bannerY - 26 - flagWave);
        ctx.lineTo(rightPillarX + 18, bannerY - 14);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();
      } else {
        // Standard Milestone Road Sign
        // Wooden post
        ctx.fillStyle = '#78350f';
        ctx.fillRect(s.x - 3, groundY - 50, 6, 50);

        // Signboard
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(s.x - 28, groundY - 76, 56, 26, 4);
        ctx.fill();
        ctx.stroke();

        // Sign text
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 12px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${s.distance}m`, s.x, groundY - 58);
      }
    }
  }

  /**
   * Draw Collectibles: 50% LARGER Silver Optimum Infinity Coins & Red Fuel Cans
   */
  private drawCollectibles(collectibles: ReturnType<TerrainManager['getCollectibles']>) {
    const ctx = this.ctx;
    const now = Date.now() * 0.003;
    const assets = assetManager.getAssets();

    for (const c of collectibles) {
      if (c.collected) continue;
      // Viewport frustum culling
      if (c.x < this.camX - 70 || c.x > this.camX + this.canvas.clientWidth + 70) continue;

      if (c.type === 'coin') {
        ctx.save();
        ctx.translate(c.x, c.y);

        // 3D Perspective Rotation of the silver infinity coin!
        const rot = now + c.animOffset;
        const scaleX = Math.cos(rot);
        const glowPulse = 0.5 + Math.sin(rot * 2) * 0.3;

        // Radiant metallic glowing halo (scaled up for 50% larger coin)
        const haloGrad = ctx.createRadialGradient(0, 0, 6, 0, 0, 38);
        haloGrad.addColorStop(0, `rgba(241, 245, 249, ${0.55 * glowPulse})`);
        haloGrad.addColorStop(0.5, `rgba(56, 189, 248, ${0.35 * glowPulse})`);
        haloGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 38, 0, Math.PI * 2);
        ctx.fill();

        // Draw 50% LARGER silver infinity coin (64px x 39px vs original 42px x 26px)
        ctx.scale(scaleX, 1);
        const coinW = 64;
        const coinH = 39;

        if (assets.optimumCoin) {
          ctx.drawImage(assets.optimumCoin, -coinW / 2, -coinH / 2, coinW, coinH);
        } else if (assets.optimumOriginal) {
          ctx.drawImage(assets.optimumOriginal, -coinW / 2, -coinH / 2, coinW, coinH);
        } else {
          this.drawSilverInfinityLogo(ctx, 0, 0, coinW, coinH);
        }

        // Specular glint sparkle flash
        if (Math.abs(scaleX) > 0.75 && Math.sin(now * 3 + c.animOffset) > 0.6) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(16 * scaleX, -6, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      } else if (c.type === 'fuel') {
        // Red Fuel Jerry Can
        ctx.save();
        const bob = Math.sin(now * 2) * 4;
        ctx.translate(c.x, c.y + bob);

        // Glowing aura
        const fuelHalo = ctx.createRadialGradient(0, 0, 8, 0, 0, 32);
        fuelHalo.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
        fuelHalo.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = fuelHalo;
        ctx.beginPath();
        ctx.arc(0, 0, 32, 0, Math.PI * 2);
        ctx.fill();

        // Jerry can body
        ctx.fillStyle = '#dc2626';
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-14, -18, 28, 36, 4);
        ctx.fill();
        ctx.stroke();

        // Cap / Spout
        ctx.fillStyle = '#475569';
        ctx.fillRect(-10, -23, 6, 6);

        // Handle
        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.roundRect(-10, -21, 20, 4, 2);
        ctx.fill();

        // White "FUEL" text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('FUEL', 0, 3);

        ctx.restore();
      }
    }
  }

  /**
   * Draw Particles: Smoke, Dirt, Sparks, Coin Stars
   */
  private drawParticles() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;

      if (p.type === 'coinStar') {
        ctx.translate(p.x, p.y);
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        // Star cross
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-p.radius * 1.5, 0);
        ctx.lineTo(p.radius * 1.5, 0);
        ctx.moveTo(0, -p.radius * 1.5);
        ctx.lineTo(0, p.radius * 1.5);
      } else if (p.type === 'confetti') {
        p.rotation = (p.rotation || 0) + (p.vRot || 0.1);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillRect(-p.radius, -p.radius * 0.6, p.radius * 2, p.radius * 1.2);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  /**
   * Draw the Black & White Optimum Off-road Jeep, Roll Cage, 3 Roof Lights,
   * Neon Blue Glowing Accent Lines, Silver Infinity Logo, and Muscat Driver!
   */
  private drawVehicle(v: VehiclePhysics) {
    const ctx = this.ctx;
    const assets = assetManager.getAssets();

    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.rotate(v.angle);

    // 1. Dual Coilover Shock Absorbers connecting chassis to wheels
    const halfW = v.wheelbase / 2;
    this.drawCoilover(ctx, -halfW, 0, -halfW, v.rearSuspLength);
    this.drawCoilover(ctx, halfW, 0, halfW, v.frontSuspLength);

    // 2. Heavy-Duty Tubular Roll Cage with 3 Golden Roof Spotlights (Behind Driver)
    ctx.save();
    // Roll cage tubing
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Main rear B-pillar & top roof bar
    ctx.beginPath();
    ctx.moveTo(-42, -14); // Lower rear deck mount
    ctx.lineTo(-26, -56); // Up to rear roof crossbar
    ctx.lineTo(8, -56);   // Forward top roof rail
    ctx.lineTo(20, -12);  // A-pillar down to dashboard cowl
    ctx.stroke();

    // Secondary diagonal olive-drab support strut to rear corner
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-26, -56);
    ctx.lineTo(-54, -12); // Down to rear corner
    ctx.stroke();

    // Cross-brace reinforcement
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-24, -54);
    ctx.lineTo(18, -14);
    ctx.stroke();

    // 3 Golden-Amber Roof Spotlights mounted on the top bar
    const roofLightsX = [-22, -8, 6];
    for (const lx of roofLightsX) {
      // Spotlight mounting bracket & black casing
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(lx - 6, -65, 12, 11, 2.5);
      ctx.fill();
      ctx.stroke();

      // Golden amber lens
      const lensGrad = ctx.createLinearGradient(lx - 4, -65, lx + 4, -55);
      lensGrad.addColorStop(0, '#fef08a');
      lensGrad.addColorStop(0.5, '#fbbf24');
      lensGrad.addColorStop(1, '#d97706');
      ctx.fillStyle = lensGrad;
      ctx.beginPath();
      ctx.arc(lx + 2, -60, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Ambient warm light glow halo
      ctx.save();
      ctx.shadowColor = 'rgba(251, 191, 36, 0.8)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
      ctx.beginPath();
      ctx.arc(lx + 3, -60, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // 3. Muscat Mascot Driver seated in the cockpit
    ctx.save();
    // Driver seat position with organic vertical bounce from bumps & landing
    const seatX = -6;
    const seatY = -28 + v.headBobOffset;
    ctx.translate(seatX, seatY);

    if (v.isCrashed) {
      // Driver tumbled backward upon crash
      ctx.rotate(v.muscatLean);
    } else {
      // Realistic driving inertia lean:
      // Leans back into seat on acceleration, forward over wheel on braking, reacting to g-forces
      ctx.rotate(v.muscatLean);
    }

    // Dynamic Muscat Mascot Vector Artwork (Matching Reference Image!)
    // White flame head, floating cyan rings, black visor, dark hoodie, white gloved hands on wheel!
    this.drawMuscatDriver(ctx, v);

    // Animated Steering Wheel in front of Muscat:
    // Hands hold the wheel, and the wheel counter-steers across bumps and hills
    ctx.save();
    ctx.translate(24, -13);
    ctx.rotate(v.steeringWheelAngle);

    // Steering column angled down to dashboard
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-7, 16);
    ctx.stroke();

    // Outer grip ring (matte black off-road wheel)
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(0, 0, 11.5, 0, Math.PI * 2);
    ctx.stroke();

    // Chrome inner rim trim
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, 11.5, 0, Math.PI * 2);
    ctx.stroke();

    // 3-Spoke center hub
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 3; i++) {
      const spA = (i * Math.PI * 2) / 3 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(spA) * 10.5, Math.sin(spA) * 10.5);
      ctx.stroke();
    }
    // Center horn button
    ctx.fillStyle = '#0284c7'; // Optimum blue center emblem
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Muscat's White Gloved Hands Gripping Steering Wheel
    // Left hand at 9 o'clock, Right hand at 3 o'clock
    // Sleeve cuffs (dark hoodie)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(-11.5, 0, 4.5, 0, Math.PI * 2);
    ctx.arc(11.5, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    // Pure white driving gloves
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(-10.5, 0, 3.6, 0, Math.PI * 2);
    ctx.arc(10.5, 0, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore(); // Restore steering wheel transform
    ctx.restore(); // Restore driver seat transform

    // 4. Black & White Optimum Off-road Jeep Body / Chassis
    // Scaled up ~30% to match wheelbase 94, wheelRadius 26

    // Rear cargo tub & inner cab (dark charcoal)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-56, -14);
    ctx.lineTo(-24, -14);
    ctx.lineTo(-18, -2);
    ctx.lineTo(-56, -2);
    ctx.closePath();
    ctx.fill();

    // Main Jeep Body Shell: Matte Black & Pure Alpine White
    // A. Matte Black Door & Body Tub
    ctx.fillStyle = '#111827';
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-56, 6);
    ctx.lineTo(-56, -14); // Rear tail
    ctx.lineTo(-22, -14); // Rear deck edge
    ctx.lineTo(-14, -4);  // Cockpit cutdown
    ctx.lineTo(16, -4);   // Dashboard cowl
    ctx.lineTo(44, -5);   // Hood base
    ctx.lineTo(58, 6);    // Front nose
    ctx.lineTo(48, 18);   // Front fender
    ctx.lineTo(24, 10);   // Front wheel arch
    ctx.lineTo(-24, 10);  // Rocker panel
    ctx.lineTo(-48, 18);  // Rear wheel arch
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // B. Alpine White Front Clip & Hood Cowling
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(14, -14);  // Windshield base cowl
    ctx.lineTo(24, -4);   // Cowl corner
    ctx.lineTo(58, -3);   // Front hood top
    ctx.lineTo(60, 8);    // Front nose grille
    ctx.lineTo(46, 8);    // Front bumper joint
    ctx.lineTo(46, 0);    // Hood seam
    ctx.lineTo(14, 0);    // Lower cowl seam
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Blue Racing Stripe along Hood Top Ridge
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(22, -4);
    ctx.lineTo(58, -3);
    ctx.lineTo(57, -1);
    ctx.lineTo(22, -2);
    ctx.closePath();
    ctx.fill();

    // Front Blue LED Marker Light on Cowl
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(44, 2, 7, 3);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1;
    ctx.strokeRect(44, 2, 7, 3);

    // C. Angular White Off-Road Fender Flares (Front and Rear)
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.4;
    // Front angular white fender flare
    ctx.beginPath();
    ctx.moveTo(22, 10);
    ctx.lineTo(34, 1);
    ctx.lineTo(58, 1);
    ctx.lineTo(60, 8);
    ctx.lineTo(54, 16);
    ctx.lineTo(46, 12);
    ctx.lineTo(26, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Rear angular white fender flare outline & panel
    ctx.beginPath();
    ctx.moveTo(-54, 8);
    ctx.lineTo(-46, -1);
    ctx.lineTo(-26, -1);
    ctx.lineTo(-20, 10);
    ctx.lineTo(-26, 12);
    ctx.lineTo(-44, 12);
    ctx.lineTo(-52, 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // D. White Side Rocker Panel / Step Rail
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-22, 11, 44, 5, 2);
    ctx.fill();
    ctx.stroke();

    // E. Brilliant Neon Glowing Cyan-Blue Accent Lines!
    // Tracing the stepped rear fender contour and lower side panel (matching reference image)
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;

    // Stepped rear fender neon light pipe
    ctx.beginPath();
    ctx.moveTo(-54, 3);
    ctx.lineTo(-44, -1);
    ctx.lineTo(-26, -1);
    ctx.lineTo(-22, 8);
    ctx.lineTo(-14, 8);
    ctx.stroke();

    // Lower rocker neon accent line
    ctx.beginPath();
    ctx.moveTo(-20, 12);
    ctx.lineTo(20, 12);
    ctx.stroke();
    ctx.restore();

    // F. Silver Optimum Infinity Emblem on Door Panel!
    // Draw centered on the black door panel
    ctx.save();
    ctx.translate(-2, 3);
    if (assets.optimumCoin) {
      // Crisp silver metallic logo
      ctx.drawImage(assets.optimumCoin, -16, -9, 32, 18);
    } else {
      // Procedural metallic silver infinity logo
      this.drawSilverInfinityLogo(ctx, 0, 0, 30, 16);
    }
    ctx.restore();

    // G. Front Golden-Amber Off-road Headlight
    ctx.save();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(58, 4, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Inner hot core
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(59, 4, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Dynamic Headlight Beam forward
    const beamGrad = ctx.createLinearGradient(60, 4, 150, 4);
    beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.55)');
    beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(60, 1);
    ctx.lineTo(150, -18);
    ctx.lineTo(150, 26);
    ctx.lineTo(60, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // H. Rear Vertical Amber/Orange Marker Lights
    ctx.fillStyle = '#f97316';
    ctx.strokeStyle = '#9a3412';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-58, -8, 4, 12, 1.5);
    ctx.fill();
    ctx.stroke();

    // I. Rugged Heavy-Duty Off-Road Bumpers
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.2;
    // Front bumper with skid plate
    ctx.beginPath();
    ctx.roundRect(54, 8, 9, 14, 2.5);
    ctx.fill();
    ctx.stroke();
    // Rear bumper
    ctx.beginPath();
    ctx.roundRect(-62, 8, 9, 14, 2.5);
    ctx.fill();
    ctx.stroke();

    // Chrome Twin Exhaust Pipes at rear
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-65, 4, 6, 4);
    ctx.fillRect(-65, 10, 6, 4);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-66, 4.5, 2, 3);
    ctx.fillRect(-66, 10.5, 2, 3);

    ctx.restore(); // Restore chassis transform

    // 5. Draw Wheels with Continuous Speed-Synced Rotation and Dynamic Squash
    this.drawWheel(ctx, v.rearWheel);
    this.drawWheel(ctx, v.frontWheel);
  }

  /**
   * Draw Muscat Driver matching uploaded reference image:
   * White flame head, floating cyan energy rings at back crest,
   * glossy black visor with white border, and dark hoodie!
   */
  private drawMuscatDriver(ctx: CanvasRenderingContext2D, v: VehiclePhysics) {
    const assets = assetManager.getAssets();

    // If driver sprite is available, draw base sprite with enhanced glowing cyan energy rings
    if (assets.muscatDriver) {
      const driverW = 72;
      const driverH = 74;
      ctx.drawImage(assets.muscatDriver, -driverW / 2 + 1, -driverH + 16, driverW, driverH);

      // Add the iconic glowing cyan energy rings floating right behind his flame crest
      // (as highlighted in the reference image)
      ctx.save();
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.4;

      // Ring 1
      ctx.beginPath();
      ctx.ellipse(-18, -48, 5, 3.5, -0.4, 0, Math.PI * 2);
      ctx.stroke();

      // Ring 2
      ctx.beginPath();
      ctx.ellipse(-14, -42, 4, 3, -0.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Procedural high-fidelity Muscat driver fallback matching reference image
    ctx.save();
    // 1. Two Cyan Glowing Energy Rings at rear of flame
    ctx.save();
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.ellipse(-18, -48, 5.5, 4, -0.4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(-13, -42, 4.5, 3.2, -0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 2. Dark Navy / Charcoal Hoodie Body
    ctx.fillStyle = '#181f2a';
    ctx.strokeStyle = '#0a0e17';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-16, 2);
    ctx.lineTo(-18, -16);
    ctx.lineTo(-10, -22);
    ctx.lineTo(10, -22);
    ctx.lineTo(16, -16);
    ctx.lineTo(14, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Hoodie collar / fold
    ctx.fillStyle = '#243042';
    ctx.beginPath();
    ctx.moveTo(-10, -22);
    ctx.lineTo(0, -14);
    ctx.lineTo(10, -22);
    ctx.lineTo(0, -18);
    ctx.closePath();
    ctx.fill();

    // 3. Muscat's Iconic White Flame Head
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0a0e17';
    ctx.lineWidth = 2.8;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(12, -26);
    // Face right curve
    ctx.bezierCurveTo(16, -32, 14, -44, 6, -50);
    // Top flame curl curving backward
    ctx.bezierCurveTo(2, -54, -6, -56, -12, -50);
    // Upper flame trailing tip
    ctx.bezierCurveTo(-18, -54, -22, -48, -16, -42);
    // Lower flame crest
    ctx.bezierCurveTo(-22, -40, -18, -34, -12, -32);
    // Back of neck
    ctx.bezierCurveTo(-14, -28, -10, -24, 0, -24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Subtle blue flame inner shading
    const flameGrad = ctx.createLinearGradient(0, -54, 0, -24);
    flameGrad.addColorStop(0, 'rgba(224, 242, 254, 0)');
    flameGrad.addColorStop(1, 'rgba(186, 230, 253, 0.4)');
    ctx.fillStyle = flameGrad;
    ctx.fill();

    // 4. Black Visor Goggles with Bold White Rim & Specular Shine
    ctx.save();
    ctx.translate(2, -36);
    // Black visor pill
    ctx.fillStyle = '#0a0e17';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.roundRect(-10, -6, 20, 12, 6);
    ctx.fill();
    ctx.stroke();

    // Visor white top glint sheen
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -1, 7, -Math.PI * 0.8, -Math.PI * 0.2);
    ctx.stroke();
    ctx.restore();

    // Small determined mouth arc
    ctx.strokeStyle = '#0a0e17';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(2, -26, 4, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Procedural Silver Optimum Infinity Logo with metallic chrome gradient
   */
  private drawSilverInfinityLogo(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    ctx.save();
    ctx.translate(x, y);

    // Chrome metallic gradient
    const silverGrad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    silverGrad.addColorStop(0, '#f8fafc');
    silverGrad.addColorStop(0.3, '#cbd5e1');
    silverGrad.addColorStop(0.5, '#ffffff');
    silverGrad.addColorStop(0.7, '#94a3b8');
    silverGrad.addColorStop(1, '#e2e8f0');

    ctx.strokeStyle = silverGrad;
    ctx.lineWidth = h * 0.32;
    ctx.lineCap = 'round';

    const r = w * 0.22;
    ctx.beginPath();
    ctx.arc(-r, 0, r, Math.PI * 0.25, Math.PI * 1.75);
    ctx.bezierCurveTo(-r * 0.3, -r, r * 0.3, r, r, r);
    ctx.arc(r, 0, r, Math.PI * 0.25, -Math.PI * 0.25);
    ctx.bezierCurveTo(r * 0.3, -r, -r * 0.3, r, -r, r);
    ctx.stroke();

    // Soft glow
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draw realistic coilover shock absorber with hydraulic damper and compressing spring
   */
  private drawCoilover(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    currentLength: number
  ) {
    ctx.save();
    const y2 = y1 + currentLength;

    // Top mounting eyelet
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(x1, y1, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Inner chrome hydraulic damper shaft
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x1, y1 + 3);
    ctx.lineTo(x2, y2 - 4);
    ctx.stroke();

    // Lower shock reservoir body
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x2, y2 - 10);
    ctx.lineTo(x2, y2 - 2);
    ctx.stroke();

    // Helical spring coils with metallic racing finish
    ctx.strokeStyle = '#0284c7'; // Optimum racing blue coil spring
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    const coils = 5;
    const startY = y1 + 4;
    const springSpan = Math.max(12, y2 - startY - 4);
    const dy = springSpan / coils;

    ctx.moveTo(x1, startY);
    for (let i = 0; i < coils; i++) {
      const cy = startY + i * dy;
      const offset = i % 2 === 0 ? 5.5 : -5.5;
      ctx.lineTo(x1 + offset, cy + dy * 0.5);
    }
    ctx.lineTo(x2, startY + springSpan);
    ctx.stroke();

    // Bottom mounting eyelet
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(x2, y2, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Draw large realistic off-road wheel (~30% larger, radius: 26) with
   * continuous speed-synced rotation, 10 off-road knobby lugs,
   * deep-dish dark steel concave rim with silver lip, and tire squash!
   */
  private drawWheel(ctx: CanvasRenderingContext2D, wheel: VehiclePhysics['rearWheel']) {
    ctx.save();
    ctx.translate(wheel.x, wheel.y);

    // Dynamic tire squashing on ground contact / landing impact
    const squash = wheel.squashFactor || 1.0;
    ctx.scale(1 / squash, squash);

    // Fixed behind-the-wheel Brake Caliper & Vented Rotor
    ctx.save();
    // Vented steel rotor disc
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(0, 0, wheel.radius * 0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Red brake caliper fixed at top
    ctx.fillStyle = '#dc2626';
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-7, -wheel.radius * 0.68, 14, 9, 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Continuous Rotation of tire and rim matching ground speed
    ctx.rotate(wheel.spin);

    // Heavy-duty rubber tire
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, wheel.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 10 Aggressive Off-Road Knobby Tire Tread Lugs
    ctx.fillStyle = '#020617';
    const treads = 10;
    for (let i = 0; i < treads; i++) {
      const a = (i / treads) * Math.PI * 2;
      const cosA = Math.cos(a);
      const sinA = Math.sin(a);
      ctx.beginPath();
      ctx.arc(cosA * (wheel.radius - 1), sinA * (wheel.radius - 1), 3.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // White Sidewall Brand Accent Ring
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, wheel.radius * 0.82, 0, Math.PI * 2);
    ctx.stroke();

    // Deep-Dish Silver Outer Rim Lip
    const rimRadius = wheel.radius * 0.62;
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(0, 0, rimRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Concave Dark Steel Center Disc (Matching reference image)
    const innerRimGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, rimRadius - 2);
    innerRimGrad.addColorStop(0, '#0f172a');
    innerRimGrad.addColorStop(0.7, '#1e293b');
    innerRimGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = innerRimGrad;
    ctx.beginPath();
    ctx.arc(0, 0, rimRadius - 2, 0, Math.PI * 2);
    ctx.fill();

    // Off-Road Steel Wheel Window Cutouts (5 Machined Holes)
    ctx.fillStyle = '#090d16';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const holeX = Math.cos(a) * (rimRadius * 0.58);
      const holeY = Math.sin(a) * (rimRadius * 0.58);
      ctx.beginPath();
      ctx.arc(holeX, holeY, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Heavy-Duty Center Hub with 5 Silver Lug Nuts
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Silver Lug Nuts
    ctx.fillStyle = '#f8fafc';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 3.4, Math.sin(a) * 3.4, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawFloatingTexts() {
    const ctx = this.ctx;
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.translate(ft.x, ft.y);
      ctx.scale(ft.scale, ft.scale);
      ctx.globalAlpha = ft.alpha;
      ctx.font = '900 16px Outfit, sans-serif';
      ctx.textAlign = 'center';

      // Outline
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4;
      ctx.strokeText(ft.text, 0, 0);

      // Fill
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, 0, 0);
      ctx.restore();
    }
  }
}
