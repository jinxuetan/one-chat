"use client";

import {
  type IconType,
  SiAstro,
  SiBiome,
  SiBower,
  SiBun,
  SiC,
  SiCircleci,
  SiCoffeescript,
  SiCplusplus,
  SiCss,
  SiCssmodules,
  SiDart,
  SiDocker,
  SiDocusaurus,
  SiDotenv,
  SiEditorconfig,
  SiEslint,
  SiGatsby,
  SiGitignoredotio,
  SiGnubash,
  SiGo,
  SiGraphql,
  SiGrunt,
  SiGulp,
  SiHandlebarsdotjs,
  SiHtml5,
  SiJavascript,
  SiJest,
  SiJson,
  SiLess,
  SiMarkdown,
  SiMdx,
  SiMintlify,
  SiMocha,
  SiMysql,
  SiNextdotjs,
  SiPerl,
  SiPhp,
  SiPostcss,
  SiPrettier,
  SiPrisma,
  SiPug,
  SiPython,
  SiR,
  SiReact,
  SiReadme,
  SiRedis,
  SiRemix,
  SiRive,
  SiRollupdotjs,
  SiRuby,
  SiSanity,
  SiSass,
  SiScala,
  SiSentry,
  SiShadcnui,
  SiStorybook,
  SiStylelint,
  SiSublimetext,
  SiSvelte,
  SiSvg,
  SiSwift,
  SiTailwindcss,
  SiToml,
  SiTypescript,
  SiVercel,
  SiVite,
  SiVuedotjs,
  SiWebassembly,
} from "@icons-pack/react-simple-icons";
import { useControllableState } from "@radix-ui/react-use-controllable-state";
import {
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { Button } from "@workspace/ui/components/button";
import { CopyButton } from "@workspace/ui/components/copy-button";
import { cn } from "@workspace/ui/lib/utils";
import { AlignJustify, WrapText } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import {
  type BundledLanguage,
  type CodeOptionsMultipleThemes,
  codeToHtml,
} from "shiki";
export type { BundledLanguage } from "shiki";

const filenameIconMap = {
  ".env": SiDotenv,
  "*.astro": SiAstro,
  "biome.json": SiBiome,
  ".bowerrc": SiBower,
  "bun.lockb": SiBun,
  "*.c": SiC,
  "*.cpp": SiCplusplus,
  ".circleci/config.yml": SiCircleci,
  "*.coffee": SiCoffeescript,
  "*.module.css": SiCssmodules,
  "*.css": SiCss,
  "*.dart": SiDart,
  Dockerfile: SiDocker,
  "docusaurus.config.js": SiDocusaurus,
  ".editorconfig": SiEditorconfig,
  ".eslintrc": SiEslint,
  "eslint.config.*": SiEslint,
  "gatsby-config.*": SiGatsby,
  ".gitignore": SiGitignoredotio,
  "*.go": SiGo,
  "*.graphql": SiGraphql,
  "*.sh": SiGnubash,
  "Gruntfile.*": SiGrunt,
  "gulpfile.*": SiGulp,
  "*.hbs": SiHandlebarsdotjs,
  "*.html": SiHtml5,
  "*.js": SiJavascript,
  "*.json": SiJson,
  "*.test.js": SiJest,
  "*.less": SiLess,
  "*.md": SiMarkdown,
  "*.mdx": SiMdx,
  "mintlify.json": SiMintlify,
  "mocha.opts": SiMocha,
  "*.mustache": SiHandlebarsdotjs,
  "*.sql": SiMysql,
  "next.config.*": SiNextdotjs,
  "*.pl": SiPerl,
  "*.php": SiPhp,
  "postcss.config.*": SiPostcss,
  "prettier.config.*": SiPrettier,
  "*.prisma": SiPrisma,
  "*.pug": SiPug,
  "*.py": SiPython,
  "*.r": SiR,
  "*.rb": SiRuby,
  "*.jsx": SiReact,
  "*.tsx": SiReact,
  "readme.md": SiReadme,
  "*.rdb": SiRedis,
  "remix.config.*": SiRemix,
  "*.riv": SiRive,
  "rollup.config.*": SiRollupdotjs,
  "sanity.config.*": SiSanity,
  "*.sass": SiSass,
  "*.scss": SiSass,
  "*.sc": SiScala,
  "*.scala": SiScala,
  "sentry.client.config.*": SiSentry,
  "components.json": SiShadcnui,
  "storybook.config.*": SiStorybook,
  "stylelint.config.*": SiStylelint,
  ".sublime-settings": SiSublimetext,
  "*.svelte": SiSvelte,
  "*.svg": SiSvg,
  "*.swift": SiSwift,
  "tailwind.config.*": SiTailwindcss,
  "*.toml": SiToml,
  "*.ts": SiTypescript,
  "vercel.json": SiVercel,
  "vite.config.*": SiVite,
  "*.vue": SiVuedotjs,
  "*.wasm": SiWebassembly,
};

const lineNumberClassNames = cn(
  "[&_code]:[counter-reset:line]",
  "[&_code]:[counter-increment:line_0]",
  "[&_.line]:before:content-[counter(line)]",
  "[&_.line]:before:inline-block",
  "[&_.line]:before:[counter-increment:line]",
  "[&_.line]:before:w-4",
  "[&_.line]:before:mr-3",
  "[&_.line]:before:text-[11px]",
  "[&_.line]:before:text-right",
  "[&_.line]:before:text-muted-foreground/35",
  "[&_.line]:before:font-mono",
  "[&_.line]:before:select-none",
  "[&_.line]:before:leading-5"
);

const darkModeClassNames = cn(
  "dark:[&_.shiki]:!text-[var(--shiki-dark)]",
  "dark:[&_.shiki]:!bg-[var(--shiki-dark-bg)]",
  "dark:[&_.shiki]:![font-style:var(--shiki-dark-font-style)]",
  "dark:[&_.shiki]:![font-weight:var(--shiki-dark-font-weight)]",
  "dark:[&_.shiki]:![text-decoration:var(--shiki-dark-text-decoration)]",
  "dark:[&_.shiki_span]:!text-[var(--shiki-dark)]",
  "dark:[&_.shiki_span]:![font-style:var(--shiki-dark-font-style)]",
  "dark:[&_.shiki_span]:![font-weight:var(--shiki-dark-font-weight)]",
  "dark:[&_.shiki_span]:![text-decoration:var(--shiki-dark-text-decoration)]"
);

const lineHighlightClassNames = cn(
  "[&_.line.highlighted]:bg-blue-50/60",
  "[&_.line.highlighted]:before:bg-blue-400",
  "[&_.line.highlighted]:before:absolute",
  "[&_.line.highlighted]:before:left-0",
  "[&_.line.highlighted]:before:top-0",
  "[&_.line.highlighted]:before:bottom-0",
  "[&_.line.highlighted]:before:w-px",
  "dark:[&_.line.highlighted]:!bg-blue-500/5"
);

const lineDiffClassNames = cn(
  "[&_.line.diff]:before:absolute",
  "[&_.line.diff]:before:left-0",
  "[&_.line.diff]:before:top-0",
  "[&_.line.diff]:before:bottom-0",
  "[&_.line.diff]:before:w-px",
  "[&_.line.diff.add]:bg-emerald-50/50",
  "[&_.line.diff.add]:before:bg-emerald-400",
  "[&_.line.diff.remove]:bg-rose-50/50",
  "[&_.line.diff.remove]:before:bg-rose-400",
  "dark:[&_.line.diff.add]:!bg-emerald-500/5",
  "dark:[&_.line.diff.remove]:!bg-rose-500/5"
);

const lineFocusedClassNames = cn(
  "[&_code:has(.focused)_.line]:opacity-30",
  "[&_code:has(.focused)_.line]:transition-opacity",
  "[&_code:has(.focused)_.line]:duration-150",
  "[&_code:has(.focused)_.line.focused]:opacity-100"
);

const wordHighlightClassNames = cn(
  "[&_.highlighted-word]:bg-blue-50/60",
  "[&_.highlighted-word]:px-0.5",
  "[&_.highlighted-word]:rounded-sm",
  "dark:[&_.highlighted-word]:!bg-blue-500/8"
);

const codeBlockClassName = cn(
  "mt-0 bg-background text-[13px] leading-5",
  "font-mono antialiased",
  "[&_pre]:py-3",
  "[&_pre]:px-0",
  "[&_.shiki]:!bg-[var(--shiki-bg)]",
  "[&_code]:w-full",
  "[&_code]:grid",
  "[&_code]:overflow-x-auto",
  "[&_code]:bg-transparent",
  "[&_.line]:px-3",
  "[&_.line]:w-full",
  "[&_.line]:relative",
  "[&_.line]:min-h-[20px]",
  "[&_.line]:flex",
  "[&_.line]:items-center"
);

const highlight = (
  html: string,
  language?: BundledLanguage,
  themes?: CodeOptionsMultipleThemes["themes"]
) =>
  codeToHtml(html, {
    lang: language ?? "typescript",
    themes: themes ?? {
      light: "github-light",
      dark: "github-dark-default",
    },
    transformers: [
      transformerNotationDiff({
        matchAlgorithm: "v3",
      }),
      transformerNotationHighlight({
        matchAlgorithm: "v3",
      }),
      transformerNotationWordHighlight({
        matchAlgorithm: "v3",
      }),
      transformerNotationFocus({
        matchAlgorithm: "v3",
      }),
      transformerNotationErrorLevel({
        matchAlgorithm: "v3",
      }),
    ],
  });

type CodeBlockData = {
  language: string;
  filename?: string;
  code: string;
};

type CodeBlockContextType = {
  value: string | undefined;
  onValueChange: ((value: string) => void) | undefined;
  data: CodeBlockData[];
  isWrapped: boolean;
  onWrappedChange: (wrapped: boolean) => void;
};

const CodeBlockContext = createContext<CodeBlockContextType>({
  value: undefined,
  onValueChange: undefined,
  data: [],
  isWrapped: false,
  onWrappedChange: () => {},
});

export type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  data: CodeBlockData[];
  defaultWrapped?: boolean;
  isWrapped?: boolean;
  onWrappedChange?: (wrapped: boolean) => void;
};

export const CodeBlock = ({
  value: controlledValue,
  onValueChange: controlledOnValueChange,
  defaultValue,
  className,
  data,
  defaultWrapped = false,
  isWrapped: controlledIsWrapped,
  onWrappedChange: controlledOnWrappedChange,
  ...props
}: CodeBlockProps) => {
  const [value, onValueChange] = useControllableState({
    defaultProp: defaultValue ?? "",
    prop: controlledValue,
    onChange: controlledOnValueChange,
  });

  const [isWrapped, onWrappedChange] = useControllableState({
    defaultProp: defaultWrapped,
    prop: controlledIsWrapped,
    onChange: controlledOnWrappedChange,
  });

  return (
    <CodeBlockContext.Provider
      value={{ value, onValueChange, data, isWrapped, onWrappedChange }}
    >
      <div
        className={cn(
          "group relative w-full overflow-hidden rounded-lg border border-border/40",
          "bg-neutral-100 dark:bg-neutral-900",
          "transition-colors duration-200",
          "dark:border-border/30 dark:bg-muted/10",
          className
        )}
        {...props}
      />
    </CodeBlockContext.Provider>
  );
};

export type CodeBlockHeaderProps = HTMLAttributes<HTMLDivElement>;

export const CodeBlockHeader = ({
  className,
  ...props
}: CodeBlockHeaderProps) => (
  <div
    className={cn(
      "flex flex-row items-center border-border/30 border-b",
      "bg-muted/80 px-3 py-1",
      "dark:border-border/20 dark:bg-muted/20",
      className
    )}
    {...props}
  />
);

export type CodeBlockFilenameProps = HTMLAttributes<HTMLDivElement> & {
  icon?: IconType;
  value?: string;
};

export const CodeBlockFilename = ({
  className,
  icon,
  value,
  children,
  ...props
}: CodeBlockFilenameProps) => {
  const { value: activeValue } = useContext(CodeBlockContext);
  const defaultIcon = Object.entries(filenameIconMap).find(([pattern]) => {
    const regex = new RegExp(
      `^${pattern
        .replace(/\\/g, "\\\\")
        .replace(/\./g, "\\.")
        .replace(/\*/g, ".*")}$`
    );
    return regex.test(children as string);
  })?.[1];
  const Icon = icon ?? defaultIcon;

  if (value !== activeValue) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 font-medium text-foreground/70 text-xs",
        "transition-colors duration-150",
        className
      )}
      {...props}
    >
      {Icon && <Icon className="size-4 shrink-0 text-foreground/50" />}
      <span className="flex-1 truncate font-mono">{value}</span>
    </div>
  );
};

export type CodeBlockWrapButtonProps = HTMLAttributes<HTMLDivElement>;

export const CodeBlockWrapButton = ({
  className,
  ...props
}: CodeBlockWrapButtonProps) => {
  const { isWrapped, onWrappedChange } = useContext(CodeBlockContext);

  const handleToggleWrap = () => {
    onWrappedChange?.(!isWrapped);
  };

  return (
    <div className={cn("shrink-0", className)} {...props}>
      <Button
        variant="ghost"
        onClick={handleToggleWrap}
        className={cn(
          "size-8 p-0 text-foreground/50 hover:bg-neutral-200 hover:text-foreground dark:hover:bg-neutral-800",
          isWrapped && "bg-accent/50 text-foreground/80"
        )}
        title={isWrapped ? "Disable word wrap" : "Enable word wrap"}
      >
        {isWrapped ? (
          <WrapText className="size-4" />
        ) : (
          <AlignJustify className="size-4" />
        )}
        <span className="sr-only">
          {isWrapped ? "Disable word wrap" : "Enable word wrap"}
        </span>
      </Button>
    </div>
  );
};

export type CodeBlockCopyButtonProps = HTMLAttributes<HTMLDivElement> & {
  onCopy?: () => void;
  onError?: (error: Error) => void;
};

export const CodeBlockCopyButton = ({
  onCopy,
  onError,
  className,
  ...props
}: CodeBlockCopyButtonProps) => {
  const { data, value } = useContext(CodeBlockContext);
  const code = data.find((item) => item.language === value)?.code;

  const handleCopy = async () => {
    if (
      typeof window === "undefined" ||
      !navigator.clipboard.writeText ||
      !code
    ) {
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      onCopy?.();
    } catch (error) {
      onError?.(error as Error);
    }
  };

  return (
    <div className={cn("shrink-0", className)} {...props}>
      <CopyButton onCopy={handleCopy} />
    </div>
  );
};

type CodeBlockFallbackProps = HTMLAttributes<HTMLDivElement>;

const CodeBlockFallback = ({ children, ...props }: CodeBlockFallbackProps) => (
  <div
    className={cn(
      "bg-background text-foreground/80",
      "font-mono text-[13px] leading-5"
    )}
    {...props}
  >
    <code className="mx-0.5 overflow-auto rounded-md bg-secondary/50 px-[7px] py-1 group-[:is(pre)]:flex group-[:is(pre)]:w-full">
      {children
        ?.toString()
        .split("\n")
        .map((line, i) => (
          <span key={i} className="line block min-h-[20px] px-3">
            {line}
          </span>
        ))}
    </code>
  </div>
);

export type CodeBlockBodyProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  children: (item: CodeBlockData) => ReactNode;
};

export const CodeBlockBody = ({
  className,
  children,
  ...props
}: CodeBlockBodyProps) => {
  const { data } = useContext(CodeBlockContext);

  return (
    <div className={cn("relative", className)} {...props}>
      {data.map(children)}
    </div>
  );
};

export type CodeBlockItemProps = HTMLAttributes<HTMLDivElement> & {
  value: string;
  lineNumbers?: boolean;
};

export const CodeBlockItem = ({
  children,
  lineNumbers = true,
  className,
  value,
  ...props
}: CodeBlockItemProps) => {
  const { value: activeValue, isWrapped } = useContext(CodeBlockContext);

  if (value !== activeValue) {
    return null;
  }

  return (
    <div
      className={cn(
        codeBlockClassName,
        lineHighlightClassNames,
        lineDiffClassNames,
        lineFocusedClassNames,
        wordHighlightClassNames,
        darkModeClassNames,
        lineNumbers && lineNumberClassNames,
        "relative overflow-x-auto",
        "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/30",
        "hover:scrollbar-thumb-border/50",
        isWrapped && "[&_pre]:whitespace-pre-wrap",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export type CodeBlockContentProps = HTMLAttributes<HTMLDivElement> & {
  themes?: CodeOptionsMultipleThemes["themes"];
  language?: BundledLanguage;
  syntaxHighlighting?: boolean;
  children: string;
};

export const CodeBlockContent = ({
  children,
  themes,
  language,
  syntaxHighlighting = true,
  ...props
}: CodeBlockContentProps) => {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    if (!syntaxHighlighting) {
      return;
    }

    highlight(children as string, language, themes)
      .then(setHtml)
      .catch(console.error);
  }, [children, themes, syntaxHighlighting, language]);

  if (!syntaxHighlighting || !html) {
    return <CodeBlockFallback {...props}>{children}</CodeBlockFallback>;
  }

  return (
    <div
      // biome-ignore lint/security/noDangerouslySetInnerHtml: "Kinda how Shiki works"
      dangerouslySetInnerHTML={{ __html: html }}
      {...props}
    />
  );
};
