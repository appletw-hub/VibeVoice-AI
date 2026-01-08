
import { GoogleGenAI, Modality } from "@google/genai";
import { TTSConfig, Emotion, Language } from "../types";

export class GeminiTTSService {
  async generateSpeech(config: TTSConfig): Promise<{ audioBase64: string }> {
    // Create a new instance right before making an API call to ensure it always uses 
    // the most up-to-date API key from the environment.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Construct instructions based on emotion and speed
    const emotionInstruction = this.getEmotionPrompt(config.emotion);
    const speedInstruction = config.speed !== 1 ? `Speak at ${config.speed}x speed. ` : '';
    const languageInstruction = `Please speak in ${config.language}. `;
    
    const prompt = `${emotionInstruction}${speedInstruction}${languageInstruction}${config.text}`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: config.voice },
            },
          },
        },
      });

      const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (!audioBase64) {
        throw new Error("No audio data received from Gemini API. The model might have returned text instead or filtered the response.");
      }

      return { audioBase64 };
    } catch (error: any) {
      console.error("Gemini TTS API Error:", error);
      // Re-throw with a cleaner message if it's a known error structure
      if (error.message?.includes("Rpc failed")) {
        throw new Error("連線至語音服務時出錯 (RPC Error)，請稍後再試。");
      }
      throw error;
    }
  }

  private getEmotionPrompt(emotion: Emotion): string {
    switch (emotion) {
      case Emotion.Enthusiastic: return "Say very enthusiastically and with high energy: ";
      case Emotion.Sad: return "Say sadly and with a heavy heart: ";
      case Emotion.Angry: return "Say angrily and firmly: ";
      case Emotion.Whispering: return "Say softly in a whisper: ";
      case Emotion.Cheerful: return "Say cheerfully and happily: ";
      case Emotion.Neutral:
      default: return "";
    }
  }
}

export const ttsService = new GeminiTTSService();
