import React, { useState, useEffect } from 'react';
import { Clock, Flame, Coffee, Droplet, Sparkles, CheckCircle2 } from 'lucide-react';

export const FastingTimer: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();

  // Eating window: 12:00:00 to 19:59:59
  const isEatingWindow = hours >= 12 && hours < 20;

  // Calculate countdown to next milestone
  let targetHour = isEatingWindow ? 20 : (hours >= 20 ? 12 + 24 : 12);
  let totalCurrentMinutes = hours * 60 + minutes + seconds / 60;
  if (!isEatingWindow && hours >= 20) {
    // night after 20:00
  }
  
  let targetTotalMinutes = targetHour * 60;
  let diffMinutes = targetTotalMinutes - totalCurrentMinutes;
  if (diffMinutes < 0) {
    diffMinutes += 24 * 60;
  }

  const hoursLeft = Math.floor(diffMinutes / 60);
  const minutesLeft = Math.floor(diffMinutes % 60);
  const secondsLeft = Math.floor((diffMinutes * 60) % 60);

  // Fasting progress calculation
  // Fasting is 20:00 to 12:00 (16 hours = 960 minutes)
  let fastingMinutesPassed = 0;
  if (!isEatingWindow) {
    if (hours >= 20) {
      fastingMinutesPassed = (hours - 20) * 60 + minutes;
    } else {
      fastingMinutesPassed = 4 * 60 + (hours * 60 + minutes); // 4 hours before midnight + hours after
    }
  }
  const fastingPercent = isEatingWindow 
    ? 100 
    : Math.min(100, Math.round((fastingMinutesPassed / 960) * 100));

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800/80 mb-6 relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Left Column: Status & Countdown */}
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <div className={`p-1.5 rounded-lg ${isEatingWindow ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              {isEatingWindow ? 'Παράθυρο Διατροφής (Eating Window)' : 'Φάση Νηστείας & Αυτοφαγίας (Fasting 16h)'}
            </h3>
          </div>

          <p className="text-sm text-slate-400 mb-4">
            {isEatingWindow 
              ? 'Ώρα για τα κύρια γεύματα της ημέρας. Εστιάστε σε καθαρή πρωτεΐνη, πράσινα λαχανικά και ελαιόλαδο.' 
              : 'Το σώμα καίει αποθηκευμένο λίπος και ενεργοποιεί την κυτταρική ανανέωση (αυτοφαγία) χωρίς φλεγμονές.'}
          </p>

          {/* Big Digital Countdown */}
          <div className="flex items-center space-x-3 bg-slate-900/80 rounded-xl p-4 border border-slate-800 inline-flex">
            <div className="text-center">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                {String(hoursLeft).padStart(2, '0')}
              </span>
              <span className="block text-[10px] uppercase font-semibold text-slate-400 mt-0.5">Ώρες</span>
            </div>
            <span className="text-2xl font-mono text-emerald-400 font-bold">:</span>
            <div className="text-center">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                {String(minutesLeft).padStart(2, '0')}
              </span>
              <span className="block text-[10px] uppercase font-semibold text-slate-400 mt-0.5">Λεπτά</span>
            </div>
            <span className="text-2xl font-mono text-emerald-400 font-bold">:</span>
            <div className="text-center">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                {String(secondsLeft).padStart(2, '0')}
              </span>
              <span className="block text-[10px] uppercase font-semibold text-slate-400 mt-0.5">Δευτ/τα</span>
            </div>
            <div className="pl-4 border-l border-slate-800 text-left">
              <span className="text-xs font-semibold text-slate-300 block">
                {isEatingWindow ? 'Έως την Έναρξη Νηστείας (20:00)' : 'Έως το Πρώτο Γεύμα (12:00)'}
              </span>
              <span className="text-[11px] text-emerald-400 font-medium">
                {isEatingWindow ? 'Τελευταίο γεύμα στις 20:00' : `${Math.floor(fastingMinutesPassed / 60)} ώρες νηστείας ήδη!`}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Allowed liquids during Fasting */}
        <div className="md:w-80 bg-slate-900/60 rounded-xl p-4 border border-slate-800/80">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Επιτρέπονται στη Νηστεία (0 cal):
          </span>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-center space-x-2">
              <Droplet className="w-4 h-4 text-sky-400 shrink-0" />
              <span><strong>Άφθονο Νερό</strong> (δροσερό ή με φέτα λεμόνι)</span>
            </li>
            <li className="flex items-center space-x-2">
              <Coffee className="w-4 h-4 text-amber-500 shrink-0" />
              <span><strong>Σκέτος Καφές</strong> (Ελληνικός/Espresso/Filter - όχι ζάχαρη)</span>
            </li>
            <li className="flex items-center space-x-2">
              <Flame className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>Πράσινο Τσάι & Χαμομήλι</strong> (αντιοξειδωτικά)</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span><strong>Ανθρακούχο Νερό / Σόδα</strong> (κορεσμός & μέταλλα)</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
};
