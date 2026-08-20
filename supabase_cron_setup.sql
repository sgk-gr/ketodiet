-- ==========================================================
-- SUPABASE NATIVE PG_CRON & PG_NET SETUP FOR SPIROS TELEGRAM BOT
-- Execute this SQL in Supabase SQL Editor: https://supabase.com/dashboard/project/xrmvingehhiymchoggka/sql
-- ==========================================================

-- 1. Enable required native extensions
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- 2. Create the Telegram Reminder Dispatcher Function
CREATE OR REPLACE FUNCTION spiros_send_telegram_reminder()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token TEXT := '8603311936:AAG1e-zxKzU48elsr-t7dGyvQCSfvt0E32g';
    v_chat_id BIGINT := 8162958857;
    v_athens_time TIMESTAMP := now() AT TIME ZONE 'Europe/Athens';
    v_hour INT := EXTRACT(HOUR FROM v_athens_time);
    v_today DATE := (v_athens_time)::DATE;
    v_water INT := 0;
    v_message TEXT;
    v_url TEXT;
    v_body JSONB;
BEGIN
    -- Fetch today's water from spiros_daily_logs
    SELECT COALESCE(water_ml, 0)
    INTO v_water
    FROM spiros_daily_logs
    WHERE date = v_today;

    IF v_water IS NULL THEN
        v_water := 0;
    END IF;

    -- Select appropriate message based on Athens hour
    IF v_hour >= 8 AND v_hour < 11 THEN
        -- 09:00 Morning Water & Fasting
        v_message := '🌅 <b>Καλημέρα Σπύρο! (Πρωινή Ενυδάτωση)</b>' || E'\n\n' ||
                     'Είσαι στη φάση της πρωινής νηστείας (καύση λίπους).' || E'\n\n' ||
                     '💧 <b>Πιες 500ml δροσερό νερό τώρα:</b>' || E'\n' ||
                     'Οι μεσοσπονδύλιοι δίσκοι της μέσης χρειάζονται ενυδάτωση για απορρόφηση κραδασμών.' || E'\n\n' ||
                     '• Νερό σήμερα: <b>' || v_water || 'ml / 3000ml</b>' || E'\n\n' ||
                     '<i>(Γράψε μου <code>ήπια 500ml</code> μόλις το πιεις!)</i>';

    ELSIF v_hour >= 11 AND v_hour < 14 THEN
        -- 12:00 Lunch Window
        v_message := '🍽️ <b>Άνοιξε το Παράθυρο Φαγητού (12:00 - 20:00)!</b>' || E'\n\n' ||
                     'Ώρα για το 1ο γεύμα της ημέρας:' || E'\n' ||
                     '• Καθαρή πρωτεΐνη (κοτόπουλο, μοσχάρι, ψάρι, αυγά).' || E'\n' ||
                     '• Πράσινη σαλάτα (μαρούλι, αγγούρι, σπαράγγια).' || E'\n' ||
                     '• Μηδέν ψωμί και υδατάνθρακες.' || E'\n\n' ||
                     '• Νερό μέχρι τώρα: <b>' || v_water || 'ml / 3000ml</b>' || E'\n\n' ||
                     '<i>(Στείλε μου τι έφαγες, π.χ. <code>200g κοτόπουλο με σαλάτα</code>)</i>';

    ELSIF v_hour >= 14 AND v_hour < 18 THEN
        -- 15:30 Afternoon Movement & Hydration
        v_message := '🚴 <b>Απογευματινό Check Σπύρο!</b>' || E'\n\n' ||
                     '💧 <b>Ενυδάτωση:</b> <b>' || v_water || 'ml / 3000ml</b>' || E'\n\n' ||
                     '🩺 <b>Κίνηση για τη Μέση:</b>' || E'\n' ||
                     '• 15-20 λεπτά στατικό ποδήλατο με πλάτη ή περπάτημα σε ίσιο έδαφος.' || E'\n' ||
                     '• Απαγορεύονται τα άλματα και το τρέξιμο.' || E'\n\n' ||
                     '<i>(Πιες άλλο 1 ποτήρι νερό και γράψε: <code>ήπια 300ml</code>)</i>';

    ELSIF v_hour >= 18 AND v_hour < 21 THEN
        -- 19:30 Dinner Warning
        v_message := '⏰ <b>Πλησιάζει το Κλείσιμο της Κουζίνας (20:00)!</b>' || E'\n\n' ||
                     'Φάε το βραδινό σου πριν τις 20:00 (π.χ. σολομό, τόνο ή ομελέτα με λαχανικά).' || E'\n' ||
                     'Από τις 20:00 ξεκινάει η 16ωρη νυχτερινή νηστεία.' || E'\n\n' ||
                     '• Σημερινό νερό: <b>' || v_water || 'ml / 3000ml</b>' || E'\n\n' ||
                     '<i>(Στείλε μου το βραδινό σου για να κλείσουμε την ημέρα!)</i>';

    ELSE
        -- 21:30 Evening Wrap-up
        v_message := '🌙 <b>Βραδινός Απολογισμός Σπύρο!</b>' || E'\n\n' ||
                     'Η κουζίνα έκλεισε επιτυχώς για σήμερα.' || E'\n\n' ||
                     '• Νερό: <b>' || v_water || 'ml / 3000ml</b>' || E'\n\n' ||
                     'Καλή ξεκούραση και αποφόρτιση στη μέση σου. Αύριο συνεχίζουμε δυναμικά!';
    END IF;

    v_url := 'https://api.telegram.org/bot' || v_token || '/sendMessage';
    v_body := jsonb_build_object(
        'chat_id', v_chat_id,
        'text', v_message,
        'parse_mode', 'HTML'
    );

    -- Perform asynchronous HTTP POST via pg_net
    PERFORM net.http_post(
        url := v_url,
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := v_body
    );
END;
$$;

-- 3. Schedule the Cron Jobs (UTC Times matching Athens Time)

-- Delete old jobs if already registered
SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname LIKE 'spiros_%';

-- Schedule 09:00 Athens (06:00 UTC)
SELECT cron.schedule(
    'spiros_morning_water',
    '0 6 * * *',
    'SELECT spiros_send_telegram_reminder();'
);

-- Schedule 12:00 Athens (09:00 UTC)
SELECT cron.schedule(
    'spiros_lunch_window',
    '0 9 * * *',
    'SELECT spiros_send_telegram_reminder();'
);

-- Schedule 15:30 Athens (12:30 UTC)
SELECT cron.schedule(
    'spiros_afternoon_water',
    '30 12 * * *',
    'SELECT spiros_send_telegram_reminder();'
);

-- Schedule 19:30 Athens (16:30 UTC)
SELECT cron.schedule(
    'spiros_dinner_warning',
    '30 16 * * *',
    'SELECT spiros_send_telegram_reminder();'
);

-- Schedule 21:30 Athens (18:30 UTC)
SELECT cron.schedule(
    'spiros_daily_review',
    '30 18 * * *',
    'SELECT spiros_send_telegram_reminder();'
);

-- Test execution immediately right now:
SELECT spiros_send_telegram_reminder();
