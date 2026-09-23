import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn(
    "Please set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your `.env` file",
  );
}

export const supabase = createClient(
  url ?? "http://localhost",
  key ?? "missing",
);
