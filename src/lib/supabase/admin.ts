import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

// Service-role client: bypasses RLS entirely. Admin routes and server actions only —
// the `server-only` import makes this a build error if ever pulled into client code.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
