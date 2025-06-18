"use client";

import { Button } from "@workspace/ui/components/button";
import { useRouter } from "next/navigation";

export const NewChatButton = () => {
  const router = useRouter();
  const handleNewChat = () => {
    router.push("/");
    router.refresh();
  };
  return <Button onClick={handleNewChat}>New Chat</Button>;
};
