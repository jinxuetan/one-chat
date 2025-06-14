import { Chat } from "@/components/chat";
import type { Model } from "@/lib/ai";
import { DEFAULT_CHAT_MODEL } from "@/lib/constants";
import { getSessionCookie } from "better-auth/cookies";

import { generateUUID, resolveInitialModel } from "@/lib/utils";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

const ChatPage = async () => {
  const sessionCookie = getSessionCookie(new Headers(await headers()));
  if (!sessionCookie) return redirect("/auth");

  const uuid = generateUUID();
  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get("chat-model")?.value as
    | Model
    | undefined;

  const resolvedInitialModel = resolveInitialModel(
    [],
    modelIdFromCookie ?? null,
    DEFAULT_CHAT_MODEL
  );

  return (
    <Chat
      key={uuid}
      threadId={uuid}
      initialMessages={[]}
      initialChatModel={resolvedInitialModel}
      isReadonly={false}
      initialVisibilityType="private"
      autoResume={false}
      initialIsNewThread={true}
    />
  );
};

export default ChatPage;
