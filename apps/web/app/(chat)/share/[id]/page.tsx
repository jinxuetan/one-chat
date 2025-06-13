import { Chat } from "@/components/chat";
import { getThreadWithMessagesCached } from "@/lib/actions/thread";
import type { Model } from "@/lib/ai";
import { auth } from "@/lib/auth/server";
import { DEFAULT_CHAT_MODEL } from "@/lib/constants";
import type { UIMessage } from "ai";
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

  return (
    <Chat
      threadId={id}
      initialMessages={chat.messages as UIMessage[]}
      initialChatModel={chatModelFromCookie ?? DEFAULT_CHAT_MODEL}
      initialVisibilityType={chat.thread?.visibility}
      isReadonly={!isOwner}
      autoResume={true}
    />
  );
};

export default SharePage;
