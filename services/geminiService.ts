import { GoogleGenAI, Type } from "@google/genai";

// Initialize with environment variable
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Chat with Search Grounding and Thinking Mode
 */
export const streamStrategyChat = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string,
  useThinking: boolean,
  useSearch: boolean,
  onChunk: (text: string, grounding?: any[]) => void
) => {
  const ai = getAiClient();
  
  // CRITICAL: Logic for Model Selection based on Task
  // 1. If Search is requested -> MUST use gemini-3-flash-preview (best for search)
  // 2. If Thinking is requested -> Use gemini-3-pro-preview (best for logic)
  // Priority: Search > Thinking (if both selected, usually Search implies needing facts, but we can try to combine or prioritize search for the "Assistant" feel)
  
  let modelName = 'gemini-3-flash-preview';
  
  const config: any = {
    systemInstruction: `
      CRITICAL PRIME DIRECTIVE: LANGUAGE MIRRORING & LIVE DATA
      You are Klutch Vision PRO, an Omni-Lingual Gaming Superintelligence connected to the Neural Net (Google Search).
      
      1. DETECT the language of the user's latest message IMMEDIATELY.
      2. RESPOND in the EXACT SAME language.
      3. WHEN SEARCHING: Summarize the latest data found from the web. Be specific (dates, patch numbers, stats).
      
      IDENTITY: Klutch Vision PRO.
      KNOWLEDGE: You know every game, every meta, every hidden mechanic.
      TONE: Elite, Tactical, "Cyberpunk", Precise.
      FORMAT: Use Markdown. **Bold** for critical stats. Lists for actionable steps.
    `,
  };

  if (useSearch) {
    modelName = 'gemini-3-flash-preview'; // Enforce Flash for Search Grounding
    config.tools = [{ googleSearch: {} }];
  } else if (useThinking) {
    modelName = 'gemini-3-pro-preview';
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

  const chat = ai.chats.create({
    model: modelName,
    history: history,
    config: config,
  });

  try {
    const resultStream = await chat.sendMessageStream({ message: newMessage });
    
    for await (const chunk of resultStream) {
      const text = chunk.text || "";
      // Extract Google Search Grounding Metadata
      const grounding = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
      onChunk(text, grounding);
    }
  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
};

/**
 * Analyzes game screenshots using Vision capabilities
 */
export const analyzeGameScreenshot = async (
  base64Image: string,
  prompt: string,
  onChunk: (text: string) => void
) => {
  const ai = getAiClient();
  // Use Pro model for best vision reasoning
  const model = 'gemini-3-pro-preview';

  try {
    const responseStream = await ai.models.generateContentStream({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png', // Assuming PNG/JPEG from canvas
              data: base64Image
            }
          },
          { text: prompt ? `User Prompt: "${prompt}".\nIMPORTANT: Respond in the language of this prompt.` : "Analyze this game frame. Identify HUD elements, enemies, health bars, and loot. Give tactical advice. IMPORTANT: Detect the language of the game UI or user context and respond in that language (e.g. Portuguese UI -> Portuguese response)." }
        ]
      },
      config: {
        thinkingConfig: { thinkingBudget: 1024 }, // Light thinking for vision
      }
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        onChunk(chunk.text);
      }
    }
  } catch (error) {
    console.error("Vision error:", error);
    throw error;
  }
};

/**
 * Dedicated TheoryCraft engine for heavy math/logic
 */
export const runTheoryCraft = async (
  scenario: string,
  data: string,
  onChunk: (text: string) => void
) => {
  const ai = getAiClient();
  const model = 'gemini-3-pro-preview';
  
  try {
    const responseStream = await ai.models.generateContentStream({
      model: model,
      contents: `
      SCENARIO: ${scenario}
      DATA: ${data}
      
      TASK: Perform a deep theorycraft analysis. Calculate optimal outcomes, DPS, or strategy.
      
      LANGUAGE RULE: Detect the language of the 'SCENARIO' input and respond in that language.
      `,
      config: {
        // MAXIMUM THINKING POWER for "Insane" calculations
        thinkingConfig: { thinkingBudget: 32768 },
      }
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        onChunk(chunk.text);
      }
    }

  } catch (error) {
    console.error("TheoryCraft error:", error);
    throw error;
  }
};


/**
 * High Quality Image Generation for Assets and Avatars
 */
export const generateGameAsset = async (
  prompt: string,
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
  size: "1K" | "2K" | "4K"
): Promise<string> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: size,
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
};

/**
 * Game Recommendation Service using LIVE SEARCH Data
 * Updated to use gemini-3-flash-preview with googleSearch for real-time recommendations
 */
export const getGameRecommendations = async (
  userHistory: string,
  preferences: string
): Promise<any> => {
  const ai = getAiClient();
  try {
    // We utilize search to get REAL UP TO DATE games (e.g., "released last week")
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Research current and classic games to suggest 5 recommendations.
      User History: "${userHistory}"
      User Preferences: "${preferences}"
      
      Step 1: Use Google Search to find games that match these criteria, specifically looking for recent releases or trending titles if implied.
      Step 2: Return the result STRICTLY as a JSON Array.
      
      IMPORTANT: The "reason" field must be in the language of the Preferences input.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  genre: { type: Type.STRING },
                  matchScore: { type: Type.INTEGER, description: "Match percentage 0-100" },
                  reason: { type: Type.STRING, description: "Explanation in the user's language" }
                }
              }
            }
          }
        }
      }
    });

    const jsonText = response.text || "{}";
    const parsed = JSON.parse(jsonText);
    return parsed.recommendations || [];
  } catch (error) {
    console.error("Recs Error:", error);
    return [];
  }
}

/**
 * Live API Connection Helper
 */
export const getLiveClient = () => {
  const ai = getAiClient();
  return ai.live;
};