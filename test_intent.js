import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import { analyzeFoodDynamically, searchSmartFoods } from './src/data/foodClassifier.js';

function detectUserFoodIntent(text) {
  const lower = text.toLowerCase();

  // Check if beverage with sugar / food
  const isSugaryDrinkOrFood = /καφέ|καφε|φραπέ|φραπε|frape|espresso|cappuccino|ζάχαρη|ζαχαρη|χυμό|χυμο|γάλα|γαλα|μπύρα|μπυρα|κρασί|κρασι|αναψυκτικό|αναψυκτικο|coca|φαγητό|φαγητο|έφαγα|εφαγα|κοτόπουλο|κοτοπουλο|μπριζόλα|μπριζολα|αυγό|αυγα|αυγά|ομελέτα|ομελετα|σαλάτα|σαλατα|ψάρι|ψαρι|σολομός|σολομος|τυρί|τυρι|φέτα|φετα/i.test(lower);

  // 1. Water check (Only if pure water is mentioned and NOT a sugary drink)
  if (!isSugaryDrinkOrFood && /νερό|νερο|water/i.test(lower)) {
    let ml = 250;
    const numMatch = lower.match(/(\d+)\s*(?:ml|λιτρα|λίτρα|l)?/i);
    if (lower.includes('1 λιτρο') || lower.includes('1 λίτρο') || lower.includes('1l')) ml = 1000;
    else if (lower.includes('μισό λίτρο') || lower.includes('500ml')) ml = 500;
    else if (numMatch && numMatch[1]) ml = parseInt(numMatch[1], 10);
    return { type: 'water', amount: ml };
  }

  // 2. Weight check
  const weightMatch = lower.match(/(?:ζυγίζομαι|ζυγιζομαι|βάρος|βαρος|κιλά|κιλα|ειμαι|είμαι)\s*(\d{2,3}(?:[\.,]\d)?)\s*(?:kg|κιλα|κιλά)?/i);
  if (weightMatch) {
    const w = parseFloat(weightMatch[1].replace(',', '.'));
    if (w >= 70 && w <= 160) {
      return { type: 'weight', weight: w };
    }
  }

  // 3. Reset check
  if (/σβήσε|σβησε|καθάρισε|καθαρισε|μηδένισε|μηδενισε|διαγραφή|διαγραφη/i.test(lower)) {
    if (/φαγητά|φαγητα|γεύματα|γευματα/i.test(lower)) return { type: 'clear_foods' };
    if (/νερό|νερο/i.test(lower)) return { type: 'reset_water' };
  }

  // 4. Food / Beverage check
  const isEatingOrDrink = /έφαγα|εφαγα|ήπια|ηπια|κατανάλωσα|καταναλωσα|φαγητό|φαγητο|πρωινό|πρωινο|μεσημεριανό|μεσημεριανο|βραδινό|βραδινο|σνακ|γεύμα|γευμα|καφέ|φραπέ|frape|ζάχαρη|κοτόπουλο|αυγά|μπριζόλα|σολομός|ομελέτα/i.test(lower);
  
  if (isEatingOrDrink || isSugaryDrinkOrFood) {
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
      analysis: analysis
    };
  }

  return null;
}

console.log('Test Frape:', detectUserFoodIntent('Ήπια καφέ frape με ζάχαρη ξεχάστηκα'));
console.log('Test Chicken:', detectUserFoodIntent('έφαγα 200g κοτόπουλο με μαρούλι'));
console.log('Test Water:', detectUserFoodIntent('ήπια 500ml νερό'));
