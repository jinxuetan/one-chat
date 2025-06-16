import { env } from "@/env";
import { voiceRateLimit } from "@/lib/redis/rate-limits";
import { protectedProcedure, router } from "@/lib/trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const REALTIME_CONFIG = {
  model: "gpt-4o-mini-realtime-preview",
  input_audio_format: "pcm16",
  input_audio_transcription: {
    model: "whisper-1",
    language: "en",
  },
  turn_detection: {
    type: "server_vad",
    threshold: 0.7,
    prefix_padding_ms: 300,
    silence_duration_ms: 200,
  },
} as const;

const TTS_CONFIG = {
  model: "gpt-4o-mini-tts",
  format: "mp3",
} as const;

/**
 * Create a WAV file from PCM16 data
 */
function createWavFile(
  pcmData: Buffer,
  sampleRate: number,
  channels: number
): Buffer {
  const byteRate = sampleRate * channels * 2; // 16-bit samples
  const blockAlign = channels * 2;
  const dataSize = pcmData.length;
  const fileSize = 36 + dataSize;

  const header = Buffer.alloc(44);
  let offset = 0;

  // RIFF header
  header.write("RIFF", offset);
  offset += 4;
  header.writeUInt32LE(fileSize, offset);
  offset += 4;
  header.write("WAVE", offset);
  offset += 4;

  // fmt chunk
  header.write("fmt ", offset);
  offset += 4;
  header.writeUInt32LE(16, offset);
  offset += 4; // fmt chunk size
  header.writeUInt16LE(1, offset);
  offset += 2; // PCM format
  header.writeUInt16LE(channels, offset);
  offset += 2;
  header.writeUInt32LE(sampleRate, offset);
  offset += 4;
  header.writeUInt32LE(byteRate, offset);
  offset += 4;
  header.writeUInt16LE(blockAlign, offset);
  offset += 2;
  header.writeUInt16LE(16, offset);
  offset += 2; // bits per sample

  // data chunk
  header.write("data", offset);
  offset += 4;
  header.writeUInt32LE(dataSize, offset);

  return Buffer.concat([header, pcmData]);
}

export const voiceRouter = router({
  /**
   * Generate a temporary client token for OpenAI Realtime API
   * Used for real-time voice transcription
   */
  generateClientToken: protectedProcedure
    .input(
      z.object({
        apiKey: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { apiKey } = input;
      const { user } = ctx;
      const hasUserApiKey = Boolean(apiKey);
      const hasServerApiKey = Boolean(env.OPENAI_API_KEY);

      // Validate API key availability
      if (!hasUserApiKey && !hasServerApiKey) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "OpenAI API key not configured",
        });
      }

      // Rate limit free users (no API key provided)
      if (!hasUserApiKey) {
        const rateLimitKey = `voice_${user.id}`;
        const { success, limit, reset } =
          await voiceRateLimit.limit(rateLimitKey);

        if (!success) {
          const waitMinutes = Math.ceil((reset - Date.now()) / 60000);
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Voice limit reached (${limit}/hour). Try again in ${waitMinutes}m or add your API key.`,
          });
        }
      }

      // Create transcription session
      const effectiveApiKey = apiKey || env.OPENAI_API_KEY;

      try {
        const response = await fetch(
          "https://api.openai.com/v1/realtime/sessions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${effectiveApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(REALTIME_CONFIG),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("OpenAI API error:", errorText);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to create transcription session: ${response.status}`,
          });
        }

        const data = await response.json();

        if (!data.client_secret?.value) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Invalid response from OpenAI API",
          });
        }

        return {
          session_id: data.id,
          client_secret: data.client_secret.value,
          expiry: data.client_secret.expires_at,
          model_name: data.model,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate transcription token",
        });
      }
    }),

  /**
   * Convert text to speech using OpenAI or Gemini TTS API
   * Returns audio data as base64 encoded string
   */
  textToSpeech: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1).max(4096), // OpenAI TTS has 4096 character limit
        voice: z.string().default("alloy"), // Support both OpenAI and Gemini voices
        model: z
          .enum([
            "gpt-4o-mini-tts",
            "tts-1",
            "tts-1-hd",
            "gemini-2.5-flash-preview-tts",
            "gemini-2.5-pro-preview-tts",
          ])
          .default("gpt-4o-mini-tts"),
        speed: z.number().min(0.25).max(4.0).default(1.0),
        apiKey: z.string().optional(),
        provider: z.enum(["openai", "google"]).default("openai"),
      })
    )
    .mutation(async ({ input }) => {
      const { text, voice, model, speed, apiKey, provider } = input;
      const hasUserApiKey = Boolean(apiKey);

      // Validate API key availability
      if (!hasUserApiKey) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `${
            provider === "openai" ? "OpenAI" : "Google AI"
          } API key not configured`,
        });
      }

      try {
        if (provider === "openai") {
          // OpenAI TTS API
          const response = await fetch(
            "https://api.openai.com/v1/audio/speech",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model,
                input: text,
                voice,
                response_format: TTS_CONFIG.format,
                speed,
              }),
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error("OpenAI TTS API error:", errorText);
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to generate speech: ${response.status}`,
            });
          }

          // Convert audio response to base64
          const audioBuffer = await response.arrayBuffer();
          const audioBase64 = Buffer.from(audioBuffer).toString("base64");

          return {
            audio: audioBase64,
            format: TTS_CONFIG.format,
            voice,
            text_length: text.length,
          };
        }

        if (provider === "google") {
          // Google Gemini TTS API
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                contents: [{ parts: [{ text }] }],
                generationConfig: {
                  responseModalities: ["AUDIO"],
                  speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: {
                        voiceName: voice,
                      },
                    },
                  },
                },
              }),
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Gemini TTS API error:", errorText);
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to generate speech: ${response.status}`,
            });
          }

          const data = await response.json();
          const audioData =
            data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

          if (!audioData) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Invalid response from Gemini API",
            });
          }

          // Gemini returns raw PCM16 data, we need to create a proper WAV file
          const pcmBuffer = Buffer.from(audioData, "base64");
          const wavBuffer = createWavFile(pcmBuffer, 24000, 1); // 24kHz, mono
          const wavBase64 = wavBuffer.toString("base64");

          return {
            audio: wavBase64,
            format: "wav",
            voice,
            text_length: text.length,
          };
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate speech",
        });
      }
    }),
});
