import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

async function testNonStream() {
  const payloads = [
    { stream: false, messages: [{ role: 'user', content: 'Γράψε μου τη λέξη: Κρέμα, Εναλλακτικά, Γεύση, Φραπέ.' }] },
    { streaming: false, messages: [{ role: 'user', content: 'Γράψε μου τη λέξη: Κρέμα, Εναλλακτικά, Γεύση, Φραπέ.' }] }
  ];

  for (let i = 0; i < payloads.length; i++) {
    const res = await fetch('https://xrmvingehhiymchoggka.supabase.co/functions/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybXZpbmdlaGhpeW1jaG9nZ2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNjkzMTEsImV4cCI6MjA5MDk0NTMxMX0.UDvGORYRXdo1IKTrduIJYJEfgNuli0LSpAC9njm7I9Q'
      },
      body: JSON.stringify(payloads[i])
    });

    const text = await res.text();
    console.log(`Payload ${i} Content-Type:`, res.headers.get('content-type'));
    console.log(`Payload ${i} Raw Text (first 200):\n`, text.substring(0, 200));
  }
}

testNonStream();
