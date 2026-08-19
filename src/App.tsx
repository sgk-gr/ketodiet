import React, { useState, useEffect } from 'react';
import { DataService } from './lib/supabase';
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* 1. HEADER (NO ALL-CAPS) */}
      <header className="border-b border-slate-200 bg-white/95 sticky top-0 z-30 backdrop-blur-md shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-900">Πλάνο Σπύρου</h1>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                Διατροφή 16:8
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentDayName}, {String(currentHour).padStart(2, '0')}:{String(currentMinute).padStart(2, '0')}:{String(currentSecond).padStart(2, '0')}
            </p>
          </div>
          
          <div className="text-right">
            <span className="text-xs text-slate-500 block font-medium">Στόχος βάρους</span>
            <span className="text-xs font-bold text-emerald-700">105kg ➔ 90kg</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* 2. TIME ADVISOR BOX (NO ALL-CAPS) */}
        <div className="rounded-2xl p-4 sm:p-5 border border-emerald-300 bg-emerald-50/70 shadow-sm space-y-3">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-emerald-200/80">
            <div>
              <span className="text-xs font-bold text-emerald-800 block">
                Κατάσταση ώρας ({String(currentHour).padStart(2, '0')}:{String(currentMinute).padStart(2, '0')})
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {timePhase === 'morning_fast' && 'Φάση νηστείας (Μηδέν θερμίδες)'}
                {timePhase === 'lunch_now' && 'Ώρα για μεσημεριανό (1ο γεύμα)'}
                {timePhase === 'snack_now' && 'Ώρα για απογευματινό σνακ'}
                {timePhase === 'dinner_now' && 'Ώρα για βραδινό (Τελευταίο γεύμα)'}
                {timePhase === 'night_fast' && 'Η κουζίνα έκλεισε για σήμερα'}
              </h2>
            </div>

            <div>
              <span className="text-xs font-bold text-amber-900 bg-amber-100/90 px-2.5 py-1 rounded border border-amber-300 inline-block">
                {countdownText}
              </span>
            </div>
          </div>

          {/* DYNAMIC TEXT CONTENT */}
          {timePhase === 'morning_fast' && (
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1 shadow-sm">
                <span className="font-bold text-sky-800 block text-xs">
                  Τι επιτρέπεται τώρα:
                </span>
                <p className="text-slate-800">
                  500ml δροσερό νερό, σκέτος καφές (ελληνικός ή espresso) ή πράσινο τσάι χωρίς ζάχαρη.
                </p>
                <p className="text-emerald-700 font-medium text-xs">
                  Το σώμα καίει αποθηκευμένο λίπος και ενυδατώνονται οι δίσκοι της μέσης.
                </p>
              </div>

              {lunchMeal && (
                <div className="p-3 rounded-xl bg-white border border-emerald-300 space-y-1 shadow-sm">
                  <span className="font-bold text-emerald-800 text-xs block">
                    Στις 12:00 (Σημερινό μεσημεριανό):
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm">{lunchMeal.title}</h3>
                  <p className="text-slate-600">{lunchMeal.description}</p>
                </div>
              )}
            </div>
          )}

          {timePhase === 'lunch_now' && lunchMeal && (
            <div className="space-y-2.5 text-xs">
              <div className="p-3.5 rounded-xl bg-white border border-emerald-300 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-800 text-xs">
                    Προτεινόμενο μεσημεριανό:
                  </span>
                  <span className="text-slate-600 font-semibold">
                    {lunchMeal.protein_g}g πρωτεΐνη • {lunchMeal.carbs_g}g υδατάνθρακες
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{lunchMeal.title}</h3>
                <p className="text-slate-700">{lunchMeal.description}</p>
                <div className="pt-2 border-t border-slate-100 text-slate-700">
                  <strong className="text-slate-900">Υλικά:</strong> {lunchMeal.ingredients.join(', ')}
                </div>
              </div>
            </div>
          )}

          {timePhase === 'snack_now' && (
            <div className="space-y-2.5 text-xs">
              <div className="p-3.5 rounded-xl bg-white border border-teal-300 shadow-sm space-y-1.5">
                <span className="font-bold text-teal-800 text-xs block">
                  Απογευματινό σνακ (16:00):
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {snackMeal ? snackMeal.title : '1 Στραγγιστό γιαούρτι 2% με 12 ωμά αμύγδαλα'}
                </h3>
                <p className="text-slate-600">
                  {snackMeal ? snackMeal.description : 'Προσφέρει κορεσμό και κρατά σταθερό το σάκχαρο.'}
                </p>
              </div>

              {dinnerMeal && (
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
                  <span className="font-bold text-slate-500 text-xs block">
                    Στις 20:00 (Βραδινό):
                  </span>
                  <h3 className="font-bold text-slate-800">{dinnerMeal.title}</h3>
                  <p className="text-slate-600">{dinnerMeal.description}</p>
                </div>
              )}
            </div>
          )}

          {timePhase === 'dinner_now' && dinnerMeal && (
            <div className="space-y-2.5 text-xs">
              <div className="p-3.5 rounded-xl bg-white border border-indigo-300 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-900 text-xs">
                    Βραδινό (Τελευταίο γεύμα):
                  </span>
                  <span className="text-slate-600 font-semibold">
                    {dinnerMeal.protein_g}g πρωτεΐνη • {dinnerMeal.carbs_g}g υδατάνθρακες
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{dinnerMeal.title}</h3>
                <p className="text-slate-700">{dinnerMeal.description}</p>
                <div className="pt-2 border-t border-slate-100 text-slate-700">
                  <strong className="text-slate-900">Υλικά:</strong> {dinnerMeal.ingredients.join(', ')}
                </div>
                <p className="text-amber-800 font-semibold text-xs pt-1">
                  Υπενθύμιση: Μετά τις 20:30 πίνουμε μόνο νερό ή χαμομήλι.
                </p>
              </div>
            </div>
          )}

          {timePhase === 'night_fast' && (
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1 text-xs">
              <span className="font-bold text-amber-800 text-xs block">
                Η κουζίνα έκλεισε:
              </span>
              <p className="text-slate-800">
                Μόνο νερό ή ζεστό χαμομήλι χωρίς ζάχαρη μέχρι αύριο στις 12:00.
              </p>
              <p className="text-slate-500 text-xs">
                Ξεκούραση για αποφόρτιση της σπονδυλικής στήλης.
              </p>
            </div>
          )}

        </div>

        {/* 3. ΚΙΛΑ & ΣΤΑΤΙΣΤΙΚΑ (NO ALL-CAPS) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <div className="rounded-xl p-3.5 border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-0.5">
              <span className="font-semibold text-slate-700">Βάρος σήμερα</span>
              <span className="text-[11px]">Αρχικό: 105kg</span>
            </div>
            <div className="flex items-baseline space-x-1.5 my-0.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{latestWeight.toFixed(1)}</span>
              <span className="text-xs font-semibold text-slate-500">kg</span>
              <span className="text-xs font-bold text-emerald-700 ml-auto">
                {parseFloat(totalLost) > 0 ? `-${totalLost} kg` : '0 kg'}
              </span>
            </div>
            <p className="text-xs text-slate-500 pt-1 border-t border-slate-100 flex justify-between">
              <span>Στόχος: <strong className="text-slate-900">90 kg</strong></span>
              <span className="text-amber-700 font-semibold">{remaining} kg μένουν</span>
            </p>
          </div>

          <div className="rounded-xl p-3.5 border border-slate-200 bg-white shadow-sm">
            <div className="text-xs text-slate-500 font-semibold mb-0.5">
              Αποφόρτιση μέσης
            </div>
            <div className="flex items-baseline space-x-1.5 my-0.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-indigo-700">-{spineRelief}</span>
              <span className="text-xs font-semibold text-slate-500">kg πίεσης</span>
            </div>
            <p className="text-xs text-slate-500 pt-1 border-t border-slate-100">
              1kg απώλεια = 4kg λιγότερη πίεση στη μέση
            </p>
          </div>

          <div className="rounded-xl p-3.5 border border-slate-200 bg-white shadow-sm">
            <div className="text-xs text-slate-500 font-semibold mb-0.5">
              Ωράριο 16:8 & νερό
            </div>
            <div className="my-0.5">
              <p className="text-xs sm:text-sm font-bold text-slate-900">12:00 - 20:00 (Φαγητό)</p>
              <p className="text-xs text-slate-500">20:00 - 12:00 (Νηστεία)</p>
            </div>
            <p className="text-xs text-emerald-700 font-semibold pt-1 border-t border-slate-100">
              Στόχος νερού: 3.0 λίτρα
            </p>
          </div>

        </div>

        {/* 4. ΜΕΝΟΥ ΗΜΕΡΑΣ (NO ALL-CAPS) */}
        <div className="rounded-xl sm:rounded-2xl p-4 border border-slate-200 bg-white shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {isSelectedDayToday ? `Μενού σήμερα (${selectedDay})` : `Μενού για ${selectedDay}`}
              </h2>
            </div>

            {/* Day Selector */}
            <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-1">
              {ORDERED_DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => {
                    setSelectedDay(day);
                    setShowPastMeals(false);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition shrink-0 ${
                    selectedDay === day 
                      ? 'bg-emerald-600 text-white font-bold shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                    ? 'bg-emerald-50/80 border-emerald-300'
                    : 'bg-slate-50/60 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-800">
                      12:00 Μεσημεριανό
                    </span>
                    {isSelectedDayToday && currentHour >= 12 && currentHour < 16 && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold text-[10px]">
                        Τώρα
                      </span>
                    )}
                    {isLunchPast && isSelectedDayToday && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        (Πέρασε)
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{lunchMeal.title}</h4>
                  <p className="text-slate-600 leading-relaxed text-xs">{lunchMeal.description}</p>
                  <p className="text-xs text-emerald-800 font-semibold pt-1">
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
                    ? 'bg-teal-50/80 border-teal-300'
                    : 'bg-slate-50/60 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-800">
                      16:00 Σνακ
                    </span>
                    {isSelectedDayToday && currentHour >= 16 && currentHour < 20 && (
                      <span className="px-1.5 py-0.5 rounded bg-teal-200 text-teal-900 font-bold text-[10px]">
                        Τώρα
                      </span>
                    )}
                    {isSnackPast && isSelectedDayToday && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        (Πέρασε)
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{snackMeal.title}</h4>
                  <p className="text-slate-600 leading-relaxed text-xs">{snackMeal.description}</p>
                  <p className="text-xs text-teal-800 font-semibold pt-1">
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
                    ? 'bg-indigo-50/80 border-indigo-300'
                    : 'bg-slate-50/60 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900">
                      20:00 Βραδινό
                    </span>
                    {isSelectedDayToday && currentHour >= 20 && currentHour < 22 && (
                      <span className="px-1.5 py-0.5 rounded bg-indigo-200 text-indigo-900 font-bold text-[10px]">
                        Τώρα
                      </span>
                    )}
                    {isDinnerPast && isSelectedDayToday && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        (Πέρασε)
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{dinnerMeal.title}</h4>
                  <p className="text-slate-600 leading-relaxed text-xs">{dinnerMeal.description}</p>
                  <p className="text-xs text-indigo-800 font-semibold pt-1">
                    {dinnerMeal.protein_g}g πρωτεΐνη • {dinnerMeal.carbs_g}g υδατάνθρακες • {dinnerMeal.calories} kcal
                  </p>
                </div>
              )
            ) : null}

          </div>

          {/* Toggle */}
          {isSelectedDayToday && (isLunchPast || isSnackPast || isDinnerPast) && (
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-500 border-t border-slate-100">
              <span>
                {isDinnerPast 
                  ? 'Τα γεύματα της ημέρας ολοκληρώθηκαν.' 
                  : isSnackPast 
                  ? 'Το μεσημεριανό και το σνακ έχουν περάσει.' 
                  : 'Το μεσημεριανό έχει περάσει.'}
              </span>
              <button
                onClick={() => setShowPastMeals(!showPastMeals)}
                className="text-slate-600 hover:text-emerald-700 font-bold transition self-start sm:self-auto"
              >
                {showPastMeals ? 'Απόκρυψη περασμένων' : 'Προβολή όλων των γευμάτων'}
              </button>
            </div>
          )}
        </div>

        {/* 5. ΑΝΑΖΗΤΗΣΗ ΤΡΟΦΗΣ (NO ALL-CAPS) */}
        <div className="rounded-xl p-3 border border-slate-200 bg-white shadow-sm">
          <input
            type="text"
            value={searchFood}
            onChange={(e) => setSearchFood(e.target.value)}
            placeholder="Αναζήτηση τροφής (π.χ. σολομός, ψωμί, φέτα, ρύζι, γιαούρτι, μπύρα)..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:outline-none focus:border-emerald-600 focus:bg-white placeholder:text-slate-400"
          />
        </div>

        {/* 6. ΟΙ 2 ΣΤΗΛΕΣ: ΤΙ ΤΡΩΣ & ΤΙ ΔΕΝ ΤΡΩΣ (NO ALL-CAPS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Στήλη 1: Τι τρως */}
          <div className="rounded-xl p-4 border border-emerald-200 bg-emerald-50/40 space-y-3">
            <div className="border-b border-emerald-200 pb-2">
              <h2 className="text-sm sm:text-base font-bold text-emerald-800">
                Τι τρως (Επιτρέπονται)
              </h2>
              <p className="text-xs text-slate-500">Καθαρή πρωτεΐνη, λαχανικά, καλά λιπαρά</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-white border border-emerald-100 shadow-sm">
                <span className="font-bold text-slate-900 block mb-0.5">Πρωτεΐνες:</span>
                <p className="text-slate-700 leading-relaxed text-xs">
                  Κοτόπουλο, γαλοπούλα, σολομός, σαρδέλες, τσιπούρα, τόνος, μοσχάρι άπαχο, αυγά, θαλασσινά.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-emerald-100 shadow-sm">
                <span className="font-bold text-slate-900 block mb-0.5">Λαχανικά (Αντιφλεγμονώδη):</span>
                <p className="text-slate-700 leading-relaxed text-xs">
                  Μπρόκολο, κουνουπίδι, σπανάκι, μαρούλι, ρόκα, λάχανο, κολοκυθάκια, μανιτάρια, αγγούρι, βραστά χόρτα.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-emerald-100 shadow-sm">
                <span className="font-bold text-slate-900 block mb-0.5">Καλά λιπαρά & γαλακτοκομικά:</span>
                <p className="text-slate-700 leading-relaxed text-xs">
                  Έξτρα παρθένο ελαιόλαδο, αβοκάντο, στραγγιστό γιαούρτι 2%, ωμά αμύγδαλα και καρύδια.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-emerald-100 shadow-sm">
                <span className="font-bold text-slate-900 block mb-0.5">Ροφήματα:</span>
                <p className="text-slate-700 leading-relaxed text-xs">
                  Νερό (3 λίτρα), σκέτος καφές, πράσινο τσάι, σόδα.
                </p>
              </div>
            </div>

            {searchFood && allowedFoods.length > 0 && (
              <div className="pt-2 border-t border-emerald-200 space-y-1.5">
                <span className="text-xs font-bold text-emerald-800">Επιτρεπόμενα:</span>
                {allowedFoods.map(f => (
                  <div key={f.id} className="p-2 rounded bg-white border border-emerald-300 text-xs shadow-sm">
                    <strong className="text-slate-900">{f.name}:</strong> <span className="text-emerald-800">{f.benefits_or_harms}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Στήλη 2: Τι κόβεις */}
          <div className="rounded-xl p-4 border border-rose-200 bg-rose-50/40 space-y-3">
            <div className="border-b border-rose-200 pb-2">
              <h2 className="text-sm sm:text-base font-bold text-rose-800">
                Τι κόβεις (Απαγορεύονται)
              </h2>
              <p className="text-xs text-slate-500">Μπλοκάρουν το λίπος και φέρνουν φλεγμονή στη μέση</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-white border border-rose-100 shadow-sm">
                <span className="font-bold text-rose-900 block mb-0.5">Ψωμιά & ζυμαρικά:</span>
                <p className="text-slate-700 leading-relaxed text-xs">
                  Ψωμί (λευκό, ολικής, φρυγανιές, παξιμάδια, πίτες), μακαρόνια, ρύζι, κριθαράκι.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-rose-100 shadow-sm">
                <span className="font-bold text-rose-900 block mb-0.5">Πατάτες & αμυλούχα:</span>
                <p className="text-slate-700 leading-relaxed text-xs">
                  Πατάτες (τηγανητές, ψητές, πουρές), καλαμπόκι, αρακάς.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-rose-100 shadow-sm">
                <span className="font-bold text-rose-900 block mb-0.5">Ζάχαρη & γλυκά:</span>
                <p className="text-slate-700 leading-relaxed text-xs">
                  Σοκολάτες, πάστες, παγωτά, μπισκότα, μέλι, μαρμελάδες, δημητριακά πρωινού.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-rose-100 shadow-sm">
                <span className="font-bold text-rose-900 block mb-0.5">Αναψυκτικά & αλκοόλ:</span>
                <p className="text-slate-700 leading-relaxed text-xs">
                  Αναψυκτικά με ζάχαρη, έτοιμοι χυμοί, μπύρα, γλυκά ποτά.
                </p>
              </div>
            </div>

            {searchFood && forbiddenFoods.length > 0 && (
              <div className="pt-2 border-t border-rose-200 space-y-1.5">
                <span className="text-xs font-bold text-rose-800">Απαγορευμένα:</span>
                {forbiddenFoods.map(f => (
                  <div key={f.id} className="p-2 rounded bg-white border border-rose-300 text-xs shadow-sm">
                    <strong className="text-slate-900">{f.name}:</strong> <span className="text-rose-800">{f.benefits_or_harms}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* 7. ΚΑΝΟΝΕΣ ΓΙΑ ΤΗ ΜΕΣΗ (NO ALL-CAPS) */}
        <div className="p-3.5 sm:p-4 rounded-xl border border-indigo-200 bg-indigo-50/70 text-xs">
          <span className="text-indigo-950 font-bold text-xs sm:text-sm block mb-1">
            Οδηγία για τη μέση (Στένωση σπονδυλικού σωλήνα):
          </span>
          <p className="text-slate-700 leading-relaxed text-xs">
            <strong>Απαγορεύεται το τρέξιμο και οι κραδασμοί.</strong> Επιτρέπεται μόνο <strong>στατικό ποδήλατο με πλάτη</strong>, <strong>περπάτημα σε ίσιωμα (15-20 λεπτά)</strong> και <strong>κολύμβηση</strong>. Πίνετε <strong>3 λίτρα νερό</strong> την ημέρα.
          </p>
        </div>

        {/* 8. ΚΑΤΑΧΩΡΗΣΗ ΚΙΛΩΝ (NO ALL-CAPS) */}
        <div className="rounded-xl p-4 border border-slate-200 bg-white shadow-sm">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-2.5">
            Καταχώρηση σημερινών κιλών
          </h3>
          
          <form onSubmit={handleSaveWeight} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="number"
              step="0.1"
              value={todayWeight}
              onChange={(e) => setTodayWeight(e.target.value)}
              placeholder="π.χ. 103.2"
              className="bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 font-medium focus:outline-none focus:border-emerald-600 focus:bg-white w-full sm:w-36 text-center sm:text-left"
            />
            <button
              type="submit"
              disabled={isSavingWeight || !todayWeight}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-40"
            >
              {isSavingWeight ? 'Αποθήκευση...' : 'Αποθήκευση'}
            </button>
          </form>

          {weightLogs.length > 0 && (
            <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 text-xs">
              <span className="text-slate-500 font-medium self-center mr-1 text-xs">Ιστορικό:</span>
              {[...weightLogs].reverse().slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-xs">
                  <span>{log.date.substring(5)}:</span>
                  <strong className="text-emerald-800">{log.weight}kg</strong>
                  <button
                    onClick={() => handleDeleteWeight(log.id)}
                    className="text-slate-400 hover:text-rose-600 ml-1 font-bold"
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
