import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cron from "node-cron";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";
import { processCustomerMessage } from "./src/lib/gemini";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Supabase Client Initialization
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("CRITICAL: SUPABASE_URL or SUPABASE_ANON_KEY not found in environment variables.");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Helper to map DB snake_case to Frontend camelCase
  const mapConfigToFrontend = (dbConfig: any) => ({
    supabaseUrl: dbConfig.supabase_url || "",
    supabaseKey: dbConfig.supabase_key || "",
    nectarApiKey: dbConfig.nectar_api_key || "",
    smclickApiKey: dbConfig.smclick_api_key || "",
    smclickUrl: dbConfig.smclick_api_url || "",
    smtpHost: dbConfig.smtp_host || "",
    smtpPort: dbConfig.smtp_port || "587",
    smtpUser: dbConfig.smtp_user || "",
    smtpPass: dbConfig.smtp_pass || "",
    imapHost: dbConfig.imap_host || "",
    imapPort: dbConfig.imap_port || "993",
    imapUser: dbConfig.imap_user || "",
    imapPass: dbConfig.imap_pass || "",
  });

  // Helper to map Frontend camelCase to DB snake_case
  const mapConfigToDB = (feConfig: any) => ({
    id: 'primary',
    supabase_url: feConfig.supabaseUrl,
    supabase_key: feConfig.supabaseKey,
    nectar_api_key: feConfig.nectarApiKey,
    smclick_api_key: feConfig.smclickApiKey,
    smclick_api_url: feConfig.smclickUrl,
    smtp_host: feConfig.smtpHost,
    smtp_port: feConfig.smtpPort,
    smtp_user: feConfig.smtpUser,
    smtp_pass: feConfig.smtpPass,
    imap_host: feConfig.imapHost,
    imap_port: feConfig.imapPort,
    imap_user: feConfig.imapUser,
    imap_pass: feConfig.imapPass,
    updated_at: new Date().toISOString()
  });

  app.post("/api/config", async (req, res) => {
    const dbPayload = mapConfigToDB(req.body);
    const { data, error } = await supabase
      .from("system_config")
      .upsert(dbPayload)
      .select()
      .single();

    if (error) {
      console.error("Error saving config to Supabase:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
    
    res.json({ success: true, config: mapConfigToFrontend(data) });
  });

  app.get("/api/config", async (req, res) => {
    const { data, error } = await supabase
      .from("system_config")
      .select("*")
      .eq("id", "primary")
      .maybeSingle();

    if (error) {
      console.error("Error fetching config from Supabase:", error);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      // Return default empty config if not found
      return res.json(mapConfigToFrontend({}));
    }

    res.json(mapConfigToFrontend(data));
  });

  app.get("/api/whatsapp-numbers", async (req, res) => {
    const { data, error } = await supabase
      .from("whatsapp_numbers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching numbers from Supabase:", error);
      // Return empty array on error but log it
      return res.json([]);
    }

    if (!data || data.length === 0) {
      // Fallback to static data if table is empty (optional, but better to show real empty state)
      return res.json([]);
    }

    res.json(data.map((n: any) => ({
      id: n.id,
      number: n.number,
      status: n.status,
      user: n.user_name
    })));
  });

  // --- M2 IA SMClick Webhook & Rotas de Dashboard ---

  app.post("/api/webhook/smclick", async (req, res) => {
    try {
      const infos = req.body?.infos?.chat;
      if (!infos) return res.status(400).send("Invalid payload");

      const text = infos.last_message?.content?.text || "";
      const smclick_id = infos.contact?.id || "";
      const telefone = infos.contact?.telephone || "";
      const fromMe = infos.last_message?.from_me || false;

      if (!smclick_id) return res.status(400).send("Missing contact id");

      // Obter ou criar sessão
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

      if (!session) return res.status(500).send("Failed to create session");

      // Salvar a mensagem no DB
      const role = fromMe ? "human" : "user";
      await supabase.from("smclick_messages").insert({
        session_id: session.id,
        role: role,
        content: text
      });

      // Dar Baixa Imediata no Requester (SMClick Gateway)
      res.status(200).send("Received");

      // Regra: se o bot/humano que enviou OU se um humano assumiu o chat, não acionar IA
      if (fromMe || session.is_human_attending) return;

      // Buscar as últimas 15 mensagens para contexto
      const { data: historyData } = await supabase
        .from("smclick_messages")
        .select("role, content")
        .eq("session_id", session.id)
        .order("created_at", { ascending: false })
        .limit(15);
      
      const pastMessages = historyData ? historyData.reverse().slice(0, -1) : [];
      const aiRes = await processCustomerMessage(pastMessages as any, text);

      if (aiRes) {
        await supabase.from("smclick_messages").insert({
          session_id: session.id,
          role: "bot",
          content: aiRes.resumo
        });

        const { data: config } = await supabase.from("system_config").select("smclick_api_key").eq("id", "primary").maybeSingle();
        const smclickApikey = config?.smclick_api_key || process.env.SMCLICK_API_KEY || "";

        const headers = { 
          "Content-Type": "application/json", 
          "x-api-key": smclickApikey 
        };

        // Enviar reposta via API Oficial SMClick
        await axios.post("https://api.smclick.com.br/instances/messages", {
           instance: "ea1d582a-823b-43d3-9aa4-900c65d332ff",
           type: "text",
           content: {
             telephone: telefone,
             message: aiRes.resumo
           }
        }, { headers }).catch(e => console.error("Erro envio SMS/SMCLick:", e?.response?.data || e.message));

        if (aiRes.status) {
          // IA sinalizou para transferir/concluir
          await supabase.from("smclick_sessions").update({ is_human_attending: true }).eq("id", session.id);
        }

        if (aiRes.tipo === "plástico") {
          // POST para departamento
          await axios.post("https://api.smclick.com.br/instances/messages", {
             attendant: "4f4e4a0e-be63-47e2-9896-5b0aa0dbd6c",
             department: "236551cc-4af3-4026-8e1c-c51928ff9f9b"
          }, { headers }).catch(e => console.error("Erro transbordo de departamento:", e?.response?.data || e.message));
        }
      }

    } catch (error) {
      console.error("Webhook processing error", error);
      // fallback fail, res ja deve ter sido eviado se quebrou depois (mas previne pending caso quebre antes)
      if (!res.headersSent) res.status(500).send("Error");
    }
  });

  app.get("/api/smclick-sessions", async (req, res) => {
    const { data, error } = await supabase
      .from("smclick_sessions")
      .select(\`
        id, smclick_id, phone, is_human_attending, created_at, updated_at,
        smclick_messages (
          content, created_at, role
        )
      \`)
      .order("updated_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.get("/api/smclick-sessions/:id/messages", async (req, res) => {
    const { data, error } = await supabase
      .from("smclick_messages")
      .select("*")
      .eq("session_id", req.params.id)
      .order("created_at", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.post("/api/smclick-sessions/:id/assume", async (req, res) => {
    const { error } = await supabase.from("smclick_sessions").update({ is_human_attending: true }).eq("id", req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  // CRON JOB: 05:00 AM Daily
  cron.schedule("0 5 * * *", async () => {
    console.log("Running daily CRM sync at 05:00 AM");
    
    // Fetch latest config for the cron job
    const { data: dbConfig } = await supabase
      .from("system_config")
      .select("*")
      .eq("id", "primary")
      .maybeSingle();

    if (!dbConfig) return;

    const today = format(new Date(), "yyyy-MM-dd");

    const { data: contacts, error } = await supabase
      .from("contatos")
      .select("*")
      .eq("data_fechamento", today);

    if (error) {
      console.error("Error fetching contacts from Supabase:", error);
      return;
    }

    if (contacts && contacts.length > 0) {
      console.log(`Found ${contacts.length} contacts for today.`);
      // Message scheduling logic here
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
