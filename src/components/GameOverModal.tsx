import React from 'react';
import { RotateCcw, Wrench, Home, Trophy, Sparkles, Grid, AlertTriangle } from 'lucide-react';
import { GameStats } from '../game/types.ts';

interface GameOverModalProps {
  stats: GameStats;
  isNewRecord: boolean;
  onRestart: () => void;
  onOpenLevelSelect: () => void;
  onOpenGarage: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  isNewRecord,
  onRestart,
  onOpenLevelSelect,
  onOpenGarage,
  onHome,
}) => {
  const isOutOfFuel = stats.gameOverReason === 'OUT_OF_FUEL';
  const isFell = stats.gameOverReason === 'FELL';

  let statusBadge = 'HEAD IMPACT (DRIVER DOWN)';
  let statusTitle = 'DRIVER DOWN!';
  let statusColor = 'bg-red-500/20 text-red-400 border-red-500/30';
  let topBarColor = 'bg-red-500';

  if (isOutOfFuel) {
    statusBadge = 'FUEL DEPLETED';
    statusTitle = 'OUT OF FUEL!';
    statusColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    topBarColor = 'bg-amber-500';
  } else if (isFell) {
    statusBadge = 'CHASM HAZARD';
    statusTitle = 'FELL IN CHASM!';
    statusColor = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    topBarColor = 'bg-rose-500';
  }

  const levelProgressPct = Math.min(
    100,
    Math.round((stats.distance / stats.levelTargetDistance) * 100)
  );

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none overflow-y-auto">
      <div className="w-full max-w-md my-auto bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col items-center text-center relative overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Top Glow Bar */}
        <div className={`absolute top-0 inset-x-0 h-1.5 ${topBarColor}`} />

        {/* Status Badge & Title */}
        <div className="mb-4">
          <div className={`inline-flex items-center gap-1.5 text-xs font-black tracking-widest uppercase px-3 py-1 rounded-full mb-2 border ${statusColor}`}>
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{statusBadge}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            {statusTitle}
          </h2>
          <div className="text-xs text-sky-400 font-bold uppercase tracking-wider mt-1">
            Level {stats.currentLevelId}: {stats.currentLevelName}
          </div>
        </div>

        {/* Level Progress Bar toward Finish Line */}
        <div className="w-full bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 mb-4 text-left">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-slate-400">Finish Line Progress</span>
            <span className="text-white tabular-nums font-bold">
              {Math.round(stats.distance)}m / {stats.levelTargetDistance}m ({levelProgressPct}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all rounded-full"
              style={{ width: `${levelProgressPct}%` }}
            />
          </div>
        </div>

        {/* New Distance Record Banner */}
        {isNewRecord && (
          <div className="w-full mb-4 bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border border-amber-500/40 rounded-2xl p-2.5 flex items-center justify-center gap-2 text-amber-300 font-bold text-sm animate-pulse">
            <Trophy className="w-4 h-4 fill-current" />
            <span>NEW DISTANCE RECORD!</span>
            <Sparkles className="w-4 h-4" />
          </div>
        )}

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-3 mb-5">
          {/* Distance Reached */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-3.5 flex flex-col items-center justify-center">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
              Distance
            </span>
            <span className="text-2xl font-black text-white tabular-nums">
              {Math.round(stats.distance)}
              <span className="text-sm font-normal text-slate-400 ml-0.5">m</span>
            </span>
          </div>

          {/* Silver Optimum Coins Collected */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-3.5 flex flex-col items-center justify-center">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
              Coins Collected
            </span>
            <div className="flex items-center gap-2">
              <div className="w-5 h-4 flex items-center justify-center">
                <img
                  src="/assets/aistudio/Screenshot_2026_1111_013101_29e1dc6a.png"
                  alt="Coin"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-2xl font-black text-amber-300 tabular-nums">
                +{stats.coinsCollected}
              </span>
            </div>
          </div>

          {/* Stunt statistics */}
          {(stats.backflips > 0 || stats.frontflips > 0 || stats.bestAirTime > 0) && (
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-2.5 flex flex-col items-center justify-center col-span-2">
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-300">
                <span>Backflips: <b className="text-sky-400">{stats.backflips}</b></span>
                <span>Frontflips: <b className="text-indigo-400">{stats.frontflips}</b></span>
                <span>Air Time: <b className="text-emerald-400">{stats.bestAirTime.toFixed(1)}s</b></span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={onRestart}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>TRY LEVEL AGAIN</span>
          </button>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onOpenLevelSelect}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors flex flex-col items-center justify-center gap-1 active:scale-95 cursor-pointer"
            >
              <Grid className="w-4 h-4 text-sky-400" />
              <span>LEVELS</span>
            </button>

            <button
              onClick={onOpenGarage}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors flex flex-col items-center justify-center gap-1 active:scale-95 cursor-pointer"
            >
              <Wrench className="w-4 h-4 text-emerald-400" />
              <span>GARAGE</span>
            </button>

            <button
              onClick={onHome}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors flex flex-col items-center justify-center gap-1 active:scale-95 cursor-pointer"
            >
              <Home className="w-4 h-4 text-slate-400" />
              <span>MENU</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
