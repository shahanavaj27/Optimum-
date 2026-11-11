import React from 'react';
import { X, Zap, Shield, CircleDot, Fuel } from 'lucide-react';
import { VehicleUpgrades } from '../game/types.ts';

interface GarageModalProps {
  upgrades: VehicleUpgrades;
  totalCoins: number;
  onUpgrade: (type: keyof VehicleUpgrades, cost: number) => void;
  onClose: () => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({
  upgrades,
  totalCoins,
  onUpgrade,
  onClose,
}) => {
  const getUpgradeCost = (currentLevel: number): number => {
    const costs = [50, 120, 260, 550, 1100];
    return costs[currentLevel] ?? 9999;
  };

  const upgradeItems: {
    key: keyof VehicleUpgrades;
    name: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      key: 'engine',
      name: 'Engine Power',
      description: 'Increases top speed and steep hill-climbing torque',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      color: 'from-amber-500 to-orange-500',
    },
    {
      key: 'suspension',
      name: 'Suspension',
      description: 'Dampens harsh landing impacts and stabilizes ride',
      icon: <Shield className="w-5 h-5 text-sky-400" />,
      color: 'from-sky-500 to-indigo-500',
    },
    {
      key: 'tires',
      name: 'All-Terrain Tires',
      description: 'Enhances tire grip on steep inclines and bridges',
      icon: <CircleDot className="w-5 h-5 text-emerald-400" />,
      color: 'from-emerald-500 to-green-500',
    },
    {
      key: 'fuelTank',
      name: 'Extended Fuel Tank',
      description: 'Increases maximum fuel capacity for longer runs',
      icon: <Fuel className="w-5 h-5 text-red-400" />,
      color: 'from-red-500 to-rose-500',
    },
  ];

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none overflow-y-auto">
      <div className="w-full max-w-lg my-auto bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">JEEP GARAGE</h2>
            <p className="text-xs text-slate-400">Upgrade Muscat's jeep with Optimum Coins</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Coin balance */}
            <div className="bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <div className="w-5 h-4 flex items-center justify-center">
                <img
                  src="/assets/aistudio/Screenshot_2026_1111_013101_29e1dc6a.png"
                  alt="Coin"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-black text-base text-amber-300 tabular-nums">{totalCoins}</span>
            </div>

            <button
              onClick={onClose}
              aria-label="Close Garage"
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Upgrades List */}
        <div className="flex flex-col gap-3.5 mb-6">
          {upgradeItems.map((item) => {
            const level = upgrades[item.key];
            const maxLevel = 5;
            const isMax = level >= maxLevel;
            const cost = getUpgradeCost(level);
            const canAfford = totalCoins >= cost;

            return (
              <div
                key={item.key}
                className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                      {item.name}
                      <span className="text-xs text-slate-400 font-normal">
                        Lv {level}/{maxLevel}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">{item.description}</div>

                    {/* Level Progress Pip Bars */}
                    <div className="flex items-center gap-1.5 mt-2">
                      {Array.from({ length: maxLevel }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 w-5 sm:w-6 rounded-full transition-all ${
                            i < level
                              ? 'bg-gradient-to-r from-sky-400 to-emerald-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]'
                              : 'bg-slate-700/60'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="sm:self-center shrink-0">
                  {isMax ? (
                    <span className="inline-block py-2 px-4 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 font-bold text-xs uppercase tracking-wider">
                      MAX LEVEL
                    </span>
                  ) : (
                    <button
                      onClick={() => onUpgrade(item.key, cost)}
                      disabled={!canAfford}
                      className={`w-full sm:w-auto py-2 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        canAfford
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95'
                          : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
                      }`}
                    >
                      <span>UPGRADE</span>
                      <div className="flex items-center gap-1 font-black">
                        <span>{cost}</span>
                        <div className="w-3.5 h-3 flex items-center justify-center">
                          <img
                            src="/assets/aistudio/Screenshot_2026_1111_013101_29e1dc6a.png"
                            alt="Coin"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-sm tracking-wide transition-colors cursor-pointer"
        >
          BACK TO MENU
        </button>
      </div>
    </div>
  );
};
