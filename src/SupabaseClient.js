import { createClient } from "@supabase/supabase-js";

const supabaseURL = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only create the client when env vars are present so the app doesn't crash
const supabase =
  supabaseURL && supabaseAnonKey
    ? createClient(supabaseURL, supabaseAnonKey, {
        realtime: { params: { eventsPerSecond: 10 } },
      })
    : null;

export default supabase;
