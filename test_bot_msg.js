import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import { searchSmartFoods, analyzeFoodDynamically } from './src/data/foodClassifier.js';
import { createClient } from '@supabase/supabase-js';

const TELEGRAM_TOKEN = '8603311936:AAG1e-zxKzU48elsr-t7dGyvQCSfvt0E32g';
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

const SUPABASE_URL = 'https://xrmvingehhiymchoggka.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybXZpbmdlaGhpeW1jaG9nZ2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNjkzMTEsImV4cCI6MjA5MDk0NTMxMX0.UDvGORYRXdo1IKTrduIJYJEfgNuli0LSpAC9njm7I9Q';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function sendMessage(chatId, text) {
  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    return await res.json();
  } catch (err) {
    console.error('Send error:', err);
  }
}

async function getTodayFoodLogs() {
  const today = new Date().toISOString().split('T')[0];
  try {
    const { data } = await supabase
      .from('spiros_daily_logs')
      .select('completed_habits')
      .eq('date', today)
      .single();
    if (data && Array.isArray(data.completed_habits)) {
      return data.completed_habits;
    }
  } catch (e) {
    console.error('get error:', e);
  }
  return [];
}

async function addTodayFoodLog(food, grams) {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const ratio = grams / 100;

  const entry = {
    id: 'fl-' + Date.now(),
    foodId: food.id,
    name: food.name,
    quantity: grams,
    calories: Math.round(food.calories * ratio),
    protein: Math.round(food.protein * ratio * 10) / 10,
    carbs: Math.round(food.carbs * ratio * 10) / 10,
    fat: Math.round(food.fat * ratio * 10) / 10,
    time: timeStr,
  };

  const currentLogs = await getTodayFoodLogs();
  const updatedLogs = [...currentLogs, entry];

  const { data: existing } = await supabase
    .from('spiros_daily_logs')
    .select('*')
    .eq('date', today)
    .single();

  const upsertRes = await supabase.from('spiros_daily_logs').upsert({
    id: existing?.id || 'daily-' + today,
    date: today,
    water_ml: existing?.water_ml ?? 0,
    fasting_hours: existing?.fasting_hours ?? 16,
    exercise_minutes: existing?.exercise_minutes ?? 20,
    exercise_type: existing?.exercise_type ?? 'recumbent_bike',
    lumbar_feeling: existing?.lumbar_feeling ?? 'good',
    completed_habits: updatedLogs,
    notes: existing?.notes ?? 'Καλή ενέργεια και καμία ενόχληση στη μέση.',
  }, { onConflict: 'date' });

  console.log('Upsert status:', upsertRes.error ? upsertRes.error.message : 'OK');
  return { entry, allLogs: updatedLogs };
}

async function run() {
  const food = searchSmartFoods('κοτόπουλο')[0];
  const { entry, allLogs } = await addTodayFoodLog(food, 200);
  console.log('Added entry:', entry);
  
  const totals = allLogs.reduce((acc, e) => ({
    calories: acc.calories + e.calories,
    protein: acc.protein + e.protein,
    carbs: acc.carbs + e.carbs,
    fat: acc.fat + e.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const res = await sendMessage('8162958857', 
    `<b>🟢 Κάνει | Καταχωρήθηκε!</b>\n` +
    `🍽️ <b>${food.name}</b> (200g)\n\n` +
    `<b>Macros γεύματος:</b>\n` +
    `• Θερμίδες: <b>${entry.calories} kcal</b>\n` +
    `• Πρωτεΐνη: <b>${entry.protein}g</b>\n` +
    `• Υδατάνθρακες: <b>${entry.carbs}g</b>\n` +
    `• Λίπος: <b>${entry.fat}g</b>\n\n` +
    `<i>${food.note}</i>\n\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📊 <b>Σύνολα σήμερα:</b>\n` +
    `🔥 ${totals.calories} kcal | 🥩 ${Math.round(totals.protein)}g πρωτεΐνη | 🍞 ${Math.round(totals.carbs)}/50g υδατάνθρακες\n` +
    `<i>(Ενημερώθηκε άμεσα και το Dashboard!)</i>`
  );
  console.log('Send reply:', res.ok ? 'SUCCESS' : res);
}
run();
