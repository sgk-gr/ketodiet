import React, { useState, useMemo } from 'react';
import { WeightLog, DailyLog, FoodLogEntry } from '../types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

interface AnalyticsChartsProps {
  weightLogs: WeightLog[];
  dailyLogs: DailyLog[];
}

const MONTH_NAMES = [
  'Ιανουάριος',
  'Φεβρουάριος',
  'Μάρτιος',
  'Απρίλιος',
  'Μάιος',
  'Ιούνιος',
  'Ιούλιος',
  'Αύγουστος',
  'Σεπτέμβριος',
  'Οκτώβριος',
  'Νοέμβριος',
  'Δεκέμβριος',
];

export function AnalyticsCharts({ weightLogs, dailyLogs }: AnalyticsChartsProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(currentMonth);
  const [activeTab, setActiveTab] = useState<'weight' | 'water' | 'carbs'>('weight');

  // Available years in dataset
  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear]);
    weightLogs.forEach(w => {
      const y = parseInt(w.date.split('-')[0], 10);
      if (!isNaN(y)) years.add(y);
    });
    dailyLogs.forEach(d => {
      const y = parseInt(d.date.split('-')[0], 10);
      if (!isNaN(y)) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [weightLogs, dailyLogs, currentYear]);

  // Combined daily timeline
  const filteredTimeline = useMemo(() => {
    // Map dates to unified items
    const dateMap = new Map<string, {
      date: string;
      displayDate: string;
      weight?: number;
      water_ml?: number;
      carbs?: number;
      protein?: number;
      calories?: number;
    }>();

    // Fill weights
    weightLogs.forEach(w => {
      const [y, m, d] = w.date.split('-').map(Number);
      if (y !== selectedYear) return;
      if (selectedMonth !== 'all' && m !== selectedMonth) return;

      const existing = dateMap.get(w.date) || {
        date: w.date,
        displayDate: `${d}/${m}`,
      };
      existing.weight = Number(w.weight);
      dateMap.set(w.date, existing);
    });

    // Fill daily logs (water & carbs)
    dailyLogs.forEach(dl => {
      const [y, m, d] = dl.date.split('-').map(Number);
      if (y !== selectedYear) return;
      if (selectedMonth !== 'all' && m !== selectedMonth) return;

      const existing = dateMap.get(dl.date) || {
        date: dl.date,
        displayDate: `${d}/${m}`,
      };
      existing.water_ml = dl.water_ml || 0;

      // Extract macros from completed_habits if they are FoodLogEntry[]
      if (Array.isArray(dl.completed_habits)) {
        let totalCarbs = 0;
        let totalProtein = 0;
        let totalCals = 0;
        dl.completed_habits.forEach((item: any) => {
          if (item && typeof item === 'object') {
            totalCarbs += Number(item.carbs || 0);
            totalProtein += Number(item.protein || 0);
            totalCals += Number(item.calories || 0);
          }
        });
        existing.carbs = Math.round(totalCarbs * 10) / 10;
        existing.protein = Math.round(totalProtein * 10) / 10;
        existing.calories = Math.round(totalCals);
      }
      dateMap.set(dl.date, existing);
    });

    // Sort by date ascending
    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [weightLogs, dailyLogs, selectedYear, selectedMonth]);

  // Aggregate summary statistics for selected filter
  const summaryStats = useMemo(() => {
    let minWeight = 999;
    let maxWeight = 0;
    let latestWeight = 105;
    let totalWater = 0;
    let daysWithWater = 0;
    let totalCarbs = 0;
    let daysWithCarbs = 0;

    filteredTimeline.forEach(entry => {
      if (entry.weight) {
        if (entry.weight < minWeight) minWeight = entry.weight;
        if (entry.weight > maxWeight) maxWeight = entry.weight;
        latestWeight = entry.weight;
      }
      if (typeof entry.water_ml === 'number' && entry.water_ml > 0) {
        totalWater += entry.water_ml;
        daysWithWater++;
      }
      if (typeof entry.carbs === 'number') {
        totalCarbs += entry.carbs;
        daysWithCarbs++;
      }
    });

    const lostInPeriod = maxWeight > 0 ? (maxWeight - latestWeight).toFixed(1) : '0.0';
    const avgWater = daysWithWater > 0 ? Math.round(totalWater / daysWithWater) : 0;
    const avgCarbs = daysWithCarbs > 0 ? (totalCarbs / daysWithCarbs).toFixed(1) : '0.0';

    return {
      lostInPeriod: Math.max(0, parseFloat(lostInPeriod)),
      avgWater,
      avgCarbs,
      totalEntries: filteredTimeline.length,
    };
  }, [filteredTimeline]);

  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#0d0d0d] p-4 sm:p-5 shadow-2xl space-y-4">
      {/* Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <span className="text-xs font-bold text-emerald-400 block">Ιστορικά δεδομένα & πρόοδος</span>
          <h2 className="text-base sm:text-lg font-bold text-white">Αναλυτικά διαγράμματα</h2>
        </div>

        {/* Year and Month Selectors */}
        <div className="flex items-center space-x-2">
          {/* Year selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-black border border-neutral-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-emerald-500"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Month selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="bg-black border border-neutral-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Όλο το έτος</option>
            {MONTH_NAMES.map((m, idx) => (
              <option key={idx + 1} value={idx + 1}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
        <div className="p-3 rounded-xl bg-black border border-neutral-800">
          <span className="text-[10px] sm:text-xs text-neutral-400 block">Απώλεια περιόδου</span>
          <strong className="text-sm sm:text-base font-bold text-emerald-400">
            -{summaryStats.lostInPeriod} kg
          </strong>
        </div>
        <div className="p-3 rounded-xl bg-black border border-neutral-800">
          <span className="text-[10px] sm:text-xs text-neutral-400 block">Μ.Ο. Νερού / ημ.</span>
          <strong className="text-sm sm:text-base font-bold text-blue-400">
            {summaryStats.avgWater} ml
          </strong>
        </div>
        <div className="p-3 rounded-xl bg-black border border-neutral-800">
          <span className="text-[10px] sm:text-xs text-neutral-400 block">Μ.Ο. Υδατανθράκων</span>
          <strong className="text-sm sm:text-base font-bold text-amber-400">
            {summaryStats.avgCarbs} g
          </strong>
        </div>
      </div>

      {/* Chart Type Tabs */}
      <div className="flex items-center space-x-1.5 border-b border-neutral-800 pb-2">
        <button
          onClick={() => setActiveTab('weight')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            activeTab === 'weight'
              ? 'bg-neutral-800 text-emerald-400 border border-neutral-700'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Πορεία βάρους (kg)
        </button>
        <button
          onClick={() => setActiveTab('water')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            activeTab === 'water'
              ? 'bg-neutral-800 text-blue-400 border border-neutral-700'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Κατανάλωση νερού (ml)
        </button>
        <button
          onClick={() => setActiveTab('carbs')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            activeTab === 'carbs'
              ? 'bg-neutral-800 text-amber-400 border border-neutral-700'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Υδατάνθρακες Keto (g)
        </button>
      </div>

      {/* Recharts Container */}
      <div className="h-64 sm:h-72 w-full pt-2">
        {filteredTimeline.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-neutral-500">
            Δεν υπάρχουν καταγεγραμμένα δεδομένα για την επιλεγμένη περίοδο.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'weight' ? (
              <LineChart data={filteredTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="displayDate" stroke="#737373" fontSize={11} />
                <YAxis domain={[85, 110]} stroke="#737373" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#000000', borderColor: '#404040', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`${val} kg`, 'Βάρος']}
                />
                <ReferenceLine y={90} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Στόχος 90kg', fill: '#10b981', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              </LineChart>
            ) : activeTab === 'water' ? (
              <BarChart data={filteredTimeline} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="displayDate" stroke="#737373" fontSize={11} />
                <YAxis domain={[0, 4000]} stroke="#737373" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#000000', borderColor: '#404040', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`${val} ml`, 'Νερό']}
                />
                <ReferenceLine y={3000} stroke="#3b82f6" strokeDasharray="4 4" label={{ value: 'Στόχος 3000ml', fill: '#3b82f6', fontSize: 10 }} />
                <Bar dataKey="water_ml" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <BarChart data={filteredTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="displayDate" stroke="#737373" fontSize={11} />
                <YAxis domain={[0, 50]} stroke="#737373" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#000000', borderColor: '#404040', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`${val} g`, 'Υδατάνθρακες']}
                />
                <ReferenceLine y={30} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Όριο Keto 30g', fill: '#ef4444', fontSize: 10 }} />
                <Bar dataKey="carbs" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
