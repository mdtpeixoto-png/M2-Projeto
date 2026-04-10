import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AgentSettings {
  name: string;
  persona: "institutional" | "friendly" | "informal";
  rules: string;
}

export async function getAIResponse(
  message: string,
  history: { role: string; content: string }[],
  settings: AgentSettings,
  context?: string
) {
  const personaPrompts = {
    institutional: "Você é um assistente institucional, formal, preciso e profissional.",
    friendly: "Você é um assistente simpático, acolhedor e prestativo.",
    informal: "Você é um assistente totalmente informal, usa gírias leves e é muito descontraído.",
  };

  const systemInstruction = `
    Nome do Agente: ${settings.name}
    Postura: ${personaPrompts[settings.persona]}
    Regras Gerais: ${settings.rules}

    OBJETIVO:
    - Responder perguntas gerais sobre os produtos e serviços da empresa.
    - Direcionar para um atendente humano quando necessário ou quando o cliente pedir.
    - Coletar informações básicas se ainda não as tiver:
      1. Nome da empresa do cliente.
      2. Quais os produtos desejados.
      3. Quantidade de produtos.
      4. Se a expectativa é fechar a compra nos próximos 10 dias.
    
    IMPORTANTE:
    - Verifique no histórico se essas informações já foram dadas. Não pergunte o que já sabe.
    - Se identificar que o cliente quer um orçamento, foque em coletar esses 4 pontos.
    
    CONTEXTO ADICIONAL:
    ${context || ""}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history.map(h => ({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.content }]
        })),
        { role: "user", parts: [{ text: message }] }
      ],
      config: {
        systemInstruction,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Desculpe, tive um problema técnico. Posso te ajudar com outra coisa?";
  }
}

export async function analyzeEmail(subject: string, body: string) {
  const prompt = `
    Analise o seguinte e-mail:
    Assunto: ${subject}
    Corpo: ${body}

    O teor deste e-mail é uma solicitação de orçamento explícita de algum produto?
    Responda apenas "SIM" ou "NAO".
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    return response.text?.trim().toUpperCase() === "SIM";
  } catch (error) {
    console.error("Email Analysis Error:", error);
    return false;
  }
}
