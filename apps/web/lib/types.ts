import { UIMessage } from "ai";
import { Model } from "@/lib/ai";
import { attachment } from "./db/schema/thread";

export type Attachment = typeof attachment.$inferSelect;

export type MessageWithMetadata = UIMessage & {
  model: Model;
  attachmentIds?: string[];
  attachments?: Attachment[];
};

export type ModelAnnotation = {
  type: "model";
  model: Model;
};

export type ImageGenAnnotation = {
  type: "image-gen";
  attachment: Attachment;
};

export type CustomAnnotation = ModelAnnotation | ImageGenAnnotation;
