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

// Store recent conversation history for each chat
const chatHistories = new Map();

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
      }),
    });
    const json = await res.json();
    if (!json.ok) {
      console.error('[Telegram Bot] Send message API error:', json);
    }
    return json;
  } catch (err) {
    console.error('[Telegram Bot] Error sending message:', err.message);
  }
}

// Progress Bar Helper
function renderProgressBar(current, max = 3000, length = 10) {
  const percent = Math.min(100, Math.max(0, Math.round((current / max) * 100)));
  const filled = Math.round((percent / 100) * length);
  const empty = length - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}] ${percent}%`;
}

// Goal ETA Helper
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

// ==========================================
// SUPABASE HELPERS
// ==========================================

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
  } catch {}
  return 0;
}

async function addTodayWater(mlToAdd) {
  const today = new Date().toISOString().split('T')[0];
  const current = await getTodayWater();
  const newWater = Math.max(0, Math.min(6000, current + mlToAdd));
  
  try {
    const { data: existing } = await supabase
      .from('spiros_daily_logs')
      .select('*')
      .eq('date', today)
      .single();

    await supabase.from('spiros_daily_logs').upsert({
      id: existing?.id || 'daily-' + today,
      date: today,
      water_ml: newWater,
      fasting_hours: existing?.fasting_hours ?? 16,
      exercise_minutes: existing?.exercise_minutes ?? 20,
      exercise_type: existing?.exercise_type ?? 'recumbent_bike',
      lumbar_feeling: existing?.lumbar_feeling ?? 'good',
      completed_habits: existing?.completed_habits ?? [],
      notes: existing?.notes ?? 'Καλή ενέργεια και καμία ενόχληση στη μέση.',
    }, { onConflict: 'date' });
  } catch (err) {
    console.error('Supabase water save error:', err.message);
  }
  return newWater;
}

async function resetTodayWater() {
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
      water_ml: 0,
      fasting_hours: existing?.fasting_hours ?? 16,
      exercise_minutes: existing?.exercise_minutes ?? 20,
      exercise_type: existing?.exercise_type ?? 'recumbent_bike',
      lumbar_feeling: existing?.lumbar_feeling ?? 'good',
      completed_habits: existing?.completed_habits ?? [],
    }, { onConflict: 'date' });
  } catch (err) {
    console.error('Supabase reset water error:', err.message);
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
  } catch {}
  return [];
}

async function addTodayFoodLog(entry) {
  const today = new Date().toISOString().split('T')[0];
  try {
    const existingList = await getTodayFoodLogs();
    const updatedList = [...existingList, entry];

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
      completed_habits: updatedList,
      notes: existing?.notes ?? 'Καλή ενέργεια και καμία ενόχληση στη μέση.',
    }, { onConflict: 'date' });

    return updatedList;
  } catch (err) {
    console.error('Supabase add food error:', err.message);
    return [];
  }
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
      fasting_hours: existing?.fasting_hours ?? 16,
      exercise_minutes: existing?.exercise_minutes ?? 20,
      exercise_type: existing?.exercise_type ?? 'recumbent_bike',
      lumbar_feeling: existing?.lumbar_feeling ?? 'good',
      completed_habits: [],
    }, { onConflict: 'date' });
  } catch (err) {
    console.error('Supabase clear foods error:', err.message);
  }
}

async function getLatestWeight() {
  try {
    const { data } = await supabase
      .from('spiros_weight_logs')
      .select('weight, date')
      .order('date', { ascending: false })
      .limit(1);
    if (data && data.length > 0) {
      return data[0].weight;
    }
  } catch {}
  return 105.0;
}

async function addWeightLog(weight) {
  const today = new Date().toISOString().split('T')[0];
  try {
    await supabase.from('spiros_weight_logs').insert({
      id: 'weight-' + Date.now(),
      date: today,
      weight: weight,
      pain_level: 4,
      notes: 'Καταγραφή από Telegram AI Coach',
    });
  } catch (err) {
    console.error('Supabase add weight error:', err.message);
  }
}

// ==========================================
// AI HEALTH COACH ENGINE (GPT-4o-mini via Supabase)
// ==========================================

async function callAiCoach(chatId, userMessage) {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  const currentWeight = await getLatestWeight();
  const waterMl = await getTodayWater();
  const foodLogs = await getTodayFoodLogs();

  let phaseDescription = '';
  if (hours >= 0 && hours < 12) {
    phaseDescription = 'Φάση Νηστείας (Μηδέν θερμίδες, μόνο νερό/καφές χωρίς ζάχαρη). Το παράθυρο φαγητού ανοίγει στις 12:00.';
  } else if (hours >= 12 && hours < 20) {
    phaseDescription = 'Ενεργό Παράθυρο Φαγητού (12:00 - 20:00). Επιτρέπεται μεσημεριανό, απογευματινό σνακ και βραδινό.';
  } else {
    phaseDescription = 'Η κουζίνα έκλεισε (20:00 - 12:00). Μόνο νερό ή αφέψημα χωρίς θερμίδες.';
  }

  const todayMacros = foodLogs.reduce((acc, f) => ({
    calories: acc.calories + (f.calories || 0),
    protein: acc.protein + (f.protein || 0),
    carbs: acc.carbs + (f.carbs || 0),
    fat: acc.fat + (f.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const foodSummaryText = foodLogs.length > 0
    ? foodLogs.map(f => `• ${f.name} (${f.quantity}g) - ${f.calories}kcal, P:${f.protein}g, C:${f.carbs}g, F:${f.fat}g [${f.time || ''}]`).join('\n')
    : 'Δεν έχει καταγραφεί κανένα γεύμα ακόμα για σήμερα.';

  const systemPrompt = `Είσαι ο κορυφαίος, έξυπνος, ευγενικός και επιστημονικά καταρτισμένος AI Personal Health & Keto Coach του Σπύρου.
Μιλάς άπταιστα Ελληνικά με φυσικό, ζεστό και επαγγελματικό τόνο (σαν να μιλάει με έμπειρο γιατρό/διατροφολόγο και προσωπικό του φίλο).

[ΠΛΗΡΕΣ ΠΡΟΦΙΛ ΧΡΗΣΤΗ - ΣΠΥΡΟΣ]:
- Όνομα: Σπύρος
- Σωματικά δεδομένα: Ύψος 180cm, Τρέχον Βάρος: ${currentWeight} kg, Αρχικό: 105.0 kg, Στόχος: 90.0 kg (-15 kg λίπος).
- Ιατρική Κατάσταση: Στένωση Σπονδυλικού Σωλήνα (Spinal Canal Stenosis).
  * ΑΥΣΤΗΡΟΙ ΚΑΝΟΝΕΣ: ΑΠΑΓΟΡΕΥΟΝΤΑΙ το τρέξιμο, τα άλματα, τα ελεύθερα βάρη στη μέση και οι κλασικοί κοιλιακοί.
  * ΕΠΙΤΡΕΠΕΤΑΙ & ΣΥΝΙΣΤΑΤΑΙ: Στατικό ποδήλατο με πλάτη (recumbent bike), περπάτημα σε ίσιο έδαφος (15-20 λεπτά), κολύμβηση.
  * ΣΗΜΑΣΙΑ ΝΕΡΟΥ: 3.0 Λίτρα/ημέρα για ενυδάτωση των μεσοσπονδύλιων δίσκων ώστε να μην τρίβονται τα νεύρα.
- ΔΙΑΤΡΟΦΗ: Low-Carb 16:8 Διαλειμματική Νηστεία (Νηστεία 20:00 - 12:00 | Παράθυρο Φαγητού 12:00 - 20:00).
  * Υδατάνθρακες: Στόχος < 20-30g net carbs/ημέρα (ΜΟΝΟ από πράσινα λαχανικά/σαλάτες).
  * Απαγορεύονται: Ψωμί, ζυμαρικά, ρύζι, πατάτες, ζάχαρη, γλυκά, αναψυκτικά, χυμοί, αλκοόλ.
  * Επιτρέπονται: Μοσχάρι, κοτόπουλο, γαλοπούλα, χοιρινό, ψάρια (σολομός, τσιπούρα, λαβράκι, τόνος), αυγά, ελαιόλαδο, φέτα, πράσινα λαχανικά (μπρόκολο, σπαράγγια, μαρούλι, αγγούρι).

[ΤΡΕΧΟΥΣΑ ΚΑΤΑΣΤΑΣΗ ΣΗΜΕΡΑ]:
- Ώρα: ${timeStr} (${phaseDescription})
- Νερό σήμερα: ${waterMl} ml / 3000 ml
- Σημερινά γεύματα:\n${foodSummaryText}
- Σύνολο Macros σήμερα: ${todayMacros.calories} kcal | Πρωτεΐνη: ${todayMacros.protein}g | Υδατάνθρακες: ${todayMacros.carbs}g | Λιπαρά: ${todayMacros.fat}g

[ΚΑΝΟΝΕΣ & ACTIONS]:
1. Αν ο Σπύρος δηλώσει ότι έφαγε κάτι (π.χ. «έφαγα 200g κοτόπουλο και μαρούλι» ή «έφαγα 3 αυγά»), απάντησε ανθρώπινα αναλύοντας τις θερμίδες, την πρωτεΐνη, τους υδατάνθρακες και τα οφέλη για τη μέση του.
   Στο ΤΕΛΟΣ του μηνύματος βάλε ένα tag καταγραφής:
   [ACTION:LOG_FOOD:{"name":"Κοτόπουλο Στήθος","grams":200,"calories":330,"protein":62,"carbs":0,"fat":7}]
2. Αν ο Σπύρος δηλώσει ότι ήπιε νερό (π.χ. «ήπια 500ml», «ήπια 1 ποτήρι νερό», «ήπια 1 λίτρο»), επιβράβευσέ τον και πρόσθεσε στο τέλος:
   [ACTION:ADD_WATER:500]
3. Αν ο Σπύρος δηλώσει νέο βάρος (π.χ. «ζυγίζομαι 103.5kg»), συνεχάρη τον και πρόσθεσε στο τέλος:
   [ACTION:LOG_WEIGHT:103.5]
4. Αν ζητήσει διαγραφή/μηδενισμό φαγητών ή νερού, απάντησε ανάλογα και βάλε:
   [ACTION:CLEAR_FOODS] ή [ACTION:RESET_WATER]
5. Μίλα πάντα στα Ελληνικά, ευγενικά, ενθαρρυντικά και με καθαρή μορφοποίηση.`;

  let history = chatHistories.get(chatId) || [];
  if (history.length > 8) {
    history = history.slice(-8);
  }

  const messages = [
    { role: 'user', content: systemPrompt },
    { role: 'assistant', content: 'Κατάλαβα απόλυτα! Είμαι ο AI Personal Coach του Σπύρου, έτοιμος να απαντήσω και να καταγράψω τα πάντα.' },
    ...history,
    { role: 'user', content: userMessage }
  ];

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({ messages })
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let rawAccumulator = '';
    let aiResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      rawAccumulator += decoder.decode(value, { stream: true });

      const lines = rawAccumulator.split('\n');
      rawAccumulator = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('0:')) {
          const jsonPart = trimmed.substring(2);
          try {
            aiResponse += JSON.parse(jsonPart);
          } catch {
            if (jsonPart.startsWith('"') && jsonPart.endsWith('"')) {
              aiResponse += jsonPart.slice(1, -1);
            } else {
              aiResponse += jsonPart;
            }
          }
        }
      }
    }

    if (rawAccumulator.trim().startsWith('0:')) {
      try {
        aiResponse += JSON.parse(rawAccumulator.trim().substring(2));
      } catch {}
    }

    if (!aiResponse) {
      aiResponse = 'Δεν μπόρεσα να επεξεργαστώ το αίτημα αυτή τη στιγμή. Δοκίμασε ξανά σε λίγο!';
    }

    // Process Actions from AI Response
    let cleanMessage = aiResponse;

    // 1. Water Action
    const waterMatch = cleanMessage.match(/\[ACTION:ADD_WATER:(\d+)\]/i);
    if (waterMatch) {
      const ml = parseInt(waterMatch[1], 10);
      if (!isNaN(ml) && ml > 0) {
        const newTotal = await addTodayWater(ml);
        cleanMessage = cleanMessage.replace(waterMatch[0], '').trim();
        cleanMessage += `\n\n💧 Σύνολο νερού σήμερα: <b>${newTotal}ml</b> / 3000ml\n${renderProgressBar(newTotal, 3000)}`;
      }
    }

    // 2. Reset Water Action
    if (cleanMessage.includes('[ACTION:RESET_WATER]')) {
      await resetTodayWater();
      cleanMessage = cleanMessage.replace('[ACTION:RESET_WATER]', '').trim();
      cleanMessage += `\n\n💧 Το νερό μηδενίστηκε (0ml / 3000ml).`;
    }

    // 3. Food Action
    const foodMatch = cleanMessage.match(/\[ACTION:LOG_FOOD:(\{.*?\})\]/is);
    if (foodMatch) {
      try {
        const foodData = JSON.parse(foodMatch[1]);
        const entry = {
          id: 'fl-' + Date.now(),
          foodId: 'food-' + Date.now(),
          name: foodData.name || 'Γεύμα',
          quantity: foodData.grams || 100,
          calories: foodData.calories || 0,
          protein: foodData.protein || 0,
          carbs: foodData.carbs || 0,
          fat: foodData.fat || 0,
          time: timeStr,
        };
        await addTodayFoodLog(entry);
        cleanMessage = cleanMessage.replace(foodMatch[0], '').trim();
        cleanMessage += `\n\n✅ <i>Αποθηκεύτηκε αυτόματα στο Dashboard και στη Supabase!</i>`;
      } catch (err) {
        console.error('Failed to parse AI food action:', err);
      }
    }

    // 4. Clear Foods Action
    if (cleanMessage.includes('[ACTION:CLEAR_FOODS]')) {
      await clearTodayFoodLogs();
      cleanMessage = cleanMessage.replace('[ACTION:CLEAR_FOODS]', '').trim();
      cleanMessage += `\n\n🗑️ <i>Τα σημερινά γεύματα διαγράφηκαν από τη βάση δεδομένων.</i>`;
    }

    // 5. Weight Action
    const weightMatch = cleanMessage.match(/\[ACTION:LOG_WEIGHT:([\d\.]+)\]/i);
    if (weightMatch) {
      const w = parseFloat(weightMatch[1]);
      if (!isNaN(w) && w > 0) {
        await addWeightLog(w);
        const lost = (105.0 - w).toFixed(1);
        const relief = (Math.max(0, parseFloat(lost)) * 4).toFixed(1);
        cleanMessage = cleanMessage.replace(weightMatch[0], '').trim();
        cleanMessage += `\n\n⚖️ <b>Καταγραφή Βάρους: ${w}kg</b>\n• Συνολική απώλεια: <b>-${lost}kg</b>\n• Ανακούφιση μέσης: <b>-${relief}kg πίεση</b> στους σπονδύλους!\n• Πρόβλεψη για 90kg: ${calculateGoalETA(w)}`;
      }
    }

    // Save to conversation history
    history.push({ role: 'user', content: userMessage });
    history.push({ role: 'assistant', content: cleanMessage });
    chatHistories.set(chatId, history);

    return cleanMessage;
  } catch (err) {
    console.error('AI Coach execution error:', err.message);
    return `Σπύρο, είχα ένα στιγμιαίο θέμα επικοινωνίας με το AI μοντέλο (${err.message}). Δοκίμασε ξανά σε 5 δευτερόλεπτα!`;
  }
}

// ==========================================
// SCHEDULED AUTOMATED REMINDERS
// ==========================================

const sentRemindersToday = new Set();

function startScheduler() {
  setInterval(async () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const hour = now.getHours();
    const minute = now.getMinutes();
    const timeKey = `${todayStr}-${hour}:${minute}`;

    const subscribers = getSubscribers();
    if (subscribers.length === 0) return;

    // 09:00 - Morning Fasting & Water Check
    if (hour === 9 && minute === 0 && !sentRemindersToday.has(`${todayStr}-09:00`)) {
      sentRemindersToday.add(`${todayStr}-09:00`);
      const water = await getTodayWater();
      for (const chatId of subscribers) {
        const text = `🌅 <b>Καλημέρα Σπύρο!</b>\n\nΕίσαι στη φάση της πρωινής νηστείας. Το σώμα καίει λίπος!\n\n💧 <b>Ώρα για ενυδάτωση:</b> Πιες 1 μεγάλο ποτήρι δροσερό νερό (500ml) για να ενυδατωθούν οι δίσκοι της μέσης σου.\n• Σημερινό νερό: <b>${water}ml / 3000ml</b>\n\n(Μόλις πιεις, γράψε μου: <code>ήπια 500ml</code>)`;
        await sendMessage(chatId, text);
      }
    }

    // 12:00 - Lunch Window Opening
    if (hour === 12 && minute === 0 && !sentRemindersToday.has(`${todayStr}-12:00`)) {
      sentRemindersToday.add(`${todayStr}-12:00`);
      for (const chatId of subscribers) {
        const text = `🍽️ <b>Άνοιξε το παράθυρο φαγητού (12:00 - 20:00)!</b>\n\nΏρα για το μεσημεριανό σου γεύμα.\n• Εστίασε σε καθαρή πρωτεΐνη (κοτόπουλο, μοσχάρι, ψάρι, αυγά) + πράσινη σαλάτα.\n• Μηδέν ψωμί & υδατάνθρακες.\n\nΜόλις φας, στείλε μου τι έφαγες (π.χ. <code>250g στήθος κοτόπουλο με μαρούλι</code>) για να το καταγράψω αυτόματα!`;
        await sendMessage(chatId, text);
      }
    }

    // 15:30 - Afternoon Water & Lumbar Movement
    if (hour === 15 && minute === 30 && !sentRemindersToday.has(`${todayStr}-15:30`)) {
      sentRemindersToday.add(`${todayStr}-15:30`);
      const water = await getTodayWater();
      for (const chatId of subscribers) {
        const text = `🚴 <b>Απογευματινό Check Σπύρο!</b>\n\n• Νερό μέχρι τώρα: <b>${water}ml / 3000ml</b>\n• <b>Κίνηση για τη μέση:</b> 15-20 λεπτά στατικό ποδήλατο με πλάτη ή περπάτημα σε ίσιο έδαφος.\n\n(Πιες άλλο ένα ποτήρι νερό και γράψε μου: <code>ήπια 300ml</code>)`;
        await sendMessage(chatId, text);
      }
    }

    // 19:30 - Dinner Reminder (Kitchen closing soon)
    if (hour === 19 && minute === 30 && !sentRemindersToday.has(`${todayStr}-19:30`)) {
      sentRemindersToday.add(`${todayStr}-19:30`);
      for (const chatId of subscribers) {
        const text = `⏰ <b>Πλησιάζει το κλείσιμο της κουζίνας (20:00)!</b>\n\nΦάε το βραδινό σου πριν τις 20:00 (π.χ. σολομό ή ομελέτα με σαλάτα).\nΑπό τις 20:00 και μετά ξεκινάει η 16ωρη νυχτερινή νηστεία καύσης λίπους.\n\nΣτείλε μου τι έφαγες για να κλείσουμε τα σημερινά macros!`;
        await sendMessage(chatId, text);
      }
    }

    // 21:30 - Evening Review
    if (hour === 21 && minute === 30 && !sentRemindersToday.has(`${todayStr}-21:30`)) {
      sentRemindersToday.add(`${todayStr}-21:30`);
      const water = await getTodayWater();
      const foodLogs = await getTodayFoodLogs();
      const todayMacros = foodLogs.reduce((acc, f) => ({
        calories: acc.calories + (f.calories || 0),
        protein: acc.protein + (f.protein || 0),
        carbs: acc.carbs + (f.carbs || 0),
      }), { calories: 0, protein: 0, carbs: 0 });

      for (const chatId of subscribers) {
        const text = `🌙 <b>Απολογισμός Ημέρας Σπύρο!</b>\n\n• Νερό: <b>${water}ml / 3000ml</b>\n• Θερμίδες: <b>${todayMacros.calories} kcal</b>\n• Πρωτεΐνη: <b>${todayMacros.protein}g</b>\n• Υδατάνθρακες: <b>${todayMacros.carbs}g</b>\n\nΕξαιρετική προσπάθεια! Καλή ξεκούραση στη μέση σου.`;
        await sendMessage(chatId, text);
      }
    }
  }, 60000);
}

// ==========================================
// TELEGRAM BOT LONG-POLLING ENGINE
// ==========================================

let lastUpdateId = 0;

async function startBot() {
  console.log('=============================================');
  console.log('🤖 Spiros AI Telegram Bot Service (@sgkdigital_bot)');
  console.log('=============================================');

  // Clean stale webhooks
  try {
    const res = await fetch(`${TELEGRAM_API}/deleteWebhook?drop_pending_updates=false`);
    const data = await res.json();
    console.log('[Telegram Bot] Webhook cleanup:', data.ok ? 'SUCCESS' : data.description);
  } catch (err) {
    console.warn('[Telegram Bot] Webhook cleanup note:', err.message);
  }

  // Start internal scheduler
  startScheduler();
  console.log('[Telegram Bot] AI Coach & Scheduler initialized.');

  while (true) {
    try {
      const url = `${TELEGRAM_API}/getUpdates?offset=${lastUpdateId + 1}&timeout=20`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          lastUpdateId = update.update_id;

          if (update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const text = update.message.text.trim();
            saveSubscriber(chatId);

            console.log(`[Telegram Bot] Message from ${chatId}: "${text}"`);

            // Check if standard /start command
            if (text === '/start' || text.toLowerCase() === 'start') {
              const currentWeight = await getLatestWeight();
              const water = await getTodayWater();
              const welcome = `👋 <b>Γεια σου Σπύρο! Είμαι ο AI Health & Keto Coach σου.</b>\n\n` +
                `Γνωρίζω τα πάντα για το πλάνο σου:\n` +
                `• <b>Στόχος Βάρους:</b> 105kg ➔ 90kg (Τρέχον: ${currentWeight}kg)\n` +
                `• <b>Μέση:</b> Στένωση Σπονδυλικού Σωλήνα (Προστασία, μηδέν κραδασμοί, στατικό ποδήλατο)\n` +
                `• <b>Δίαιτα:</b> Low-Carb 16:8 (Νηστεία 20:00 - 12:00)\n` +
                `• <b>Νερό Σήμερα:</b> ${water}ml / 3000ml\n\n` +
                `💬 <b>Μπορείς να μου μιλάς ελεύθερα σαν άνθρωπος:</b>\n` +
                `• «Έφαγα 200g σολομό με σπαράγγια»\n` +
                `• «Ήπια 500ml νερό»\n` +
                `• «Ζυγίζομαι 103.2kg»\n` +
                `• «Μπορώ να φάω καρπούζι;»\n` +
                `• «Πονάει η μέση μου τι να κάνω;»\n` +
                `• «Τι έχω φάει σήμερα;»\n\n` +
                `Ό,τι μου γράφεις αποθηκεύεται άμεσα στο Dashboard και στη Supabase!`;
              await sendMessage(chatId, welcome);
              continue;
            }

            // Send "typing..." action so user sees real-time typing indicator
            try {
              fetch(`${TELEGRAM_API}/sendChatAction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, action: 'typing' })
              }).catch(() => {});
            } catch {}

            // Process message through AI Coach
            const aiReply = await callAiCoach(chatId, text);
            await sendMessage(chatId, aiReply);
          }
        }
      }
    } catch (err) {
      console.error('[Telegram Bot] Polling loop error:', err.message);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

startBot();
