import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { GoogleGenAI, Type } from "@google/genai";

const M2_SYSTEM_PROMPT = `Você é M2, um assistente de atendimento virtual especializado para uma empresa de venda de soluções em plásticos. Seu papel é:1. Receber mensagens de clientes via WhatsApp e respondê-las de forma ágil e cordial.2. Analisar a necessidade do cliente e oferecer as melhores soluções em produtos plásticos.3. Identificar quando é necessário transferir a conversa para um atendente humano (especialmente para compras de grande volume, orçamentos complexos ou reclamações).4. Manter um tom profissional, empático e orientada a soluções.Respostas: Suas respostas devem ser em JSON com o formato:{"resumo": "texto da resposta ao cliente", "status": true/false, "tipo": "categoria"}`;

type AIResponse = { resumo: string; status: boolean; tipo: string };

async function processCustomerMessage(
  history: { role: string; content: string }[],
  latestMessage: string,
  customSettings?: { rules?: string; persona?: string }
): Promise<AIResponse | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  try {
    const contents = history.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));
    contents.push({ role: "user", parts: [{ text: latestMessage }] });

    let extraPrompt = "";
    if (customSettings?.rules) extraPrompt += `\n<regras_adicionais>\n${customSettings.rules}\n</regras_adicionais>`;
    if (customSettings?.persona) extraPrompt += `\nO Tonalidade da IA deve ser adaptada para: ${customSettings.persona}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: M2_SYSTEM_PROMPT + extraPrompt,
        responseMimeType: "application/json",
        responseSchema: { type: Type.OBJECT, properties: { resumo: { type: Type.STRING }, status: { type: Type.BOOLEAN }, tipo: { type: Type.STRING } }, required: ["resumo", "status", "tipo"] },
      },
    });
    if (response.text) return JSON.parse(response.text);
    return null;
  } catch (error) {
    console.error("Erro AI:", error);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
    if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: "Missing DB" });

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const infos = body?.infos?.chat || body?.chat;

    if (!infos) return res.status(400).json({ error: "Invalid payload" });

    const text = infos.last_message?.content?.text || "";
    const smclick_id = infos.contact?.id || "";
    const telefone = infos.contact?.telephone || "";
    const fromMe = infos.last_message?.from_me || false;

    if (!smclick_id) return res.status(400).json({ error: "Missing contact id" });

    let { data: session } = await supabase.from("smclick_sessions").select("*").eq("smclick_id", smclick_id).maybeSingle();

    if (!session) {
      const { data: newSession } = await supabase.from("smclick_sessions").insert({ smclick_id, phone: telefone, is_human_attending: false }).select().single();
      session = newSession;
    }
    if (!session) return res.status(500).json({ error: "Failed to create session" });

    const role = fromMe ? "human" : "user";
    await supabase.from("smclick_messages").insert({ session_id: session.id, role, content: text });

    if (fromMe || session.is_human_attending) return res.status(200).json({ status: "success", message: "Recorded" });

    const { data: historyData } = await supabase.from("smclick_messages").select("role, content").eq("session_id", session.id).order("created_at", { ascending: false }).limit(15);
    const pastMessages = historyData ? historyData.reverse().slice(0, -1) : [];

    const { data: config } = await supabase.from("system_config").select("*").eq("id", "primary").maybeSingle();

    const aiRes = await processCustomerMessage(pastMessages as any, text, { rules: config?.agent_rules, persona: config?.agent_persona });

    if (aiRes) {
      await supabase.from("smclick_messages").insert({ session_id: session.id, role: "bot", content: aiRes.resumo });

      const smclickApikey = config?.smclick_api_key || process.env.SMCLICK_API_KEY || "";
      const headers = { "Content-Type": "application/json", "x-api-key": smclickApikey };

      await axios.post("https://api.smclick.com.br/instances/messages", {
        instance: "ea1d582a-823b-43d3-9aa4-900c65d332ff",
        type: "text",
        content: { telephone: telefone, message: aiRes.resumo }
      }, { headers }).catch(e => console.error("Erro SMClick:", e?.response?.data || e.message));

      if (aiRes.tipo === "plástico") {
        await axios.post("https://api.smclick.com.br/instances/messages", {
          attendant: "4f4e4a0e-be63-47e2-9896-5b0aa0dbd6c",
          department: "236551cc-4af3-4026-8e1c-c51928ff9f9b"
        }, { headers }).catch(e => console.error("Erro Transbordo:", e?.response?.data || e.message));
      }

      if (aiRes.status) await supabase.from("smclick_sessions").update({ is_human_attending: true }).eq("id", session.id);

      return res.status(200).json({ status: "success", ai_response: aiRes });
    }

    return res.status(500).json({ error: "No response from AI" });

  } catch (error: any) {
    console.error("Webhook error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
