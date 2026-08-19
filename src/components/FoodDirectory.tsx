import React, { useState } from 'react';
import { Search, CheckCircle2, AlertTriangle, XCircle, Plus, Sparkles, Filter, HeartPulse } from 'lucide-react';
import { FoodItem, FoodCategory, FoodStatus } from '../types';

interface FoodDirectoryProps {
  foods: FoodItem[];
  onAddFood: (food: Omit<FoodItem, 'id'>) => Promise<void>;
  onDeleteFood: (id: string) => Promise<void>;
}

export const FoodDirectory: React.FC<FoodDirectoryProps> = ({
  foods,
  onAddFood,
  onDeleteFood,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<FoodStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<FoodCategory | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Food Form State
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<FoodCategory>('proteins');
  const [newStatus, setNewStatus] = useState<FoodStatus>('allowed');
  const [newDescription, setNewDescription] = useState('');
  const [newBenefits, setNewBenefits] = useState('');
  const [newSpineBenefit, setNewSpineBenefit] = useState('');
  const [newScore, setNewScore] = useState(5);

  const filteredFoods = foods.filter((food) => {
    const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      food.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      food.benefits_or_harms.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || food.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || food.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleAddFoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    await onAddFood({
      name: newName,
      category: newCategory,
      status: newStatus,
      description: newDescription || 'Προσαρμοσμένη τροφή',
      benefits_or_harms: newBenefits || 'Προστέθηκε από τον χρήστη',
      anti_inflammatory_score: newScore,
      spine_benefit: newSpineBenefit,
      glycemic_index: newStatus === 'forbidden' ? 'high' : 'low',
      icon: newStatus === 'forbidden' ? '🚫' : (newCategory === 'proteins' ? '🥩' : '🥗'),
    });

    setShowAddModal(false);
    setNewName('');
    setNewDescription('');
    setNewBenefits('');
    setNewSpineBenefit('');
  };

  const allowedCount = foods.filter(f => f.status === 'allowed').length;
  const forbiddenCount = foods.filter(f => f.status === 'forbidden').length;
  const cautionCount = foods.filter(f => f.status === 'caution').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-emerald-400" />
            Οδηγός Τροφών: Τι Τρώμε & Τι Αποφεύγουμε
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Αντιφλεγμονώδης διατροφή Low-Carb για μέγιστη καύση λίπους και προστασία των σπονδύλων.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-md shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Προσθήκη Τροφής</span>
        </button>
      </div>

      {/* Quick Summary Pill Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setStatusFilter(statusFilter === 'allowed' ? 'all' : 'allowed')}
          className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${
            statusFilter === 'allowed'
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
              : 'glass-card border-slate-800 text-slate-300 hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Επιτρέπονται (Ναι)</p>
              <p className="text-[11px] text-emerald-400">{allowedCount} τροφές στη λίστα</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
            ✅ Ναι
          </span>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'caution' ? 'all' : 'caution')}
          className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${
            statusFilter === 'caution'
              ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/30'
              : 'glass-card border-slate-800 text-slate-300 hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Με Μέτρο</p>
              <p className="text-[11px] text-amber-400">{cautionCount} τροφές στη λίστα</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-500/20 text-amber-300">
            ⚠️ Μέτρο
          </span>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'forbidden' ? 'all' : 'forbidden')}
          className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${
            statusFilter === 'forbidden'
              ? 'bg-red-500/20 border-red-500 text-red-300 ring-2 ring-red-500/30'
              : 'glass-card border-slate-800 text-slate-300 hover:border-red-500/40'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Απαγορεύονται (Όχι)</p>
              <p className="text-[11px] text-red-400">{forbiddenCount} τροφές στη λίστα</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-500/20 text-red-300">
            ❌ Κόψιμο
          </span>
        </button>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Αναζήτηση τροφής (π.χ. σολομός, ψωμί, μπρόκολο, γιαούρτι)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 flex items-center gap-1 shrink-0 font-medium">
            <Filter className="w-3.5 h-3.5" /> Κατηγορία:
          </span>
          {[
            { id: 'all', label: 'Όλες' },
            { id: 'proteins', label: '🥩 Πρωτεΐνες' },
            { id: 'vegetables', label: '🥦 Λαχανικά' },
            { id: 'fats', label: '🥑 Καλά Λιπαρά' },
            { id: 'dairy', label: '🥣 Γαλακτοκομικά' },
            { id: 'carbs', label: '🍞 Υδατάνθρακες' },
            { id: 'beverages', label: '🍵 Ροφήματα' },
            { id: 'fruits', label: '🫐 Φρούτα' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id as any)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                categoryFilter === cat.id
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Foods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFoods.map((food) => {
          const isAllowed = food.status === 'allowed';
          const isCaution = food.status === 'caution';
          const isForbidden = food.status === 'forbidden';

          return (
            <div
              key={food.id}
              className={`glass-card rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                isAllowed
                  ? 'border-emerald-500/20 hover:border-emerald-500/50 bg-slate-900/60'
                  : isCaution
                  ? 'border-amber-500/20 hover:border-amber-500/50 bg-slate-900/60'
                  : 'border-red-500/20 hover:border-red-500/50 bg-red-950/10'
              }`}
            >
              <div>
                {/* Header: Icon, Name & Status badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{food.icon || '🥗'}</span>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-snug">{food.name}</h4>
                      <span className="text-[10px] text-slate-400 capitalize">{food.category}</span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      isAllowed
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isCaution
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {isAllowed ? 'Επιτρέπεται' : isCaution ? 'Με Μέτρο' : 'Κόβεται'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 mb-2 leading-relaxed">{food.description}</p>

                {/* Effect / Harms */}
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-2">
                  <p className="text-[11px] text-slate-300">
                    <strong className={isForbidden ? 'text-red-400' : 'text-emerald-400'}>
                      {isForbidden ? '⚠️ Επίπτωση: ' : '✨ Όφελος: '}
                    </strong>
                    {food.benefits_or_harms}
                  </p>
                </div>

                {/* Spine Specific Benefit */}
                {food.spine_benefit && (
                  <div className="p-2 rounded-xl bg-indigo-950/30 border border-indigo-500/20 mb-2">
                    <p className="text-[11px] text-indigo-300 flex items-start gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <span><strong>Σπονδυλική Στήλη:</strong> {food.spine_benefit}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Footer: Anti-inflammatory score */}
              <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between text-[11px] text-slate-400">
                <span>Αντιφλεγμονώδης Δράση:</span>
                <div className="flex items-center text-amber-400 font-bold">
                  {'★'.repeat(food.anti_inflammatory_score)}
                  <span className="text-slate-600">{'★'.repeat(5 - food.anti_inflammatory_score)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredFoods.length === 0 && (
        <div className="text-center py-12 glass-card rounded-2xl border border-slate-800">
          <p className="text-slate-400 text-sm">Δεν βρέθηκαν τροφές με τα επιλεγμένα κριτήρια.</p>
        </div>
      )}

      {/* Add Food Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Προσθήκη Νέας Τροφής</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddFoodSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Όνομα Τροφής</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="π.χ. Μπακαλιάρος ψητός"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Κατάσταση</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as FoodStatus)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="allowed">✅ Επιτρέπεται</option>
                    <option value="caution">⚠️ Με Μέτρο</option>
                    <option value="forbidden">❌ Απαγορεύεται</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Κατηγορία</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as FoodCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="proteins">Πρωτεΐνες</option>
                    <option value="vegetables">Λαχανικά</option>
                    <option value="fats">Καλά Λιπαρά</option>
                    <option value="dairy">Γαλακτοκομικά</option>
                    <option value="carbs">Υδατάνθρακες</option>
                    <option value="beverages">Ροφήματα</option>
                    <option value="fruits">Φρούτα</option>
                    <option value="snacks">Σνακ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Περιγραφή</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="π.χ. Άπαχο λευκό ψάρι με υψηλή πρωτεΐνη"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Οφέλη ή Επιπτώσεις</label>
                <input
                  type="text"
                  value={newBenefits}
                  onChange={(e) => setNewBenefits(e.target.value)}
                  placeholder="π.χ. Βοηθάει στον κορεσμό και κρατάει χαμηλή ινσουλίνη"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Ειδικό όφελος για μέση / σπονδύλους (προαιρετικό)</label>
                <input
                  type="text"
                  value={newSpineBenefit}
                  onChange={(e) => setNewSpineBenefit(e.target.value)}
                  placeholder="π.χ. Ενίσχυση οστών και μηδενική φλεγμονή"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Αντιφλεγμονώδης Βαθμός (1-5): {newScore} αστέρια
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={newScore}
                  onChange={(e) => setNewScore(parseInt(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Ακύρωση
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md"
                >
                  Προσθήκη στη Βάση
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
