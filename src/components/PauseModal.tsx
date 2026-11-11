import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, Grid } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenLevelSelect: () => void;
  onHome: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onOpenLevelSelect,
  onHome,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none overflow-y-auto">
      <div className="w-full max-w-sm my-auto bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col items-center text-center">
        <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">GAME PAUSED</h2>
        <p className="text-xs text-slate-400 mb-6">Muscat is taking a quick pit stop</p>

        <div className="w-full flex flex-col gap-2.5 mb-6">
          <button
            onClick={onResume}
            className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>RESUME</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold text-sm tracking-wide transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-sky-400" />
            <span>RESTART LEVEL</span>
          </button>

          <button
            onClick={onOpenLevelSelect}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold text-sm tracking-wide transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Grid className="w-4 h-4 text-amber-400" />
            <span>SELECT LEVEL (10)</span>
          </button>

          <button
            onClick={onHome}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold text-sm tracking-wide transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4 text-slate-400" />
            <span>MAIN MENU</span>
          </button>
        </div>

        {/* Audio Mute in Pause Menu */}
        <button
          onClick={onToggleMute}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer py-1.5 px-3 rounded-lg bg-slate-800/60"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          <span>{isMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}</span>
        </button>
      </div>
    </div>
  );
};
