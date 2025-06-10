"use client";

import { SidebarProvider } from "@workspace/ui/components/sidebar";
import { Toaster } from "@workspace/ui/components/sonner";
import { TooltipProvider } from "@workspace/ui/components/tooltip";
import ThemeProvider from "./theme-provider";
import { TRPCProvider } from "./trpc-provider";

export const Providers = ({ children }: React.PropsWithChildren) => (
  <ThemeProvider>
    <TRPCProvider>
      <TooltipProvider delayDuration={0}>
        <SidebarProvider>
          {children}
          <Toaster />
        </SidebarProvider>
      </TooltipProvider>
    </TRPCProvider>
  </ThemeProvider>
);
