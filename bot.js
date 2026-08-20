import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { searchSmartFoods, analyzeFoodDynamically } from './src/data/foodClassifier.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TELEGRAM_TOKEN = '8603311936:AAG1e-zxKzU48elsr-t7dGyvQCSfvt0E32g';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xrmvingehhiymchoggka.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybXZpbmdlaGhpeW1jaG9nZ2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNjkzMTEsImV4cCI6MjA5MDk0NTMxMX0.UDvGORYRXdo1IKTrduIJYJEfgNuli0LSpAC9njm7I9Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CONFIG_FILE = path.join(__dirname, 'telegram_config.json');

// Store recent conversation history for each chat
const chatHistories = new Map();

// Native HTTPS Telegram Request Helper (100% Reliable across Windows IPv4/IPv6 networks)
function telegramApi(methodName, data = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${TELEGRAM_TOKEN}/${methodName}`,
      method: payload ? 'POST' : 'GET',
      family: 4,
      headers: {
        ...(payload ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        } : {})
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve({ ok: false, body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
}

// Native HTTPS Telegram File Download Helper
function downloadTelegramFile(filePath) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/file/bot${TELEGRAM_TOKEN}/${filePath}`,
      method: 'GET',
      family: 4
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
    });

    req.on('error', (err) => reject(err));
    req.end();
  });
}

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

// Send Message Helper with HTML formatting and plain text fallback
async function sendMessage(chatId, text) {
  try {
    const res = await telegramApi('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    });

    if (!res.ok) {
      // If HTML parsing failed due to special characters, send as plain text
      const cleanText = text.replace(/<[^>]*>/g, '');
      return await telegramApi('sendMessage', {
        chat_id: chatId,
        text: cleanText,
      });
    }
    return res;
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

// Helper: Calculate ETA to reach 90kg (at 0.75kg/week)
function calculateGoalETA(currentWeight) {
  const remaining = Math.max(0, currentWeight - 90.0);
  if (remaining === 0) return 'Στόχος 90kg επιτεύχθηκε!';
  const weeksNeeded = Math.ceil(remaining / 0.75);
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + weeksNeeded * 7);
  
  const months = ['Ιανουαρίου', 'Φεβρουαρίου', 'Μαρτίου', 'Απριλίου', 'Μαΐου', 'Ιουνίου', 'Ιουλίου', 'Αυγούστου', 'Σεπτεμβρίου', 'Οκτωβρίου', 'Νοεμβρίου', 'Δεκεμβρίου'];
  return `${targetDate.getDate()} ${months[targetDate.getMonth()]} ${targetDate.getFullYear()} (~${weeksNeeded} εβδομάδες)`;
}

// Extract clean food name by removing action verbs and stopwords
function extractCleanFoodName(text) {
  const actionStopwords = new Set([
    'ηπια', 'ήπια', 'εφαγα', 'έφαγα', 'φαγαμε', 'φάγαμε', 'καταναλωσα', 'κατανάλωσα',
    'καταλαθος', 'κατά', 'λάθος', 'λαθος', 'κατεγραψε', 'κατέγραψε', 'κατεγραψέ', 'κατέγραψέ',
    'καταγραφη', 'καταγραφή', 'σημειωσε', 'σημείωσε', 'το',
    'βαλε', 'βάλε', 'προσθεσε', 'πρόσθεσε', 'γραψε', 'γράψε',
    'θελω', 'θέλω', 'να', 'βαλεις', 'βάλεις', 'βαλτο', 'βάλτο', 'προσθεσεις', 'προσθέσεις',
    'μολις', 'μόλις', 'τωρα', 'τώρα', 'σημερα', 'σήμερα', 'χθες',
    'ξεχαστηκα', 'ξεχάστηκα', 'ενα', 'ένα', 'μια', 'μία', 'δυο', 'δύο', 'τρια', 'τρία',
    'λιγο', 'λίγο', 'πολυ', 'πολύ', 'παρακαλω', 'παρακαλώ', 'ευχαριστω', 'ευχαριστώ'
  ]);

  const rawWords = text
    .replace(/[.,!?;:()]/g, ' ')
    .replace(/\d+\s*(?:g|gr|kg|γραμμάρια|γραμμαρια|θερμίδες|θερμιδες|kcal|ml)\b/gi, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const cleanWords = rawWords.filter(w => !actionStopwords.has(w.toLowerCase()));
  let clean = cleanWords.join(' ').trim();
  if (!clean || clean.length < 2) {
    clean = text.trim();
  }
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

// Supabase Database Helpers
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
      date: today,
      weight: parseFloat(weight),
      pain_level: 4,
      notes: 'Καταγραφή από AI Coach Telegram Bot',
    });
  } catch (err) {
    console.error('Supabase add weight error:', err.message);
  }
}

// Download Telegram photo as Base64 data URL via native HTTPS
async function getTelegramPhotoBase64(fileId) {
  try {
    const fileData = await telegramApi('getFile', { file_id: fileId });
    if (!fileData.ok || !fileData.result?.file_path) {
      throw new Error('Failed to retrieve file path from Telegram');
    }
    const filePath = fileData.result.file_path;
    const buffer = await downloadTelegramFile(filePath);
    const base64 = buffer.toString('base64');
    const mimeType = filePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${base64}`;
  } catch (err) {
    console.error('[Telegram Photo Download Error]:', err.message);
    return null;
  }
}

// ==========================================
// AI COACH ENGINE WITH GPT-4o-mini & VISION
// ==========================================

async function callAiCoach(chatId, userMessage, photoBase64 = null) {
  const currentWeight = await getLatestWeight();
  const waterMl = await getTodayWater();
  const foodLogs = await getTodayFoodLogs();

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const currentHour = now.getHours();

  let phaseDescription = 'Φάση Νηστείας (16:8 Fasting)';
  if (currentHour >= 12 && currentHour < 16) {
    phaseDescription = 'Παράθυρο Φαγητού: 12:00 - Μεσημεριανό';
  } else if (currentHour >= 16 && currentHour < 19) {
    phaseDescription = 'Παράθυρο Φαγητού: 16:00 - Απογευματινό Σνακ';
  } else if (currentHour >= 19 && currentHour < 20) {
    phaseDescription = 'Παράθυρο Φαγητού: 20:00 - Βραδινό (Κλείνει η κουζίνα!)';
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

  const systemPrompt = `Είσαι ο κορυφαίος, έξυπνος, ευγενικός και επιστημονικά καταρτισμένος AI Personal Health, Nutrition & Keto Coach του Σπύρου.
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
  * Απαγορεύονται: Ψωμί, ζυμαρικά, ρύζι, πατάτες, ζάχαρη, γλυκά, αναψυκτικά, χυμοί, αλκοόλ, φρούτα με υψηλό γλυκαιμικό δείκτη (όπως μπανάνες, καρπούζι, σταφύλια).
  * Επιτρέπονται: Μοσχάρι, κοτόπουλο, γαλοπούλα, χοιρινό, ψάρια (σολομός, τσιπούρα, λαβράκι, τόνος), αυγά, ελαιόλαδο, φέτα, πράσινα λαχανικά (μπρόκολο, σπαράγγια, μαρούλι, αγγούρι, κολοκυθάκια, μανιτάρια).

[ΤΡΕΧΟΥΣΑ ΚΑΤΑΣΤΑΣΗ ΣΗΜΕΡΑ]:
- Ώρα: ${timeStr} (${phaseDescription})
- Νερό σήμερα: ${waterMl} ml / 3000 ml
- Σημερινά γεύματα:\n${foodSummaryText}
- Σύνολο Macros σήμερα: ${todayMacros.calories} kcal | Πρωτεΐνη: ${todayMacros.protein}g | Υδατάνθρακες: ${todayMacros.carbs}g | Λιπαρά: ${todayMacros.fat}g

[ΕΙΔΙΚΗ ΟΔΗΓΙΑ ΓΙΑ ΦΩΤΟΓΡΑΦΙΕΣ ΠΙΑΤΟΥ / ΤΡΟΦΙΜΩΝ (GPT-4o-mini Vision)]:
Όταν ο Σπύρος στέλνει φωτογραφία του πιάτου ή τροφίμων του:
1. Αναγνώρισε ακριβώς όλα τα τρόφιμα/συστατικά που βλέπεις στη φωτογραφία.
2. Εκτίμησε με ακρίβεια τα γραμμάρια του κάθε στοιχείου (π.χ. ~200g κοτόπουλο, ~150g πράσινη σαλάτα ή π.χ. 3 μπανάνες ~350g).
3. Υπολόγισε τα συνολικά macros: Θερμίδες (kcal), Πρωτεΐνη (g), Υδατάνθρακες (g), Λιπαρά (g).
4. Κάνε αξιολόγηση: Πες αν το τρόφιμο/πιάτο είναι OK για Low-Carb Keto & τη μέση του, ή αν πρέπει να αφαιρέσει κάτι (π.χ. αν έχει πατάτες/ρύζι/ψωμί/μπανάνες/σάλτσες ζάχαρης) ή να προσθέσει κάτι (π.χ. παραπάνω πρωτεΐνη ή ελαιόλαδο/λαχανικά).
5. Αν είναι φαγητό/γεύμα που τρώει, πρόσθεσε στο ΤΕΛΟΣ το tag καταγραφής:
   [ACTION:LOG_FOOD:{"name":"Σύντομο Καθαρό Όνομα Πιάτου","grams":συνολικά_γραμμάρια,"calories":θερμίδες,"protein":πρωτεΐνη,"carbs":υδατάνθρακες,"fat":λιπαρά}]

[ΚΑΝΟΝΕΣ ΓΙΑ ΚΕΙΜΕΝΟ]:
1. Αν αναφέρει φαγητό, δώσε διατροφική συμβουλή και βάλε tag: [ACTION:LOG_FOOD:{"name":"Όνομα","grams":150,"calories":250,"protein":30,"carbs":2,"fat":12}]
2. Αν αναφέρει νερό (π.χ. «ήπια 500ml», «1 ποτήρι νερό»), βάλε tag: [ACTION:ADD_WATER:500]
3. Αν αναφέρει βάρος (π.χ. «103.5kg»), βάλε tag: [ACTION:LOG_WEIGHT:103.5]
4. Αν ζητήσει μηδενισμό/διαγραφή: [ACTION:CLEAR_FOODS] ή [ACTION:RESET_WATER]
5. Μίλα πάντα στα Ελληνικά με καθαρή, ανθρώπινη μορφοποίηση.`;

  let history = chatHistories.get(chatId) || [];
  if (history.length > 6) {
    history = history.slice(-6);
  }

  // Format user message content (Text vs Multimodal Image)
  let userMessagePayloadContent;
  if (photoBase64) {
    const promptText = userMessage 
      ? `Ανάλυσε τη φωτογραφία. Σημείωση χρήστη: ${userMessage}`
      : `Ανάλυσε αυτή τη φωτογραφία: εντόπισε τι τρόφιμα περιέχει, εκτίμησε τα γραμμάρια, υπολόγισε θερμίδες και macros, πες μου αν είναι OK για Keto ή τι να αλλάξω, και κατέγραψέ το.`;

    userMessagePayloadContent = [
      { type: 'text', text: promptText },
      { type: 'image_url', image_url: { url: photoBase64 } }
    ];
  } else {
    userMessagePayloadContent = userMessage;
  }

  const messages = [
    { role: 'user', content: systemPrompt },
    { role: 'assistant', content: 'Κατάλαβα απόλυτα! Είμαι ο AI Personal Coach του Σπύρου με πλήρη υποστήριξη ανάλυσης πιάτων Vision & κειμένου.' },
    ...history,
    { role: 'user', content: userMessagePayloadContent }
  ];

  try {
    let aiResponse = '';
    const res = await fetch(`${SUPABASE_URL}/functions/v1/openai-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 1000,
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.content) {
        aiResponse = data.content;
      } else if (data && data.choices && data.choices[0] && data.choices[0].message) {
        aiResponse = data.choices[0].message.content;
      }
    }

    if (!aiResponse) {
      aiResponse = 'Δεν μπόρεσα να επεξεργαστώ το αίτημα αυτή τη στιγμή. Δοκίμασε ξανά σε λίγο!';
    }

    // Process Actions from AI Response & Automatic Intent Detection
    let cleanMessage = aiResponse;
    let actionExecuted = false;

    // 1. Check AI-generated food action tag first (especially critical for Photo Vision analysis)
    const foodTagMatch = cleanMessage.match(/\[ACTION:LOG_FOOD:\s*(\{.*?\})\s*\]/is);
    if (foodTagMatch) {
      try {
        const parsedFood = JSON.parse(foodTagMatch[1]);
        if (parsedFood && parsedFood.name) {
          const entry = {
            id: 'fl-' + Date.now(),
            foodId: 'food-ai-' + Date.now(),
            name: extractCleanFoodName(parsedFood.name),
            quantity: parsedFood.grams || 150,
            calories: parsedFood.calories || 0,
            protein: parsedFood.protein || 0,
            carbs: parsedFood.carbs || 0,
            fat: parsedFood.fat || 0,
            time: timeStr,
          };
          await addTodayFoodLog(entry);
          actionExecuted = true;
          cleanMessage += `\n\n✅ <b>Καταγράφηκε αυτόματα στο Dashboard:</b>\n• <b>${entry.name}</b> (${entry.quantity}g)\n• <b>${entry.calories} kcal</b> | Πρωτεΐνη: <b>${entry.protein}g</b> | Υδατάνθρακες: <b>${entry.carbs}g</b>`;
        }
      } catch (err) {
        console.error('Failed to parse AI photo food tag:', err.message);
      }
    }

    // Direct Intent Recognition with Exact Word Matching (for text messages)
    if (!actionExecuted && !photoBase64) {
      const lowerUserMsg = userMessage.toLowerCase().trim();
      const normalizedTokens = lowerUserMsg.replace(/[.,!?;:]/g, ' ').split(/\s+/).filter(Boolean);

      const foodWords = [
        'καφές', 'καφες', 'καφέ', 'καφε', 'φραπέ', 'φραπε', 'frape', 'espresso', 'cappuccino',
        'ζάχαρη', 'ζαχαρη', 'χυμός', 'χυμος', 'χυμό', 'χυμο', 'γάλα', 'γαλα', 'μπύρα', 'μπυρα',
        'κρασί', 'κρασι', 'αναψυκτικό', 'αναψυκτικο', 'coca', 'κόκα', 'κολα', 'κόλα', 'τυρί', 'τυρι',
        'φέτα', 'φετα', 'κοτόπουλο', 'κοτοπουλο', 'κρέας', 'κρεας', 'μπριζόλα', 'μπριζολα', 'αυγό',
        'αυγο', 'αυγά', 'αυγα', 'ομελέτα', 'ομελετα', 'σολομός', 'σολομος', 'ψάρι', 'ψαρι', 'σαλάτα', 'σαλατα',
        'πατατάκια', 'πατατακια', 'πατάτες', 'πατατες', 'ψωμί', 'ψωμι', 'πίτσα', 'πιτσα', 'μπιφτέκι', 'μπιφτεκι',
        'μπανάνα', 'μπανανα', 'μπανάνες', 'μπανανες'
      ];
      const hasFoodOrSugar = foodWords.some(w => normalizedTokens.includes(w));
      const isWaterMention = /νερό|νερο|water|ποτήρι|ποτηρι|ποτυρι|μπουκάλι|μπουκαλι/i.test(lowerUserMsg);

      // Water Action
      if (isWaterMention && !hasFoodOrSugar) {
        let ml = 250;
        const numMatch = lowerUserMsg.match(/(\d+)\s*(?:ml|λιτρα|λίτρα|l|ποτηρια|ποτήρια)?/i);
        if (lowerUserMsg.includes('1 λιτρο') || lowerUserMsg.includes('1 λίτρο') || lowerUserMsg.includes('1l')) ml = 1000;
        else if (lowerUserMsg.includes('2 λιτρα') || lowerUserMsg.includes('2 λίτρα') || lowerUserMsg.includes('2l')) ml = 2000;
        else if (lowerUserMsg.includes('μισό λίτρο') || lowerUserMsg.includes('500ml')) ml = 500;
        else if (lowerUserMsg.includes('2 ποτηρια') || lowerUserMsg.includes('2 ποτήρια') || lowerUserMsg.includes('δυο ποτηρια')) ml = 500;
        else if (numMatch && numMatch[1]) ml = parseInt(numMatch[1], 10);

        if (ml > 0) {
          const newTotal = await addTodayWater(ml);
          actionExecuted = true;
          cleanMessage += `\n\n💧 <b>Σύνολο νερού σήμερα:</b> ${newTotal}ml / 3000ml\n${renderProgressBar(newTotal, 3000)}`;
        }
      }

      // Weight Action
      const weightMatch = lowerUserMsg.match(/(?:ζυγίζομαι|ζυγιζομαι|βάρος|βαρος|κιλά|κιλα|ειμαι|είμαι)\s*(\d{2,3}(?:[\.,]\d)?)\s*(?:kg|κιλα|κιλά)?/i);
      if (weightMatch) {
        const w = parseFloat(weightMatch[1].replace(',', '.'));
        if (w >= 70 && w <= 160) {
          await addWeightLog(w);
          const lost = (105.0 - w).toFixed(1);
          const relief = (Math.max(0, parseFloat(lost)) * 4).toFixed(1);
          actionExecuted = true;
          cleanMessage += `\n\n⚖️ <b>Καταγραφή Βάρους: ${w}kg</b>\n• Συνολική απώλεια: <b>-${lost}kg</b>\n• Ανακούφιση μέσης: <b>-${relief}kg πίεση</b> στους σπονδύλους!\n• Πρόβλεψη για 90kg: ${calculateGoalETA(w)}`;
        }
      }

      // Clear Foods Action
      if (/σβήσε|σβησε|καθάρισε|καθαρισε|μηδένισε|μηδενισε|διαγραφή/i.test(lowerUserMsg) && /φαγητά|φαγητα|γεύματα|γευματα/i.test(lowerUserMsg)) {
        await clearTodayFoodLogs();
        actionExecuted = true;
        cleanMessage += `\n\n🗑️ <i>Τα σημερινά γεύματα διαγράφηκαν από τη βάση δεδομένων.</i>`;
      }

      // Food / Beverage Action
      const isEatingOrFood = hasFoodOrSugar || /έφαγα|εφαγα|ήπια|ηπια|κατανάλωσα|καταναλωσα|φαγητό|φαγητο|πρωινό|πρωινο|μεσημεριανό|μεσημεριανο|βραδινό|βραδινο|σνακ|γεύμα|γευμα/i.test(lowerUserMsg);
      
      if (isEatingOrFood && !lowerUserMsg.startsWith('/') && !actionExecuted) {
        const gramMatch = lowerUserMsg.match(/(\d+)\s*(?:g|gr|γραμμάρια|γραμμαρια)/i);
        const grams = gramMatch ? parseInt(gramMatch[1], 10) : 100;
        const analysis = analyzeFoodDynamically(userMessage);
        const cleanFoodName = extractCleanFoodName(userMessage);

        const entry = {
          id: 'fl-' + Date.now(),
          foodId: analysis.id || ('food-' + Date.now()),
          name: cleanFoodName,
          quantity: grams,
          calories: Math.round(analysis.calories * (grams / 100)),
          protein: Math.round(analysis.protein * (grams / 100) * 10) / 10,
          carbs: Math.round(analysis.carbs * (grams / 100) * 10) / 10,
          fat: Math.round(analysis.fat * (grams / 100) * 10) / 10,
          time: timeStr,
        };

        await addTodayFoodLog(entry);
        cleanMessage += `\n\n✅ <b>Καταγράφηκε αυτόματα στο Dashboard:</b>\n• <b>${entry.name}</b> (${entry.quantity}g)\n• Θερμίδες: <b>${entry.calories} kcal</b> | Πρωτεΐνη: <b>${entry.protein}g</b> | Υδατάνθρακες: <b>${entry.carbs}g</b>`;
      }
    }

    // Scrub ANY leaked action tags from message
    cleanMessage = cleanMessage
      .replace(/\[\s*ACTION:[^\]]*\]?/gi, '')
      .replace(/\[\s*ACTION:[^\n]*\n?/gi, '')
      .trim();

    // Save to conversation history (keep text summary)
    const userSummary = photoBase64 ? `[Φωτογραφία Πιάτου] ${userMessage || ''}` : userMessage;
    history.push({ role: 'user', content: userSummary });
    history.push({ role: 'assistant', content: cleanMessage });
    chatHistories.set(chatId, history);

    return cleanMessage;
  } catch (err) {
    console.error('AI Coach execution error:', err.message);
    return `Σπύρο, είχα ένα στιγμιαίο θέμα επικοινωνίας με το AI Vision μοντέλο (${err.message}). Δοκίμασε ξανά σε 5 δευτερόλεπτα!`;
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
        const text = `🍽️ <b>Άνοιξε το παράθυρο φαγητού (12:00 - 20:00)!</b>\n\nΏρα για το μεσημεριανό σου γεύμα.\n• Στείλε μου <b>φωτογραφία του πιάτου σου</b> 📸 για να το αναλύσω και να σου πω γραμμάρια & macros!\n• Εστίασε σε καθαρή πρωτεΐνη + πράσινη σαλάτα. Μηδέν ψωμί/υδατάνθρακες.`;
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
        const text = `⏰ <b>Πλησιάζει το κλείσιμο της κουζίνας (20:00)!</b>\n\nΒγάλε <b>φωτογραφία το βραδινό σου πιάτο</b> 📸 ή γράψε μου τι έφαγες για να κλείσουμε τα σημερινά macros!\nΑπό τις 20:00 ξεκινάει η 16ωρη νυχτερινή νηστεία.`;
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
  console.log('📸 GPT-4o-mini Vision & Plate Analysis Enabled');
  console.log('=============================================');

  // Clean stale webhooks
  try {
    const res = await telegramApi('deleteWebhook', { drop_pending_updates: false });
    console.log('[Telegram Bot] Webhook cleanup:', res.ok ? 'SUCCESS' : res.description);
  } catch (err) {
    console.warn('[Telegram Bot] Webhook cleanup note:', err.message);
  }

  // Start internal scheduler
  startScheduler();
  console.log('[Telegram Bot] AI Coach & Scheduler initialized.');

  while (true) {
    try {
      const data = await telegramApi(`getUpdates?offset=${lastUpdateId + 1}&timeout=20`);

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          lastUpdateId = update.update_id;

          if (update.message) {
            const chatId = update.message.chat.id;
            saveSubscriber(chatId);

            // Case 1: Photo uploaded (Plate Analysis)
            if (update.message.photo && update.message.photo.length > 0) {
              const photos = update.message.photo;
              const bestPhoto = photos[photos.length - 1]; // Highest resolution
              const caption = update.message.caption || '';
              console.log(`[Telegram Bot] Photo received from ${chatId} (caption: "${caption}")`);

              // Send "typing..." action
              telegramApi('sendChatAction', { chat_id: chatId, action: 'typing' }).catch(() => {});

              const photoBase64 = await getTelegramPhotoBase64(bestPhoto.file_id);
              if (photoBase64) {
                const aiReply = await callAiCoach(chatId, caption, photoBase64);
                await sendMessage(chatId, aiReply);
              } else {
                await sendMessage(chatId, 'Σπύρο, δεν μπόρεσα να κατεβάσω τη φωτογραφία. Δοκίμασε να τη στείλεις ξανά!');
              }
              continue;
            }

            // Case 2: Text message
            if (update.message.text) {
              const text = update.message.text.trim();
              console.log(`[Telegram Bot] Message from ${chatId}: "${text}"`);

              // Check if standard /start command
              if (text === '/start' || text.toLowerCase() === 'start') {
                const currentWeight = await getLatestWeight();
                const water = await getTodayWater();
                const welcome = `👋 <b>Γεια σου Σπύρο! Είμαι ο AI Health & Keto Coach σου.</b>\n\n` +
                  `📸 <b>ΝΕΟ: Ανάλυση Πιάτου με Φωτογραφία!</b>\n` +
                  `Τράβα φωτογραφία το πιάτο σου και στείλε τη μου απευθείας εδώ! Θα αναγνωρίσω τα τρόφιμα, θα εκτιμήσω τα γραμμάρια και τα macros, θα σου πω αν είναι OK ή αν πρέπει να αφαιρέσεις/προσθέσεις κάτι, και θα το καταγράψω αυτόματα στο Dashboard σου!\n\n` +
                  `📊 <b>Τρέχον Πλάνο:</b>\n` +
                  `• <b>Στόχος Βάρους:</b> 105kg ➔ 90kg (Τρέχον: ${currentWeight}kg)\n` +
                  `• <b>Μέση:</b> Στένωση Σπονδυλικού Σωλήνα (Προστασία, στατικό ποδήλατο)\n` +
                  `• <b>Δίαιτα:</b> Low-Carb 16:8 (Νηστεία 20:00 - 12:00)\n` +
                  `• <b>Νερό Σήμερα:</b> ${water}ml / 3000ml\n\n` +
                  `💬 Μπορείς επίσης να μου γράφεις ό,τι θες:\n` +
                  `• «Ήπια 500ml νερό»\n` +
                  `• «Ζυγίζομαι 103.2kg»\n` +
                  `• «Έφαγα 2 αυγά και μαρούλι»`;
                await sendMessage(chatId, welcome);
                continue;
              }

              // Send "typing..." action
              telegramApi('sendChatAction', { chat_id: chatId, action: 'typing' }).catch(() => {});

              // Process text through AI Coach
              const aiReply = await callAiCoach(chatId, text);
              await sendMessage(chatId, aiReply);
            }
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
