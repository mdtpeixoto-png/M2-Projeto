import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'GET') {
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
    if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: "Missing DB" });
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from("smclick_sessions")
      .select(`
        id, smclick_id, phone, is_human_attending, created_at, updated_at,
        smclick_messages (
          content, created_at, role
        )
      `)
      .order("updated_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
