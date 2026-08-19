import React, { useState, useEffect } from 'react';
import { DataService } from './lib/supabase';
import { WeightLog, FoodItem } from './types';
import { INITIAL_FOODS, INITIAL_WEIGHT_LOGS } from './data/initialData';
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
  Plus, 
  Trash2,
  Database
} from 'lucide-react';
import { SupabaseSetupModal } from './components/SupabaseSetupModal';

export function App() {
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>(INITIAL_FOODS);
  const [searchFood, setSearchFood] = useState<string>('');
  const [todayWeight, setTodayWeight] = useState<string>('');
  const [isSavingWeight, setIsSavingWeight] = useState<boolean>(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);

  // Fasting live time calculation
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentHour = now.getHours();
  const isEatingTime = currentHour >= 12 && currentHour < 20;

  // Load weights from Supabase/Local
  useEffect(() => {
    async function load() {
      try {
        const weights = await DataService.getWeightLogs();
        setWeightLogs(weights.length > 0 ? weights : INITIAL_WEIGHT_LOGS);
        const f = await DataService.getFoods();
        if (f.length > 0) setFoods(f);
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
  const cautionFoods = filteredFoods.filter(f => f.status === 'caution');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      
      {/* 1. TOP HEADER (Simple & Clean) */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
              <Flame className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-none">Πλάνο Σπύρου</h1>
              <p className="text-xs text-emerald-400 font-medium mt-0.5">Low-Carb 16:8 • Στόχος: 105kg ➔ 90kg</p>
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

        {/* 2. ΚΙΛΑ & ΩΡΑΡΙΟ 16:8 (ΣΕ ΜΙΑ ΜΑΤΙΑ) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Κιλά */}
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

          {/* Αποφόρτιση Μέσης */}
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

          {/* Ωράριο 16:8 */}
          <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/70">
            <div className="text-xs font-semibold uppercase tracking-wider flex items-center justify-between mb-1">
              <span className="text-slate-300 flex items-center gap-1">
                <Clock className="w-4 h-4 text-amber-400" /> Ωράριο 16:8
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isEatingTime ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {isEatingTime ? 'Ώρα Φαγητού' : 'Νηστεία'}
              </span>
            </div>
            <div className="my-1">
              <p className="text-sm font-bold text-white">12:00 το μεσημέρι ➔ 20:00 το βράδυ</p>
              <p className="text-xs text-slate-400 mt-0.5">20:00 ➔ 12:00: Μόνο νερό, σκέτος καφές, πράσινο τσάι.</p>
            </div>
          </div>

        </div>

        {/* 3. ΓΡΗΓΟΡΗ ΑΝΑΖΗΤΗΣΗ ΤΡΟΦΗΣ (ΓΡΑΦΕΙΣ ΚΑΙ ΒΛΕΠΕΙΣ ΑΜΕΣΩΣ ΑΝ ΚΑΝΕΙ) */}
        <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/90 space-y-3">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchFood}
              onChange={(e) => setSearchFood(e.target.value)}
              placeholder="🔍 Γράψε οποιαδήποτε τροφή (π.χ. κοτόπουλο, ψωμί, φέτα, ρύζι, γιαούρτι, μπύρα)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-emerald-500 placeholder:text-slate-500 shadow-inner"
            />
          </div>
        </div>

        {/* 4. ΟΙ 2 ΚΥΡΙΕΣ ΣΤΗΛΕΣ: ΤΙ ΤΡΩΣ (ΝΑΙ) & ΤΙ ΔΕΝ ΤΡΩΣ (ΟΧΙ) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* ΣΤΗΛΗ 1: ΤΙ ΤΡΩΣ (ΕΛΕΥΘΕΡΑ & ΚΑΘΗΜΕΡΙΝΑ) */}
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

            <div className="space-y-3">
              {/* Πρωτεΐνες */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs font-bold text-white block mb-1">🥩 Πρωτεΐνες (Χορταίνουν & Καίνε Λίπος):</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Κοτόπουλο / Γαλοπούλα</strong>, <strong>Ψάρια</strong> (Σολομός, Σαρδέλες, Τσιπούρα, Τόνος), <strong>Μοσχάρι άπαχο</strong>, <strong>Αυγά</strong> (βραστά ή ομελέτα), <strong>Θαλασσινά</strong> (γαρίδες, καλαμάρια ψητά).
                </p>
              </div>

              {/* Λαχανικά */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs font-bold text-white block mb-1">🥦 Λαχανικά (Αντιφλεγμονώδη):</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Μπρόκολο, Κουνουπίδι, Σπανάκι, Μαρούλι, Ρόκα, Λάχανο, Κολοκυθάκια, Μανιτάρια, Αγγούρι, Χόρτα βραστά</strong>.
                </p>
              </div>

              {/* Καλά Λιπαρά */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs font-bold text-white block mb-1">🥑 Καλά Λιπαρά & Γαλακτοκομικά:</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Έξτρα Παρθένο Ελαιόλαδο</strong> (1-2 κ.σ. σε κάθε σαλάτα), <strong>Αβοκάντο</strong> (μισό την ημέρα), <strong>Στραγγιστό Γιαούρτι 2%</strong>, <strong>Ωμά Αμύγδαλα & Καρύδια</strong> (1 χούφτα).
                </p>
              </div>

              {/* Ροφήματα */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs font-bold text-white block mb-1">💧 Ροφήματα:</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Νερό (3 Λίτρα)</strong>, <strong>Σκέτος Καφές</strong>, <strong>Πράσινο Τσάι</strong>, <strong>Σόδα / Ανθρακούχο</strong>.
                </p>
              </div>
            </div>

            {/* Αν υπάρχει αναζήτηση, δείχνει αναλυτικά αποτελέσματα */}
            {searchFood && allowedFoods.length > 0 && (
              <div className="pt-2 border-t border-emerald-500/20 space-y-1.5">
                <span className="text-[11px] font-bold text-emerald-400">Αποτελέσματα αναζήτησης:</span>
                {allowedFoods.map(f => (
                  <div key={f.id} className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs">
                    <strong className="text-white">{f.name}:</strong> <span className="text-emerald-300">{f.benefits_or_harms}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ΣΤΗΛΗ 2: ΤΙ ΔΕΝ ΤΡΩΣ (ΚΟΒΟΝΤΑΙ ΜΑΧΑΙΡΙ) */}
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

            <div className="space-y-3">
              {/* Άλευρα & Υδατάνθρακες */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs font-bold text-red-300 block mb-1">❌ Ψωμιά & Ζυμαρικά:</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Ψωμί</strong> (λευκό, ολικής, φρυγανιές, παξιμάδια, πίτες), <strong>Μακαρόνια, Ρύζι, Κριθαράκι</strong>.
                </p>
              </div>

              {/* Πατάτες & Αμυλούχα */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs font-bold text-red-300 block mb-1">❌ Πατάτες & Αμυλούχα:</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Πατάτες</strong> (τηγανητές, ψητές, πουρές), <strong>Καλαμπόκι, Αρακάς</strong>.
                </p>
              </div>

              {/* Ζάχαρη & Γλυκά */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs font-bold text-red-300 block mb-1">❌ Ζάχαρη & Γλυκά:</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Σοκολάτες, Πάστες, Παγωτά, Μπισκότα, Μέλι, Μαρμελάδες, Δημητριακά</strong>.
                </p>
              </div>

              {/* Ποτά */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs font-bold text-red-300 block mb-1">❌ Αναψυκτικά & Αλκοόλ:</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Αναψυκτικά με ζάχαρη, Έτοιμοι χυμοί, Μπύρα</strong> (υγρό ψωμί), <strong>Γλυκά ποτά</strong>.
                </p>
              </div>
            </div>

            {/* Αν υπάρχει αναζήτηση για απαγορευμένα */}
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

        {/* 5. ΕΤΟΙΜΕΣ ΙΔΕΕΣ ΓΙΑ ΜΕΣΗΜΕΡΙ & ΒΡΑΔΥ (ΑΠΛΕΣ & ΧΟΡΤΑΣΤΙΚΕΣ) */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/70 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Utensils className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-white">🍲 Τι να Φας Σήμερα (Έτοιμες Επιλογές)</h2>
              <p className="text-xs text-slate-400">Διαλέγεις 1 επιλογή για κάθε ώρα και είσαι έτοιμος:</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            
            {/* 12:00 Μεσημεριανό */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-black uppercase text-amber-400 block">
                ☀️ 12:00 Μεσημεριανό (Διάλεξε 1):
              </span>
              <ul className="space-y-2 text-slate-300 list-disc list-inside leading-relaxed">
                <li><strong>Κοτόπουλο ψητό (220g)</strong> + Μπρόκολο στον ατμό με 1.5 κ.σ. ελαιόλαδο.</li>
                <li><strong>Σολομός ψητός (200g)</strong> + Πράσινη σαλάτα με μισό αβοκάντο.</li>
                <li><strong>Τσιπούρα ή Λαυράκι</strong> + Βραστά χόρτα με λαδολέμονο.</li>
                <li><strong>Μπιφτέκια μοσχαρίσια (χωρίς ψωμί)</strong> + Ψητά κολοκυθάκια & μανιτάρια.</li>
                <li><strong>Μπριζόλα μοσχαρίσια</strong> + Μεγάλη σαλάτα ρόκα-αγγούρι.</li>
              </ul>
            </div>

            {/* 16:00 Σνακ */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-black uppercase text-teal-400 block">
                ☕ 16:00 Σνακ:
              </span>
              <ul className="space-y-2 text-slate-300 list-disc list-inside leading-relaxed">
                <li><strong>1 Στραγγιστό Γιαούρτι 2%</strong> + 12-15 ωμά αμύγδαλα.</li>
                <li><strong>Cottage cheese (150g)</strong> + 4 καρύδια.</li>
                <li><strong>1 Βραστό αυγό</strong> + 10 αμύγδαλα.</li>
                <li><strong>1 φλιτζάνι πράσινο τσάι</strong> με λεμόνι (χωρίς ζάχαρη).</li>
              </ul>
            </div>

            {/* 20:00 Βραδινό */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-black uppercase text-indigo-400 block">
                🌙 20:00 Βραδινό (Διάλεξε 1):
              </span>
              <ul className="space-y-2 text-slate-300 list-disc list-inside leading-relaxed">
                <li><strong>Ομελέτα με 3 αυγά</strong> + σπανάκι, 40g φέτα & πράσινη σαλάτα.</li>
                <li><strong>Σαλάτα Τόνου</strong> (1 τόνος σε νερό, 1 βραστό αυγό, μαρούλι, αγγούρι, ελαιόλαδο).</li>
                <li><strong>Καλαμάκια κοτόπουλο (3 τμχ)</strong> + σαλάτα (αν παραγγείλεις έξω - χωρίς πίτες/πατάτες).</li>
                <li><strong>Γαρίδες σαγανάκι light</strong> (με φέτα, ντομάτα, πιπεριά - χωρίς ψωμί).</li>
              </ul>
            </div>

          </div>
        </div>

        {/* 6. ΚΑΝΟΝΕΣ ΓΙΑ ΤΗ ΜΕΣΗ (ΣΤΕΝΩΣΗ) */}
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

        {/* 7. ΓΡΗΓΟΡΗ ΚΑΤΑΓΡΑΦΗ ΒΑΡΟΥΣ (ΧΩΡΙΣ ΠΕΡΙΠΛΟΚΕΣ ΦΟΡΜΕΣ) */}
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

          {/* Ιστορικό Τελευταίων Μετρήσεων */}
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
