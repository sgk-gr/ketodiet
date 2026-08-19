// Shared Food Intelligence Module for both Node.js (bot.js) and Vite React Frontend

export const SMART_FOOD_DB = [
  // 1. ΠΡΩΤΕΙΝΕΣ & ΚΡΕΑΤΑ
  { id: 'f1', name: 'Κοτόπουλο (στήθος φιλέτο)', category: 'Πρωτεΐνες', status: 'allowed', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, note: 'Κορυφαία άπαχη πρωτεΐνη για μυϊκή προστασία χωρίς επιβάρυνση.' },
  { id: 'f2', name: 'Κοτόπουλο (μπούτι)', category: 'Πρωτεΐνες', status: 'allowed', calories: 180, protein: 26, carbs: 0, fat: 8, fiber: 0, note: 'Ζουμερή πρωτεΐνη, καλά λιπαρά. Ψητό.' },
  { id: 'f3', name: 'Γαλοπούλα (φιλέτο στήθος)', category: 'Πρωτεΐνες', status: 'allowed', calories: 135, protein: 30, carbs: 0, fat: 1, fiber: 0, note: 'Εξαιρετικά άπαχη πρωτεΐνη, 0g υδατάνθρακες.' },
  { id: 'f4', name: 'Μοσχάρι (άπαχο)', category: 'Πρωτεΐνες', status: 'allowed', calories: 210, protein: 28, carbs: 0, fat: 10, fiber: 0, note: 'Πλούσιο σε σίδηρο, ψευδάργυρο και Β12. Ψητό ή κατσαρόλας.' },
  { id: 'f5', name: 'Μοσχαρίσιος κιμάς', category: 'Πρωτεΐνες', status: 'allowed', calories: 225, protein: 26, carbs: 0, fat: 13, fiber: 0, note: 'Ιδανικό για μπιφτέκια χωρίς ψωμί (με αυγό & κολοκυθάκι).' },
  { id: 'f6', name: 'Χοιρινό (ψαρονέφρι)', category: 'Πρωτεΐνες', status: 'allowed', calories: 143, protein: 26, carbs: 0, fat: 3.5, fiber: 0, note: 'Το πιο άπαχο κομμάτι χοιρινού. Εξαιρετική επιλογή.' },
  { id: 'f7', name: 'Χοιρινή μπριζόλα', category: 'Πρωτεΐνες', status: 'allowed', calories: 245, protein: 25, carbs: 0, fat: 16, fiber: 0, note: 'Ψητή. Αφαίρεσε το περιττό εξωτερικό λίπος.' },
  { id: 'f8', name: 'Αρνί (μπούτι/παϊδάκια)', category: 'Πρωτεΐνες', status: 'limited', calories: 282, protein: 25, carbs: 0, fat: 20, fiber: 0, note: '0g υδατάνθρακες αλλά βαρύ σε λίπος.', weeklyLimit: '1-2 φορές / εβδομάδα' },
  { id: 'f9', name: 'Κατσίκι (άπαχο)', category: 'Πρωτεΐνες', status: 'allowed', calories: 143, protein: 27, carbs: 0, fat: 3, fiber: 0, note: 'Πιο άπαχο από το αρνί, υψηλή βιολογική αξία.' },
  { id: 'f10', name: 'Αυγό ολόκληρο', category: 'Πρωτεΐνες', status: 'allowed', calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, note: 'Τέλεια αναλογία αμινοξέων, χολίνη για τον εγκέφαλο. 2-3 αυγά/μέρα OK.' },
  { id: 'f11', name: 'Μπέικον', category: 'Πρωτεΐνες', status: 'limited', calories: 450, protein: 30, carbs: 1, fat: 38, fiber: 0, note: 'Επεξεργασμένο κρέας με νάτριο. 2 φέτες περιστασιακά.', weeklyLimit: '1-2 φορές / εβδομάδα' },
  { id: 'f12', name: 'Λουκάνικο χωριάτικο', category: 'Πρωτεΐνες', status: 'limited', calories: 340, protein: 15, carbs: 2, fat: 30, fiber: 0, note: 'Πλούσιο σε λίπος & αλάτι. Με μέτρο.', weeklyLimit: '1 φορά / εβδομάδα' },

  // 2. ΨΑΡΙΑ & ΘΑΛΑΣΣΙΝΑ
  { id: 's1', name: 'Σολομός (ψητός)', category: 'Ψάρια', status: 'allowed', calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, note: 'Κορυφαίο αντιφλεγμονώδες Ωμέγα-3. Προστατεύει τις αρθρώσεις και τη μέση.' },
  { id: 's2', name: 'Σαρδέλες ψητές', category: 'Ψάρια', status: 'allowed', calories: 208, protein: 25, carbs: 0, fat: 11, fiber: 0, note: 'Ωμέγα-3, ασβέστιο (με τα κόκαλα), βιταμίνη D για τα οστά.' },
  { id: 's3', name: 'Τσιπούρα ψητή', category: 'Ψάρια', status: 'allowed', calories: 115, protein: 21, carbs: 0, fat: 3.5, fiber: 0, note: 'Εξαιρετικό μεσογειακό ψάρι, ελαφρύ και θρεπτικό.' },
  { id: 's4', name: 'Λαβράκι ψητό', category: 'Ψάρια', status: 'allowed', calories: 124, protein: 23, carbs: 0, fat: 3, fiber: 0, note: 'Άπαχη, ποιοτική πρωτεΐνη.' },
  { id: 's5', name: 'Μπακαλιάρος (βραστός/ψητός)', category: 'Ψάρια', status: 'allowed', calories: 82, protein: 18, carbs: 0, fat: 0.7, fiber: 0, note: 'Πολύ άπαχο ψάρι. Όχι τηγανητός με σκορδαλιά!' },
  { id: 's6', name: 'Τόνος (κονσέρβα/φρέσκος)', category: 'Ψάρια', status: 'allowed', calories: 116, protein: 26, carbs: 0, fat: 1, fiber: 0, note: 'Βολική πηγή πρωτεΐνης για σαλάτες. Έως 3 κονσέρβες/εβδομάδα.' },
  { id: 's7', name: 'Γαρίδες (ψητές/βραστές)', category: 'Θαλασσινά', status: 'allowed', calories: 99, protein: 24, carbs: 0.2, fat: 0.3, fiber: 0, note: 'Μηδενικό λίπος, υψηλή πρωτεΐνη, ιώδιο.' },
  { id: 's8', name: 'Καλαμάρι (ψητό)', category: 'Θαλασσινά', status: 'allowed', calories: 92, protein: 16, carbs: 3, fat: 1.4, fiber: 0, note: 'Ψητό με λαδολέμονο. Τηγανητό απαγορεύεται.' },
  { id: 's9', name: 'Χταπόδι (ψητό/ξιδάτο)', category: 'Θαλασσινά', status: 'allowed', calories: 82, protein: 15, carbs: 2.2, fat: 1, fiber: 0, note: 'Κλασικός μεζές, ελάχιστες θερμίδες, καθαρή πρωτεΐνη.' },

  // 3. ΛΑΧΑΝΙΚΑ
  { id: 'v1', name: 'Μπρόκολο', category: 'Λαχανικά', status: 'allowed', calories: 34, protein: 2.8, carbs: 4.4, fat: 0.4, fiber: 2.6, note: 'Σουλφοραφάνη: κορυφαίο φυσικό αντιφλεγμονώδες για τη σπονδυλική στήλη.' },
  { id: 'v2', name: 'Κουνουπίδι', category: 'Λαχανικά', status: 'allowed', calories: 25, protein: 1.9, carbs: 3, fat: 0.3, fiber: 2, note: 'Ιδανικό υποκατάστατο ρυζιού και πουρέ πατάτας.' },
  { id: 'v3', name: 'Σπανάκι', category: 'Λαχανικά', status: 'allowed', calories: 23, protein: 2.9, carbs: 1.4, fat: 0.4, fiber: 2.2, note: 'Μαγνήσιο και κάλιο: απαραίτητο για αποφυγή κραμπών σε keto.' },
  { id: 'v4', name: 'Μαρούλι / Ρόκα / Λάχανο', category: 'Λαχανικά', status: 'allowed', calories: 18, protein: 1.5, carbs: 2, fat: 0.2, fiber: 1.5, note: 'Ελεύθερη κατανάλωση. Βάση για κάθε γεύμα.' },
  { id: 'v5', name: 'Κολοκυθάκια', category: 'Λαχανικά', status: 'allowed', calories: 17, protein: 1.2, carbs: 2.1, fat: 0.3, fiber: 1, note: 'Zucchini noodles (zoodles) αντί για μακαρόνια.' },
  { id: 'v6', name: 'Μανιτάρια', category: 'Λαχανικά', status: 'allowed', calories: 22, protein: 3.1, carbs: 2.3, fat: 0.3, fiber: 1, note: 'Βιταμίνη D, μηδέν σάκχαρα. Ψητά με σκόρδο.' },
  { id: 'v7', name: 'Αγγούρι', category: 'Λαχανικά', status: 'allowed', calories: 15, protein: 0.7, carbs: 3.1, fat: 0.1, fiber: 0.5, note: '96% νερό. Ενυδατώνει τους μεσοσπονδύλιους δίσκους.' },
  { id: 'v8', name: 'Βραστά χόρτα (βλίτα/ραδίκια)', category: 'Λαχανικά', status: 'allowed', calories: 28, protein: 2, carbs: 1, fat: 0.5, fiber: 3, note: 'Ελληνική υπερτροφή. Με έξτρα παρθένο ελαιόλαδο και λεμόνι.' },
  { id: 'v9', name: 'Ντομάτα', category: 'Λαχανικά', status: 'limited', calories: 18, protein: 0.9, carbs: 2.7, fat: 0.2, fiber: 1.2, note: 'Λυκοπένιο. Προσοχή στην ποσότητα (φυσικά σάκχαρα).', weeklyLimit: '1 μέτρια ντομάτα / ημέρα σε σαλάτα' },
  { id: 'v10', name: 'Κρεμμύδι / Καρότο / Παντζάρι', category: 'Λαχανικά', status: 'limited', calories: 40, protein: 1.2, carbs: 7.5, fat: 0.2, fiber: 2.5, note: 'Περιέχουν σάκχαρα (~7-8g). Μικρή ποσότητα σε σαλάτα.', weeklyLimit: 'Λίγο στο μαγείρεμα' },
  { id: 'v11', name: 'Πατάτα (βραστή/ψητή/τηγανητή)', category: 'Λαχανικά', status: 'forbidden', calories: 85, protein: 2, carbs: 18, fat: 0.1, fiber: 2.2, note: 'Υψηλότατος γλυκαιμικός δείκτης. Σταματάει άμεσα το κάψιμο λίπους.' },
  { id: 'v12', name: 'Καλαμπόκι / Αρακάς', category: 'Λαχανικά', status: 'forbidden', calories: 86, protein: 3.3, carbs: 19, fat: 1.2, fiber: 2.7, note: 'Καθαρό άμυλο. Ανεβάζει απότομα το σάκχαρο και την ινσουλίνη.' },

  // 4. ΦΡΟΥΤΑ
  { id: 'fr1', name: 'Αβοκάντο', category: 'Φρούτα', status: 'allowed', calories: 160, protein: 2, carbs: 2, fat: 15, fiber: 7, note: 'Ο βασιλιάς των φρούτων στο keto. Μονοακόρεστα λιπαρά και κάλιο.' },
  { id: 'fr2', name: 'Λεμόνι', category: 'Φρούτα', status: 'allowed', calories: 29, protein: 1.1, carbs: 6, fat: 0.3, fiber: 2.8, note: 'Αλκαλοποιεί τον οργανισμό, βιταμίνη C. Χρησιμοποίησε ελεύθερα.' },
  { id: 'fr3', name: 'Φράουλες / Μούρα', category: 'Φρούτα', status: 'limited', calories: 35, protein: 0.8, carbs: 6, fat: 0.3, fiber: 2.5, note: 'Τα μόνα φρούτα που ταιριάζουν σε keto.', weeklyLimit: '100g, 2-3 φορές / εβδομάδα' },
  { id: 'fr4', name: 'Μήλο / Πορτοκάλι', category: 'Φρούτα', status: 'limited', calories: 50, protein: 0.5, carbs: 12, fat: 0.2, fiber: 2.4, note: 'Φρουκτόζη. 1 φρούτο περιστασιακά.', weeklyLimit: '1-2 φορές / εβδομάδα' },
  { id: 'fr5', name: 'Μπανάνα / Σταφύλια / Σύκα', category: 'Φρούτα', status: 'forbidden', calories: 85, protein: 1, carbs: 20, fat: 0.2, fiber: 1.5, note: 'Πάρα πολλά σάκχαρα (20g+). Μπλοκάρουν την κέτωση.' },

  // 5. ΓΑΛΑΚΤΟΚΟΜΙΚΑ & ΤΥΡΙΑ
  { id: 'd1', name: 'Γιαούρτι στραγγιστό 2%', category: 'Γαλακτοκομικά', status: 'allowed', calories: 73, protein: 10, carbs: 3.6, fat: 2, fiber: 0, note: 'Ιδανικό σνακ πρωτεΐνης 16:00. Προβιοτικά για το έντερο.' },
  { id: 'd2', name: 'Φέτα ΠΟΠ', category: 'Τυριά', status: 'allowed', calories: 264, protein: 14, carbs: 1.5, fat: 21, fiber: 0, note: 'Ασβέστιο και πρωτεΐνη. 40-50g στη σαλάτα.' },
  { id: 'd3', name: 'Γραβιέρα / Κασέρι / Παρμεζάνα', category: 'Τυριά', status: 'allowed', calories: 380, protein: 28, carbs: 1, fat: 30, fiber: 0, note: 'Σκληρά τυριά = ελάχιστη λακτόζη, πλούσια σε ασβέστιο.' },
  { id: 'd4', name: 'Cottage Cheese / Ανθότυρο', category: 'Τυριά', status: 'allowed', calories: 98, protein: 12, carbs: 3.4, fat: 4, fiber: 0, note: 'Πολύ πρωτεΐνη, χαμηλές θερμίδες. Τέλειο σνακ.' },
  { id: 'd5', name: 'Γάλα αμυγδάλου (χωρίς ζάχαρη)', category: 'Γαλακτοκομικά', status: 'allowed', calories: 15, protein: 0.6, carbs: 0.3, fat: 1.2, fiber: 0.2, note: 'Το καλύτερο υποκατάστατο γάλακτος για καφέ.' },
  { id: 'd6', name: 'Γάλα αγελαδινό', category: 'Γαλακτοκομικά', status: 'limited', calories: 50, protein: 3.3, carbs: 4.8, fat: 2, fiber: 0, note: 'Περιέχει λακτόζη (σάκχαρο). Μόνο λίγο στον καφέ.', weeklyLimit: 'Μικρή ποσότητα στον καφέ' },

  // 6. ΛΙΠΑΡΑ & ΞΗΡΟΙ ΚΑΡΠΟΙ
  { id: 'n1', name: 'Έξτρα Παρθένο Ελαιόλαδο', category: 'Λιπαρά', status: 'allowed', calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, note: 'Κορυφαίο αντιφλεγμονώδες λίπος (ολεοκανθάλη). 2-3 κ.σ./ημέρα.' },
  { id: 'n2', name: 'Αμύγδαλα ωμά / Καρύδια', category: 'Ξηροί καρποί', status: 'allowed', calories: 600, protein: 18, carbs: 9, fat: 55, fiber: 10, note: 'Μαγνήσιο και Ω3 λιπαρά. 1 χούφτα (30g) την ημέρα.' },
  { id: 'n3', name: 'Ελιές', category: 'Λιπαρά', status: 'allowed', calories: 115, protein: 0.8, carbs: 3, fat: 11, fiber: 3.2, note: 'Καλά λιπαρά, μηδέν καθαροί υδατάνθρακες. 6-8 ελιές/ημέρα.' },
  { id: 'n4', name: 'Ταχίνι / Φυστικοβούτυρο (χωρίς ζάχαρη)', category: 'Λιπαρά', status: 'allowed', calories: 590, protein: 20, carbs: 13, fat: 52, fiber: 8, note: '100% αγνό. 1 κουταλιά στο γιαούρτι.' },

  // 7. ΑΠΑΓΟΡΕΥΜΕΝΑ ΑΜΥΛΑ, ΨΩΜΙΑ, ΖΥΜΑΡΙΚΑ & ΓΛΥΚΑ
  { id: 'st1', name: 'Ψωμί (λευκό/ολικής/πίτα)', category: 'Αμυλούχα', status: 'forbidden', calories: 265, protein: 9, carbs: 50, fat: 3.2, fiber: 2.7, note: '50g καθαρός υδατάνθρακας. Μπλοκάρει άμεσα την απώλεια λίπους.' },
  { id: 'st2', name: 'Μακαρόνια / Ρύζι (βρασμένα)', category: 'Αμυλούχα', status: 'forbidden', calories: 135, protein: 4, carbs: 28, fat: 0.5, fiber: 1, note: '28g υδατάνθρακες ανά 100g. Μετατρέπονται αμέσως σε γλυκόζη.' },
  { id: 'st3', name: 'Σουβλάκι με πίτα και απ\' όλα', category: 'Έτοιμα Φαγητά', status: 'forbidden', calories: 750, protein: 28, carbs: 68, fat: 42, fiber: 4, note: 'Πίτα + τηγανητές πατάτες + σως = 68g υδατάνθρακες!' },
  { id: 'st4', name: 'Μουσακάς / Παστίτσιο', category: 'Έτοιμα Φαγητά', status: 'forbidden', calories: 600, protein: 20, carbs: 48, fat: 36, fiber: 3, note: 'Πατάτες, μακαρόνια και μπεσαμέλ = υψηλοί υδατάνθρακες.' },
  { id: 'st5', name: 'Τυρόπιτα / Σπανακόπιτα', category: 'Έτοιμα Φαγητά', status: 'forbidden', calories: 420, protein: 9, carbs: 38, fat: 26, fiber: 1.5, note: 'Φύλλο με αλεύρι & κακά λιπαρά. Φλεγμονώδες για τη μέση.' },
  { id: 'st6', name: 'Σοκολάτα γάλακτος / Γλυκά / Παγωτά', category: 'Γλυκά', status: 'forbidden', calories: 500, protein: 6, carbs: 60, fat: 28, fiber: 2, note: 'Καθαρή ζάχαρη. Προκαλεί φλεγμονή και μπλοκάρει το λίπος.' },
  { id: 'st7', name: 'Μπύρα / Αναψυκτικά με ζάχαρη', category: 'Ποτά', status: 'forbidden', calories: 43, protein: 0.5, carbs: 8, fat: 0, fiber: 0, note: 'Υγρός υδατάνθρακας και ζάχαρη.' },

  // 8. ΕΤΟΙΜΑ KETO ΦΑΓΗΤΑ & ΠΟΤΑ
  { id: 'm1', name: 'Σουβλάκι καλαμάκι (κοτόπουλο/χοιρινό)', category: 'Έτοιμα Φαγητά', status: 'allowed', calories: 145, protein: 20, carbs: 0.5, fat: 7, fiber: 0, note: 'Κορυφαία επιλογή έξω! Καθαρό κρέας χωρίς υδατάνθρακες.' },
  { id: 'm2', name: 'Γύρος (μερίδα σκέτο κρέας)', category: 'Έτοιμα Φαγητά', status: 'allowed', calories: 235, protein: 22, carbs: 2, fat: 15, fiber: 0, note: 'Με σαλάτα και τζατζίκι. Χωρίς πίτα και πατάτες!' },
  { id: 'm3', name: 'Χωριάτικη σαλάτα', category: 'Έτοιμα Φαγητά', status: 'allowed', calories: 320, protein: 8, carbs: 7, fat: 28, fiber: 3, note: 'Ντομάτα, αγγούρι, πιπεριά, ελιές, φέτα, ελαιόλαδο. 100% Keto!' },
  { id: 'm4', name: 'Σκέτος καφές / Πράσινο τσάι / Σόδα / Zero', category: 'Ποτά', status: 'allowed', calories: 1, protein: 0, carbs: 0, fat: 0, fiber: 0, note: 'Μηδέν ζάχαρη, μηδέν υδατάνθρακες.' },
  { id: 'm5', name: 'Κρασί ξηρό / Τσίπουρο (χωρίς γλυκάνισο)', category: 'Αλκοόλ', status: 'limited', calories: 120, protein: 0.1, carbs: 2, fat: 0, fiber: 0, note: 'Χαμηλά σάκχαρα. 1 ποτήρι με μέτρο.', weeklyLimit: '1-2 ποτά / εβδομάδα' },
];

export function normalizeGreek(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function analyzeFoodDynamically(rawQuery) {
  const q = normalizeGreek(rawQuery);

  let category = 'Γενικά';
  let status = 'allowed';
  let calories = 150;
  let protein = 15;
  let carbs = 5;
  let fat = 8;
  let fiber = 1;
  let note = `Ανάλυση για «${rawQuery}»: Ελέγξτε τις ποσότητες για διατήρηση της κέτωσης.`;
  let weeklyLimit = undefined;

  // 1. FORBIDDEN PATTERNS
  if (
    q.includes('ψωμ') || q.includes('πιτα') || q.includes('πιτες') || q.includes('πιτακι') ||
    q.includes('μακαρον') || q.includes('σπαγγετ') || q.includes('πενν') || q.includes('λαζαν') ||
    q.includes('ρυζ') || q.includes('πιλαφ') || q.includes('ριζοτ') ||
    q.includes('πατατ') || q.includes('πουρε') || q.includes('chips') || q.includes('τσιπς') ||
    q.includes('καλαμποκ') || q.includes('ποπ κορν') || q.includes('αρακ') ||
    q.includes('ζαχαρ') || q.includes('γλυκ') || q.includes('σοκολατ') || q.includes('κεικ') ||
    q.includes('μπισκοτ') || q.includes('παγωτ') || q.includes('κρουασαν') || q.includes('τσουρεκ') ||
    q.includes('μελ') || q.includes('μαρμελαδ') || q.includes('σιροπ') || q.includes('νουτελ') || q.includes('μερεντ') ||
    q.includes('μπακλαβ') || q.includes('γαλακτομπουρ') || q.includes('κανταιφ') ||
    q.includes('μπυρ') || q.includes('μπιρ') || q.includes('αναψυκτικ') || q.includes('χυμο') ||
    q.includes('μουσακ') || q.includes('παστιτσ') || q.includes('γεμιστ') ||
    q.includes('σφολιατ') || q.includes('τυροπιτ') || q.includes('σπανακοπιτ') || q.includes('πιτσ') ||
    q.includes('τηγαν') || q.includes('πανε') || q.includes('κουλουρ') || q.includes('τορτιγ') ||
    q.includes('βρωμ') || q.includes('δημητριακ') || q.includes('φρυγαν') || q.includes('παξιμαδ') || q.includes('κριτσιν')
  ) {
    status = 'forbidden';
    category = q.includes('γλυκ') || q.includes('σοκολατ') || q.includes('ζαχαρ') ? 'Γλυκά' : 'Αμυλούχα / Ζύμες';
    calories = q.includes('γλυκ') || q.includes('σοκολατ') ? 450 : 260;
    protein = 6;
    carbs = q.includes('γλυκ') ? 60 : 45;
    fat = 10;
    fiber = 2;
    note = `Απαγορεύεται σε Low-Carb/Keto. Περιέχει υψηλούς υδατάνθρακες (~${carbs}g/100g) ή σάκχαρα που μπλοκάρουν το κάψιμο λίπους και αυξάνουν τη φλεγμονή.`;
  }
  // 2. LIMITED PATTERNS
  else if (
    q.includes('φρουτ') || q.includes('μηλ') || q.includes('πορτοκαλ') || q.includes('μανταριν') ||
    q.includes('αχλαδ') || q.includes('ροδακιν') || q.includes('βετικοκ') || q.includes('σταφυλ') ||
    q.includes('καρπουζ') || q.includes('πεπον') || q.includes('κερασ') || q.includes('δαμασκην') ||
    q.includes('φακ') || q.includes('φασολ') || q.includes('ρεβιθ') || q.includes('φαβα') ||
    q.includes('κρασ') || q.includes('τσιπουρ') || q.includes('τσικουδι') || q.includes('ουισκ') || q.includes('βοτκ') || q.includes('τζιν') ||
    q.includes('ντοματ') || q.includes('καροτ') || q.includes('παντζαρ') || q.includes('κρεμμυδ') ||
    q.includes('κασιους') || q.includes('φυστικ') || q.includes('μανουρ')
  ) {
    status = 'limited';
    category = q.includes('φρουτ') || q.includes('μηλ') || q.includes('πορτοκαλ') ? 'Φρούτα' : q.includes('κρασ') || q.includes('τσιπουρ') ? 'Αλκοόλ' : 'Μέτριοι Υδατάνθρακες';
    calories = q.includes('αλκοολ') || q.includes('κρασ') ? 110 : 80;
    protein = 4;
    carbs = 12;
    fat = 2;
    fiber = 3;
    weeklyLimit = '1-2 φορές / εβδομάδα σε μικρή ποσότητα';
    note = `Κατανάλωση με μέτρο. Περιέχει μέτριους υδατάνθρακες (~${carbs}g/100g) ή φυσικά σάκχαρα. Μην υπερβαίνετε τα 50g υδατανθράκων την ημέρα.`;
  }
  // 3. ALLOWED
  else {
    status = 'allowed';
    if (q.includes('ψαρ') || q.includes('σολομ') || q.includes('τσιπουρ') || q.includes('λαβρακ') || q.includes('τονο') || q.includes('σαρδελ') || q.includes('γαριδ') || q.includes('χταποδ') || q.includes('καλαμαρ')) {
      category = 'Ψάρια & Θαλασσινά';
      calories = 140;
      protein = 22;
      carbs = 0;
      fat = 5;
      note = `Εξαιρετική πηγή πρωτεΐνης & Ωμέγα-3. Μηδέν υδατάνθρακες, ιδανικό για αντιφλεγμονώδη δράση στη σπονδυλική στήλη.`;
    } else if (q.includes('κρεας') || q.includes('κοτοπουλ') || q.includes('μοσχαρ') || q.includes('γαλοπουλ') || q.includes('χοιριν') || q.includes('αυγ') || q.includes('μπιφτεκ')) {
      category = 'Πρωτεΐνες & Κρέατα';
      calories = 190;
      protein = 27;
      carbs = 0;
      fat = 9;
      note = `Καθαρή πρωτεΐνη υψηλής βιολογικής αξίας. 0g υδατάνθρακες, συμβάλλει στη διατήρηση μυϊκής μάζας και κέτωσης.`;
    } else if (q.includes('τυρ') || q.includes('φετα') || q.includes('γραβιερ') || q.includes('κασσερ') || q.includes('γιαουρτ') || q.includes('cottage') || q.includes('ανθοτυρ')) {
      category = 'Γαλακτοκομικά & Τυριά';
      calories = 220;
      protein = 16;
      carbs = 2.5;
      fat = 16;
      note = `Πλούσιο σε ασβέστιο και πρωτεΐνη με ελάχιστους υδατάνθρακες. Κατάλληλο για καθημερινή κατανάλωση.`;
    } else if (q.includes('λαδ') || q.includes('ελαι') || q.includes('αβοκαντ') || q.includes('βουτυρ') || q.includes('αμυγδαλ') || q.includes('καρυδ')) {
      category = 'Καλά Λιπαρά';
      calories = 450;
      protein = 8;
      carbs = 4;
      fat = 45;
      note = `Υγιεινά μονοακόρεστα και πολυακόρεστα λιπαρά. Παρέχουν σταθερή ενέργεια χωρίς έκκριση ινσουλίνης.`;
    } else {
      category = 'Λαχανικά & Πράσινα';
      calories = 28;
      protein = 2;
      carbs = 3.5;
      fat = 0.4;
      fiber = 2.5;
      note = `Επιτρέπεται ελεύθερα! Χαμηλές θερμίδες, πλούσιο σε φυτικές ίνες, βιταμίνες και αντιοξειδωτικά.`;
    }
  }

  return {
    id: 'ai-' + Math.random().toString(36).substring(2, 9),
    name: rawQuery.trim().charAt(0).toUpperCase() + rawQuery.trim().slice(1),
    category,
    status,
    calories,
    protein,
    carbs,
    fat,
    fiber,
    note,
    weeklyLimit,
  };
}

export function searchSmartFoods(query) {
  if (!query || query.trim().length < 1) return [];

  const norm = normalizeGreek(query);

  const matches = SMART_FOOD_DB.filter(f => {
    const nameNorm = normalizeGreek(f.name);
    const catNorm = normalizeGreek(f.category);
    const noteNorm = normalizeGreek(f.note);
    return nameNorm.includes(norm) || catNorm.includes(norm) || noteNorm.includes(norm);
  });

  if (matches.length > 0) {
    return matches.slice(0, 10);
  }

  if (query.trim().length >= 2) {
    const dynamicFood = analyzeFoodDynamically(query);
    return [dynamicFood];
  }

  return [];
}
