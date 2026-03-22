import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export const aiService = {
  async generateStrategicSummary(data: any, retryCount = 0): Promise<string> {
    try {
      const ai = getAiClient();
      const prompt = `
        As a senior political strategist for the National Unity Party (NUP) in Nepal, analyze the following real-time data and provide a strategic summary.
        
        Data:
        ${JSON.stringify(data, null, 2)}
        
        Please provide:
        1. Executive Summary: A high-level overview of current standing.
        2. Key Risks: Identify critical areas of concern (e.g., low booth readiness, high grievance counts, negative sentiment).
        3. Strategic Recommendations: Actionable steps for the national command.
        4. Resource Allocation: Where should we focus our volunteers and funds?
        
        Format the output in professional Markdown.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      return response.text;
    } catch (error: any) {
      if (error?.message?.includes('429') && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.generateStrategicSummary(data, retryCount + 1);
      }
      console.error('AI Strategic Summary Error:', error);
      return "Unable to generate strategic summary at this time. (Rate limit reached or service unavailable)";
    }
  },

  async analyzeSentiment(reports: any[], retryCount = 0): Promise<any> {
    try {
      const ai = getAiClient();
      const prompt = `
        Analyze the sentiment of the following ground intelligence reports from Nepal.
        Reports:
        ${JSON.stringify(reports, null, 2)}
        
        Provide a consolidated sentiment score (0-100) and a brief qualitative analysis of the mood on the ground.
        Return as JSON: { "score": number, "analysis": string }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      return JSON.parse(response.text || '{}');
    } catch (error: any) {
      if (error?.message?.includes('429') && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.analyzeSentiment(reports, retryCount + 1);
      }
      console.error('AI Sentiment Analysis Error:', error);
      return { score: 50, analysis: "Sentiment analysis unavailable due to rate limits." };
    }
  }
};
