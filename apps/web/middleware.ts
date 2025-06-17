import type { Session } from "better-auth";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const response = await fetch(
    `${request.nextUrl.origin}/api/auth/get-session`,
    {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    }
  );

  const session = (await response.json()) as {
    session: Session;
  };

  if (!session) return NextResponse.redirect(new URL("/auth", request.url));

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|auth|trpc|health|assets|site.webmanifest|share|partial).*)",
  ],
};
