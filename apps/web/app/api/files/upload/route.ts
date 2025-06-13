import { env } from "@/env";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { attachment } from "@/lib/db/schema/thread";
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
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          const payload = JSON.parse(tokenPayload || "{}");
          const userId = payload.userId;
          const originalFilename = payload.originalFilename;

          if (!userId) {
            throw new Error("Missing user ID in token payload");
          }

          await db.insert(attachment).values({
            userId,
            fileKey: blob.pathname,
            fileName:
              originalFilename ||
              blob.pathname.split("/").pop() ||
              blob.pathname,
            fileSize: 0,
            mimeType: blob.contentType || "application/octet-stream",
            attachmentType: blob.contentType?.startsWith("image/")
              ? "image"
              : "file",
            attachmentUrl: blob.url,
          });
        } catch (error) {
          throw new Error("Failed to store file metadata in database");
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}
