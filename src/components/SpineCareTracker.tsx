import React from 'react';
import { Droplets, ShieldCheck, AlertOctagon, Sparkles, CheckCircle2, Plus, Minus, RotateCcw } from 'lucide-react';
import { SPINE_CARE_GUIDELINES } from '../data/initialData';
import { DailyLog } from '../types';

interface SpineCareTrackerProps {
  dailyLog: DailyLog;
  onUpdateDailyLog: (log: DailyLog) => void;
}

export const SpineCareTracker: React.FC<SpineCareTrackerProps> = ({
  dailyLog,
  onUpdateDailyLog,
}) => {
  const handleWaterChange = (delta: number) => {
    const newWater = Math.max(0, Math.min(5000, dailyLog.water_ml + delta));
    onUpdateDailyLog({
      ...dailyLog,
      water_ml: newWater,
    });
  };

  const handleResetWater = () => {
    onUpdateDailyLog({
      ...dailyLog,
      water_ml: 0,
    });
  };

  const handleExerciseChange = (minutes: number, type: DailyLog['exercise_type']) => {
    onUpdateDailyLog({
      ...dailyLog,
      exercise_minutes: minutes,
      exercise_type: type,
    });
  };

  const handleLumbarFeelingChange = (feeling: DailyLog['lumbar_feeling']) => {
    onUpdateDailyLog({
      ...dailyLog,
      lumbar_feeling: feeling,
    });
  };

  const waterPercent = Math.min(100, Math.round((dailyLog.water_ml / 3000) * 100));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          Φροντίδα Σπονδυλικής Στήλης & Ήπια Δραστηριότητα
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Εξειδικευμένες οδηγίες και καθημερινός έλεγχος για ανακούφιση από τη στένωση σπονδυλικού σωλήνα.
        </p>
      </div>

      {/* Critical Medical Warning Box */}
      <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/30 flex items-start space-x-3">
        <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div className="text-xs text-red-200 leading-relaxed">
          <strong className="text-red-300 block text-sm mb-1 font-bold">🚨 Αυστηρή Προσοχή:</strong>
          Αποφύγετε <strong>τρέξιμο, άλματα, κλασικούς κοιλιακούς (sit-ups) και βάρη πάνω από το κεφάλι</strong>. Οι κραδασμοί συμπιέζουν τους σπονδύλους και επιδεινώνουν τη στένωση. Εστιάζουμε <strong>80% στη διατροφή</strong> και <strong>20% σε ήπιες ασκήσεις low-impact</strong>.
        </div>
      </div>

      {/* 2-Column Grid: Water Tracker & Daily Movement Logger */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. Daily Water Intake (Disc Hydration) */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Ενυδάτωση Μεσοσπονδύλιων Δίσκων</h3>
                <span className="text-[11px] text-slate-400">Στόχος: 3.000 ml / ημέρα</span>
              </div>
            </div>
            <button
              onClick={handleResetWater}
              className="text-slate-500 hover:text-slate-300 transition"
              title="Επαναφορά"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Water Progress Bar */}
          <div className="text-center py-2">
            <div className="flex items-baseline justify-center space-x-2">
              <span className="text-4xl font-extrabold text-sky-400 font-mono">
                {(dailyLog.water_ml / 1000).toFixed(2)}
              </span>
              <span className="text-sm text-slate-400 font-medium">/ 3.00 L ({waterPercent}%)</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-3.5 mt-3 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-sky-500 to-teal-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.max(5, waterPercent)}%` }}
              />
            </div>
          </div>

          {/* Quick Add Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleWaterChange(250)}
              className="flex items-center justify-center space-x-1 py-2 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+250 ml</span>
            </button>
            <button
              onClick={() => handleWaterChange(500)}
              className="flex items-center justify-center space-x-1 py-2 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+500 ml</span>
            </button>
            <button
              onClick={() => handleWaterChange(-250)}
              className="flex items-center justify-center space-x-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold transition"
            >
              <Minus className="w-3.5 h-3.5" />
              <span>-250 ml</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            💡 Οι δίσκοι της σπονδυλικής στήλης δρουν σαν σφουγγάρια. Η επαρκής ενυδάτωση διατηρεί το ύψος τους και μειώνει την πίεση στα νεύρα.
          </p>
        </div>

        {/* 2. Low-Impact Movement Logger */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Σημερινή Ήπια Δραστηριότητα</h3>
              <span className="text-[11px] text-slate-400">Επιλέξτε άσκηση χωρίς κραδασμούς</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Τύπος Ήπιας Άσκησης:</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'recumbent_bike', label: '🚴‍♂️ Στατικό Ποδήλατο με Πλάτη' },
                { id: 'walking', label: '🚶‍♂️ Περπάτημα (Ίσιωμα)' },
                { id: 'swimming', label: '🏊‍♂️ Κολύμπι / Νερό' },
                { id: 'decompression_stretches', label: '🧘‍♂️ Διατάσεις Αποφόρτισης' },
              ].map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => handleExerciseChange(dailyLog.exercise_minutes || 20, ex.id as any)}
                  className={`p-2.5 rounded-xl border text-left font-medium transition text-[11px] ${
                    dailyLog.exercise_type === ex.id
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Διάρκεια (λεπτά):</label>
              <input
                type="number"
                min="0"
                max="120"
                step="5"
                value={dailyLog.exercise_minutes}
                onChange={(e) => handleExerciseChange(parseInt(e.target.value) || 0, dailyLog.exercise_type)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Αίσθηση Μέσης:</label>
              <select
                value={dailyLog.lumbar_feeling}
                onChange={(e) => handleLumbarFeelingChange(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="excellent">🟢 Εξαιρετικά (Μηδενικός Πόνος)</option>
                <option value="good">🟢 Καλά (Πολύ ήπια αίσθηση)</option>
                <option value="moderate">🟡 Μέτρια (Ελαφρύ τράβηγμα)</option>
                <option value="painful">🔴 Ενοχλήσεις (Απαιτείται ξεκούραση)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Low-Impact Activities Cards */}
      <div>
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Οι 4 Ασφαλείς Ασκήσεις για τη Σπονδυλική Στήλη
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SPINE_CARE_GUIDELINES.map((item, idx) => (
            <div key={idx} className="glass-card rounded-2xl p-5 border border-slate-800/80 space-y-3 bg-slate-900/40">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{item.icon}</span>
                <div>
                  <h4 className="text-sm font-bold text-white">{item.title}</h4>
                  <span className="text-xs text-emerald-400 font-semibold">{item.duration} • {item.frequency}</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{item.benefit}</p>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-amber-300">
                <strong>⚠️ Οδηγία:</strong> {item.caution}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
