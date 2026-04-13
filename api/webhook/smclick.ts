import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { processCustomerMessage } from '../../src/lib/gemini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Basics
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase credentials");
      return res.status(500).json({ error: "Missing Supabase credentials in Vercel Env" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const infos = body?.infos?.chat || body?.chat; // fallback para flexibilidade do body

    if (!infos) {
      return res.status(400).json({ error: "Invalid payload: missing infos.chat" });
    }

    const text = infos.last_message?.content?.text || "";
    const smclick_id = infos.contact?.id || "";
    const telefone = infos.contact?.telephone || "";
    const fromMe = infos.last_message?.from_me || false;

    if (!smclick_id) return res.status(400).json({ error: "Missing contact id" });

    // 1. Obter ou criar sessão
    let { data: session } = await supabase
      .from("smclick_sessions")
      .select("*")
      .eq("smclick_id", smclick_id)
      .maybeSingle();

    if (!session) {
      const { data: newSession } = await supabase
        .from("smclick_sessions")
        .insert({ smclick_id, phone: telefone, is_human_attending: false })
        .select()
        .single();
      session = newSession;
    }

    if (!session) return res.status(500).json({ error: "Failed to create session" });

    // 2. Salvar log de que o usuário enviou
    const role = fromMe ? "human" : "user";
    await supabase.from("smclick_messages").insert({
      session_id: session.id,
      role: role,
      content: text
    });

    // Se o humano respondeu OU estava atendendo antes, não chama a IA.
    if (fromMe || session.is_human_attending) {
      return res.status(200).json({ status: "success", message: "Recorded (No AI action)" });
    }

    // 3. Buscar histórico para a IA ter contexto da conversa atual
    const { data: historyData } = await supabase
      .from("smclick_messages")
      .select("role, content")
      .eq("session_id", session.id)
      .order("created_at", { ascending: false })
      .limit(15);
    
    // re-ordena o tempo do mais velho pro mais novo
    const pastMessages = historyData ? historyData.reverse().slice(0, -1) : [];
    
    // 4. Buscar configs adicionais de Personalidade e API
    const { data: config } = await supabase.from("system_config").select("*").eq("id", "primary").maybeSingle();
    const customRules = config?.agent_rules;
    const customPersona = config?.agent_persona;

    // 5. Aciona AI
    const aiRes = await processCustomerMessage(pastMessages as any, text, { rules: customRules, persona: customPersona });

    if (aiRes) {
      // Registrar no bd
      await supabase.from("smclick_messages").insert({
        session_id: session.id,
        role: "bot",
        content: aiRes.resumo
      });

      const smclickApikey = config?.smclick_api_key || process.env.SMCLICK_API_KEY || "";

      const headers = { 
        "Content-Type": "application/json", 
        "x-api-key": smclickApikey 
      };

      // POST da Resposta ao SMClick
      await axios.post("https://api.smclick.com.br/instances/messages", {
         instance: "ea1d582a-823b-43d3-9aa4-900c65d332ff",
         type: "text",
         content: {
           telephone: telefone,
           message: aiRes.resumo
         }
      }, { headers }).catch(e => console.error("Erro envio API SMClick:", e?.response?.data || e.message));

      // POST do Departamento de Plástico se necessário
      if (aiRes.tipo === "plástico") {
        await axios.post("https://api.smclick.com.br/instances/messages", {
           attendant: "4f4e4a0e-be63-47e2-9896-5b0aa0dbd6c",
           department: "236551cc-4af3-4026-8e1c-c51928ff9f9b"
        }, { headers }).catch(e => console.error("Erro Transbordo API SMClick:", e?.response?.data || e.message));
      }

      // Se a IA julgou que devia passar por humano
      if (aiRes.status) {
        await supabase.from("smclick_sessions").update({ is_human_attending: true }).eq("id", session.id);
      }

      return res.status(200).json({ status: "success", ai_response: aiRes });
    }

    return res.status(500).json({ error: "No response from AI" });

  } catch (error: any) {
    console.error("Webhook processing error", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
