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

// In-memory cache for pending meals awaiting user confirmation
const pendingFoodEntries = new Map();

// In-memory tracker for the most recent food discussed/analyzed per chat
const lastAnalyzedFoodMap = new Map();

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

// Format message for human-like reading and strip markdown symbols like #, ***, etc.
function formatHumanMessage(text) {
  if (!text) return '';
  return text
    .replace(/^#+\s*(.*?)$/gm, '<b>$1</b>') // Convert # Header to bold
    .replace(/#+/g, '')                    // Remove remaining # symbols
    .replace(/\*\*\*(.*?)\*\*\*/g, '<b>$1</b>')
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_{2,}(.*?)_{2,}/g, '$1')
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
    .replace(/\[ACTION:PROPOSE_FOOD:\s*\{[^}]*\}\s*\]/gi, '')
    .replace(/\[ACTION:LOG_FOOD:\s*\{[^}]*\}\s*\]/gi, '')
    .replace(/\[ACTION:ADD_WATER:\d+\]/gi, '')
    .replace(/\[ACTION:LOG_WEIGHT:[\d.]+\]/gi, '')
    .replace(/\[ACTION:REMOVE_LAST_FOOD\]/gi, '')
    .replace(/\[ACTION:CLEAR_FOODS\]/gi, '')
    .replace(/\[ACTION:[^\]]*\]/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Send Message Helper with HTML formatting, inline keyboard support, and plain text fallback
async function sendMessage(chatId, text, inlineKeyboard = null) {
  try {
    const formatted = formatHumanMessage(text);
    const payload = {
      chat_id: chatId,
      text: formatted,
      parse_mode: 'HTML',
    };
    if (inlineKeyboard && inlineKeyboard.length > 0) {
      payload.reply_markup = { inline_keyboard: inlineKeyboard };
    }

    const res = await telegramApi('sendMessage', payload);

    if (!res.ok) {
      // If HTML parsing failed, send as clean plain text
      const cleanText = formatted.replace(/<[^>]*>/g, '');
      const retryPayload = {
        chat_id: chatId,
        text: cleanText,
      };
      if (inlineKeyboard && inlineKeyboard.length > 0) {
        retryPayload.reply_markup = { inline_keyboard: inlineKeyboard };
      }
      return await telegramApi('sendMessage', retryPayload);
    }
    return res;
  } catch (err) {
    console.error('[Telegram Bot] Error sending message:', err.message);
  }
}

// Edit Message Text Helper (for button click feedback)
async function editMessageText(chatId, messageId, text) {
  try {
    const formatted = formatHumanMessage(text);
    const res = await telegramApi('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text: formatted,
      parse_mode: 'HTML',
    });
    if (!res.ok) {
      const cleanText = formatted.replace(/<[^>]*>/g, '');
      return await telegramApi('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: cleanText,
      });
    }
    return res;
  } catch (err) {
    console.error('[Telegram Bot] Error editing message:', err.message);
  }
}

// Answer Callback Query Helper
async function answerCallbackQuery(callbackQueryId, text = '') {
  try {
    return await telegramApi('answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      text: text,
      show_alert: false,
    });
  } catch {}
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
    'βαλε', 'βάλε', 'βαλτο', 'βάλτο', 'βαλτε', 'βάλτε', 'βαλτα', 'βάλτα', 'προσθεσε', 'πρόσθεσε', 'γραψε', 'γράψε',
    'θελω', 'θέλω', 'να', 'βαλεις', 'βάλεις', 'προσθεσεις', 'προσθέσεις',
    'στην', 'εφαρμογη', 'εφαρμογή', 'στο', 'dashboard', 'πλανο', 'πλάνο', 'στγην',
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
  const lastAnalyzed = lastAnalyzedFoodMap.get(chatId) || null;

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

  const lastAnalyzedText = lastAnalyzed 
    ? `Τελευταίο τρόφιμο/πιάτο που αναλύθηκε στην κουβέντα: "${lastAnalyzed.name}" (~${lastAnalyzed.quantity}g, ${lastAnalyzed.calories}kcal, P:${lastAnalyzed.protein}g, C:${lastAnalyzed.carbs}g, F:${lastAnalyzed.fat}g).`
    : 'Δεν υπάρχει πρόσφατη ανάλυση πιάτου.';

  const systemPrompt = `Είσαι ο προσωπικός διατροφολόγος και coach του Σπύρου.
Μιλάς σαν πραγματικός άνθρωπος/φίλος, άμεσα, ζεστά και περιεκτικά.

[ΚΡΙΣΙΜΟΙ ΚΑΝΟΝΕΣ]:
1. ΜΗΝ ΧΡΗΣΙΜΟΠΟΙΕΙΣ ΠΟΤΕ σύμβολα #, ##, ###, ***, markdown headers ή λίστες με αστεράκια. Γράψε σαν SMS σε φίλο.
2. Απαντήσεις ΠΑΝΤΑ 2-4 γραμμές max, to the point. ΜΗΝ γράφεις κατεβατά.
3. ΕΧΕΙΣ ΠΛΗΡΗ ΜΝΗΜΗ ΣΥΝΟΜΙΛΙΑΣ. Κοίτα τα προηγούμενα μηνύματα.
4. ΠΡΟΣΟΧΗ ΣΤΙΣ ΑΡΝΗΣΕΙΣ: «ΔΕΝ ήπια», «ΔΕΝ έφαγα», «Όχι δεν ήπια άλλο» = ΔΕΝ ΕΚΑΝΕ κάτι. ΜΗΝ βάλεις ACTION tag σε αυτή την περίπτωση.
5. «Βάλτο στην εφαρμογή» / «βάλτε το» / «κατέγραψέ το» / «ναι βάλτο» = ΕΝΝΟΕΙ ΤΟ ΤΕΛΕΥΤΑΙΟ ΤΡΟΦΙΜΟ ΠΟΥ ΜΙΛΗΣΑΤΕ. ${lastAnalyzedText}
6. «Βγάλε το» / «σβήσε το» / «αφαίρεσέ το» / «δεν ήπια άλλο βγάλε το» = ΘΕΛΕΙ ΝΑ ΑΦΑΙΡΕΣΕΙΣ το τελευταίο καταγεγραμμένο. Βάλε [ACTION:REMOVE_LAST_FOOD]
7. «Σβήσε τα όλα» / «μηδένισε τα γεύματα» = [ACTION:CLEAR_FOODS]

[ΠΡΟΦΙΛ ΣΠΥΡΟΥ]:
Ύψος 180cm, Τρέχον: ${currentWeight}kg, Στόχος: 90kg.
Μέση: Στένωση Σπονδυλικού Σωλήνα. Δίαιτα: Low-Carb 16:8 (<20-30g carbs/ημέρα).
Απαγορεύονται: Ψωμί, ζυμαρικά, ρύζι, πατάτες, ζάχαρη, γλυκά, μπανάνες, καρπούζι.

[ΣΗΜΕΡΙΝΗ ΚΑΤΑΣΤΑΣΗ]:
Νερό: ${waterMl}ml/3000ml | Θερμίδες: ${todayMacros.calories}kcal | P:${todayMacros.protein}g | C:${todayMacros.carbs}g | F:${todayMacros.fat}g
Σημερινά γεύματα: ${foodSummaryText}

[ACTIONS - ΒΑΛΕ ΜΟΝΟ ΕΝΑ ΣΤΟ ΤΕΛΟΣ ΤΟΥ ΜΗΝΥΜΑΤΟΣ, ΜΟΝΟ ΟΤΑΝ ΧΡΕΙΑΖΕΤΑΙ]:
- Φωτογραφία πιάτου: [ACTION:PROPOSE_FOOD:{"name":"Όνομα","grams":γρ,"calories":kcal,"protein":P,"carbs":C,"fat":F}]
- «Έφαγα X» (ΘΕΤΙΚΟ, χωρίς άρνηση): [ACTION:LOG_FOOD:{"name":"Όνομα","grams":γρ,"calories":kcal,"protein":P,"carbs":C,"fat":F}]
- «Ήπια Xml νερό» (ΘΕΤΙΚΟ, χωρίς άρνηση): [ACTION:ADD_WATER:500]
- «Ζυγίζομαι Xkg»: [ACTION:LOG_WEIGHT:103.5]
- «Βγάλε το» / «αφαίρεσέ το»: [ACTION:REMOVE_LAST_FOOD]
- «Σβήσε τα όλα»: [ACTION:CLEAR_FOODS]
- «Βάλτο στην εφαρμογή» (αναφέρεται στο τελευταίο αναλυμένο): [ACTION:LOG_FOOD:{"name":"${lastAnalyzed?.name || ''}","grams":${lastAnalyzed?.quantity || 100},"calories":${lastAnalyzed?.calories || 0},"protein":${lastAnalyzed?.protein || 0},"carbs":${lastAnalyzed?.carbs || 0},"fat":${lastAnalyzed?.fat || 0}}]

ΚΑΝΟΝΕΣ:
- ΑΝ ΤΟ ΜΗΝΥΜΑ ΕΙΝΑΙ ΑΠΛΗ ΚΟΥΒΕΝΤΑ (καλησπέρα, είσαι εδώ, οκ, κτλ): ΑΠΑΝΤΗΣΕ φιλικά ΧΩΡΙΣ κανένα ACTION tag.
- ΑΝ ΥΠΑΡΧΕΙ ΑΡΝΗΣΗ (δεν, μην, όχι) ΠΡΙΝ ΤΗΝ ΕΝΕΡΓΕΙΑ: ΜΗΝ ΒΑΛΕΙΣ ACTION tag.
- ΑΝ ΡΩΤΑΕΙ αν κάνει κάτι: ΑΠΑΝΤΗΣΕ χωρίς ACTION tag (εκτός αν ρητά ζητήσει καταγραφή).`;

  let history = chatHistories.get(chatId) || [];
  if (history.length > 10) {
    history = history.slice(-10);
  }

  // Format user message content (Text vs Multimodal Image)
  let userMessagePayloadContent;
  if (photoBase64) {
    const promptText = userMessage 
      ? `Ανάλυσε σύντομα τη φωτογραφία (σημείωση: ${userMessage}). Πες αν κάνει για Keto σε 2-3 γραμμές.`
      : `Ανάλυσε σύντομα αυτή τη φωτογραφία: τι βλέπεις, γραμμάρια, macros, αν κάνει για Keto. 2-3 γραμμές.`;

    userMessagePayloadContent = [
      { type: 'text', text: promptText },
      { type: 'image_url', image_url: { url: photoBase64 } }
    ];
  } else {
    userMessagePayloadContent = userMessage;
  }

  const messages = [
    { role: 'user', content: systemPrompt },
    { role: 'assistant', content: 'OK. Απαντάω σύντομα, ανθρώπινα, χωρίς markdown. Καταλαβαίνω αρνήσεις (δεν/μην/όχι) και context.' },
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
        temperature: 0.3,
        max_tokens: 400,
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
      aiResponse = 'Σπύρο, δεν μπόρεσα να το επεξεργαστώ. Δοκίμασε ξανά!';
    }

    let cleanMessage = formatHumanMessage(aiResponse);
    let proposedFood = null;
    let directFoodLogged = false;

    // ============================================================
    // ALL ACTIONS ARE AI-DRIVEN ONLY (no more hardcoded regex!)
    // The AI decides what action to take based on full context.
    // ============================================================

    // 1. PROPOSE_FOOD (photo analysis with confirmation buttons)
    const proposeTagMatch = aiResponse.match(/\[ACTION:PROPOSE_FOOD:\s*(\{.*?\})\s*\]/is);
    if (proposeTagMatch) {
      try {
        const parsed = JSON.parse(proposeTagMatch[1]);
        if (parsed && parsed.name) {
          proposedFood = {
            id: 'fl-' + Date.now(),
            foodId: 'food-ai-' + Date.now(),
            name: extractCleanFoodName(parsed.name),
            quantity: parsed.grams || 150,
            calories: parsed.calories || 0,
            protein: parsed.protein || 0,
            carbs: parsed.carbs || 0,
            fat: parsed.fat || 0,
            time: timeStr,
          };
          lastAnalyzedFoodMap.set(chatId, proposedFood);
        }
      } catch (err) {
        console.error('Failed to parse propose food tag:', err.message);
      }
    }

    // 2. LOG_FOOD (direct logging - AI decided user wants to log)
    const directLogTagMatch = aiResponse.match(/\[ACTION:LOG_FOOD:\s*(\{.*?\})\s*\]/is);
    if (directLogTagMatch && !directFoodLogged) {
      try {
        const parsed = JSON.parse(directLogTagMatch[1]);
        if (parsed && parsed.name) {
          const entry = {
            id: 'fl-' + Date.now(),
            foodId: 'food-ai-' + Date.now(),
            name: extractCleanFoodName(parsed.name),
            quantity: parsed.grams || 150,
            calories: parsed.calories || 0,
            protein: parsed.protein || 0,
            carbs: parsed.carbs || 0,
            fat: parsed.fat || 0,
            time: timeStr,
          };
          await addTodayFoodLog(entry);
          directFoodLogged = true;
          lastAnalyzedFoodMap.set(chatId, entry);
          cleanMessage += `\n\n✅ <b>Καταγράφηκε:</b> ${entry.name} (${entry.quantity}g) - ${entry.calories} kcal, P:${entry.protein}g, C:${entry.carbs}g`;
        }
      } catch (err) {
        console.error('Failed to parse direct food tag:', err.message);
      }
    }

    // 3. ADD_WATER (AI decided user drank water)
    const waterTagMatch = aiResponse.match(/\[ACTION:ADD_WATER:(\d+)\]/i);
    if (waterTagMatch) {
      const ml = parseInt(waterTagMatch[1], 10);
      if (ml > 0 && ml <= 5000) {
        const newTotal = await addTodayWater(ml);
        cleanMessage += `\n\n💧 <b>Νερό σήμερα:</b> ${newTotal}ml / 3000ml\n${renderProgressBar(newTotal, 3000)}`;
      }
    }

    // 4. LOG_WEIGHT (AI decided user logged weight)
    const weightTagMatch = aiResponse.match(/\[ACTION:LOG_WEIGHT:([\d.]+)\]/i);
    if (weightTagMatch) {
      const w = parseFloat(weightTagMatch[1]);
      if (w >= 70 && w <= 160) {
        await addWeightLog(w);
        const lost = (105.0 - w).toFixed(1);
        const relief = (Math.max(0, parseFloat(lost)) * 4).toFixed(1);
        cleanMessage += `\n\n⚖️ <b>Βάρος: ${w}kg</b> (-${lost}kg σύνολο | -${relief}kg πίεση στη μέση)`;
      }
    }

    // 5. REMOVE_LAST_FOOD (AI decided user wants to undo last food)
    if (/\[ACTION:REMOVE_LAST_FOOD\]/i.test(aiResponse)) {
      const currentLogs = await getTodayFoodLogs();
      if (currentLogs.length > 0) {
        const removed = currentLogs.pop();
        // Re-save without last entry
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
            completed_habits: currentLogs,
            notes: existing?.notes ?? '',
          }, { onConflict: 'date' });
          cleanMessage += `\n\n🗑️ <i>Αφαιρέθηκε: ${removed.name} (${removed.quantity}g)</i>`;
        } catch (err) {
          console.error('Failed to remove last food:', err.message);
        }
      } else {
        cleanMessage += `\n\nΔεν υπάρχει κάτι να αφαιρεθεί, η λίστα είναι άδεια.`;
      }
    }

    // 6. CLEAR_FOODS (AI decided user wants to clear all foods)
    if (/\[ACTION:CLEAR_FOODS\]/i.test(aiResponse)) {
      await clearTodayFoodLogs();
      lastAnalyzedFoodMap.delete(chatId);
      cleanMessage += `\n\n🗑️ <i>Τα σημερινά γεύματα διαγράφηκαν.</i>`;
    }

    // Save to conversation history
    const userSummary = photoBase64 ? `[Φωτογραφία] ${userMessage || ''}` : userMessage;
    history.push({ role: 'user', content: userSummary });
    history.push({ role: 'assistant', content: cleanMessage });
    chatHistories.set(chatId, history);

    // Build interactive buttons if food was analyzed from photo
    let keyboard = null;
    if (proposedFood && !directFoodLogged) {
      const pendingKey = `pending_${chatId}_${Date.now()}`;
      pendingFoodEntries.set(pendingKey, proposedFood);

      keyboard = [
        [
          { text: `✅ Ναι, βάλτο στο Dashboard (${proposedFood.quantity}g)`, callback_data: `LOG_CONFIRM:${pendingKey}` },
        ],
        [
          { text: `❌ Όχι, απλή ερώτηση`, callback_data: `LOG_CANCEL:${pendingKey}` }
        ]
      ];
    }

    return { text: cleanMessage, keyboard };
  } catch (err) {
    console.error('AI Coach execution error:', err.message);
    return { text: `Σπύρο, είχα ένα στιγμιαίο θέμα σύνδεσης. Δοκίμασε ξανά σε λίγο!` };
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
        const text = `🌅 <b>Καλημέρα Σπύρο!</b>\n\nΕίσαι στη φάση της πρωινής νηστείας. Το σώμα καίει λίπος!\n\n💧 Ώρα για ενυδάτωση: Πιες 1 μεγάλο ποτήρι νερό (500ml) για να ενυδατωθούν οι δίσκοι της μέσης σου.\n• Νερό: <b>${water}ml / 3000ml</b>\n\n(Μόλις πιεις, γράψε μου: <code>ήπια 500ml</code>)`;
        await sendMessage(chatId, text);
      }
    }

    // 12:00 - Lunch Window Opening
    if (hour === 12 && minute === 0 && !sentRemindersToday.has(`${todayStr}-12:00`)) {
      sentRemindersToday.add(`${todayStr}-12:00`);
      for (const chatId of subscribers) {
        const text = `🍽️ <b>Άνοιξε το παράθυρο φαγητού (12:00 - 20:00)!</b>\n\nΏρα για το μεσημεριανό σου.\n• Στείλε μου <b>φωτογραφία του πιάτου σου</b> 📸 ή γράψε μου τι έφαγες.\n• Εστίασε σε καθαρή πρωτεΐνη + πράσινη σαλάτα. Μηδέν ψωμί/υδατάνθρακες.`;
        await sendMessage(chatId, text);
      }
    }

    // 15:30 - Afternoon Water & Lumbar Movement
    if (hour === 15 && minute === 30 && !sentRemindersToday.has(`${todayStr}-15:30`)) {
      sentRemindersToday.add(`${todayStr}-15:30`);
      const water = await getTodayWater();
      for (const chatId of subscribers) {
        const text = `🚴 <b>Απογευματινό Check Σπύρο!</b>\n\n• Νερό: <b>${water}ml / 3000ml</b>\n• <b>Κίνηση για τη μέση:</b> 15-20 λεπτά στατικό ποδήλατο με πλάτη ή περπάτημα σε ίσιο έδαφος.\n\n(Πιες άλλο ένα ποτήρι νερό και γράψε μου: <code>ήπια 300ml</code>)`;
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
        const text = `🌙 <b>Απολογισμός Ημέρας Σπύρο!</b>\n\n• Νερό: <b>${water}ml / 3000ml</b>\n• Θερμίδες: <b>${todayMacros.calories} kcal</b>\n• Πρωτεΐνη: <b>${todayMacros.protein}g</b>\n• Υδατάνθρακες: <b>${todayMacros.carbs}g</b>\n\nΚαλή ξεκούραση στη μέση σου!`;
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
  console.log('📸 Context-Aware Dialogue & Multi-turn Memory Active');
  console.log('=============================================');

  // Clean stale webhooks
  try {
    const res = await telegramApi('deleteWebhook', { drop_pending_updates: true });
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

          // Handle Interactive Button Clicks (Callback Queries)
          if (update.callback_query) {
            const cb = update.callback_query;
            const chatId = cb.message.chat.id;
            const messageId = cb.message.message_id;
            const cbData = cb.data || '';

            if (cbData.startsWith('LOG_CONFIRM:')) {
              const pendingKey = cbData.replace('LOG_CONFIRM:', '');
              const entry = pendingFoodEntries.get(pendingKey);
              if (entry) {
                await addTodayFoodLog(entry);
                pendingFoodEntries.delete(pendingKey);
                lastAnalyzedFoodMap.set(chatId, entry);
                await answerCallbackQuery(cb.id, '✅ Καταχωρήθηκε!');
                const updatedText = `${cb.message.text}\n\n✅ <b>Καταγράφηκε:</b> ${entry.name} (${entry.quantity}g) - ${entry.calories} kcal, P:${entry.protein}g, C:${entry.carbs}g`;
                await editMessageText(chatId, messageId, updatedText);
              } else {
                await answerCallbackQuery(cb.id, 'Έχει ήδη καταχωρηθεί.');
              }
            } else if (cbData.startsWith('LOG_CANCEL:')) {
              const pendingKey = cbData.replace('LOG_CANCEL:', '');
              pendingFoodEntries.delete(pendingKey);
              await answerCallbackQuery(cb.id, '❌ Ακυρώθηκε.');
              const updatedText = `${cb.message.text}\n\nℹ️ <i>Δεν προστέθηκε στο Dashboard.</i>`;
              await editMessageText(chatId, messageId, updatedText);
            }
            continue;
          }

          // Handle Standard Messages
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
                const aiResult = await callAiCoach(chatId, caption, photoBase64);
                await sendMessage(chatId, aiResult.text, aiResult.keyboard);
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
                const welcome = `👋 <b>Γεια σου Σπύρο! Είμαι ο AI Coach σου.</b>\n\n` +
                  `📸 <b>Ανάλυση Φωτογραφίας:</b>\n` +
                  `Στείλε μου φωτογραφία από το πιάτο σου! Θα σου πω κατευθείαν αν κάνει για Keto, πόσα γραμμάρια/macros έχει και θα σε ρωτήσω με κουμπί αν θες να το βάλεις στο Dashboard.\n\n` +
                  `📊 <b>Τρέχον Πλάνο:</b>\n` +
                  `• Βάρος: ${currentWeight}kg (Στόχος: 90kg)\n` +
                  `• Νερό Σήμερα: ${water}ml / 3000ml\n` +
                  `• Διατροφή: Low-Carb 16:8 (Νηστεία 20:00 - 12:00)\n\n` +
                  `💬 Μπορείς να μου γράφεις ελεύθερα: «ήπια 500ml», «κάνει να φάω αυτό;», «ζυγίζομαι 103.2kg», «βάλτο στην εφαρμογή».`;
                await sendMessage(chatId, welcome);
                continue;
              }

              // Send "typing..." action
              telegramApi('sendChatAction', { chat_id: chatId, action: 'typing' }).catch(() => {});

              // Process text through AI Coach
              const aiResult = await callAiCoach(chatId, text);
              await sendMessage(chatId, aiResult.text, aiResult.keyboard);
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
