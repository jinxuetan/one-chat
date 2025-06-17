import { Chat } from "@/components/chat";
import type { Model } from "@/lib/ai";
import { auth } from "@/lib/auth/server";
import { DEFAULT_CHAT_MODEL } from "@/lib/constants";

import { generateUUID, resolveInitialModel } from "@/lib/utils";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "One Chat | AI-Powered Conversations",
  description:
    "Start intelligent conversations with AI models. Fast, open-source, and privacy-focused chat application.",
  openGraph: {
    title: "One Chat | AI-Powered Conversations",
    description:
      "Start intelligent conversations with AI models. Fast, open-source, and privacy-focused chat application.",
    type: "website",
    url: "/",
    siteName: "One Chat",
  },
  twitter: {
    card: "summary",
    title: "One Chat | AI-Powered Conversations",
    description:
      "Start intelligent conversations with AI models. Fast, open-source, and privacy-focused chat application.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const ChatPage = async () => {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return redirect("/auth");

  const uuid = generateUUID();
  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get("chat-model")?.value as
    | Model
    | undefined;

  // Use user-specific cookie name
  const userId = session.user.id;
  const hasKeysFromCookie =
    cookieStore.get(`has-api-keys-${userId}`)?.value === "true";

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
      hasKeys={hasKeysFromCookie}
      user={{
        id: session.user.id,
        name: session.user.name,
      }}
    />
  );
};

export default ChatPage;
