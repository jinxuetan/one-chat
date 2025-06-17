import { Chat } from "@/components/chat";
import { getPartialThreadData } from "@/lib/actions/partial-share";
import type { Model } from "@/lib/ai";
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
        siteName: "One Chat",
      },
      twitter: {
        card: "summary",
        title: fullTitle,
        description,
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
