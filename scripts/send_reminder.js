import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import { createClient } from '@supabase/supabase-js';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8603311936:AAG1e-zxKzU48elsr-t7dGyvQCSfvt0E32g';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8162958857';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xrmvingehhiymchoggka.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybXZpbmdlaGhpeW1jaG9nZ2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNjkzMTEsImV4cCI6MjA5MDk0NTMxMX0.UDvGORYRXdo1IKTrduIJYJEfgNuli0LSpAC9njm7I9Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function renderProgressBar(current, max = 3000, length = 10) {
  const percent = Math.min(100, Math.max(0, Math.round((current / max) * 100)));
  const filled = Math.round((percent / 100) * length);
  const empty = length - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}] ${percent}%`;
}

async function sendMessage(text) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: text,
        parse_mode: 'HTML',
      }),
    });
    const data = await res.json();
    console.log('[Telegram Cron] Sent:', data.ok ? 'SUCCESS' : data);
    return data;
  } catch (err) {
    console.error('[Telegram Cron] Send Error:', err.message);
  }
}

async function runCron() {
  console.log('=== Running 24/7 Automated Telegram Reminder Cron ===');

  // Get current Athens time
  const athensDateStr = new Date().toLocaleString('en-US', { timeZone: 'Europe/Athens' });
  const athensDate = new Date(athensDateStr);
  const hour = athensDate.getHours();
  const minute = athensDate.getMinutes();
  const todayIso = new Date().toISOString().split('T')[0];

  console.log(`[Athens Time] ${hour}:${String(minute).padStart(2, '0')} (Date: ${todayIso})`);

  // Fetch current data from Supabase
  let waterMl = 0;
  let foodLogs = [];
  try {
    const { data: daily } = await supabase
      .from('spiros_daily_logs')
      .select('*')
      .eq('date', todayIso)
      .single();

    if (daily) {
      waterMl = daily.water_ml || 0;
      if (Array.isArray(daily.completed_habits)) {
        foodLogs = daily.completed_habits;
      }
    }
  } catch (e) {
    console.warn('Could not fetch daily log:', e.message);
  }

  const todayMacros = foodLogs.reduce((acc, f) => ({
    calories: acc.calories + (f.calories || 0),
    protein: acc.protein + (f.protein || 0),
    carbs: acc.carbs + (f.carbs || 0),
  }), { calories: 0, protein: 0, carbs: 0 });

  let message = '';

  // Determine appropriate reminder based on Athens hour
  if (hour >= 8 && hour < 11) {
    // 09:00 Morning Hydration & Fasting
    message = `🌅 <b>Καλημέρα Σπύρο! (Πρωινή Ενυδάτωση)</b>\n\n` +
      `Είσαι στη φάση της πρωινής νηστείας (καύση λίπους).\n\n` +
      `💧 <b>Πιες 500ml δροσερό νερό τώρα:</b>\n` +
      `Οι μεσοσπονδύλιοι δίσκοι της μέσης χρειάζονται ενυδάτωση μετά τον ύπνο για απορρόφηση κραδασμών.\n\n` +
      `• Νερό σήμερα: <b>${waterMl}ml / 3000ml</b>\n${renderProgressBar(waterMl, 3000)}\n\n` +
      `<i>(Γράψε μου <code>ήπια 500ml</code> μόλις το πιεις!)</i>`;
  } else if (hour >= 11 && hour < 14) {
    // 12:00 Lunch Window Opening
    message = `🍽️ <b>Άνοιξε το Παράθυρο Φαγητού (12:00 - 20:00)!</b>\n\n` +
      `Ώρα για το 1ο γεύμα της ημέρας:\n` +
      `• Εστίασε σε καθαρή άπαχη πρωτεΐνη (κοτόπουλο, μοσχάρι, ψάρι, αυγά).\n` +
      `• Συνδύασε με πράσινη σαλάτα (μαρούλι, αγγούρι, σπαράγγια).\n` +
      `• Μηδέν ψωμί και υδατάνθρακες.\n\n` +
      `• Νερό μέχρι τώρα: <b>${waterMl}ml / 3000ml</b>\n\n` +
      `<i>(Στείλε μου τι έφαγες, π.χ. <code>200g κοτόπουλο με σαλάτα</code> για αυτόματη καταγραφή!)</i>`;
  } else if (hour >= 14 && hour < 18) {
    // 15:30 Afternoon Movement & Hydration
    message = `🚴 <b>Απογευματινό Check Σπύρο!</b>\n\n` +
      `💧 <b>Ενυδάτωση:</b> <b>${waterMl}ml / 3000ml</b>\n${renderProgressBar(waterMl, 3000)}\n\n` +
      `🩺 <b>Κίνηση για τη Μέση (Στένωση Σπονδυλικού Σωλήνα):</b>\n` +
      `• 15-20 λεπτά στο στατικό ποδήλατο με πλάτη ή περπάτημα σε ίσιο έδαφος.\n` +
      `• Απαγορεύονται τα άλματα και το τρέξιμο.\n\n` +
      `<i>(Πιες άλλο 1 ποτήρι νερό και γράψε μου: <code>ήπια 300ml</code>)</i>`;
  } else if (hour >= 18 && hour < 21) {
    // 19:30 Dinner Warning
    message = `⏰ <b>Πλησιάζει το Κλείσιμο της Κουζίνας (20:00)!</b>\n\n` +
      `Φάε το βραδινό σου πριν τις 20:00 (π.χ. σολομό, τόνο ή ομελέτα με λαχανικά).\n` +
      `Από τις 20:00 ξεκινάει η 16ωρη νυχτερινή νηστεία.\n\n` +
      `• Σημερινό νερό: <b>${waterMl}ml / 3000ml</b>\n` +
      `• Σημερινές θερμίδες: <b>${todayMacros.calories} kcal</b> | Πρωτεΐνη: <b>${todayMacros.protein}g</b>\n\n` +
      `<i>(Στείλε μου το βραδινό σου για να κλείσουμε την ημέρα!)</i>`;
  } else {
    // 21:30 Evening Review
    message = `🌙 <b>Βραδινός Απολογισμός Σπύρο!</b>\n\n` +
      `Η κουζίνα έκλεισε επιτυχώς για σήμερα.\n\n` +
      `📊 <b>Σύνοψη Ημέρας:</b>\n` +
      `• Νερό: <b>${waterMl}ml / 3000ml</b> ${waterMl >= 3000 ? '✅ (Στόχος επετεύχθη!)' : ''}\n` +
      `• Θερμίδες: <b>${todayMacros.calories} kcal</b>\n` +
      `• Πρωτεΐνη: <b>${todayMacros.protein}g</b>\n` +
      `• Υδατάνθρακες: <b>${todayMacros.carbs}g</b>\n\n` +
      `Καλή ξεκούραση και αποφόρτιση στη μέση σου. Αύριο συνεχίζουμε δυναμικά!`;
  }

  await sendMessage(message);
}

runCron();
