import React from 'react';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { DailyLog } from '../types';

interface DailyChecklistProps {
  dailyLog: DailyLog;
  onUpdateDailyLog: (log: DailyLog) => void;
}

const HABITS = [
  {
    id: 'water_morning',
    title: '💧 Πρωινή Ενυδάτωση (500ml)',
    subtitle: 'Άμεση ενυδάτωση των μεσοσπονδύλιων δίσκων μετά τον ύπνο.',
  },
  {
    id: 'fasting_16',
    title: '⏰ Τήρηση 16:8 Διαλειμματικής',
    subtitle: 'Πρώτο γεύμα στις 12:00, τελευταίο στις 20:00. Μόνο νερό/καφές σκέτος ενδιάμεσα.',
  },
  {
    id: 'no_sugar',
    title: '🚫 Μηδέν Ζάχαρη & Άλευρα',
    subtitle: 'Καθόλου ψωμί, γλυκά, ζυμαρικά ή αναψυκτικά σήμερα.',
  },
  {
    id: 'bike_20',
    title: '🚴‍♂️ 15-20\' Ήπια Άσκηση (Low-Impact)',
    subtitle: 'Στατικό ποδήλατο με πλάτη ή περπάτημα σε ίσιωμα.',
  },
  {
    id: 'salad_olive_oil',
    title: '🥗 Πράσινη Σαλάτα & Ελαιόλαδο',
    subtitle: 'Μαγνήσιο και ελαιοκανθάλη για καταπολέμηση της φλεγμονής.',
  },
  {
    id: 'stretch_night',
    title: '🧘‍♂️ 5\' Διατάσεις Αποφόρτισης Μέσης',
    subtitle: 'Στάση "γόνατα στο στήθος" στο κρεβάτι πριν τον ύπνο.',
  },
];

export const DailyChecklist: React.FC<DailyChecklistProps> = ({
  dailyLog,
  onUpdateDailyLog,
}) => {
  const completed = dailyLog.completed_habits || [];

  const toggleHabit = (habitId: string) => {
    const isDone = completed.includes(habitId);
    const updated = isDone
      ? completed.filter((id) => id !== habitId)
      : [...completed, habitId];

    onUpdateDailyLog({
      ...dailyLog,
      completed_habits: updated,
    });
  };

  const completedCount = completed.length;
  const progressPercent = Math.round((completedCount / HABITS.length) * 100);

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Καθημερινή Λίστα Επιτυχιών (Habits)</h3>
            <span className="text-[11px] text-slate-400">
              {completedCount} από τα {HABITS.length} ολοκληρώθηκαν ({progressPercent}%)
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
        <div
          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Habits List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
        {HABITS.map((habit) => {
          const isDone = completed.includes(habit.id);
          return (
            <button
              key={habit.id}
              onClick={() => toggleHabit(habit.id)}
              className={`p-3 rounded-xl border text-left flex items-start space-x-3 transition-all ${
                isDone
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-600" />
                )}
              </div>
              <div>
                <p className={`text-xs font-bold leading-tight ${isDone ? 'text-emerald-300 line-through opacity-90' : 'text-slate-200'}`}>
                  {habit.title}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">{habit.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
