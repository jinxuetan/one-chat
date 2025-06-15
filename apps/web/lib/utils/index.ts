import type { Model } from "@/lib/ai";
import type { CustomAnnotation, MessageWithMetadata } from "@/types";

export const generateUUID = (): string =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

/**
 * Resolves the AI model for a message, checking direct property first, then annotations fallback.
 */
export const resolveModel = (message: MessageWithMetadata): Model | null => {
  const model =
    message.model ??
    (message.annotations as CustomAnnotation[])?.find(
      (annotation) => annotation.type === "model"
    )?.model;

  return model ?? null;
};

/**
 * Resolves the initial model for a chat based on messages and cookie fallback
 * 1. If messages exist, use model from latest assistant message
 * 2. If no messages, use model from cookie
 * 3. If no cookie, use default model
 */
export const resolveInitialModel = (
  messages: MessageWithMetadata[],
  cookieModel: Model | null,
  defaultModel: Model
): Model => {
  if (cookieModel) return cookieModel;

  // Check if we have messages with model information
  if (messages.length > 0) {
    // Find the latest assistant message to get the model used
    const lastAssistantMessage = messages
      .filter((msg) => msg.role === "assistant")
      .pop();

    if (lastAssistantMessage) {
      const modelFromMessage = resolveModel(lastAssistantMessage);
      if (modelFromMessage) {
        return modelFromMessage;
      }
    }
  }

  return defaultModel;
};

export * from "./cookie";
export * from "./thread-grouping";
