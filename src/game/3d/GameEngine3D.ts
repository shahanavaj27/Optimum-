import * as THREE from 'three';
import { GameLevel } from '../levels.ts';
import { ControlsState, VehicleUpgrades } from '../types.ts';
import { sound } from '../audio.ts';
import { Jeep3D } from './Jeep3D.ts';
import { Track3D } from './Track3D.ts';
import { CoinsManager3D } from './Coins3D.ts';

export class GameEngine3D {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  public jeep: Jeep3D;
  public track: Track3D;
  public coins: CoinsManager3D;

  // Car Physics State
  public trackDistance: number = 0; // Distance along track in meters
  public laneOffset: number = 0;    // Lateral offset across road (-halfW to +halfW)
  public speed: number = 0;         // Forward speed in m/s
  public verticalY: number = 0;     // Current altitude
  public verticalVy: number = 0;    // Vertical air velocity
  public isAirborne: boolean = false;
  public airPitch: number = 0;
  public airRoll: number = 0;

  // Game Status
  public isCrashed: boolean = false;
  public isCompleted: boolean = false;
  public screenShake: number = 0;

  // Fuel System
  public fuel: number = 100;
  public maxFuel: number = 100;

  // Callbacks
  public onCoinCollect?: () => void;
  public onFuelCollect?: () => void;
  public onLevelComplete?: () => void;
  public onGameOver?: (reason: 'CRASH' | 'FELL' | 'OUT_OF_FUEL') => void;

  private activeLevel: GameLevel;
  private upgrades: VehicleUpgrades;

  // Sun & lights
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;

  constructor(canvas: HTMLCanvasElement, level: GameLevel, upgrades: VehicleUpgrades) {
    this.activeLevel = level;
    this.upgrades = upgrades;

    // 1. Initialize Three.js Scene & Renderer
    this.scene = new THREE.Scene();

    const aspect = canvas.clientWidth / canvas.clientHeight || 1;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 1000);

    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 2. Lighting Rig
    this.hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x451a03, 1.2);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfffbeb, 2.2);
    this.dirLight.position.set(40, 80, 50);
    this.dirLight.castShadow = !isSoftwareGl;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 180;
    const d = 35;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.scene.add(this.dirLight);

    // 3. Track, Coins & Jeep Model
    this.track = new Track3D(level);
    this.scene.add(this.track.group);

    this.coins = new CoinsManager3D();
    this.coins.populateAlongTrack(this.track);
    this.scene.add(this.coins.group);

    this.jeep = new Jeep3D();
    this.scene.add(this.jeep.group);

    this.applyBiomeAtmosphere(level);
    this.resetVehicle();
  }

  public resize(width: number, height: number) {
    if (width === 0 || height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  public setLevel(level: GameLevel, upgrades: VehicleUpgrades) {
    this.activeLevel = level;
    this.upgrades = upgrades;

    this.track.buildTrack(level);
    this.coins.populateAlongTrack(this.track);
    this.applyBiomeAtmosphere(level);
    this.resetVehicle();
  }

  public resetVehicle() {
    this.trackDistance = 4;
    this.laneOffset = 0;
    this.speed = 0;
    this.verticalVy = 0;
    this.isAirborne = false;
    this.airPitch = 0;
    this.airRoll = 0;
    this.isCrashed = false;
    this.isCompleted = false;
    this.screenShake = 0;

    this.maxFuel = 100 + (this.upgrades.fuelTank || 0) * 25;
    this.fuel = this.maxFuel;

    const startPt = this.track.getPointAtDistance(this.trackDistance);
    this.verticalY = startPt.y;

    this.updateCarTransform(0);
    this.snapCamera();
  }

  private applyBiomeAtmosphere(level: GameLevel) {
    let skyColor = 0x38bdf8;
    let fogColor = 0xbae6fd;

    if (level.biome === 'desert') {
      skyColor = 0xf97316;
      fogColor = 0xfef08a;
    } else if (level.biome === 'snow') {
      skyColor = 0x64748b;
      fogColor = 0xe2e8f0;
    } else if (level.biome === 'canyon') {
      skyColor = 0x881337;
      fogColor = 0xf43f5e;
    }

    this.scene.background = new THREE.Color(skyColor);
    this.scene.fog = new THREE.FogExp2(fogColor, 0.007);
  }

  /**
   * Main 3D Physics and Animation Tick
   */
  public update(dt: number, controls: ControlsState) {
    if (this.isCrashed) {
      // Vehicle skidding to halt on crash
      this.speed *= 0.94;
      this.updateCarTransform(0);
      this.updateCamera(dt);
      return;
    }

    // 1. Acceleration, Braking, and Engine Stats
    const engineBonus = 1.0 + this.upgrades.engine * 0.18;
    const maxSpeed = (24 + this.activeLevel.id * 1.5) * engineBonus;
    const accelPower = (18 + this.upgrades.engine * 3.5);
    const brakePower = 28;

    if (!this.isCompleted) {
      if (controls.gas) {
        this.speed = Math.min(maxSpeed, this.speed + accelPower * dt);
      } else if (controls.brake) {
        this.speed = Math.max(-10, this.speed - brakePower * dt);
      } else {
        // Natural rolling friction
        this.speed *= Math.pow(0.97, dt * 60);
        if (Math.abs(this.speed) < 0.1) this.speed = 0;
      }
    } else {
      // Level completed - gentle deceleration
      this.speed *= Math.pow(0.95, dt * 60);
    }

    // 2. Smooth Left / Right Steering
    let targetSteer = 0;
    if (controls.steerLeft) targetSteer -= 1;
    if (controls.steerRight) targetSteer += 1;

    const steerSens = 7.2 * (1.0 + this.upgrades.tires * 0.15);
    const speedFactor = Math.min(1.0, Math.abs(this.speed) / 6);
    this.laneOffset += targetSteer * steerSens * speedFactor * dt;

    // Clamp lane offset to road width plus gravel shoulders
    const roadHalf = this.track.roadWidth / 2 + 1.2;
    this.laneOffset = Math.max(-roadHalf - 1.5, Math.min(roadHalf + 1.5, this.laneOffset));

    // Off-road gravel resistance
    if (Math.abs(this.laneOffset) > this.track.roadWidth / 2) {
      this.speed *= Math.pow(0.96, dt * 60);
    }

    // 3. Advance along the 3D Track Spline
    this.trackDistance += this.speed * dt;
    this.trackDistance = Math.max(0, this.trackDistance);

    // 4. Vertical Terrain & Jump Physics
    const roadPt = this.track.getPointAtDistance(this.trackDistance);
    const roadY = roadPt.y;

    if (this.isAirborne) {
      this.verticalVy -= 22 * dt; // Gravity
      this.verticalY += this.verticalVy * dt;

      // Air pitch tilts forward/backward with momentum
      this.airPitch = THREE.MathUtils.damp(this.airPitch, -this.verticalVy * 0.03, 5, dt);

      // Check landing
      if (this.verticalY <= roadY) {
        this.verticalY = roadY;
        const landingSpeed = Math.abs(this.verticalVy);
        this.verticalVy = 0;
        this.isAirborne = false;
        this.airPitch = 0;

        sound.playLand(landingSpeed * 0.2);
        if (landingSpeed > 14) {
          this.screenShake = 6;
        }
      }
    } else {
      // Riding on the road
      const prevRoadY = this.verticalY;
      const roadRiseRate = (roadY - prevRoadY) / Math.max(0.001, dt);

      // Launch off kickers/ramps when driving fast!
      if (roadRiseRate < -8 && this.speed > 14) {
        this.isAirborne = true;
        this.verticalVy = Math.max(4, Math.abs(roadRiseRate) * 0.4);
      } else {
        this.verticalY = roadY;
      }
    }

    // 5. Update Car 3D Transform & Wheel/Muscat Animations
    this.updateCarTransform(targetSteer * 0.35);
    this.jeep.update(dt, this.speed, targetSteer * 0.35, this.isAirborne);

    // Fuel consumption while driving
    if (this.fuel > 0 && !this.isCompleted) {
      const fuelRate = controls.gas ? 3.6 : 0.35;
      this.fuel = Math.max(0, this.fuel - fuelRate * dt);
      if (this.fuel <= 0) {
        this.triggerCrash('OUT_OF_FUEL');
      }
    }

    // 6. Silver Infinity Coin Collections & Red Fuel Cans
    this.coins.update(
      dt,
      this.jeep.group.position,
      (_coinPos) => {
        sound.playCoin();
        if (this.onCoinCollect) this.onCoinCollect();
      },
      (_fuelPos) => {
        sound.playFuel();
        this.fuel = Math.min(this.maxFuel, this.fuel + 60);
        if (this.onFuelCollect) this.onFuelCollect();
      }
    );

    // 7. Obstacle Collisions
    for (const obs of this.track.obstacles) {
      const distToObs = this.jeep.group.position.distanceTo(obs.position);
      if (distToObs < obs.radius + 1.2) {
        // Crash impact with boulder!
        this.triggerCrash('CRASH');
        break;
      }
    }

    // 8. Dangerous Fall Off Edge (Chasm death)
    if (Math.abs(this.laneOffset) > roadHalf + 1.2 && !this.isCrashed) {
      this.triggerCrash('FELL');
    }

    // 9. Checkered Finish Line Crossing!
    if (this.trackDistance >= this.track.trackLength && !this.isCompleted && !this.isCrashed) {
      this.isCompleted = true;
      sound.playLevelComplete();
      if (this.onLevelComplete) {
        this.onLevelComplete();
      }
    }

    // 10. Engine Audio Pitch
    const speedRatio = Math.min(1.0, Math.abs(this.speed) / maxSpeed);
    sound.updateEngine(speedRatio, controls.gas, this.isAirborne);

    // 11. Third-Person Dynamic Camera Follow
    this.updateCamera(dt);
  }

  private triggerCrash(reason: 'CRASH' | 'FELL' | 'OUT_OF_FUEL') {
    if (this.isCrashed) return;
    this.isCrashed = true;
    this.screenShake = reason === 'OUT_OF_FUEL' ? 0 : 16;
    sound.stopEngine();
    if (reason !== 'OUT_OF_FUEL') {
      sound.playCrash();
    }

    if (this.onGameOver) {
      this.onGameOver(reason);
    }
  }

  private updateCarTransform(steerVisualAngle: number) {
    const pt = this.track.getPointAtDistance(this.trackDistance);
    const tangent = this.track.getTangentAtDistance(this.trackDistance);
    const up = new THREE.Vector3(0, 1, 0);
    const side = new THREE.Vector3().crossVectors(tangent, up).normalize();

    // World position: on road spline + lane offset + air altitude
    const carPos = new THREE.Vector3().copy(pt).addScaledVector(side, this.laneOffset);
    carPos.y = this.verticalY;
    this.jeep.group.position.copy(carPos);

    // Alignment rotation matching road tangent
    const rotMatrix = new THREE.Matrix4().lookAt(
      new THREE.Vector3(0, 0, 0),
      tangent,
      up
    );
    this.jeep.group.quaternion.setFromRotationMatrix(rotMatrix);

    // Body roll during fast turns (body leans into or against turns)
    const rollAngle = -this.speed * steerVisualAngle * 0.015;
    this.jeep.group.rotateZ(rollAngle);

    // Air pitch during jumps
    if (this.isAirborne) {
      this.jeep.group.rotateX(this.airPitch);
    }

    // Move directional light to follow car for dynamic shadow coverage
    this.dirLight.position.set(carPos.x + 35, carPos.y + 70, carPos.z + 40);
    this.dirLight.target.position.copy(carPos);
    this.dirLight.target.updateMatrixWorld();
  }

  /**
   * Third-Person Camera Smooth Follow:
   * Positioned behind and slightly above the jeep looking forward past Muscat toward the road!
   */
  private updateCamera(dt: number) {
    const carPos = this.jeep.group.position;
    const tangent = this.track.getTangentAtDistance(this.trackDistance);

    // Camera offset behind and above car
    const camDistance = 7.2;
    const camHeight = 3.2;

    const idealCamPos = new THREE.Vector3()
      .copy(carPos)
      .addScaledVector(tangent, -camDistance)
      .add(new THREE.Vector3(0, camHeight, 0));

    // Screen shake on crashes and rough landings
    if (this.screenShake > 0) {
      idealCamPos.x += (Math.random() * 2 - 1) * (this.screenShake * 0.08);
      idealCamPos.y += (Math.random() * 2 - 1) * (this.screenShake * 0.08);
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    // Smooth camera lag damping
    this.camera.position.lerp(idealCamPos, Math.min(1.0, dt * 8.5));

    // Look ahead past Muscat's hood down the road
    const lookAtTarget = new THREE.Vector3()
      .copy(carPos)
      .addScaledVector(tangent, 12)
      .add(new THREE.Vector3(0, 1.2, 0));

    this.camera.lookAt(lookAtTarget);

    // Dynamic high-speed FOV rush
    const speedRatio = Math.min(1.0, Math.abs(this.speed) / 32);
    this.camera.fov = 65 + speedRatio * 12;
    this.camera.updateProjectionMatrix();

    // Render frame
    this.renderer.render(this.scene, this.camera);
  }

  private snapCamera() {
    const carPos = this.jeep.group.position;
    const tangent = this.track.getTangentAtDistance(this.trackDistance);
    this.camera.position
      .copy(carPos)
      .addScaledVector(tangent, -7.2)
      .add(new THREE.Vector3(0, 3.2, 0));
    this.camera.lookAt(new THREE.Vector3().copy(carPos).addScaledVector(tangent, 12));
  }
}
