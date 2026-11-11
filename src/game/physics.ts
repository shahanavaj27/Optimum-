import { ControlsState, VehicleUpgrades } from './types.ts';
import { TerrainManager } from './terrain.ts';
import { sound } from './audio.ts';

export interface Wheel {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isGrounded: boolean;
  spin: number;           // Continuous rotation angle in radians
  spinVelocity: number;   // Angular spin speed for in-air momentum
  suspensionLength: number; // Current visual extension from chassis
  squashFactor: number;   // Dynamic tire compression against ground
}

export class VehiclePhysics {
  // Chassis position and angle
  public x: number = 100;
  public y: number = 370;
  public vx: number = 0;
  public vy: number = 0;
  public angle: number = 0;
  public angularVelocity: number = 0;

  // Driver head position (for crash detection)
  public headX: number = 100;
  public headY: number = 325;
  public headBobOffset: number = 0;

  // Muscat Mascot Driver Animation State
  public muscatLean: number = 0;         // Torso lean angle (radians)
  public muscatLeanVel: number = 0;
  public muscatBounce: number = 0;       // Vertical spring compression displacement
  public muscatBounceVel: number = 0;
  public steeringWheelAngle: number = 0; // Steering rotation angle

  // Dimensions scaled up by ~30% for commanding off-road stance
  public readonly wheelbase: number = 94;        // Scaled up to 94
  public readonly wheelRadius: number = 26;      // Large off-road tires
  public readonly suspensionRest: number = 30;   // Elevated ground clearance

  // Dynamic suspension spring lengths
  public rearSuspLength: number = 30;
  public frontSuspLength: number = 30;

  public rearWheel: Wheel = {
    x: 53,
    y: 394,
    vx: 0,
    vy: 0,
    radius: 26,
    isGrounded: false,
    spin: 0,
    spinVelocity: 0,
    suspensionLength: 30,
    squashFactor: 1.0,
  };

  public frontWheel: Wheel = {
    x: 147,
    y: 394,
    vx: 0,
    vy: 0,
    radius: 26,
    isGrounded: false,
    spin: 0,
    spinVelocity: 0,
    suspensionLength: 30,
    squashFactor: 1.0,
  };

  // Fuel and health
  public fuel: number = 100;
  public maxFuel: number = 100;
  public isCrashed: boolean = false;
  public isOutOfFuel: boolean = false;
  public crashReason: 'CRASH' | 'OUT_OF_FUEL' | 'FELL' | null = null;

  // Air time & stunt tracking
  public isInAir: boolean = false;
  public airTimeTimer: number = 0;
  public cumulativeAirRotation: number = 0;
  public previousAngle: number = 0;
  public previousVx: number = 0;

  // Upgrades
  public upgrades: VehicleUpgrades = {
    engine: 0,
    suspension: 0,
    tires: 0,
    fuelTank: 0,
  };

  constructor(upgrades?: VehicleUpgrades) {
    if (upgrades) {
      this.upgrades = { ...upgrades };
    }
    this.reset();
  }

  public reset(upgrades?: VehicleUpgrades) {
    if (upgrades) {
      this.upgrades = { ...upgrades };
    }

    const startX = 100;
    const startGround = 420;
    const startWheelY = startGround - this.wheelRadius;

    this.rearWheel.x = startX - this.wheelbase / 2;
    this.rearWheel.y = startWheelY;
    this.rearWheel.vx = 0;
    this.rearWheel.vy = 0;
    this.rearWheel.spin = 0;
    this.rearWheel.spinVelocity = 0;
    this.rearWheel.isGrounded = true;
    this.rearWheel.suspensionLength = this.suspensionRest;
    this.rearWheel.squashFactor = 1.0;

    this.frontWheel.x = startX + this.wheelbase / 2;
    this.frontWheel.y = startWheelY;
    this.frontWheel.vx = 0;
    this.frontWheel.vy = 0;
    this.frontWheel.spin = 0;
    this.frontWheel.spinVelocity = 0;
    this.frontWheel.isGrounded = true;
    this.frontWheel.suspensionLength = this.suspensionRest;
    this.frontWheel.squashFactor = 1.0;

    this.x = startX;
    this.y = startWheelY - this.suspensionRest;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.angularVelocity = 0;
    this.previousAngle = 0;
    this.previousVx = 0;

    this.muscatLean = 0;
    this.muscatLeanVel = 0;
    this.muscatBounce = 0;
    this.muscatBounceVel = 0;
    this.steeringWheelAngle = 0;

    this.rearSuspLength = this.suspensionRest;
    this.frontSuspLength = this.suspensionRest;

    this.maxFuel = 100 + this.upgrades.fuelTank * 20;
    this.fuel = this.maxFuel;
    this.isCrashed = false;
    this.isOutOfFuel = false;
    this.crashReason = null;
    this.isInAir = false;
    this.airTimeTimer = 0;
    this.cumulativeAirRotation = 0;

    this.updateChassisAndHead();
  }

  public update(controls: ControlsState, terrain: TerrainManager, dt: number): {
    stuntsCompleted: string[];
    justLanded: boolean;
    landingIntensity: number;
  } {
    const stuntsCompleted: string[] = [];
    let justLanded = false;
    let landingIntensity = 0;

    // Post-crash physics (car skids to a stop)
    if (this.isCrashed) {
      const gravity = 0.4;
      this.rearWheel.vy += gravity;
      this.frontWheel.vy += gravity;
      this.rearWheel.vx *= 0.94;
      this.frontWheel.vx *= 0.94;

      this.rearWheel.x += this.rearWheel.vx;
      this.rearWheel.y += this.rearWheel.vy;
      this.frontWheel.x += this.frontWheel.vx;
      this.frontWheel.y += this.frontWheel.vy;

      const rGround = terrain.getY(this.rearWheel.x);
      if (this.rearWheel.y + this.wheelRadius > rGround) {
        this.rearWheel.y = rGround - this.wheelRadius;
        this.rearWheel.vy = -this.rearWheel.vy * 0.2;
      }
      const fGround = terrain.getY(this.frontWheel.x);
      if (this.frontWheel.y + this.wheelRadius > fGround) {
        this.frontWheel.y = fGround - this.wheelRadius;
        this.frontWheel.vy = -this.frontWheel.vy * 0.2;
      }

      this.constrainWheelbase();
      this.updateChassisAndHead();

      // Driver tumbles backward
      this.muscatLean += (-0.65 - this.muscatLean) * 0.1;
      return { stuntsCompleted, justLanded: false, landingIntensity: 0 };
    }

    // 1. Upgrade Multipliers
    const enginePower = 0.62 * (1.0 + this.upgrades.engine * 0.18);
    const tireGrip = 1.0 + this.upgrades.tires * 0.18;
    const maxSpeed = 23 + this.upgrades.engine * 2.5;

    // 2. Fuel Consumption
    const isGas = controls.gas && this.fuel > 0;
    const isBrake = controls.brake;

    if (this.fuel > 0) {
      const burn = isGas ? 0.075 : 0.015;
      this.fuel = Math.max(0, this.fuel - burn);
      if (this.fuel <= 20) {
        sound.playLowFuel();
      }
    } else {
      if (!this.isOutOfFuel && Math.abs(this.vx) < 0.2) {
        this.isOutOfFuel = true;
        this.crashReason = 'OUT_OF_FUEL';
        sound.playCrash();
      }
    }

    // 3. Gravity on Wheels
    const gravity = 0.38;
    this.rearWheel.vy += gravity;
    this.frontWheel.vy += gravity;

    // 4. Terrain Ground Checks for both wheels
    const rwTerrainY = terrain.getY(this.rearWheel.x);
    const rwGroundDist = (this.rearWheel.y + this.wheelRadius) - rwTerrainY;
    const rwGrounded = rwGroundDist >= -3;
    this.rearWheel.isGrounded = rwGrounded;

    const fwTerrainY = terrain.getY(this.frontWheel.x);
    const fwGroundDist = (this.frontWheel.y + this.wheelRadius) - fwTerrainY;
    const fwGrounded = fwGroundDist >= -3;
    this.frontWheel.isGrounded = fwGrounded;

    const previouslyInAir = this.isInAir;
    this.isInAir = !rwGrounded && !fwGrounded;

    // Check Landing from air
    if (previouslyInAir && !this.isInAir) {
      justLanded = true;
      landingIntensity = Math.abs(this.rearWheel.vy) + Math.abs(this.frontWheel.vy);
      sound.playLand(landingIntensity);

      // Heavy landing squash on Muscat and tires
      const squashImpulse = Math.min(10, landingIntensity * 1.5);
      this.muscatBounceVel += squashImpulse * 1.8;
      this.rearWheel.squashFactor = Math.max(0.78, 1.0 - landingIntensity * 0.035);
      this.frontWheel.squashFactor = Math.max(0.78, 1.0 - landingIntensity * 0.035);

      // Award stunt points
      if (this.airTimeTimer > 1.1) {
        stuntsCompleted.push(`AIR TIME ${(this.airTimeTimer).toFixed(1)}s`);
      }

      const totalRotations = Math.floor(Math.abs(this.cumulativeAirRotation) / (Math.PI * 1.8));
      if (totalRotations >= 1) {
        if (this.cumulativeAirRotation < 0) {
          stuntsCompleted.push(totalRotations > 1 ? 'DOUBLE BACKFLIP!' : 'BACKFLIP!');
        } else {
          stuntsCompleted.push(totalRotations > 1 ? 'DOUBLE FRONTFLIP!' : 'FRONTFLIP!');
        }
        sound.playStunt();
      }

      this.airTimeTimer = 0;
      this.cumulativeAirRotation = 0;
    }

    // Air Control & Stunts
    if (this.isInAir) {
      this.airTimeTimer += dt;
      const angleDelta = this.angle - this.previousAngle;
      let normDelta = angleDelta;
      while (normDelta > Math.PI) normDelta -= Math.PI * 2;
      while (normDelta < -Math.PI) normDelta += Math.PI * 2;
      this.cumulativeAirRotation += normDelta;

      // In air: Gas pitches nose UP (counter-clockwise), Brake pitches nose DOWN (clockwise)
      if (isGas) {
        this.angularVelocity -= 0.0034;
        // Spool up wheel spin speed in air
        this.rearWheel.spinVelocity += 0.8;
        this.frontWheel.spinVelocity += 0.5;
      }
      if (isBrake) {
        this.angularVelocity += 0.0034;
        this.rearWheel.spinVelocity *= 0.85;
        this.frontWheel.spinVelocity *= 0.85;
      }
      this.angularVelocity *= 0.982;

      // Rotate wheels in air from inertia
      this.rearWheel.spinVelocity *= 0.985;
      this.frontWheel.spinVelocity *= 0.985;
      this.rearWheel.spin += this.rearWheel.spinVelocity * 0.05;
      this.frontWheel.spin += this.frontWheel.spinVelocity * 0.05;

      // Springs stretch slightly when airborne
      this.rearSuspLength += (this.suspensionRest + 4 - this.rearSuspLength) * 0.15;
      this.frontSuspLength += (this.suspensionRest + 4 - this.frontSuspLength) * 0.15;
    } else {
      this.airTimeTimer = 0;
      this.cumulativeAirRotation = 0;
      this.angularVelocity *= 0.65;
    }
    this.previousAngle = this.angle;

    // 5. Drive Forces & Ground Response for Rear Wheel
    if (rwGrounded) {
      this.rearWheel.y = rwTerrainY - this.wheelRadius;
      if (this.rearWheel.vy > 0) this.rearWheel.vy = 0;

      const slope = terrain.getAngle(this.rearWheel.x);
      const tangentX = Math.cos(slope);
      const tangentY = Math.sin(slope);

      if (isGas) {
        const force = enginePower * tireGrip;
        this.rearWheel.vx += tangentX * force;
        this.rearWheel.vy += tangentY * force;
      }

      if (isBrake) {
        if (this.rearWheel.vx > 0.3) {
          this.rearWheel.vx -= tangentX * 0.52 * tireGrip;
          this.rearWheel.vx *= 0.92;
        } else {
          const reverseForce = -0.42 * tireGrip;
          this.rearWheel.vx += tangentX * reverseForce;
          this.rearWheel.vy += tangentY * reverseForce;
        }
      }

      this.rearWheel.vx *= 0.994;

      // Continuous Wheel Rotation matching exact ground speed
      // Angular distance: dTheta = dX / Radius
      const rotStep = this.rearWheel.vx / this.wheelRadius;
      this.rearWheel.spin += rotStep;
      this.rearWheel.spinVelocity = this.rearWheel.vx;

      // Suspension compression on bumps
      const bumpPressure = Math.max(-6, Math.min(6, this.rearWheel.vy));
      const targetSusp = this.suspensionRest - bumpPressure - (isGas ? 3 : 0);
      this.rearSuspLength += (targetSusp - this.rearSuspLength) * 0.25;

      terrain.depressBridge(this.rearWheel.x, 3.0);
    }

    // 6. Drive Forces & Ground Response for Front Wheel (AWD assist)
    if (fwGrounded) {
      this.frontWheel.y = fwTerrainY - this.wheelRadius;
      if (this.frontWheel.vy > 0) this.frontWheel.vy = 0;

      const slope = terrain.getAngle(this.frontWheel.x);
      const tangentX = Math.cos(slope);
      const tangentY = Math.sin(slope);

      if (isGas) {
        const force = enginePower * 0.72 * tireGrip;
        this.frontWheel.vx += tangentX * force;
        this.frontWheel.vy += tangentY * force;
      }

      if (isBrake) {
        if (this.frontWheel.vx > 0.3) {
          this.frontWheel.vx -= tangentX * 0.52 * tireGrip;
          this.frontWheel.vx *= 0.92;
        } else {
          const reverseForce = -0.32 * tireGrip;
          this.frontWheel.vx += tangentX * reverseForce;
          this.frontWheel.vy += tangentY * reverseForce;
        }
      }

      this.frontWheel.vx *= 0.994;

      const rotStep = this.frontWheel.vx / this.wheelRadius;
      this.frontWheel.spin += rotStep;
      this.frontWheel.spinVelocity = this.frontWheel.vx;

      const bumpPressure = Math.max(-6, Math.min(6, this.frontWheel.vy));
      const targetSusp = this.suspensionRest - bumpPressure + (isBrake ? 4 : 0);
      this.frontSuspLength += (targetSusp - this.frontSuspLength) * 0.25;

      terrain.depressBridge(this.frontWheel.x, 3.0);
    }

    // Elastic recovery of tire squashing
    this.rearWheel.squashFactor += (1.0 - this.rearWheel.squashFactor) * 0.18;
    this.frontWheel.squashFactor += (1.0 - this.frontWheel.squashFactor) * 0.18;

    // Cap maximum speed
    this.rearWheel.vx = Math.max(-11, Math.min(maxSpeed, this.rearWheel.vx));
    this.frontWheel.vx = Math.max(-11, Math.min(maxSpeed, this.frontWheel.vx));

    // Update wheel positions
    this.rearWheel.x += this.rearWheel.vx;
    this.rearWheel.y += this.rearWheel.vy;
    this.frontWheel.x += this.frontWheel.vx;
    this.frontWheel.y += this.frontWheel.vy;

    // Apply in-air rotational torque to wheel pair
    if (this.isInAir && Math.abs(this.angularVelocity) > 0.0001) {
      const midX = (this.rearWheel.x + this.frontWheel.x) / 2;
      const midY = (this.rearWheel.y + this.frontWheel.y) / 2;
      const cosW = Math.cos(this.angularVelocity);
      const sinW = Math.sin(this.angularVelocity);

      const rdx = this.rearWheel.x - midX;
      const rdy = this.rearWheel.y - midY;
      this.rearWheel.x = midX + rdx * cosW - rdy * sinW;
      this.rearWheel.y = midY + rdx * sinW + rdy * cosW;

      const fdx = this.frontWheel.x - midX;
      const fdy = this.frontWheel.y - midY;
      this.frontWheel.x = midX + fdx * cosW - fdy * sinW;
      this.frontWheel.y = midY + fdx * sinW + fdy * cosW;
    }

    // 7. Rigid Wheelbase Distance Constraint
    this.constrainWheelbase();

    // Equalize shared momentum across axle
    const avgVx = (this.rearWheel.vx + this.frontWheel.vx) / 2;
    const avgVy = (this.rearWheel.vy + this.frontWheel.vy) / 2;
    this.rearWheel.vx = this.rearWheel.vx * 0.65 + avgVx * 0.35;
    this.frontWheel.vx = this.frontWheel.vx * 0.65 + avgVx * 0.35;
    this.rearWheel.vy = this.rearWheel.vy * 0.65 + avgVy * 0.35;
    this.frontWheel.vy = this.frontWheel.vy * 0.65 + avgVy * 0.35;

    // 8. Update Chassis, Angle, and Muscat Head
    this.updateChassisAndHead();

    // 9. Muscat Mascot Organic Animation Physics
    // Calculate longitudinal acceleration for inertia lean
    const accelX = this.vx - this.previousVx;
    this.previousVx = this.vx;

    // Target lean:
    // When accelerating: leans back (-0.15 to -0.22 rad)
    // When braking: leans forward (+0.18 to +0.26 rad)
    let targetLean = 0;
    if (isGas) {
      targetLean -= 0.18;
    }
    if (isBrake) {
      targetLean += 0.22;
    }
    // G-force surge
    targetLean -= accelX * 0.08;
    // Slope tilt compensation
    targetLean += Math.sin(this.angle) * 0.12;
    targetLean = Math.max(-0.28, Math.min(0.32, targetLean));

    // Smooth spring-damper tracking for Muscat torso lean
    const leanSpring = 0.14;
    const leanDamping = 0.82;
    this.muscatLeanVel += (targetLean - this.muscatLean) * leanSpring;
    this.muscatLeanVel *= leanDamping;
    this.muscatLean += this.muscatLeanVel;

    // Vertical bounce simulation:
    // Suspension jolts kick Muscat upward, gravity and seat cushion pull him back down
    const verticalAccel = Math.abs(this.vy) * 0.25;
    this.muscatBounceVel -= this.muscatBounce * 0.22; // Spring pull back to 0
    this.muscatBounceVel *= 0.84; // Cushion damping
    this.muscatBounce += this.muscatBounceVel;
    // Ambient road texture jitter while driving fast
    const roadVibration = (rwGrounded || fwGrounded)
      ? Math.sin(Date.now() * 0.024) * Math.min(2.5, Math.abs(this.vx) * 0.14)
      : 0;
    this.headBobOffset = this.muscatBounce + roadVibration;

    // Dynamic steering wheel vibration & counter-steering
    const slopeAngle = terrain.getAngle(this.x);
    this.steeringWheelAngle = Math.sin(Date.now() * 0.016) * 0.12 + (this.angle - slopeAngle) * 0.25;

    // 10. Player Death & Crash Detection
    const absAngle = Math.abs(this.angle);
    const isFlippedOver = absAngle > 1.6 && absAngle < 4.68; // Upside down or sideways flip (>92°)
    const groundAtHead = terrain.getY(this.headX);
    const headHitGround = this.headY >= groundAtHead - 6;
    const fellInChasm = this.y > groundAtHead + 240 || this.y > 920;

    if (!this.isCrashed && ((isFlippedOver && headHitGround) || fellInChasm)) {
      this.isCrashed = true;
      this.crashReason = fellInChasm ? 'FELL' : 'CRASH';
      // Kill driving velocity abruptly upon fatal impact
      this.rearWheel.vx *= 0.1;
      this.frontWheel.vx *= 0.1;
      this.rearWheel.vy = Math.min(this.rearWheel.vy, 3);
      this.frontWheel.vy = Math.min(this.frontWheel.vy, 3);
      sound.playCrash();
    }

    // Engine Audio update
    const speedRatio = Math.min(1, Math.abs(this.vx) / maxSpeed);
    sound.updateEngine(speedRatio, isGas, this.isInAir);

    return { stuntsCompleted, justLanded, landingIntensity };
  }

  private constrainWheelbase() {
    const dx = this.frontWheel.x - this.rearWheel.x;
    const dy = this.frontWheel.y - this.rearWheel.y;
    const currentDist = Math.hypot(dx, dy) || this.wheelbase;
    const diff = (currentDist - this.wheelbase) / currentDist;

    this.rearWheel.x += dx * diff * 0.5;
    this.rearWheel.y += dy * diff * 0.5;
    this.frontWheel.x -= dx * diff * 0.5;
    this.frontWheel.y -= dy * diff * 0.5;
  }

  private updateChassisAndHead() {
    // Wheel midpoint
    const midX = (this.rearWheel.x + this.frontWheel.x) / 2;
    const midY = (this.rearWheel.y + this.frontWheel.y) / 2;

    // Angle of the axle
    this.angle = Math.atan2(
      this.frontWheel.y - this.rearWheel.y,
      this.frontWheel.x - this.rearWheel.x
    );

    // Unit normal vector pointing UP (perpendicular to axle)
    const normX = Math.sin(this.angle);
    const normY = -Math.cos(this.angle);

    // Dynamic average suspension elevation
    const avgSusp = (this.rearSuspLength + this.frontSuspLength) * 0.5;

    // Chassis center sits above the wheels
    this.x = midX + normX * avgSusp;
    this.y = midY + normY * avgSusp;

    // Velocity of chassis
    this.vx = (this.rearWheel.vx + this.frontWheel.vx) / 2;
    this.vy = (this.rearWheel.vy + this.frontWheel.vy) / 2;

    // Driver head position in world coordinates (scaled for 30% larger vehicle)
    const cosA = Math.cos(this.angle);
    const sinA = Math.sin(this.angle);
    const headLocalX = -8;
    const headLocalY = -48;

    this.headX = this.x + headLocalX * cosA - headLocalY * sinA;
    this.headY = this.y + headLocalX * sinA + headLocalY * cosA;
  }

  public refillFuel(amount: number) {
    this.fuel = Math.min(this.maxFuel, this.fuel + amount);
    this.isOutOfFuel = false;
  }
}
