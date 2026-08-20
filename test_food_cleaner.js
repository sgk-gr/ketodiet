import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

export function extractCleanFoodName(text) {
  const actionStopwords = new Set([
    'ηπια', 'ήπια', 'εφαγα', 'έφαγα', 'φαγαμε', 'φάγαμε', 'καταναλωσα', 'κατανάλωσα',
    'καταλαθος', 'κατά', 'λάθος', 'λαθος', 'κατεγραψε', 'κατέγραψε', 'κατεγραψέ', 'κατέγραψέ',
    'καταγραφη', 'καταγραφή', 'σημειωσε', 'σημείωσε',
    'βαλε', 'βάλε', 'προσθεσε', 'πρόσθεσε', 'γραψε', 'γράψε',
    'θελω', 'θέλω', 'να', 'βαλεις', 'βάλεις', 'βαλτο', 'βάλτο', 'προσθεσεις', 'προσθέσεις',
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

  // Capitalize first letter
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

console.log('1.', extractCleanFoodName('Ηπια καταλαθος καφε με ζαχαρη και γαλα κατεγραψε το'));
console.log('2.', extractCleanFoodName('εφαγα 200g κοτοπουλο με σαλατα μολις τωρα'));
console.log('3.', extractCleanFoodName('ηπια φραπε με ζαχαρη ξεχαστηκα'));
console.log('4.', extractCleanFoodName('εφαγα πατατακια'));
