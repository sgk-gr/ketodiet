import React, { useState } from 'react';
import { Utensils, Clock, Flame, Sparkles, ChevronDown, ChevronUp, ShoppingBag, CheckSquare } from 'lucide-react';
import { MealRecipe } from '../types';

interface MealPlannerProps {
  meals: MealRecipe[];
}

export const MealPlanner: React.FC<MealPlannerProps> = ({ meals }) => {
  const days: MealRecipe['day'][] = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο', 'Κυριακή'];
  const [selectedDay, setSelectedDay] = useState<MealRecipe['day']>('Δευτέρα');
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);
  const [showGroceryList, setShowGroceryList] = useState<boolean>(false);

  const dayMeals = meals.filter((m) => m.day === selectedDay);

  // Daily totals
  const totalCalories = dayMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
  const totalProtein = dayMeals.reduce((acc, m) => acc + (m.protein_g || 0), 0);
  const totalCarbs = dayMeals.reduce((acc, m) => acc + (m.carbs_g || 0), 0);
  const totalFat = dayMeals.reduce((acc, m) => acc + (m.fat_g || 0), 0);

  const toggleExpand = (id: string) => {
    setExpandedMealId(expandedMealId === id ? null : id);
  };

  // Compile full weekly grocery list
  const allIngredients = Array.from(
    new Set(meals.flatMap((m) => m.ingredients || []))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Utensils className="w-5 h-5 text-emerald-400" />
            Εβδομαδιαίο Μενού & Συνταγές (Low-Carb 16:8)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Σχεδιασμένο για κορεσμό, διατήρηση μυϊκής μάζας, μηδενική ζάχαρη και αντιφλεγμονώδη δράση.
          </p>
        </div>
        <button
          onClick={() => setShowGroceryList(!showGroceryList)}
          className="flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition shadow-sm"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{showGroceryList ? 'Επιστροφή στο Μενού' : 'Λίστα Σούπερ Μάρκετ Εβδομάδας'}</span>
        </button>
      </div>

      {showGroceryList ? (
        /* Grocery List View */
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                Λίστα Αγορών για όλη την Εβδομάδα
              </h3>
              <p className="text-xs text-slate-400">Όλα τα υλικά για τις συνταγές Δευτέρας έως Κυριακής</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
            >
              Εκτύπωση
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {allIngredients.map((item, index) => (
              <div key={index} className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300">
                <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Day Selector Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-2">
            {days.map((day) => {
              const isActive = selectedDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                      : 'glass-card text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Daily Nutrition Summary Bar */}
          <div className="glass-card rounded-2xl p-4 border border-slate-800/80 bg-slate-900/40 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Συνολικές Θερμίδες</span>
              <span className="text-lg font-extrabold text-white">{totalCalories} <span className="text-xs font-normal text-slate-400">kcal</span></span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Πρωτεΐνη (Κορεσμός)</span>
              <span className="text-lg font-extrabold text-emerald-400">{totalProtein}g</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Υδατάνθρακες (Low-Carb)</span>
              <span className="text-lg font-extrabold text-amber-400">{totalCarbs}g <span className="text-[10px] text-emerald-400 font-normal">(&lt;25g)</span></span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Καλά Λιπαρά</span>
              <span className="text-lg font-extrabold text-teal-400">{totalFat}g</span>
            </div>
          </div>

          {/* Meals Timeline */}
          <div className="space-y-4">
            {dayMeals.map((meal) => {
              const isExpanded = expandedMealId === meal.id;
              const isLunch = meal.meal_type === 'lunch';
              const isSnack = meal.meal_type === 'snack';
              const isDinner = meal.meal_type === 'dinner';

              return (
                <div
                  key={meal.id}
                  className="glass-card rounded-2xl border border-slate-800/80 overflow-hidden transition hover:border-slate-700 bg-slate-900/50"
                >
                  {/* Meal Header Card */}
                  <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start space-x-3.5">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                          isLunch
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : isSnack
                            ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
                            : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                        }`}
                      >
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                            {meal.time} • {isLunch ? 'Μεσημεριανό' : isSnack ? 'Σνακ' : 'Βραδινό'}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white mt-0.5">{meal.title}</h4>
                        <p className="text-xs text-slate-300 mt-1">{meal.description}</p>
                      </div>
                    </div>

                    {/* Macro Badges & Expand Button */}
                    <div className="flex items-center space-x-3 self-end md:self-center">
                      <div className="flex items-center space-x-2 text-[11px] font-semibold">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white">
                          {meal.calories} kcal
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                          {meal.protein_g}g πρωτ.
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-300">
                          {meal.carbs_g}g υδατ.
                        </span>
                      </div>
                      <button
                        onClick={() => toggleExpand(meal.id)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title="Εμφάνιση υλικών και οδηγιών"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Recipe & Ingredients View */}
                  {isExpanded && (
                    <div className="p-5 pt-0 border-t border-slate-800/80 bg-slate-950/60 space-y-4 animate-in fade-in duration-200">
                      {/* Spine Benefit Alert */}
                      {meal.spine_benefit && (
                        <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300 flex items-center gap-2 mt-4">
                          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span><strong>Όφελος για τη Μέση:</strong> {meal.spine_benefit}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* Ingredients */}
                        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                          <h5 className="font-bold text-white mb-2.5 flex items-center gap-1.5">
                            <Utensils className="w-3.5 h-3.5 text-emerald-400" /> Υλικά
                          </h5>
                          <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                            {meal.ingredients.map((ing, idx) => (
                              <li key={idx}>{ing}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Instructions */}
                        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                          <h5 className="font-bold text-white mb-2.5 flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5 text-amber-400" /> Εκτέλεση
                          </h5>
                          <ol className="space-y-1.5 text-slate-300 list-decimal list-inside">
                            {meal.instructions.map((ins, idx) => (
                              <li key={idx}>{ins}</li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
