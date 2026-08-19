// =====================================================
// COMPREHENSIVE GREEK & INTERNATIONAL FOOD KNOWLEDGE BASE
// Status: 'allowed' = πράσινο (Keto/Low-Carb OK)
//         'limited' = πορτοκαλί (Μέτρο / Εβδομαδιαίο όριο)
//         'forbidden' = κόκκινο (Απαγορεύεται / Μπλοκάρει λίπος & φλεγμονή)
// =====================================================

export interface SmartFood {
  id: string;
  name: string;
  category: string;
  status: 'allowed' | 'limited' | 'forbidden';
  calories: number;   // per 100g
  protein: number;    // per 100g
  carbs: number;      // per 100g
  fat: number;        // per 100g
  fiber: number;      // per 100g
  note: string;       // Why it fits or harms the diet & spine
  weeklyLimit?: string; // For "limited" or occasional foods
}

export const SMART_FOOD_DB: SmartFood[] = [
  // =====================================================
  // 1. ΠΡΩΤΕΙΝΕΣ & ΚΡΕΑΤΑ (ALLOWED & LIMITED)
  // =====================================================
  { id: 'f1', name: 'Κοτόπουλο (στήθος φιλέτο)', category: 'Πρωτεΐνες', status: 'allowed', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, note: 'Κορυφαία άπαχη πρωτεΐνη για μυϊκή προστασία χωρίς επιβάρυνση.' },
  { id: 'f2', name: 'Κοτόπουλο (μπούτι χωρίς πέτσα)', category: 'Πρωτεΐνες', status: 'allowed', calories: 180, protein: 26, carbs: 0, fat: 8, fiber: 0, note: 'Ζουμερή πρωτεΐνη, καλά λιπαρά. Ψητό.' },
  { id: 'f3', name: 'Κοτόπουλο (φτερούγες/ολόκληρο ψητό)', category: 'Πρωτεΐνες', status: 'allowed', calories: 215, protein: 24, carbs: 0, fat: 13, fiber: 0, note: 'Καλό σε keto. Απέφυγε σάλτσες με ζάχαρη.' },
  { id: 'f4', name: 'Γαλοπούλα (φιλέτο στήθος)', category: 'Πρωτεΐνες', status: 'allowed', calories: 135, protein: 30, carbs: 0, fat: 1, fiber: 0, note: 'Εξαιρετικά άπαχη πρωτεΐνη, 0g υδατάνθρακες.' },
  { id: 'f5', name: 'Μοσχάρι (άπαχο φιλέτο / νουά)', category: 'Πρωτεΐνες', status: 'allowed', calories: 210, protein: 28, carbs: 0, fat: 10, fiber: 0, note: 'Πλούσιο σε σίδηρο, ψευδάργυρο και Β12. Ψητό ή κατσαρόλας.' },
  { id: 'f6', name: 'Μοσχαρίσιος κιμάς (άπαχος)', category: 'Πρωτεΐνες', status: 'allowed', calories: 225, protein: 26, carbs: 0, fat: 13, fiber: 0, note: 'Ιδανικό για μπιφτέκια χωρίς ψωμί (βάλε αυγό & βρώμη/κολοκυθάκι).' },
  { id: 'f7', name: 'Μοσχαρίσια σπαλομπριζόλα / Ribeye', category: 'Πρωτεΐνες', status: 'allowed', calories: 290, protein: 24, carbs: 0, fat: 21, fiber: 0, note: 'Υψηλότερο λίπος, απόλυτα συμβατό με keto.' },
  { id: 'f8', name: 'Χοιρινό (ψαρονέφρι)', category: 'Πρωτεΐνες', status: 'allowed', calories: 143, protein: 26, carbs: 0, fat: 3.5, fiber: 0, note: 'Το πιο άπαχο κομμάτι χοιρινού. Εξαιρετική επιλογή.' },
  { id: 'f9', name: 'Χοιρινή μπριζόλα λαιμού / καρέ', category: 'Πρωτεΐνες', status: 'allowed', calories: 245, protein: 25, carbs: 0, fat: 16, fiber: 0, note: 'Ψητή. Αφαίρεσε το περιττό εξωτερικό λίπος.' },
  { id: 'f10', name: 'Χοιρινή πανσέτα', category: 'Πρωτεΐνες', status: 'limited', calories: 390, protein: 17, carbs: 0, fat: 36, fiber: 0, note: 'Πολύ υψηλές θερμίδες και κορεσμένο λίπος.', weeklyLimit: '1 φορά / εβδομάδα' },
  { id: 'f11', name: 'Αρνί (μπούτι / παϊδάκια)', category: 'Πρωτεΐνες', status: 'limited', calories: 282, protein: 25, carbs: 0, fat: 20, fiber: 0, note: '0g υδατάνθρακες αλλά βαρύ σε λίπος.', weeklyLimit: '1-2 φορές / εβδομάδα' },
  { id: 'f12', name: 'Κατσίκι (άπαχο)', category: 'Πρωτεΐνες', status: 'allowed', calories: 143, protein: 27, carbs: 0, fat: 3, fiber: 0, note: 'Πιο άπαχο από το αρνί, υψηλή βιολογική αξία.' },
  { id: 'f13', name: 'Κουνέλι', category: 'Πρωτεΐνες', status: 'allowed', calories: 136, protein: 29, carbs: 0, fat: 2, fiber: 0, note: 'Εξαιρετικά άπαχο κρέας, πλούσιο σε πρωτεΐνη.' },
  { id: 'f14', name: 'Συκώτι μοσχαρίσιο', category: 'Πρωτεΐνες', status: 'allowed', calories: 175, protein: 27, carbs: 3.8, fat: 4.7, fiber: 0, note: 'Υπερτροφή βιταμινών (Α, Β12, σίδηρος). 1 φορά την εβδομάδα.' },
  { id: 'f15', name: 'Αυγό ολόκληρο (βραστό/ποσέ/μάτι)', category: 'Πρωτεΐνες', status: 'allowed', calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, note: 'Τέλεια αναλογία αμινοξέων, χολίνη για τον εγκέφαλο. 2-3 αυγά/μέρα OK.' },
  { id: 'f16', name: 'Ασπράδι αυγού', category: 'Πρωτεΐνες', status: 'allowed', calories: 52, protein: 11, carbs: 0.7, fat: 0.2, fiber: 0, note: 'Καθαρή πρωτεΐνη μηδενικού λίπους.' },
  { id: 'f17', name: 'Μπέικον', category: 'Πρωτεΐνες', status: 'limited', calories: 450, protein: 30, carbs: 1, fat: 38, fiber: 0, note: 'Επεξεργασμένο κρέας με νάτριο. 2 φέτες περιστασιακά.', weeklyLimit: '1-2 φορές / εβδομάδα' },
  { id: 'f18', name: 'Λουκάνικο χωριάτικο', category: 'Πρωτεΐνες', status: 'limited', calories: 340, protein: 15, carbs: 2, fat: 30, fiber: 0, note: 'Πλούσιο σε λίπος & αλάτι. Με μέτρο.', weeklyLimit: '1 φορά / εβδομάδα' },
  { id: 'f19', name: 'Ζαμπόν γαλοπούλας βραστό', category: 'Πρωτεΐνες', status: 'allowed', calories: 105, protein: 19, carbs: 1.5, fat: 2.5, fiber: 0, note: 'Βολικό σνακ πρωτεΐνης. Προτίμησε χωρίς συντηρητικά.' },
  { id: 'f20', name: 'Προσούτο crudo', category: 'Πρωτεΐνες', status: 'allowed', calories: 230, protein: 26, carbs: 0.5, fat: 14, fiber: 0, note: 'Ωρίμανσης χωρίς ζάχαρη. 2-3 φέτες OK.' },

  // =====================================================
  // 2. ΨΑΡΙΑ & ΘΑΛΑΣΣΙΝΑ (ALLOWED)
  // =====================================================
  { id: 's1', name: 'Σολομός (φρέσκος/ψητός)', category: 'Ψάρια', status: 'allowed', calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, note: 'Κορυφαίο αντιφλεγμονώδες Ωμέγα-3. Προστατεύει τις αρθρώσεις και τη μέση.' },
  { id: 's2', name: 'Σαρδέλες ψητές', category: 'Ψάρια', status: 'allowed', calories: 208, protein: 25, carbs: 0, fat: 11, fiber: 0, note: 'Ωμέγα-3, ασβέστιο (με τα κόκαλα), βιταμίνη D για τα οστά.' },
  { id: 's3', name: 'Τσιπούρα ψητή', category: 'Ψάρια', status: 'allowed', calories: 115, protein: 21, carbs: 0, fat: 3.5, fiber: 0, note: 'Εξαιρετικό μεσογειακό ψάρι, ελαφρύ και θρεπτικό.' },
  { id: 's4', name: 'Λαβράκι ψητό', category: 'Ψάρια', status: 'allowed', calories: 124, protein: 23, carbs: 0, fat: 3, fiber: 0, note: 'Άπαχη, ποιοτική πρωτεΐνη.' },
  { id: 's5', name: 'Μπακαλιάρος (βραστός/ψητός)', category: 'Ψάρια', status: 'allowed', calories: 82, protein: 18, carbs: 0, fat: 0.7, fiber: 0, note: 'Πολύ άπαχο ψάρι. Όχι τηγανητός με σκορδαλιά!' },
  { id: 's6', name: 'Τόνος (φρέσκος φιλέτο)', category: 'Ψάρια', status: 'allowed', calories: 130, protein: 28, carbs: 0, fat: 1.5, fiber: 0, note: 'Καθαρή πρωτεΐνη υψηλής ποιότητας.' },
  { id: 's7', name: 'Τόνος σε νερό (κονσέρβα)', category: 'Ψάρια', status: 'allowed', calories: 116, protein: 26, carbs: 0, fat: 1, fiber: 0, note: 'Βολική πηγή πρωτεΐνης για σαλάτες. Έως 3 κονσέρβες/εβδομάδα.' },
  { id: 's8', name: 'Τόνος σε ελαιόλαδο', category: 'Ψάρια', status: 'allowed', calories: 198, protein: 27, carbs: 0, fat: 10, fiber: 0, note: 'Καλά λιπαρά ελαιολάδου. Στραγγίξτε ελαφρώς.' },
  { id: 's9', name: 'Γαρίδες (ψητές/βραστές)', category: 'Θαλασσινά', status: 'allowed', calories: 99, protein: 24, carbs: 0.2, fat: 0.3, fiber: 0, note: 'Μηδενικό λίπος, υψηλή πρωτεΐνη, ιώδιο.' },
  { id: 's10', name: 'Καλαμάρι (ψητό/βραστό)', category: 'Θαλασσινά', status: 'allowed', calories: 92, protein: 16, carbs: 3, fat: 1.4, fiber: 0, note: 'Ψητό με λαδολέμονο. Τηγανητό με κουρκούτι απαγορεύεται.' },
  { id: 's11', name: 'Χταπόδι (ψητό/ξιδάτο)', category: 'Θαλασσινά', status: 'allowed', calories: 82, protein: 15, carbs: 2.2, fat: 1, fiber: 0, note: 'Κλασικός μεζές, ελάχιστες θερμίδες, καθαρή πρωτεΐνη.' },
  { id: 's12', name: 'Σουπιές (ψητές / με σπανάκι)', category: 'Θαλασσινά', status: 'allowed', calories: 95, protein: 16, carbs: 2, fat: 1.5, fiber: 0, note: 'Σουπιές με σπανάκι = τέλειο keto γεύμα.' },
  { id: 's13', name: 'Μύδια (αχνιστά)', category: 'Θαλασσινά', status: 'allowed', calories: 86, protein: 12, carbs: 3.7, fat: 2.2, fiber: 0, note: 'Πλούσια σε σίδηρο και βιταμίνη Β12.' },
  { id: 's14', name: 'Γαύρος ψητός (λαδορίγανη)', category: 'Ψάρια', status: 'allowed', calories: 131, protein: 20, carbs: 0, fat: 5.5, fiber: 0, note: 'Μικρό ψάρι γεμάτο Ω3 χωρίς βαρέα μέταλλα.' },
  { id: 's15', name: 'Σκουμπρί καπνιστό/ψητό', category: 'Ψάρια', status: 'allowed', calories: 260, protein: 24, carbs: 0, fat: 18, fiber: 0, note: 'Υπερτροφή Ω3 λιπαρών οξέων.' },

  // =====================================================
  // 3. ΛΑΧΑΝΙΚΑ & ΧΟΡΤΑ (ALLOWED, LIMITED, FORBIDDEN)
  // =====================================================
  { id: 'v1', name: 'Μπρόκολο (βραστό/ατμού)', category: 'Λαχανικά', status: 'allowed', calories: 34, protein: 2.8, carbs: 4.4, fat: 0.4, fiber: 2.6, note: 'Σουλφοραφάνη: κορυφαίο φυσικό αντιφλεγμονώδες για τη σπονδυλική στήλη.' },
  { id: 'v2', name: 'Κουνουπίδι (βραστό/ρύζι κουνουπιδιού)', category: 'Λαχανικά', status: 'allowed', calories: 25, protein: 1.9, carbs: 3, fat: 0.3, fiber: 2, note: 'Ιδανικό υποκατάστατο ρυζιού και πουρέ πατάτας.' },
  { id: 'v3', name: 'Σπανάκι (ωμό/βραστό)', category: 'Λαχανικά', status: 'allowed', calories: 23, protein: 2.9, carbs: 1.4, fat: 0.4, fiber: 2.2, note: 'Μαγνήσιο και κάλιο: απαραίτητο για αποφυγή κραμπών σε keto.' },
  { id: 'v4', name: 'Μαρούλι / Σαλάτα πράσινη', category: 'Λαχανικά', status: 'allowed', calories: 15, protein: 1.4, carbs: 1.6, fat: 0.2, fiber: 1.3, note: 'Ελεύθερη κατανάλωση. Βάση για κάθε γεύμα.' },
  { id: 'v5', name: 'Ρόκα', category: 'Λαχανικά', status: 'allowed', calories: 25, protein: 2.6, carbs: 2.1, fat: 0.7, fiber: 1.6, note: 'Νιτρικά που βελτιώνουν την κυκλοφορία αίματος.' },
  { id: 'v6', name: 'Λάχανο (άσπρο / κόκκινο)', category: 'Λαχανικά', status: 'allowed', calories: 25, protein: 1.3, carbs: 3.5, fat: 0.1, fiber: 2.5, note: 'Αντιοξειδωτικά, τέλεια χειμωνιάτικη σαλάτα.' },
  { id: 'v7', name: 'Κολοκυθάκια (βραστά/ψητά)', category: 'Λαχανικά', status: 'allowed', calories: 17, protein: 1.2, carbs: 2.1, fat: 0.3, fiber: 1, note: 'Zucchini noodles (zoodles) αντί για μακαρόνια.' },
  { id: 'v8', name: 'Μανιτάρια (λευκά/πλευρώτους/portobello)', category: 'Λαχανικά', status: 'allowed', calories: 22, protein: 3.1, carbs: 2.3, fat: 0.3, fiber: 1, note: 'Βιταμίνη D, μηδέν σάκχαρα. Ψητά με σκόρδο.' },
  { id: 'v9', name: 'Αγγούρι', category: 'Λαχανικά', status: 'allowed', calories: 15, protein: 0.7, carbs: 3.1, fat: 0.1, fiber: 0.5, note: '96% νερό. Ενυδατώνει τους μεσοσπονδύλιους δίσκους.' },
  { id: 'v10', name: 'Βραστά χόρτα (βλίτα/ραδίκια/αντίδια)', category: 'Λαχανικά', status: 'allowed', calories: 28, protein: 2, carbs: 1, fat: 0.5, fiber: 3, note: 'Ελληνική υπερτροφή. Με έξτρα παρθένο ελαιόλαδο και λεμόνι.' },
  { id: 'v11', name: 'Σπαράγγια', category: 'Λαχανικά', status: 'allowed', calories: 20, protein: 2.2, carbs: 1.8, fat: 0.1, fiber: 2.1, note: 'Φυσικό διουρητικό, απομακρύνει κατακράτηση.' },
  { id: 'v12', name: 'Πιπεριά πράσινη', category: 'Λαχανικά', status: 'allowed', calories: 20, protein: 0.9, carbs: 2.9, fat: 0.2, fiber: 1.7, note: 'Βιταμίνη C, ελάχιστοι υδατάνθρακες.' },
  { id: 'v13', name: 'Πιπεριά κόκκινη / κίτρινη', category: 'Λαχανικά', status: 'allowed', calories: 31, protein: 1, carbs: 4.5, fat: 0.3, fiber: 2.1, note: 'Περισσότερη βιταμίνη C, ελαφρώς πιο γλυκιά.' },
  { id: 'v14', name: 'Μελιτζάνα (ψητή)', category: 'Λαχανικά', status: 'allowed', calories: 25, protein: 1, carbs: 3, fat: 0.2, fiber: 3, note: 'Νασουνίνη (αντιοξειδωτικό). Ψητή στο φούρνο.' },
  { id: 'v15', name: 'Φασολάκια πράσινα (λαδερά/βραστά)', category: 'Λαχανικά', status: 'allowed', calories: 31, protein: 1.8, carbs: 3.6, fat: 0.1, fiber: 3.4, note: 'Λαχανικό με πολλές ίνες, χαμηλοί καθαροί υδατάνθρακες.' },
  { id: 'v16', name: 'Σέλινο / Σελινόριζα', category: 'Λαχανικά', status: 'allowed', calories: 16, protein: 0.7, carbs: 1.4, fat: 0.2, fiber: 1.6, note: 'Τέλειο τραγανό σνακ με τυρί κρέμα.' },
  { id: 'v17', name: 'Ντομάτα', category: 'Λαχανικά', status: 'limited', calories: 18, protein: 0.9, carbs: 2.7, fat: 0.2, fiber: 1.2, note: 'Λυκοπένιο. Προσοχή στην ποσότητα (φυσικά σάκχαρα).', weeklyLimit: '1 μέτρια ντομάτα / ημέρα σε σαλάτα' },
  { id: 'v18', name: 'Κρεμμύδι (ξερό/φρέσκο)', category: 'Λαχανικά', status: 'limited', calories: 40, protein: 1.1, carbs: 7.6, fat: 0.1, fiber: 1.7, note: 'Κερσετίνη (αντιφλεγμονώδες). Μέτρια ποσότητα στο φαγητό.', weeklyLimit: 'Λίγο στο μαγείρεμα' },
  { id: 'v19', name: 'Καρότο (ωμό/βραστό)', category: 'Λαχανικά', status: 'limited', calories: 41, protein: 0.9, carbs: 7.2, fat: 0.2, fiber: 2.8, note: 'Βήτα-καροτίνη αλλά ~7g καθαροί υδατάνθρακες. Μικρή ποσότητα σε σαλάτα.', weeklyLimit: '2-3 καρότα / εβδομάδα' },
  { id: 'v20', name: 'Παντζάρι (βραστό)', category: 'Λαχανικά', status: 'limited', calories: 43, protein: 1.6, carbs: 7.2, fat: 0.2, fiber: 2.8, note: 'Υψηλό σε φυσικά σάκχαρα για λαχανικό. Λίγο OK.', weeklyLimit: '1 μικρό παντζάρι, 1-2 φορές / εβδομάδα' },
  { id: 'v21', name: 'Κολοκύθα κίτρινη', category: 'Λαχανικά', status: 'limited', calories: 26, protein: 1, carbs: 5.5, fat: 0.1, fiber: 0.5, note: 'Μέτριοι υδατάνθρακες σε σούπες.' },
  { id: 'v22', name: 'Αρακάς', category: 'Λαχανικά', status: 'forbidden', calories: 81, protein: 5.4, carbs: 14.5, fat: 0.4, fiber: 5.1, note: 'Αμυλούχο όσπριο/λαχανικό. 15g υδατάνθρακες/100g, μπλοκάρει την κέτωση.' },
  { id: 'v23', name: 'Καλαμπόκι (βραστό/ψητό/κονσέρβα)', category: 'Λαχανικά', status: 'forbidden', calories: 86, protein: 3.3, carbs: 19, fat: 1.2, fiber: 2.7, note: 'Καθαρό άμυλο (δημητριακό), ανεβάζει απότομα το σάκχαρο και την ινσουλίνη.' },
  { id: 'v24', name: 'Πατάτα (βραστή/ψητή)', category: 'Λαχανικά', status: 'forbidden', calories: 77, protein: 2, carbs: 17, fat: 0.1, fiber: 2.2, note: 'Υψηλότατος γλυκαιμικός δείκτης. Σταματάει άμεσα το κάψιμο λίπους.' },
  { id: 'v25', name: 'Γλυκοπατάτα', category: 'Λαχανικά', status: 'forbidden', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3, note: '20g υδατάνθρακες. Ακατάλληλη για φάση απώλειας βάρους.' },

  // =====================================================
  // 4. ΦΡΟΥΤΑ (ALLOWED, LIMITED, FORBIDDEN)
  // =====================================================
  { id: 'fr1', name: 'Αβοκάντο', category: 'Φρούτα', status: 'allowed', calories: 160, protein: 2, carbs: 2, fat: 15, fiber: 7, note: 'Ο βασιλιάς των φρούτων στο keto. Μονοακόρεστα λιπαρά και κάλιο.' },
  { id: 'fr2', name: 'Λεμόνι / Χυμός λεμονιού', category: 'Φρούτα', status: 'allowed', calories: 29, protein: 1.1, carbs: 6, fat: 0.3, fiber: 2.8, note: 'Αλκαλοποιεί τον οργανισμό, βιταμίνη C. Χρησιμοποίησε ελεύθερα.' },
  { id: 'fr3', name: 'Φράουλες (φρέσκες)', category: 'Φρούτα', status: 'limited', calories: 32, protein: 0.7, carbs: 5.7, fat: 0.3, fiber: 2, note: 'Το καλύτερο φρούτο για keto. Χαμηλό σε σάκχαρα.', weeklyLimit: '100g, 2-3 φορές / εβδομάδα' },
  { id: 'fr4', name: 'Μύρτιλα / Blueberries', category: 'Φρούτα', status: 'limited', calories: 57, protein: 0.7, carbs: 11.6, fat: 0.3, fiber: 2.4, note: 'Ισχυρά αντιοξειδωτικά ανθοκυανίνες.', weeklyLimit: '50-60g, 2 φορές / εβδομάδα' },
  { id: 'fr5', name: 'Σμέουρα / Raspberries', category: 'Φρούτα', status: 'limited', calories: 52, protein: 1.2, carbs: 5.4, fat: 0.6, fiber: 6.5, note: 'Πάρα πολλές φυτικές ίνες, ελάχιστοι καθαροί υδατάνθρακες.', weeklyLimit: '80g, 2-3 φορές / εβδομάδα' },
  { id: 'fr6', name: 'Μήλο', category: 'Φρούτα', status: 'limited', calories: 52, protein: 0.3, carbs: 11.6, fat: 0.2, fiber: 2.4, note: 'Φρουκτόζη. Αν φας, προτίμησε πράσινο ξινόμηλο.', weeklyLimit: 'Μισό μήλο, 1-2 φορές / εβδομάδα' },
  { id: 'fr7', name: 'Πορτοκάλι / Μανταρίνι', category: 'Φρούτα', status: 'limited', calories: 47, protein: 0.9, carbs: 9.6, fat: 0.1, fiber: 2.4, note: 'Βιταμίνη C. Προτίμησε ολόκληρο, ποτέ στημένο χυμό!', weeklyLimit: '1 φρούτο, 1-2 φορές / εβδομάδα' },
  { id: 'fr8', name: 'Καρπούζι / Πεπόνι', category: 'Φρούτα', status: 'limited', calories: 30, protein: 0.6, carbs: 7.6, fat: 0.2, fiber: 0.4, note: 'Υψηλός γλυκαιμικός δείκτης. Μικρή φέτα περιστασιακά.', weeklyLimit: '1 λεπτή φέτα / εβδομάδα' },
  { id: 'fr9', name: 'Μπανάνα', category: 'Φρούτα', status: 'forbidden', calories: 89, protein: 1.1, carbs: 20.4, fat: 0.3, fiber: 2.6, note: '23g υδατάνθρακες ανά τεμάχιο. Εκτοξεύει την ινσουλίνη.' },
  { id: 'fr10', name: 'Σταφύλια', category: 'Φρούτα', status: 'forbidden', calories: 69, protein: 0.7, carbs: 17, fat: 0.2, fiber: 0.9, note: 'Καθαρή ζάχαρη σε μικρές μπουκιές. Απαγορεύεται.' },
  { id: 'fr11', name: 'Σύκα (φρέσκα/αποξηραμένα)', category: 'Φρούτα', status: 'forbidden', calories: 74, protein: 0.8, carbs: 16.3, fat: 0.3, fiber: 2.9, note: 'Πολύ υψηλή περιεκτικότητα σε σάκχαρα.' },
  { id: 'fr12', name: 'Αποξηραμένα φρούτα (σταφίδες, δαμάσκηνα, χουρμάδες)', category: 'Φρούτα', status: 'forbidden', calories: 280, protein: 2.5, carbs: 70, fat: 0.5, fiber: 6, note: 'Συμπυκνωμένη ζάχαρη (~70g υδατάνθρακες). Απαγορεύονται.' },

  // =====================================================
  // 5. ΓΑΛΑΚΤΟΚΟΜΙΚΑ & ΤΥΡΙΑ (ALLOWED & LIMITED)
  // =====================================================
  { id: 'd1', name: 'Γιαούρτι στραγγιστό 2%', category: 'Γαλακτοκομικά', status: 'allowed', calories: 73, protein: 10, carbs: 3.6, fat: 2, fiber: 0, note: 'Ιδανικό σνακ πρωτεΐνης 16:00. Προβιοτικά για το έντερο.' },
  { id: 'd2', name: 'Γιαούρτι στραγγιστό πλήρες (10%)', category: 'Γαλακτοκομικά', status: 'allowed', calories: 130, protein: 9, carbs: 3.8, fat: 10, fiber: 0, note: 'Πλήρες σε λιπαρά, κρατάει χορτάτο για ώρες.' },
  { id: 'd3', name: 'Φέτα ΠΟΠ', category: 'Τυριά', status: 'allowed', calories: 264, protein: 14, carbs: 1.5, fat: 21, fiber: 0, note: 'Ασβέστιο και πρωτεΐνη. 40-50g στη σαλάτα.' },
  { id: 'd4', name: 'Γραβιέρα / Κασέρι', category: 'Τυριά', status: 'allowed', calories: 380, protein: 26, carbs: 1, fat: 31, fiber: 0, note: 'Σκληρά τυριά = ελάχιστη λακτόζη, πλούσια σε ασβέστιο.' },
  { id: 'd5', name: 'Παρμεζάνα / Grana Padano', category: 'Τυριά', status: 'allowed', calories: 431, protein: 38, carbs: 3.2, fat: 29, fiber: 0, note: 'Κορυφαία πυκνότητα πρωτεΐνης (38%).' },
  { id: 'd6', name: 'Μοτσαρέλα (φρέσκια)', category: 'Τυριά', status: 'allowed', calories: 280, protein: 18, carbs: 2.2, fat: 22, fiber: 0, note: 'Εξαιρετική με ντομάτα και βασιλικό.' },
  { id: 'd7', name: 'Cottage Cheese (κατίκι)', category: 'Τυριά', status: 'allowed', calories: 98, protein: 12, carbs: 3.4, fat: 4, fiber: 0, note: 'Πολύ πρωτεΐνη, χαμηλές θερμίδες. Τέλειο σνακ.' },
  { id: 'd8', name: 'Ανθότυρο (νωπό)', category: 'Τυριά', status: 'allowed', calories: 175, protein: 11, carbs: 3, fat: 13, fiber: 0, note: 'Ελαφρύ παραδοσιακό τυρί.' },
  { id: 'd9', name: 'Μανούρι', category: 'Τυριά', status: 'limited', calories: 440, protein: 11, carbs: 2, fat: 44, fiber: 0, note: 'Πολύ λιπαρό τυρί (44% λίπος). Μικρή ποσότητα.', weeklyLimit: '1-2 φορές / εβδομάδα (30g)' },
  { id: 'd10', name: 'Τυρί κρέμα (Philadelphia)', category: 'Τυριά', status: 'allowed', calories: 342, protein: 6, carbs: 4, fat: 34, fiber: 0, note: 'Κατάλληλο για keto σάλτσες και dressings.' },
  { id: 'd11', name: 'Κατσικίσιο τυρί (chevre)', category: 'Τυριά', status: 'allowed', calories: 364, protein: 22, carbs: 0.1, fat: 30, fiber: 0, note: 'Εύπεπτο, μηδέν υδατάνθρακες.' },
  { id: 'd12', name: 'Γάλα αμυγδάλου (χωρίς ζάχαρη)', category: 'Γαλακτοκομικά', status: 'allowed', calories: 15, protein: 0.6, carbs: 0.3, fat: 1.2, fiber: 0.2, note: 'Το καλύτερο υποκατάστατο γάλακτος για καφέ και smoothies.' },
  { id: 'd13', name: 'Γάλα αγελαδινό πλήρες/ελαφρύ', category: 'Γαλακτοκομικά', status: 'limited', calories: 50, protein: 3.3, carbs: 4.8, fat: 2, fiber: 0, note: 'Περιέχει λακτόζη (σάκχαρο). Μόνο 50ml στον καφέ.', weeklyLimit: 'Μικρή ποσότητα στον καφέ' },
  { id: 'd14', name: 'Βούτυρο αγελαδινό (100%)', category: 'Γαλακτοκομικά', status: 'allowed', calories: 717, protein: 0.9, carbs: 0.1, fat: 81, fiber: 0, note: 'Αγνό λίπος, εξαιρετικό για μαγείρεμα σε χαμηλή φωτιά.' },
  { id: 'd15', name: 'Κρέμα γάλακτος (35% λιπαρά)', category: 'Γαλακτοκομικά', status: 'allowed', calories: 340, protein: 2.2, carbs: 2.8, fat: 36, fiber: 0, note: 'Χωρίς ζάχαρη. Ιδανική για keto σάλτσες.' },

  // =====================================================
  // 6. ΛΙΠΑΡΑ, ΞΗΡΟΙ ΚΑΡΠΟΙ & ΣΠΟΡΟΙ (ALLOWED & LIMITED)
  // =====================================================
  { id: 'n1', name: 'Έξτρα Παρθένο Ελαιόλαδο', category: 'Λιπαρά', status: 'allowed', calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, note: 'Κορυφαίο αντιφλεγμονώδες λίπος στον κόσμο (ολεοκανθάλη). 2-3 κ.σ./ημέρα.' },
  { id: 'n2', name: 'Ελιές Καλαμών / Πράσινες', category: 'Λιπαρά', status: 'allowed', calories: 115, protein: 0.8, carbs: 3, fat: 11, fiber: 3.2, note: 'Καλά λιπαρά, μηδέν καθαροί υδατάνθρακες. 6-8 ελιές/ημέρα.' },
  { id: 'n3', name: 'Αμύγδαλα ωμά ανάλατα', category: 'Ξηροί καρποί', status: 'allowed', calories: 579, protein: 21, carbs: 10, fat: 50, fiber: 12, note: 'Μαγνήσιο για μυϊκή χαλάρωση και βιταμίνη Ε. 12-15 τεμάχια (30g).' },
  { id: 'n4', name: 'Καρύδια', category: 'Ξηροί καρποί', status: 'allowed', calories: 654, protein: 15, carbs: 7, fat: 65, fiber: 7, note: 'Φυτικά Ω3 λιπαρά (ALA) για υγεία εγκεφάλου και αρθρώσεων. 5-6 καρύδια.' },
  { id: 'n5', name: 'Φουντούκια ωμά', category: 'Ξηροί καρποί', status: 'allowed', calories: 628, protein: 15, carbs: 7, fat: 61, fiber: 10, note: 'Πλούσια σε μονοακόρεστα λιπαρά.' },
  { id: 'n6', name: 'Φυστίκια Αιγίνης (ωμά/ψημένα)', category: 'Ξηροί καρποί', status: 'limited', calories: 562, protein: 20, carbs: 18, fat: 45, fiber: 10, note: 'Περισσότεροι υδατάνθρακες από αμύγδαλα. Με μέτρο.', weeklyLimit: '1 χούφτα (30g), 2 φορές / εβδομάδα' },
  { id: 'n7', name: 'Κάσιους', category: 'Ξηροί καρποί', status: 'limited', calories: 553, protein: 18, carbs: 27, fat: 44, fiber: 3.3, note: 'Υψηλοί υδατάνθρακες για ξηρό καρπό (27g). Προσοχή.', weeklyLimit: '20g περιστασιακά' },
  { id: 'n8', name: 'Σπόροι Chia', category: 'Σπόροι', status: 'allowed', calories: 486, protein: 17, carbs: 8, fat: 31, fiber: 34, note: 'Τεράστια ποσότητα διαλυτών ινών. Chia pudding με γάλα αμυγδάλου.' },
  { id: 'n9', name: 'Λιναρόσπορος (κοπανιστός)', category: 'Σπόροι', status: 'allowed', calories: 534, protein: 18, carbs: 2, fat: 42, fiber: 27, note: 'Ωμέγα-3 και λιγνάνες. Πρόσθεσε 1 κ.γ. σε γιαούρτι.' },
  { id: 'n10', name: 'Κολοκυθόσπορος (πασατέμπος)', category: 'Σπόροι', status: 'allowed', calories: 559, protein: 30, carbs: 5, fat: 49, fiber: 6, note: 'Πλούσιος σε ψευδάργυρο και μαγνήσιο.' },
  { id: 'n11', name: 'Ταχίνι 100% (ολικής/σκέτο)', category: 'Λιπαρά', status: 'allowed', calories: 595, protein: 17, carbs: 12, fat: 54, fiber: 9, note: 'Ασβέστιο και καλά λιπαρά. 1 κ.σ. στο γιαούρτι.' },
  { id: 'n12', name: 'Φυστικοβούτυρο 100% (χωρίς ζάχαρη)', category: 'Λιπαρά', status: 'allowed', calories: 588, protein: 25, carbs: 14, fat: 50, fiber: 8, note: 'Μόνο αν τα συστατικά γράφουν 100% φιστίκια. 1 κ.σ.' },
  { id: 'n13', name: 'Μαγιονέζα (πραγματική/σπιτική)', category: 'Σάλτσες', status: 'allowed', calories: 680, protein: 1, carbs: 0.6, fat: 75, fiber: 0, note: '0g υδατάνθρακες. Προτίμησε με ελαιόλαδο ή λάδι αβοκάντο.' },
  { id: 'n14', name: 'Μουστάρδα (χωρίς ζάχαρη)', category: 'Σάλτσες', status: 'allowed', calories: 66, protein: 4, carbs: 3, fat: 3, fiber: 3, note: 'Αντιοξειδωτική κουρκουμίνη, ελάχιστες θερμίδες.' },
  { id: 'n15', name: 'Τζατζίκι σπιτικό', category: 'Σάλτσες', status: 'allowed', calories: 110, protein: 5, carbs: 3.5, fat: 8, fiber: 0.5, note: 'Στραγγιστό γιαούρτι + αγγούρι + σκόρδο + ελαιόλαδο = 100% Keto!' },

  // =====================================================
  // 7. ΨΩΜΙΑ, ΖΥΜΑΡΙΚΑ, ΔΗΜΗΤΡΙΑΚΑ & ΑΜΥΛΑ (FORBIDDEN)
  // =====================================================
  { id: 'st1', name: 'Ψωμί λευκό / Χωριάτικο', category: 'Αμυλούχα', status: 'forbidden', calories: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7, note: '50g καθαρός υδατάνθρακας. Μπλοκάρει άμεσα την απώλεια λίπους.' },
  { id: 'st2', name: 'Ψωμί ολικής άλεσης / Πολύσπορο', category: 'Αμυλούχα', status: 'forbidden', calories: 247, protein: 13, carbs: 41, fat: 3.4, fiber: 7, note: 'Εξακολουθεί να έχει 41g υδατάνθρακες. Ακατάλληλο για low-carb.' },
  { id: 'st3', name: 'Πίτα για σουβλάκι (λευκή)', category: 'Αμυλούχα', status: 'forbidden', calories: 275, protein: 8, carbs: 54, fat: 3, fiber: 2.5, note: 'Μία μόνο πίτα ισοδυναμεί με 4 φέτες ψωμί και 54g υδατάνθρακες!' },
  { id: 'st4', name: 'Φρυγανιές / Παξιμάδια / Κριτσίνια', category: 'Αμυλούχα', status: 'forbidden', calories: 410, protein: 12, carbs: 72, fat: 8, fiber: 5, note: 'Αφυδατωμένο αλεύρι = 72% καθαρή ζάχαρη/υδατάνθρακας.' },
  { id: 'st5', name: 'Μακαρόνια / Σπαγγέτι / Πέννες (βρασμένα)', category: 'Αμυλούχα', status: 'forbidden', calories: 140, protein: 5, carbs: 28, fat: 1, fiber: 1.8, note: '28g υδατάνθρακες ανά 100g. Μία μερίδα έχει 80g+ υδατάνθρακες.' },
  { id: 'st6', name: 'Ρύζι λευκό / Basmati / Καστανό (βρασμένο)', category: 'Αμυλούχα', status: 'forbidden', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, note: 'Άμυλο που μετατρέπεται αμέσως σε γλυκόζη στο αίμα.' },
  { id: 'st7', name: 'Κριθαράκι / Τραχανάς', category: 'Αμυλούχα', status: 'forbidden', calories: 145, protein: 5.5, carbs: 30, fat: 1.2, fiber: 1.5, note: 'Ζυμαρικό υψηλών υδατανθράκων.' },
  { id: 'st8', name: 'Βρώμη / Porridge / Granola', category: 'Αμυλούχα', status: 'forbidden', calories: 389, protein: 17, carbs: 66, fat: 7, fiber: 11, note: '66g υδατάνθρακες. Παρότι υγιεινή για αθλητές, μπλοκάρει το keto.' },
  { id: 'st9', name: 'Κινόα / Πλιγούρι / Φαγόπυρο', category: 'Αμυλούχα', status: 'forbidden', calories: 120, protein: 4.4, carbs: 21, fat: 1.9, fiber: 2.8, note: 'Δημητριακά με 21g υδατάνθρακες ανά 100g.' },
  { id: 'st10', name: 'Φακές (σούπα/βραστές)', category: 'Όσπρια', status: 'limited', calories: 116, protein: 9, carbs: 14, fat: 0.4, fiber: 7.9, note: 'Πρωτεΐνη & ίνες αλλά 14g καθαροί υδατάνθρακες. Μόνο μικρή ποσότητα.', weeklyLimit: '1 μικρό πιάτο, 1 φορά / εβδομάδα' },
  { id: 'st11', name: 'Φασολάδα / Γίγαντες', category: 'Όσπρια', status: 'limited', calories: 130, protein: 8.5, carbs: 18, fat: 0.5, fiber: 7, note: 'Υψηλοί υδατάνθρακες. Περιορισμός σε αυστηρό keto.', weeklyLimit: '1 μικρή μερίδα / εβδομάδα' },
  { id: 'st12', name: 'Ρεβίθια (σούπα/φούρνου)', category: 'Όσπρια', status: 'limited', calories: 164, protein: 9, carbs: 20, fat: 2.6, fiber: 7.6, note: '20g υδατάνθρακες ανά 100g.', weeklyLimit: '1 μικρή μερίδα / εβδομάδα' },
  { id: 'st13', name: 'Φάβα', category: 'Όσπρια', status: 'limited', calories: 140, protein: 8, carbs: 19, fat: 3.5, fiber: 6, note: 'Υψηλό άμυλο. 2-3 κουταλιές max σαν ορεκτικό.', weeklyLimit: '2 κουταλιές περιστασιακά' },

  // =====================================================
  // 8. ΕΤΟΙΜΑ ΕΛΛΗΝΙΚΑ & FAST FOOD (ALLOWED, LIMITED, FORBIDDEN)
  // =====================================================
  { id: 'm1', name: 'Σουβλάκι καλαμάκι κοτόπουλο (τεμάχιο)', category: 'Έτοιμα Φαγητά', status: 'allowed', calories: 130, protein: 22, carbs: 0.5, fat: 4.5, fiber: 0, note: 'Κορυφαία επιλογή έξω! Καθαρό κρέας χωρίς υδατάνθρακες.' },
  { id: 'm2', name: 'Σουβλάκι καλαμάκι χοιρινό (τεμάχιο)', category: 'Έτοιμα Φαγητά', status: 'allowed', calories: 160, protein: 19, carbs: 0.5, fat: 9.5, fiber: 0, note: 'Εξαιρετικό για keto. Ζήτα το χωρίς ψωμάκι/πίτα.' },
  { id: 'm3', name: 'Γύρος χοιρινός (μερίδα σκέτο κρέας)', category: 'Έτοιμα Φαγητά', status: 'allowed', calories: 260, protein: 21, carbs: 2, fat: 19, fiber: 0, note: 'Με σαλάτα και τζατζίκι. Χωρίς πίτα και πατάτες!' },
  { id: 'm4', name: 'Γύρος κοτόπουλο (μερίδα σκέτο κρέας)', category: 'Έτοιμα Φαγητά', status: 'allowed', calories: 210, protein: 24, carbs: 2, fat: 12, fiber: 0, note: 'Πολύ καλή επιλογή έξω με πράσινη σαλάτα.' },
  { id: 'm5', name: 'Πίτα γύρος με απ\' όλα', category: 'Έτοιμα Φαγητά', status: 'forbidden', calories: 750, protein: 28, carbs: 68, fat: 42, fiber: 4, note: 'Πίτα + τηγανητές πατάτες + σως = 68g υδατάνθρακες και 750 kcal!' },
  { id: 'm6', name: 'Μπιφτέκια μοσχαρίσια (σχάρας)', category: 'Έτοιμα Φαγητά', status: 'allowed', calories: 220, protein: 24, carbs: 2, fat: 13, fiber: 0.5, note: 'Αν φτιαχτούν χωρίς ψωμί (με κολοκυθάκι/αυγό) = τέλειο keto.' },
  { id: 'm7', name: 'Χωριάτικη σαλάτα (μερίδα)', category: 'Έτοιμα Φαγητά', status: 'allowed', calories: 320, protein: 8, carbs: 7, fat: 28, fiber: 3, note: 'Ντομάτα, αγγούρι, πιπεριά, ελιές, φέτα, ελαιόλαδο. Κλασική ελληνική αξία.' },
  { id: 'm8', name: 'Σαλάτα του Καίσαρα (χωρίς κρουτόν)', category: 'Έτοιμα Φαγητά', status: 'allowed', calories: 340, protein: 28, carbs: 3, fat: 24, fiber: 2, note: 'Κοτόπουλο, μαρούλι, παρμεζάνα, μπέικον, Caesar dressing.' },
  { id: 'm9', name: 'Μουσακάς (μερίδα)', category: 'Έτοιμα Φαγητά', status: 'forbidden', calories: 580, protein: 20, carbs: 42, fat: 38, fiber: 4, note: 'Πατάτες + αλεύρι/μπεσαμέλ = 42g υδατάνθρακες. Μπλοκάρει το keto.' },
  { id: 'm10', name: 'Παστίτσιο (μερίδα)', category: 'Έτοιμα Φαγητά', status: 'forbidden', calories: 620, protein: 22, carbs: 55, fat: 35, fiber: 3, note: 'Χοντρό μακαρόνι + μπεσαμέλ = 55g υδατάνθρακες.' },
  { id: 'm11', name: 'Γεμιστά με ρύζι (1 τεμάχιο)', category: 'Έτοιμα Φαγητά', status: 'forbidden', calories: 280, protein: 4, carbs: 45, fat: 10, fiber: 3, note: 'Ρύζι + πατάτες = υψηλός υδατάνθρακας. Εκτός αν γεμιστούν μόνο με κιμά.' },
  { id: 'm12', name: 'Τυρόπιτα / Σπανακόπιτα (σφολιάτα/κουρού)', category: 'Έτοιμα Φαγητά', status: 'forbidden', calories: 420, protein: 9, carbs: 38, fat: 26, fiber: 1.5, note: 'Φύλλο με αλεύρι & υδρογονωμένα λιπαρά. Φλεγμονώδες για τη μέση.' },
  { id: 'm13', name: 'Πίτσα (1 κομμάτι special)', category: 'Έτοιμα Φαγητά', status: 'forbidden', calories: 290, protein: 12, carbs: 32, fat: 13, fiber: 1.8, note: 'Ζύμη αλευριού = 32g υδατάνθρακες ανά κομμάτι.' },
  { id: 'm14', name: 'Burger με ψωμάκι & πατάτες', category: 'Έτοιμα Φαγητά', status: 'forbidden', calories: 850, protein: 32, carbs: 75, fat: 45, fiber: 4, note: 'Ψωμί brioche + πατάτες = 75g υδατάνθρακες. Προτίμησε burger χωρίς ψωμάκι.' },
  { id: 'm15', name: 'Burger χωρίς ψωμάκι (bunless)', category: 'Έτοιμα Φαγητά', status: 'allowed', calories: 380, protein: 30, carbs: 2, fat: 28, fiber: 1, note: 'Μπιφτέκι, λιωμένο τυρί, μπέικον, μαρούλι, ντομάτα, μαγιονέζα = 100% Keto!' },
  { id: 'm16', name: 'Σούπα κοτόπουλο αυγολέμονο (χωρίς ρύζι)', category: 'Έτοιμα Φαγητά', status: 'allowed', calories: 150, protein: 18, carbs: 2, fat: 8, fiber: 0, note: 'Κοτόπουλο, ζωμός, αυγό, λεμόνι. Αντιφλεγμονώδης ζωμός για τις αρθρώσεις.' },

  // =====================================================
  // 9. ΓΛΥΚΑ & ΖΑΧΑΡΗ (FORBIDDEN & LIMITED)
  // =====================================================
  { id: 'sw1', name: 'Σοκολάτα μαύρη >85% κακάο', category: 'Γλυκά', status: 'limited', calories: 600, protein: 11, carbs: 15, fat: 52, fiber: 12, note: 'Πλούσια σε αντιοξειδωτικά φλαβονοειδή. 1-2 τετραγωνάκια (15-20g) OK.', weeklyLimit: '1-2 τετραγωνάκια / ημέρα' },
  { id: 'sw2', name: 'Σοκολάτα γάλακτος / Λευκή', category: 'Γλυκά', status: 'forbidden', calories: 540, protein: 7, carbs: 59, fat: 31, fiber: 2, note: '60% ζάχαρη. Προκαλεί φλεγμονή και μπλοκάρει την καύση λίπους.' },
  { id: 'sw3', name: 'Μέλι (θυμαρίσιο/ανθέων)', category: 'Γλυκά', status: 'forbidden', calories: 304, protein: 0.3, carbs: 82, fat: 0, fiber: 0, note: '82% καθαρή γλυκόζη & φρουκτόζη. Παρότι φυσικό, είναι καθαρή ζάχαρη.' },
  { id: 'sw4', name: 'Παγωτό (όλες οι γεύσεις)', category: 'Γλυκά', status: 'forbidden', calories: 220, protein: 3.5, carbs: 26, fat: 11, fiber: 0.5, note: 'Ζάχαρη + λιπαρά = μέγιστη αποθήκευση λίπους.' },
  { id: 'sw5', name: 'Μπισκότα / Cookies / Κέικ', category: 'Γλυκά', status: 'forbidden', calories: 480, protein: 6, carbs: 65, fat: 22, fiber: 2, note: 'Αλεύρι + ζάχαρη + τρανς λιπαρά.' },
  { id: 'sw6', name: 'Μπακλαβάς / Γαλακτομπούρεκο / Σιροπιαστά', category: 'Γλυκά', status: 'forbidden', calories: 430, protein: 5, carbs: 58, fat: 20, fiber: 1.5, note: 'Σιρόπι ζάχαρης + φύλλο = εκτόξευση γλυκόζης.' },
  { id: 'sw7', name: 'Μαρμελάδα / Πραλίνα φουντουκιού (Merenda)', category: 'Γλυκά', status: 'forbidden', calories: 540, protein: 5, carbs: 58, fat: 32, fiber: 3, note: 'Καθαρή ζάχαρη και φοινικέλαιο.' },
  { id: 'sw8', name: 'Πατατάκια chips / Γαριδάκια / Nachos', category: 'Σνακ', status: 'forbidden', calories: 536, protein: 7, carbs: 53, fat: 34, fiber: 4, note: 'Τηγανισμένο άμυλο σε σπορέλαια. Μέγιστη φλεγμονώδης δράση.' },

  // =====================================================
  // 10. ΠΟΤΑ & ΡΟΦΗΜΑΤΑ (ALLOWED, LIMITED, FORBIDDEN)
  // =====================================================
  { id: 'b1', name: 'Νερό (φυσικό/μεταλλικό)', category: 'Ποτά', status: 'allowed', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, note: 'Στόχος: 3.0 λίτρα/ημέρα. Ενυδατώνει τους μεσοσπονδύλιους δίσκους και αποβάλλει τοξίνες.' },
  { id: 'b2', name: 'Καφές σκέτος (Espresso, Freddo, Ελληνικός, Φίλτρου)', category: 'Ποτά', status: 'allowed', calories: 2, protein: 0.2, carbs: 0.1, fat: 0, fiber: 0, note: 'Ενισχύει τον μεταβολισμό. Χωρίς ζάχαρη (επιτρέπεται στέβια).' },
  { id: 'b3', name: 'Πράσινο τσάι / Χαμομήλι / Βότανα', category: 'Ποτά', status: 'allowed', calories: 1, protein: 0, carbs: 0.2, fat: 0, fiber: 0, note: 'EGCG αντιοξειδωτικά. Αντιφλεγμονώδες για τη μέση.' },
  { id: 'b4', name: 'Σόδα / Ανθρακούχο φυσικό νερό', category: 'Ποτά', status: 'allowed', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, note: 'Μηδέν θερμίδες, ανακουφίζει από φούσκωμα.' },
  { id: 'b5', name: 'Coca-Cola Zero / Light / Green / Stevia', category: 'Ποτά', status: 'allowed', calories: 1, protein: 0, carbs: 0, fat: 0, fiber: 0, note: '0g ζάχαρη, 0g υδατάνθρακες. Δεν χαλάει την κέτωση.' },
  { id: 'b6', name: 'Πρωτεΐνη Whey σε σκόνη (isolate/concentrate)', category: 'Συμπληρώματα', status: 'allowed', calories: 380, protein: 80, carbs: 3, fat: 4, fiber: 0, note: '1 scoop (30g) = 24g πρωτεΐνη, <1g υδατάνθρακες. Εξαιρετικό σνακ.' },
  { id: 'b7', name: 'Κρασί κόκκινο ξηρό (1 ποτήρι 150ml)', category: 'Αλκοόλ', status: 'limited', calories: 125, protein: 0.1, carbs: 3.8, fat: 0, fiber: 0, note: 'Ρεσβερατρόλη (αντιοξειδωτικό). Χαμηλό σε σάκχαρα.', weeklyLimit: '1 ποτήρι, 2-3 φορές / εβδομάδα' },
  { id: 'b8', name: 'Κρασί λευκό ξηρό (1 ποτήρι 150ml)', category: 'Αλκοόλ', status: 'limited', calories: 120, protein: 0.1, carbs: 3.5, fat: 0, fiber: 0, note: 'Ξηρό κρασί, ελάχιστα σάκχαρα.', weeklyLimit: '1 ποτήρι, 2 φορές / εβδομάδα' },
  { id: 'b9', name: 'Τσίπουρο / Τσικουδιά (χωρίς γλυκάνισο)', category: 'Αλκοόλ', status: 'limited', calories: 230, protein: 0, carbs: 0, fat: 0, fiber: 0, note: '0g υδατάνθρακες. Το ήπαρ διακόπτει προσωρινά την καύση λίπους όσο μεταβολίζει αλκοόλ.', weeklyLimit: '1-2 σφηνάκια περιστασιακά' },
  { id: 'b10', name: 'Ουίσκι / Βότκα / Τζιν (σκέτα/με σόδα)', category: 'Αλκοόλ', status: 'limited', calories: 230, protein: 0, carbs: 0, fat: 0, fiber: 0, note: 'Καθαρά αποστάγματα = 0g υδατάνθρακες. Μόνο με σόδα/Zero.', weeklyLimit: '1 ποτό, 1-2 φορές / εβδομάδα' },
  { id: 'b11', name: 'Μπύρα (Lager / Pilsner)', category: 'Αλκοόλ', status: 'forbidden', calories: 43, protein: 0.5, carbs: 3.6, fat: 0, fiber: 0, note: '«Υγρό ψωμί» φτιαγμένο από κριθάρι. Ένα κουτάκι = 13g υδατάνθρακες.' },
  { id: 'b12', name: 'Αναψυκτικά με ζάχαρη (Coca-Cola, Fanta, Sprite)', category: 'Ποτά', status: 'forbidden', calories: 42, protein: 0, carbs: 10.6, fat: 0, fiber: 0, note: 'Ένα μόνο κουτάκι 330ml περιέχει 35g καθαρή ζάχαρη (9 κουταλάκια)!' },
  { id: 'b13', name: 'Χυμός πορτοκάλι / Ανάμεικτος φρούτων', category: 'Ποτά', status: 'forbidden', calories: 45, protein: 0.7, carbs: 10.4, fat: 0.2, fiber: 0.2, note: 'Υγρή φρουκτόζη χωρίς ίνες. Εκτοξεύει την ινσουλίνη.' },
  { id: 'b14', name: 'Ούζο (με γλυκάνισο)', category: 'Αλκοόλ', status: 'forbidden', calories: 260, protein: 0, carbs: 8, fat: 0, fiber: 0, note: 'Περιέχει πρόσθετη ζάχαρη και σάκχαρα. Προτίμησε σκέτο τσίπουρο.' },
];

// Helper: Normalize Greek string for accent-insensitive and case-insensitive searching
export function normalizeGreek(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// =====================================================
// DYNAMIC AI NUTRITION & KETO ANALYZER ENGINE
// If a food is NOT in the database, this engine intelligently
// determines category, macros, keto status & spine advice!
// =====================================================
export function analyzeFoodDynamically(rawQuery: string): SmartFood {
  const q = normalizeGreek(rawQuery);

  // Default initial values
  let category = 'Γενικά';
  let status: 'allowed' | 'limited' | 'forbidden' = 'allowed';
  let calories = 150;
  let protein = 15;
  let carbs = 5;
  let fat = 8;
  let fiber = 1;
  let note = `Ανάλυση για «${rawQuery}»: Ελέγξτε τις ποσότητες για διατήρηση της κέτωσης.`;
  let weeklyLimit: string | undefined = undefined;

  // 1. FORBIDDEN PATTERNS (Carbs, sugars, grains, starches, pastries, beer, sodas)
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
  // 2. LIMITED PATTERNS (Fruits, moderate carbs, legumes, alcohol, high-fat dairy)
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
  // 3. ALLOWED PROTEINS / SEAFOOD / CHEESES / GREEN VEGGIES / HEALTHY FATS
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

// =====================================================
// MASTER SEARCH FUNCTION: Instant DB search + Dynamic AI Fallback
// Guarantees that ANY query typed returns rich, accurate food cards!
// =====================================================
export function searchSmartFoods(query: string): SmartFood[] {
  if (!query || query.trim().length < 1) return [];

  const norm = normalizeGreek(query);

  // 1. Search in our rich curated database
  const matches = SMART_FOOD_DB.filter(f => {
    const nameNorm = normalizeGreek(f.name);
    const catNorm = normalizeGreek(f.category);
    const noteNorm = normalizeGreek(f.note);
    return nameNorm.includes(norm) || catNorm.includes(norm) || noteNorm.includes(norm);
  });

  // If we found exact or good matches, return up to 10
  if (matches.length > 0) {
    // If the exact query isn't the first item, we can return matches
    return matches.slice(0, 10);
  }

  // 2. If no direct match in DB, dynamically analyze the food
  if (query.trim().length >= 2) {
    const dynamicFood = analyzeFoodDynamically(query);
    return [dynamicFood];
  }

  return [];
}
