"use client";

import { cn } from "@workspace/ui/lib/utils";
import { motion } from "motion/react";

interface LoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  text?: string;
}

export const Loading = ({
  className,
  size = "md",
  text = "Loading...",
}: LoadingProps) => {
  const sizeConfig = {
    sm: {
      container: "gap-1",
      dot: "size-1.5",
      text: "text-xs",
    },
    md: {
      container: "gap-1.5",
      dot: "size-2",
      text: "text-sm",
    },
    lg: {
      container: "gap-2",
      dot: "size-2.5",
      text: "text-base",
    },
  };

  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        config.container,
        className
      )}
    >
      <div className={cn("flex items-center", config.container)}>
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className={cn("rounded-full bg-foreground/60", config.dot)}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 1.2,
              repeat: Number.POSITIVE_INFINITY,
              delay: index * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      {text && (
        <span className={cn("font-medium text-muted-foreground", config.text)}>
          {text}
        </span>
      )}
    </div>
  );
};

export const LoadingCard = ({
  className,
  children,
  ...props
}: LoadingProps & { children?: React.ReactNode }) => {
  return (
    <div
      className={cn(
        "flex min-h-[200px] w-full items-center justify-center rounded-xl border border-border/40 bg-muted/30 backdrop-blur-sm transition-colors duration-200 dark:border-border/30 dark:bg-muted/10",
        className
      )}
    >
      {children || <Loading {...props} />}
    </div>
  );
};

export const LoadingPage = ({ className, ...props }: LoadingProps) => {
  return (
    <div
      className={cn(
        "flex h-dvh w-full items-center justify-center bg-background",
        className
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-full border border-border/30 bg-muted/50 p-6 shadow-xs backdrop-blur-sm dark:border-border/20 dark:bg-muted/20">
          <Loading size="lg" text="" {...props} />
        </div>
        <p className="font-medium text-muted-foreground text-sm">
          {props.text || "Loading..."}
        </p>
      </div>
    </div>
  );
};

export const LoadingSkeleton = ({
  className,
  lines = 3,
  ...props
}: {
  className?: string;
  lines?: number;
}) => {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {Array.from({ length: lines }).map((_, index) => (
        <motion.div
          key={index}
          className="h-4 rounded-md bg-muted/60"
          style={{
            width: `${Math.random() * 30 + 70}%`,
          }}
          animate={{
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
            delay: index * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};
