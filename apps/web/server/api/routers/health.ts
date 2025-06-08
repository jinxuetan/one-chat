import { publicProcedure, router } from "@/lib/trpc/server";

export const healthRouter = router({
  health: publicProcedure.query(() => {
    return {
      status: "ok",
    };
  }),
});

export type HealthRouter = typeof healthRouter;
