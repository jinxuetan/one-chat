import { Chat } from "@/components/chat";
import { getThreadWithMessagesCached } from "@/lib/actions/thread";
import type { Model } from "@/lib/ai";
import { auth } from "@/lib/auth/server";
import { siteConfig } from "@/lib/config";
import { DEFAULT_CHAT_MODEL } from "@/lib/constants";
import { resolveInitialModel } from "@/lib/utils";
import type { MessageWithMetadata } from "@/types";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

interface SharePageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const chat = await getThreadWithMessagesCached(id);

    if (!chat?.thread || chat.thread.visibility === "private") {
      return {
        title: "Chat Not Found | One Chat",
        description:
          "The requested chat thread could not be found or is private.",
        openGraph: {
          title: "Chat Not Found | One Chat",
          description: "The requested chat thread could not be found or is private.",
          type: "article",
          url: `/share/${id}`,
          siteName: siteConfig.name,
          images: [
            {
              url: "/opengraph-image.jpg",
              width: 1200,
              height: 630,
              alt: siteConfig.name,
              type: "image/jpeg",
            },
          ],
        },
        twitter: {
          card: "summary_large_image",
          title: "Chat Not Found | One Chat",
          description: "The requested chat thread could not be found or is private.",
          images: ["/opengraph-image.jpg"],
        },
      };
    }

    const firstUserMessage = chat.messages.find(
      (msg) => msg.role === "user"
    )?.content;

    const description = firstUserMessage
      ? typeof firstUserMessage === "string"
        ? firstUserMessage.slice(0, 160) +
          (firstUserMessage.length > 160 ? "..." : "")
        : "Shared AI conversation"
      : "Shared AI conversation";

    const title = chat.thread.title || "Shared Chat";
    const fullTitle = `${title} | One Chat`;

    return {
      title: fullTitle,
      description,
      openGraph: {
        title: fullTitle,
        description,
        type: "article",
        url: `/share/${id}`,
        siteName: siteConfig.name,
        images: [
          {
            url: "/opengraph-image.jpg",
            width: 1200,
            height: 630,
            alt: siteConfig.name,
            type: "image/jpeg",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: fullTitle,
        description,
        images: ["/opengraph-image.jpg"],
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch (_error) {
    return {
      title: "Chat Not Found | One Chat",
      description: "The requested chat thread could not be found.",
      openGraph: {
        title: "Chat Not Found | One Chat",
        description: "The requested chat thread could not be found.",
        type: "article",
        url: `/share/${id}`,
        siteName: siteConfig.name,
        images: [
          {
            url: "/opengraph-image.jpg",
            width: 1200,
            height: 630,
            alt: siteConfig.name,
            type: "image/jpeg",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Chat Not Found | One Chat",
        description: "The requested chat thread could not be found.",
        images: ["/opengraph-image.jpg"],
      },
    };
  }
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
    <div className="flex h-dvh w-full flex-col items-center justify-center">
      <Chat
        threadId={id}
        initialMessages={messagesWithMetadata}
        initialChatModel={resolvedInitialModel}
        initialVisibilityType={chat.thread?.visibility}
        isReadonly={true}
        autoResume={true}
      />
    </div>
  );
};

export default SharePage;
