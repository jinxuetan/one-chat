import { router } from "@/lib/trpc/server";
import { attachmentRouter } from "./routers/attachment";
import { healthRouter } from "./routers/health";

export const appRouter = router({
  health: healthRouter,
  attachment: attachmentRouter,
});

export type AppRouter = typeof appRouter;
