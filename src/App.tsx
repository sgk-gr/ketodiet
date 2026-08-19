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
  Database,
  Calendar
} from 'lucide-react';
import { SupabaseSetupModal } from './components/SupabaseSetupModal';

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
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);

  // Live Time Intelligence
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentSecond = now.getSeconds();
  const currentDayIndex = now.getDay(); // 0 = Κυριακή, 1 = Δευτέρα, ...
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

  // Smart Current Meal Decision based on HOUR
  // 00:00 - 11:59 => FASTING (Next: Lunch at 12:00)
  // 12:00 - 15:59 => LUNCH TIME (12:00)
  // 16:00 - 19:59 => SNACK TIME (16:00) / Upcoming dinner (20:00)
  // 20:00 - 21:59 => DINNER TIME (20:00)
  // 22:00 - 23:59 => KITCHEN CLOSED / NIGHT FASTING
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

  // Calculate countdown to 12:00 or 20:00
  let countdownText = '';
  if (timePhase === 'morning_fast') {
    const minLeft = (11 - currentHour) * 60 + (59 - currentMinute);
    const h = Math.floor(minLeft / 60);
    const m = minLeft % 60;
    countdownText = `Σε ${h}ω ${m}λ ξεκινάει το πρώτο γεύμα (12:00)`;
  } else if (timePhase === 'lunch_now' || timePhase === 'snack_now') {
    const minLeft = (19 - currentHour) * 60 + (59 - currentMinute);
    const h = Math.floor(minLeft / 60);
    const m = minLeft % 60;
    countdownText = `Απομένουν ${h}ω ${m}λ στο παράθυρο φαγητού (κλείνει στις 20:00)`;
  } else {
    countdownText = `Η κουζίνα έκλεισε! Επόμενο γεύμα αύριο στις 12:00`;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      
      {/* 1. HEADER WITH CLOCK */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/20">
              <Flame className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-white leading-none">Spiros Smart Diet</h1>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase">
                  Live AI Guide
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Σήμερα είναι <strong className="text-emerald-400">{currentDayName}</strong> • {String(currentHour).padStart(2, '0')}:{String(currentMinute).padStart(2, '0')}:{String(currentSecond).padStart(2, '0')}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setIsSupabaseModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Supabase DB</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* 2. ΠΑΝΕΞΥΠΝΟ BOX: ΤΙ ΤΡΩΣ ΑΚΡΙΒΩΣ ΤΩΡΑ (TIME-AWARE AI BOX) */}
        <div className="rounded-3xl p-6 border-2 border-emerald-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 shadow-2xl relative overflow-hidden">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">
                  🧠 Έξυπνος Βοηθός • Ώρα {String(currentHour).padStart(2, '0')}:{String(currentMinute).padStart(2, '0')} ({currentDayName})
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  {timePhase === 'morning_fast' && '🔒 Τώρα είσαι σε Φάση Νηστείας (Καύση Λίπους)'}
                  {timePhase === 'lunch_now' && '☀️ Τώρα είναι Ώρα για Μεσημεριανό (12:00 - 16:00)'}
                  {timePhase === 'snack_now' && '☕ Τώρα είναι Ώρα για Απογευματινό Σνακ (16:00)'}
                  {timePhase === 'dinner_now' && '🌙 Τώρα είναι Ώρα για Βραδινό (20:00 - Τελευταίο Γεύμα)'}
                  {timePhase === 'night_fast' && '🛑 Η Κουζίνα Έκλεισε για Σήμερα (Νηστεία & Αυτοφαγία)'}
                </h2>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                {countdownText}
              </span>
            </div>
          </div>

          {/* DYNAMIC CONTENT BASED ON CURRENT TIME */}
          
          {/* A. ΠΡΩΙ / ΝΗΣΤΕΙΑ (00:00 - 11:59) */}
          {timePhase === 'morning_fast' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-extrabold text-sky-400 uppercase flex items-center gap-1.5">
                    <Droplet className="w-4 h-4" /> Τι πίνεις ΤΩΡΑ (Μηδέν Θερμίδες):
                  </span>
                  <p className="text-sm text-slate-200">
                    <strong>1 μεγάλο ποτήρι δροσερό νερό (500ml)</strong> + <strong>1 σκέτο καφέ</strong> (ελληνικό/espresso) ή <strong>πράσινο τσάι</strong>.
                  </p>
                  <p className="text-xs text-emerald-400">
                    ✨ Το σώμα καίει το αποθηκευμένο λίπος και προστατεύει τους δίσκους της μέσης.
                  </p>
                </div>
              </div>

              {/* Προεπισκόπηση Μεσημεριανού στις 12:00 */}
              {lunchMeal && (
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase">
                      🍴 Στις 12:00 θα φας (Σημερινό Μεσημεριανό):
                    </span>
                    <span className="text-xs font-bold text-slate-300">{lunchMeal.calories} kcal • {lunchMeal.protein_g}g πρωτεΐνη</span>
                  </div>
                  <h3 className="text-base font-bold text-white">{lunchMeal.title}</h3>
                  <p className="text-xs text-slate-300">{lunchMeal.description}</p>
                  <div className="pt-2 border-t border-emerald-500/20 text-xs text-slate-300">
                    <strong>Υλικά:</strong> {lunchMeal.ingredients.join(' • ')}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* B. ΜΕΣΗΜΕΡΙ (12:00 - 15:59) */}
          {timePhase === 'lunch_now' && lunchMeal && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-400 uppercase flex items-center gap-1">
                    <Sun className="w-4 h-4" /> Προτεινόμενο Μεσημεριανό για Σήμερα ({selectedDay}):
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                    {lunchMeal.protein_g}g Πρωτεΐνη • {lunchMeal.carbs_g}g Υδατάνθρακες
                  </span>
                </div>

                <h3 className="text-lg font-extrabold text-white">{lunchMeal.title}</h3>
                <p className="text-xs text-slate-200">{lunchMeal.description}</p>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5">
                  <p className="text-emerald-300 font-semibold">🛒 Υλικά που χρειάζεσαι:</p>
                  <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                    {lunchMeal.ingredients.map((ing, i) => (
                      <li key={i}>{ing}</li>
                    ))}
                  </ul>
                </div>

                {lunchMeal.spine_benefit && (
                  <p className="text-xs text-indigo-300 bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-500/20">
                    ✨ <strong>Όφελος για τη Μέση:</strong> {lunchMeal.spine_benefit}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* C. ΑΠΟΓΕΥΜΑ (16:00 - 19:59) */}
          {timePhase === 'snack_now' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-teal-400 uppercase flex items-center gap-1">
                    <Coffee className="w-4 h-4" /> Τι τρως ΤΩΡΑ (Σνακ 16:00):
                  </span>
                  <span className="text-xs font-bold text-teal-300">
                    {snackMeal ? `${snackMeal.calories} kcal` : 'Γιαούρτι 2% & Αμύγδαλα'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">
                  {snackMeal ? snackMeal.title : '1 Στραγγιστό Γιαούρτι 2% + 12 Ωμά Αμύγδαλα'}
                </h3>
                <p className="text-xs text-slate-200">
                  {snackMeal ? snackMeal.description : 'Σε κρατάει χορτάτο χωρίς να ανεβάζει το σάκχαρο.'}
                </p>
              </div>

              {/* Προεπισκόπηση Βραδινού στις 20:00 */}
              {dinnerMeal && (
                <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400 uppercase">
                      🌙 Στις 20:00 θα φας (Βραδινό):
                    </span>
                    <span className="text-xs font-bold text-slate-300">{dinnerMeal.calories} kcal • {dinnerMeal.protein_g}g πρωτεΐνη</span>
                  </div>
                  <h3 className="text-base font-bold text-white">{dinnerMeal.title}</h3>
                  <p className="text-xs text-slate-300">{dinnerMeal.description}</p>
                </div>
              )}
            </div>
          )}

          {/* D. ΒΡΑΔΥ (20:00 - 21:59) */}
          {timePhase === 'dinner_now' && dinnerMeal && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-indigo-400 uppercase flex items-center gap-1">
                    <Moon className="w-4 h-4" /> Τι τρως ΤΩΡΑ (Βραδινό 20:00 - Τελευταίο Γεύμα):
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-bold">
                    {dinnerMeal.protein_g}g Πρωτεΐνη • {dinnerMeal.carbs_g}g Υδατάνθρακες
                  </span>
                </div>

                <h3 className="text-lg font-extrabold text-white">{dinnerMeal.title}</h3>
                <p className="text-xs text-slate-200">{dinnerMeal.description}</p>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5">
                  <p className="text-indigo-300 font-semibold">🛒 Υλικά:</p>
                  <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                    {dinnerMeal.ingredients.map((ing, i) => (
                      <li key={i}>{ing}</li>
                    ))}
                  </ul>
                </div>

                <p className="text-xs text-amber-300 bg-amber-950/30 p-2 rounded-xl border border-amber-500/20">
                  ⚠️ <strong>Υπενθύμιση:</strong> Αυτό είναι το τελευταίο γεύμα της ημέρας. Μετά τις 20:30 πίνουμε μόνο νερό ή χαμομήλι!
                </p>
              </div>
            </div>
          )}

          {/* E. ΝΥΧΤΑ (22:00 - 23:59) */}
          {timePhase === 'night_fast' && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <span className="text-xs font-extrabold text-amber-400 uppercase flex items-center gap-1">
                <Moon className="w-4 h-4" /> Η κουζίνα είναι κλειστή:
              </span>
              <p className="text-sm text-slate-200">
                Μην φας τίποτα. Αν διψάς, πιες <strong>νερό</strong> ή ένα ζεστό <strong>χαμομήλι</strong> (χωρίς μέλι ή ζάχαρη).
              </p>
              <p className="text-xs text-slate-400">
                💡 Ξεκουράσου καλά για να αποφορτιστεί η μέση και να γίνει πλήρης καύση λίπους στον ύπνο.
              </p>
            </div>
          )}

        </div>

        {/* 3. ΚΙΛΑ & ΑΠΟΦΟΡΤΙΣΗ ΜΕΣΗΣ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/70">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider flex items-center gap-1 text-slate-300">
                <Scale className="w-4 h-4 text-emerald-400" /> Βάρος Σήμερα
              </span>
              <span>Αρχικό: 105 kg</span>
            </div>
            <div className="flex items-baseline space-x-2 my-1">
              <span className="text-3xl font-black text-white">{latestWeight.toFixed(1)}</span>
              <span className="text-sm font-semibold text-slate-400">kg</span>
              <span className="text-xs font-bold text-emerald-400 ml-auto">
                {parseFloat(totalLost) > 0 ? `-${totalLost} kg` : '0 kg'}
              </span>
            </div>
            <p className="text-xs text-slate-400 pt-1 border-t border-slate-800/80 flex justify-between">
              <span>Στόχος: <strong className="text-white">90 kg</strong></span>
              <span className="text-amber-400 font-semibold">Απομένουν {remaining} kg</span>
            </p>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/70">
            <div className="text-xs text-indigo-300 font-semibold uppercase tracking-wider flex items-center gap-1 mb-1">
              <ShieldAlert className="w-4 h-4 text-indigo-400" /> Αποφόρτιση Μέσης
            </div>
            <div className="flex items-baseline space-x-2 my-1">
              <span className="text-3xl font-black text-indigo-300">-{spineRelief}</span>
              <span className="text-sm font-semibold text-slate-400">kg πίεσης</span>
            </div>
            <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
              ✨ <strong>1kg απώλεια = 4kg λιγότερο βάρος</strong> στη σπονδυλική στήλη.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/70">
            <div className="text-xs font-semibold uppercase tracking-wider flex items-center justify-between mb-1">
              <span className="text-slate-300 flex items-center gap-1">
                <Clock className="w-4 h-4 text-amber-400" /> Ωράριο 16:8
              </span>
            </div>
            <div className="my-1">
              <p className="text-sm font-bold text-white">12:00 - 20:00 (Φαγητό)</p>
              <p className="text-xs text-slate-400 mt-0.5">20:00 - 12:00 (Νηστεία 16h)</p>
            </div>
            <p className="text-[11px] text-emerald-400 pt-1 border-t border-slate-800/80">
              💧 Στόχος νερού: 3.0 Liters
            </p>
          </div>

        </div>

        {/* 4. ΟΛΟΚΛΗΡΟ ΤΟ ΜΕΝΟΥ ΤΗΣ ΗΜΕΡΑΣ (ΠΡΟΒΟΛΗ & ΑΛΛΑΓΗ ΗΜΕΡΑΣ) */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/70 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Utensils className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">
                Πλήρες Μενού Ημέρας: <span className="text-emerald-400">{selectedDay}</span>
              </h2>
            </div>

            {/* Quick Day Selector Pills */}
            <div className="flex items-center space-x-1 overflow-x-auto text-xs pb-1">
              {ORDERED_DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            
            {/* 12:00 Μεσημεριανό */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-black uppercase text-amber-400 block">
                ☀️ 12:00 Μεσημεριανό:
              </span>
              {lunchMeal ? (
                <>
                  <h4 className="font-bold text-white text-sm">{lunchMeal.title}</h4>
                  <p className="text-slate-300 leading-relaxed">{lunchMeal.description}</p>
                  <p className="text-[11px] text-emerald-400 font-semibold pt-1">
                    {lunchMeal.protein_g}g πρωτεΐνη • {lunchMeal.carbs_g}g υδατ. • {lunchMeal.calories} kcal
                  </p>
                </>
              ) : <p className="text-slate-400">Κοτόπουλο ή Σολομός + Σαλάτα</p>}
            </div>

            {/* 16:00 Σνακ */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-black uppercase text-teal-400 block">
                ☕ 16:00 Σνακ:
              </span>
              {snackMeal ? (
                <>
                  <h4 className="font-bold text-white text-sm">{snackMeal.title}</h4>
                  <p className="text-slate-300 leading-relaxed">{snackMeal.description}</p>
                  <p className="text-[11px] text-teal-400 font-semibold pt-1">
                    {snackMeal.protein_g}g πρωτεΐνη • {snackMeal.calories} kcal
                  </p>
                </>
              ) : <p className="text-slate-400">Γιαούρτι 2% + 12 αμύγδαλα</p>}
            </div>

            {/* 20:00 Βραδινό */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-black uppercase text-indigo-400 block">
                🌙 20:00 Βραδινό:
              </span>
              {dinnerMeal ? (
                <>
                  <h4 className="font-bold text-white text-sm">{dinnerMeal.title}</h4>
                  <p className="text-slate-300 leading-relaxed">{dinnerMeal.description}</p>
                  <p className="text-[11px] text-indigo-400 font-semibold pt-1">
                    {dinnerMeal.protein_g}g πρωτεΐνη • {dinnerMeal.carbs_g}g υδατ. • {dinnerMeal.calories} kcal
                  </p>
                </>
              ) : <p className="text-slate-400">Ομελέτα με 3 αυγά + πράσινη σαλάτα</p>}
            </div>

          </div>
        </div>

        {/* 5. ΑΜΕΣΗ ΑΝΑΖΗΤΗΣΗ ΤΡΟΦΗΣ */}
        <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/90 space-y-3">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchFood}
              onChange={(e) => setSearchFood(e.target.value)}
              placeholder="🔍 Αναζήτηση τροφής (π.χ. σολομός, ψωμί, φέτα, ρύζι, γιαούρτι, μπύρα)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-emerald-500 placeholder:text-slate-500 shadow-inner"
            />
          </div>
        </div>

        {/* 6. ΟΙ 2 ΣΤΗΛΕΣ: ΤΙ ΤΡΩΣ & ΤΙ ΔΕΝ ΤΡΩΣ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* ΣΤΗΛΗ 1: ΤΙ ΤΡΩΣ (ΝΑΙ) */}
          <div className="glass-card rounded-2xl p-5 border border-emerald-500/30 bg-emerald-950/10 space-y-4">
            <div className="flex items-center space-x-2 border-b border-emerald-500/20 pb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <div>
                <h2 className="text-base font-extrabold text-emerald-400 uppercase tracking-wide">
                  🟢 Τι Τρως (Ελεύθερα)
                </h2>
                <p className="text-xs text-slate-400">Καθαρή πρωτεΐνη, πράσινα λαχανικά, καλά λιπαρά</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-white block mb-1">🥩 Πρωτεΐνες:</span>
                <p className="text-slate-300 leading-relaxed">
                  <strong>Κοτόπουλο, Γαλοπούλα, Σολομός, Σαρδέλες, Τσιπούρα, Τόνος, Μοσχάρι άπαχο, Αυγά, Θαλασσινά</strong>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-white block mb-1">🥦 Λαχανικά (Αντιφλεγμονώδη):</span>
                <p className="text-slate-300 leading-relaxed">
                  <strong>Μπρόκολο, Κουνουπίδι, Σπανάκι, Μαρούλι, Ρόκα, Λάχανο, Κολοκυθάκια, Μανιτάρια, Αγγούρι, Βραστά χόρτα</strong>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-white block mb-1">🥑 Καλά Λιπαρά:</span>
                <p className="text-slate-300 leading-relaxed">
                  <strong>Έξτρα Παρθένο Ελαιόλαδο</strong>, <strong>Αβοκάντο</strong>, <strong>Στραγγιστό Γιαούρτι 2%</strong>, <strong>Αμύγδαλα & Καρύδια</strong>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-white block mb-1">💧 Ροφήματα:</span>
                <p className="text-slate-300 leading-relaxed">
                  <strong>Νερό (3L)</strong>, <strong>Σκέτος Καφές</strong>, <strong>Πράσινο Τσάι</strong>, <strong>Σόδα</strong>.
                </p>
              </div>
            </div>

            {searchFood && allowedFoods.length > 0 && (
              <div className="pt-2 border-t border-emerald-500/20 space-y-1.5">
                <span className="text-[11px] font-bold text-emerald-400">Επιτρεπόμενα που βρέθηκαν:</span>
                {allowedFoods.map(f => (
                  <div key={f.id} className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs">
                    <strong className="text-white">{f.name}:</strong> <span className="text-emerald-300">{f.benefits_or_harms}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ΣΤΗΛΗ 2: ΤΙ ΔΕΝ ΤΡΩΣ (ΟΧΙ) */}
          <div className="glass-card rounded-2xl p-5 border border-red-500/30 bg-red-950/10 space-y-4">
            <div className="flex items-center space-x-2 border-b border-red-500/20 pb-3">
              <XCircle className="w-6 h-6 text-red-400" />
              <div>
                <h2 className="text-base font-extrabold text-red-400 uppercase tracking-wide">
                  🔴 Τι Κόβεις Μαχαίρι (Όχι)
                </h2>
                <p className="text-xs text-slate-400">Μπλοκάρουν το λίπος & προκαλούν φλεγμονή στη μέση</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-red-300 block mb-1">❌ Ψωμιά & Ζυμαρικά:</span>
                <p className="text-slate-300 leading-relaxed">
                  <strong>Ψωμί</strong> (λευκό, ολικής, φρυγανιές, παξιμάδια, πίτες), <strong>Μακαρόνια, Ρύζι, Κριθαράκι</strong>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-red-300 block mb-1">❌ Πατάτες & Αμυλούχα:</span>
                <p className="text-slate-300 leading-relaxed">
                  <strong>Πατάτες</strong> (τηγανητές, ψητές, πουρές), <strong>Καλαμπόκι, Αρακάς</strong>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-red-300 block mb-1">❌ Ζάχαρη & Γλυκά:</span>
                <p className="text-slate-300 leading-relaxed">
                  <strong>Σοκολάτες, Πάστες, Παγωτά, Μπισκότα, Μέλι, Μαρμελάδες, Δημητριακά</strong>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-red-300 block mb-1">❌ Αναψυκτικά & Αλκοόλ:</span>
                <p className="text-slate-300 leading-relaxed">
                  <strong>Αναψυκτικά με ζάχαρη, Χυμοί, Μπύρα</strong> (υγρό ψωμί), <strong>Γλυκά ποτά</strong>.
                </p>
              </div>
            </div>

            {searchFood && forbiddenFoods.length > 0 && (
              <div className="pt-2 border-t border-red-500/20 space-y-1.5">
                <span className="text-[11px] font-bold text-red-400">Απαγορευμένα που βρέθηκαν:</span>
                {forbiddenFoods.map(f => (
                  <div key={f.id} className="p-2 rounded-lg bg-red-950/40 border border-red-500/30 text-xs">
                    <strong className="text-white">{f.name}:</strong> <span className="text-red-300">{f.benefits_or_harms}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* 7. ΚΑΝΟΝΕΣ ΓΙΑ ΤΗ ΜΕΣΗ */}
        <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-indigo-300 font-extrabold text-sm block mb-0.5">
              🚶‍♂️ Κανόνας για τη Μέση (Στένωση Σπονδυλικού Σωλήνα):
            </span>
            <p className="text-slate-300">
              <strong>Απαγορεύεται το τρέξιμο & οι κραδασμοί.</strong> Επιτρέπεται μόνο <strong>στατικό ποδήλατο με πλάτη</strong>, <strong>περπάτημα σε ίσιωμα (15-20')</strong> και <strong>κολύμβηση</strong>. Πίνε <strong>3 λίτρα νερό</strong> την ημέρα.
            </p>
          </div>
        </div>

        {/* 8. ΚΑΤΑΧΩΡΗΣΗ ΣΗΜΕΡΙΝΩΝ ΚΙΛΩΝ */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/60">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-400" />
            Καταχώρηση Σημερινών Κιλών
          </h3>
          
          <form onSubmit={handleSaveWeight} className="flex items-center gap-3">
            <input
              type="number"
              step="0.1"
              value={todayWeight}
              onChange={(e) => setTodayWeight(e.target.value)}
              placeholder="π.χ. 103.2"
              className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white w-40 font-bold focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={isSavingWeight || !todayWeight}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition disabled:opacity-40"
            >
              {isSavingWeight ? 'Αποθήκευση...' : 'Αποθήκευση Κιλών'}
            </button>
          </form>

          {weightLogs.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap gap-2 text-xs">
              <span className="text-slate-500 font-semibold self-center mr-1">Τελευταίες μετρήσεις:</span>
              {[...weightLogs].reverse().slice(0, 6).map((log) => (
                <div key={log.id} className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                  <span>{log.date.substring(5)}:</span>
                  <strong className="text-emerald-400">{log.weight} kg</strong>
                  <button
                    onClick={() => handleDeleteWeight(log.id)}
                    className="text-slate-600 hover:text-red-400 ml-1"
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

      {/* Supabase Modal */}
      <SupabaseSetupModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

    </div>
  );
}

export default App;
