import React, { useState, useEffect } from 'react';
import { DataService } from './lib/supabase';
import { WeightLog, FoodItem, MealRecipe } from './types';
import { INITIAL_FOODS, INITIAL_WEIGHT_LOGS, INITIAL_MEAL_PLAN } from './data/initialData';
import { 
  CheckCircle2, 
  XCircle, 
  Search, 
  Flame, 
  Clock, 
  Scale, 
  ShieldAlert, 
  Utensils, 
  Droplet, 
  Sparkles, 
  Coffee, 
  Moon, 
  Sun,
  Eye,
  EyeOff
} from 'lucide-react';

const DAY_NAMES: MealRecipe['day'][] = [
  'Κυριακή',
  'Δευτέρα',
  'Τρίτη',
  'Τετάρτη',
  'Πέμπτη',
  'Παρασκευή',
  'Σάββατο',
];

const ORDERED_DAYS: MealRecipe['day'][] = [
  'Δευτέρα',
  'Τρίτη',
  'Τετάρτη',
  'Πέμπτη',
  'Παρασκευή',
  'Σάββατο',
  'Κυριακή',
];

export function App() {
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>(INITIAL_FOODS);
  const [meals, setMeals] = useState<MealRecipe[]>(INITIAL_MEAL_PLAN);
  const [searchFood, setSearchFood] = useState<string>('');
  const [todayWeight, setTodayWeight] = useState<string>('');
  const [isSavingWeight, setIsSavingWeight] = useState<boolean>(false);
  const [showPastMeals, setShowPastMeals] = useState<boolean>(false);

  // Live Time Intelligence
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentSecond = now.getSeconds();
  const currentDayIndex = now.getDay();
  const currentDayName = DAY_NAMES[currentDayIndex];

  // Selected Day for Menu (Defaults to TODAY)
  const [selectedDay, setSelectedDay] = useState<MealRecipe['day']>(currentDayName);

  // Load weights from Supabase / Local
  useEffect(() => {
    async function load() {
      try {
        const weights = await DataService.getWeightLogs();
        setWeightLogs(weights.length > 0 ? weights : INITIAL_WEIGHT_LOGS);
        const f = await DataService.getFoods();
        if (f.length > 0) setFoods(f);
        const m = await DataService.getMeals();
        if (m.length > 0) setMeals(m);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  const latestWeight = weightLogs.length > 0 
    ? weightLogs[weightLogs.length - 1].weight 
    : 105.0;

  const totalLost = (105.0 - latestWeight).toFixed(1);
  const remaining = (latestWeight - 90.0).toFixed(1);
  const spineRelief = (Math.max(0, parseFloat(totalLost)) * 4).toFixed(1);

  // Add weight
  const handleSaveWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(todayWeight);
    if (isNaN(w) || w <= 0) return;
    setIsSavingWeight(true);
    const todayStr = new Date().toISOString().split('T')[0];
    const newLog = await DataService.addWeightLog({
      date: todayStr,
      weight: w,
      pain_level: 4,
      notes: 'Καταγραφή από αρχική σελίδα',
    });
    setWeightLogs(prev => [...prev.filter(x => x.id !== newLog.id), newLog].sort((a, b) => a.date.localeCompare(b.date)));
    setTodayWeight('');
    setIsSavingWeight(false);
  };

  // Delete weight
  const handleDeleteWeight = async (id: string) => {
    await DataService.deleteWeightLog(id);
    setWeightLogs(prev => prev.filter(x => x.id !== id));
  };

  // Filtered foods for instant search
  const filteredFoods = foods.filter(f => 
    f.name.toLowerCase().includes(searchFood.toLowerCase()) ||
    f.description.toLowerCase().includes(searchFood.toLowerCase()) ||
    f.benefits_or_harms.toLowerCase().includes(searchFood.toLowerCase())
  );

  const allowedFoods = filteredFoods.filter(f => f.status === 'allowed');
  const forbiddenFoods = filteredFoods.filter(f => f.status === 'forbidden');

  // Meals for selected day
  const dayMeals = meals.filter(m => m.day === selectedDay);
  const lunchMeal = dayMeals.find(m => m.meal_type === 'lunch');
  const snackMeal = dayMeals.find(m => m.meal_type === 'snack');
  const dinnerMeal = dayMeals.find(m => m.meal_type === 'dinner');

  // Time Phase
  let timePhase: 'morning_fast' | 'lunch_now' | 'snack_now' | 'dinner_now' | 'night_fast' = 'morning_fast';
  if (currentHour >= 0 && currentHour < 12) {
    timePhase = 'morning_fast';
  } else if (currentHour >= 12 && currentHour < 16) {
    timePhase = 'lunch_now';
  } else if (currentHour >= 16 && currentHour < 20) {
    timePhase = 'snack_now';
  } else if (currentHour >= 20 && currentHour < 22) {
    timePhase = 'dinner_now';
  } else {
    timePhase = 'night_fast';
  }

  // Calculate countdown
  let countdownText = '';
  if (timePhase === 'morning_fast') {
    const minLeft = (11 - currentHour) * 60 + (59 - currentMinute);
    const h = Math.floor(minLeft / 60);
    const m = minLeft % 60;
    countdownText = `Σε ${h}ω ${m}λ ξεκινάει το μεσημεριανό (12:00)`;
  } else if (timePhase === 'lunch_now' || timePhase === 'snack_now') {
    const minLeft = (19 - currentHour) * 60 + (59 - currentMinute);
    const h = Math.floor(minLeft / 60);
    const m = minLeft % 60;
    countdownText = `Απομένουν ${h}ω ${m}λ στο παράθυρο φαγητού (κλείνει 20:00)`;
  } else if (timePhase === 'dinner_now') {
    const minLeft = (21 - currentHour) * 60 + (59 - currentMinute);
    countdownText = `Τελευταίο γεύμα! Η κουζίνα κλείνει σε ${minLeft}λ`;
  } else {
    countdownText = `Η κουζίνα έκλεισε! Επόμενο γεύμα αύριο 12:00`;
  }

  const isSelectedDayToday = selectedDay === currentDayName;

  // SMART TIME FILTER FOR MEALS
  const isLunchPast = isSelectedDayToday && currentHour >= 16;
  const isSnackPast = isSelectedDayToday && currentHour >= 20;
  const isDinnerPast = isSelectedDayToday && currentHour >= 22;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* 1. STICKY MOBILE-READY HEADER */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-3.5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-emerald-500/20 shrink-0">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="text-sm sm:text-base font-bold text-white leading-none">Spiros Smart Diet</h1>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] sm:text-[10px] font-black uppercase">
                  16:8
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                <strong className="text-emerald-400">{currentDayName}</strong> • {String(currentHour).padStart(2, '0')}:{String(currentMinute).padStart(2, '0')}:{String(currentSecond).padStart(2, '0')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1"></span>
              Live Sync
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* 2. SMART TIME-AWARE AI BOX (TOUCH-OPTIMIZED) */}
        <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-emerald-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 shadow-xl relative overflow-hidden">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5 pb-3 border-b border-slate-800">
            <div className="flex items-start sm:items-center space-x-2.5">
              <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5 sm:mt-0">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              </div>
              <div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-400 block">
                  🧠 Έξυπνος Βοηθός • Ώρα {String(currentHour).padStart(2, '0')}:{String(currentMinute).padStart(2, '0')}
                </span>
                <h2 className="text-base sm:text-xl font-black text-white leading-snug">
                  {timePhase === 'morning_fast' && '🔒 Τώρα είσαι σε Νηστεία'}
                  {timePhase === 'lunch_now' && '☀️ Ώρα για Μεσημεριανό (1ο Γεύμα)'}
                  {timePhase === 'snack_now' && '☕ Ώρα για Απογευματινό Σνακ'}
                  {timePhase === 'dinner_now' && '🌙 Ώρα για Βραδινό (Τελευταίο Γεύμα)'}
                  {timePhase === 'night_fast' && '🛑 Η Κουζίνα Έκλεισε για Σήμερα'}
                </h2>
              </div>
            </div>

            <div className="self-start sm:self-auto">
              <span className="text-[11px] sm:text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 inline-block">
                {countdownText}
              </span>
            </div>
          </div>

          {/* DYNAMIC CONTENT */}
          {timePhase === 'morning_fast' && (
            <div className="space-y-3">
              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[11px] sm:text-xs font-extrabold text-sky-400 uppercase flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Τι πίνεις ΤΩΡΑ:
                </span>
                <p className="text-xs sm:text-sm text-slate-200">
                  <strong>500ml δροσερό νερό</strong> + <strong>1 σκέτο καφέ</strong> ή <strong>πράσινο τσάι</strong>.
                </p>
                <p className="text-[11px] sm:text-xs text-emerald-400 pt-0.5">
                  ✨ Το σώμα καίει αποθηκευμένο λίπος και ενυδατώνει τους δίσκους της μέσης.
                </p>
              </div>

              {lunchMeal && (
                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
                  <span className="text-[11px] sm:text-xs font-bold text-emerald-400 uppercase">
                    🍴 Στις 12:00 θα φας (Σημερινό Μεσημεριανό):
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white">{lunchMeal.title}</h3>
                  <p className="text-xs text-slate-300">{lunchMeal.description}</p>
                </div>
              )}
            </div>
          )}

          {timePhase === 'lunch_now' && lunchMeal && (
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <span className="text-[11px] sm:text-xs font-extrabold text-emerald-400 uppercase flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Τι τρως ΤΩΡΑ (Μεσημεριανό):
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                  {lunchMeal.protein_g}g Πρωτεΐνη • {lunchMeal.carbs_g}g Υδατ.
                </span>
              </div>
              <h3 className="text-sm sm:text-lg font-black text-white">{lunchMeal.title}</h3>
              <p className="text-xs text-slate-200">{lunchMeal.description}</p>
              <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                <p className="text-emerald-300 font-semibold">🛒 Υλικά:</p>
                <p className="text-slate-300 leading-relaxed">{lunchMeal.ingredients.join(' • ')}</p>
              </div>
            </div>
          )}

          {timePhase === 'snack_now' && (
            <div className="space-y-3">
              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-teal-950/30 border border-teal-500/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-extrabold text-teal-400 uppercase flex items-center gap-1">
                    <Coffee className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Τι τρως ΤΩΡΑ (Σνακ 16:00):
                  </span>
                  <span className="text-[11px] font-bold text-teal-300">
                    {snackMeal ? `${snackMeal.calories} kcal` : 'Γιαούρτι 2%'}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {snackMeal ? snackMeal.title : '1 Στραγγιστό Γιαούρτι 2% + 12 Ωμά Αμύγδαλα'}
                </h3>
                <p className="text-xs text-slate-200">
                  {snackMeal ? snackMeal.description : 'Σε κρατάει χορτάτο χωρίς να ανεβάζει το σάκχαρο.'}
                </p>
              </div>

              {dinnerMeal && (
                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-1">
                  <span className="text-[11px] sm:text-xs font-bold text-indigo-400 uppercase">
                    🌙 Στις 20:00 θα φας (Βραδινό):
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-white">{dinnerMeal.title}</h3>
                  <p className="text-xs text-slate-300">{dinnerMeal.description}</p>
                </div>
              )}
            </div>
          )}

          {timePhase === 'dinner_now' && dinnerMeal && (
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-indigo-950/30 border border-indigo-500/40 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <span className="text-[11px] sm:text-xs font-extrabold text-indigo-400 uppercase flex items-center gap-1">
                  <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Τι τρως ΤΩΡΑ (Βραδινό 20:00):
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[11px] font-bold">
                  {dinnerMeal.protein_g}g Πρωτεΐνη • {dinnerMeal.carbs_g}g Υδατ.
                </span>
              </div>
              <h3 className="text-sm sm:text-lg font-black text-white">{dinnerMeal.title}</h3>
              <p className="text-xs text-slate-200">{dinnerMeal.description}</p>
              <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                <p className="text-indigo-300 font-semibold">🛒 Υλικά:</p>
                <p className="text-slate-300 leading-relaxed">{dinnerMeal.ingredients.join(' • ')}</p>
              </div>
              <p className="text-[11px] text-amber-300 bg-amber-950/30 p-2 rounded-lg border border-amber-500/20">
                ⚠️ <strong>Υπενθύμιση:</strong> Τελευταίο γεύμα. Μετά τις 20:30 πίνουμε μόνο νερό ή χαμομήλι!
              </p>
            </div>
          )}

          {timePhase === 'night_fast' && (
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <span className="text-[11px] sm:text-xs font-extrabold text-amber-400 uppercase flex items-center gap-1">
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Η κουζίνα είναι κλειστή:
              </span>
              <p className="text-xs sm:text-sm text-slate-200">
                Μην φας τίποτα. Πιες <strong>νερό</strong> ή ζεστό <strong>χαμομήλι</strong> (χωρίς ζάχαρη).
              </p>
              <p className="text-[11px] text-slate-400">
                💡 Ξεκούραση για αποφόρτιση μέσης και καύση λίπους στον ύπνο.
              </p>
            </div>
          )}

        </div>

        {/* 3. ΚΙΛΑ & ΣΤΟΧΟΣ (MOBILE 3-GRID) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <div className="glass-card rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-800 bg-slate-900/70">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-0.5">
              <span className="font-semibold uppercase text-slate-300 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-emerald-400" /> Βάρος Σήμερα
              </span>
              <span className="text-[11px]">Αρχικό: 105kg</span>
            </div>
            <div className="flex items-baseline space-x-2 my-0.5">
              <span className="text-2xl sm:text-3xl font-black text-white">{latestWeight.toFixed(1)}</span>
              <span className="text-xs font-semibold text-slate-400">kg</span>
              <span className="text-xs font-bold text-emerald-400 ml-auto">
                {parseFloat(totalLost) > 0 ? `-${totalLost} kg` : '0 kg'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 pt-1 border-t border-slate-800/80 flex justify-between">
              <span>Στόχος: <strong className="text-white">90 kg</strong></span>
              <span className="text-amber-400 font-semibold">{remaining} kg μένουν</span>
            </p>
          </div>

          <div className="glass-card rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-800 bg-slate-900/70">
            <div className="text-xs text-indigo-300 font-semibold uppercase flex items-center gap-1 mb-0.5">
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" /> Αποφόρτιση Μέσης
            </div>
            <div className="flex items-baseline space-x-1.5 my-0.5">
              <span className="text-2xl sm:text-3xl font-black text-indigo-300">-{spineRelief}</span>
              <span className="text-xs font-semibold text-slate-400">kg πίεσης</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
              ✨ <strong>1kg απώλεια = 4kg λιγότερη πίεση</strong> στη μέση.
            </p>
          </div>

          <div className="glass-card rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-800 bg-slate-900/70">
            <div className="text-xs font-semibold uppercase flex items-center justify-between mb-0.5">
              <span className="text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Ωράριο 16:8
              </span>
            </div>
            <div className="my-0.5">
              <p className="text-xs sm:text-sm font-bold text-white">12:00 - 20:00 (Φαγητό)</p>
              <p className="text-[11px] text-slate-400">20:00 - 12:00 (Νηστεία 16h)</p>
            </div>
            <p className="text-[10px] sm:text-[11px] text-emerald-400 pt-1 border-t border-slate-800/80">
              💧 Στόχος νερού: 3.0 Liters
            </p>
          </div>

        </div>

        {/* 4. ΜΕΝΟΥ ΗΜΕΡΑΣ ΜΕ ΑΥΤΟΜΑΤΗ ΑΠΟΚΡΥΨΗ ΠΕΡΑΣΜΕΝΩΝ ΓΕΥΜΑΤΩΝ */}
        <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-800 bg-slate-900/70 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div className="flex items-center space-x-2">
              <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white">
                  {isSelectedDayToday ? `Φαγητό για Σήμερα (${selectedDay})` : `Μενού για ${selectedDay}`}
                </h2>
              </div>
            </div>

            {/* Mobile Scrollable Day Selector */}
            <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
              {ORDERED_DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => {
                    setSelectedDay(day);
                    setShowPastMeals(false);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                    selectedDay === day 
                      ? 'bg-emerald-500 text-slate-950 shadow' 
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {day} {day === currentDayName && '⭐'}
                </button>
              ))}
            </div>
          </div>

          {/* MEAL CARDS (ONLY RELEVANT MEALS SHOWN) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            
            {/* 12:00 Μεσημεριανό */}
            {(!isLunchPast || showPastMeals || !isSelectedDayToday) ? (
              lunchMeal && (
                <div className={`p-3.5 rounded-xl border space-y-1.5 ${
                  isSelectedDayToday && currentHour >= 12 && currentHour < 16
                    ? 'bg-emerald-950/30 border-emerald-500/50 ring-1 ring-emerald-500/30'
                    : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-amber-400">
                      ☀️ 12:00 Μεσημεριανό:
                    </span>
                    {isSelectedDayToday && currentHour >= 12 && currentHour < 16 && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-black text-[9px]">
                        ΤΩΡΑ
                      </span>
                    )}
                    {isLunchPast && isSelectedDayToday && (
                      <span className="text-[9px] text-slate-500 font-bold">
                        (Πέρασε)
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-white text-xs sm:text-sm">{lunchMeal.title}</h4>
                  <p className="text-slate-300 leading-relaxed text-[11px] sm:text-xs">{lunchMeal.description}</p>
                  <p className="text-[10px] sm:text-[11px] text-emerald-400 font-semibold pt-1">
                    {lunchMeal.protein_g}g πρωτεΐνη • {lunchMeal.carbs_g}g υδατ. • {lunchMeal.calories} kcal
                  </p>
                </div>
              )
            ) : null}

            {/* 16:00 Σνακ */}
            {(!isSnackPast || showPastMeals || !isSelectedDayToday) ? (
              snackMeal && (
                <div className={`p-3.5 rounded-xl border space-y-1.5 ${
                  isSelectedDayToday && currentHour >= 16 && currentHour < 20
                    ? 'bg-teal-950/30 border-teal-500/50 ring-1 ring-teal-500/30'
                    : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-teal-400">
                      ☕ 16:00 Σνακ:
                    </span>
                    {isSelectedDayToday && currentHour >= 16 && currentHour < 20 && (
                      <span className="px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-black text-[9px]">
                        ΤΩΡΑ
                      </span>
                    )}
                    {isSnackPast && isSelectedDayToday && (
                      <span className="text-[9px] text-slate-500 font-bold">
                        (Πέρασε)
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-white text-xs sm:text-sm">{snackMeal.title}</h4>
                  <p className="text-slate-300 leading-relaxed text-[11px] sm:text-xs">{snackMeal.description}</p>
                  <p className="text-[10px] sm:text-[11px] text-teal-400 font-semibold pt-1">
                    {snackMeal.protein_g}g πρωτεΐνη • {snackMeal.calories} kcal
                  </p>
                </div>
              )
            ) : null}

            {/* 20:00 Βραδινό */}
            {(!isDinnerPast || showPastMeals || !isSelectedDayToday) ? (
              dinnerMeal && (
                <div className={`p-3.5 rounded-xl border space-y-1.5 ${
                  isSelectedDayToday && currentHour >= 20 && currentHour < 22
                    ? 'bg-indigo-950/30 border-indigo-500/50 ring-1 ring-indigo-500/30'
                    : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-indigo-400">
                      🌙 20:00 Βραδινό:
                    </span>
                    {isSelectedDayToday && currentHour >= 20 && currentHour < 22 && (
                      <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-black text-[9px]">
                        ΤΩΡΑ
                      </span>
                    )}
                    {isDinnerPast && isSelectedDayToday && (
                      <span className="text-[9px] text-slate-500 font-bold">
                        (Πέρασε)
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-white text-xs sm:text-sm">{dinnerMeal.title}</h4>
                  <p className="text-slate-300 leading-relaxed text-[11px] sm:text-xs">{dinnerMeal.description}</p>
                  <p className="text-[10px] sm:text-[11px] text-indigo-400 font-semibold pt-1">
                    {dinnerMeal.protein_g}g πρωτεΐνη • {dinnerMeal.carbs_g}g υδατ. • {dinnerMeal.calories} kcal
                  </p>
                </div>
              )
            ) : null}

          </div>

          {/* Toggle button */}
          {isSelectedDayToday && (isLunchPast || isSnackPast || isDinnerPast) && (
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] text-slate-500 border-t border-slate-800/60">
              <span>
                {isDinnerPast 
                  ? 'Τα γεύματα της ημέρας ολοκληρώθηκαν.' 
                  : isSnackPast 
                  ? 'Το μεσημεριανό και το σνακ έχουν περάσει.' 
                  : 'Το μεσημεριανό έχει περάσει.'}
              </span>
              <button
                onClick={() => setShowPastMeals(!showPastMeals)}
                className="flex items-center space-x-1 text-slate-400 hover:text-emerald-400 font-bold transition self-start sm:self-auto"
              >
                {showPastMeals ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPastMeals ? 'Απόκρυψη περασμένων' : 'Προβολή όλων των γευμάτων'}</span>
              </button>
            </div>
          )}
        </div>

        {/* 5. ΑΜΕΣΗ ΑΝΑΖΗΤΗΣΗ ΤΡΟΦΗΣ (TOUCH TARGET >= 44px) */}
        <div className="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-800 bg-slate-900/90">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchFood}
              onChange={(e) => setSearchFood(e.target.value)}
              placeholder="🔍 Αναζήτηση τροφής (π.χ. σολομός, ψωμί, φέτα, ρύζι)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm text-white font-medium focus:outline-none focus:border-emerald-500 placeholder:text-slate-500 shadow-inner"
            />
          </div>
        </div>

        {/* 6. ΟΙ 2 ΣΤΗΛΕΣ: ΤΙ ΤΡΩΣ & ΤΙ ΔΕΝ ΤΡΩΣ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* ΣΤΗΛΗ 1: ΤΙ ΤΡΩΣ (ΝΑΙ) */}
          <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-emerald-500/30 bg-emerald-950/10 space-y-3">
            <div className="flex items-center space-x-2 border-b border-emerald-500/20 pb-2.5">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
              <div>
                <h2 className="text-sm sm:text-base font-black text-emerald-400 uppercase tracking-wide">
                  🟢 Τι Τρως (Ελεύθερα)
                </h2>
                <p className="text-[11px] text-slate-400">Καθαρή πρωτεΐνη, λαχανικά, καλά λιπαρά</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-white block mb-0.5">🥩 Πρωτεΐνες:</span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  <strong>Κοτόπουλο, Γαλοπούλα, Σολομός, Σαρδέλες, Τσιπούρα, Τόνος, Μοσχάρι άπαχο, Αυγά, Θαλασσινά</strong>.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-white block mb-0.5">🥦 Λαχανικά (Αντιφλεγμονώδη):</span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  <strong>Μπρόκολο, Κουνουπίδι, Σπανάκι, Μαρούλι, Ρόκα, Λάχανο, Κολοκυθάκια, Μανιτάρια, Αγγούρι, Βραστά χόρτα</strong>.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-white block mb-0.5">🥑 Καλά Λιπαρά:</span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  <strong>Έξτρα Παρθένο Ελαιόλαδο</strong>, <strong>Αβοκάντο</strong>, <strong>Στραγγιστό Γιαούρτι 2%</strong>, <strong>Αμύγδαλα & Καρύδια</strong>.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-white block mb-0.5">💧 Ροφήματα:</span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  <strong>Νερό (3L)</strong>, <strong>Σκέτος Καφές</strong>, <strong>Πράσινο Τσάι</strong>, <strong>Σόδα</strong>.
                </p>
              </div>
            </div>

            {searchFood && allowedFoods.length > 0 && (
              <div className="pt-2 border-t border-emerald-500/20 space-y-1.5">
                <span className="text-[11px] font-bold text-emerald-400">Επιτρεπόμενα που βρέθηκαν:</span>
                {allowedFoods.map(f => (
                  <div key={f.id} className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[11px]">
                    <strong className="text-white">{f.name}:</strong> <span className="text-emerald-300">{f.benefits_or_harms}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ΣΤΗΛΗ 2: ΤΙ ΔΕΝ ΤΡΩΣ (ΟΧΙ) */}
          <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-red-500/30 bg-red-950/10 space-y-3">
            <div className="flex items-center space-x-2 border-b border-red-500/20 pb-2.5">
              <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
              <div>
                <h2 className="text-sm sm:text-base font-black text-red-400 uppercase tracking-wide">
                  🔴 Τι Κόβεις Μαχαίρι (Όχι)
                </h2>
                <p className="text-[11px] text-slate-400">Μπλοκάρουν το κάψιμο λίπους & φέρνουν φλεγμονή</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-red-300 block mb-0.5">❌ Ψωμιά & Ζυμαρικά:</span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  <strong>Ψωμί</strong> (λευκό, ολικής, φρυγανιές, παξιμάδια, πίτες), <strong>Μακαρόνια, Ρύζι, Κριθαράκι</strong>.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-red-300 block mb-0.5">❌ Πατάτες & Αμυλούχα:</span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  <strong>Πατάτες</strong> (τηγανητές, ψητές, πουρές), <strong>Καλαμπόκι, Αρακάς</strong>.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-red-300 block mb-0.5">❌ Ζάχαρη & Γλυκά:</span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  <strong>Σοκολάτες, Πάστες, Παγωτά, Μπισκότα, Μέλι, Μαρμελάδες, Δημητριακά</strong>.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-red-300 block mb-0.5">❌ Αναψυκτικά & Αλκοόλ:</span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  <strong>Αναψυκτικά με ζάχαρη, Χυμοί, Μπύρα</strong> (υγρό ψωμί), <strong>Γλυκά ποτά</strong>.
                </p>
              </div>
            </div>

            {searchFood && forbiddenFoods.length > 0 && (
              <div className="pt-2 border-t border-red-500/20 space-y-1.5">
                <span className="text-[11px] font-bold text-red-400">Απαγορευμένα που βρέθηκαν:</span>
                {forbiddenFoods.map(f => (
                  <div key={f.id} className="p-2 rounded-lg bg-red-950/40 border border-red-500/30 text-[11px]">
                    <strong className="text-white">{f.name}:</strong> <span className="text-red-300">{f.benefits_or_harms}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* 7. ΚΑΝΟΝΕΣ ΓΙΑ ΤΗ ΜΕΣΗ */}
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-xs">
          <span className="text-indigo-300 font-black text-xs sm:text-sm block mb-1">
            🚶‍♂️ Κανόνας για τη Μέση (Στένωση Σπονδυλικού Σωλήνα):
          </span>
          <p className="text-slate-300 leading-relaxed text-[11px] sm:text-xs">
            <strong>Απαγορεύεται το τρέξιμο & οι κραδασμοί.</strong> Επιτρέπεται μόνο <strong>στατικό ποδήλατο με πλάτη</strong>, <strong>περπάτημα σε ίσιωμα (15-20')</strong> και <strong>κολύμβηση</strong>. Πίνε <strong>3 λίτρα νερό</strong> την ημέρα.
          </p>
        </div>

        {/* 8. ΚΑΤΑΧΩΡΗΣΗ ΚΙΛΩΝ (MOBILE EASY-INPUT) */}
        <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-800 bg-slate-900/60">
          <h3 className="text-xs sm:text-sm font-bold text-white mb-2.5 flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-400" />
            Καταχώρηση Σημερινών Κιλών
          </h3>
          
          <form onSubmit={handleSaveWeight} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <input
              type="number"
              step="0.1"
              value={todayWeight}
              onChange={(e) => setTodayWeight(e.target.value)}
              placeholder="π.χ. 103.2 kg"
              className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-emerald-500 w-full sm:w-44 text-center sm:text-left"
            />
            <button
              type="submit"
              disabled={isSavingWeight || !todayWeight}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition disabled:opacity-40 min-h-[42px]"
            >
              {isSavingWeight ? 'Αποθήκευση...' : 'Αποθήκευση Κιλών'}
            </button>
          </form>

          {weightLogs.length > 0 && (
            <div className="mt-3.5 pt-2.5 border-t border-slate-800 flex flex-wrap gap-1.5 text-xs">
              <span className="text-slate-500 font-semibold self-center mr-1 text-[11px]">Τελευταίες:</span>
              {[...weightLogs].reverse().slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300 text-[11px]">
                  <span>{log.date.substring(5)}:</span>
                  <strong className="text-emerald-400">{log.weight}kg</strong>
                  <button
                    onClick={() => handleDeleteWeight(log.id)}
                    className="text-slate-600 hover:text-red-400 ml-0.5"
                    title="Διαγραφή"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

    </div>
  );
}

export default App;
