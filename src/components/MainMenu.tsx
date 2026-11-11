import React from 'react';
import { Play, Wrench, HelpCircle, Trophy, Volume2, VolumeX, Grid, Mountain } from 'lucide-react';

interface MainMenuProps {
  onStartGame: () => void;
  onOpenLevelSelect: () => void;
  onOpenGarage: () => void;
  onOpenHowToPlay: () => void;
  currentLevelId: number;
  unlockedLevels: number;
  bestDistance: number;
  totalCoins: number;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onOpenLevelSelect,
  onOpenGarage,
  onOpenHowToPlay,
  currentLevelId,
  unlockedLevels,
  bestDistance,
  totalCoins,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md select-none overflow-y-auto">
      <div className="w-full max-w-md my-auto bg-slate-900/95 border border-slate-700/70 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Decorative Top Accent Glow */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-sky-400 via-emerald-400 to-indigo-500" />

        {/* Audio Mute in Corner */}
        <button
          onClick={onToggleMute}
          aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* Uploaded Silver Optimum Infinity Logo */}
        <div className="relative mb-3 flex flex-col items-center">
          <div className="w-32 h-16 sm:w-36 sm:h-20 flex items-center justify-center filter drop-shadow-[0_0_16px_rgba(255,255,255,0.4)]">
            <img
              src="/assets/aistudio/Screenshot_2026_1111_013101_29e1dc6a.png"
              alt="Optimum Logo"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase mb-1">
          OPTIMUM HILL CLIMB
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-medium mb-5">
          Conquer 10 progressive hills with Muscat in his custom offroad jeep!
        </p>

        {/* Muscat & Optimum Jeep Showcase Card */}
        <div className="w-full bg-slate-800/60 border border-slate-700/50 rounded-2xl p-3 mb-5 flex items-center gap-3.5">
          <div className="w-20 h-16 sm:w-24 sm:h-18 bg-slate-950/80 rounded-xl overflow-hidden border border-sky-500/30 flex items-center justify-center shrink-0 shadow-inner relative group">
            <img
              src="/assets/aistudio/file_00000000d4948211bbf79b968b683932_8a5f2596.png"
              alt="Muscat in Optimum Off-road Jeep"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="text-[10px] sm:text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>DRIVER & RIDE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            </div>
            <div className="text-base sm:text-lg font-black text-white leading-tight truncate">
              Muscat &bull; Optimum Jeep
            </div>
            <div className="text-xs text-slate-400 truncate mt-0.5">
              10 Progressive Levels & Bull-bar Spotlights
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="w-full grid grid-cols-2 gap-3 mb-5">
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 text-left">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-0.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Record</span>
            </div>
            <div className="text-xl font-black text-white tabular-nums">
              {bestDistance} <span className="text-xs font-normal text-slate-400">m</span>
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 text-left">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-0.5">
              <div className="w-4 h-3 flex items-center justify-center">
                <img
                  src="/assets/aistudio/Screenshot_2026_1111_013101_29e1dc6a.png"
                  alt="Coin"
                  className="w-full h-full object-contain"
                />
              </div>
              <span>Total Coins</span>
            </div>
            <div className="text-xl font-black text-amber-300 tabular-nums">
              {totalCoins}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={onStartGame}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-lg sm:text-xl tracking-wide uppercase transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer"
          >
            <Play className="w-6 h-6 fill-current" />
            <span>PLAY LEVEL {currentLevelId}</span>
          </button>

          <button
            onClick={onOpenLevelSelect}
            className="w-full py-3 px-4 rounded-xl bg-sky-600/90 hover:bg-sky-500 border border-sky-400/50 text-white font-bold text-sm tracking-wide uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-sky-600/20"
          >
            <Grid className="w-4 h-4 text-sky-200" />
            <span>10 GAME LEVELS ({unlockedLevels}/10 UNLOCKED)</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onOpenGarage}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700/80 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <Wrench className="w-4 h-4 text-sky-400" />
              <span>GARAGE</span>
            </button>

            <button
              onClick={onOpenHowToPlay}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700/80 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>HOW TO PLAY</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
