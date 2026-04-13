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
  latestMessage: string
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

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Utilizando Gemini
      contents,
      config: {
        systemInstruction: M2_SYSTEM_PROMPT,
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
