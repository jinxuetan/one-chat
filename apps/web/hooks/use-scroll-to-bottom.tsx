import { useCallback, useEffect, useRef, useState } from "react";

type ScrollFlag = ScrollBehavior | false;

export const useScrollToBottom = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const [isAtBottom, setIsAtBottom] = useState(false);
  const [scrollBehavior, setScrollBehavior] = useState<ScrollFlag>(false);

  useEffect(() => {
    if (scrollBehavior) {
      endRef.current?.scrollIntoView({ behavior: scrollBehavior });
      setScrollBehavior(false);
    }
  }, [setScrollBehavior, scrollBehavior]);

  const scrollToBottom = useCallback(
    (scrollBehavior: ScrollBehavior = "smooth") => {
      setScrollBehavior(scrollBehavior);
    },
    [setScrollBehavior]
  );

  function onViewportEnter() {
    if (!isAtBottom) setIsAtBottom(true);
  }

  function onViewportLeave() {
    if (isAtBottom) setIsAtBottom(false);
  }

  return {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
  };
};
