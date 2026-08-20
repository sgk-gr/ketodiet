import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

async function testInjectedPersona() {
  const systemContext = `[ΠΛΗΡΟΦΟΡΙΕΣ ΧΡΗΣΤΗ ΚΑΙ ΡΟΛΟΣ AI]:
Ονομάζεσαι AI Health & Keto Coach του Σπύρου.
Σπύρος: Βάρος 105kg -> Στόχος 90kg (-15kg).
Δίαιτα: Low-Carb 16:8 (Νηστεία 20:00-12:00, Φαγητό 12:00-20:00).
Στόχος νερού: 3.0L / ημέρα.
Υγεία: Στένωση Σπονδυλικού Σωλήνα (Απαγορεύεται τρέξιμο, κραδασμοί, βάρη στη μέση. Επιτρέπεται μόνο στατικό ποδήλατο με πλάτη, περπάτημα σε ίσιωμα 15-20λ, κολύμβηση).
Μίλα του στα Ελληνικά, φιλικά, επιστημονικά, υποστηρικτικά σαν προσωπικός του σύμβουλος.`;

  const res = await fetch('https://xrmvingehhiymchoggka.supabase.co/functions/v1/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybXZpbmdlaGhpeW1jaG9nZ2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNjkzMTEsImV4cCI6MjA5MDk0NTMxMX0.UDvGORYRXdo1IKTrduIJYJEfgNuli0LSpAC9njm7I9Q'
    },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: systemContext },
        { role: 'assistant', content: 'Έλαβα όλες τις οδηγίες. Είμαι ο προσωπικός σου AI Health & Keto Coach, Σπύρο!' },
        { role: 'user', content: 'Πες μου τι άσκηση επιτρέπεται να κάνω σήμερα για τη μέση μου;' }
      ]
    })
  });
  const text = await res.text();

  const lines = text.split('\n');
  let fullText = '';
  for (const line of lines) {
    if (line.startsWith('0:')) {
      try {
        fullText += JSON.parse(line.substring(2));
      } catch (e) {
        fullText += line.substring(2).replace(/^"|"$/g, '');
      }
    }
  }

  console.log('AI Cleaned Response:\n', fullText || text);
}

testInjectedPersona();
