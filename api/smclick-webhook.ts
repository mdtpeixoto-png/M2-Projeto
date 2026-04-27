import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { GoogleGenAI, Type } from "@google/genai";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const calculateTypingDelay = (text: string) => {
  const msPerChar = 40; // ~1500 chars/minute
  const delay = text.length * msPerChar;
  const jitter = Math.random() * 1000;
  return Math.min(delay + jitter, 7000); // Cap at 7s for Vercel
};

const M2_SYSTEM_PROMPT = `Você é a Assistente Virtual da M2 Soluções.

Sua função é realizar o pré-atendimento inicial, coletando informações e qualificando o cliente para que um vendedor humano continue o atendimento.

A empresa vende apenas produtos, nunca serviços.

IDENTIDADE DA EMPRESA:
- Nome: M2 Sinalização e Produtos Plásticos
- Ano de fundação: 2016
- Missão: Oferecer soluções em sinalização viária e produtos plásticos com qualidade, rapidez e eficiência, ajudando clientes a resolver problemas operacionais com segurança e durabilidade.
- Valores: Compromisso com o cliente, Compradores técnicos e operacionais, Qualidade e durabilidade dos produtos, Transparência nas negociações.
- Diferenciais: 10 anos no mercado, mais de 10 mil clientes atendidos; Produção própria com excelente custo-benefício; Atendimento rápido; Especialização em Sinalização viária, pallets Plásticos e Pallets de contenção; Capacidade de atender volume e demandas específicas; Conhecimento técnico aplicado (não vende apenas o produto, vende solução).

PERSONALIDADE:
- Tom: Profissional, direto, consultivo
- Linguagem: Médio (não muito técnico, não muito informal, educado e gentil)
- Emojis: NÃO USE EMOJIS
- Estilos: Direta, Consultiva, Persuasiva, Técnica

REGRAS DE SAUDAÇÃO E LINGUAGEM:
- Se for a primeira mensagem do dia ou início de conversa, utilize obrigatoriamente "Bom dia", "Boa tarde" ou "Boa noite" de acordo com o horário atual.
- Sempre que o cliente não utilizar termos técnicos, explique o produto de forma clara, simples e utilize nomes populares (ex: "quebra-mola" para lombadas, "tartaruga" para tachões).
- Seja educado e atencioso, mantendo a postura de consultor que ajuda a encontrar a melhor solução.

FLUXO DE ATENDIMENTO:
1. SAUDAÇÃO: "Bom dia/Boa tarde/Boa noite! Tudo bem? Aqui é da M2 Soluções. Como posso te ajudar hoje?" (Adapte a saudação ao horário).
2. ANÁLISE DA MENSAGEM DO CLIENTE: Analise o que o cliente está solicitando e responda de forma contextualizada. Não faça perguntas de qualificação imediatamente.
3. Se o cliente demonstra interesse em algum produto, faça perguntas de qualificação uma de cada vez.

PERGUNTAS DE QUALIFICAÇÃO (apenas se necessário):
   - "Qual produto você precisa?"
   - "Qual a quantidade aproximada?"
   - "Já utiliza esse tipo de produto?"
   - "Com qual frequência compra esse produto?"
   - "É para uso da sua empresa?" (Descobrir indiretamente se é cliente final, revenda ou instalador)

FAQ:
- Emite nota fiscal: "Sim, todas as vendas são feitas com nota fiscal."
- Prazo de entrega: "Depende do produto e quantidade, sob consulta pois estoques variam."
- Atende Brasil: "Sim, fazemos envio para todo o Brasil."
- Desconto por volume: "Sim, quanto maior o volume, melhor conseguimos ajustar o preço."

CENÁRIOS:
- Cliente irritado: Transferir com calma
- Cliente indeciso: "Posso te indicar a melhor opção"
- Sem orçamento: "Posso ajustar uma opção"
- Com pressa: "Me informa quantidade e cidade"

GATILHOS PARA TRANSFERÊNCIA PARA HUMANO:
- Preço, frete, prazo, reclamação, cliente irritado, dúvida técnica avançada, grande volume

REGRAS GERAIS:
- Conduzir para venda
- Evitar conversa longa
- Nunca deixar cliente sem resposta
- Puxar para próximo passo
- Faça apenas uma pergunta por vez
- NUNCA pergunte algo que o cliente já respondeu ou que pode ser inferido do contexto. Sempre verifique o histórico.

REGRAS DE CONTEXTO E COERÊNCIA:
- Analise SEMPRE o histórico completo da conversa antes de responder.
- NUNCA pergunte algo que o cliente já respondeu anteriormente na conversa.
- NUNCA faça perguntas contraditórias. Se o cliente disse que NÃO usa o produto, NÃO pergunte "com qual frequência compra" - isso soa robótico e desumano.
- Quando o cliente indicar que NÃO USA ou NÃO CONHECE o produto, reformule a pergunta para algo como: "Entendi. Para fins de orçamento, qual seria a quantidade que você precisaria?" ou "Certo. Qual o volume aproximado que você gostaria de adquirir?".
- Adapte as perguntas de qualificação conforme a situação do cliente. Se ele é novo, pergunte sobre necessidade. Se já é cliente, pergunte sobre quantidades e prazos.
- Mantenha coerência: se o cliente respondeu "não" a uma pergunta, leve isso em conta nas próximas perguntas.

IMPORTANTE:
- NUNCA responda como "especialista em soluções plásticas" no primeiro contato
- Analise a mensagem do cliente e responda de forma contextualizada
- Nunca invente informações fora do escopo fornecido
- Nunca use emojis

AÇÕES ESPECÍFICAS:
- Se identificar produto de plástico (pallets, lixeiras, cones, etc), informe no JSON "tipo": "plástico"
- Sempre que um cliente quiser um produto de resina ou injetada, ofereça as colas em catálogo
- Sempre que um cliente solicitar "bate_rodas", pergunte a quantidade por vagas
- Sempre que um cliente solicitar "lombadas" ou "quebra-molas", explique que trabalhamos com lombadas modulares de alta resistência, fáceis de instalar, que dispensam obras e são muito duráveis. Pergunte a quantidade ou metragem desejada.
- Garanta que a IA informe que os tachões (popularmente conhecidos como tartarugas) servem como excelentes redutores de velocidade. Nunca diga que não são indicados para redução de velocidade. 
- Para tachões, é OBRIGATÓRIO perguntar se o cliente prefere Monodirecional (reflete em um sentido) ou Bidirecional (reflete nos dois sentidos). Caso o cliente pergunte ou demonstre ser leigo, explique que a escolha depende se a via tem um ou dois sentidos de fluxo.
- Para o cálculo de quantidade de tachões, use sempre 4 unidades por metro linear (25cm cada), sem espaçamento entre eles (ex: 50 metros = 200 tachões), a menos que o cliente solicite algo diferente.

RESPOSTA OBRIGATÓRIA (JSON):
{
  "resumo": "Sua mensagem ao cliente",
  "status": false,
  "tipo": "plástico" ou ""
}

Se status=true, você está transferindo para um humano.`;

type AIResponse = { resumo: string; status: boolean; tipo: string };

async function buildSystemPrompt(supabase: any): Promise<string> {
  try {
    let identidade = "", personalidade = "", fluxo = "", faq = "", cenarios = "", transferencia = "", regras = "";

    const { data: ident } = await supabase.from("ia_identidade").select("*").limit(1);
    if (ident?.[0]) {
      const i = ident[0];
      identidade = `IDENTIDADE DA EMPRESA:\nNome: ${i.nome}\nFundação: ${i.ano_fundacao}\nMissão: ${i.missao}\nVisão: ${i.visao}\nValores: ${i.valores}\nDiferenciais: ${i.diferenciais}\nPúblicos: ${i.publicos}`;
    }

    const { data: pers } = await supabase.from("ia_personalidade").select("*").limit(1);
    if (pers?.[0]) {
      const p = pers[0];
      personalidade = `PERSONALIDADE:\nTom: ${p.tom}\nLinguagem: ${p.linguagem}\nEmojis: ${p.emojis}\nEstilos: ${p.estilos}`;
    }

    const { data: fluxoData } = await supabase.from("ia_fluxo_atendimento").select("*").order("ordem");
    if (fluxoData?.length) {
      fluxo = "FLUXO DE ATENDIMENTO:\n" + fluxoData.map((f: any) => `- [${f.etapa}] ${f.mensagem}${f.observacoes ? ` (${f.observacoes})` : ''}`).join("\n");
    }

    const { data: faqData } = await supabase.from("ia_faq").select("*");
    if (faqData?.length) {
      faq = "FAQ:\n" + faqData.map((f: any) => `- ${f.pergunta}: ${f.resposta}`).join("\n");
    }

    const { data: cenData } = await supabase.from("ia_cenarios").select("*");
    if (cenData?.length) {
      cenarios = "CENÁRIOS:\n" + cenData.map((c: any) => `- ${c.cenario}: ${c.resposta}`).join("\n");
    }

    const { data: transData } = await supabase.from("ia_transferencia").select("*");
    if (transData?.length) {
      transferencia = "GATILHOS PARA TRANSFERÊNCIA:\n" + transData.map((t: any) => `- ${t.gatilho}: ${t.acao}`).join("\n");
    }

    const { data: regrasData } = await supabase.from("ia_regras").select("*");
    if (regrasData?.length) {
      regras = "REGRAS GERAIS:\n" + regrasData.map((r: any) => `- ${r.regra}`).join("\n");
    }

    const hasData = identidade || personalidade || fluxo || faq || cenarios || transferencia || regras;
    if (!hasData) {
      return M2_SYSTEM_PROMPT;
    }

    return `Você é a Assistente Virtual da M2 Soluções.

Sua função é realizar o pré-atendimento inicial, coletando informações e qualificando o cliente para que um vendedor humano continue o atendimento.

A empresa vende apenas produtos, nunca serviços.

${identidade}

${personalidade}

${fluxo}

${faq}

${cenarios}

${transferencia}

${regras}

REGRAS DE COMPORTAMENTO:
- Se for a primeira mensagem do dia ou início de conversa, utilize obrigatoriamente "Bom dia", "Boa tarde" ou "Boa noite" de acordo com o horário atual.
- Sempre que o cliente não utilizar termos técnicos, explique o produto de forma clara, simples e utilize nomes populares (ex: "quebra-mola" para lombadas, "tartaruga" para tachões).
- Seja educado e atencioso, mantendo a postura de consultor que ajuda a encontrar a melhor solução.
- Faça apenas uma pergunta por vez
- Nunca use emojis
- Nunca invente informações fora do escopo fornecido
- Nunca responda como "especialista em soluções plásticas" no primeiro contato
- Analise a mensagem do cliente e responda de forma contextualizada
- Antes de fazer uma pergunta do fluxo, valide se a informação já foi fornecida. Se o cliente disse o uso (ex: farmácia), não pergunte a finalidade.

REGRAS DE CONTEXTO E COERÊNCIA:
- Analise SEMPRE o histórico completo da conversa antes de responder.
- NUNCA pergunte algo que o cliente já respondeu anteriormente na conversa.
- NUNCA faça perguntas contraditórias. Se o cliente disse que NÃO usa o produto, NÃO pergunte "com qual frequência compra" - isso soa robótico e desumano.
- Quando o cliente indicar que NÃO USA ou NÃO CONHECE o produto, reformule a pergunta para algo como: "Entendi. Para fins de orçamento, qual seria a quantidade que você precisaria?" ou "Certo. Qual o volume aproximado que você gostaria de adquirir?".
- Adapte as perguntas de qualificação conforme a situação do cliente. Se ele é novo, pergunte sobre necessidade. Se já é cliente, pergunte sobre quantidades e prazos.
- Mantenha coerência: se o cliente respondeu "não" a uma pergunta, leve isso em conta nas próximas perguntas.

AÇÕES ESPECÍFICAS:
- Se identificar produto de plástico (pallets, lixeiras, cones, etc), informe no JSON "tipo": "plástico"
- Sempre que um cliente quiser um produto de resina ou injetada, ofereça as colas em catálogo
- Sempre que um cliente solicitar "bate_rodas", pergunte a quantidade por vagas
- Sempre que um cliente solicitar "lombadas" ou "quebra-molas", explique que trabalhamos com lombadas modulares de alta resistência, fáceis de instalar, que dispensam obras e são muito duráveis. Pergunte a quantidade ou metragem desejada.
- Garanta que a IA informe que os tachões (popularmente conhecidos como tartarugas) servem como excelentes redutores de velocidade. Nunca diga que não são indicados para redução de velocidade.
- Para tachões, é OBRIGATÓRIO perguntar se o cliente prefere Monodirecional (reflete em um sentido) ou Bidirecional (reflete nos dois sentidos). Caso o cliente pergunte ou demonstre ser leigo, explique que a escolha depende se a via tem um ou dois sentidos de fluxo.
- Para o cálculo de quantidade de tachões, use sempre 4 unidades por metro linear (25cm cada), sem espaçamento entre eles (ex: 50 metros = 200 tachões), a menos que o cliente solicite algo diferente.

RESPOSTA OBRIGATÓRIA (JSON):
{
  "resumo": "Sua mensagem ao cliente",
  "status": false,
  "tipo": "plástico" ou ""
}

Se status=true, você está transferindo para um humano.`;
  } catch (error) {
    console.error("Erro ao buscar base de conhecimento, usando fallback:", error);
    return M2_SYSTEM_PROMPT;
  }
}

async function processCustomerMessage(
  history: { role: string; content: string }[],
  latestMessage: string,
  systemPrompt: string,
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

    const now = new Date();
    const brazilTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const timeStr = brazilTime.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
    const dateStr = brazilTime.toLocaleDateString("pt-BR");
    const contextPrompt = `\n\nCONTEXTO TEMPORAL:\nHoje é dia ${dateStr} e agora são ${timeStr}. Use esta informação para a saudação inicial (Bom dia/Boa tarde/Boa noite).`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: systemPrompt + extraPrompt + contextPrompt,
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

async function checkForNewMessages(supabase: any, sessionId: string, sinceTime: Date): Promise<boolean> {
  const { data: newMessages } = await supabase
    .from("smclick_messages")
    .select("role, content, created_at")
    .eq("session_id", sessionId)
    .gt("created_at", sinceTime.toISOString())
    .order("created_at", { ascending: false });
  
  if (newMessages && newMessages.length > 0) {
    const hasUserMessage = newMessages.some(m => m.role === "user");
    return hasUserMessage;
  }
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("1. INICIO - Body:", JSON.stringify(req.body)?.slice(0, 200));
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    console.log("2. ENV - URL:", supabaseUrl ? "OK" : "MISSING", "KEY:", supabaseKey ? "OK" : "MISSING");
    
    if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: "Missing DB credentials" });

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("3. Supabase client criado");
    
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const infos = body?.infos?.chat || body?.chat;
    console.log("4. Body parsed - infos:", !!infos);

    if (!infos) return res.status(400).json({ error: "Invalid payload" });

    const text = infos.last_message?.content?.text || "";
    const smclick_id = infos.contact?.id || "";
    const telefone = infos.contact?.telephone || "";
    const fromMe = infos.last_message?.from_me || false;
    console.log("5. Dados extraidos - smclick_id:", smclick_id, "telefone:", telefone, "text:", text?.slice(0, 50));

    if (!smclick_id) return res.status(400).json({ error: "Missing contact id" });

    console.log("6. Buscando sessao existente...");
    let { data: session, error: sessionError } = await supabase.from("smclick_sessions").select("*").eq("smclick_id", smclick_id).maybeSingle();
    console.log("7. Sessao existente:", session ? "Encontrada" : "Nao encontrada", "Error:", sessionError);

    if (!session) {
      console.log("8. Criando nova sessao...");
      const { data: newSession, error: insertError } = await supabase.from("smclick_sessions").insert({ smclick_id, phone: telefone, is_human_attending: false }).select().single();
      console.log("9. Nova sessao criada:", !!newSession, "Insert Error:", insertError);
      session = newSession;
    }
    
    if (!session) {
      console.log("10. Falha ao criar/obter sessao");
      return res.status(500).json({ error: "Failed to create session" });
    }
    
    console.log("11. Sessao OK - ID:", session.id);

    const role = fromMe ? "human" : "user";
    await supabase.from("smclick_messages").insert({ session_id: session.id, role, content: text });
    console.log("12. Mensagem salva");

    if (text.toLowerCase().trim() === "reset ia now") {
      console.log("12b. Comando reset IA detectado - limpando dados da sessao");
      await supabase.from("smclick_messages").delete().eq("session_id", session.id);
      await supabase.from("smclick_sessions").update({ is_human_attending: false }).eq("id", session.id);
      return res.status(200).json({ status: "success", message: "Session reset" });
    }

    if (fromMe || session.is_human_attending) return res.status(200).json({ status: "success", message: "Recorded" });

    const messageReceivedTime = new Date();
    console.log("13. Mensagem recebida, aguardando 2 segundos para verificar mensagens consecutivas...");

    await sleep(2000);
    
    const hasNewUserMessage = await checkForNewMessages(supabase, session.id, messageReceivedTime);
    if (hasNewUserMessage) {
      console.log("13b. Nova mensagem do usuário detectada, cancelando resposta anterior e processando nova mensagem");
      return res.status(200).json({ status: "success", message: "New message received, waiting for next processing" });
    }

    const { data: historyData } = await supabase.from("smclick_messages").select("role, content").eq("session_id", session.id).order("created_at", { ascending: false }).limit(15);
    const pastMessages = historyData ? historyData.reverse().slice(0, -1) : [];
    console.log("13. Historico:", pastMessages.length, "mensagens");

    const { data: config } = await supabase.from("system_config").select("*").eq("id", "primary").maybeSingle();
    console.log("14. Config carregada:", !!config);

    console.log("15. Buscando base de conhecimento do banco...");
    const systemPrompt = await buildSystemPrompt(supabase);
    console.log("15b. Prompt base construido, tamanho:", systemPrompt.length);

    console.log("16. Chamando IA...");
    let aiRes = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`16b. Tentativa ${attempt}/3...`);
      aiRes = await processCustomerMessage(pastMessages as any, text, systemPrompt, { rules: config?.agent_rules, persona: config?.agent_persona });
      if (aiRes) break;
      if (attempt < 3) await new Promise(r => setTimeout(r, 2000));
    }
    console.log("17. IA respondeu:", !!aiRes);

    if (aiRes) {
      // DEDUPLICAÇÃO: Verifica se a mensagem é igual à última do bot
      const lastBotMessage = historyData?.find(m => m.role === "bot");
      if (lastBotMessage && lastBotMessage.content === aiRes.resumo) {
        console.log("17b. Mensagem duplicada detectada, cancelando envio.");
        return res.status(200).json({ status: "success", message: "Duplicate suppressed" });
      }

      await supabase.from("smclick_messages").insert({ session_id: session.id, role: "bot", content: aiRes.resumo });

      // DELAY HUMANIZADO
      const delay = calculateTypingDelay(aiRes.resumo);
      console.log(`17c. Aguardando ${delay}ms para simular digitação...`);
      await sleep(delay);

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
