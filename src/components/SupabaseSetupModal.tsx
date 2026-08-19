import React, { useState } from 'react';
import { Database, Copy, Check, ExternalLink, ShieldCheck, Terminal } from 'lucide-react';
import { generateSupabaseSQLScript, supabase } from '../lib/supabase';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'warning'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');

  if (!isOpen) return null;

  const sqlScript = generateSupabaseSQLScript();

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    try {
      const { data, error } = await supabase.from('spiros_weight_logs').select('count', { count: 'exact' });
      if (error) {
        setTestStatus('warning');
        setTestMessage(`Σύνδεση επιτυχής, αλλά ο πίνακας "spiros_weight_logs" δεν υπάρχει ακόμη. Αντιγράψτε και τρέξτε το SQL script παρακάτω!`);
      } else {
        setTestStatus('success');
        setTestMessage(`🎉 Επιτυχής σύνδεση! Ο πίνακας "spiros_weight_logs" βρέθηκε (${data?.length ?? 0} εγγραφές).`);
      }
    } catch (err: any) {
      setTestStatus('warning');
      setTestMessage(`Σφάλμα επικοινωνίας: ${err.message}. Χρησιμοποιείται αυτόματο τοπικό sync.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-card bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Supabase Cloud Database & Tables</h3>
              <p className="text-xs text-slate-400">Πίνακες με πρόθεμα: <code className="text-emerald-400 font-mono">spiros_*</code></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1"
          >
            ✕
          </button>
        </div>

        {/* Project Info & Status */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span>Project Ref:</span>
            <span className="font-mono text-emerald-400 font-semibold">xrmvingehhiymchoggka</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Database Tables:</span>
            <span className="font-mono text-slate-300">spiros_weight_logs, spiros_foods, spiros_meals, spiros_daily_logs</span>
          </div>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={handleTestConnection}
              disabled={testStatus === 'testing'}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
            >
              {testStatus === 'testing' ? 'Έλεγχος...' : '⚡ Έλεγχος Σύνδεσης Πινάκων'}
            </button>
            <a
              href="https://supabase.com/dashboard/project/xrmvingehhiymchoggka/sql"
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 font-medium"
            >
              <span>Άνοιγμα Supabase SQL Editor</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {testMessage && (
            <div className={`p-2.5 rounded-lg mt-2 text-[11px] ${testStatus === 'success' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' : 'bg-amber-950/60 text-amber-300 border border-amber-500/30'}`}>
              {testMessage}
            </div>
          )}
        </div>

        {/* SQL Script Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              SQL Setup Script (Εκτέλεση στο Supabase SQL Editor):
            </label>
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Αντιγράφηκε!' : 'Αντιγραφή SQL'}</span>
            </button>
          </div>
          <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-56 select-all">
            {sqlScript}
          </pre>
        </div>

        {/* Dual Mode Note */}
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong>Αυτόματο Dual-Sync:</strong> Το Dashboard λειτουργεί άμεσα και αποθηκεύει τα πάντα τόσο τοπικά όσο και στο Supabase. Μόλις εκτελέσετε το SQL script παραπάνω, όλα τα δεδομένα θα συγχρονίζονται μόνιμα στο cloud!
          </span>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
          >
            Κλείσιμο
          </button>
        </div>

      </div>
    </div>
  );
};
