import "server-only";
import { createClient } from "@supabase/supabase-js";

// Клиент с service-ролью: обходит RLS. Только для записи кэша каталога на сервере.
export function createAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
