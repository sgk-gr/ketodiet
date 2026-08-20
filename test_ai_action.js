import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import { searchSmartFoods, analyzeFoodDynamically } from './src/data/foodClassifier.js';

const SUPABASE_URL = 'https://xrmvingehhiymchoggka.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybXZpbmdlaGhpeW1jaG9nZ2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNjkzMTEsImV4cCI6MjA5MDk0NTMxMX0.UDvGORYRXdo1IKTrduIJYJEfgNuli0LSpAC9njm7I9Q';

async function askAiAssistant(userMessage, conversationHistory = [], liveContext = {}) {
  const systemPrompt = `Είσαι ο προσωπικός AI Health & Keto Coach του Σπύρου στο Telegram.
Είσαι ένας κορυφαίος, επιστημονικά καταρτισμένος, ευγενικός και υποστηρικτικός σύμβουλος υγείας, διατροφής και προστασίας της μέσης.

[ΠΡΟΦΙΛ ΧΡΗΣΤΗ - ΣΠΥΡΟΣ]:
- Όνομα: Σπύρος
- Τρέχον Βάρος: ${liveContext.currentWeight || 105.0} kg | Αρχικό: 105.0 kg | Στόχος: 90.0 kg (-15 kg λίπος)
- Κατάσταση Μέσης: Στένωση Σπονδυλικού Σωλήνα (Spinal Canal Stenosis).
  * ΑΥΣΤΗΡΟΙ ΚΑΝΟΝΕΣ ΑΣΚΗΣΗΣ: ΑΠΑΓΟΡΕΥΕΤΑΙ το τρέξιμο, τα άλματα, τα ελεύθερα βάρη στη σπονδυλική στήλη και οι κλασικοί κοιλιακοί.
  * ΕΠΙΤΡΕΠΕΤΑΙ & ΣΥΝΙΣΤΑΤΑΙ: Στατικό ποδήλατο με πλάτη (recumbent bike), περπάτημα σε ίσιο έδαφος (15-20 λεπτά), κολύμβηση.
  * ΣΗΜΑΣΙΑ ΝΕΡΟΥ: 3.0 Λίτρα/ημέρα για ενυδάτωση και ελαστικότητα των μεσοσπονδύλιων δίσκων.
- ΔΙΑΤΡΟΦΗ: Low-Carb 16:8 Διαλειμματική Νηστεία (Fasting 20:00 - 12:00 | Παράθυρο Φαγητού 12:00 - 20:00).
  * Στόχος Υδατανθράκων: Κάτω από 20-30g net carbs την ημέρα (μόνο από πράσινα λαχανικά, μηδέν ζάχαρη, μηδέν ψωμί/ζυμαρικά/ρύζι).
  * Αντιφλεγμονώδη: Ωμέγα-3 (σολομός, σαρδέλες), ελαιόλαδο, πράσινα φυλλώδη λαχανικά, σπαράγγια, κουρκουμάς.

[ΣΗΜΕΡΙΝΑ ΔΕΔΟΜΕΝΑ]:
- Ώρα: ${liveContext.currentTime || '08:45'}
- Νερό σήμερα: ${liveContext.waterMl || 0} / 3000 ml
- Φαγητά σήμερα: ${liveContext.foodSummary || 'Κανένα καταγεγραμμένο γεύμα ακόμα'}

[ΟΔΗΓΙΕΣ ΑΠΑΝΤΗΣΗΣ]:
1. Απάντησε πάντα στα Ελληνικά, με φυσικό ανθρώπινο λόγο, ευγένεια και ενθάρρυνση.
2. Αν ο Σπύρος αναφέρει ότι έφαγε κάτι, αναγνώρισε το φαγητό, υπολόγισε τα macros (θερμίδες, πρωτεΐνη, υδατάνθρακες, λιπαρά), εξήγησε αν βοηθάει στην κέτωση και στη μέση.
3. Αν ο Σπύρος αναφέρει ότι ήπιε νερό (π.χ. «ήπια 500ml», «ήπια 1 ποτήρι»), επιβράβευσέ τον και ανάφερε πόσο βοηθάει τους δίσκους της μέσης του.
4. Αν ο Σπύρος ρωτήσει αν επιτρέπεται κάποιο φαγητό, δώσε άμεση, ξεκάθαρη απάντηση (Επιτρέπεται / Με μέτρο / Απαγορεύεται) και εξήγησε το γιατί.
5. Αν θέλεις να εκτελέσεις καταγραφή στη βάση δεδομένων, πρόσθεσε στο τέλος της απάντησής σου τα αντίστοιχα action tags:
   - Για νερό: [ACTION:ADD_WATER:γραμμάρια_ή_ml] π.χ. [ACTION:ADD_WATER:500]
   - Για φαγητό: [ACTION:LOG_FOOD:{"name":"Όνομα","grams":150,"calories":250,"protein":30,"carbs":2,"fat":12}]
   - Για βάρος: [ACTION:LOG_WEIGHT:103.5]`;

  const messages = [
    { role: 'user', content: systemPrompt },
    { role: 'assistant', content: 'Έλαβα όλες τις οδηγίες. Είμαι έτοιμος να υποστηρίξω τον Σπύρο ως ο κορυφαίος AI Coach του!' },
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  const res = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`
    },
    body: JSON.stringify({ messages })
  });

  const text = await res.text();
  const lines = text.split('\n');
  let fullText = '';
  for (const line of lines) {
    if (line.startsWith('0:')) {
      try {
        fullText += JSON.parse(line.substring(2));
      } catch {
        fullText += line.substring(2).replace(/^"|"$/g, '');
      }
    }
  }
  return fullText || text;
}

async function runTest() {
  console.log('Testing AI with User Query: "Έφαγα 250g σολομό με ψητά σπαράγγια και ήπια 500ml νερό"');
  const response = await askAiAssistant('Έφαγα 250g σολομό με ψητά σπαράγγια και ήπια 500ml νερό', [], {
    currentWeight: 105.0,
    waterMl: 1000,
    foodSummary: 'Ομελέτα 3 αυγά (12:30)'
  });
  console.log('\n--- AI RESPONSE ---');
  console.log(response);
}

runTest();
