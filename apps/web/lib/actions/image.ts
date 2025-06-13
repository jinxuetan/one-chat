import { env } from "@/env";
import { createOpenAI } from "@ai-sdk/openai";
import { put } from "@vercel/blob";
import { experimental_generateImage as generateImage, tool } from "ai";
import { z } from "zod";

/**
 * Creates an AI-powered image generation tool for the specified user.
 *
 * This tool generates high-quality images using OpenAI's gpt-image-1 model
 * and automatically uploads them to Vercel Blob storage with public access.
 *
 * @param userId - The unique identifier of the user requesting image generation
 * @returns A configured tool instance for AI image generation
 */
export const createImageGenerationTool = (userId: string, apiKey?: string) =>
  tool({
    description:
      "Generate high-quality AI images using OpenAI's gpt-image-1 model. " +
      "Creates 1024x1024 pixel images based on detailed text prompts, " +
      "automatically uploads them to secure cloud storage with public access URLs, " +
      "and displays the generated image to the user on the frontend.",

    parameters: z.object({
      prompt: z
        .string()
        .min(1, "Image prompt cannot be empty")
        .max(1000, "Image prompt must be less than 1000 characters")
        .describe("Text description of the image to generate."),
    }),

    execute: async ({ prompt: imagePrompt }) => {
      if (!apiKey)
        return {
          error: "OpenAI API key is not set",
        };

      const openaiClient = createOpenAI({ apiKey });

      const { image: generatedImage } = await generateImage({
        model: openaiClient.image("gpt-image-1"),
        prompt: imagePrompt,
        size: "1024x1024",
      });

      const imageFilePath = `${userId}/generated-images/generated-image.png`;
      const imageBuffer = Buffer.from(generatedImage.base64, "base64");

      const uploadedBlob = await put(imageFilePath, imageBuffer, {
        access: "public",
        addRandomSuffix: true,
        contentType: generatedImage.mimeType ?? "image/png",
        token: env.VERCEL_BLOB_READ_WRITE_TOKEN,
      });

      return uploadedBlob;
    },
  });
