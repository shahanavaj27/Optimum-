import * as THREE from 'three';
import { GameMaterials3D } from './materials.ts';

/**
 * Procedural 3D Black & White Optimum Off-Road Jeep with seated Muscat mascot driver!
 * Exactly matches the uploaded reference image:
 * - Alpine white front clip with blue racing stripe & side LED marker
 * - Matte black doors with Silver Optimum Infinity Logo
 * - Glowing neon cyan light tubes tracing stepped rear fender arch and rocker
 * - Tubular roll cage with 3 golden-amber roof spotlights
 * - 4 large realistic off-road knobby wheels with concave dark steel rims & silver lips
 * - Muscat driver inside: white flame head, 2 floating cyan rings, black visor, dark hoodie, hands on steering wheel
 */
export class Jeep3D {
  public group: THREE.Group = new THREE.Group();

  // Wheels
  public wheelFL: THREE.Group = new THREE.Group();
  public wheelFR: THREE.Group = new THREE.Group();
  public wheelRL: THREE.Group = new THREE.Group();
  public wheelRR: THREE.Group = new THREE.Group();

  // Steerable wheel pivots
  private steerPivotL: THREE.Group = new THREE.Group();
  private steerPivotR: THREE.Group = new THREE.Group();

  // Driver & Steering
  public muscatGroup: THREE.Group = new THREE.Group();
  public steeringWheelGroup: THREE.Group = new THREE.Group();
  public muscatHeadGroup: THREE.Group = new THREE.Group();

  // Dimensions
  public readonly wheelRadius: number = 0.52;
  public readonly wheelBase: number = 2.4;
  public readonly trackWidth: number = 1.7;

  // Animation states
  private wheelSpin: number = 0;
  private currentSteer: number = 0;
  private driverBob: number = 0;

  constructor() {
    this.buildJeep();
  }

  private buildJeep() {
    const root = this.group;

    // 1. Main Lower Chassis Frame & Skid Plate (Matte Charcoal)
    const chassisGeo = new THREE.BoxGeometry(1.6, 0.28, 3.2);
    const chassisMesh = new THREE.Mesh(chassisGeo, GameMaterials3D.blackBody);
    chassisMesh.position.set(0, 0.45, 0);
    chassisMesh.castShadow = true;
    chassisMesh.receiveShadow = true;
    root.add(chassisMesh);

    // 2. Black Body Tub & Doors
    const tubGeo = new THREE.BoxGeometry(1.56, 0.55, 1.6);
    const tubMesh = new THREE.Mesh(tubGeo, GameMaterials3D.blackBody);
    tubMesh.position.set(0, 0.78, -0.15);
    tubMesh.castShadow = true;
    root.add(tubMesh);

    // Left and Right Door Panels with Silver Optimum Infinity Logo
    const doorGeo = new THREE.PlaneGeometry(1.15, 0.5);
    // Left Door
    const doorL = new THREE.Mesh(doorGeo, GameMaterials3D.doorPanel);
    doorL.position.set(-0.785, 0.78, -0.1);
    doorL.rotation.y = -Math.PI / 2;
    root.add(doorL);

    // Right Door
    const doorR = new THREE.Mesh(doorGeo, GameMaterials3D.doorPanel);
    doorR.position.set(0.785, 0.78, -0.1);
    doorR.rotation.y = Math.PI / 2;
    root.add(doorR);

    // 3. Alpine White Front Clip & Hood
    const hoodGeo = new THREE.BoxGeometry(1.5, 0.48, 1.25);
    const hoodMesh = new THREE.Mesh(hoodGeo, GameMaterials3D.whiteBody);
    hoodMesh.position.set(0, 0.85, 1.05);
    hoodMesh.castShadow = true;
    root.add(hoodMesh);

    // Blue Racing Stripe along Hood Top Center
    const stripeGeo = new THREE.BoxGeometry(0.32, 0.02, 1.22);
    const stripeMesh = new THREE.Mesh(stripeGeo, GameMaterials3D.blueStripe);
    stripeMesh.position.set(0, 1.1, 1.05);
    root.add(stripeMesh);

    // Front Windshield Cowl (Alpine White)
    const cowlGeo = new THREE.BoxGeometry(1.48, 0.22, 0.35);
    const cowlMesh = new THREE.Mesh(cowlGeo, GameMaterials3D.whiteBody);
    cowlMesh.position.set(0, 1.18, 0.45);
    root.add(cowlMesh);

    // Blue LED Marker Lights on Cowl Sides
    const ledGeo = new THREE.BoxGeometry(0.04, 0.05, 0.16);
    const ledL = new THREE.Mesh(ledGeo, GameMaterials3D.cyanNeon);
    ledL.position.set(-0.76, 0.95, 0.95);
    root.add(ledL);
    const ledR = new THREE.Mesh(ledGeo, GameMaterials3D.cyanNeon);
    ledR.position.set(0.76, 0.95, 0.95);
    root.add(ledR);

    // Front Grille & Nose (Dark Steel with slots)
    const grilleGeo = new THREE.BoxGeometry(1.4, 0.42, 0.1);
    const grilleMesh = new THREE.Mesh(grilleGeo, GameMaterials3D.lightHousing);
    grilleMesh.position.set(0, 0.82, 1.68);
    root.add(grilleMesh);

    // Round Golden-Amber Headlights on Grille
    const headlightGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.06, 16);
    headlightGeo.rotateX(Math.PI / 2);

    const headlightL = new THREE.Mesh(headlightGeo, GameMaterials3D.headlightLens);
    headlightL.position.set(-0.52, 0.85, 1.72);
    root.add(headlightL);

    const headlightR = new THREE.Mesh(headlightGeo, GameMaterials3D.headlightLens);
    headlightR.position.set(0.52, 0.85, 1.72);
    root.add(headlightR);

    // Forward Headlight Spotlight Cones
    const spotL = new THREE.SpotLight(0xfef08a, 4, 32, Math.PI / 5, 0.4, 1.2);
    spotL.position.set(-0.52, 0.85, 1.8);
    spotL.target.position.set(-0.52, 0, 15);
    root.add(spotL);
    root.add(spotL.target);

    const spotR = new THREE.SpotLight(0xfef08a, 4, 32, Math.PI / 5, 0.4, 1.2);
    spotR.position.set(0.52, 0.85, 1.8);
    spotR.target.position.set(0.52, 0, 15);
    root.add(spotR);
    root.add(spotR.target);

    // 4. White Angular Off-Road Fender Flares
    this.createFenderFlare(-0.82, 0.65, 1.15, true);  // Front-Left
    this.createFenderFlare(0.82, 0.65, 1.15, false);  // Front-Right
    this.createFenderFlare(-0.82, 0.65, -1.15, true); // Rear-Left
    this.createFenderFlare(0.82, 0.65, -1.15, false); // Rear-Right

    // Lower Side Rocker Step Rails (White Trim)
    const rockerGeo = new THREE.BoxGeometry(0.12, 0.08, 1.4);
    const rockerL = new THREE.Mesh(rockerGeo, GameMaterials3D.whiteBody);
    rockerL.position.set(-0.82, 0.45, -0.05);
    root.add(rockerL);
    const rockerR = new THREE.Mesh(rockerGeo, GameMaterials3D.whiteBody);
    rockerR.position.set(0.82, 0.45, -0.05);
    root.add(rockerR);

    // 5. Brilliant Neon Glowing Cyan-Blue Accent Light Tubes!
    // Tracing the stepped rear fender contour and lower side rockers
    this.createNeonAccentTubes();

    // 6. Heavy-Duty Tubular Roll Cage with 3 Amber Roof Spotlights
    this.createRollCage();

    // 7. Bumpers & Rear Exhaust
    // Heavy front off-road bumper
    const fBumperGeo = new THREE.BoxGeometry(1.72, 0.18, 0.22);
    const fBumper = new THREE.Mesh(fBumperGeo, GameMaterials3D.lightHousing);
    fBumper.position.set(0, 0.42, 1.76);
    fBumper.castShadow = true;
    root.add(fBumper);

    // Rear off-road bumper
    const rBumperGeo = new THREE.BoxGeometry(1.72, 0.18, 0.2);
    const rBumper = new THREE.Mesh(rBumperGeo, GameMaterials3D.lightHousing);
    rBumper.position.set(0, 0.44, -1.68);
    rBumper.castShadow = true;
    root.add(rBumper);

    // Twin chrome exhaust pipes at rear
    const exhaustGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.2, 12);
    exhaustGeo.rotateX(Math.PI / 2);
    const exL = new THREE.Mesh(exhaustGeo, GameMaterials3D.silverRimLip);
    exL.position.set(-0.45, 0.36, -1.78);
    root.add(exL);
    const exR = new THREE.Mesh(exhaustGeo, GameMaterials3D.silverRimLip);
    exR.position.set(-0.32, 0.36, -1.78);
    root.add(exR);

    // Rear vertical amber taillights
    const tailGeo = new THREE.BoxGeometry(0.06, 0.16, 0.06);
    const tailL = new THREE.Mesh(tailGeo, GameMaterials3D.taillightLens);
    tailL.position.set(-0.76, 0.78, -1.62);
    root.add(tailL);
    const tailR = new THREE.Mesh(tailGeo, GameMaterials3D.taillightLens);
    tailR.position.set(0.76, 0.78, -1.62);
    root.add(tailR);

    // 8. Muscat Mascot Driver seated inside cockpit!
    this.createMuscatDriver();

    // 9. 4 Large Off-Road Knobby Wheels
    this.createWheels();
  }

  private createFenderFlare(x: number, y: number, z: number, isLeft: boolean) {
    const flareGeo = new THREE.BoxGeometry(0.18, 0.15, 0.85);
    const flareMesh = new THREE.Mesh(flareGeo, GameMaterials3D.whiteBody);
    flareMesh.position.set(x, y + 0.18, z);
    flareMesh.castShadow = true;
    this.group.add(flareMesh);
  }

  private createNeonAccentTubes() {
    // Stepped rear contour neon light tube on left and right sides
    const tubeSides = [-0.8, 0.8];
    for (const sx of tubeSides) {
      // Stepped path points
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(sx, 0.48, 0.6),
        new THREE.Vector3(sx, 0.48, -0.65),
        new THREE.Vector3(sx, 0.72, -0.85),
        new THREE.Vector3(sx, 0.72, -1.35),
        new THREE.Vector3(sx, 0.58, -1.5),
      ]);
      const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.022, 8, false);
      const tubeMesh = new THREE.Mesh(tubeGeo, GameMaterials3D.cyanNeon);
      this.group.add(tubeMesh);
    }
  }

  private createRollCage() {
    const cage = new THREE.Group();

    // Main rear B-pillar arch (over cockpit behind Muscat)
    const archCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.68, 0.95, -0.65),
      new THREE.Vector3(-0.65, 1.88, -0.55),
      new THREE.Vector3(0, 1.9, -0.55),
      new THREE.Vector3(0.65, 1.88, -0.55),
      new THREE.Vector3(0.68, 0.95, -0.65),
    ]);
    const archGeo = new THREE.TubeGeometry(archCurve, 18, 0.038, 8, false);
    const archMesh = new THREE.Mesh(archGeo, GameMaterials3D.rollCage);
    archMesh.castShadow = true;
    cage.add(archMesh);

    // Forward roof rails (connecting to windshield A-pillar)
    const railL = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.62, 1.88, -0.55),
        new THREE.Vector3(-0.62, 1.85, 0.1),
        new THREE.Vector3(-0.65, 1.22, 0.45),
      ]),
      12,
      0.034,
      8,
      false
    );
    cage.add(new THREE.Mesh(railL, GameMaterials3D.rollCage));

    const railR = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.62, 1.88, -0.55),
        new THREE.Vector3(0.62, 1.85, 0.1),
        new THREE.Vector3(0.65, 1.22, 0.45),
      ]),
      12,
      0.034,
      8,
      false
    );
    cage.add(new THREE.Mesh(railR, GameMaterials3D.rollCage));

    // Rear diagonal support struts (olive/dark-slate struts down to rear corners)
    const strutL = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.62, 1.85, -0.55),
        new THREE.Vector3(-0.68, 0.95, -1.45),
      ]),
      8,
      0.032,
      8,
      false
    );
    cage.add(new THREE.Mesh(strutL, GameMaterials3D.rearDiagonalStrut));

    const strutR = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.62, 1.85, -0.55),
        new THREE.Vector3(0.68, 0.95, -1.45),
      ]),
      8,
      0.032,
      8,
      false
    );
    cage.add(new THREE.Mesh(strutR, GameMaterials3D.rearDiagonalStrut));

    // 3 Golden-Amber Roof Spotlights mounted on top crossbar!
    const lightPositionsX = [-0.34, 0, 0.34];
    for (const lx of lightPositionsX) {
      const spotGroup = new THREE.Group();
      spotGroup.position.set(lx, 1.98, -0.55);

      // Black cylindrical housing
      const housingGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.12, 16);
      housingGeo.rotateX(Math.PI / 2);
      const housing = new THREE.Mesh(housingGeo, GameMaterials3D.lightHousing);
      spotGroup.add(housing);

      // Glowing golden amber lens
      const lensGeo = new THREE.CircleGeometry(0.1, 16);
      const lens = new THREE.Mesh(lensGeo, GameMaterials3D.amberLight);
      lens.position.z = 0.065;
      spotGroup.add(lens);

      // Small ambient light halo
      const pointLight = new THREE.PointLight(0xfbbf24, 1.5, 6);
      pointLight.position.set(0, 0, 0.2);
      spotGroup.add(pointLight);

      cage.add(spotGroup);
    }

    this.group.add(cage);
  }

  /**
   * Muscat Mascot Driver Model
   * Seated inside the cockpit, holding the steering wheel with white gloved hands!
   */
  private createMuscatDriver() {
    const driver = this.muscatGroup;
    driver.position.set(-0.25, 0.95, -0.15); // Seated on left side

    // 1. Dark Navy / Charcoal Hoodie Body
    const torsoGeo = new THREE.BoxGeometry(0.48, 0.52, 0.38);
    const torso = new THREE.Mesh(torsoGeo, GameMaterials3D.muscatHoodie);
    torso.position.set(0, 0.26, 0);
    torso.castShadow = true;
    driver.add(torso);

    // Hood collar fold around neck
    const collarGeo = new THREE.TorusGeometry(0.2, 0.07, 8, 16);
    collarGeo.rotateX(Math.PI / 2);
    const collar = new THREE.Mesh(collarGeo, GameMaterials3D.muscatHoodie);
    collar.position.set(0, 0.48, 0.02);
    driver.add(collar);

    // 2. Head Group (Animates with bumps & turns)
    const headGroup = this.muscatHeadGroup;
    headGroup.position.set(0, 0.62, 0);

    // Muscat's Iconic White Flame Head
    // Base head skull sphere
    const headSphereGeo = new THREE.SphereGeometry(0.25, 16, 16);
    const headBase = new THREE.Mesh(headSphereGeo, GameMaterials3D.muscatHead);
    headBase.scale.set(1.0, 1.15, 0.95);
    headGroup.add(headBase);

    // Dynamic Flame Crest (curling backward and upward)
    const flameCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.15, -0.05),
      new THREE.Vector3(0, 0.35, -0.12),
      new THREE.Vector3(0, 0.48, -0.25),
      new THREE.Vector3(0, 0.42, -0.36),
    ]);
    const flameGeo = new THREE.TubeGeometry(flameCurve, 12, 0.12, 10, false);
    const flameMesh = new THREE.Mesh(flameGeo, GameMaterials3D.muscatHead);
    headGroup.add(flameMesh);

    // 2 Glowing Cyan-Blue Energy Rings floating right behind the flame crest!
    const ring1Geo = new THREE.TorusGeometry(0.09, 0.022, 8, 16);
    ring1Geo.rotateY(Math.PI / 4);
    const ring1 = new THREE.Mesh(ring1Geo, GameMaterials3D.cyanFlameRings);
    ring1.position.set(0, 0.44, -0.32);
    headGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(0.065, 0.018, 8, 16);
    ring2Geo.rotateY(Math.PI / 3);
    const ring2 = new THREE.Mesh(ring2Geo, GameMaterials3D.cyanFlameRings);
    ring2.position.set(0, 0.32, -0.38);
    headGroup.add(ring2);

    // Glossy Black Visor Goggles with Bold White Rim
    const visorGeo = new THREE.BoxGeometry(0.38, 0.16, 0.14);
    const visor = new THREE.Mesh(visorGeo, GameMaterials3D.muscatVisor);
    visor.position.set(0, 0.04, 0.2);
    headGroup.add(visor);

    const visorFrameGeo = new THREE.BoxGeometry(0.42, 0.19, 0.12);
    const visorFrame = new THREE.Mesh(visorFrameGeo, GameMaterials3D.muscatVisorFrame);
    visorFrame.position.set(0, 0.04, 0.18);
    headGroup.add(visorFrame);

    driver.add(headGroup);

    // 3. Steering Column & Wheel with Muscat's Hands Gripping It
    const steeringAssembly = this.steeringWheelGroup;
    steeringAssembly.position.set(0, 0.38, 0.36);
    steeringAssembly.rotation.x = -Math.PI / 5; // Angled sports wheel

    // Steering column rod
    const colGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8);
    colGeo.rotateX(Math.PI / 2);
    const column = new THREE.Mesh(colGeo, GameMaterials3D.lightHousing);
    column.position.set(0, 0, -0.15);
    steeringAssembly.add(column);

    // Outer wheel grip ring
    const wheelRingGeo = new THREE.TorusGeometry(0.2, 0.028, 8, 20);
    const wheelRing = new THREE.Mesh(wheelRingGeo, GameMaterials3D.lightHousing);
    steeringAssembly.add(wheelRing);

    // Center horn hub (Optimum Blue)
    const hubGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 12);
    hubGeo.rotateX(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeo, GameMaterials3D.blueStripe);
    steeringAssembly.add(hub);

    // 3 Wheel spokes
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3 - Math.PI / 2;
      const spokeGeo = new THREE.BoxGeometry(0.03, 0.18, 0.02);
      const spoke = new THREE.Mesh(spokeGeo, GameMaterials3D.silverRimLip);
      spoke.position.set(Math.cos(a) * 0.09, Math.sin(a) * 0.09, 0);
      spoke.rotation.z = a + Math.PI / 2;
      steeringAssembly.add(spoke);
    }

    // Muscat's Pure White Gloved Hands Gripping Wheel!
    // Left hand at 9 o'clock
    const handLGeo = new THREE.SphereGeometry(0.055, 10, 10);
    const handL = new THREE.Mesh(handLGeo, GameMaterials3D.muscatGloves);
    handL.position.set(-0.2, 0, 0.02);
    steeringAssembly.add(handL);

    // Right hand at 3 o'clock
    const handRGeo = new THREE.SphereGeometry(0.055, 10, 10);
    const handR = new THREE.Mesh(handRGeo, GameMaterials3D.muscatGloves);
    handR.position.set(0.2, 0, 0.02);
    steeringAssembly.add(handR);

    // Arms in hoodie sleeves
    const armLGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.35, 8);
    const armL = new THREE.Mesh(armLGeo, GameMaterials3D.muscatHoodie);
    armL.position.set(-0.16, 0.22, 0.16);
    armL.rotation.set(Math.PI / 4, 0, -Math.PI / 6);
    driver.add(armL);

    const armRGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.35, 8);
    const armR = new THREE.Mesh(armRGeo, GameMaterials3D.muscatHoodie);
    armR.position.set(0.16, 0.22, 0.16);
    armR.rotation.set(Math.PI / 4, 0, Math.PI / 6);
    driver.add(armR);

    driver.add(steeringAssembly);

    this.group.add(driver);
  }

  /**
   * Create 4 off-road knobby wheels with deep-dish concave dark steel rims and silver lips
   */
  private createWheels() {
    const halfBase = this.wheelBase / 2;
    const halfTrack = this.trackWidth / 2;

    // Front-Left
    this.steerPivotL.position.set(-halfTrack, this.wheelRadius, halfBase);
    this.wheelFL = this.buildWheelMesh(true);
    this.steerPivotL.add(this.wheelFL);
    this.group.add(this.steerPivotL);

    // Front-Right
    this.steerPivotR.position.set(halfTrack, this.wheelRadius, halfBase);
    this.wheelFR = this.buildWheelMesh(false);
    this.steerPivotR.add(this.wheelFR);
    this.group.add(this.steerPivotR);

    // Rear-Left
    this.wheelRL = this.buildWheelMesh(true);
    this.wheelRL.position.set(-halfTrack, this.wheelRadius, -halfBase);
    this.group.add(this.wheelRL);

    // Rear-Right
    this.wheelRR = this.buildWheelMesh(false);
    this.wheelRR.position.set(halfTrack, this.wheelRadius, -halfBase);
    this.group.add(this.wheelRR);
  }

  private buildWheelMesh(isLeft: boolean): THREE.Group {
    const wheel = new THREE.Group();
    const r = this.wheelRadius;
    const w = 0.38;

    // Heavy-duty rubber tire
    const tireGeo = new THREE.CylinderGeometry(r, r, w, 24);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMesh = new THREE.Mesh(tireGeo, GameMaterials3D.tireRubber);
    tireMesh.castShadow = true;
    wheel.add(tireMesh);

    // 10 Off-Road Knobby Perimeter Lugs
    const lugGeo = new THREE.BoxGeometry(w * 0.95, 0.06, 0.12);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const lug = new THREE.Mesh(lugGeo, GameMaterials3D.tireRubber);
      lug.position.set(0, Math.sin(a) * r, Math.cos(a) * r);
      lug.rotation.x = -a;
      wheel.add(lug);
    }

    // Machined Silver Rim Outer Lip
    const lipGeo = new THREE.TorusGeometry(r * 0.62, 0.025, 8, 20);
    lipGeo.rotateY(Math.PI / 2);
    const lip = new THREE.Mesh(lipGeo, GameMaterials3D.silverRimLip);
    lip.position.x = isLeft ? -w * 0.48 : w * 0.48;
    wheel.add(lip);

    // Concave Deep-Dish Dark Steel Center Disc
    const discGeo = new THREE.CylinderGeometry(r * 0.58, r * 0.52, 0.06, 16);
    discGeo.rotateZ(Math.PI / 2);
    const disc = new THREE.Mesh(discGeo, GameMaterials3D.darkSteelRim);
    disc.position.x = isLeft ? -w * 0.42 : w * 0.42;
    wheel.add(disc);

    // Central 5 Silver Lug Nuts
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const nutGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.03, 6);
      nutGeo.rotateZ(Math.PI / 2);
      const nut = new THREE.Mesh(nutGeo, GameMaterials3D.silverRimLip);
      nut.position.set(isLeft ? -w * 0.46 : w * 0.46, Math.sin(a) * 0.1, Math.cos(a) * 0.1);
      wheel.add(nut);
    }

    // Red Brake Caliper & Vented Rotor inside
    const rotorGeo = new THREE.CylinderGeometry(r * 0.45, r * 0.45, 0.02, 16);
    rotorGeo.rotateZ(Math.PI / 2);
    const rotor = new THREE.Mesh(rotorGeo, GameMaterials3D.brakeRotor);
    rotor.position.x = isLeft ? -0.05 : 0.05;
    wheel.add(rotor);

    const caliperGeo = new THREE.BoxGeometry(0.06, 0.16, 0.14);
    const caliper = new THREE.Mesh(caliperGeo, GameMaterials3D.brakeCaliper);
    caliper.position.set(isLeft ? -0.08 : 0.08, r * 0.35, 0);
    wheel.add(caliper);

    return wheel;
  }

  /**
   * Update wheel rotation, front steering angle, and Muscat driving animation
   */
  public update(dt: number, speed: number, steerTarget: number, isAirborne: boolean) {
    // 1. Wheel spin matching travel speed
    const spinSpeed = speed / this.wheelRadius;
    this.wheelSpin += spinSpeed * dt;

    this.wheelFL.rotation.x = this.wheelSpin;
    this.wheelFR.rotation.x = this.wheelSpin;
    this.wheelRL.rotation.x = this.wheelSpin;
    this.wheelRR.rotation.x = this.wheelSpin;

    // 2. Smooth front wheel steering
    this.currentSteer += (steerTarget - this.currentSteer) * Math.min(1, dt * 14);
    this.steerPivotL.rotation.y = this.currentSteer;
    this.steerPivotR.rotation.y = this.currentSteer;

    // 3. Muscat Steering Wheel turns naturally with steering
    this.steeringWheelGroup.rotation.z = -this.currentSteer * 2.2;

    // 4. Muscat driving physics & torso lean:
    // Leans back into seat on acceleration, forward on braking, tilts with turns
    const accelG = Math.max(-0.4, Math.min(0.4, speed * 0.02));
    const targetTorsoLeanX = -accelG * 0.35;
    const targetTorsoLeanZ = this.currentSteer * 0.45;

    this.muscatGroup.rotation.x += (targetTorsoLeanX - this.muscatGroup.rotation.x) * dt * 10;
    this.muscatGroup.rotation.z += (targetTorsoLeanZ - this.muscatGroup.rotation.z) * dt * 10;

    // Organic head bounce on rough road
    this.driverBob += dt * (Math.abs(speed) > 0.5 ? 16 : 4);
    const bounceOffset = Math.sin(this.driverBob) * (Math.abs(speed) > 1 ? 0.03 : 0.008);
    this.muscatHeadGroup.position.y = 0.62 + bounceOffset;
  }
}
