"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export const Providers = ({ children }: React.PropsWithChildren) => (
  <NextThemesProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
    disableTransitionOnChange
    enableColorScheme
  >
    {children}
  </NextThemesProvider>
);
