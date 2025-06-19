"use client";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { cn } from "@workspace/ui/lib/utils";
import { DownloadIcon, FileText } from "lucide-react";
import {
  useState,
  Suspense,
} from "react";
import {
  type BundledLanguage,
  CodeBlock,
  CodeBlockBody,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockFilename,
  CodeBlockHeader,
  CodeBlockItem,
  type CodeBlockProps,
  CodeBlockWrapButton,
} from "./code-block";
import MermaidDiagram, { MermaidDiagramFallback } from "./mermaid-diagram";

const LANGUAGE_CLASS_REGEX = /language-(\w+)/;
const TRAILING_NEWLINE_REGEX = /\n$/;

const languageExtensions: Record<string, string> = {
  javascript: "js",
  typescript: "ts",
  python: "py",
  java: "java",
  c: "c",
  cpp: "cpp",
  csharp: "cs",
  go: "go",
  rust: "rs",
  php: "php",
  ruby: "rb",
  swift: "swift",
  kotlin: "kt",
  scala: "scala",
  r: "r",
  perl: "pl",
  dart: "dart",
  html: "html",
  css: "css",
  scss: "scss",
  sass: "sass",
  less: "less",
  jsx: "jsx",
  tsx: "tsx",
  vue: "vue",
  svelte: "svelte",
  astro: "astro",
  markdown: "md",
  mdx: "mdx",
  json: "json",
  yaml: "yml",
  yml: "yml",
  toml: "toml",
  xml: "xml",
  svg: "svg",
  bash: "sh",
  shell: "sh",
  sh: "sh",
  sql: "sql",
  prisma: "prisma",
  dockerfile: "Dockerfile",
  docker: "Dockerfile",
  graphql: "graphql",
  coffee: "coffee",
  coffeescript: "coffee",
  wasm: "wasm",
  text: "txt",
  txt: "txt",
  plaintext: "txt",
  plain: "txt",
};

export const getFilenameForLanguage = (language: string): string => {
  const normalizedLang = language.toLowerCase();
  const extension = languageExtensions[normalizedLang];

  if (!extension) {
    return `file.${normalizedLang}`;
  }

  // Special cases for specific filenames
  if (normalizedLang === "dockerfile" || normalizedLang === "docker") {
    return "Dockerfile";
  }

  if (normalizedLang === "markdown") {
    return "README.md";
  }

  // Generate appropriate filename based on language
  const baseNames: Record<string, string> = {
    java: "Example",
    csharp: "Example",
    kotlin: "Main",
    scala: "Main",
    go: "main",
    rust: "main",
    swift: "main",
    dart: "main",
    jsx: "Component",
    tsx: "Component",
    vue: "Component",
    svelte: "Component",
    astro: "page",
    html: "index",
    css: "styles",
    scss: "styles",
    sass: "styles",
    less: "styles",
    javascript: "example",
    typescript: "example",
    python: "example",
  };

  const baseName = baseNames[normalizedLang] || "file";
  return `${baseName}.${extension}`;
};

type CodeBlockWithSaveProps = CodeBlockProps & {
  language: string;
  code: string;
};

export const CodeBlockWithSave = ({
  language,
  code,
  ...codeBlockProps
}: CodeBlockWithSaveProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const filename = getFilenameForLanguage(language);
  const [customFilename, setCustomFilename] = useState(filename);

  const handleSave = () => {
    try {
      const blob = new Blob([code], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = customFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsPopoverOpen(false);
    } catch (error) {
      console.error("Failed to save file:", error);
    }
  };

  const getFileStats = () => {
    const bytes = new Blob([code]).size;
    const lines = code.split("\n").length;
    return { bytes, lines };
  };

  const { bytes, lines } = getFileStats();
  const isTextFile = ["text", "plaintext", "txt", "plain"].includes(
    language.toLowerCase()
  );

  return (
    <CodeBlock className="max-w-3xl" {...codeBlockProps}>
      <CodeBlockHeader>
        <div className="flex-1">
          <CodeBlockFilename
            value={language}
            icon={isTextFile ? FileText : undefined}
          >
            {filename}
          </CodeBlockFilename>
        </div>
        <div className="flex items-center justify-center gap-2">
          <CodeBlockWrapButton />
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="size-8 p-0 text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:hover:bg-accent/60"
              >
                <DownloadIcon className="size-4" />
                <span className="sr-only">Download code</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-80 border-border bg-background dark:border-border/60 dark:bg-card"
              align="end"
            >
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-foreground text-sm">
                    Save to File
                  </h4>
                  <p className="mt-1 text-muted-foreground text-xs">
                    {bytes} bytes • {lines} lines
                  </p>
                </div>
                <Input
                  value={customFilename}
                  onChange={(e) => setCustomFilename(e.target.value)}
                  placeholder="Enter filename"
                  className="w-full"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPopoverOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    Save
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <CodeBlockCopyButton />
        </div>
      </CodeBlockHeader>
      <CodeBlockBody>
        {(item) => (
          <CodeBlockItem key={item.language} value={item.language}>
            <CodeBlockContent language={item.language as BundledLanguage}>
              {item.code}
            </CodeBlockContent>
          </CodeBlockItem>
        )}
      </CodeBlockBody>
    </CodeBlock>
  );
};

export const CodeComponent = ({
  className,
  children,
}: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>) => {
  const match = LANGUAGE_CLASS_REGEX.exec(className || "");
  const language = match?.[1] || "plaintext";
  const code = String(children).replace(TRAILING_NEWLINE_REGEX, "");

  if (language === "mermaid") {
    return (
      <div className={cn("my-4 w-full", className)}>
        <CodeBlock
          className="max-w-3xl"
          data={[{ language: "mermaid", code }]}
          defaultValue="mermaid"
        >
          <CodeBlockHeader>
            <div className="flex-1">
              <CodeBlockFilename value={language}>
                diagram.mmd
              </CodeBlockFilename>
            </div>
            <div className="flex items-center justify-center gap-2">
              <CodeBlockCopyButton />
            </div>
          </CodeBlockHeader>
          <div className="p-0">
            <Suspense fallback={<MermaidDiagramFallback />}>
              <MermaidDiagram code={code} />
            </Suspense>
          </div>
        </CodeBlock>
      </div>
    );
  }

  const data: CodeBlockProps["data"] = [
    {
      language,
      code,
    },
  ];

  const isInline = !children?.toString()?.includes("\n");
  if (isInline) {
    return (
      <code className="mx-0.5 overflow-auto rounded-md border bg-secondary/50 px-[5px] py-0.5 font-medium group-[:is(pre)]:flex group-[:is(pre)]:w-full">
        {children}
      </code>
    );
  }

  return (
    <CodeBlockWithSave
      className={cn("my-4 w-full", className)}
      data={data}
      defaultValue={data[0]?.language ?? "plaintext"}
      language={language}
      code={code}
    />
  );
};
