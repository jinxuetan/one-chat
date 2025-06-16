import type { AppRouter } from "@/server/api/root";
import { createTRPCReact, type CreateTRPCReact } from "@trpc/react-query";

export const trpc: CreateTRPCReact<AppRouter, unknown> =
  createTRPCReact<AppRouter>();
