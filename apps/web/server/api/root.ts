import { router } from "@/lib/trpc/server";
import { attachmentRouter } from "./routers/attachment";
import { healthRouter } from "./routers/health";
import { threadRouter } from "./routers/thread";

export const appRouter = router({
  health: healthRouter,
  attachment: attachmentRouter,
  thread: threadRouter,
});

export type AppRouter = typeof appRouter;
