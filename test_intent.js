import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import { analyzeFoodDynamically, searchSmartFoods } from './src/data/foodClassifier.js';

function isWordMatch(text, words) {
  const normalized = text.toLowerCase().replace(/[.,!?;:]/g, ' ');
  const tokenList = normalized.split(/\s+/).filter(Boolean);
  return words.some(w => tokenList.includes(w.toLowerCase()));
}

function parseUserIntent(text) {
  const lower = text.toLowerCase().trim();

  // 1. Water Detection (Water, glass, bottle, ml, etc.)
  const isWaterDrink = /νερό|νερο|water|ποτήρι|ποτηρι|ποτυρι|μπουκάλι|μπουκαλι/i.test(lower);
  const hasSugarOrFood = isWordMatch(lower, [
    'καφές', 'καφες', 'καφέ', 'καφε', 'φραπέ', 'φραπε', 'frape', 'espresso', 'cappuccino',
    'ζάχαρη', 'ζαχαρη', 'χυμός', 'χυμος', 'χυμό', 'χυμο', 'γάλα', 'γαλα', 'μπύρα', 'μπυρα',
    'κρασί', 'κρασι', 'αναψυκτικό', 'αναψυκτικο', 'coca', 'κόκα', 'κολα', 'κόλα', 'τυρί', 'τυρι',
    'φέτα', 'φετα', 'κοτόπουλο', 'κοτοπουλο', 'κρέας', 'κρεας', 'μπριζόλα', 'μπριζολα', 'αυγό',
    'αυγο', 'αυγά', 'αυγα', 'ομελέτα', 'ομελετα', 'σολομός', 'σολομος', 'ψάρι', 'ψαρι', 'σαλάτα', 'σαλατα'
  ]);

  if (isWaterDrink && !hasSugarOrFood) {
    let ml = 250;
    const numMatch = lower.match(/(\d+)\s*(?:ml|λιτρα|λίτρα|l|ποτηρια|ποτήρια)?/i);
    if (lower.includes('1 λιτρο') || lower.includes('1 λίτρο') || lower.includes('1l')) ml = 1000;
    else if (lower.includes('2 λιτρα') || lower.includes('2 λίτρα') || lower.includes('2l')) ml = 2000;
    else if (lower.includes('μισό λίτρο') || lower.includes('500ml')) ml = 500;
    else if (lower.includes('2 ποτηρια') || lower.includes('2 ποτήρια') || lower.includes('δυο ποτηρια')) ml = 500;
    else if (numMatch && numMatch[1]) ml = parseInt(numMatch[1], 10);
    return { type: 'water', amount: ml };
  }

  // 2. Weight Detection
  const weightMatch = lower.match(/(?:ζυγίζομαι|ζυγιζομαι|βάρος|βαρος|κιλά|κιλα|ειμαι|είμαι)\s*(\d{2,3}(?:[\.,]\d)?)\s*(?:kg|κιλα|κιλά)?/i);
  if (weightMatch) {
    const w = parseFloat(weightMatch[1].replace(',', '.'));
    if (w >= 70 && w <= 160) {
      return { type: 'weight', weight: w };
    }
  }

  // 3. Reset Detection
  if (/σβήσε|σβησε|καθάρισε|καθαρισε|μηδένισε|μηδενισε|διαγραφή/i.test(lower)) {
    if (/φαγητά|φαγητα|γεύματα|γευματα/i.test(lower)) return { type: 'clear_foods' };
    if (/νερό|νερο/i.test(lower)) return { type: 'reset_water' };
  }

  // 4. Food Detection
  const isEatingOrFood = hasSugarOrFood || /έφαγα|εφαγα|ήπια|ηπια|κατανάλωσα|καταναλωσα|φαγητό|φαγητο|πρωινό|πρωινο|μεσημεριανό|μεσημεριανο|βραδινό|βραδινο|σνακ|γεύμα|γευμα/i.test(lower);
  if (isEatingOrFood) {
    const gramMatch = lower.match(/(\d+)\s*(?:g|gr|γραμμάρια|γραμμαρια)/i);
    const grams = gramMatch ? parseInt(gramMatch[1], 10) : 100;
    const analysis = analyzeFoodDynamically(text);

    return {
      type: 'food',
      name: analysis.name || text.slice(0, 30),
      grams: grams,
      calories: Math.round(analysis.calories * (grams / 100)),
      protein: Math.round(analysis.protein * (grams / 100) * 10) / 10,
      carbs: Math.round(analysis.carbs * (grams / 100) * 10) / 10,
      fat: Math.round(analysis.fat * (grams / 100) * 10) / 10,
      analysis
    };
  }

  return null;
}

console.log('1. "βαλε και ενα ποτυρι νερο" ->', parseUserIntent('βαλε και ενα ποτυρι νερο'));
console.log('2. "ήπια 500ml νερο" ->', parseUserIntent('ήπια 500ml νερο'));
console.log('3. "ηπια καφε με ζαχαρη και γαλα" ->', parseUserIntent('ηπια καφε με ζαχαρη και γαλα'));
console.log('4. "έφαγα 150g φέτα τυρί" ->', parseUserIntent('έφαγα 150g φέτα τυρί'));
