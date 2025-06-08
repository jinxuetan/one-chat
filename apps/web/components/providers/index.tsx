"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { TRPCProvider } from "./trpc-provider";

export const Providers = ({ children }: React.PropsWithChildren) => (
  <NextThemesProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
    disableTransitionOnChange
    enableColorScheme
  >
    <TRPCProvider>{children}</TRPCProvider>
  </NextThemesProvider>
);
