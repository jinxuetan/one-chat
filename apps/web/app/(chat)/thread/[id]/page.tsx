import { Chat } from "@/components/chat";
import { getThreadWithMessagesCached } from "@/lib/actions/thread";
import type { Model } from "@/lib/ai";
import { auth } from "@/lib/auth/server";
import { DEFAULT_CHAT_MODEL } from "@/lib/constants";
import { resolveInitialModel } from "@/lib/utils";
import type { MessageWithMetadata } from "@/types";
import type { Metadata } from "next";
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

export async function generateMetadata({
  params,
}: ThreadPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const requestHeaders = await headers();
    const [session, chat] = await Promise.all([
      auth.api.getSession({ headers: requestHeaders }),
      getThreadWithMessagesCached(id),
    ]);

    // If no session, this will redirect to auth anyway
    if (!session) {
      return {
        title: "Sign In Required | One Chat",
        description: "Please sign in to view this chat thread.",
      };
    }

    if (!chat?.thread) {
      return {
        title: "New Chat | One Chat",
        description: "Start a new AI conversation with One Chat.",
      };
    }

    // Check if user has access to this thread
    const hasAccess = session.user?.id === chat.thread.userId;
    if (!hasAccess) {
      return {
        title: "Chat Not Found | One Chat",
        description: "The requested chat thread could not be found.",
      };
    }

    // Get the first user message for description
    const firstUserMessage = chat.messages.find(
      (msg) => msg.role === "user"
    )?.content;

    // Create a truncated description from the first message
    const description = firstUserMessage
      ? typeof firstUserMessage === "string"
        ? firstUserMessage.slice(0, 160) +
          (firstUserMessage.length > 160 ? "..." : "")
        : "AI conversation"
      : "AI conversation";

    const title = chat.thread.title || "New Thread";
    const fullTitle = `${title} | One Chat`;

    return {
      title: fullTitle,
      description,
      robots: {
        index: false, // Don't index private user threads
        follow: false,
      },
    };
  } catch (_error) {
    return {
      title: "Chat | One Chat",
      description: "AI-powered chat application.",
    };
  }
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
    const hasKeysFromCookie =
      cookieStore.get(`has-api-keys-${userId}`)?.value === "true";

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
        username={session.user.name}
      />
    );
  }

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get("chat-model")?.value as
    | Model
    | undefined;

  const resolvedInitialModel = resolveInitialModel(
    chat.messages as MessageWithMetadata[],
    chatModelFromCookie ?? null,
    DEFAULT_CHAT_MODEL
  );

  // Use user-specific cookie name
  const userId = session.user.id;
  const hasKeysFromCookie =
    cookieStore.get(`has-api-keys-${userId}`)?.value === "true";

  return (
    <Chat
      threadId={id}
      initialMessages={chat.messages as MessageWithMetadata[]}
      initialChatModel={resolvedInitialModel}
      initialVisibilityType={chat.thread?.visibility}
      isReadonly={session.user?.id !== chat.thread?.userId}
      autoResume={true}
      hasKeys={hasKeysFromCookie}
      username={session.user.name}
    />
  );
};

export default ThreadPage;
