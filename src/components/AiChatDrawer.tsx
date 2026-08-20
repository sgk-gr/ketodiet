import React, { useState, useEffect, useRef } from 'react';
import { DataService, supabase } from '../lib/supabase';
import { AiChatMessage, FoodLogEntry } from '../types';
import { analyzeFoodDynamically } from '../data/foodDatabase';

interface AiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
  currentWeight: number;
  waterMl: number;
  foodLogs: FoodLogEntry[];
}

export function AiChatDrawer({
  isOpen,
  onClose,
  onDataChanged,
  currentWeight,
  waterMl,
  foodLogs,
}: AiChatDrawerProps) {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Load chat history from Supabase / local on mount
  useEffect(() => {
    async function loadHistory() {
      const history = await DataService.getAiChatMessages();
      if (history.length === 0) {
        // Add welcome message if empty
        const welcome: AiChatMessage = {
          id: 'welcome-init',
          sender: 'ai',
          message: `👋 Γεια σου Σπύρο! Είμαι ο AI Health & Keto Coach σου (GPT-4o-mini).\n\n📸 Μπορείς να τραβήξεις ζωντανή φωτογραφία με την Κάμερα (📷) ή να ανεβάσεις από τη Συλλογή (🖼️) για άμεση ανάλυση πιάτου!\n\n💬 Ή γράψε μου ελεύθερα: «έφαγα 200g κοτόπουλο», «ήπια 500ml», «πόσο νερό έχω;» κτλ.`,
          created_at: new Date().toISOString(),
        };
        setMessages([welcome]);
      } else {
        setMessages(history);
      }
    }
    loadHistory();
  }, [currentWeight]);

  // Scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Handle Photo Upload from In-App Chat
  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;

      // 1. Add user photo message with visible image to UI
      const userMsg: AiChatMessage = {
        id: 'msg-photo-' + Date.now(),
        sender: 'user',
        message: '📸 Φωτογραφία Πιάτου',
        image_url: base64Data,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      await DataService.saveAiChatMessage({ sender: 'user', message: '📸 Φωτογραφία Πιάτου', image_url: base64Data });

      try {
        const promptText = `Είσαι ο διατροφολόγος του Σπύρου (Keto 16:8, Στένωση Σπονδυλικού Σωλήνα).
Ανάλυσε αυτή τη φωτογραφία πιάτου και απάντησε ΣΥΝΤΟΜΑ σε 2-3 γραμμές:
1. Τι τρόφιμα βλέπεις και εκτίμηση γραμμαρίων.
2. Αν κάνει για Keto (Ναι/Όχι) και γιατί σε 1 πρόταση.
3. Θερμίδες & Macros επιγραμματικά.

ΣΤΟ ΤΕΛΟΣ ΒΑΛΕ ΥΠΟΧΡΕΩΤΙΚΑ:
[ACTION:LOG_FOOD:{"name":"Όνομα Πιάτου","grams":200,"calories":120,"protein":15,"carbs":4,"fat":3}]`;

        const res = await fetch('https://xrmvingehhiymchoggka.supabase.co/functions/v1/openai-proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybXZpbmdlaGhpeW1jaG9nZ2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNjkzMTEsImV4cCI6MjA5MDk0NTMxMX0.UDvGORYRXdo1IKTrduIJYJEfgNuli0LSpAC9njm7I9Q'}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: promptText },
                  { type: 'image_url', image_url: { url: base64Data } }
                ]
              }
            ],
            temperature: 0.3,
            max_tokens: 450,
          }),
        });

        let aiResponse = '';
        if (res.ok) {
          const data = await res.json();
          if (data && data.content) aiResponse = data.content;
          else if (data && data.choices?.[0]?.message?.content) aiResponse = data.choices[0].message.content;
        }

        if (!aiResponse) {
          aiResponse = 'Βλέπω το πιάτο σου! Εστίασε σε καθαρή πρωτεΐνη και πράσινα λαχανικά.';
        }

        // Parse food and auto-log
        const logTagMatch = aiResponse.match(/\[ACTION:LOG_FOOD:\s*(\{.*?\})\s*\]/is);
        let foodToLog = null;
        if (logTagMatch) {
          try {
            const parsed = JSON.parse(logTagMatch[1]);
            if (parsed && parsed.name) {
              foodToLog = {
                id: 'fl-' + Date.now(),
                foodId: 'food-ai-' + Date.now(),
                name: parsed.name,
                quantity: parsed.grams || 200,
                calories: parsed.calories || 120,
                protein: parsed.protein || 10,
                carbs: parsed.carbs || 3,
                fat: parsed.fat || 2,
                time: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
              };
            }
          } catch {}
        }

        if (!foodToLog) {
          const gramMatch = aiResponse.match(/(\d{2,4})\s*(?:g|gr|γραμμ)/i);
          const grams = gramMatch ? parseInt(gramMatch[1], 10) : 200;
          const analysis = analyzeFoodDynamically(aiResponse);
          foodToLog = {
            id: 'fl-' + Date.now(),
            foodId: analysis.id || ('food-' + Date.now()),
            name: analysis.name || 'Πιάτο φαγητού',
            quantity: grams,
            calories: Math.round(analysis.calories * (grams / 100)) || 120,
            protein: Math.round(analysis.protein * (grams / 100) * 10) / 10 || 10,
            carbs: Math.round(analysis.carbs * (grams / 100) * 10) / 10 || 3,
            fat: Math.round(analysis.fat * (grams / 100) * 10) / 10 || 2,
            time: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
          };
        }

        const todayStr = new Date().toISOString().split('T')[0];
        const updated = [...foodLogs, foodToLog];
        await DataService.saveFoodLogs(todayStr, updated);
        onDataChanged();

        let cleanMsg = aiResponse
          .replace(/\[ACTION:[^\]]*\]/gi, '')
          .replace(/^#+\s*(.*?)$/gm, '$1')
          .replace(/#+/g, '')
          .trim();

        cleanMsg += `\n\n✅ <b>Καταγράφηκε στο Dashboard:</b>\n• ${foodToLog.name} (${foodToLog.quantity}g) - ${foodToLog.calories} kcal, ${foodToLog.carbs}g υδ/κες`;

        const aiMsg: AiChatMessage = {
          id: 'msg-ai-photo-' + Date.now(),
          sender: 'ai',
          message: cleanMsg,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMsg]);
        await DataService.saveAiChatMessage({ sender: 'ai', message: cleanMsg });
      } catch (err: any) {
        console.error('Vision analysis error:', err);
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    setInputText('');
    setIsLoading(true);

    // 1. Add user message
    const userMsg: AiChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      message: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    await DataService.saveAiChatMessage({ sender: 'user', message: text });

    // 2. Call AI with live context
    try {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const todayMacros = foodLogs.reduce(
        (acc, f) => ({
          calories: acc.calories + (f.calories || 0),
          protein: acc.protein + (f.protein || 0),
          carbs: acc.carbs + (f.carbs || 0),
          fat: acc.fat + (f.fat || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      const foodSummary = foodLogs.length > 0
        ? foodLogs.map(f => `• ${f.name} (${f.quantity}g) - ${f.calories}kcal, P:${f.protein}g, C:${f.carbs}g, F:${f.fat}g`).join('\n')
        : 'Κανένα γεύμα ακόμα.';

      const systemPrompt = `Είσαι ο κορυφαίος, έξυπνος, ευγενικός και επιστημονικά καταρτισμένος AI Personal Health & Keto Coach του Σπύρου.
Μιλάς άπταιστα Ελληνικά με φυσικό, ζεστό και επαγγελματικό τόνο (σαν να μιλάει με έμπειρο γιατρό/διατροφολόγο και προσωπικό του φίλο).

[ΠΛΗΡΕΣ ΠΡΟΦΙΛ ΧΡΗΣΤΗ - ΣΠΥΡΟΣ]:
- Όνομα: Σπύρος | Ύψος: 180cm | Τρέχον Βάρος: ${currentWeight} kg | Στόχος: 90.0 kg (-15 kg λίπος).
- Ιατρική Κατάσταση: Στένωση Σπονδυλικού Σωλήνα (Spinal Canal Stenosis).
  * ΑΥΣΤΗΡΟΙ ΚΑΝΟΝΕΣ: ΑΠΑΓΟΡΕΥΟΝΤΑΙ το τρέξιμο, τα άλματα, τα ελεύθερα βάρη στη μέση και οι κλασικοί κοιλιακοί.
  * ΕΠΙΤΡΕΠΕΤΑΙ & ΣΥΝΙΣΤΑΤΑΙ: Στατικό ποδήλατο με πλάτη (recumbent bike), περπάτημα σε ίσιο έδαφος (15-20 λεπτά), κολύμβηση.
  * ΣΗΜΑΣΙΑ ΝΕΡΟΥ: 3.0 Λίτρα/ημέρα για ενυδάτωση των μεσοσπονδύλιων δίσκων ώστε να μην τρίβονται τα νεύρα.
- ΔΙΑΤΡΟΦΗ: Low-Carb 16:8 Διαλειμματική Νηστεία (Νηστεία 20:00 - 12:00 | Παράθυρο Φαγητού 12:00 - 20:00).
  * Υδατάνθρακες: Στόχος < 20-30g net carbs/ημέρα (ΜΟΝΟ από πράσινα λαχανικά/σαλάτες).
  * Απαγορεύονται: Ψωμί, ζυμαρικά, ρύζι, πατάτες, ζάχαρη, γλυκά, αναψυκτικά, χυμοί, αλκοόλ.
  * Επιτρέπονται: Μοσχάρι, κοτόπουλο, γαλοπούλα, χοιρινό, ψάρια (σολομός, τσιπούρα, λαβράκι, τόνος), αυγά, ελαιόλαδο, φέτα, πράσινα λαχανικά (μπρόκολο, σπαράγγια, μαρούλι, αγγούρι).

[ΤΡΕΧΟΥΣΑ ΚΑΤΑΣΤΑΣΗ ΣΗΜΕΡΑ (${timeStr})]:
- Νερό σήμερα: ${waterMl} ml / 3000 ml
- Σημερινά γεύματα:\n${foodSummary}
- Σύνολο Macros: ${todayMacros.calories} kcal | Πρωτεΐνη: ${todayMacros.protein}g | Υδατάνθρακες: ${todayMacros.carbs}g | Λιπαρά: ${todayMacros.fat}g

[ΚΑΝΟΝΕΣ & ACTIONS]:
1. Αν ο Σπύρος αναφέρει ότι έφαγε κάτι, υπολόγισε τα macros και πρόσθεσε στο τέλος:
   [ACTION:LOG_FOOD:{"name":"Όνομα","grams":150,"calories":250,"protein":30,"carbs":2,"fat":12}]
2. Αν ο Σπύρος αναφέρει ότι ήπιε νερό (π.χ. «ήπια 500ml»), πρόσθεσε στο τέλος:
   [ACTION:ADD_WATER:500]
3. Αν ο Σπύρος αναφέρει νέο βάρος (π.χ. «ζυγίζομαι 103.5kg»), πρόσθεσε στο τέλος:
   [ACTION:LOG_WEIGHT:103.5]
4. Απάντησε πάντα στα Ελληνικά, σύντομα, ευγενικά και ενθαρρυντικά.`;

      const recentHistory = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.message,
      }));

      let cleanMsg = '';
      const res = await fetch('https://xrmvingehhiymchoggka.supabase.co/functions/v1/openai-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybXZpbmdlaGhpeW1jaG9nZ2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNjkzMTEsImV4cCI6MjA5MDk0NTMxMX0.UDvGORYRXdo1IKTrduIJYJEfgNuli0LSpAC9njm7I9Q'}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'user', content: systemPrompt },
            { role: 'assistant', content: 'Έλαβα τις οδηγίες. Είμαι ο AI Coach του Σπύρου.' },
            ...recentHistory,
            { role: 'user', content: text },
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.content) {
          cleanMsg = data.content;
        } else if (data && data.choices && data.choices[0] && data.choices[0].message) {
          cleanMsg = data.choices[0].message.content;
        }
      }

      if (!cleanMsg) {
        cleanMsg = 'Είμαι εδώ για ό,τι χρειαστείς, Σπύρο!';
      }

      // Process Actions & Infallible Automatic Intent Detection
      let actionExecuted = false;
      const lowerUserMsg = text.toLowerCase();
      const isSugaryDrinkOrFood = /καφέ|καφε|φραπέ|φραπε|frape|espresso|cappuccino|ζάχαρη|ζαχαρη|χυμό|χυμο|γάλα|γαλα|μπύρα|μπυρα|κρασί|κρασι|αναψυκτικό|αναψυκτικο|coca|φαγητό|φαγητο|έφαγα|εφαγα|κοτόπουλο|κοτοπουλο|μπριζόλα|μπριζολα|αυγό|αυγα|αυγά|ομελέτα|ομελετα|σαλάτα|σαλατα|ψάρι|ψαρι|σολομός|σολομος|τυρί|τυρι|φέτα|φετα/i.test(lowerUserMsg);

      // 1. Water Action
      if (!isSugaryDrinkOrFood && /νερό|νερο|water/i.test(lowerUserMsg)) {
        let ml = 250;
        const numMatch = lowerUserMsg.match(/(\d+)\s*(?:ml|λιτρα|λίτρα|l)?/i);
        if (lowerUserMsg.includes('1 λιτρο') || lowerUserMsg.includes('1 λίτρο') || lowerUserMsg.includes('1l')) ml = 1000;
        else if (lowerUserMsg.includes('2 λιτρα') || lowerUserMsg.includes('2 λίτρα') || lowerUserMsg.includes('2l')) ml = 2000;
        else if (lowerUserMsg.includes('μισό λίτρο') || lowerUserMsg.includes('500ml')) ml = 500;
        else if (numMatch && numMatch[1]) ml = parseInt(numMatch[1], 10);

        if (ml > 0) {
          const todayStr = new Date().toISOString().split('T')[0];
          const newWater = Math.min(6000, waterMl + ml);
          await DataService.saveDailyLog({
            id: 'daily-' + todayStr,
            date: todayStr,
            water_ml: newWater,
            fasting_hours: 16,
            exercise_minutes: 20,
            exercise_type: 'recumbent_bike',
            lumbar_feeling: 'good',
            completed_habits: foodLogs,
          });
          cleanMsg += `\n\n💧 Σύνολο νερού: ${newWater}ml / 3000ml`;
          actionExecuted = true;
          onDataChanged();
        }
      }

      // 2. Weight Action
      const weightMatch = lowerUserMsg.match(/(?:ζυγίζομαι|ζυγιζομαι|βάρος|βαρος|κιλά|κιλα|ειμαι|είμαι)\s*(\d{2,3}(?:[\.,]\d)?)\s*(?:kg|κιλα|κιλά)?/i);
      if (weightMatch) {
        const w = parseFloat(weightMatch[1].replace(',', '.'));
        if (w >= 70 && w <= 160) {
          const todayStr = new Date().toISOString().split('T')[0];
          await DataService.addWeightLog({
            date: todayStr,
            weight: w,
            pain_level: 4,
            notes: 'Καταγραφή από AI Coach',
          });
          cleanMsg += `\n\n⚖️ Το νέο βάρος (${w}kg) καταχωρήθηκε!`;
          actionExecuted = true;
          onDataChanged();
        }
      }

      // 3. Food / Beverage Action
      const isEatingOrDrink = /έφαγα|εφαγα|ήπια|ηπια|κατανάλωσα|καταναλωσα|φαγητό|φαγητο|πρωινό|πρωινο|μεσημεριανό|μεσημεριανο|βραδινό|βραδινο|σνακ|γεύμα|γευμα/i.test(lowerUserMsg) || isSugaryDrinkOrFood;
      if (isEatingOrDrink && !actionExecuted) {
        const gramMatch = lowerUserMsg.match(/(\d+)\s*(?:g|gr|γραμμάρια|γραμμαρια)/i);
        const grams = gramMatch ? parseInt(gramMatch[1], 10) : 100;
        const analysis = analyzeFoodDynamically(text);

        const todayStr = new Date().toISOString().split('T')[0];
        const entry: FoodLogEntry = {
          id: 'fl-' + Date.now(),
          foodId: analysis.id || ('food-' + Date.now()),
          name: analysis.name || text.slice(0, 30),
          quantity: grams,
          calories: Math.round(analysis.calories * (grams / 100)),
          protein: Math.round(analysis.protein * (grams / 100) * 10) / 10,
          carbs: Math.round(analysis.carbs * (grams / 100) * 10) / 10,
          fat: Math.round(analysis.fat * (grams / 100) * 10) / 10,
          time: timeStr,
        };

        const updated = [...foodLogs, entry];
        await DataService.saveFoodLogs(todayStr, updated);
        cleanMsg += `\n\n✅ <b>Καταγράφηκε αυτόματα στο Dashboard:</b>\n• ${entry.name} (${entry.quantity}g) - ${entry.calories} kcal, ${entry.carbs}g υδατάνθρακες`;
        onDataChanged();
      }

      // Scrub ANY leaked action tags
      cleanMsg = cleanMsg
        .replace(/\[\s*ACTION:[^\]]*\]?/gi, '')
        .replace(/\[\s*ACTION:[^\n]*\n?/gi, '')
        .trim();

      const aiMsg: AiChatMessage = {
        id: 'msg-ai-' + Date.now(),
        sender: 'ai',
        message: cleanMsg,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      await DataService.saveAiChatMessage({ sender: 'ai', message: cleanMsg });
    } catch (err: any) {
      const errorMsg: AiChatMessage = {
        id: 'msg-err-' + Date.now(),
        sender: 'ai',
        message: 'Σπύρο, υπήρξε ένα στιγμιαίο θέμα επικοινωνίας με το AI. Δοκίμασε ξανά!',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-lg bg-[#0d0d0d] border-l border-neutral-800 h-full flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-black">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white">AI Health Coach (GPT-4o-mini)</h2>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-semibold">
                Live AI
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Σπύρος • 105kg ➔ 90kg • Στένωση Σπονδυλικού Σωλήνα
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-lg font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 border-b border-neutral-800/60 bg-black/50 flex flex-wrap gap-1.5 text-[11px]">
          <button
            onClick={() => handleSendMessage('Πόσο νερό έχω πιει σήμερα και πόσο μου μένει;')}
            className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 transition"
          >
            💧 Νερό σήμερα
          </button>
          <button
            onClick={() => handleSendMessage('Τι επιτρέπεται να φάω τώρα;')}
            className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 transition"
          >
            🍽️ Τι να φάω;
          </button>
          <button
            onClick={() => handleSendMessage('Πονάει η μέση μου, τι ασκήσεις επιτρέπονται;')}
            className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 transition"
          >
            🩺 Συμβουλή μέσης
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl p-3 leading-relaxed whitespace-pre-wrap ${
                  m.sender === 'user'
                    ? 'bg-emerald-950/80 border border-emerald-800/80 text-white'
                    : 'bg-black border border-neutral-800 text-neutral-200 shadow-md'
                }`}
              >
                {m.image_url && (
                  <div className="mb-2 overflow-hidden rounded-lg border border-neutral-700/80 shadow-md">
                    <img
                      src={m.image_url}
                      alt="Φωτογραφία πιάτου"
                      className="max-h-56 w-full object-cover"
                    />
                  </div>
                )}
                <div>{m.message}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-xl p-3 bg-black border border-neutral-800 text-neutral-400 text-xs flex items-center space-x-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Ο AI Coach αναλύει...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-neutral-800 bg-black">
          {/* Hidden Camera Input (Opens camera directly on mobile/device) */}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={cameraInputRef}
            className="hidden"
            onChange={handlePhotoSelected}
          />
          {/* Hidden Gallery / File Picker Input */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handlePhotoSelected}
          />

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-1.5 sm:space-x-2"
          >
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isLoading}
              className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-bold transition flex items-center space-x-1"
              title="Τράβηξε φωτογραφία με την κάμερα"
            >
              <span className="text-sm">📷</span>
              <span className="hidden sm:inline text-[11px]">Κάμερα</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-bold transition flex items-center space-x-1"
              title="Ανέβασε φωτογραφία από τη συλλογή / αρχεία"
            >
              <span className="text-sm">🖼️</span>
              <span className="hidden sm:inline text-[11px]">Συλλογή</span>
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Γράψε π.χ. «έφαγα 200g σολομό»..."
              className="flex-1 bg-[#121212] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition disabled:opacity-40 flex-shrink-0"
            >
              Αποστολή
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
