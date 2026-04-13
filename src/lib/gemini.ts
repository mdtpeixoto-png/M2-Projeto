import { GoogleGenAI, Type } from "@google/genai";
import { M2_SYSTEM_PROMPT } from "./ai-knowledge";

if (!process.env.GEMINI_API_KEY) {
  console.warn("Aviso: GEMINI_API_KEY não encontrada no ambiente.");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

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
    // Montando o histórico no padrão Gemini (user e model)
    const contents = history.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Adiciona a última mensagem do cliente
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
      model: "gemini-2.5-flash", // Utilizando Gemini
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
