import { createClient } from
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ใช้ Project URL และ Publishable key ของโปรเจกต์คุณ
const SUPABASE_URL = 'https://mmtedrsusocwlvbrtrhw.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_GnCwJKsyaasEW3M9-xR4EA_n2adjP9k';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
