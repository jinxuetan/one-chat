"use client";

import { useTheme } from "next-themes";
import NextTopLoader from "nextjs-toploader";

export const TopLoader = () => {
  const { theme } = useTheme();
  return (
    <NextTopLoader
      color={theme === "dark" ? "#d4d4d4" : "#171717"}
      shadow={false}
      showSpinner={false}
    />
  );
};
