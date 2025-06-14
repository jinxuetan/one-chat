import { Model } from "./ai";
import { CustomAnnotation, MessageWithMetadata } from "@/types";

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
 * Sets the model preference cookie (client-side only)
 */
export const setModelCookie = (model: Model): void => {
  if (typeof document === "undefined") return;

  const expires = new Date();
  expires.setTime(expires.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
  document.cookie = `chat-model=${model};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

/**
 * Gets the model from cookie (client-side only)
 */
export const getModelFromCookie = (): Model | null => {
  if (typeof document === "undefined") return null;

  const nameEQ = "chat-model=";
  const ca = document.cookie.split(";");

  for (let c of ca) {
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return c.substring(nameEQ.length, c.length) as Model;
    }
  }

  return null;
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

  // Fall back to cookie model or default
  return cookieModel || defaultModel;
};
