"use client";

import { Button } from "@workspace/ui/components/button";
import { Home, Search, MessageCircle, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const suggestions = [
  {
    text: "Start a new conversation",
    icon: MessageCircle,
    href: "/",
  },
  {
    text: "Go back home",
    icon: Home,
    href: "/",
  },
];

export default function NotFound() {
  const handleGoBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  return (
    <div className="flex h-dvh w-full items-center justify-center bg-background">
      <div className="flex max-w-2xl flex-col items-center justify-center px-4 text-center">
        {/* Logo Section */}
        <div className="mb-8 flex justify-center">
          <div className="mb-4 grid size-20 place-items-center rounded-2xl border border-neutral-200/60 bg-gradient-to-br from-neutral-100 to-neutral-200 shadow-xs dark:border-neutral-800/40 dark:from-neutral-800 dark:to-neutral-900">
            <Image
              src="/assets/one-chat-logo.svg"
              alt="One Chat"
              width={60}
              height={60}
              className="dark:invert"
            />
          </div>
        </div>

        {/* Error Content */}
        <div className="mb-12 space-y-4">
          <div className="space-y-2">
            <h1 className="font-semibold text-6xl text-foreground tracking-tight">
              404
            </h1>
            <h2 className="font-light text-2xl text-foreground tracking-tight">
              Page not found
            </h2>
          </div>
          <p className="mx-auto max-w-md text-lg text-muted-foreground leading-relaxed">
            Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="gap-2">
            <Link href="/">
              <Home className="size-4" />
              Go Home
            </Link>
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleGoBack}>
            <ArrowLeft className="size-4" />
            Go Back
          </Button>
        </div>

        {/* Suggestion Cards */}
        <div className="w-full max-w-md space-y-3">
          <p className="mb-4 font-medium text-foreground text-sm">
            Or try one of these:
          </p>
          {suggestions.map((suggestion, index) => {
            const IconComponent = suggestion.icon;
            return (
              <Link
                key={index}
                href={suggestion.href}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-3 backdrop-blur-sm transition-colors hover:bg-neutral-100/50 dark:border-neutral-800/40 dark:bg-neutral-900/20 dark:hover:bg-neutral-800/30"
              >
                <IconComponent
                  className="size-4 flex-shrink-0 text-muted-foreground"
                  strokeWidth={1.5}
                />
                <span className="text-muted-foreground text-sm">
                  {suggestion.text}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
