import { Model } from "@/lib/ai";
import { UIMessage } from "ai";


export type MessageWithMetadata = UIMessage & {
  model: Model;
};

export type CustomAnnotation = {
  type: "model";
  model: Model;
};

export type SearchMode = "off" | "native" | "tool";
