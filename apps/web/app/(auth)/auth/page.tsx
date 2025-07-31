import { OAuthButton } from "@/components/auth/oauth-button";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";

const AuthPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.session) return redirect("/");

  return (
    <main className="flex h-screen w-screen" role="main">
      <section
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden border-r border-border/60"
        aria-label="Application branding"
      >
        <Image
          src="/assets/dark-bg.webp"
          alt="OneChat application background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/20" />
        <header className="absolute top-8 left-8 z-10">
          <Image
            src="/assets/one-chat-logo.svg"
            alt="OneChat logo"
            width={120}
            height={24}
            quality={100}
            className="invert"
            priority
          />
        </header>
      </section>

      <section
        className="w-full lg:w-1/2 flex items-center justify-center bg-background p-8"
        aria-label="Authentication form"
      >
        <div className="space-y-4 w-full max-w-sm">
          <OAuthButton />
          <p className="text-center text-sm text-muted-foreground">
            By continuing, you agree to our{" "}
            <span className="underline">terms of service</span> and{" "}
            <span className="underline">privacy policy</span>.
          </p>
        </div>
      </section>
    </main>
  );
};

export default AuthPage;
