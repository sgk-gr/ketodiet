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
const LAST_ANALYZED_FILE = path.join(__dirname, 'last_analyzed_cache.json');

// Store recent conversation history for each chat
const chatHistories = new Map();

// In-memory cache for pending meals awaiting user confirmation
const pendingFoodEntries = new Map();

// In-memory tracker for the most recent food discussed/analyzed per chat (backed by disk cache)
const lastAnalyzedFoodMap = new Map();

function saveLastAnalyzed(chatId, food) {
  if (!food) {
    lastAnalyzedFoodMap.delete(chatId);
    try {
      if (fs.existsSync(LAST_ANALYZED_FILE)) {
        const all = JSON.parse(fs.readFileSync(LAST_ANALYZED_FILE, 'utf8'));
        delete all[chatId];
        fs.writeFileSync(LAST_ANALYZED_FILE, JSON.stringify(all, null, 2));
      }
    } catch {}
    return;
  }
  lastAnalyzedFoodMap.set(chatId, food);
  try {
    let all = {};
    if (fs.existsSync(LAST_ANALYZED_FILE)) {
      all = JSON.parse(fs.readFileSync(LAST_ANALYZED_FILE, 'utf8'));
    }
    all[chatId] = food;
    fs.writeFileSync(LAST_ANALYZED_FILE, JSON.stringify(all, null, 2));
  } catch {}
}

function getLastAnalyzed(chatId) {
  if (lastAnalyzedFoodMap.has(chatId)) {
    return lastAnalyzedFoodMap.get(chatId);
  }
  try {
    if (fs.existsSync(LAST_ANALYZED_FILE)) {
      const all = JSON.parse(fs.readFileSync(LAST_ANALYZED_FILE, 'utf8'));
      if (all[chatId]) {
        lastAnalyzedFoodMap.set(chatId, all[chatId]);
        return all[chatId];
      }
    }
  } catch {}
  return null;
}

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
// AI COACH & DETERMINISTIC ACTION DISPATCHER
// ==========================================

async function callAiCoach(chatId, userMessage, photoBase64 = null) {
  const currentWeight = await getLatestWeight();
  const waterMl = await getTodayWater();
  const foodLogs = await getTodayFoodLogs();
  const lastAnalyzed = getLastAnalyzed(chatId);

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const currentHour = now.getHours();

  const todayMacros = foodLogs.reduce((acc, f) => ({
    calories: acc.calories + (f.calories || 0),
    protein: acc.protein + (f.protein || 0),
    carbs: acc.carbs + (f.carbs || 0),
    fat: acc.fat + (f.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const foodSummaryText = foodLogs.length > 0
    ? foodLogs.map(f => `• ${f.name} (${f.quantity}g) - ${f.calories}kcal, P:${f.protein}g, C:${f.carbs}g, F:${f.fat}g [${f.time || ''}]`).join('\n')
    : 'Κανένα γεύμα ακόμα.';

  const lastAnalyzedText = lastAnalyzed 
    ? `"${lastAnalyzed.name}" (${lastAnalyzed.quantity}g, ${lastAnalyzed.calories}kcal, P:${lastAnalyzed.protein}g, C:${lastAnalyzed.carbs}g, F:${lastAnalyzed.fat}g)`
    : 'Κανένα πρόσφατο πιάτο.';

  const cleanUserMsg = userMessage ? userMessage.trim() : '';
  const lowerUserMsg = cleanUserMsg.toLowerCase();
  const isNegated = /\b(?:δεν|μην|μη|όχι|οχι|ούτε|ουτε|άκυρο|ακυρο)\b/i.test(lowerUserMsg);

  // ============================================================
  // CASE 1: PHOTO UPLOADED (VISION ANALYSIS WITH CONFIRMATION)
  // ============================================================
  if (photoBase64) {
    const promptText = `Είσαι ο διαιτολόγος του Σπύρου (Keto 16:8, Στένωση Σπονδυλικού Σωλήνα).
Ανάλυσε αυτή τη φωτογραφία πιάτου και απάντησε ΣΥΝΤΟΜΑ σε 2-3 γραμμές:
1. Τι τρόφιμα/πιάτο βλέπεις και εκτίμηση γραμμαρίων.
2. Αν είναι κατάλληλο για Keto και γιατί (1 πρόταση).
3. Θερμίδες & Macros επιγραμματικά.

ΣΤΟ ΤΕΛΟΣ ΒΑΛΕ ΥΠΟΧΡΕΩΤΙΚΑ ΤΟ TAG:
[ACTION:PROPOSE_FOOD:{"name":"Όνομα Πιάτου","grams":200,"calories":120,"protein":15,"carbs":4,"fat":3}]`;

    const messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: promptText },
          { type: 'image_url', image_url: { url: photoBase64 } }
        ]
      }
    ];

    try {
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
          max_tokens: 450,
        })
      });

      let aiResponse = '';
      if (res.ok) {
        const data = await res.json();
        if (data && data.content) aiResponse = data.content;
        else if (data && data.choices?.[0]?.message?.content) aiResponse = data.choices[0].message.content;
      }

      if (!aiResponse) {
        aiResponse = 'Βλέπω το πιάτο σου, αλλά υπήρξε στιγμιαίο θέμα στην ανάλυση. Δοκίμασε ξανά!';
      }

      let proposedFood = null;

      // 1. Try parsing ACTION:PROPOSE_FOOD tag
      const proposeTagMatch = aiResponse.match(/\[ACTION:PROPOSE_FOOD:\s*(\{.*?\})\s*\]/is);
      if (proposeTagMatch) {
        try {
          const parsed = JSON.parse(proposeTagMatch[1]);
          if (parsed && parsed.name) {
            proposedFood = {
              id: 'fl-' + Date.now(),
              foodId: 'food-ai-' + Date.now(),
              name: extractCleanFoodName(parsed.name),
              quantity: parsed.grams || 200,
              calories: parsed.calories || 100,
              protein: parsed.protein || 5,
              carbs: parsed.carbs || 2,
              fat: parsed.fat || 2,
              time: timeStr,
            };
          }
        } catch {}
      }

      // 2. Fallback extraction if tag was omitted by LLM
      if (!proposedFood) {
        const gramMatch = aiResponse.match(/(\d{2,4})\s*(?:g|gr|γραμμ)/i);
        const grams = gramMatch ? parseInt(gramMatch[1], 10) : 200;
        const analysis = analyzeFoodDynamically(aiResponse);
        proposedFood = {
          id: 'fl-' + Date.now(),
          foodId: analysis.id || ('food-' + Date.now()),
          name: analysis.name || 'Πιάτο φαγητού',
          quantity: grams,
          calories: Math.round(analysis.calories * (grams / 100)) || 100,
          protein: Math.round(analysis.protein * (grams / 100) * 10) / 10 || 5,
          carbs: Math.round(analysis.carbs * (grams / 100) * 10) / 10 || 2,
          fat: Math.round(analysis.fat * (grams / 100) * 10) / 10 || 2,
          time: timeStr,
        };
      }

      // Save to persistent cache
      saveLastAnalyzed(chatId, proposedFood);

      const cleanMessage = formatHumanMessage(aiResponse);
      const pendingKey = `pending_${chatId}_${Date.now()}`;
      pendingFoodEntries.set(pendingKey, proposedFood);

      const keyboard = [
        [
          { text: `✅ Ναι, βάλτο στο Dashboard (${proposedFood.quantity}g)`, callback_data: `LOG_CONFIRM:${pendingKey}` }
        ],
        [
          { text: `❌ Όχι, απλή ερώτηση`, callback_data: `LOG_CANCEL:${pendingKey}` }
        ]
      ];

      // Record in history
      const history = chatHistories.get(chatId) || [];
      history.push({ role: 'user', content: '[Φωτογραφία Πιάτου]' });
      history.push({ role: 'assistant', content: cleanMessage });
      chatHistories.set(chatId, history.slice(-10));

      return { text: cleanMessage, keyboard };
    } catch (err) {
      console.error('[Vision Analysis Error]:', err.message);
      return { text: 'Σπύρο, είχα ένα θέμα στη λήψη της φωτογραφίας. Στείλε την ξανά!' };
    }
  }

  // ============================================================
  // CASE 2: DETERMINISTIC DIRECT COMMANDS (TEXT)
  // ============================================================

  // 2A. "Βάλτο / Βάλτα / Ναι / Κατάγραψέ το / Πρόσθεσέ το / Βάλτο στην εφαρμογή"
  const isAddCommand = !isNegated && (
    /^(?:βάλτο|βαλτο|βάλτα|βαλτα|βάλτε\s*το|βαλτε\s*το|βάλτο\s*στην|βαλτο\s*στην|πρόσθεσέ\s*το|προσθεσε\s*το|κατάγραψέ\s*το|κατεγραψε\s*το|οκ\s*βάλτο|οκ\s*βαλτο|ναι\s*βάλτο|ναι\s*βαλτο|ναι\s*βάλτα|ναι\s*βαλτα|ναι|ok|οκ|βάλτο\s*στο\s*dashboard|βάλτα\s*στο\s*dashboard)$/i.test(cleanUserMsg) ||
    /(?:βάλτο|βαλτο|βάλτα|βαλτα|κατάγραψέ το|κατεγραψε το)\s*(?:στην εφαρμογή|στην εφαρμογη|στο dashboard|στο πλανο)/i.test(cleanUserMsg)
  );

  if (isAddCommand && lastAnalyzed) {
    const entry = {
      ...lastAnalyzed,
      id: 'fl-' + Date.now(),
      time: timeStr,
    };
    const updated = await addTodayFoodLog(entry);
    const newMacros = updated.reduce((acc, f) => ({
      calories: acc.calories + (f.calories || 0),
      carbs: acc.carbs + (f.carbs || 0),
      protein: acc.protein + (f.protein || 0),
    }), { calories: 0, carbs: 0, protein: 0 });

    const msg = `✅ <b>Καταγράφηκε στη βάση δεδομένων:</b>\n• <b>${entry.name}</b> (${entry.quantity}g) - ${entry.calories} kcal, P:${entry.protein}g, C:${entry.carbs}g, F:${entry.fat}g\n\n📊 <b>Σύνολο σήμερα:</b> ${newMacros.calories} kcal | ${newMacros.carbs}g υδατάνθρακες`;

    const history = chatHistories.get(chatId) || [];
    history.push({ role: 'user', content: cleanUserMsg });
    history.push({ role: 'assistant', content: msg });
    chatHistories.set(chatId, history.slice(-10));

    return { text: msg, keyboard: null };
  }

  // 2B. "Δεν τα έβαλες / Δεν το έβαλες / Δεν τα έβαλες στη βάση / Τσέκαρε τη βάση"
  const isCheckOrDidntAdd = /(?:δεν\s*(?:τα\s*)?(?:το\s*)?(?:έβαλες|εβαλες|μπήκε|μπηκε|κατέγραψες|κατεγραψες|υπάρχει|υπαρχει))|τσέκαρε\s*(?:τη\s*)?βάση|τσεκαρε\s*(?:τη\s*)?βαση/i.test(cleanUserMsg);
  if (isCheckOrDidntAdd) {
    let existingLogs = await getTodayFoodLogs();
    // If last analyzed food was discussed but not in DB, insert it now!
    if (lastAnalyzed && !existingLogs.some(f => f.name === lastAnalyzed.name && f.quantity === lastAnalyzed.quantity)) {
      const entry = {
        ...lastAnalyzed,
        id: 'fl-' + Date.now(),
        time: timeStr,
      };
      existingLogs = await addTodayFoodLog(entry);
    }

    const water = await getTodayWater();
    const curMacros = existingLogs.reduce((acc, f) => ({
      calories: acc.calories + (f.calories || 0),
      carbs: acc.carbs + (f.carbs || 0),
      protein: acc.protein + (f.protein || 0),
    }), { calories: 0, carbs: 0, protein: 0 });

    const foodListText = existingLogs.length > 0
      ? existingLogs.map(f => `• <b>${f.name}</b> (${f.quantity}g) - ${f.calories} kcal, C:${f.carbs}g`).join('\n')
      : '<i>Κανένα γεύμα ακόμα.</i>';

    const msg = `🔍 <b>Live Έλεγχος Βάσης Δεδομένων:</b>\n\n💧 Νερό: <b>${water}ml / 3000ml</b>\n🍽️ Καταγεγραμμένα Γεύματα (${existingLogs.length}):\n${foodListText}\n\n🔥 <b>Σύνολο:</b> ${curMacros.calories} kcal | P: ${curMacros.protein}g | C: ${curMacros.carbs}g\n\n✅ <b>Όλα είναι καταχωρημένα και συγχρονισμένα στο Dashboard!</b>`;

    const history = chatHistories.get(chatId) || [];
    history.push({ role: 'user', content: cleanUserMsg });
    history.push({ role: 'assistant', content: msg });
    chatHistories.set(chatId, history.slice(-10));

    return { text: msg, keyboard: null };
  }

  // 2C. Live Status Queries ("Πόσο έχω πιει;", "Πόσο λέει η βάση;", "Τι λέει η βάση;", "Πόσο νερό;", "Τι έχω φάει;")
  const isQueryStatus = /πόσο\s*(?:έχω\s*)?(?:πιει|φαει|φάει)|τι\s*λέει\s*η\s*βάση|πόσο\s*λέει\s*η\s*βάση|τι\s*έχω\s*φάει|πόσο\s*νερό/i.test(cleanUserMsg);
  if (isQueryStatus) {
    const water = await getTodayWater();
    const curLogs = await getTodayFoodLogs();
    const curMacros = curLogs.reduce((acc, f) => ({
      calories: acc.calories + (f.calories || 0),
      carbs: acc.carbs + (f.carbs || 0),
      protein: acc.protein + (f.protein || 0),
    }), { calories: 0, carbs: 0, protein: 0 });

    const foodListText = curLogs.length > 0
      ? curLogs.map(f => `• <b>${f.name}</b> (${f.quantity}g) - ${f.calories} kcal, C:${f.carbs}g`).join('\n')
      : '<i>Κανένα γεύμα ακόμα.</i>';

    const msg = `📊 <b>Στοιχεία Ημέρας από τη Βάση:</b>\n\n💧 Νερό: <b>${water}ml / 3000ml</b>\n${renderProgressBar(water, 3000)}\n\n🍽️ Σημερινά Γεύματα (${curLogs.length}):\n${foodListText}\n\n🔥 <b>Σύνολο:</b> ${curMacros.calories} kcal | P: ${curMacros.protein}g | C: ${curMacros.carbs}g`;

    const history = chatHistories.get(chatId) || [];
    history.push({ role: 'user', content: cleanUserMsg });
    history.push({ role: 'assistant', content: msg });
    chatHistories.set(chatId, history.slice(-10));

    return { text: msg, keyboard: null };
  }

  // 2D. Water Commands ("ήπια ένα ποτήρι", "χίπια ένα ποτήρι", "βάλε αλλά 250", "ήπια 500ml", "άλλο ένα ποτήρι νερό")
  const isWaterAction = !isNegated && (
    /(?:ήπια|ηπια|χίπια|χιπια|πρόσθεσε|προσθεσε|βάλε|βαλε).*?(?:νερό|νερο|water|ποτήρι|ποτηρι|ποτηρια|ποτήρια|ml|λιτρο|λίτρο|l)/i.test(lowerUserMsg) ||
    /(?:βάλε|βαλε|πρόσθεσε|προσθεσε)\s*αλλά?\s*(\d+)/i.test(lowerUserMsg) ||
    /(?:άλλο|αλλο)\s*ένα\s*ποτήρι/i.test(lowerUserMsg)
  );

  if (isWaterAction) {
    let ml = 250;
    const numMatch = lowerUserMsg.match(/(\d+)\s*(?:ml|λιτρα|λίτρα|l|ποτηρια|ποτήρια)?/i);
    if (lowerUserMsg.includes('1 λιτρο') || lowerUserMsg.includes('1 λίτρο') || lowerUserMsg.includes('1l')) ml = 1000;
    else if (lowerUserMsg.includes('2 λιτρα') || lowerUserMsg.includes('2 λίτρα') || lowerUserMsg.includes('2l')) ml = 2000;
    else if (lowerUserMsg.includes('μισό λίτρο') || lowerUserMsg.includes('500ml') || lowerUserMsg.includes('μπουκάλι')) ml = 500;
    else if (lowerUserMsg.includes('2 ποτηρια') || lowerUserMsg.includes('2 ποτήρια') || lowerUserMsg.includes('δυο ποτηρια')) ml = 500;
    else if (numMatch && numMatch[1]) ml = parseInt(numMatch[1], 10);

    const newWater = await addTodayWater(ml);
    const msg = `💧 <b>Καταγράφηκε στη βάση!</b> Προστέθηκαν ${ml}ml.\nΝερό σήμερα: <b>${newWater}ml / 3000ml</b>\n${renderProgressBar(newWater, 3000)}`;

    const history = chatHistories.get(chatId) || [];
    history.push({ role: 'user', content: cleanUserMsg });
    history.push({ role: 'assistant', content: msg });
    chatHistories.set(chatId, history.slice(-10));

    return { text: msg, keyboard: null };
  }

  // 2E. Remove / Undo Command ("βγάλε το", "βγαλτο", "σβήσε το τελευταίο", "αφαίρεσέ το")
  const isRemoveCommand = /(?:βγάλε\s*το|βγαλε\s*το|βγαλτο|βγάλτο|σβήσε\s*το|σβησε\s*το|αφαίρεσε\s*το|αφαιρεσε\s*το|σβήσε\s*το\s*τελευταίο|αφαίρεσέ\s*το)/i.test(cleanUserMsg);
  if (isRemoveCommand) {
    const curLogs = await getTodayFoodLogs();
    let msg = 'Δεν υπάρχει καταγεγραμμένο γεύμα για να αφαιρεθεί.';
    if (curLogs.length > 0) {
      const removed = curLogs.pop();
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
          completed_habits: curLogs,
          notes: existing?.notes ?? '',
        }, { onConflict: 'date' });
        msg = `🗑️ <b>Αφαιρέθηκε από τη βάση:</b> ${removed.name} (${removed.quantity}g)`;
      } catch (err) {
        console.error('Supabase remove food error:', err.message);
      }
    }

    const history = chatHistories.get(chatId) || [];
    history.push({ role: 'user', content: cleanUserMsg });
    history.push({ role: 'assistant', content: msg });
    chatHistories.set(chatId, history.slice(-10));

    return { text: msg, keyboard: null };
  }

  // 2F. Clear All Foods ("σβήσε τα όλα", "καθάρισε τα γεύματα")
  const isClearCommand = /σβήσε\s*τα\s*όλα|σβησε\s*τα\s*ολα|καθάρισε\s*τα\s*γεύματα|καθαρισε\s*τα\s*γευματα|μηδένισε\s*τα\s*φαγητά/i.test(cleanUserMsg);
  if (isClearCommand) {
    await clearTodayFoodLogs();
    saveLastAnalyzed(chatId, null);
    const msg = `🗑️ <b>Όλα τα σημερινά γεύματα διαγράφηκαν από τη βάση δεδομένων.</b>`;

    const history = chatHistories.get(chatId) || [];
    history.push({ role: 'user', content: cleanUserMsg });
    history.push({ role: 'assistant', content: msg });
    chatHistories.set(chatId, history.slice(-10));

    return { text: msg, keyboard: null };
  }

  // 2G. Weight Logging ("ζυγίζομαι 103.5", "βάρος 103.2kg", "είμαι 103.5")
  const weightMatch = !isNegated && lowerUserMsg.match(/(?:ζυγίζομαι|ζυγιζομαι|βάρος|βαρος|κιλά|κιλα|ειμαι|είμαι)\s*(\d{2,3}(?:[\.,]\d)?)\s*(?:kg|κιλα|κιλά)?/i);
  if (weightMatch) {
    const w = parseFloat(weightMatch[1].replace(',', '.'));
    if (w >= 70 && w <= 160) {
      await addWeightLog(w);
      const lost = (105.0 - w).toFixed(1);
      const relief = (Math.max(0, parseFloat(lost)) * 4).toFixed(1);
      const msg = `⚖️ <b>Βάρος καταγράφηκε στη βάση: ${w}kg</b>\n• Συνολική απώλεια: <b>-${lost}kg</b>\n• Αποφόρτιση στη μέση: <b>-${relief}kg πίεση</b>`;

      const history = chatHistories.get(chatId) || [];
      history.push({ role: 'user', content: cleanUserMsg });
      history.push({ role: 'assistant', content: msg });
      chatHistories.set(chatId, history.slice(-10));

      return { text: msg, keyboard: null };
    }
  }

  // 2H. Explicit Positive Eating ("έφαγα 200g κοτόπουλο", "σήμερα θα φάω 2 μπούτια κοτόπουλο και χόρτα")
  const isExplicitEating = !isNegated && /(?:^|\s)(?:έφαγα|εφαγα|έφαγαμε|εφαγαμε|κατανάλωσα|καταναλωσα|σήμερα θα φάω|σημερα θα φαω)(?:\s|$)/i.test(lowerUserMsg);
  if (isExplicitEating) {
    const gramMatch = lowerUserMsg.match(/(\d+)\s*(?:g|gr|γραμμάρια|γραμμαρια)/i);
    const grams = gramMatch ? parseInt(gramMatch[1], 10) : 200;
    const analysis = analyzeFoodDynamically(cleanUserMsg);
    const cleanFoodName = extractCleanFoodName(cleanUserMsg);

    const entry = {
      id: 'fl-' + Date.now(),
      foodId: analysis.id || ('food-' + Date.now()),
      name: cleanFoodName,
      quantity: grams,
      calories: Math.round((analysis.calories || 150) * (grams / 100)),
      protein: Math.round((analysis.protein || 20) * (grams / 100) * 10) / 10,
      carbs: Math.round((analysis.carbs || 2) * (grams / 100) * 10) / 10,
      fat: Math.round((analysis.fat || 5) * (grams / 100) * 10) / 10,
      time: timeStr,
    };

    const updatedLogs = await addTodayFoodLog(entry);
    saveLastAnalyzed(chatId, entry);

    const newMacros = updatedLogs.reduce((acc, f) => ({
      calories: acc.calories + (f.calories || 0),
      carbs: acc.carbs + (f.carbs || 0),
      protein: acc.protein + (f.protein || 0),
    }), { calories: 0, carbs: 0, protein: 0 });

    const msg = `✅ <b>Καταγράφηκε στη βάση δεδομένων:</b>\n• <b>${entry.name}</b> (${entry.quantity}g) - ${entry.calories} kcal, P:${entry.protein}g, C:${entry.carbs}g, F:${entry.fat}g\n\n📊 <b>Σύνολο σήμερα:</b> ${newMacros.calories} kcal | ${newMacros.carbs}g υδατάνθρακες`;

    const history = chatHistories.get(chatId) || [];
    history.push({ role: 'user', content: cleanUserMsg });
    history.push({ role: 'assistant', content: msg });
    chatHistories.set(chatId, history.slice(-10));

    return { text: msg, keyboard: null };
  }

  // ============================================================
  // CASE 3: GENERAL CONVERSATION / ADVICE / QUESTIONS VIA GPT-4o-mini
  // ============================================================
  const systemPrompt = `Είσαι ο προσωπικός διατροφολόγος και coach του Σπύρου.
Μιλάς σαν πραγματικός άνθρωπος/φίλος, άμεσα, ζεστά, ανθρώπινα και περιεκτικά.

[ΚΡΙΣΙΜΟΙ ΚΑΝΟΝΕΣ]:
1. ΜΗΝ ΧΡΗΣΙΜΟΠΟΙΕΙΣ ΠΟΤΕ σύμβολα #, ##, ###, ***, markdown headers ή λίστες με αστεράκια.
2. Απαντήσεις ΠΑΝΤΑ 2-4 γραμμές max, to the point. ΜΗΝ γράφεις κατεβατά.
3. ΕΧΕΙΣ ΠΛΗΡΗ ΜΝΗΜΗ ΣΥΝΟΜΙΛΙΑΣ.
4. ΠΡΟΣΟΧΗ ΣΤΙΣ ΑΡΝΗΣΕΙΣ: «ΔΕΝ ήπια», «ΔΕΝ έφαγα», «Όχι δεν ήπια άλλο» = ΔΕΝ ΕΚΑΝΕ κάτι.
5. Τελευταίο αναλυμένο πιάτο: ${lastAnalyzedText}

[ΠΡΟΦΙΛ ΣΠΥΡΟΥ]:
Ύψος 180cm, Τρέχον: ${currentWeight}kg, Στόχος: 90kg.
Μέση: Στένωση Σπονδυλικού Σωλήνα (3L νερό/ημέρα, στατικό ποδήλατο, όχι άλματα/τρέξιμο).
Δίαιτα: Low-Carb 16:8 (<20-30g carbs/ημέρα).
Απαγορεύονται: Ψωμί, ζυμαρικά, ρύζι, πατάτες, ζάχαρη, γλυκά, μπανάνες.

[ΣΗΜΕΡΙΝΗ ΚΑΤΑΣΤΑΣΗ ΣΤΗ ΒΑΣΗ ΔΕΔΟΜΕΝΩΝ]:
Νερό: ${waterMl}ml/3000ml | Θερμίδες: ${todayMacros.calories}kcal | P:${todayMacros.protein}g | C:${todayMacros.carbs}g | F:${todayMacros.fat}g
Σημερινά γεύματα: ${foodSummaryText}`;

  let history = chatHistories.get(chatId) || [];
  if (history.length > 10) history = history.slice(-10);

  const messages = [
    { role: 'user', content: systemPrompt },
    { role: 'assistant', content: 'OK. Απαντάω σύντομα, ανθρώπινα, χωρίς markdown.' },
    ...history,
    { role: 'user', content: cleanUserMsg }
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
      if (data && data.content) aiResponse = data.content;
      else if (data && data.choices?.[0]?.message?.content) aiResponse = data.choices[0].message.content;
    }

    if (!aiResponse) {
      aiResponse = 'Σπύρο, δεν μπόρεσα να το επεξεργαστώ. Δοκίμασε ξανά σε λίγο!';
    }

    let cleanMessage = formatHumanMessage(aiResponse);

    // Save to conversation history
    history.push({ role: 'user', content: cleanUserMsg });
    history.push({ role: 'assistant', content: cleanMessage });
    chatHistories.set(chatId, history);

    return { text: cleanMessage, keyboard: null };
  } catch (err) {
    console.error('AI Coach execution error:', err.message);
    return { text: 'Σπύρο, είχα ένα στιγμιαίο θέμα σύνδεσης. Δοκίμασε ξανά!' };
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
      const water = await getTodayWater();
      for (const chatId of subscribers) {
        const text = `🍽️ Άνοιξε το παράθυρο φαγητού (12:00-20:00)!\n\nΏρα για το 1ο γεύμα. Στείλε μου φωτογραφία του πιάτου σου 📸 ή γράψε τι έφαγες.\nΚαθαρή πρωτεΐνη + σαλάτα, μηδέν ψωμί.\n\n💧 Νερό: ${water}ml / 3000ml`;
        await sendMessage(chatId, text);
      }
    }

    // WATER REMINDERS - Every 2 hours throughout the day
    const waterReminderHours = [10, 13, 16, 18, 20];
    if (waterReminderHours.includes(hour) && minute === 0 && !sentRemindersToday.has(`${todayStr}-water-${hour}`)) {
      sentRemindersToday.add(`${todayStr}-water-${hour}`);
      const water = await getTodayWater();
      if (water < 3000) {
        const remaining = 3000 - water;
        const glasses = Math.ceil(remaining / 250);
        const messages = [
          `💧 Σπύρο πιες νερό! Είσαι στα ${water}ml/3000ml. Λείπουν ${remaining}ml (~${glasses} ποτήρια).`,
          `💧 Νερό check! ${water}ml/3000ml μέχρι τώρα. Πιες ένα ποτήρι για τη μέση σου!`,
          `💧 Υπενθύμιση νερού: ${water}ml/3000ml. Οι δίσκοι θέλουν ενυδάτωση, πιες 250-500ml!`,
          `💧 Πιες νεράκι! ${water}ml/3000ml. Ακόμα ${remaining}ml για τον στόχο σου.`,
          `💧 Water time! ${water}ml/3000ml. Πάμε ένα ακόμα ποτήρι Σπύρο!`,
        ];
        const msg = messages[hour % messages.length];
        for (const chatId of subscribers) {
          await sendMessage(chatId, msg);
        }
      }
    }

    // 15:30 - Afternoon Movement Reminder
    if (hour === 15 && minute === 30 && !sentRemindersToday.has(`${todayStr}-15:30`)) {
      sentRemindersToday.add(`${todayStr}-15:30`);
      for (const chatId of subscribers) {
        const text = `🚴 Ώρα για κίνηση Σπύρο! 15-20 λεπτά στατικό ποδήλατο ή περπάτημα σε ίσιο. Η μέση σου θα σε ευχαριστήσει!`;
        await sendMessage(chatId, text);
      }
    }

    // 19:30 - Dinner Reminder (Kitchen closing soon)
    if (hour === 19 && minute === 30 && !sentRemindersToday.has(`${todayStr}-19:30`)) {
      sentRemindersToday.add(`${todayStr}-19:30`);
      for (const chatId of subscribers) {
        const text = `⏰ Σπύρο, η κουζίνα κλείνει στις 20:00! Στείλε μου φωτογραφία του πιάτου σου 📸 ή γράψε τι τρως. Μετά ξεκινάει η 16ωρη νηστεία.`;
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
        const text = `🌙 Απολογισμός ημέρας Σπύρο!\n\nΝερό: ${water}ml/3000ml\nΘερμίδες: ${todayMacros.calories} kcal | P: ${todayMacros.protein}g | C: ${todayMacros.carbs}g\n\nΚαλή ξεκούραση!`;
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
