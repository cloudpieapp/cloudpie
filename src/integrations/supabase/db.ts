import { supabase } from "@/integrations/supabase/client";

/**
 * Untyped view of the Supabase client.
 *
 * `types.ts` is generated from the API schema and can lag behind tables that
 * already exist in the database (e.g. `likes`, `comments`, `stream_sources`).
 * Use this alias for those tables so the app keeps compiling while the
 * generated types catch up.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as any;
