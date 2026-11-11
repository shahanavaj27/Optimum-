import React, { useEffect, useRef, useState, useCallback } from 'react';
import { assetManager } from './game/assets.ts';
import { sound } from './game/audio.ts';
import { GAME_LEVELS, GameLevel, getLevelById } from './game/levels.ts';
import { VehiclePhysics } from './game/physics.ts';
import { GameRenderer } from './game/renderer.ts';
import { TerrainManager } from './game/terrain.ts';
import { ControlsState, GameState, GameStats, VehicleUpgrades } from './game/types.ts';
import { ControlsOverlay } from './components/ControlsOverlay.tsx';
import { GameHud } from './components/GameHud.tsx';
import { GameOverModal } from './components/GameOverModal.tsx';
import { GarageModal } from './components/GarageModal.tsx';
import { HowToPlayModal } from './components/HowToPlayModal.tsx';
import { LevelCompleteModal } from './components/LevelCompleteModal.tsx';
import { LevelSelectModal } from './components/LevelSelectModal.tsx';
import { MainMenu } from './components/MainMenu.tsx';
import { PauseModal } from './components/PauseModal.tsx';

const DEFAULT_UPGRADES: VehicleUpgrades = {
  engine: 0,
  suspension: 0,
  tires: 0,
  fuelTank: 0,
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Persistent Unlocked Levels & Current Level
  const [unlockedLevels, setUnlockedLevels] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem('optimum_unlocked_levels'));
      return saved && saved >= 1 ? Math.min(10, Math.max(1, saved)) : 1;
    } catch {
      return 1;
    }
  });

  const [currentLevel, setCurrentLevel] = useState<GameLevel>(() => {
    try {
      const savedLvl = Number(localStorage.getItem('optimum_current_level'));
      return savedLvl ? getLevelById(savedLvl) : GAME_LEVELS[0];
    } catch {
      return GAME_LEVELS[0];
    }
  });

  // Game Engine Instances (2D Side-Scrolling Physics)
  const rendererRef = useRef<GameRenderer | null>(null);
  const physicsRef = useRef<VehiclePhysics>(new VehiclePhysics());
  const terrainRef = useRef<TerrainManager>(new TerrainManager(currentLevel));

  // React State
  const [gameState, setGameState] = useState<GameState>('PLAYING');
  const [showMainMenu, setShowMainMenu] = useState<boolean>(false);
  const [showGarage, setShowGarage] = useState<boolean>(false);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);
  const [showLevelSelect, setShowLevelSelect] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);
  const [hasDrivenYet, setHasDrivenYet] = useState<boolean>(false);

  // Persistent Player Stats & Upgrades
  const [upgrades, setUpgrades] = useState<VehicleUpgrades>(() => {
    try {
      const saved = localStorage.getItem('optimum_upgrades');
      return saved ? JSON.parse(saved) : DEFAULT_UPGRADES;
    } catch {
      return DEFAULT_UPGRADES;
    }
  });

  const [stats, setStats] = useState<GameStats>(() => {
    let bestDist = 0;
    let totalC = 0;
    try {
      bestDist = Number(localStorage.getItem('optimum_best_distance')) || 0;
      totalC = Number(localStorage.getItem('optimum_total_coins')) || 0;
    } catch {}
    return {
      distance: 0,
      bestDistance: bestDist,
      coinsCollected: 0,
      totalCoins: totalC,
      airTimeCurrent: 0,
      bestAirTime: 0,
      backflips: 0,
      frontflips: 0,
      stuntBonusPoints: 0,
      gameOverReason: null,
      currentLevelId: currentLevel.id,
      currentLevelName: currentLevel.name,
      levelTargetDistance: currentLevel.targetDistance,
      levelRewardCoins: currentLevel.rewardCoins,
      unlockedLevels: 1,
    };
  });

  // Real-time Controls State
  const controlsRef = useRef<ControlsState>({ gas: false, brake: false });
  const [controlsUI, setControlsUI] = useState<ControlsState>({ gas: false, brake: false });

  // HUD values updated at throttled frame rate for React
  const [hudFuel, setHudFuel] = useState<number>(100);
  const [hudMaxFuel, setHudMaxFuel] = useState<number>(100);
  const [hudSpeed, setHudSpeed] = useState<number>(0);

  // Animation frame loop ID
  const animFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const gameOverTimeoutRef = useRef<number | null>(null);
  const levelCompletedRef = useRef<boolean>(false);

  // Preload image assets on mount
  useEffect(() => {
    assetManager.load().catch((err) => {
      console.warn('Asset loader warning:', err);
    });
  }, []);

  // Update controls helper with immediate ref & state synchronization
  const setGas = useCallback((pressed: boolean) => {
    controlsRef.current.gas = pressed;
    if (pressed) setHasDrivenYet(true);
    setControlsUI((prev) => (prev.gas !== pressed ? { ...prev, gas: pressed } : prev));
  }, []);

  const setBrake = useCallback((pressed: boolean) => {
    controlsRef.current.brake = pressed;
    if (pressed) setHasDrivenYet(true);
    setControlsUI((prev) => (prev.brake !== pressed ? { ...prev, brake: pressed } : prev));
  }, []);

  // Safety global touch release listener
  useEffect(() => {
    const handleGlobalTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        controlsRef.current.gas = false;
        controlsRef.current.brake = false;
        setControlsUI({ gas: false, brake: false });
      }
    };
    window.addEventListener('touchend', handleGlobalTouchEnd);
    window.addEventListener('touchcancel', handleGlobalTouchEnd);
    return () => {
      window.removeEventListener('touchend', handleGlobalTouchEnd);
      window.removeEventListener('touchcancel', handleGlobalTouchEnd);
    };
  }, []);

  // Canvas resize handler
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && rendererRef.current) {
        const parent = canvasRef.current.parentElement;
        const width = parent ? parent.clientWidth : window.innerWidth;
        const height = parent ? parent.clientHeight : window.innerHeight;
        rendererRef.current.resize(width, height);
      }
    };

    if (canvasRef.current) {
      rendererRef.current = new GameRenderer(canvasRef.current);
      handleResize();
      rendererRef.current.resetCamera(physicsRef.current.x, physicsRef.current.y);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sound toggle
  const toggleMute = useCallback(() => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  }, []);

  // Start / Restart Game for a given level
  const startLevel = useCallback((level: GameLevel) => {
    if (gameOverTimeoutRef.current) {
      clearTimeout(gameOverTimeoutRef.current);
      gameOverTimeoutRef.current = null;
    }
    levelCompletedRef.current = false;

    setCurrentLevel(level);
    try {
      localStorage.setItem('optimum_current_level', String(level.id));
    } catch {}

    setIsNewRecord(false);
    controlsRef.current = { gas: false, brake: false };
    setControlsUI({ gas: false, brake: false });

    // Setup level terrain and vehicle
    terrainRef.current.setLevel(level);
    physicsRef.current.reset(upgrades);

    if (rendererRef.current) {
      rendererRef.current.resetCamera(physicsRef.current.x, physicsRef.current.y);
    }

    setStats((prev) => ({
      ...prev,
      distance: 0,
      coinsCollected: 0,
      airTimeCurrent: 0,
      bestAirTime: 0,
      backflips: 0,
      frontflips: 0,
      stuntBonusPoints: 0,
      gameOverReason: null,
      currentLevelId: level.id,
      currentLevelName: level.name,
      levelTargetDistance: level.targetDistance,
      levelRewardCoins: level.rewardCoins,
      unlockedLevels: unlockedLevels,
    }));

    setHudFuel(physicsRef.current.maxFuel);
    setHudMaxFuel(physicsRef.current.maxFuel);
    setHudSpeed(0);

    setGameState('PLAYING');
    setShowMainMenu(false);
    setShowGarage(false);
    setShowHowToPlay(false);
    setShowLevelSelect(false);
    sound.startEngine();
  }, [upgrades, unlockedLevels]);

  const restartCurrentLevel = useCallback(() => {
    startLevel(currentLevel);
  }, [startLevel, currentLevel]);

  const handleNextLevel = useCallback(() => {
    const nextId = currentLevel.id + 1;
    if (nextId <= 10) {
      const nextLevel = getLevelById(nextId);
      startLevel(nextLevel);
    } else {
      setShowLevelSelect(true);
    }
  }, [currentLevel, startLevel]);

  // Pause game
  const pauseGame = useCallback(() => {
    if (gameState === 'PLAYING') {
      setGameState('PAUSED');
      sound.stopEngine();
    }
  }, [gameState]);

  // Resume game
  const resumeGame = useCallback(() => {
    if (gameState === 'PAUSED') {
      lastTimeRef.current = performance.now();
      setGameState('PLAYING');
      sound.startEngine();
    }
  }, [gameState]);

  // Upgrade handler
  const handleUpgrade = useCallback((type: keyof VehicleUpgrades, cost: number) => {
    setStats((prev) => {
      if (prev.totalCoins < cost) return prev;
      const newTotal = prev.totalCoins - cost;
      try {
        localStorage.setItem('optimum_total_coins', String(newTotal));
      } catch {}

      setUpgrades((prevUpg) => {
        const updated = {
          ...prevUpg,
          [type]: prevUpg[type] + 1,
        };
        try {
          localStorage.setItem('optimum_upgrades', JSON.stringify(updated));
        } catch {}
        physicsRef.current.upgrades = updated;
        return updated;
      });

      return {
        ...prev,
        totalCoins: newTotal,
      };
    });
  }, []);

  // Keyboard controls listener (Hill Climb Racing controls: Right arrow/D for Gas, Left arrow/A for Brake)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        setGas(true);
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault();
        setBrake(true);
      } else if (e.code === 'KeyP' || e.code === 'Escape') {
        e.preventDefault();
        if (gameState === 'PLAYING') pauseGame();
        else if (gameState === 'PAUSED') resumeGame();
      } else if (e.code === 'KeyR' && (gameState === 'PLAYING' || gameState === 'GAMEOVER')) {
        e.preventDefault();
        restartCurrentLevel();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        setGas(false);
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        setBrake(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, pauseGame, resumeGame, setGas, setBrake, restartCurrentLevel]);

  // Main 60 FPS Game Loop
  useEffect(() => {
    let lastHudUpdate = 0;

    const gameLoop = (currentTime: number) => {
      const rawDt = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;
      const dt = Math.min(rawDt, 0.05);

      const vehicle = physicsRef.current;
      const terrain = terrainRef.current;
      const renderer = rendererRef.current;

      if (renderer) {
        if (gameState === 'PLAYING') {
          // 1. Update vehicle physics (deterministic step)
          const physicsResult = vehicle.update(controlsRef.current, terrain, dt);

          // 2. Update procedural terrain chunk generation ahead of car
          terrain.update(vehicle.x);

          // 3. Stunts notifications
          for (const stuntName of physicsResult.stuntsCompleted) {
            const bonus = 100;
            renderer.addFloatingText(vehicle.x, vehicle.y - 65, `${stuntName} +${bonus}`, '#facc15');

            setStats((prev) => {
              const newTotalCoins = prev.totalCoins + bonus;
              try {
                localStorage.setItem('optimum_total_coins', String(newTotalCoins));
              } catch {}

              return {
                ...prev,
                coinsCollected: prev.coinsCollected + bonus,
                totalCoins: newTotalCoins,
                stuntBonusPoints: prev.stuntBonusPoints + bonus,
                backflips: stuntName.includes('BACKFLIP') ? prev.backflips + 1 : prev.backflips,
                frontflips: stuntName.includes('FRONTFLIP') ? prev.frontflips + 1 : prev.frontflips,
                bestAirTime: Math.max(prev.bestAirTime, vehicle.airTimeTimer),
              };
            });
          }

          // 4. Collectibles Collision Check (Chassis + Wheels)
          // Generous hit detection for 50% larger silver Optimum coins
          const collectibles = terrain.getCollectibles();
          for (const item of collectibles) {
            if (item.collected) continue;

            const distC = Math.hypot(vehicle.x - item.x, vehicle.y - item.y);
            const distR = Math.hypot(vehicle.rearWheel.x - item.x, vehicle.rearWheel.y - item.y);
            const distF = Math.hypot(vehicle.frontWheel.x - item.x, vehicle.frontWheel.y - item.y);
            const minDist = Math.min(distC, distR, distF);

            if (minDist < 58) {
              item.collected = true;

              if (item.type === 'coin') {
                sound.playCoin();
                renderer.addCoinSparkles(item.x, item.y);
                renderer.addFloatingText(item.x, item.y - 25, '+25', '#38bdf8');

                setStats((prev) => {
                  const newTotal = prev.totalCoins + 25;
                  try {
                    localStorage.setItem('optimum_total_coins', String(newTotal));
                  } catch {}
                  return {
                    ...prev,
                    coinsCollected: prev.coinsCollected + 25,
                    totalCoins: newTotal,
                  };
                });
              } else if (item.type === 'fuel') {
                sound.playFuel();
                vehicle.refillFuel(item.value);
                renderer.addFuelSplash(item.x, item.y);
                renderer.addFloatingText(item.x, item.y - 30, 'FUEL REFILLED!', '#ef4444');
              }
            }
          }

          // 5. Update Distance Traveled
          const currentDistMeters = Math.max(0, Math.floor(vehicle.x / 30));
          setStats((prev) => {
            if (currentDistMeters > prev.distance) {
              return { ...prev, distance: currentDistMeters };
            }
            return prev;
          });

          // 6. Check Level Completion (Finish Line Crossing!)
          const finishX = terrain.getFinishX();
          if (vehicle.x >= finishX && !levelCompletedRef.current && !vehicle.isCrashed) {
            levelCompletedRef.current = true;
            sound.stopEngine();
            sound.playLevelComplete();
            renderer.addConfetti(vehicle.x, vehicle.y);
            renderer.addFloatingText(vehicle.x, vehicle.y - 70, `FINISH! +${currentLevel.rewardCoins}`, '#f59e0b');

            // Unlock next level & award completion bonus
            const newUnlocked = Math.min(10, Math.max(unlockedLevels, currentLevel.id + 1));
            setUnlockedLevels(newUnlocked);
            try {
              localStorage.setItem('optimum_unlocked_levels', String(newUnlocked));
            } catch {}

            setStats((prev) => {
              const newTotal = prev.totalCoins + currentLevel.rewardCoins;
              try {
                localStorage.setItem('optimum_total_coins', String(newTotal));
              } catch {}
              return {
                ...prev,
                totalCoins: newTotal,
                unlockedLevels: newUnlocked,
              };
            });

            // Transition to Level Complete Screen after celebratory pause
            window.setTimeout(() => {
              setGameState('LEVEL_COMPLETE');
            }, 850);
          }

          // 7. Check Player Death & Game Over Trigger
          if (
            (vehicle.isCrashed || vehicle.isOutOfFuel) &&
            !gameOverTimeoutRef.current &&
            !levelCompletedRef.current
          ) {
            sound.stopEngine();
            if (vehicle.isCrashed) {
              renderer.addCrashExplosion(vehicle.headX, vehicle.headY);
            }

            gameOverTimeoutRef.current = window.setTimeout(() => {
              setStats((prev) => {
                const isRecord = currentDistMeters > prev.bestDistance;
                if (isRecord) {
                  setIsNewRecord(true);
                  try {
                    localStorage.setItem('optimum_best_distance', String(currentDistMeters));
                  } catch {}
                }

                return {
                  ...prev,
                  bestDistance: Math.max(prev.bestDistance, currentDistMeters),
                  gameOverReason: vehicle.crashReason,
                };
              });
              setGameState('GAMEOVER');
              gameOverTimeoutRef.current = null;
            }, 850);
          }

          // Throttled HUD update for React (every 75ms)
          if (currentTime - lastHudUpdate > 75) {
            lastHudUpdate = currentTime;
            setHudFuel(vehicle.fuel);
            setHudMaxFuel(vehicle.maxFuel);
            setHudSpeed(vehicle.vx);
          }

          // Update particles and render scene
          renderer.updateParticles(dt);
          renderer.render(vehicle, terrain, controlsRef.current.gas, dt);
        } else {
          // Render paused or modal background
          renderer.render(vehicle, terrain, false, dt);
        }
      }

      animFrameId.current = requestAnimationFrame(gameLoop);
    };

    animFrameId.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [gameState, currentLevel, unlockedLevels]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none touch-none">
      {/* 2D Physics Game Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-default"
      />

      {/* In-Game HUD (Always visible during gameplay) */}
      <GameHud
        stats={stats}
        fuel={hudFuel}
        maxFuel={hudMaxFuel}
        speed={hudSpeed}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        onPause={pauseGame}
        onRestart={restartCurrentLevel}
        onOpenLevelSelect={() => setShowLevelSelect(true)}
        onOpenGarage={() => setShowGarage(true)}
      />

      {/* Start prompt banner if player hasn't moved yet */}
      {!hasDrivenYet && gameState === 'PLAYING' && (
        <div className="absolute top-28 inset-x-0 z-20 pointer-events-none flex justify-center px-4 animate-bounce">
          <div className="bg-slate-900/90 border border-emerald-500/60 rounded-2xl px-5 py-2.5 shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs sm:text-sm font-black tracking-wide text-white uppercase">
              HOLD ACCELERATOR TO CLIMB LEVEL {currentLevel.id}
            </span>
            <span className="hidden sm:inline text-xs text-slate-400 font-mono">
              [► / D]
            </span>
          </div>
        </div>
      )}

      {/* Large Touch Pedals: ACCELERATOR & BRAKE */}
      {gameState === 'PLAYING' && (
        <ControlsOverlay
          controls={controlsUI}
          onSetGas={setGas}
          onSetBrake={setBrake}
        />
      )}

      {/* Main Menu Modal */}
      {showMainMenu && (
        <MainMenu
          onStartGame={() => startLevel(currentLevel)}
          onOpenLevelSelect={() => {
            setShowMainMenu(false);
            setShowLevelSelect(true);
          }}
          onOpenGarage={() => {
            setShowMainMenu(false);
            setShowGarage(true);
          }}
          onOpenHowToPlay={() => {
            setShowMainMenu(false);
            setShowHowToPlay(true);
          }}
          currentLevelId={currentLevel.id}
          unlockedLevels={unlockedLevels}
          bestDistance={stats.bestDistance}
          totalCoins={stats.totalCoins}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      )}

      {/* 10 Game Levels Selector Modal */}
      {showLevelSelect && (
        <LevelSelectModal
          currentLevelId={currentLevel.id}
          unlockedLevels={unlockedLevels}
          onSelectLevel={(lvl) => startLevel(lvl)}
          onClose={() => setShowLevelSelect(false)}
        />
      )}

      {/* Level Complete Screen Modal */}
      {gameState === 'LEVEL_COMPLETE' && (
        <LevelCompleteModal
          stats={stats}
          onNextLevel={handleNextLevel}
          onReplayLevel={restartCurrentLevel}
          onOpenLevelSelect={() => setShowLevelSelect(true)}
          onOpenGarage={() => setShowGarage(true)}
        />
      )}

      {/* Garage / Upgrades Modal */}
      {showGarage && (
        <GarageModal
          upgrades={upgrades}
          totalCoins={stats.totalCoins}
          onUpgrade={handleUpgrade}
          onClose={() => setShowGarage(false)}
        />
      )}

      {/* How to Play Guide Modal */}
      {showHowToPlay && (
        <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
      )}

      {/* Pause Menu Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={resumeGame}
          onRestart={restartCurrentLevel}
          onOpenLevelSelect={() => {
            setGameState('PLAYING');
            setShowLevelSelect(true);
          }}
          onHome={() => {
            setShowMainMenu(true);
            setGameState('PLAYING');
          }}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      )}

      {/* Game Over Screen Modal */}
      {gameState === 'GAMEOVER' && (
        <GameOverModal
          stats={stats}
          isNewRecord={isNewRecord}
          onRestart={restartCurrentLevel}
          onOpenLevelSelect={() => setShowLevelSelect(true)}
          onOpenGarage={() => setShowGarage(true)}
          onHome={() => {
            setShowMainMenu(true);
            setGameState('PLAYING');
          }}
        />
      )}
    </main>
  );
}
