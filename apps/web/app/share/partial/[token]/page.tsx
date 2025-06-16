import { Chat } from "@/components/chat";
import { getPartialThreadData } from "@/lib/actions/partial-share";
import type { Model } from "@/lib/ai";
import { DEFAULT_CHAT_MODEL } from "@/lib/constants";
import { resolveInitialModel } from "@/lib/utils";
import type { MessageWithMetadata } from "@/types";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

interface PartialSharePageProps {
  params: Promise<{
    token: string;
  }>;
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
