import type { Model } from "@/lib/ai";
import type { Effort } from "@/lib/ai/config";
import type { Attachment, UIMessage } from "ai";

export type MessageWithMetadata = UIMessage & {
  model: Model;
  isErrored?: boolean;
  errorMessage?: string;
  isStopped?: boolean;
};

export type CustomAnnotation =
  | {
      type: "model";
      model: Model;
    }
  | {
      type: "first-chunk";
    };

export type SearchMode = "off" | "native" | "tool";

export type ChatSubmitData = {
  input: string;
  selectedModel: Model;
  reasoningEffort: Effort;
  searchStrategy: SearchMode;
  forceOpenRouter: boolean;
  attachments?: Attachment[];
};
