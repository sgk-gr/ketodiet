import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

async function testGreekStreamDecoding() {
  const SUPABASE_URL = 'https://xrmvingehhiymchoggka.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybXZpbmdlaGhpeW1jaG9nZ2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNjkzMTEsImV4cCI6MjA5MDk0NTMxMX0.UDvGORYRXdo1IKTrduIJYJEfgNuli0LSpAC9njm7I9Q';

  const res = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`
    },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: 'Πες μου 3 συμβουλές για τη στένωση σπονδυλικού σωλήνα και 16:8 διαλειμματική νηστεία.' }
      ]
    })
  });

  const rawText = await res.text();
  
  // Robust parsing:
  // Each line in the AI stream is of format: 0:"token"
  let parsedText = '';
  const lines = rawText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('0:')) {
      const jsonStr = trimmed.substring(2);
      try {
        parsedText += JSON.parse(jsonStr);
      } catch {
        // In case of escaping issues, strip outer quotes
        parsedText += jsonStr.replace(/^"|"$/g, '');
      }
    }
  }

  console.log('--- DECODED TEXT ---');
  console.log(parsedText);
}

testGreekStreamDecoding();
