import { Chat } from "@/components/chat";
import { getThreadWithMessagesCached } from "@/lib/actions/thread";
import type { Model } from "@/lib/ai";
import { auth } from "@/lib/auth/server";
import { DEFAULT_CHAT_MODEL } from "@/lib/constants";
import type { UIMessage } from "ai";
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

    // Return empty chat for optimistic branch creation
    return (
      <Chat
        threadId={id}
        initialMessages={[]}
        initialChatModel={chatModelFromCookie ?? DEFAULT_CHAT_MODEL}
        initialVisibilityType="private"
        isReadonly={false}
        autoResume={false}
      />
    );
  }

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get("chat-model")?.value as
    | Model
    | undefined;

  return (
    <Chat
      threadId={id}
      initialMessages={
        chat.messages.map((message) => ({
          ...message,
          experimental_attachments: message.attachments,
        })) as UIMessage[]
      }
      initialChatModel={chatModelFromCookie ?? DEFAULT_CHAT_MODEL}
      initialVisibilityType={chat.thread?.visibility}
      isReadonly={session.user?.id !== chat.thread?.userId}
      autoResume={true}
    />
  );
};

export default ThreadPage;
