import { createClient } from "@supabase/supabase-js";

let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log("⚙️ Supabase init - URL:", supabaseUrl || "undefined", "Key length:", supabaseServiceKey ? supabaseServiceKey.length : 0);

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn("⚠️ Supabase admin client requested but credentials are missing in env! Using placeholder client.");
      return createClient(
        supabaseUrl || "http://placeholder",
        supabaseServiceKey || "placeholder"
      );
    }

    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey);
  }

  return supabaseAdminInstance;
}
