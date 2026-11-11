import React from 'react';
import { Volume2, VolumeX, Pause, RotateCcw, Gauge, Grid, Flag } from 'lucide-react';
import { GameStats } from '../game/types.ts';

interface GameHudProps {
  stats: GameStats;
  fuel: number;
  maxFuel: number;
  speed: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onRestart: () => void;
  onOpenLevelSelect?: () => void;
  onOpenGarage?: () => void;
  onOpenMenu?: () => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  stats,
  fuel,
  maxFuel,
  speed,
  isMuted,
  onToggleMute,
  onPause,
  onRestart,
  onOpenLevelSelect,
  onOpenGarage,
}) => {
  const fuelPercentage = Math.max(0, Math.min(100, (fuel / maxFuel) * 100));
  const isLowFuel = fuelPercentage < 22;
  const speedKmh = Math.round(Math.abs(speed) * 3.6);
  const targetDist = stats.levelTargetDistance || 400;
  const progressPct = Math.min(100, Math.round((stats.distance / targetDist) * 100));

  return (
    <header className="absolute top-0 left-0 right-0 z-20 pointer-events-none p-2.5 sm:p-4 select-none">
      <div className="max-w-6xl mx-auto flex flex-col gap-2">
        {/* Top Bar: Stats & Controls */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Distance & Coins */}
          <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
            {/* Distance Gauge */}
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-xl px-3 py-1.5 sm:px-3.5 sm:py-2 flex items-center gap-1.5 shadow-lg">
              <span className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-400 font-semibold">Dist</span>
              <span className="text-lg sm:text-2xl font-black text-white tabular-nums tracking-tight">
                {Math.round(stats.distance)}
                <span className="text-xs font-medium text-slate-400 ml-0.5">m</span>
              </span>
            </div>

            {/* Optimum Silver Infinity Coin Counter */}
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-xl px-3 py-1.5 sm:px-3.5 sm:py-2 flex items-center gap-2 shadow-lg">
              <div className="relative w-6 h-4 sm:w-7 sm:h-5 flex items-center justify-center">
                <img
                  src="/assets/aistudio/Screenshot_2026_1111_013101_29e1dc6a.png"
                  alt="Optimum Coin"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]"
                />
              </div>
              <span className="text-lg sm:text-2xl font-black text-amber-300 tabular-nums tracking-tight">
                {stats.coinsCollected}
              </span>
            </div>
          </div>

          {/* Center: Fuel Meter & Speed */}
          <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
            {/* Speedometer */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-xl px-3 py-1.5 sm:py-2 text-slate-300 shadow-lg">
              <Gauge className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-sm sm:text-base text-white tabular-nums">{speedKmh}</span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-medium">km/h</span>
            </div>

            {/* Fuel Bar */}
            <div
              className={`bg-slate-900/90 backdrop-blur-md border rounded-xl px-2.5 sm:px-3.5 py-1.5 sm:py-2 shadow-lg transition-all ${
                isLowFuel
                  ? 'border-red-500/80 bg-red-950/40 animate-pulse'
                  : 'border-slate-700/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2 sm:gap-3 text-[10px] sm:text-xs mb-1">
                <span className={`font-bold tracking-wider ${isLowFuel ? 'text-red-400' : 'text-slate-300'}`}>
                  {isLowFuel ? 'LOW FUEL!' : 'FUEL'}
                </span>
                <span className="font-semibold text-slate-400 tabular-nums">
                  {Math.round(fuelPercentage)}%
                </span>
              </div>
              <div className="w-20 sm:w-32 h-2 sm:h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                <div
                  className={`h-full rounded-full transition-all duration-100 ${
                    fuelPercentage > 45
                      ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                      : fuelPercentage > 20
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-400'
                      : 'bg-gradient-to-r from-red-600 to-red-400'
                  }`}
                  style={{ width: `${fuelPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
            {onOpenLevelSelect && (
              <button
                onClick={onOpenLevelSelect}
                aria-label="Select Level"
                className="px-2.5 py-1.5 sm:py-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/60 hover:bg-slate-800 text-amber-300 hover:text-white flex items-center gap-1.5 text-xs font-bold transition-colors shadow-lg active:scale-95 cursor-pointer"
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">LVL {stats.currentLevelId}</span>
              </button>
            )}

            {onOpenGarage && (
              <button
                onClick={onOpenGarage}
                aria-label="Open Garage"
                className="hidden md:flex px-2.5 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/60 hover:bg-slate-800 text-sky-300 hover:text-white items-center gap-1.5 text-xs font-bold transition-colors shadow-lg active:scale-95 cursor-pointer"
              >
                <span>GARAGE</span>
              </button>
            )}

            <button
              onClick={onToggleMute}
              aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors shadow-lg active:scale-95 cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onRestart}
              aria-label="Quick Restart"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors shadow-lg active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={onPause}
              aria-label="Pause Game"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors shadow-lg active:scale-95 cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Level Track Progress Indicator Bar */}
        <div className="w-full flex items-center justify-between gap-3 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-xl px-3 py-1.5 shadow-md pointer-events-auto">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shrink-0" />
            <span className="text-xs font-bold text-white truncate">
              Level {stats.currentLevelId}: {stats.currentLevelName}
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-24 sm:w-44 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-150 rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-300">
              <Flag className="w-3 h-3 text-amber-400" />
              <span>{Math.round(stats.distance)}/{targetDist}m</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
