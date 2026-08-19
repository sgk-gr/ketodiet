import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
  const newWater = Math.min(6000, current + mlToAdd);
  
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
      `• <b>Νερό:</b> Γράψε π.χ. <i>«ήπια 1 λίτρο»</i> ή <i>«500ml»</i> ή <i>«1 ποτήρι»</i> και θα ενημερώσω αμέσως το Dashboard σου!\n` +
      `• <b>Βάρος:</b> Γράψε π.χ. <i>«103.5 kg»</i> και θα το καταχωρήσω στη βάση.\n` +
      `• <b>Υπενθυμίσεις:</b> Θα σου στέλνω αυτόματα μέσα στην ημέρα να πίνεις νερό και υπενθυμίσεις για τα γεύματα 12:00, 16:00, 20:00.\n\n` +
      `<b>Σημερινό νερό:</b> ${(todayWater/1000).toFixed(2)} / 3.00 L\n${bar}`
    );
    return;
  }

  // 2. Check for Water logging
  const waterMl = parseWaterAmount(text);
  if (waterMl) {
    const newTotal = await addTodayWater(waterMl);
    const bar = renderProgressBar(newTotal, 3000);
    const addedL = (waterMl / 1000).toFixed(2);
    const totalL = (newTotal / 1000).toFixed(2);

    await sendMessage(chatId,
      `<b>Καταγράφηκε!</b> +${addedL}L νερό.\n\n` +
      `<b>Σύνολο σήμερα:</b> ${totalL} / 3.00 L\n` +
      `<b>Πρόοδος:</b> ${bar}\n\n` +
      `<i>Οι μεσοσπονδύλιοι δίσκοι της μέσης ενυδατώνονται και αποφορτίζονται!</i>`
    );
    return;
  }

  // 3. Check for Weight logging
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

  // 4. Food question / Menu
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
    `• Για να καταγράψεις νερό, γράψε π.χ.: <i>«ήπια 500ml»</i> ή <i>«ήπια 1 λίτρο»</i>\n` +
    `• Για να καταγράψεις βάρος, γράψε π.χ.: <i>«103.2 kg»</i>\n\n` +
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
pollUpdates();
startReminderScheduler();
