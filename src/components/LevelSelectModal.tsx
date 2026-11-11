import React from 'react';
import { X, Lock, CheckCircle2, Trophy, Play, Mountain } from 'lucide-react';
import { GAME_LEVELS, GameLevel } from '../game/levels.ts';

interface LevelSelectModalProps {
  currentLevelId: number;
  unlockedLevels: number;
  onSelectLevel: (level: GameLevel) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  currentLevelId,
  unlockedLevels,
  onSelectLevel,
  onClose,
}) => {
  const getBiomeBadge = (biome: GameLevel['biome']) => {
    switch (biome) {
      case 'meadow':
        return { label: 'Meadow', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'desert':
        return { label: 'Desert', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'snow':
        return { label: 'Alpine', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
      case 'canyon':
        return { label: 'Canyon', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md select-none overflow-y-auto">
      <div className="w-full max-w-2xl my-auto bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col relative overflow-hidden max-h-[92vh]">
        {/* Top Accent Strip */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-sky-400 via-emerald-400 to-indigo-500" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
              <Mountain className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                SELECT LEVEL
              </h2>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>10 Progressive Challenges</span>
                <span className="w-1 h-1 rounded-full bg-slate-500" />
                <span className="text-emerald-400 font-bold">
                  {unlockedLevels} / 10 Unlocked
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Levels Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-y-auto pr-1 flex-1 py-1">
          {GAME_LEVELS.map((lvl) => {
            const isUnlocked = lvl.id <= unlockedLevels;
            const isCurrent = lvl.id === currentLevelId;
            const isCleared = lvl.id < unlockedLevels;
            const badge = getBiomeBadge(lvl.biome);

            return (
              <button
                key={lvl.id}
                disabled={!isUnlocked}
                onClick={() => isUnlocked && onSelectLevel(lvl)}
                className={`text-left rounded-2xl p-3.5 border transition-all flex flex-col justify-between relative overflow-hidden cursor-pointer ${
                  !isUnlocked
                    ? 'bg-slate-900/50 border-slate-800/80 opacity-50 cursor-not-allowed'
                    : isCurrent
                    ? 'bg-gradient-to-br from-sky-950/80 via-slate-900 to-slate-900 border-sky-500 shadow-lg shadow-sky-500/10'
                    : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 hover:border-slate-600'
                }`}
              >
                {/* Level Tag Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                        isCurrent
                          ? 'bg-sky-500 text-slate-950'
                          : isUnlocked
                          ? 'bg-slate-700 text-white'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {lvl.id}
                    </span>
                    <span className="font-bold text-sm text-white truncate max-w-[150px] sm:max-w-[170px]">
                      {lvl.name}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  {!isUnlocked ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Locked</span>
                    </span>
                  ) : isCurrent ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
                      <Play className="w-3 h-3 fill-current" />
                      <span>Active</span>
                    </span>
                  ) : isCleared ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Cleared</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-amber-400">
                      Unlocked
                    </span>
                  )}
                </div>

                {/* Subtitle */}
                <p className="text-xs text-slate-400 line-clamp-1 mb-3">
                  {lvl.subtitle}
                </p>

                {/* Footer specs */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.color}`}>
                    {badge.label}
                  </span>

                  <div className="flex items-center gap-3">
                    <span className="text-slate-300 font-mono text-[11px]">
                      🏁 {lvl.targetDistance}m
                    </span>
                    <div className="flex items-center gap-1 text-amber-300 font-bold text-[11px]">
                      <Trophy className="w-3 h-3 text-amber-400" />
                      <span>+{lvl.rewardCoins}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
