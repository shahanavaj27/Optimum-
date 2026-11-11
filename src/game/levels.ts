export interface GameLevel {
  id: number;
  name: string;
  subtitle: string;
  description: string;
  targetDistance: number; // Finish line in meters
  biome: 'meadow' | 'desert' | 'snow' | 'canyon';
  hillAmplitude: number;
  hillFrequency: number;
  gapFrequency: number;
  roughness: number;
  rewardCoins: number;
}

export const GAME_LEVELS: GameLevel[] = [
  {
    id: 1,
    name: 'Easy Grassy Hills',
    subtitle: 'Smooth rolling hills for beginners',
    description: 'Learn throttle and brake balance on gentle green slopes. Collect large silver Optimum coins along the way!',
    targetDistance: 400,
    biome: 'meadow',
    hillAmplitude: 65,
    hillFrequency: 0.0011,
    gapFrequency: 0,
    roughness: 0,
    rewardCoins: 100,
  },
  {
    id: 2,
    name: 'Small Jumps & Obstacles',
    subtitle: 'Fun kickers and wooden bridges',
    description: 'Catch your first air time over wooden suspension bridges and small roller jumps.',
    targetDistance: 500,
    biome: 'meadow',
    hillAmplitude: 85,
    hillFrequency: 0.0014,
    gapFrequency: 0.1,
    roughness: 0.05,
    rewardCoins: 150,
  },
  {
    id: 3,
    name: 'Steeper Mountain Roads',
    subtitle: 'Desert dunes and demanding inclines',
    description: 'Sandy mountain grades that test your jeep\'s torque and acceleration control.',
    targetDistance: 600,
    biome: 'desert',
    hillAmplitude: 110,
    hillFrequency: 0.0016,
    gapFrequency: 0.15,
    roughness: 0.08,
    rewardCoins: 200,
  },
  {
    id: 4,
    name: 'Rocky Terrain',
    subtitle: 'Uneven washboards and rocky bumps',
    description: 'Jagged terrain putting your coilovers and tire suspension to the test.',
    targetDistance: 700,
    biome: 'desert',
    hillAmplitude: 125,
    hillFrequency: 0.0020,
    gapFrequency: 0.2,
    roughness: 0.18,
    rewardCoins: 250,
  },
  {
    id: 5,
    name: 'Large Hills and Gaps',
    subtitle: 'Big air leaps over canyon chasms',
    description: 'Carry speed off high crests to clear deep ravines. Watch your landing angle!',
    targetDistance: 800,
    biome: 'canyon',
    hillAmplitude: 145,
    hillFrequency: 0.0018,
    gapFrequency: 0.35,
    roughness: 0.12,
    rewardCoins: 350,
  },
  {
    id: 6,
    name: 'Difficult Mountain Climbing',
    subtitle: 'High alpine switchbacks and steep peaks',
    description: 'Severe mountain inclines requiring steady gas control to avoid flipping backward.',
    targetDistance: 900,
    biome: 'snow',
    hillAmplitude: 165,
    hillFrequency: 0.0017,
    gapFrequency: 0.25,
    roughness: 0.15,
    rewardCoins: 450,
  },
  {
    id: 7,
    name: 'Dangerous Jumps',
    subtitle: 'Perilous drops and high-velocity air',
    description: 'Massive launch ramps with narrow landing strips. Tilt Muscat\'s jeep in mid-air!',
    targetDistance: 1000,
    biome: 'canyon',
    hillAmplitude: 175,
    hillFrequency: 0.0022,
    gapFrequency: 0.45,
    roughness: 0.2,
    rewardCoins: 600,
  },
  {
    id: 8,
    name: 'Narrow and Challenging Roads',
    subtitle: 'Undulating ridges and perilous drop-offs',
    description: 'Narrow road crests where a single bounce can flip your jeep. Extreme precision required.',
    targetDistance: 1100,
    biome: 'snow',
    hillAmplitude: 190,
    hillFrequency: 0.0025,
    gapFrequency: 0.4,
    roughness: 0.25,
    rewardCoins: 750,
  },
  {
    id: 9,
    name: 'Extreme Mountain Terrain',
    subtitle: 'Volcanic crags and brutal cliffs',
    description: 'Steep drop-offs, sudden blind dips, and ferocious hills. Only skilled drivers survive.',
    targetDistance: 1250,
    biome: 'canyon',
    hillAmplitude: 215,
    hillFrequency: 0.0026,
    gapFrequency: 0.5,
    roughness: 0.3,
    rewardCoins: 900,
  },
  {
    id: 10,
    name: 'Ultimate Optimum Challenge',
    subtitle: 'The supreme trial of speed and physics',
    description: 'Conquer the legendary 1500m Optimum summit! Master all jumps, gaps, and peaks to claim the grand championship.',
    targetDistance: 1500,
    biome: 'canyon',
    hillAmplitude: 240,
    hillFrequency: 0.0028,
    gapFrequency: 0.6,
    roughness: 0.35,
    rewardCoins: 1500,
  },
];

export function getLevelById(id: number): GameLevel {
  return GAME_LEVELS.find((l) => l.id === id) || GAME_LEVELS[0];
}
