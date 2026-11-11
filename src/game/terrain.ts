import { BiomeType, Bridge, Collectible, RoadSign } from './types.ts';
import { GameLevel, GAME_LEVELS } from './levels.ts';

export class TerrainManager {
  private baseHeight: number = 420;
  private currentLevel: GameLevel = GAME_LEVELS[0];
  private seed: number = 42;
  private collectibles: Collectible[] = [];
  private bridges: Bridge[] = [];
  private signs: RoadSign[] = [];
  private lastGeneratedChunk: number = -1;
  private chunkSize: number = 800; // Generate chunks of 800px
  private finishLineX: number = 400 * 30; // targetDistance * 30

  constructor(level: GameLevel = GAME_LEVELS[0]) {
    this.setLevel(level);
  }

  public setLevel(level: GameLevel) {
    this.currentLevel = level;
    this.seed = level.id * 1337 + 42;
    this.finishLineX = level.targetDistance * 30;
    this.reset();
  }

  public getLevel(): GameLevel {
    return this.currentLevel;
  }

  public getFinishX(): number {
    return this.finishLineX;
  }

  public reset() {
    this.collectibles = [];
    this.bridges = [];
    this.signs = [];
    this.lastGeneratedChunk = -1;
    // Generate initial chunks up to 3000px ahead
    for (let c = 0; c <= 4; c++) {
      this.generateChunk(c);
    }
  }

  /**
   * Continuous procedural terrain height function.
   * Lower values of y are higher up on screen (standard Canvas coordinates).
   */
  public getY(x: number): number {
    // Starting platform is flat for the first 160 pixels
    if (x < 160) {
      return this.baseHeight;
    }

    // Smooth blend from flat start to rolling hills
    const startBlend = Math.min(1, Math.max(0, (x - 160) / 220));

    // Finish line platform: smooth level straightaway for victory crossing
    const finishX = this.finishLineX;
    if (x >= finishX - 140 && x <= finishX + 450) {
      const finishBlend = Math.min(1, Math.max(0, 1 - Math.abs(x - finishX) / 300));
      const naturalY = this.calculateRawTerrainY(x, startBlend);
      return naturalY * (1 - finishBlend * 0.85) + (this.baseHeight - 20) * (finishBlend * 0.85);
    }

    return this.calculateRawTerrainY(x, startBlend);
  }

  private calculateRawTerrainY(x: number, startBlend: number): number {
    const lvl = this.currentLevel;
    const amp = lvl.hillAmplitude;
    const freq = lvl.hillFrequency;

    // Harmonic sinusoids modulated by level parameters
    const p1 = Math.sin(x * freq + this.seed) * amp;
    const p2 = Math.cos(x * (freq * 2.6) + 1.2) * (amp * 0.55);
    const p3 = Math.sin(x * (freq * 6.2) + 2.5) * (amp * 0.28);
    const p4 = Math.cos(x * 0.018 + 0.8) * (amp * 0.1);

    // Roughness / Rocky washboard terrain (higher on levels 4, 8, 9, 10)
    let rockyNoise = 0;
    if (lvl.roughness > 0) {
      rockyNoise = Math.sin(x * 0.045) * (18 * lvl.roughness) + Math.cos(x * 0.09) * (8 * lvl.roughness);
    }

    // Feature modifier: ramps, steep gaps, and launch kickers
    const featureCycle = x % 1600;
    let featureHeight = 0;

    // Launch ramp followed by a canyon jump
    if (featureCycle > 650 && featureCycle < 920) {
      const rampProgress = (featureCycle - 650) / 270;
      // Launch ramp up
      featureHeight = -Math.sin(rampProgress * Math.PI) * (70 + lvl.id * 8);
    } else if (lvl.gapFrequency > 0 && featureCycle > 1150 && featureCycle < 1400) {
      // Deep gap / chasm
      const gapProgress = (featureCycle - 1150) / 250;
      featureHeight = Math.sin(gapProgress * Math.PI) * (85 * lvl.gapFrequency);
    }

    // Dynamic bridges check
    for (const b of this.bridges) {
      if (x >= b.startX && x <= b.endX) {
        const bridgeProgress = (x - b.startX) / (b.endX - b.startX);
        const plankIdx = Math.floor(bridgeProgress * (b.planks.length - 1));
        const plank = b.planks[Math.max(0, Math.min(b.planks.length - 1, plankIdx))];
        if (plank) {
          return plank.y;
        }
      }
    }

    const rawY = this.baseHeight + (p1 + p2 + p3 + p4 + rockyNoise + featureHeight) * startBlend;
    return rawY;
  }

  /**
   * Angle of the terrain surface at x in radians
   */
  public getAngle(x: number): number {
    const delta = 2.0;
    const y1 = this.getY(x - delta);
    const y2 = this.getY(x + delta);
    return Math.atan2(y2 - y1, delta * 2);
  }

  /**
   * Normal vector (nx, ny) pointing outward from terrain
   */
  public getNormal(x: number): { nx: number; ny: number } {
    const angle = this.getAngle(x);
    return {
      nx: -Math.sin(angle),
      ny: Math.cos(angle),
    };
  }

  /**
   * Get current biome based on active level
   */
  public getBiome(_x: number): BiomeType {
    return this.currentLevel.biome;
  }

  /**
   * Procedural chunk generation as the player drives forward
   */
  public update(playerX: number) {
    const currentChunk = Math.floor(playerX / this.chunkSize);
    while (this.lastGeneratedChunk < currentChunk + 4) {
      this.generateChunk(this.lastGeneratedChunk + 1);
    }

    this.updateBridges();
  }

  private generateChunk(chunkIdx: number) {
    this.lastGeneratedChunk = chunkIdx;
    const startX = chunkIdx * this.chunkSize;
    const endX = startX + this.chunkSize;

    // Do not generate items before starting gate
    if (startX < 220) return;

    // Check if Finish Line falls within this chunk
    if (this.finishLineX >= startX && this.finishLineX < endX) {
      if (!this.signs.some((s) => s.isFinish)) {
        this.signs.push({
          x: this.finishLineX,
          distance: this.currentLevel.targetDistance,
          isFinish: true,
        });
      }
    }

    // Add milestone road signs every 100 meters (every 3000px)
    for (let x = startX; x < endX; x += 100) {
      if (Math.floor(x) % 3000 < 100 && Math.abs(x - this.finishLineX) > 400) {
        const distMeters = Math.round(x / 30);
        if (!this.signs.some((s) => Math.abs(s.x - x) < 200)) {
          this.signs.push({ x, distance: distMeters });
        }
      }
    }

    // Suspension bridge across dips (Levels 2, 5, 7, 10 have exciting bridges)
    if (chunkIdx > 1 && (chunkIdx % 4 === 0 || this.currentLevel.gapFrequency > 0.3)) {
      const bridgeStart = startX + 160;
      const bridgeEnd = bridgeStart + 380;
      // Do not place bridge right over the finish line
      if (Math.abs(bridgeStart - this.finishLineX) > 500) {
        const planksCount = 19;
        const planks: Bridge['planks'] = [];
        for (let i = 0; i <= planksCount; i++) {
          const px = bridgeStart + (i / planksCount) * (bridgeEnd - bridgeStart);
          const sag = Math.sin((i / planksCount) * Math.PI) * 24;
          const baseY = this.baseHeight + 55 + sag;
          planks.push({
            x: px,
            y: baseY,
            vy: 0,
            targetY: baseY,
          });
        }
        this.bridges.push({
          startX: bridgeStart,
          endX: bridgeEnd,
          planks,
        });
      }
    }

    // Generate silver Optimum coins in smooth arcs along hills and jumps!
    // Large, eye-catching clusters
    let coinClusterX = startX + 110;
    while (coinClusterX < endX - 110) {
      // Don't spawn past finish line
      if (coinClusterX > this.finishLineX + 200) break;

      const isHillCrest = Math.sin(coinClusterX * this.currentLevel.hillFrequency) > 0.18;
      if (isHillCrest) {
        const count = 5;
        const spacing = 46; // Generous spacing for 50% larger coins
        for (let i = 0; i < count; i++) {
          const cx = coinClusterX + i * spacing;
          const arc = Math.sin((i / (count - 1)) * Math.PI) * 34;
          const groundY = this.getY(cx);
          const cy = groundY - 55 - arc;
          this.collectibles.push({
            id: cx * 1000 + i,
            x: cx,
            y: cy,
            type: 'coin',
            value: 25,
            collected: false,
            animOffset: Math.random() * Math.PI * 2,
          });
        }
        coinClusterX += count * spacing + 190;
      } else {
        coinClusterX += 170;
      }
    }

    // Fuel Cans: generated roughly every ~90m to ~120m (every 2700-3600px)
    // Always supply strategic fuel before the finish line
    if (chunkIdx > 0 && chunkIdx % 3 === 2 && startX < this.finishLineX - 300) {
      const fuelX = startX + 380;
      const groundY = this.getY(fuelX);
      this.collectibles.push({
        id: fuelX * 1000,
        x: fuelX,
        y: groundY - 40,
        type: 'fuel',
        value: 100, // Refills tank
        collected: false,
        animOffset: 0,
      });
    }
  }

  private updateBridges() {
    for (const b of this.bridges) {
      for (let i = 1; i < b.planks.length - 1; i++) {
        const p = b.planks[i];
        const prev = b.planks[i - 1];
        const next = b.planks[i + 1];

        const springForce = (p.targetY - p.y) * 0.15;
        const neighborTension = ((prev.y + next.y) / 2 - p.y) * 0.25;

        p.vy += (springForce + neighborTension);
        p.vy *= 0.82;
        p.y += p.vy;
      }
    }
  }

  public depressBridge(x: number, weight: number) {
    for (const b of this.bridges) {
      if (x >= b.startX && x <= b.endX) {
        for (const p of b.planks) {
          const dist = Math.abs(p.x - x);
          if (dist < 40) {
            const factor = 1 - dist / 40;
            p.vy += weight * factor * 0.8;
          }
        }
      }
    }
  }

  public getCollectibles(): Collectible[] {
    return this.collectibles;
  }

  public getRoadSigns(): RoadSign[] {
    return this.signs;
  }

  public getBridges(): Bridge[] {
    return this.bridges;
  }
}
