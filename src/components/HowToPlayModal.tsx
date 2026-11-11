import React from 'react';
import { X, ArrowRight, ArrowLeft, Fuel, ShieldAlert, Award } from 'lucide-react';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none overflow-y-auto">
      <div className="w-full max-w-lg my-auto bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl relative">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">HOW TO PLAY</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 text-xs sm:text-sm text-slate-300 mb-6">
          {/* Controls */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
            <h3 className="font-bold text-white uppercase tracking-wider text-xs mb-3 text-sky-400">
              Driving & Air Balance
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/40">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-1">
                  <ArrowRight className="w-4 h-4" />
                  <span>GAS / ACCEL</span>
                </div>
                <p className="text-slate-400">Press right pedal or [►] / [D]. In air, tilts nose UP.</p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/40">
                <div className="flex items-center gap-1.5 font-bold text-red-400 mb-1">
                  <ArrowLeft className="w-4 h-4" />
                  <span>BRAKE / REV</span>
                </div>
                <p className="text-slate-400">Press left pedal or [◄] / [A]. In air, tilts nose DOWN.</p>
              </div>
            </div>
          </div>

          {/* Objectives */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Optimum Coin */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 border border-slate-700/80">
                <div className="w-6 h-4 flex items-center justify-center">
                  <img
                    src="/assets/aistudio/Screenshot_2026_1111_013101_29e1dc6a.png"
                    alt="Coin"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-white text-xs mb-0.5">Optimum Coins</h4>
                <p className="text-slate-400 text-xs">
                  Collect silver infinity coins to purchase vehicle upgrades in the garage.
                </p>
              </div>
            </div>

            {/* Fuel */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 border border-slate-700/80 text-red-400">
                <Fuel className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-xs mb-0.5">Fuel Cans</h4>
                <p className="text-slate-400 text-xs">
                  Keep an eye on the fuel bar! Grab red jerry cans before your engine runs dry.
                </p>
              </div>
            </div>

            {/* Stunts */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 border border-slate-700/80 text-amber-400">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-xs mb-0.5">Flips & Airtime</h4>
                <p className="text-slate-400 text-xs">
                  Perform full 360° backflips and frontflips in the air for bonus stunt coins!
                </p>
              </div>
            </div>

            {/* Crash Warning */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 border border-slate-700/80 text-rose-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-xs mb-0.5">Protect Muscat</h4>
                <p className="text-slate-400 text-xs">
                  If the jeep rolls over and Muscat's head touches the terrain, the run is over!
                </p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide uppercase transition-colors cursor-pointer"
        >
          GOT IT, LET'S RACE!
        </button>
      </div>
    </div>
  );
};
