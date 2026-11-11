import * as THREE from 'three';
import { GameLevel } from '../levels.ts';
import { GameMaterials3D } from './materials.ts';

export interface Obstacle3D {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  radius: number;
}

export class Track3D {
  public group: THREE.Group = new THREE.Group();
  public roadMesh: THREE.Mesh | null = null;
  public terrainMesh: THREE.Mesh | null = null;
  public obstacles: Obstacle3D[] = [];
  public finishMesh: THREE.Group = new THREE.Group();

  public trackLength: number = 400; // in meters
  public roadWidth: number = 7.5;
  private curvePoints: THREE.Vector3[] = [];
  private curve: THREE.CatmullRomCurve3 | null = null;

  constructor(level: GameLevel) {
    this.buildTrack(level);
  }

  public buildTrack(level: GameLevel) {
    // Clear old elements
    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
    }
    this.obstacles = [];
    this.curvePoints = [];

    this.trackLength = level.targetDistance;
    const segmentCount = Math.max(30, Math.floor(this.trackLength / 12));
    const step = this.trackLength / segmentCount;

    // 1. Generate 3D Spline Path with hills, curves, and ramps
    const seed = level.id * 1337 + 42;
    for (let i = 0; i <= segmentCount; i++) {
      const z = i * step;

      // Starting flat run
      let x = 0;
      let y = 0;

      if (z > 25 && z < this.trackLength - 30) {
        // Lateral S-curves (winding road)
        const turnFreq = level.hillFrequency * 18;
        x = Math.sin(z * turnFreq + seed) * (12 + level.id * 1.8);

        // Rolling vertical hills & launch ramps
        const hillFreq = level.hillFrequency * 12;
        y = Math.sin(z * hillFreq + seed) * (level.hillAmplitude * 0.08)
          + Math.cos(z * (hillFreq * 2.1) + 1.2) * (level.hillAmplitude * 0.04);

        // Feature kickers / jump ramps
        const rampCycle = z % 220;
        if (rampCycle > 140 && rampCycle < 185) {
          const prog = (rampCycle - 140) / 45;
          y += Math.sin(prog * Math.PI) * (4 + level.id * 0.6); // Launch kicker
        }
      }

      this.curvePoints.push(new THREE.Vector3(x, y, z));
    }

    this.curve = new THREE.CatmullRomCurve3(this.curvePoints);

    // 2. Generate Road Ribbon Geometry
    const samples = segmentCount * 6;
    const roadGeo = new THREE.BufferGeometry();
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const halfW = this.roadWidth / 2;

    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const pt = this.curve.getPointAt(t);
      const tangent = this.curve.getTangentAt(t).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const side = new THREE.Vector3().crossVectors(tangent, up).normalize();

      // Left vertex
      const leftPt = new THREE.Vector3().copy(pt).addScaledVector(side, -halfW);
      positions.push(leftPt.x, leftPt.y + 0.02, leftPt.z);
      uvs.push(0, t * (this.trackLength / 8));

      // Right vertex
      const rightPt = new THREE.Vector3().copy(pt).addScaledVector(side, halfW);
      positions.push(rightPt.x, rightPt.y + 0.02, rightPt.z);
      uvs.push(1, t * (this.trackLength / 8));

      if (i < samples) {
        const v1 = i * 2;
        const v2 = i * 2 + 1;
        const v3 = (i + 1) * 2;
        const v4 = (i + 1) * 2 + 1;

        indices.push(v1, v2, v3);
        indices.push(v2, v4, v3);
      }
    }

    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    roadGeo.setIndex(indices);
    roadGeo.computeVertexNormals();

    this.roadMesh = new THREE.Mesh(roadGeo, GameMaterials3D.road);
    this.roadMesh.receiveShadow = true;
    this.group.add(this.roadMesh);

    // 3. Ground Terrain Mesh (Surrounding hills & banks)
    this.createSurroundingTerrain(level);

    // 4. Obstacles along the road (rocks and barricades)
    this.createObstacles(level);

    // 5. Checkered Finish Line Arch at track end!
    this.createFinishArch();
  }

  private createSurroundingTerrain(level: GameLevel) {
    const terrainGeo = new THREE.PlaneGeometry(240, this.trackLength + 120, 60, 60);
    terrainGeo.rotateX(-Math.PI / 2);
    terrainGeo.translate(0, -0.2, this.trackLength / 2);

    // Color based on biome
    let groundColor = 0x22c55e;
    if (level.biome === 'desert') groundColor = 0xd97706;
    else if (level.biome === 'snow') groundColor = 0xf1f5f9;
    else if (level.biome === 'canyon') groundColor = 0xbe123c;

    const terrainMat = new THREE.MeshStandardMaterial({
      color: groundColor,
      roughness: 0.88,
      metalness: 0.05,
    });

    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const distFromCenter = Math.abs(x);

      // Elevated natural side banks and rolling mountains
      if (distFromCenter > this.roadWidth * 0.8) {
        const bankRise = Math.pow((distFromCenter - this.roadWidth * 0.8) / 30, 1.4) * 12;
        const hillWave = Math.sin(x * 0.08) * Math.cos(z * 0.04) * 8;
        pos.setY(i, bankRise + hillWave);
      }
    }
    terrainGeo.computeVertexNormals();

    this.terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    this.terrainMesh.receiveShadow = true;
    this.group.add(this.terrainMesh);
  }

  private createObstacles(level: GameLevel) {
    if (level.id === 1) return; // Level 1 is obstacle-free for easy cruising

    const obstacleCount = Math.min(22, Math.floor(level.id * 2.2));
    const step = this.trackLength / (obstacleCount + 1);

    for (let i = 1; i <= obstacleCount; i++) {
      const z = i * step + (Math.random() * 8 - 4);
      if (z < 35 || z > this.trackLength - 25) continue;

      const pt = this.getPointAtDistance(z);
      const tangent = this.getTangentAtDistance(z);
      const up = new THREE.Vector3(0, 1, 0);
      const side = new THREE.Vector3().crossVectors(tangent, up).normalize();

      // Placed on left or right side of lane, leaving room to steer around
      const sideOffset = (i % 2 === 0 ? -1 : 1) * (1.8 + Math.random() * 0.9);
      const pos = new THREE.Vector3().copy(pt).addScaledVector(side, sideOffset);

      // Procedural rocky boulder obstacle
      const rockGeo = new THREE.DodecahedronGeometry(0.7 + Math.random() * 0.35, 1);
      const rockMat = new THREE.MeshStandardMaterial({
        color: level.biome === 'snow' ? 0x94a3b8 : 0x78350f,
        roughness: 0.9,
      });
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.copy(pos);
      rock.position.y += 0.45;
      rock.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      rock.castShadow = true;
      rock.receiveShadow = true;

      this.group.add(rock);
      this.obstacles.push({
        mesh: rock,
        position: pos,
        radius: 0.9,
      });
    }
  }

  private createFinishArch() {
    this.finishMesh = new THREE.Group();

    const finishPt = this.getPointAtDistance(this.trackLength);
    const tangent = this.getTangentAtDistance(this.trackLength);
    const up = new THREE.Vector3(0, 1, 0);
    const side = new THREE.Vector3().crossVectors(tangent, up).normalize();

    this.finishMesh.position.copy(finishPt);
    this.finishMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

    const archW = this.roadWidth + 1.4;
    const archH = 5.2;

    // Left and Right Steel Truss Towers
    const towerGeo = new THREE.CylinderGeometry(0.18, 0.22, archH, 8);
    const towerMat = GameMaterials3D.rollCage;

    const towerL = new THREE.Mesh(towerGeo, towerMat);
    towerL.position.set(-archW / 2, archH / 2, 0);
    towerL.castShadow = true;
    this.finishMesh.add(towerL);

    const towerR = new THREE.Mesh(towerGeo, towerMat);
    towerR.position.set(archW / 2, archH / 2, 0);
    towerR.castShadow = true;
    this.finishMesh.add(towerR);

    // Overhead Checkered Banner Board
    const bannerGeo = new THREE.BoxGeometry(archW, 1.4, 0.2);
    const banner = new THREE.Mesh(bannerGeo, GameMaterials3D.checkeredBanner);
    banner.position.set(0, archH - 0.2, 0);
    this.finishMesh.add(banner);

    // Glowing "FINISH" Sign Plaque
    const signGeo = new THREE.BoxGeometry(archW * 0.65, 0.7, 0.24);
    const signMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.6,
      roughness: 0.3,
    });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, archH - 0.2, 0.05);
    this.finishMesh.add(sign);

    // Waving Flags on Top of Towers
    const flagGeo = new THREE.PlaneGeometry(1.2, 0.7);
    const flagMat = GameMaterials3D.checkeredBanner;

    const flagL = new THREE.Mesh(flagGeo, flagMat);
    flagL.position.set(-archW / 2 - 0.6, archH + 0.35, 0);
    this.finishMesh.add(flagL);

    const flagR = new THREE.Mesh(flagGeo, flagMat);
    flagR.position.set(archW / 2 + 0.6, archH + 0.35, 0);
    this.finishMesh.add(flagR);

    this.group.add(this.finishMesh);
  }

  public getPointAtDistance(distanceMeters: number): THREE.Vector3 {
    if (!this.curve) return new THREE.Vector3(0, 0, distanceMeters);
    const t = Math.max(0, Math.min(1, distanceMeters / this.trackLength));
    return this.curve.getPointAt(t);
  }

  public getTangentAtDistance(distanceMeters: number): THREE.Vector3 {
    if (!this.curve) return new THREE.Vector3(0, 0, 1);
    const t = Math.max(0, Math.min(1, distanceMeters / this.trackLength));
    return this.curve.getTangentAt(t).normalize();
  }
}
