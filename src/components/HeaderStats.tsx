import React from 'react';
import { Target, TrendingDown, ShieldAlert, Droplets, Clock, Zap } from 'lucide-react';
import { UserSettings, WeightLog } from '../types';

interface HeaderStatsProps {
  settings: UserSettings;
  weightLogs: WeightLog[];
  waterMl: number;
}

export const HeaderStats: React.FC<HeaderStatsProps> = ({
  settings,
  weightLogs,
  waterMl,
}) => {
  const latestWeight = weightLogs.length > 0 
    ? weightLogs[weightLogs.length - 1].weight 
    : settings.start_weight;

  const totalLost = Math.max(0, Number((settings.start_weight - latestWeight).toFixed(1)));
  const remaining = Math.max(0, Number((latestWeight - settings.target_weight).toFixed(1)));
  
  // Total progress percentage (from 105 to 90 = 15kg total delta)
  const totalGoalDelta = settings.start_weight - settings.target_weight; // 15kg
  const progressPercent = Math.min(100, Math.max(0, Math.round((totalLost / totalGoalDelta) * 100)));

  // Spinal load relief: 1kg body weight lost = ~4kg less pressure on lumbar spine!
  const spinePressureReliefKg = (totalLost * 4).toFixed(1);

  // Fasting window check (12:00 to 20:00)
  const now = new Date();
  const currentHour = now.getHours();
  const isEatingWindow = currentHour >= 12 && currentHour < 20;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Weight & Target Card */}
      <div className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800/80 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Τρέχον Βάρος</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">{latestWeight.toFixed(1)}</span>
          <span className="text-sm font-medium text-slate-400">kg</span>
          <span className="text-xs text-slate-500 ml-auto">Αρχικό: {settings.start_weight} kg</span>
        </div>
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Στόχος: {settings.target_weight} kg</span>
            <span className="text-emerald-400 font-semibold">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, progressPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Weight Lost & Distance */}
      <div className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800/80 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Απώλεια Βάρους</span>
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-teal-400 tracking-tight">-{totalLost}</span>
          <span className="text-sm font-medium text-slate-400">kg</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
          <span>Απομένουν:</span>
          <span className="font-semibold text-amber-400">{remaining} kg για τα 90kg</span>
        </div>
      </div>

      {/* 3. Spinal Pressure Relief */}
      <div className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800/80 relative overflow-hidden bg-gradient-to-br from-slate-900/60 to-indigo-950/20">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Αποφόρτιση Μέσης</span>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-indigo-400 tracking-tight">-{spinePressureReliefKg}</span>
          <span className="text-sm font-medium text-slate-400">kg φορτίου</span>
        </div>
        <div className="mt-3 text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
          ✨ <span className="text-indigo-300 font-medium">1kg απώλεια</span> = <span className="text-indigo-300 font-medium">4kg λιγότερη πίεση</span> στους σπονδύλους.
        </div>
      </div>

      {/* 4. Live Fasting & Water */}
      <div className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800/80 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Κατάσταση 16:8</span>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isEatingWindow ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div>
          {isEatingWindow ? (
            <div className="flex items-center space-x-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-sm font-bold text-amber-300">Παράθυρο Φαγητού</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-bold text-emerald-300">Φάση Νηστείας (Αυτοφαγία)</span>
            </div>
          )}
          <p className="text-xs text-slate-400 mt-1">12:00 ➔ 20:00 (Φαγητό) | 20:00 ➔ 12:00 (Νηστεία)</p>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
          <div className="flex items-center space-x-1.5 text-sky-400">
            <Droplets className="w-3.5 h-3.5" />
            <span>Νερό σήμερα:</span>
          </div>
          <span className="font-semibold text-sky-300">{(waterMl / 1000).toFixed(1)} / 3.0 L</span>
        </div>
      </div>
    </div>
  );
};
