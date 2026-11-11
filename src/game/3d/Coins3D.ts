import * as THREE from 'three';
import { GameMaterials3D } from './materials.ts';
import { Track3D } from './Track3D.ts';

export interface CoinInstance3D {
  group: THREE.Group;
  position: THREE.Vector3;
  baseY: number;
  collected: boolean;
  animOffset: number;
}

export interface FuelCanInstance3D {
  group: THREE.Group;
  position: THREE.Vector3;
  baseY: number;
  collected: boolean;
  animOffset: number;
}

export interface SparkleParticle3D {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
}

export class CoinsManager3D {
  public group: THREE.Group = new THREE.Group();
  public coins: CoinInstance3D[] = [];
  public fuelCans: FuelCanInstance3D[] = [];
  public sparkles: SparkleParticle3D[] = [];

  private coinSharedGeo: THREE.BufferGeometry;
  private fuelCanGeo: THREE.BufferGeometry;

  constructor() {
    this.coinSharedGeo = this.createInfinityGeometry();
    this.fuelCanGeo = new THREE.BoxGeometry(0.55, 0.75, 0.35);
  }

  /**
   * Procedural 3D Silver Infinity Mesh Geometry
   * Smooth double-loop infinity symbol matching the uploaded reference logo
   */
  private createInfinityGeometry(): THREE.BufferGeometry {
    // 3D Extruded infinity curve shape
    const shape = new THREE.Shape();
    const r = 0.35;
    const loopSpacing = 0.42;

    // Outer figure-8 infinity profile
    shape.moveTo(-loopSpacing, -r);
    shape.bezierCurveTo(-loopSpacing - r * 1.3, -r, -loopSpacing - r * 1.3, r, -loopSpacing, r);
    shape.bezierCurveTo(0, r, 0, -r, loopSpacing, -r);
    shape.bezierCurveTo(loopSpacing + r * 1.3, -r, loopSpacing + r * 1.3, r, loopSpacing, r);
    shape.bezierCurveTo(0, r, 0, -r, -loopSpacing, -r);

    // Inner holes for true infinity ring
    const holeL = new THREE.Path();
    holeL.absellipse(-loopSpacing, 0, r * 0.48, r * 0.48, 0, Math.PI * 2, true, 0);
    shape.holes.push(holeL);

    const holeR = new THREE.Path();
    holeR.absellipse(loopSpacing, 0, r * 0.48, r * 0.48, 0, Math.PI * 2, true, 0);
    shape.holes.push(holeR);

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.12,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.04,
      bevelThickness: 0.04,
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();
    return geo;
  }

  public populateAlongTrack(track: Track3D) {
    // Clear old coins, fuel cans and sparkles
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
    this.coins = [];
    this.fuelCans = [];
    this.sparkles = [];

    const totalLength = track.trackLength;

    // 1. Spawn clusters of silver infinity coins every ~18 to ~25 meters
    for (let dist = 25; dist < totalLength - 20; dist += 18) {
      const clusterCount = 3 + Math.floor(Math.random() * 2);
      const laneOffset = (Math.random() - 0.5) * 3.2;

      for (let c = 0; c < clusterCount; c++) {
        const coinDist = dist + c * 2.8;
        if (coinDist >= totalLength - 15) break;

        const pt = track.getPointAtDistance(coinDist);
        const tangent = track.getTangentAtDistance(coinDist);
        const up = new THREE.Vector3(0, 1, 0);
        const side = new THREE.Vector3().crossVectors(tangent, up).normalize();

        const spawnPos = new THREE.Vector3().copy(pt).addScaledVector(side, laneOffset);
        spawnPos.y += 0.85;

        const coinGroup = new THREE.Group();
        coinGroup.position.copy(spawnPos);

        const coinMesh = new THREE.Mesh(this.coinSharedGeo, GameMaterials3D.silverCoin);
        coinMesh.castShadow = true;
        coinGroup.add(coinMesh);

        // Radiant halo glow
        const glowGeo = new THREE.SphereGeometry(0.5, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.22,
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        coinGroup.add(glow);

        this.group.add(coinGroup);

        this.coins.push({
          group: coinGroup,
          position: spawnPos,
          baseY: spawnPos.y,
          collected: false,
          animOffset: Math.random() * Math.PI * 2,
        });
      }
    }

    // 2. Spawn Red Fuel Canisters every ~65 to ~85 meters
    for (let dist = 55; dist < totalLength - 30; dist += 72) {
      const laneOffset = (Math.random() > 0.5 ? 1 : -1) * 1.5;
      const pt = track.getPointAtDistance(dist);
      const tangent = track.getTangentAtDistance(dist);
      const up = new THREE.Vector3(0, 1, 0);
      const side = new THREE.Vector3().crossVectors(tangent, up).normalize();

      const spawnPos = new THREE.Vector3().copy(pt).addScaledVector(side, laneOffset);
      spawnPos.y += 0.9;

      const fuelGroup = new THREE.Group();
      fuelGroup.position.copy(spawnPos);

      // Red Jerrycan body
      const bodyMesh = new THREE.Mesh(this.fuelCanGeo, GameMaterials3D.fuelCan);
      bodyMesh.castShadow = true;
      fuelGroup.add(bodyMesh);

      // Yellow fuel cap
      const capGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.15, 8);
      const capMesh = new THREE.Mesh(capGeo, GameMaterials3D.fuelCap);
      capMesh.position.set(0.15, 0.42, 0);
      fuelGroup.add(capMesh);

      // Top handle bar
      const handleGeo = new THREE.BoxGeometry(0.35, 0.08, 0.12);
      const handleMesh = new THREE.Mesh(handleGeo, GameMaterials3D.fuelCan);
      handleMesh.position.set(-0.06, 0.44, 0);
      fuelGroup.add(handleMesh);

      // Glow beacon
      const glowGeo = new THREE.SphereGeometry(0.65, 8, 8);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        transparent: true,
        opacity: 0.25,
      });
      fuelGroup.add(new THREE.Mesh(glowGeo, glowMat));

      this.group.add(fuelGroup);

      this.fuelCans.push({
        group: fuelGroup,
        position: spawnPos,
        baseY: spawnPos.y,
        collected: false,
        animOffset: Math.random() * Math.PI * 2,
      });
    }
  }

  /**
   * Check physical collisions with car in 3D space
   */
  public update(
    dt: number,
    carPosition: THREE.Vector3,
    onCoinCollected: (pos: THREE.Vector3) => void,
    onFuelCollected?: (pos: THREE.Vector3) => void
  ) {
    const time = performance.now() * 0.003;

    // 1. Animate and check active coins
    for (const coin of this.coins) {
      if (coin.collected) continue;

      // 3D smooth rotation and gentle floating bob
      coin.group.rotation.y += dt * 3.2;
      coin.group.position.y = coin.baseY + Math.sin(time + coin.animOffset) * 0.12;

      // Physical distance check to car (bounding sphere ~2.1m)
      const dist = carPosition.distanceTo(coin.group.position);
      if (dist < 2.1) {
        coin.collected = true;
        this.group.remove(coin.group);

        // Spawn silver sparkle particles explosion!
        this.spawnSparkleEffect(coin.group.position, false);

        // Increment coin count and play chime
        onCoinCollected(coin.group.position);
      }
    }

    // 2. Animate and check active fuel cans
    for (const fuel of this.fuelCans) {
      if (fuel.collected) continue;

      fuel.group.rotation.y += dt * 2.2;
      fuel.group.position.y = fuel.baseY + Math.sin(time * 1.2 + fuel.animOffset) * 0.1;

      const dist = carPosition.distanceTo(fuel.group.position);
      if (dist < 2.3) {
        fuel.collected = true;
        this.group.remove(fuel.group);

        // Spawn red/yellow fuel splash particles
        this.spawnSparkleEffect(fuel.group.position, true);

        if (onFuelCollected) {
          onFuelCollected(fuel.group.position);
        }
      }
    }

    // 3. Animate sparkle collection particles
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const sp = this.sparkles[i];
      sp.lifetime += dt;

      sp.mesh.position.addScaledVector(sp.velocity, dt);
      sp.velocity.y -= dt * 6; // Gravity on sparkles
      sp.mesh.rotation.x += dt * 5;
      sp.mesh.rotation.y += dt * 6;

      const progress = sp.lifetime / sp.maxLifetime;
      const scale = Math.max(0, 1.0 - progress);
      sp.mesh.scale.setScalar(scale);

      if (sp.lifetime >= sp.maxLifetime) {
        this.group.remove(sp.mesh);
        this.sparkles.splice(i, 1);
      }
    }
  }

  private spawnSparkleEffect(pos: THREE.Vector3, isFuel: boolean = false) {
    const sparkleColors = isFuel
      ? [0xef4444, 0xf59e0b, 0xfacc15, 0xffffff]
      : [0xffffff, 0xf8fafc, 0x38bdf8, 0xfde047];
    const count = isFuel ? 20 : 16;

    for (let i = 0; i < count; i++) {
      const geo = new THREE.DodecahedronGeometry(0.08 + Math.random() * 0.06, 0);
      const mat = new THREE.MeshBasicMaterial({
        color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
        transparent: true,
        opacity: 0.95,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);

      const angle = (i / count) * Math.PI * 2;
      const speed = 2.5 + Math.random() * 4.5;
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        2.5 + Math.random() * 4.0,
        Math.sin(angle) * speed
      );

      this.group.add(mesh);
      this.sparkles.push({
        mesh,
        velocity: vel,
        lifetime: 0,
        maxLifetime: 0.65 + Math.random() * 0.35,
      });
    }
  }
}
