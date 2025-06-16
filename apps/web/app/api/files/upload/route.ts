import { env } from "@/env";
import { auth } from "@/lib/auth/server";
import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      token: env.VERCEL_BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname) => {
        const session = await auth.api.getSession({
          headers: request.headers,
        });

        if (!session?.user?.id) {
          throw new Error("Unauthorized: Please sign in to upload files");
        }

        return {
          pathname,
          allowedContentTypes: [
            // Images
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/gif",
            // Documents
            "application/pdf",
            "text/plain",
            "text/markdown",
          ],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            userId: session.user.id,
            originalFilename: pathname,
            uploadedAt: new Date().toISOString(),
          }),
        };
      },
      // biome-ignore lint/suspicious/useAwait: <explanation>
      onUploadCompleted: async ({ tokenPayload }) => {
        const payload = JSON.parse(tokenPayload || "{}");
        console.info(
          `File uploaded: ${payload?.originalFilename} by ${payload?.userId}`
        );
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("/api/files/upload/route.ts: Error in POST:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}
