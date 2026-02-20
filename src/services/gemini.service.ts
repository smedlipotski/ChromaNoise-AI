import { Injectable, signal } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';

export interface PaletteResponse {
  colors: string[];
  name: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;
  public isLoading = signal<boolean>(false);
  public error = signal<string | null>(null);

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generatePalette(prompt: string): Promise<PaletteResponse | null> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create a cohesive color palette of 5 hex color codes based on this mood/idea: "${prompt}". 
                   Also provide a creative name and a very short description (under 15 words).`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              colors: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of 5 hex color codes (e.g., #FF0000)"
              },
              name: { type: Type.STRING },
              description: { type: Type.STRING }
            }
          }
        }
      });

      const jsonText = response.text;
      if (!jsonText) throw new Error("No response from AI");
      
      const result = JSON.parse(jsonText) as PaletteResponse;
      return result;

    } catch (e: any) {
      console.error("Gemini Error:", e);
      this.error.set("Failed to generate palette. Please try again.");
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }
}