import { Chat } from "@/components/chat";
import { getPartialThreadData } from "@/lib/actions/partial-share";
import type { Model } from "@/lib/ai";
import { siteConfig } from "@/lib/config";
import { DEFAULT_CHAT_MODEL } from "@/lib/constants";
import { resolveInitialModel } from "@/lib/utils";
import type { MessageWithMetadata } from "@/types";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

interface PartialSharePageProps {
  params: Promise<{
    token: string;
  }>;
}

export async function generateMetadata({
  params,
}: PartialSharePageProps): Promise<Metadata> {
  const { token } = await params;

  try {
    const partialThreadData = await getPartialThreadData(token);

    if (!partialThreadData?.thread) {
      return {
        title: "Shared Chat Not Found | One Chat",
        description:
          "The requested partial chat share could not be found or has expired.",
        openGraph: {
          title: "Shared Chat Not Found | One Chat",
          description: "The requested partial chat share could not be found or has expired.",
          type: "article",
          url: `/share/partial/${token}`,
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
          title: "Shared Chat Not Found | One Chat",
          description: "The requested partial chat share could not be found or has expired.",
          images: ["/opengraph-image.jpg"],
        },
      };
    }

    // Get the first user message for description
    const firstUserMessage = partialThreadData.messages.find(
      (msg) => msg.role === "user"
    )?.content;

    // Create a truncated description from the first message
    const description = firstUserMessage
      ? typeof firstUserMessage === "string"
        ? firstUserMessage.slice(0, 160) +
          (firstUserMessage.length > 160 ? "..." : "")
        : "Shared AI conversation (partial)"
      : "Shared AI conversation (partial)";

    const title = partialThreadData.thread.title || "Shared Chat (Partial)";
    const fullTitle = `${title} | One Chat`;

    return {
      title: fullTitle,
      description,
      openGraph: {
        title: fullTitle,
        description,
        type: "article",
        url: `/share/partial/${token}`,
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
      title: "Shared Chat Not Found | One Chat",
      description: "The requested partial chat share could not be found.",
      openGraph: {
        title: "Shared Chat Not Found | One Chat",
        description: "The requested partial chat share could not be found.",
        type: "article",
        url: `/share/partial/${token}`,
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
        title: "Shared Chat Not Found | One Chat",
        description: "The requested partial chat share could not be found.",
        images: ["/opengraph-image.jpg"],
      },
    };
  }
}

const PartialSharePage = async ({ params }: PartialSharePageProps) => {
  const { token } = await params;

  const [partialThreadData] = await Promise.all([getPartialThreadData(token)]);

  if (!partialThreadData?.thread) return notFound();

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get("chat-model")?.value as
    | Model
    | undefined;

  const messagesWithMetadata =
    partialThreadData.messages as MessageWithMetadata[];
  const resolvedInitialModel = resolveInitialModel(
    messagesWithMetadata,
    chatModelFromCookie ?? null,
    DEFAULT_CHAT_MODEL
  );

  return (
    <div className="mx-auto flex h-dvh min-w-3xl flex-col items-center justify-center">
      <Chat
        threadId={partialThreadData.thread.id}
        initialMessages={messagesWithMetadata}
        initialChatModel={resolvedInitialModel}
        initialVisibilityType={partialThreadData.thread.visibility}
        isReadonly={true} // Partial shares are always readonly
        autoResume={false} // No auto-resume for partial shares
      />
    </div>
  );
};

export default PartialSharePage;
