"use client";

import { cn } from "@workspace/ui/lib/utils";
import Link from "next/link";
import { memo } from "react";
import type { HTMLAttributes } from "react";
import ReactMarkdown, { type Options } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import { CodeComponent } from "./code-component";

export type MarkdownProps = HTMLAttributes<HTMLDivElement> & {
  options?: Options;
  children: Options["children"];
};

const components: Options["components"] = {
  code: CodeComponent,
  pre: ({ children }) => <>{children}</>,
  ol: ({ children, ...props }) => (
    <ol className="ml-4 list-outside list-decimal" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="py-1" {...props}>
      {children}
    </li>
  ),
  ul: ({ children, ...props }) => (
    <ul className="ml-4 list-outside list-decimal" {...props}>
      {children}
    </ul>
  ),
  strong: ({ children, ...props }) => (
    <span className="font-semibold" {...props}>
      {children}
    </span>
  ),
  a: ({ children, ...props }) => (
    // @ts-expect-error
    <Link
      className="text-blue-500 hover:underline"
      target="_blank"
      rel="noreferrer"
      {...props}
    >
      {children}
    </Link>
  ),
  h1: ({ children, ...props }) => (
    <h1 className="mt-6 mb-2 font-semibold text-3xl" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="mt-6 mb-2 font-semibold text-2xl" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mt-6 mb-2 font-semibold text-xl" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="mt-6 mb-2 font-semibold text-lg" {...props}>
      {children}
    </h4>
  ),
  h5: ({ children, ...props }) => (
    <h5 className="mt-6 mb-2 font-semibold text-base" {...props}>
      {children}
    </h5>
  ),
  h6: ({ children, ...props }) => (
    <h6 className="mt-6 mb-2 font-semibold text-sm" {...props}>
      {children}
    </h6>
  ),
  hr: ({ children, ...props }) => <hr className="!my-4" {...props} />,
};

const remarkPlugins = [remarkGfm, remarkMath];
const rehypePlugins = [rehypeKatex];

export const Markdown = memo(
  ({ className, options, children, ...props }: MarkdownProps) => {
    return (
      <div
        className={cn(
          "prose prose-neutral dark:prose-invert prose-pre:m-0 prose-pre:bg-transparent prose-pre:p-0 max-w-none !w-full",
          className
        )}
        {...props}
      >
        <ReactMarkdown
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
          components={components}
        >
          {children}
        </ReactMarkdown>
      </div>
    );
  },
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Markdown.displayName = "Markdown";
