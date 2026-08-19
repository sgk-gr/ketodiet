import React, { useState, useEffect } from 'react';
import { DataService, supabase } from './lib/supabase';
import { WeightLog, FoodItem, MealRecipe } from './types';
import { INITIAL_FOODS, INITIAL_WEIGHT_LOGS, INITIAL_MEAL_PLAN } from './data/initialData';

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

// Helper: Calculate ETA to reach 90kg (at 0.75kg/week)
function calculateGoalETA(currentWeight: number): { dateStr: string; weeks: number } {
  const remaining = Math.max(0, currentWeight - 90.0);
  if (remaining === 0) return { dateStr: 'Στόχος επιτεύχθηκε!', weeks: 0 };
  const weeksNeeded = Math.ceil(remaining / 0.75);
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + weeksNeeded * 7);
  
  const months = ['Ιανουαρίου', 'Φεβρουαρίου', 'Μαρτίου', 'Απριλίου', 'Μαΐου', 'Ιουνίου', 'Ιουλίου', 'Αυγούστου', 'Σεπτεμβρίου', 'Οκτωβρίου', 'Νοεμβρίου', 'Δεκεμβρίου'];
  const dateStr = `${targetDate.getDate()} ${months[targetDate.getMonth()]} ${targetDate.getFullYear()}`;
  return { dateStr, weeks: weeksNeeded };
}

export function App() {
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>(INITIAL_FOODS);
  const [meals, setMeals] = useState<MealRecipe[]>(INITIAL_MEAL_PLAN);
  const [searchFood, setSearchFood] = useState<string>('');
  const [todayWeight, setTodayWeight] = useState<string>('');
  const [isSavingWeight, setIsSavingWeight] = useState<boolean>(false);
  const [showPastMeals, setShowPastMeals] = useState<boolean>(false);
  const [waterMl, setWaterMl] = useState<number>(0);

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

  // Initial Load + Auto Sync every 4 seconds (for instant Telegram bot updates)
  const loadData = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const weights = await DataService.getWeightLogs();
      if (weights.length > 0) setWeightLogs(weights);
      
      const daily = await DataService.getDailyLog(todayStr);
      if (daily && typeof daily.water_ml === 'number') {
        setWaterMl(daily.water_ml);
      }
      
      const f = await DataService.getFoods();
      if (f.length > 0) setFoods(f);
      const m = await DataService.getMeals();
      if (m.length > 0) setMeals(m);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const latestWeight = weightLogs.length > 0 
    ? weightLogs[weightLogs.length - 1].weight 
    : 105.0;

  const totalLost = (105.0 - latestWeight).toFixed(1);
  const remaining = (latestWeight - 90.0).toFixed(1);
  const spineRelief = (Math.max(0, parseFloat(totalLost)) * 4).toFixed(1);

  // Weight progress bar (from 105 down to 90 = 15kg span)
  const weightProgressPercent = Math.min(100, Math.max(0, Math.round((Math.max(0, parseFloat(totalLost)) / 15.0) * 100)));
  const eta = calculateGoalETA(latestWeight);

  // Water progress bar (goal: 3000 ml)
  const waterProgressPercent = Math.min(100, Math.max(0, Math.round((waterMl / 3000) * 100)));

  // Add water directly from UI
  const handleAddWater = async (amount: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newTotal = Math.min(6000, waterMl + amount);
    setWaterMl(newTotal);
    await DataService.saveDailyLog({
      id: 'daily-' + todayStr,
      date: todayStr,
      water_ml: newTotal,
      fasting_hours: 16,
      exercise_minutes: 20,
      exercise_type: 'recumbent_bike',
      lumbar_feeling: 'good',
      completed_habits: [],
    });
  };

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
      notes: 'Καταγραφή από εφαρμογή',
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
    countdownText = `Τελευταίο γεύμα! Η κουζίνα κλείνει σε ${minLeft} λεπτά`;
  } else {
    countdownText = `Η κουζίνα έκλεισε. Επόμενο γεύμα αύριο στις 12:00`;
  }

  const isSelectedDayToday = selectedDay === currentDayName;

  // SMART TIME FILTER FOR MEALS
  const isLunchPast = isSelectedDayToday && currentHour >= 16;
  const isSnackPast = isSelectedDayToday && currentHour >= 20;
  const isDinnerPast = isSelectedDayToday && currentHour >= 22;

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-20 selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* 1. HEADER (PURE BLACK) */}
      <header className="border-b border-neutral-800 bg-black/95 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-white tracking-tight">Πλάνο Σπύρου</h1>
              <span className="px-2 py-0.5 rounded bg-neutral-800 text-emerald-400 border border-neutral-700 text-[11px] font-semibold">
                Telegram Sync Active
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              {currentDayName}, {String(currentHour).padStart(2, '0')}:{String(currentMinute).padStart(2, '0')}:{String(currentSecond).padStart(2, '0')}
            </p>
          </div>
          
          <div className="text-right">
            <span className="text-xs text-neutral-400 block font-medium">Στόχος βάρους</span>
            <span className="text-xs font-bold text-emerald-400">105kg ➔ 90kg</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* 2. TIME ADVISOR BOX */}
        <div className="rounded-2xl p-4 sm:p-5 border border-neutral-800 bg-[#0d0d0d] shadow-2xl space-y-3">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-neutral-800">
            <div>
              <span className="text-xs font-bold text-emerald-400 block">
                Κατάσταση ώρας ({String(currentHour).padStart(2, '0')}:{String(currentMinute).padStart(2, '0')})
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {timePhase === 'morning_fast' && 'Φάση νηστείας (Μηδέν θερμίδες)'}
                {timePhase === 'lunch_now' && 'Ώρα για μεσημεριανό (1ο γεύμα)'}
                {timePhase === 'snack_now' && 'Ώρα για απογευματινό σνακ'}
                {timePhase === 'dinner_now' && 'Ώρα για βραδινό (Τελευταίο γεύμα)'}
                {timePhase === 'night_fast' && 'Η κουζίνα έκλεισε για σήμερα'}
              </h2>
            </div>

            <div>
              <span className="text-xs font-bold text-amber-300 bg-[#1f160a] px-2.5 py-1 rounded border border-amber-900/60 inline-block">
                {countdownText}
              </span>
            </div>
          </div>

          {/* DYNAMIC TEXT CONTENT */}
          {timePhase === 'morning_fast' && (
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-black border border-neutral-800 space-y-1">
                <span className="font-bold text-neutral-300 block text-xs">
                  Τι επιτρέπεται τώρα:
                </span>
                <p className="text-neutral-200">
                  500ml δροσερό νερό, σκέτος καφές (ελληνικός ή espresso) ή πράσινο τσάι χωρίς ζάχαρη.
                </p>
                <p className="text-emerald-400 font-medium text-xs">
                  Το σώμα καίει αποθηκευμένο λίπος και ενυδατώνονται οι δίσκοι της μέσης.
                </p>
              </div>

              {lunchMeal && (
                <div className="p-3 rounded-xl bg-[#0a120c] border border-emerald-900/50 space-y-1">
                  <span className="font-bold text-emerald-400 text-xs block">
                    Στις 12:00 (Σημερινό μεσημεριανό):
                  </span>
                  <h3 className="font-bold text-white text-sm">{lunchMeal.title}</h3>
                  <p className="text-neutral-300">{lunchMeal.description}</p>
                </div>
              )}
            </div>
          )}

          {timePhase === 'lunch_now' && lunchMeal && (
            <div className="space-y-2.5 text-xs">
              <div className="p-3.5 rounded-xl bg-[#0a120c] border border-emerald-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 text-xs">
                    Προτεινόμενο μεσημεριανό:
                  </span>
                  <span className="text-neutral-400 font-semibold">
                    {lunchMeal.protein_g}g πρωτεΐνη • {lunchMeal.carbs_g}g υδατάνθρακες
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{lunchMeal.title}</h3>
                <p className="text-neutral-300">{lunchMeal.description}</p>
                <div className="pt-2 border-t border-neutral-800 text-neutral-300">
                  <strong className="text-white">Υλικά:</strong> {lunchMeal.ingredients.join(', ')}
                </div>
              </div>
            </div>
          )}

          {timePhase === 'snack_now' && (
            <div className="space-y-2.5 text-xs">
              <div className="p-3.5 rounded-xl bg-[#0a1414] border border-teal-900/60 space-y-1.5">
                <span className="font-bold text-teal-400 text-xs block">
                  Απογευματινό σνακ (16:00):
                </span>
                <h3 className="text-base font-bold text-white">
                  {snackMeal ? snackMeal.title : '1 Στραγγιστό γιαούρτι 2% με 12 ωμά αμύγδαλα'}
                </h3>
                <p className="text-neutral-300">
                  {snackMeal ? snackMeal.description : 'Προσφέρει κορεσμό και κρατά σταθερό το σάκχαρο.'}
                </p>
              </div>

              {dinnerMeal && (
                <div className="p-3 rounded-xl bg-black border border-neutral-800 space-y-1">
                  <span className="font-bold text-neutral-400 text-xs block">
                    Στις 20:00 (Βραδινό):
                  </span>
                  <h3 className="font-bold text-white">{dinnerMeal.title}</h3>
                  <p className="text-neutral-400">{dinnerMeal.description}</p>
                </div>
              )}
            </div>
          )}

          {timePhase === 'dinner_now' && dinnerMeal && (
            <div className="space-y-2.5 text-xs">
              <div className="p-3.5 rounded-xl bg-[#0f0f14] border border-neutral-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 text-xs">
                    Βραδινό (Τελευταίο γεύμα):
                  </span>
                  <span className="text-neutral-400 font-semibold">
                    {dinnerMeal.protein_g}g πρωτεΐνη • {dinnerMeal.carbs_g}g υδατάνθρακες
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{dinnerMeal.title}</h3>
                <p className="text-neutral-300">{dinnerMeal.description}</p>
                <div className="pt-2 border-t border-neutral-800 text-neutral-300">
                  <strong className="text-white">Υλικά:</strong> {dinnerMeal.ingredients.join(', ')}
                </div>
                <p className="text-amber-400 font-semibold text-xs pt-1">
                  Υπενθύμιση: Μετά τις 20:30 πίνουμε μόνο νερό ή χαμομήλι.
                </p>
              </div>
            </div>
          )}

          {timePhase === 'night_fast' && (
            <div className="p-3.5 rounded-xl bg-black border border-neutral-800 space-y-1 text-xs">
              <span className="font-bold text-amber-400 text-xs block">
                Η κουζίνα έκλεισε:
              </span>
              <p className="text-neutral-200">
                Μόνο νερό ή ζεστό χαμομήλι χωρίς ζάχαρη μέχρι αύριο στις 12:00.
              </p>
              <p className="text-neutral-400 text-xs">
                Ξεκούραση για αποφόρτιση της σπονδυλικής στήλης.
              </p>
            </div>
          )}

        </div>

        {/* 3. PROGRESS BARS: ΒΑΡΟΣ + ΕΚΤΙΜΩΜΕΝΗ ΗΜΕΡΟΜΗΝΙΑ & ΝΕΡΟ TELEGRAM SYNC */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Progress Bar 1: Βάρος & Εκτίμηση Στόχου */}
          <div className="rounded-xl p-4 border border-neutral-800 bg-[#0d0d0d] space-y-3">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span className="font-semibold text-neutral-300">Πρόοδος βάρους (105kg ➔ 90kg)</span>
              <span className="font-bold text-emerald-400">{weightProgressPercent}%</span>
            </div>
            
            {/* Visual Bar */}
            <div className="w-full bg-black rounded-full h-3 overflow-hidden border border-neutral-800">
              <div
                className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, weightProgressPercent)}%` }}
              />
            </div>

            <div className="flex items-baseline justify-between text-xs pt-1">
              <div>
                <span className="text-2xl font-extrabold text-white">{latestWeight.toFixed(1)}</span>
                <span className="text-neutral-400 font-medium ml-1">kg</span>
                <span className="text-xs font-bold text-emerald-400 ml-2">(-{totalLost}kg)</span>
              </div>
              <span className="text-amber-400 font-semibold">{remaining} kg για τα 90kg</span>
            </div>

            <div className="pt-2 border-t border-neutral-800 text-[11px] text-neutral-400">
              <span>Εκτιμώμενη ημερομηνία στόχου: </span>
              <strong className="text-white">{eta.dateStr}</strong>
              <span className="text-neutral-500 block mt-0.5">Αποφόρτιση μέσης μέχρι τώρα: -{spineRelief} kg πίεσης.</span>
            </div>
          </div>

          {/* Progress Bar 2: Νερό Ημέρας & Telegram Sync */}
          <div className="rounded-xl p-4 border border-neutral-800 bg-[#0d0d0d] space-y-3">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span className="font-semibold text-neutral-300">Νερό σήμερα (Στόχος: 3.0L)</span>
              <span className="font-bold text-sky-400">{waterProgressPercent}%</span>
            </div>
            
            {/* Visual Bar */}
            <div className="w-full bg-black rounded-full h-3 overflow-hidden border border-neutral-800">
              <div
                className="bg-gradient-to-r from-sky-600 to-teal-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, waterProgressPercent)}%` }}
              />
            </div>

            <div className="flex items-baseline justify-between text-xs pt-1">
              <div>
                <span className="text-2xl font-extrabold text-white font-mono">{(waterMl / 1000).toFixed(2)}</span>
                <span className="text-neutral-400 font-medium ml-1">/ 3.00 L</span>
              </div>
              
              {/* Quick Add Buttons */}
              <div className="flex space-x-1.5">
                <button
                  onClick={() => handleAddWater(250)}
                  className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 border border-neutral-700 transition"
                >
                  +250ml
                </button>
                <button
                  onClick={() => handleAddWater(500)}
                  className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-sky-300 border border-neutral-700 transition"
                >
                  +500ml
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-between">
              <span>Telegram Bot (@sgkdigital_bot):</span>
              <span className="text-emerald-400 font-medium">Γράψε «ήπια 1L» για αυτόματη ενημέρωση!</span>
            </div>
          </div>

        </div>

        {/* 4. ΜΕΝΟΥ ΗΜΕΡΑΣ */}
        <div className="rounded-xl sm:rounded-2xl p-4 border border-neutral-800 bg-[#0d0d0d] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-2.5">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                {isSelectedDayToday ? `Μενού σήμερα (${selectedDay})` : `Μενού για ${selectedDay}`}
              </h2>
            </div>

            {/* Day Selector */}
            <div className="flex flex-wrap items-center gap-1.5 py-1">
              {ORDERED_DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => {
                    setSelectedDay(day);
                    setShowPastMeals(false);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                    selectedDay === day 
                      ? 'bg-emerald-600 text-white font-extrabold shadow' 
                      : 'bg-black text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  {day} {day === currentDayName && '(Σήμερα)'}
                </button>
              ))}
            </div>
          </div>

          {/* MEAL LIST */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            
            {/* 12:00 Μεσημεριανό */}
            {(!isLunchPast || showPastMeals || !isSelectedDayToday) ? (
              lunchMeal && (
                <div className={`p-3.5 rounded-xl border space-y-1.5 ${
                  isSelectedDayToday && currentHour >= 12 && currentHour < 16
                    ? 'bg-[#0a120c] border-emerald-800'
                    : 'bg-black border-neutral-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400">
                      12:00 Μεσημεριανό
                    </span>
                    {isSelectedDayToday && currentHour >= 12 && currentHour < 16 && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold text-[10px]">
                        Τώρα
                      </span>
                    )}
                    {isLunchPast && isSelectedDayToday && (
                      <span className="text-[10px] text-neutral-500 font-medium">
                        (Πέρασε)
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-white text-xs sm:text-sm">{lunchMeal.title}</h4>
                  <p className="text-neutral-300 leading-relaxed text-xs">{lunchMeal.description}</p>
                  <p className="text-xs text-emerald-400 font-semibold pt-1">
                    {lunchMeal.protein_g}g πρωτεΐνη • {lunchMeal.carbs_g}g υδατάνθρακες • {lunchMeal.calories} kcal
                  </p>
                </div>
              )
            ) : null}

            {/* 16:00 Σνακ */}
            {(!isSnackPast || showPastMeals || !isSelectedDayToday) ? (
              snackMeal && (
                <div className={`p-3.5 rounded-xl border space-y-1.5 ${
                  isSelectedDayToday && currentHour >= 16 && currentHour < 20
                    ? 'bg-[#0a1414] border-teal-800'
                    : 'bg-black border-neutral-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-400">
                      16:00 Σνακ
                    </span>
                    {isSelectedDayToday && currentHour >= 16 && currentHour < 20 && (
                      <span className="px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 font-bold text-[10px]">
                        Τώρα
                      </span>
                    )}
                    {isSnackPast && isSelectedDayToday && (
                      <span className="text-[10px] text-neutral-500 font-medium">
                        (Πέρασε)
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-white text-xs sm:text-sm">{snackMeal.title}</h4>
                  <p className="text-neutral-300 leading-relaxed text-xs">{snackMeal.description}</p>
                  <p className="text-xs text-teal-400 font-semibold pt-1">
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
                    ? 'bg-[#0f0f14] border-neutral-700'
                    : 'bg-black border-neutral-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">
                      20:00 Βραδινό
                    </span>
                    {isSelectedDayToday && currentHour >= 20 && currentHour < 22 && (
                      <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-emerald-400 border border-neutral-700 font-bold text-[10px]">
                        Τώρα
                      </span>
                    )}
                    {isDinnerPast && isSelectedDayToday && (
                      <span className="text-[10px] text-neutral-500 font-medium">
                        (Πέρασε)
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-white text-xs sm:text-sm">{dinnerMeal.title}</h4>
                  <p className="text-neutral-300 leading-relaxed text-xs">{dinnerMeal.description}</p>
                  <p className="text-xs text-emerald-400 font-semibold pt-1">
                    {dinnerMeal.protein_g}g πρωτεΐνη • {dinnerMeal.carbs_g}g υδατάνθρακες • {dinnerMeal.calories} kcal
                  </p>
                </div>
              )
            ) : null}

          </div>

          {/* Toggle */}
          {isSelectedDayToday && (isLunchPast || isSnackPast || isDinnerPast) && (
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-neutral-400 border-t border-neutral-800">
              <span>
                {isDinnerPast 
                  ? 'Τα γεύματα της ημέρας ολοκληρώθηκαν.' 
                  : isSnackPast 
                  ? 'Το μεσημεριανό και το σνακ έχουν περάσει.' 
                  : 'Το μεσημεριανό έχει περάσει.'}
              </span>
              <button
                onClick={() => setShowPastMeals(!showPastMeals)}
                className="text-neutral-300 hover:text-emerald-400 font-bold transition self-start sm:self-auto"
              >
                {showPastMeals ? 'Απόκρυψη περασμένων' : 'Προβολή όλων των γευμάτων'}
              </button>
            </div>
          )}
        </div>

        {/* 5. ΑΝΑΖΗΤΗΣΗ ΤΡΟΦΗΣ */}
        <div className="rounded-xl p-3 border border-neutral-800 bg-[#0d0d0d]">
          <input
            type="text"
            value={searchFood}
            onChange={(e) => setSearchFood(e.target.value)}
            placeholder="Αναζήτηση τροφής (π.χ. σολομός, ψωμί, φέτα, ρύζι, γιαούρτι, μπύρα)..."
            className="w-full bg-black border border-neutral-700 rounded-lg px-3.5 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-emerald-500 placeholder:text-neutral-500"
          />
        </div>

        {/* 6. ΟΙ 2 ΣΤΗΛΕΣ: ΤΙ ΤΡΩΣ & ΤΙ ΔΕΝ ΤΡΩΣ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Στήλη 1: Τι τρως */}
          <div className="rounded-xl p-4 border border-emerald-900/60 bg-[#08120a] space-y-3">
            <div className="border-b border-emerald-900/40 pb-2">
              <h2 className="text-sm sm:text-base font-bold text-emerald-400">
                Τι τρως (Επιτρέπονται)
              </h2>
              <p className="text-xs text-neutral-400">Καθαρή πρωτεΐνη, λαχανικά, καλά λιπαρά</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-black border border-neutral-800">
                <span className="font-bold text-white block mb-0.5">Πρωτεΐνες:</span>
                <p className="text-neutral-300 leading-relaxed text-xs">
                  Κοτόπουλο, γαλοπούλα, σολομός, σαρδέλες, τσιπούρα, τόνος, μοσχάρι άπαχο, αυγά, θαλασσινά.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-black border border-neutral-800">
                <span className="font-bold text-white block mb-0.5">Λαχανικά (Αντιφλεγμονώδη):</span>
                <p className="text-neutral-300 leading-relaxed text-xs">
                  Μπρόκολο, κουνουπίδι, σπανάκι, μαρούλι, ρόκα, λάχανο, κολοκυθάκια, μανιτάρια, αγγούρι, βραστά χόρτα.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-black border border-neutral-800">
                <span className="font-bold text-white block mb-0.5">Καλά λιπαρά & γαλακτοκομικά:</span>
                <p className="text-neutral-300 leading-relaxed text-xs">
                  Έξτρα παρθένο ελαιόλαδο, αβοκάντο, στραγγιστό γιαούρτι 2%, ωμά αμύγδαλα και καρύδια.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-black border border-neutral-800">
                <span className="font-bold text-white block mb-0.5">Ροφήματα:</span>
                <p className="text-neutral-300 leading-relaxed text-xs">
                  Νερό (3 λίτρα), σκέτος καφές, πράσινο τσάι, σόδα.
                </p>
              </div>
            </div>

            {searchFood && allowedFoods.length > 0 && (
              <div className="pt-2 border-t border-emerald-900/50 space-y-1.5">
                <span className="text-xs font-bold text-emerald-400">Επιτρεπόμενα:</span>
                {allowedFoods.map(f => (
                  <div key={f.id} className="p-2 rounded bg-black border border-emerald-800 text-xs">
                    <strong className="text-white">{f.name}:</strong> <span className="text-emerald-300">{f.benefits_or_harms}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Στήλη 2: Τι κόβεις */}
          <div className="rounded-xl p-4 border border-red-900/60 bg-[#140808] space-y-3">
            <div className="border-b border-red-900/40 pb-2">
              <h2 className="text-sm sm:text-base font-bold text-red-400">
                Τι κόβεις (Απαγορεύονται)
              </h2>
              <p className="text-xs text-neutral-400">Μπλοκάρουν το λίπος και φέρνουν φλεγμονή στη μέση</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-black border border-neutral-800">
                <span className="font-bold text-red-400 block mb-0.5">Ψωμιά & ζυμαρικά:</span>
                <p className="text-neutral-300 leading-relaxed text-xs">
                  Ψωμί (λευκό, ολικής, φρυγανιές, παξιμάδια, πίτες), μακαρόνια, ρύζι, κριθαράκι.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-black border border-neutral-800">
                <span className="font-bold text-red-400 block mb-0.5">Πατάτες & αμυλούχα:</span>
                <p className="text-neutral-300 leading-relaxed text-xs">
                  Πατάτες (τηγανητές, ψητές, πουρές), καλαμπόκι, αρακάς.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-black border border-neutral-800">
                <span className="font-bold text-red-400 block mb-0.5">Ζάχαρη & γλυκά:</span>
                <p className="text-neutral-300 leading-relaxed text-xs">
                  Σοκολάτες, πάστες, παγωτά, μπισκότα, μέλι, μαρμελάδες, δημητριακά πρωινού.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-black border border-neutral-800">
                <span className="font-bold text-red-400 block mb-0.5">Αναψυκτικά & αλκοόλ:</span>
                <p className="text-neutral-300 leading-relaxed text-xs">
                  Αναψυκτικά με ζάχαρη, έτοιμοι χυμοί, μπύρα, γλυκά ποτά.
                </p>
              </div>
            </div>

            {searchFood && forbiddenFoods.length > 0 && (
              <div className="pt-2 border-t border-red-900/50 space-y-1.5">
                <span className="text-xs font-bold text-red-400">Απαγορευμένα:</span>
                {forbiddenFoods.map(f => (
                  <div key={f.id} className="p-2 rounded bg-black border border-red-800 text-xs">
                    <strong className="text-white">{f.name}:</strong> <span className="text-red-300">{f.benefits_or_harms}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* 7. ΚΑΝΟΝΕΣ ΓΙΑ ΤΗ ΜΕΣΗ */}
        <div className="p-3.5 sm:p-4 rounded-xl border border-neutral-800 bg-[#0d0d0d] text-xs">
          <span className="text-white font-bold text-xs sm:text-sm block mb-1">
            Οδηγία για τη μέση (Στένωση σπονδυλικού σωλήνα):
          </span>
          <p className="text-neutral-300 leading-relaxed text-xs">
            <strong>Απαγορεύεται το τρέξιμο και οι κραδασμοί.</strong> Επιτρέπεται μόνο <strong>στατικό ποδήλατο με πλάτη</strong>, <strong>περπάτημα σε ίσιωμα (15-20 λεπτά)</strong> και <strong>κολύμβηση</strong>. Πίνετε <strong>3 λίτρα νερό</strong> την ημέρα.
          </p>
        </div>

        {/* 8. ΚΑΤΑΧΩΡΗΣΗ ΚΙΛΩΝ */}
        <div className="rounded-xl p-4 border border-neutral-800 bg-[#0d0d0d]">
          <h3 className="text-xs sm:text-sm font-bold text-white mb-2.5">
            Καταχώρηση σημερινών κιλών
          </h3>
          
          <form onSubmit={handleSaveWeight} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="number"
              step="0.1"
              value={todayWeight}
              onChange={(e) => setTodayWeight(e.target.value)}
              placeholder="π.χ. 103.2"
              className="bg-black border border-neutral-700 rounded-lg px-3.5 py-2 text-sm text-white font-bold focus:outline-none focus:border-emerald-500 w-full sm:w-36 text-center sm:text-left"
            />
            <button
              type="submit"
              disabled={isSavingWeight || !todayWeight}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition disabled:opacity-40"
            >
              {isSavingWeight ? 'Αποθήκευση...' : 'Αποθήκευση'}
            </button>
          </form>

          {weightLogs.length > 0 && (
            <div className="mt-3 pt-2 border-t border-neutral-800 flex flex-wrap gap-1.5 text-xs">
              <span className="text-neutral-500 font-medium self-center mr-1 text-xs">Ιστορικό:</span>
              {[...weightLogs].reverse().slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center space-x-1 px-2 py-0.5 rounded bg-black border border-neutral-800 text-neutral-300 text-xs">
                  <span>{log.date.substring(5)}:</span>
                  <strong className="text-emerald-400">{log.weight}kg</strong>
                  <button
                    onClick={() => handleDeleteWeight(log.id)}
                    className="text-neutral-500 hover:text-red-400 ml-1 font-bold"
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
