import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// Do not initialize Supabase with undefined values: that can crash the app
// before React renders and leave the browser showing a blank page.
export const supabase = url && key ? createClient(url, key) : null;
export const hasSupabaseConfig = Boolean(url && key);
