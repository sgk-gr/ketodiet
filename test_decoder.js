import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

async function testRegexDecoder() {
  const res = await fetch('https://xrmvingehhiymchoggka.supabase.co/functions/v1/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybXZpbmdlaGhpeW1jaG9nZ2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNjkzMTEsImV4cCI6MjA5MDk0NTMxMX0.UDvGORYRXdo1IKTrduIJYJEfgNuli0LSpAC9njm7I9Q'
    },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: 'Ήπια καφέ φραπέ με ζάχαρη ξεχάστηκα. Τι να κάνω τώρα;' }
      ]
    })
  });

  const rawText = await res.text();
  console.log('RAW STREAM LENGTH:', rawText.length);

  let fullText = '';
  const tokenRegex = /0:"((?:[^"\\]|\\.)*)"/g;
  let match;
  while ((match = tokenRegex.exec(rawText)) !== null) {
    try {
      fullText += JSON.parse(`"${match[1]}"`);
    } catch {
      fullText += match[1];
    }
  }

  console.log('--- CLEAN PARSED RESULT ---');
  console.log(fullText);
}

testRegexDecoder();
