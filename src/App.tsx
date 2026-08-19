import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeaderStats } from './components/HeaderStats';
import { FastingTimer } from './components/FastingTimer';
import { WeightTracker } from './components/WeightTracker';
import { FoodDirectory } from './components/FoodDirectory';
import { MealPlanner } from './components/MealPlanner';
import { SpineCareTracker } from './components/SpineCareTracker';
import { DailyChecklist } from './components/DailyChecklist';
import { SupabaseSetupModal } from './components/SupabaseSetupModal';
import { DataService } from './lib/supabase';
import { FoodItem, MealRecipe, WeightLog, DailyLog, UserSettings } from './types';
import { INITIAL_USER_SETTINGS } from './data/initialData';
import { Flame, ShieldCheck, ChevronRight, Activity } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [settings, setSettings] = useState<UserSettings>(INITIAL_USER_SETTINGS);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [meals, setMeals] = useState<MealRecipe[]>([]);
  const [dailyLog, setDailyLog] = useState<DailyLog>({
    id: 'daily-today',
    date: new Date().toISOString().split('T')[0],
    water_ml: 1250,
    fasting_hours: 16,
    exercise_minutes: 20,
    exercise_type: 'recumbent_bike',
    lumbar_feeling: 'good',
    completed_habits: ['water_morning', 'fasting_16', 'no_sugar'],
  });
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Initial Data Fetching
  useEffect(() => {
    async function loadData() {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const [loadedSettings, loadedWeights, loadedFoods, loadedMeals, loadedDaily] = await Promise.all([
          DataService.getSettings(),
          DataService.getWeightLogs(),
          DataService.getFoods(),
          DataService.getMeals(),
          DataService.getDailyLog(todayStr),
        ]);
        setSettings(loadedSettings);
        setWeightLogs(loadedWeights);
        setFoods(loadedFoods);
        setMeals(loadedMeals);
        setDailyLog(loadedDaily);
      } catch (err) {
        console.error('Error loading initial data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Handler: Add Weight Log
  const handleAddWeightLog = async (log: Omit<WeightLog, 'id'>) => {
    const saved = await DataService.addWeightLog(log);
    const updated = [...weightLogs.filter(w => w.id !== saved.id), saved].sort((a, b) => a.date.localeCompare(b.date));
    setWeightLogs(updated);
    setSettings(prev => ({ ...prev, current_weight: saved.weight }));
  };

  // Handler: Delete Weight Log
  const handleDeleteWeightLog = async (id: string) => {
    await DataService.deleteWeightLog(id);
    const updated = weightLogs.filter(w => w.id !== id);
    setWeightLogs(updated);
  };

  // Handler: Add Food
  const handleAddFood = async (food: Omit<FoodItem, 'id'>) => {
    const saved = await DataService.addFood(food);
    setFoods(prev => [saved, ...prev]);
  };

  // Handler: Delete Food
  const handleDeleteFood = async (id: string) => {
    await DataService.deleteFood(id);
    setFoods(prev => prev.filter(f => f.id !== id));
  };

  // Handler: Update Daily Log
  const handleUpdateDailyLog = async (newDaily: DailyLog) => {
    setDailyLog(newDaily);
    await DataService.saveDailyLog(newDaily);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 animate-spin flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Flame className="w-6 h-6 text-slate-950" />
        </div>
        <p className="text-sm font-semibold text-slate-300">Φόρτωση Spiros Control Panel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Sticky Navigation */}
      <Navbar
        settings={settings}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* KPI Top Cards */}
        <HeaderStats
          settings={settings}
          weightLogs={weightLogs}
          waterMl={dailyLog.water_ml}
        />

        {/* Tab 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Live 16:8 Timer */}
            <FastingTimer />

            {/* Daily Habits Checklist */}
            <DailyChecklist
              dailyLog={dailyLog}
              onUpdateDailyLog={handleUpdateDailyLog}
            />

            {/* Main Weight Progress Chart */}
            <WeightTracker
              weightLogs={weightLogs}
              settings={settings}
              onAddLog={handleAddWeightLog}
              onDeleteLog={handleDeleteWeightLog}
            />

            {/* 2-Column Overview Summary: Foods & Today's Meals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Quick Foods Summary Card */}
              <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Κανόνες Διατροφής (Τι Τρώμε / Τι Κόβουμε)
                    </h3>
                    <span className="text-xs text-emerald-400 font-semibold">{foods.length} τροφές</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">
                    Εστιάζουμε σε καθαρή πρωτεΐνη, αντιφλεγμονώδη ω-3 λιπαρά και πράσινα λαχανικά χωρίς άμυλο.
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between">
                      <span className="text-emerald-300 font-medium">✅ Επιτρέπονται:</span>
                      <span className="text-slate-300">Σολομός, Κοτόπουλο, Αυγά, Μπρόκολο, Σπανάκι, Ελαιόλαδο</span>
                    </div>
                    <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/20 flex items-center justify-between">
                      <span className="text-red-300 font-medium">❌ Κόβονται Μαχαίρι:</span>
                      <span className="text-slate-300">Ψωμί, Ζυμαρικά, Ρύζι, Πατάτες, Ζάχαρη, Αναψυκτικά, Μπύρα</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('foods')}
                  className="w-full mt-4 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
                >
                  <span>Άνοιγμα Πλήρους Οδηγού Τροφών</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Spine & Movement Guide Card */}
              <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-400" />
                      Προστασία Μέσης (Στένωση Σωλήνα)
                    </h3>
                    <span className="text-xs text-indigo-400 font-semibold">Low-Impact</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">
                    Το 80% της επιτυχίας προέρχεται από τη διατροφή. Η άσκηση πρέπει να είναι 100% ασφαλής.
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-indigo-400 font-bold block mb-1">🚴‍♂️ Στατικό Ποδήλατο</span>
                      <span className="text-[11px] text-slate-300">Με στήριξη πλάτης, μηδενική πίεση.</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-sky-400 font-bold block mb-1">💧 Ενυδάτωση 3L</span>
                      <span className="text-[11px] text-slate-300">Προστασία μεσοσπονδύλιων δίσκων.</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('spine')}
                  className="w-full mt-4 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-indigo-500/30 text-xs font-semibold transition"
                >
                  <span>Άνοιγμα Οδηγού Σπονδυλικής Στήλης</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Tab 2: FOODS DIRECTORY */}
        {activeTab === 'foods' && (
          <div className="animate-in fade-in duration-200">
            <FoodDirectory
              foods={foods}
              onAddFood={handleAddFood}
              onDeleteFood={handleDeleteFood}
            />
          </div>
        )}

        {/* Tab 3: MEAL PLANNER */}
        {activeTab === 'meals' && (
          <div className="animate-in fade-in duration-200">
            <MealPlanner meals={meals} />
          </div>
        )}

        {/* Tab 4: SPINE CARE & MOVEMENT */}
        {activeTab === 'spine' && (
          <div className="animate-in fade-in duration-200">
            <SpineCareTracker
              dailyLog={dailyLog}
              onUpdateDailyLog={handleUpdateDailyLog}
            />
          </div>
        )}

      </main>

      {/* Supabase Setup Modal */}
      <SupabaseSetupModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-slate-400">
            Spiros Control Panel • Στόχος: 105 kg ➔ 90 kg • Low-Carb 16:8 & Σπονδυλική Στήλη
          </p>
          <p className="text-[11px] text-slate-600 max-w-2xl mx-auto">
            *Το σύστημα παρέχει διατροφική καθοδήγηση και καταγραφή. Συμβουλευτείτε πάντα τον γιατρό ή τον φυσικοθεραπευτή σας για ιατρικές διαγνώσεις και ασκήσεις.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
