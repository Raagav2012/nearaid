import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Paste your two values from Supabase: Project Settings > API
const SUPABASE_URL = 'https://hkumjlipvadeituwysdn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vz9M81tc6jENq-uWA7945A_VyPUm5Ue';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
