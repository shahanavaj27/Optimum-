export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'LEVEL_COMPLETE';

export interface VehicleUpgrades {
  engine: number;      // 0 - 5 (Increases horsepower / hill climbing torque)
  suspension: number;  // 0 - 5 (Reduces harsh bouncing, stabilizes landings)
  tires: number;       // 0 - 5 (Increases road grip, stops slipping on steep slopes)
  fuelTank: number;    // 0 - 5 (Increases maximum fuel tank capacity)
}

export interface UpgradeInfo {
  name: string;
  level: number;
  maxLevel: number;
  cost: number;
  description: string;
}

export type BiomeType = 'meadow' | 'desert' | 'snow' | 'canyon';

export interface Collectible {
  id: number;
  x: number;
  y: number;
  type: 'coin' | 'fuel';
  value: number;
  collected: boolean;
  animOffset: number;
}

export interface BridgePlank {
  x: number;
  y: number;
  vy: number;
  targetY: number;
}

export interface Bridge {
  startX: number;
  endX: number;
  planks: BridgePlank[];
}

export interface RoadSign {
  x: number;
  distance: number;
  isFinish?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  type?: 'smoke' | 'spark' | 'coinStar' | 'dirt' | 'fuelDrop' | 'confetti';
  rotation?: number;
  vRot?: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
  lifetime: number;
  maxLifetime: number;
}

export interface GameStats {
  distance: number;
  bestDistance: number;
  coinsCollected: number;
  totalCoins: number;
  airTimeCurrent: number;
  bestAirTime: number;
  backflips: number;
  frontflips: number;
  stuntBonusPoints: number;
  gameOverReason: 'CRASH' | 'OUT_OF_FUEL' | 'FELL' | null;
  currentLevelId: number;
  currentLevelName: string;
  levelTargetDistance: number;
  levelRewardCoins: number;
  unlockedLevels: number;
}

export interface ControlsState {
  gas: boolean;
  brake: boolean;
  steerLeft?: boolean;
  steerRight?: boolean;
}
