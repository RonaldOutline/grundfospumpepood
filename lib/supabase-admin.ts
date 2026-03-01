import { createClient } from '@supabase/supabase-js'

// Server-side admin client — möödub RLS reeglitest.
// Kasuta ainult server-side koodis (API routes), mitte kliendipoolses koodis.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
