import { router } from "@/lib/trpc/server";
import { attachmentRouter } from "./routers/attachment";
import { healthRouter } from "./routers/health";
import { threadRouter } from "./routers/thread";
import { voiceRouter } from "./routers/voice";

export const appRouter = router({
  health: healthRouter,
  attachment: attachmentRouter,
  thread: threadRouter,
  voice: voiceRouter,
});

export type AppRouter = typeof appRouter;
