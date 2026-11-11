import React from 'react';
import { ArrowRight, RotateCcw, Wrench, Grid, Trophy, Sparkles, CheckCircle2 } from 'lucide-react';
import { GameStats } from '../game/types.ts';

interface LevelCompleteModalProps {
  stats: GameStats;
  onNextLevel: () => void;
  onReplayLevel: () => void;
  onOpenLevelSelect: () => void;
  onOpenGarage: () => void;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  stats,
  onNextLevel,
  onReplayLevel,
  onOpenLevelSelect,
  onOpenGarage,
}) => {
  const isFinalLevel = stats.currentLevelId >= 10;
  const totalEarnedThisRun = stats.coinsCollected + stats.levelRewardCoins;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none overflow-y-auto">
      <div className="w-full max-w-md my-auto bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col items-center text-center relative overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Top Celebration Glow */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-400 via-sky-400 to-amber-400" />

        {/* Celebration Trophy Icon */}
        <div className="relative mb-3 flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Trophy className="w-8 h-8 text-amber-400 fill-amber-400/20 animate-bounce" />
          </div>
          <Sparkles className="w-5 h-5 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
        </div>

        {/* Badge & Title */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-black tracking-widest uppercase px-3 py-1 rounded-full mb-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>LEVEL {stats.currentLevelId} CLEARED</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            {stats.currentLevelName}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isFinalLevel
              ? 'All 10 peaks conquered! You are the Ultimate Optimum Champion!'
              : 'Flawless driving! Next level is now unlocked.'}
          </p>
        </div>

        {/* Reward Breakdown Box */}
        <div className="w-full bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 mb-5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Distance Conquered:</span>
            <span className="font-bold text-white tabular-nums">
              {stats.levelTargetDistance}m / {stats.levelTargetDistance}m
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>In-Race Coins:</span>
            <span className="font-bold text-sky-400 tabular-nums">
              +{stats.coinsCollected}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Level Clear Bonus:</span>
            <span className="font-bold text-amber-400 tabular-nums">
              +{stats.levelRewardCoins}
            </span>
          </div>

          <div className="border-t border-slate-700/80 pt-2 flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Total Coins Earned:
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-3.5 flex items-center justify-center">
                <img
                  src="/assets/aistudio/Screenshot_2026_1111_013101_29e1dc6a.png"
                  alt="Coin"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl font-black text-amber-300 tabular-nums">
                +{totalEarnedThisRun}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          {!isFinalLevel ? (
            <button
              onClick={onNextLevel}
              className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base sm:text-lg uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>NEXT LEVEL {stats.currentLevelId + 1}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onOpenLevelSelect}
              className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-base sm:text-lg uppercase tracking-wider transition-all shadow-lg shadow-amber-500/25 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trophy className="w-5 h-5 fill-current" />
              <span>CHAMPION LEVEL SELECT</span>
            </button>
          )}

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onReplayLevel}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors flex flex-col items-center justify-center gap-1 active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-sky-400" />
              <span>REPLAY</span>
            </button>

            <button
              onClick={onOpenLevelSelect}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors flex flex-col items-center justify-center gap-1 active:scale-95 cursor-pointer"
            >
              <Grid className="w-4 h-4 text-amber-400" />
              <span>LEVELS</span>
            </button>

            <button
              onClick={onOpenGarage}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors flex flex-col items-center justify-center gap-1 active:scale-95 cursor-pointer"
            >
              <Wrench className="w-4 h-4 text-emerald-400" />
              <span>GARAGE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
