import { GoogleGenAI } from "@google/genai";
import { BaseService } from './base.service';

export class AIService extends BaseService {
  private ai: GoogleGenAI;

  constructor() {
    super();
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }

  async generateContent(prompt: string, model: string = "gemini-3-flash-preview") {
    try {
      const response = await this.ai.models.generateContent({
        model,
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  }

  async analyzeSentiment(text: string) {
    const prompt = `Analyze the sentiment of the following political ground report and return a score from -1 (very negative) to 1 (very positive). Only return the number.\n\nReport: ${text}`;
    const result = await this.generateContent(prompt);
    return parseFloat(result || "0");
  }
}

export const aiService = new AIService();
