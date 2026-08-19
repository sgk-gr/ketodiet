import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts';
import { Plus, Trash2, Scale, Activity, Award, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { WeightLog, UserSettings } from '../types';

interface WeightTrackerProps {
  weightLogs: WeightLog[];
  settings: UserSettings;
  onAddLog: (log: Omit<WeightLog, 'id'>) => Promise<void>;
  onDeleteLog: (id: string) => Promise<void>;
}

export const WeightTracker: React.FC<WeightTrackerProps> = ({
  weightLogs,
  settings,
  onAddLog,
  onDeleteLog,
}) => {
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newWeight, setNewWeight] = useState<string>('103.0');
  const [painLevel, setPainLevel] = useState<number>(4);
  const [newNotes, setNewNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = parseFloat(newWeight);
    if (isNaN(weightNum) || weightNum <= 0) return;

    setIsSubmitting(true);
    await onAddLog({
      date: newDate,
      weight: weightNum,
      pain_level: painLevel,
      notes: newNotes,
    });

    // Check for milestone confetti
    if (weightNum <= 100 && (weightLogs.length === 0 || Math.min(...weightLogs.map(l => l.weight)) > 100)) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } else if (weightNum <= 95 && (weightLogs.length === 0 || Math.min(...weightLogs.map(l => l.weight)) > 95)) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    } else if (weightNum <= 90) {
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
    }

    setIsSubmitting(false);
    setShowAddForm(false);
    setNewNotes('');
  };

  const chartData = weightLogs.map((log) => ({
    date: log.date.substring(5), // MM-DD
    fullDate: log.date,
    weight: log.weight,
    pain: log.pain_level,
    notes: log.notes,
  }));

  const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : settings.start_weight;

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-400" />
            Καταγραφή Βάρους & Εξέλιξη (105kg ➔ 90kg)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Παρακολουθήστε την πορεία προς τα 90 κιλά και τη συσχέτιση με την ανακούφιση της μέσης.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition shadow-lg shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Κλείσιμο Φόρμας' : 'Νέα Μέτρηση Βάρους'}</span>
        </button>
      </div>

      {/* Add Measurement Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-5 border border-emerald-500/30 bg-slate-900/90 space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Ημερομηνία</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Βάρος (kg)</label>
              <input
                type="number"
                step="0.1"
                min="50"
                max="200"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                placeholder="π.χ. 103.5"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Επίπεδο Πόνου Μέσης (1 = Κανένας, 10 = Έντονος): <span className="text-emerald-400 font-bold">{painLevel}/10</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={painLevel}
                onChange={(e) => setPainLevel(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 mt-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Σημειώσεις (Πώς ένιωσες σήμερα;)</label>
            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="π.χ. 15' στατικό ποδήλατο, πολύ καλή ενέργεια, καθόλου υδατάνθρακες"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Ακύρωση
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? 'Αποθήκευση...' : 'Αποθήκευση Μέτρησης'}
            </button>
          </div>
        </form>
      )}

      {/* Chart Section */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800/80">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Γράφημα Πορείας προς τα 90 kg</h3>
            <span className="text-xs text-slate-400">Πράσινη διακεκομμένη γραμμή: Τελικός Στόχος (90kg)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Βάρος (kg)
            </span>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis domain={[85, 110]} stroke="#64748b" fontSize={12} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
                        <p className="font-bold text-white">{data.fullDate}</p>
                        <p className="text-emerald-400 font-semibold">Βάρος: {data.weight} kg</p>
                        <p className="text-slate-300">Πόνος Μέσης: {data.pain}/10</p>
                        {data.notes && <p className="text-slate-400 italic">"{data.notes}"</p>}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Target Line: 90kg */}
              <ReferenceLine y={90} stroke="#22c55e" strokeDasharray="5 5" label={{ value: 'Στόχος 90kg', fill: '#22c55e', fontSize: 11, position: 'insideBottomRight' }} />
              {/* Intermediate Milestone: 100kg */}
              <ReferenceLine y={100} stroke="#38bdf8" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: 'Ορόσημο 100kg', fill: '#38bdf8', fontSize: 10, position: 'insideTopRight' }} />
              <Area type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#weightGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Milestones Bar */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-800">
          <div className={`p-3 rounded-xl border text-center ${latestWeight <= 100 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900/60 border-slate-800'}`}>
            <div className="flex items-center justify-center gap-1 text-xs font-bold text-emerald-400 mb-1">
              <Award className="w-3.5 h-3.5" />
              <span>Ορόσημο 1</span>
            </div>
            <p className="text-sm font-extrabold text-white">100 kg</p>
            <p className="text-[10px] text-slate-400">
              {latestWeight <= 100 ? '✅ Επιτεύχθηκε!' : `Απομένουν ${(latestWeight - 100).toFixed(1)}kg`}
            </p>
          </div>

          <div className={`p-3 rounded-xl border text-center ${latestWeight <= 95 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900/60 border-slate-800'}`}>
            <div className="flex items-center justify-center gap-1 text-xs font-bold text-sky-400 mb-1">
              <Award className="w-3.5 h-3.5" />
              <span>Ορόσημο 2</span>
            </div>
            <p className="text-sm font-extrabold text-white">95 kg</p>
            <p className="text-[10px] text-slate-400">
              {latestWeight <= 95 ? '✅ Επιτεύχθηκε!' : `Απομένουν ${(latestWeight - 95).toFixed(1)}kg`}
            </p>
          </div>

          <div className={`p-3 rounded-xl border text-center ${latestWeight <= 90 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900/60 border-slate-800'}`}>
            <div className="flex items-center justify-center gap-1 text-xs font-bold text-amber-400 mb-1">
              <Award className="w-3.5 h-3.5" />
              <span>Τελικός Στόχος</span>
            </div>
            <p className="text-sm font-extrabold text-white">90 kg</p>
            <p className="text-[10px] text-slate-400">
              {latestWeight <= 90 ? '🏆 Στόχος Επιτεύχθηκε!' : `Απομένουν ${(latestWeight - 90).toFixed(1)}kg`}
            </p>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800/80">
        <h3 className="text-sm font-bold text-white mb-4">Ιστορικό Μετρήσεων</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3">Ημερομηνία</th>
                <th className="pb-3">Βάρος</th>
                <th className="pb-3">Διαφορά</th>
                <th className="pb-3">Πόνος Μέσης</th>
                <th className="pb-3">Σημειώσεις</th>
                <th className="pb-3 text-right">Ενέργεια</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {[...weightLogs].reverse().map((log, index, arr) => {
                const prevLog = arr[index + 1];
                const diff = prevLog ? (log.weight - prevLog.weight).toFixed(1) : '0.0';
                return (
                  <tr key={log.id} className="hover:bg-slate-900/40">
                    <td className="py-3 font-medium text-white">{log.date}</td>
                    <td className="py-3 font-bold text-emerald-400">{log.weight} kg</td>
                    <td className="py-3">
                      {Number(diff) < 0 ? (
                        <span className="text-emerald-400 font-semibold">{diff} kg</span>
                      ) : Number(diff) > 0 ? (
                        <span className="text-amber-400">+{diff} kg</span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full font-semibold ${
                        log.pain_level <= 3 ? 'bg-emerald-500/15 text-emerald-400' :
                        log.pain_level <= 6 ? 'bg-amber-500/15 text-amber-400' :
                        'bg-red-500/15 text-red-400'
                      }`}>
                        {log.pain_level}/10
                      </span>
                    </td>
                    <td className="py-3 text-slate-400 max-w-xs truncate">{log.notes || '-'}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onDeleteLog(log.id)}
                        className="text-slate-500 hover:text-red-400 transition p-1"
                        title="Διαγραφή"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
