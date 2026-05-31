import { GoogleGenAI } from "@google/genai";
import { Signal } from "../../shared/types.js";

// AI validation engine using gemini-1.5-flash
export async function validateSignalWithAI(signalDraft: Partial<Signal>): Promise<{ verdict: "HIGH_QUALITY" | "LOW_QUALITY", reason: string }> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `
    You are a professional XAUUSD algorithmic trading AI. Validate this Smart Money Concept (SMC) signal JSON setup.
    Critically analyze the setup context: Bias, Trend, FVG gaps, Fibonacci rules, CHOCH presence, and ATR-based SL/TP limits.
    
    SETUP DATA:
    ${JSON.stringify(signalDraft, null, 2)}
    
    You must output ONLY valid JSON in the exact following format, without markdown wrapping or extras:
    {
      "verdict": "HIGH_QUALITY" | "LOW_QUALITY",
      "reason": "Clear explanation of your assessment."
    }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      if (parsed.verdict === "HIGH_QUALITY" || parsed.verdict === "LOW_QUALITY") {
        return { verdict: parsed.verdict, reason: parsed.reason };
      }
    }
    
    return { verdict: "LOW_QUALITY", reason: "AI response format was invalid or empty" };
  } catch (error: any) {
    console.error("Gemini AI validation failed:", error.message);
    return { verdict: "LOW_QUALITY", reason: `AI Error: ${error.message}` };
  }
}
