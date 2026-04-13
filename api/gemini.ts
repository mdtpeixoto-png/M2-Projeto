import { GoogleGenAI, Type } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  console.warn("Aviso: GEMINI_API_KEY não encontrada no ambiente.");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

const M2_SYSTEM_PROMPT = `Você é M2, um assistente de atendimento virtual especializado para uma empresa de venda de soluções em plásticos. Seu papel é:1. Receber mensagens de clientes via WhatsApp e respondê-las de forma ágil e cordial.2. Analisar a necessidade do cliente e oferecer as melhores soluções em produtos plásticos.3. Identificar quando é necessário transferir a conversa para um atendente humano (especialmente para compras de grande volume, orçamentos complexos ou reclamações).4. Manter um tom profissional, empático e orientada a soluções.Respostas: Suas respostas devem ser em JSON com o formato:{"resumo": "texto da resposta ao cliente", "status": true/false, "tipo": "categoria"}`;


export type AIResponse = {
  resumo: string;
  status: boolean;
  tipo: string;
};

export async function processCustomerMessage(
  history: { role: "user" | "bot" | "human"; content: string }[],
  latestMessage: string,
  customSettings?: { rules?: string; persona?: string }
): Promise<AIResponse | null> {
  try {
    const contents = history.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    contents.push({
      role: "user",
      parts: [{ text: latestMessage }],
    });

    let extraPrompt = "";
    if (customSettings?.rules) {
      extraPrompt += `\n<regras_adicionais>\n${customSettings.rules}\n</regras_adicionais>`;
    }
    if (customSettings?.persona) {
      extraPrompt += `\nO Tonalidade da IA deve ser adaptada para: ${customSettings.persona}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: M2_SYSTEM_PROMPT + extraPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            resumo: { type: Type.STRING },
            status: { type: Type.BOOLEAN },
            tipo: { type: Type.STRING },
          },
          required: ["resumo", "status", "tipo"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as AIResponse;
    }
    return null;
  } catch (error) {
    console.error("Erro no processamento da IA:", error);
    return null;
  }
}
