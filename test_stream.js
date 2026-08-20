import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

async function testProperStreamDecoding() {
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
        { role: 'user', content: 'Γράψε μου 2 παραγράφους στα Ελληνικά για τα οφέλη του σολομού και του νερού.' }
      ]
    })
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let rawAccumulator = '';
  let fullOutput = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    rawAccumulator += decoder.decode(value, { stream: true });

    let lines = rawAccumulator.split('\n');
    rawAccumulator = lines.pop(); // keep incomplete line in buffer

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('0:')) {
        const jsonPart = trimmed.substring(2);
        try {
          fullOutput += JSON.parse(jsonPart);
        } catch {
          // If unparseable directly, clean JSON quotes
          if (jsonPart.startsWith('"') && jsonPart.endsWith('"')) {
            fullOutput += jsonPart.slice(1, -1);
          } else {
            fullOutput += jsonPart;
          }
        }
      }
    }
  }

  // Flush remaining buffer
  if (rawAccumulator.trim().startsWith('0:')) {
    try {
      fullOutput += JSON.parse(rawAccumulator.trim().substring(2));
    } catch {}
  }

  console.log('--- PERFECT GREEK DECODED OUTPUT ---');
  console.log(fullOutput);
}

testProperStreamDecoding();
