import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { searchSmartFoods, analyzeFoodDynamically } from './src/data/foodClassifier.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TELEGRAM_TOKEN = '8603311936:AAG1e-zxKzU48elsr-t7dGyvQCSfvt0E32g';
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xrmvingehhiymchoggka.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybXZpbmdlaGhpeW1jaG9nZ2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNjkzMTEsImV4cCI6MjA5MDk0NTMxMX0.UDvGORYRXdo1IKTrduIJYJEfgNuli0LSpAC9njm7I9Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CONFIG_FILE = path.join(__dirname, 'telegram_config.json');

// Load or save active chat IDs
function getSubscribers() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      return data.chatIds || [];
    } catch {
      return [];
    }
  }
  return [];
}

function saveSubscriber(chatId) {
  const current = getSubscribers();
  if (!current.includes(chatId)) {
    current.push(chatId);
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ chatIds: current }, null, 2));
    console.log(`[Telegram Bot] New subscriber saved: ${chatId}`);
  }
}

// Send Message Helper
async function sendMessage(chatId, text) {
  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });
    return await res.json();
  } catch (err) {
    console.error('[Telegram Bot] Error sending message:', err.message);
  }
}

// Generate text progress bar
function renderProgressBar(current, max = 3000, length = 10) {
  const percent = Math.min(100, Math.max(0, Math.round((current / max) * 100)));
  const filled = Math.round((percent / 100) * length);
  const empty = length - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}] ${percent}%`;
}

// Calculate ETA to reach 90kg (healthy pace: ~0.75kg / week)
function calculateGoalETA(currentWeight) {
  const remaining = Math.max(0, currentWeight - 90.0);
  if (remaining === 0) return 'Στόχος επιτεύχθηκε!';
  const weeksNeeded = Math.ceil(remaining / 0.75);
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + weeksNeeded * 7);
  
  const months = ['Ιανουαρίου', 'Φεβρουαρίου', 'Μαρτίου', 'Απριλίου', 'Μαΐου', 'Ιουνίου', 'Ιουλίου', 'Αυγούστου', 'Σεπτεμβρίου', 'Οκτωβρίου', 'Νοεμβρίου', 'Δεκεμβρίου'];
  const formattedDate = `${targetDate.getDate()} ${months[targetDate.getMonth()]} ${targetDate.getFullYear()}`;
  return `~${formattedDate} (σε περίπου ${weeksNeeded} εβδομάδες με ρυθμό 0.75kg/εβδομάδα)`;
}

// Database Helpers
async function getTodayWater() {
  const today = new Date().toISOString().split('T')[0];
  try {
    const { data } = await supabase
      .from('spiros_daily_logs')
      .select('water_ml')
      .eq('date', today)
      .single();
    if (data && typeof data.water_ml === 'number') {
      return data.water_ml;
    }
  } catch {
    // fallback
  }
  return 0;
}

async function addTodayWater(mlToAdd) {
  const today = new Date().toISOString().split('T')[0];
  const current = await getTodayWater();
  const newWater = Math.max(0, Math.min(6000, current + mlToAdd));
  
  try {
    await supabase.from('spiros_daily_logs').upsert({
      id: 'daily-' + today,
      date: today,
      water_ml: newWater,
      fasting_hours: 16,
      lumbar_feeling: 'good'
    }, { onConflict: 'date' });
  } catch (err) {
    console.error('Supabase water save error:', err.message);
  }
  return newWater;
}

async function resetTodayWater() {
  const today = new Date().toISOString().split('T')[0];
  try {
    await supabase.from('spiros_daily_logs').upsert({
      id: 'daily-' + today,
      date: today,
      water_ml: 0,
      fasting_hours: 16,
      lumbar_feeling: 'good'
    }, { onConflict: 'date' });
  } catch (err) {
    console.error('Supabase water reset error:', err.message);
  }
}

// Food Database Helpers for Supabase
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
  } catch {
    // fallback
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

  try {
    const { data: existing } = await supabase
      .from('spiros_daily_logs')
      .select('*')
      .eq('date', today)
      .single();

    await supabase.from('spiros_daily_logs').upsert({
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
  } catch (err) {
    console.error('Supabase food save error:', err.message);
  }

  return { entry, allLogs: updatedLogs };
}

async function clearTodayFoodLogs() {
  const today = new Date().toISOString().split('T')[0];
  try {
    const { data: existing } = await supabase
      .from('spiros_daily_logs')
      .select('*')
      .eq('date', today)
      .single();

    await supabase.from('spiros_daily_logs').upsert({
      id: existing?.id || 'daily-' + today,
      date: today,
      water_ml: existing?.water_ml ?? 0,
      completed_habits: [],
    }, { onConflict: 'date' });
  } catch (err) {
    console.error('Supabase food clear error:', err.message);
  }
}

async function saveWeight(weightKg) {
  const today = new Date().toISOString().split('T')[0];
  const log = {
    id: 'weight-' + Date.now(),
    date: today,
    weight: weightKg,
    pain_level: 4,
    notes: 'Καταγραφή από Telegram Bot'
  };
  try {
    await supabase.from('spiros_weight_logs').insert([log]);
  } catch (err) {
    console.error('Supabase weight save error:', err.message);
  }
}

// Parse Water Input from Greek natural text
function parseWaterAmount(text) {
  const lower = text.toLowerCase().trim();
  
  // 1 λίτρο, 1.5L, 2l, 2 λίτρα, κτλ.
  const literMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:λ|λ\.|λιτρ[αο]|l|lt|liter|liters)/);
  if (literMatch) {
    const num = parseFloat(literMatch[1].replace(',', '.'));
    if (!isNaN(num) && num > 0) return Math.round(num * 1000);
  }

  // 500ml, 250 ml, 750ml
  const mlMatch = lower.match(/(\d+)\s*(?:ml|μλ|μιλιλιτρ[αο])/);
  if (mlMatch) {
    const num = parseInt(mlMatch[1]);
    if (!isNaN(num) && num > 0) return num;
  }

  // ποτήρια (1 ποτήρι = 250ml)
  const glassMatch = lower.match(/(\d+)\s*ποτηρ/);
  if (glassMatch) {
    const num = parseInt(glassMatch[1]);
    if (!isNaN(num) && num > 0) return num * 250;
  }
  if (lower.includes('ενα ποτηρι') || lower.includes('1 ποτηρι')) return 250;
  if (lower.includes('δυο ποτηρια') || lower.includes('2 ποτηρια')) return 500;

  // απλό νούμερο με λέξη "ήπια" (π.χ. "ήπια 500" ή "ηπια 1000")
  const simpleMatch = lower.match(/(?:ηπια|ήπια)\s*(\d+)/);
  if (simpleMatch) {
    const num = parseInt(simpleMatch[1]);
    if (num <= 5) return num * 1000; // if wrote "ήπια 1" -> 1000ml
    return num;
  }

  return null;
}

// Parse Weight Input
function parseWeightAmount(text) {
  const lower = text.toLowerCase().trim();
  
  // "103.5 kg", "103,5 κιλά", "ζυγίστηκα 103.2"
  const match = lower.match(/(?:ζυγιστηκα|ειμαι|βαρος|κιλα|κιλά)?\s*(\d{2,3}(?:[.,]\d+)?)\s*(?:kg|κιλα|κιλά)?/);
  if (match) {
    const num = parseFloat(match[1].replace(',', '.'));
    if (!isNaN(num) && num >= 70 && num <= 160) {
      return num;
    }
  }
  return null;
}

// Parse Food Logging Input (e.g. "έφαγα 200g κοτόπουλο", "φαγητό: 150γρ σολομός")
function parseFoodGramAndName(text) {
  const lower = text.toLowerCase().trim();
  
  // Strip trigger prefix
  let cleaned = lower
    .replace(/^(?:εφαγα|έφαγα|φαγητο:|φαγητό:|φαγητο|φαγητό)\s*/i, '')
    .trim();

  // Extract grams if present: e.g. "200g", "200 γρ", "200γρ", "200 γραμμαρια"
  let grams = 100; // default
  const gramMatch = cleaned.match(/(\d+)\s*(?:g|gr|γρ|γραμμαρια|γραμμάρια|γραμμ)/);
  if (gramMatch) {
    grams = parseInt(gramMatch[1]) || 100;
    cleaned = cleaned.replace(gramMatch[0], '').trim();
  }

  // Extract piece count e.g. "2 αυγα", "3 κεφτεδακια", "1 μπανανα"
  const pieceMatch = cleaned.match(/^(\d+)\s*(?:αυγ|τεμ|κομματ|φετ|μεριδ)/);
  if (pieceMatch) {
    const pieces = parseInt(pieceMatch[1]) || 1;
    grams = pieces * 60; // ~60g per egg/piece
    cleaned = cleaned.replace(/^\d+\s*/, '').trim();
  }

  if (cleaned.length >= 2) {
    return { grams, query: cleaned };
  }
  return null;
}

// Message Router
async function handleIncomingMessage(msg) {
  const chatId = msg.chat.id;
  const text = msg.text || '';
  saveSubscriber(chatId);

  const lower = text.toLowerCase().trim();

  // 1. /start command
  if (lower === '/start' || lower === 'start' || lower === 'γεια' || lower === 'hello') {
    const todayWater = await getTodayWater();
    const bar = renderProgressBar(todayWater, 3000);
    
    await sendMessage(chatId, 
      `<b>Γεια σου Σπύρο!</b>\n` +
      `Είμαι ο προσωπικός σου βοηθός για τη <b>Low-Carb 16:8 διατροφή</b> και την <b>προστασία της μέσης</b>.\n\n` +
      `<b>Τι μπορώ να κάνω για σένα:</b>\n` +
      `• <b>Νερό:</b> Γράψε π.χ. <i>«ήπια 1 λίτρο»</i> ή <i>«500ml»</i> ή <i>«1 ποτήρι»</i>.\n` +
      `• <b>Φαγητό:</b> Γράψε π.χ. <i>«έφαγα 200g κοτόπουλο»</i> ή <i>«έφαγα 150g σολομό»</i> και θα υπολογίσω αμέσως θερμίδες, πρωτεΐνη και υδατάνθρακες!\n` +
      `• <b>Βάρος:</b> Γράψε π.χ. <i>«103.5 kg»</i> και θα το καταχωρήσω στη βάση.\n` +
      `• <b>Υπενθυμίσεις:</b> Αυτόματες υπενθυμίσεις για νερό και γεύματα 12:00, 16:00, 20:00.\n\n` +
      `<b>Σημερινό νερό:</b> ${(todayWater/1000).toFixed(2)} / 3.00 L\n${bar}`
    );
    return;
  }

  // 2. Clear or Show Food Log
  if (lower.includes('σβησε φαγητ') || lower.includes('μηδενισε φαγητ') || lower.includes('σβήσε φαγητά') || lower.includes('καθαρισε φαγητ')) {
    await clearTodayFoodLogs();
    await sendMessage(chatId, `<b>Τα σημερινά φαγητά μηδενίστηκαν!</b>\nΌλα τα macros καθάρισαν και στο Dashboard.`);
    return;
  }

  if (lower === 'τι εφαγα' || lower === 'τι έφαγα' || lower === 'φαγητα' || lower === 'φαγητά') {
    const logs = await getTodayFoodLogs();
    if (logs.length === 0) {
      await sendMessage(chatId, `<b>Δεν έχεις καταγράψει φαγητό σήμερα.</b>\nΓράψε π.χ. <i>«έφαγα 200g κοτόπουλο»</i>!`);
      return;
    }
    const totals = logs.reduce((acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    let listText = logs.map(e => `• ${e.time} - <b>${e.name}</b> (${e.quantity}g): ${e.calories}kcal | ${e.protein}g πρωτ. | ${e.carbs}g υδ.`).join('\n');
    
    await sendMessage(chatId,
      `<b>Σημερινή Διατροφή (${logs.length} καταχωρήσεις):</b>\n\n` +
      `${listText}\n\n` +
      `<b>ΣΥΝΟΛΑ ΗΜΕΡΑΣ:</b>\n` +
      `🔥 <b>Θερμίδες:</b> ${totals.calories} kcal\n` +
      `🥩 <b>Πρωτεΐνη:</b> ${Math.round(totals.protein * 10) / 10}g\n` +
      `🍞 <b>Υδατάνθρακες:</b> ${Math.round(totals.carbs * 10) / 10} / 50g ${totals.carbs > 50 ? '⚠️ (Υπέρβαση!)' : '✅ (Εντός keto)'}\n` +
      `🥑 <b>Λίπος:</b> ${Math.round(totals.fat * 10) / 10}g`
    );
    return;
  }

  // 3. Log Food via Telegram
  if (lower.startsWith('εφαγα') || lower.startsWith('έφαγα') || lower.startsWith('φαγητο:') || lower.startsWith('φαγητό:')) {
    const parsed = parseFoodGramAndName(text);
    if (parsed) {
      const results = searchSmartFoods(parsed.query);
      const foodItem = results.length > 0 ? results[0] : analyzeFoodDynamically(parsed.query);
      
      const { entry, allLogs } = await addTodayFoodLog(foodItem, parsed.grams);
      const totals = allLogs.reduce((acc, e) => ({
        calories: acc.calories + e.calories,
        protein: acc.protein + e.protein,
        carbs: acc.carbs + e.carbs,
        fat: acc.fat + e.fat,
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

      const badge = foodItem.status === 'allowed' ? '🟢 Κάνει' : foodItem.status === 'limited' ? '🟠 Μέτρια' : '🔴 Κόβεται';
      
      await sendMessage(chatId,
        `<b>${badge} | Καταχωρήθηκε!</b>\n` +
        `🍽️ <b>${foodItem.name}</b> (${parsed.grams}g)\n\n` +
        `<b>Macros γεύματος:</b>\n` +
        `• Θερμίδες: <b>${entry.calories} kcal</b>\n` +
        `• Πρωτεΐνη: <b>${entry.protein}g</b>\n` +
        `• Υδατάνθρακες: <b>${entry.carbs}g</b>\n` +
        `• Λίπος: <b>${entry.fat}g</b>\n\n` +
        `<i>${foodItem.note}</i>\n\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `📊 <b>Σύνολα σήμερα:</b>\n` +
        `🔥 ${totals.calories} kcal | 🥩 ${Math.round(totals.protein)}g πρωτεΐνη | 🍞 ${Math.round(totals.carbs)}/50g υδατάνθρακες\n` +
        `<i>(Ενημερώθηκε άμεσα και το Dashboard!)</i>`
      );
      return;
    }
  }

  // 4. Reset or Subtract water
  if (lower.includes('μηδενισ') || lower.includes('σβησε νερο') || lower.includes('σβήσε νερό') || lower.includes('reset') || lower === 'σβησε' || lower === 'σβήσε') {
    await resetTodayWater();
    await sendMessage(chatId, `<b>Το νερό της ημέρας μηδενίστηκε (0.00 / 3.00 L)!</b>\nΈτοιμο για νέα καταγραφή.`);
    return;
  }

  // 5. Check for Water logging or subtraction
  const isNegative = lower.includes('-') || lower.includes('αφαιρεσε') || lower.includes('αφαίρεσε');
  const waterMl = parseWaterAmount(text);
  if (waterMl) {
    const change = isNegative ? -waterMl : waterMl;
    const newTotal = await addTodayWater(change);
    const bar = renderProgressBar(newTotal, 3000);
    const changeL = (waterMl / 1000).toFixed(2);
    const totalL = (newTotal / 1000).toFixed(2);

    await sendMessage(chatId,
      `<b>${isNegative ? 'Αφαιρέθηκε' : 'Καταγράφηκε'}!</b> ${isNegative ? '-' : '+'}${changeL}L νερό.\n\n` +
      `<b>Σύνολο σήμερα:</b> ${totalL} / 3.00 L\n` +
      `<b>Πρόοδος:</b> ${bar}\n\n` +
      `<i>Οι μεσοσπονδύλιοι δίσκοι της μέσης ενυδατώνονται και αποφορτίζονται!</i>`
    );
    return;
  }

  // 6. Check for Weight logging
  const weightVal = parseWeightAmount(text);
  if (weightVal && (lower.includes('κιλ') || lower.includes('kg') || lower.includes('ζυγ') || text.length <= 6)) {
    await saveWeight(weightVal);
    const totalLost = (105.0 - weightVal).toFixed(1);
    const remaining = (weightVal - 90.0).toFixed(1);
    const spineRelief = (Math.max(0, parseFloat(totalLost)) * 4).toFixed(1);
    const eta = calculateGoalETA(weightVal);

    await sendMessage(chatId,
      `<b>Καταχωρήθηκε νέο βάρος: ${weightVal} kg!</b>\n\n` +
      `• <b>Απώλεια μέχρι σήμερα:</b> -${totalLost} kg\n` +
      `• <b>Απομένουν για τα 90 kg:</b> ${remaining} kg\n` +
      `• <b>Αποφόρτιση μέσης:</b> -${spineRelief} kg πίεσης στους σπονδύλους!\n` +
      `• <b>Εκτιμώμενη ημερομηνία στόχου:</b> ${eta}\n\n` +
      `<i>Συνέχισε δυνατά, η διατροφή 16:8 δουλεύει άψογα!</i>`
    );
    return;
  }

  // 7. Food question / Menu
  if (lower.includes('φαγητ') || lower.includes('μενού') || lower.includes('μενου') || lower.includes('τι να φαω') || lower.includes('τι να φάω')) {
    const nowHour = new Date().getHours();
    let mealAdvice = '';
    if (nowHour < 12) {
      mealAdvice = 'Είσαι σε φάση νηστείας! Στις 12:00 είναι το μεσημεριανό σου (π.χ. Κοτόπουλο ψητό με μπρόκολο και ελαιόλαδο ή Σολομός).';
    } else if (nowHour < 16) {
      mealAdvice = 'Ώρα για μεσημεριανό! Επίλεξε καθαρή πρωτεΐνη (Κοτόπουλο / Ψάρι / Μοσχάρι) + μεγάλη πράσινη σαλάτα με ελαιόλαδο.';
    } else if (nowHour < 20) {
      mealAdvice = 'Ώρα για σνακ (ή ετοιμασία βραδινού)! 1 στραγγιστό γιαούρτι 2% με 12 ωμά αμύγδαλα.';
    } else if (nowHour < 22) {
      mealAdvice = 'Ώρα για βραδινό! Ομελέτα με 3 αυγά + σπανάκι & φέτα ή Σαλάτα τόνου. Στις 20:30 κλείνει η κουζίνα!';
    } else {
      mealAdvice = 'Η κουζίνα έκλεισε για σήμερα! Μόνο νερό ή χαμομήλι μέχρι αύριο στις 12:00.';
    }

    await sendMessage(chatId, `<b>Έξυπνος Βοηθός Διατροφής:</b>\n\n${mealAdvice}`);
    return;
  }

  // Default response
  const todayWater = await getTodayWater();
  const bar = renderProgressBar(todayWater, 3000);
  await sendMessage(chatId,
    `<b>Έλαβα το μήνυμά σου!</b>\n\n` +
    `• Για νερό: <i>«ήπια 500ml»</i> ή <i>«ήπια 1 λίτρο»</i>\n` +
    `• Για φαγητό: <i>«έφαγα 200g κοτόπουλο»</i> ή <i>«έφαγα σαλάτα»</i>\n` +
    `• Για βάρος: <i>«103.2 kg»</i>\n` +
    `• Για να δεις τι έφαγες: <i>«τι έφαγα»</i>\n\n` +
    `<b>Σημερινό νερό:</b> ${(todayWater/1000).toFixed(2)} / 3.00 L\n${bar}`
  );
}

// Scheduled Periodic Reminders Engine
function startReminderScheduler() {
  console.log('[Telegram Bot] Reminder scheduler initialized.');

  // Track sent reminders to avoid duplicates in the same hour
  let lastWaterReminderHour = -1;
  let lastMealReminderHour = -1;

  setInterval(async () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const subscribers = getSubscribers();

    if (subscribers.length === 0) return;

    // 1. Meal Window Reminders
    if (currentMinute === 0 && currentHour !== lastMealReminderHour) {
      lastMealReminderHour = currentHour;

      if (currentHour === 12) {
        for (const chatId of subscribers) {
          await sendMessage(chatId,
            `<b>Ώρα 12:00: Άνοιξε το παράθυρο φαγητού!</b>\n` +
            `Ώρα για το μεσημεριανό σου. Εστίασε σε καθαρή πρωτεΐνη (κοτόπουλο, σολομό, μοσχάρι) με πράσινα λαχανικά και ελαιόλαδο.`
          );
        }
      } else if (currentHour === 16) {
        for (const chatId of subscribers) {
          await sendMessage(chatId,
            `<b>Ώρα 16:00: Απογευματινό Σνακ</b>\n` +
            `1 στραγγιστό γιαούρτι 2% με 12 ωμά αμύγδαλα για ενέργεια χωρίς υδατάνθρακες.`
          );
        }
      } else if (currentHour === 20) {
        for (const chatId of subscribers) {
          await sendMessage(chatId,
            `<b>Ώρα 20:00: Βραδινό (Τελευταίο Γεύμα)</b>\n` +
            `Ομελέτα με 3 αυγά και σαλάτα ή σαλάτα τόνου. Στις 20:30 κλείνει η κουζίνα για τη νυχτερινή νηστεία!`
          );
        }
      }
    }

    // 2. Random/Periodic Water Reminder (every 2.5 - 3 hours between 09:00 and 21:00)
    const isDaytime = currentHour >= 9 && currentHour <= 21;
    const hoursSinceLastWater = currentHour - lastWaterReminderHour;

    if (isDaytime && (hoursSinceLastWater >= 3 || lastWaterReminderHour === -1) && currentMinute === 30) {
      lastWaterReminderHour = currentHour;
      const todayWater = await getTodayWater();
      const bar = renderProgressBar(todayWater, 3000);

      const waterMessages = [
        `<b>Σπύρο, ώρα για νερό!</b>\nΑν δεν ήπιες νερό, πιες 1 μεγάλο ποτήρι τώρα για να ενυδατωθούν οι δίσκοι της μέσης σου.\n\nΣημερινό σύνολο: ${(todayWater/1000).toFixed(2)} / 3.00 L\n${bar}\n\n<i>Γράψε μου π.χ. «ήπια 250ml» για να το καταγράψω!</i>`,
        `<b>Υπενθύμιση Ενυδάτωσης:</b>\nΣπύρο, κάθε ποτήρι νερό αποφορτίζει τη σπονδυλική στήλη και βοηθά στην καύση λίπους.\n\nΣημερινό σύνολο: ${(todayWater/1000).toFixed(2)} / 3.00 L\n${bar}\n\n<i>Μόλις πιεις, γράψε μου π.χ. «ήπια 500ml»!</i>`,
        `<b>Σπύρο, πίνουμε νερό!</b>\nΣτόχος είναι τα 3 λίτρα σήμερα. Πιες τώρα ένα ποτήρι και γράψε μου να το περάσω στο Dashboard!`
      ];
      const randomMsg = waterMessages[Math.floor(Math.random() * waterMessages.length)];

      for (const chatId of subscribers) {
        await sendMessage(chatId, randomMsg);
      }
    }

  }, 30 * 1000); // check every 30 seconds
}

// Telegram Long Polling Engine
let lastUpdateId = 0;

async function pollUpdates() {
  try {
    const res = await fetch(`${TELEGRAM_API}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`);
    const data = await res.json();

    if (data.ok && Array.isArray(data.result)) {
      for (const update of data.result) {
        lastUpdateId = update.update_id;
        if (update.message && update.message.text) {
          await handleIncomingMessage(update.message);
        }
      }
    }
  } catch (err) {
    // Network or timeout, retry
  }
  setTimeout(pollUpdates, 1000);
}

// Start Bot
console.log('=============================================');
console.log('🤖 Spiros Telegram Bot Service (@sgkdigital_bot)');
console.log('=============================================');

async function init() {
  try {
    await fetch(`${TELEGRAM_API}/deleteWebhook?drop_pending_updates=false`);
    console.log('[Telegram Bot] Webhook cleared, starting polling.');
  } catch (err) {
    console.warn('[Telegram Bot] Webhook clear error:', err.message);
  }
  pollUpdates();
  startReminderScheduler();
}

init();
