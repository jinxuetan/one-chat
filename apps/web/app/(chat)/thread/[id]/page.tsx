import { Chat } from "@/components/chat";
import { getThreadWithMessagesCached } from "@/lib/actions/thread";
import type { Model } from "@/lib/ai";
import { auth } from "@/lib/auth/server";
import { DEFAULT_CHAT_MODEL } from "@/lib/constants";
import { resolveInitialModel } from "@/lib/utils";
import type { MessageWithMetadata } from "@/types";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

interface ThreadPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    branch: string;
  }>;
}

const ThreadPage = async ({ params, searchParams }: ThreadPageProps) => {
  const [{ id }, { branch }] = await Promise.all([params, searchParams]);

  const requestHeaders = await headers();
  const [session, chat] = await Promise.all([
    auth.api.getSession({ headers: requestHeaders }),
    getThreadWithMessagesCached(id),
  ]);

  if (!session) return redirect("/auth");

  const isBranchingThread = branch === "true";

  // Handle optimistic navigation: thread might not exist yet (being created)
  if (!chat?.thread) {
    if (!isBranchingThread) return notFound();

    const cookieStore = await cookies();
    const chatModelFromCookie = cookieStore.get("chat-model")?.value as
      | Model
      | undefined;

    const resolvedInitialModel = resolveInitialModel(
      [],
      chatModelFromCookie ?? null,
      DEFAULT_CHAT_MODEL
    );
    
    // Use user-specific cookie name
    const userId = session.user.id;
    const hasKeysFromCookie = cookieStore.get(`has-api-keys-${userId}`)?.value === "true";

    // Return empty chat for optimistic branch creation
    return (
      <Chat
        threadId={id}
        initialMessages={[]}
        initialChatModel={resolvedInitialModel}
        initialVisibilityType="private"
        isReadonly={false}
        autoResume={false}
        hasKeys={hasKeysFromCookie}
      />
    );
  }

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get("chat-model")?.value as
    | Model
    | undefined;

  const messagesWithMetadata = chat.messages.map((message) => ({
    ...message,
    experimental_attachments: message.attachments,
  })) as MessageWithMetadata[];

  const resolvedInitialModel = resolveInitialModel(
    messagesWithMetadata,
    chatModelFromCookie ?? null,
    DEFAULT_CHAT_MODEL
  );

  // Use user-specific cookie name  
  const userId = session.user.id;
  const hasKeysFromCookie = cookieStore.get(`has-api-keys-${userId}`)?.value === "true";

  return (
    <Chat
      threadId={id}
      initialMessages={messagesWithMetadata}
      initialChatModel={resolvedInitialModel}
      initialVisibilityType={chat.thread?.visibility}
      isReadonly={session.user?.id !== chat.thread?.userId}
      autoResume={true}
      hasKeys={hasKeysFromCookie}
    />
  );
};

export default ThreadPage;
