import { Chat } from "@/components/chat";
import { getThreadWithMessagesCached } from "@/lib/actions/thread";
import type { Model } from "@/lib/ai";
import { auth } from "@/lib/auth/server";
import { DEFAULT_CHAT_MODEL } from "@/lib/constants";
import { resolveInitialModel } from "@/lib/utils";
import type { MessageWithMetadata } from "@/types";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

interface SharePageProps {
  params: Promise<{
    id: string;
  }>;
}

const SharePage = async ({ params }: SharePageProps) => {
  const { id } = await params;

  const requestHeaders = await headers();
  const [session, chat] = await Promise.all([
    auth.api.getSession({ headers: requestHeaders }),
    getThreadWithMessagesCached(id),
  ]);

  if (!chat?.thread) return notFound();

  const isOwner = session?.user?.id === chat.thread.userId;
  const isPrivate = chat.thread.visibility === "private";

  if (isPrivate) {
    if (!isOwner) return notFound();
    return redirect(`/thread/${id}`);
  }

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get("chat-model")?.value as
    | Model
    | undefined;

  const messagesWithMetadata = chat.messages as MessageWithMetadata[];
  const resolvedInitialModel = resolveInitialModel(
    messagesWithMetadata,
    chatModelFromCookie ?? null,
    DEFAULT_CHAT_MODEL
  );

  return (
    <Chat
      threadId={id}
      initialMessages={messagesWithMetadata}
      initialChatModel={resolvedInitialModel}
      initialVisibilityType={chat.thread?.visibility}
      isReadonly={!isOwner}
      autoResume={true}
    />
  );
};

export default SharePage;
