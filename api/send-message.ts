import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  try {
    const { session_id, message } = req.body;

    if (!session_id || !message) {
      return res.status(400).json({ error: "session_id e message são obrigatórios" });
    }

    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_ANON_KEY || "";

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: "Missing DB credentials" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: session, error: sessionError } = await supabase
      .from("smclick_sessions")
      .select("*")
      .eq("id", session_id)
      .maybeSingle();

    if (sessionError || !session) {
      return res.status(404).json({ error: "Sessão não encontrada" });
    }

    await supabase.from("smclick_messages").insert({
      session_id,
      role: "human",
      content: message
    });

    await supabase.from("smclick_sessions")
      .update({ is_human_attending: true })
      .eq("id", session_id);

    const { data: config } = await supabase.from("system_config").select("*").eq("id", "primary").maybeSingle();

    const smclickApikey = config?.smclick_api_key || process.env.SMCLICK_API_KEY || "";
    const headers = { "Content-Type": "application/json", "x-api-key": smclickApikey };

    await axios.post("https://api.smclick.com.br/instances/messages", {
      instance: "ea1d582a-823b-43d3-9aa4-900c65d332ff",
      type: "text",
      content: { telephone: session.phone, message }
    }, { headers });

    return res.status(200).json({ status: "success" });

  } catch (error: any) {
    console.error("Send message error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
