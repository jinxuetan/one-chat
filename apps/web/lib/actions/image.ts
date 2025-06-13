"use server";

import { env } from "@/env";
import {
  createDataStream,
  experimental_generateImage as generateImage,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { put } from "@vercel/blob";
import { generateId } from "ai";
import { createAttachmentAndLinkToMessage, upsertMessage } from "./thread";
import type { UIMessage } from "ai";
import { ResumableStreamContext } from "resumable-stream/ioredis";
import { Attachment } from "../types";

interface ImageGenerationResult {
  attachment: Attachment | null;
  imageUrl: string;
}

interface ImageGenerationPayload {
  prompt: string;
  userId: string;
  messageId: string;
  threadId: string;
  model: string;
}

export const generateImageAndCreateAttachment = async ({
  prompt,
  userId,
  messageId,
  threadId,
  model,
}: ImageGenerationPayload): Promise<ImageGenerationResult> => {
  const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });

  const { image } = await generateImage({
    model: openai.image("gpt-image-1"),
    prompt,
    size: "1024x1024",
  });

  if (!image) throw new Error("Image generation failed");

  const blob = await put(
    `${userId}/generated-images/${messageId}.png`,
    Buffer.from(image.base64, "base64"),
    {
      access: "public",
      addRandomSuffix: true,
      contentType: image.mimeType ?? "image/png",
      token: env.VERCEL_BLOB_READ_WRITE_TOKEN,
    }
  );

  const attachmentId = generateId();

  const [attachment] = await Promise.all([
    createAttachmentAndLinkToMessage({
      attachmentId,
      userId,
      messageId,
      fileKey: blob.pathname,
      fileName: `generated-image-${messageId}.png`,
      fileSize: Buffer.from(image.base64, "base64").length,
      mimeType: image.mimeType ?? "image/png",
      attachmentType: "generated-image",
      attachmentUrl: blob.url,
    }),
    upsertMessage({
      id: messageId,
      threadId,
      message: {
        id: messageId,
        role: "assistant",
        content: "",
        parts: [],
      } as UIMessage,
      model,
      status: "done",
      attachmentIds: [attachmentId],
    }),
  ]);

  return { attachment, imageUrl: blob.url };
};

export const createStreamingImageMessage = async (
  messageId: string,
  model: string
) => ({
  id: messageId,
  role: "assistant" as const,
  content: "",
  parts: [],
  attachmentIds: [],
  experimental_attachments: [],
  model,
  status: "streaming" as const,
});

export const createCompletedImageMessage = async (
  messageId: string,
  model: string,
  attachment: Attachment
) => ({
  id: messageId,
  role: "assistant" as const,
  content: "",
  parts: [],
  attachmentIds: [attachment.id],
  experimental_attachments: [
    {
      name: attachment.fileName,
      contentType: attachment.mimeType,
      url: attachment.attachmentUrl,
    },
  ],
  model,
  status: "done" as const,
});

interface HandleImageGenerationPayload {
  userId: string;
  thread: {
    id: string;
    prompt: string;
    selectedModel: string;
  };
  stream: {
    id: string;
    context: ResumableStreamContext;
  };
}

export const handleImageGeneration = async ({
  userId,
  thread: { id: threadId, prompt, selectedModel },
  stream: { id, context },
}: HandleImageGenerationPayload) => {
  const assistantMsgId = generateId();

  const stream = createDataStream({
    execute: async (buffer) => {
      buffer.writeMessageAnnotation({
        type: "model",
        model: selectedModel,
      });
      buffer.writeData({
        type: "append-message",
        message: JSON.stringify(
          createStreamingImageMessage(assistantMsgId, selectedModel)
        ),
      });

      try {
        const { attachment } = await generateImageAndCreateAttachment({
          prompt,
          userId,
          messageId: assistantMsgId,
          threadId,
          model: selectedModel,
        });

        if (!attachment) {
          buffer.writeMessageAnnotation({ status: "error" });
          return;
        }

        buffer.writeData({
          type: "append-message",
          message: JSON.stringify(
            createCompletedImageMessage(
              assistantMsgId,
              selectedModel,
              attachment
            )
          ),
        });

        buffer.writeMessageAnnotation({
          type: "image-gen",
          attachment: {
            ...attachment,
            createdAt: attachment.createdAt.toISOString(),
            updatedAt: attachment.updatedAt.toISOString(),
          },
        });
      } catch (error) {
        console.error("Error in handleImageGeneration", error);
      }
    },
  });

  return new Response(await context.resumableStream(id, () => stream));
};
