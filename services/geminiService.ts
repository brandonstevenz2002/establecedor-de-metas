
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const suggestStepsForGoal = async (goalTitle: string): Promise<string[]> => {
  try {
    const prompt = `Eres un experto en productividad y establecimiento de metas. Desglosa la siguiente meta del usuario en una lista de pasos pequeños y procesables. La meta es: "${goalTitle}". Devuelve la respuesta como un objeto JSON con una única clave "steps", que es un array de strings. Cada string debe ser un paso conciso. Por ejemplo: {"steps": ["Paso 1", "Paso 2", "Paso 3"]}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
                description: "Un único paso procesable hacia la meta."
              },
              description: "Un array de pasos procesables.",
            },
          },
          required: ["steps"],
        },
      },
    });

    const jsonStr = response.text.trim();
    const result = JSON.parse(jsonStr);
    
    if (result && Array.isArray(result.steps)) {
        return result.steps;
    }
    return [];

  } catch (error) {
    console.error("Error llamando a la API de Gemini:", error);
    throw new Error("No se pudieron obtener sugerencias de la IA. Por favor, inténtalo de nuevo.");
  }
};
