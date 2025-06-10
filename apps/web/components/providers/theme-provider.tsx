import { ThemeProvider as NextThemesProvider } from "next-themes";

const ThemeProvider = ({ children }: Readonly<React.PropsWithChildren>) => (
  <NextThemesProvider
    attribute="class"
    defaultTheme="light"
    enableSystem
    disableTransitionOnChange
    enableColorScheme
  >
    {children}
  </NextThemesProvider>
);

export default ThemeProvider;
