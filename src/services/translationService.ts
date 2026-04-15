import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const TranslationService = {
  async translate(text: string, targetLang: 'vi' | 'en'): Promise<string> {
    if (!text || text.length < 5) return text;
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Translate the following book description to ${targetLang === 'vi' ? 'Vietnamese' : 'English'}. Keep the tone professional and literary. Return only the translated text.\n\nText: ${text}`,
      });
      return response.text || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }
};
