import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase.ts';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce', // compatible with HashRouter (uses query params, not fragments)
  },
});

export const siteUrl = import.meta.env.VITE_SITE_URL as string | undefined ?? window.location.origin;
