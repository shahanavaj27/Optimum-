import React from 'react';
import { Zap, Disc } from 'lucide-react';
import { ControlsState } from '../game/types.ts';

interface ControlsOverlayProps {
  controls: ControlsState;
  onSetGas: (pressed: boolean) => void;
  onSetBrake: (pressed: boolean) => void;
}

export const ControlsOverlay: React.FC<ControlsOverlayProps> = ({
  controls,
  onSetGas,
  onSetBrake,
}) => {
  return (
    <div
      className="absolute inset-x-0 bottom-0 z-30 pointer-events-none p-4 sm:p-7 pb-5 sm:pb-9 select-none flex items-end justify-between"
      style={{ touchAction: 'none' }}
    >
      {/* Bottom Left: Large BRAKE Pedal */}
      <div className="pointer-events-auto">
        <button
          type="button"
          aria-label="Brake and Reverse"
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSetBrake(true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSetBrake(false);
          }}
          onTouchCancel={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSetBrake(false);
          }}
          onPointerDown={(e) => {
            e.preventDefault();
            onSetBrake(true);
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            onSetBrake(false);
          }}
          onPointerCancel={(e) => {
            e.preventDefault();
            onSetBrake(false);
          }}
          onPointerLeave={(e) => {
            if (e.buttons > 0) onSetBrake(false);
          }}
          onContextMenu={(e) => e.preventDefault()}
          className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-3 flex flex-col items-center justify-center shadow-2xl transition-all duration-75 active:scale-95 cursor-pointer touch-none select-none ${
            controls.brake
              ? 'bg-red-600 border-red-200 text-white translate-y-1 shadow-red-500/50 ring-4 ring-red-400/50'
              : 'bg-slate-900/90 border-red-500/60 text-slate-100 hover:border-red-400 hover:bg-slate-800/95 backdrop-blur-md shadow-black/60'
          }`}
        >
          <Disc className="w-8 h-8 sm:w-10 sm:h-10 text-red-400 mb-0.5" />
          <span className="font-black text-xs sm:text-sm tracking-wider uppercase text-white">
            BRAKE
          </span>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            [◄ / A]
          </span>
        </button>
      </div>

      {/* Bottom Right: Large ACCELERATOR Pedal */}
      <div className="pointer-events-auto">
        <button
          type="button"
          aria-label="Accelerator"
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSetGas(true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSetGas(false);
          }}
          onTouchCancel={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSetGas(false);
          }}
          onPointerDown={(e) => {
            e.preventDefault();
            onSetGas(true);
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            onSetGas(false);
          }}
          onPointerCancel={(e) => {
            e.preventDefault();
            onSetGas(false);
          }}
          onPointerLeave={(e) => {
            if (e.buttons > 0) onSetGas(false);
          }}
          onContextMenu={(e) => e.preventDefault()}
          className={`w-26 h-26 sm:w-32 sm:h-32 rounded-3xl border-3 flex flex-col items-center justify-center shadow-2xl transition-all duration-75 active:scale-95 cursor-pointer touch-none select-none ${
            controls.gas
              ? 'bg-emerald-600 border-emerald-200 text-white translate-y-1 shadow-emerald-500/50 ring-4 ring-emerald-400/50'
              : 'bg-slate-900/90 border-emerald-500/60 text-slate-100 hover:border-emerald-400 hover:bg-slate-800/95 backdrop-blur-md shadow-black/60'
          }`}
        >
          <Zap className="w-9 h-9 sm:w-11 sm:h-11 text-emerald-400 fill-emerald-400/30 mb-0.5" />
          <span className="font-black text-sm sm:text-base tracking-wider uppercase text-white">
            GAS
          </span>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            [► / D]
          </span>
        </button>
      </div>
    </div>
  );
};
