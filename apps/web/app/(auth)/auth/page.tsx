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
        className="w-full lg:w-1/2 flex flex-col justify-center bg-background px-6 py-8 sm:px-8 lg:px-12 relative"
        aria-label="Authentication form"
      >
        <header className="lg:hidden mb-6 flex justify-center">
          <Image
            src="/assets/one-chat-logo.svg"
            alt="OneChat logo"
            width={140}
            height={28}
            quality={100}
            className="dark:invert"
            priority
          />
        </header>

        <div className="flex flex-col items-center space-y-8 w-full max-w-sm mx-auto">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
              Welcome to OneChat
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Access multiple AI models in one seamless experience
            </p>
          </div>

          <div className="w-full space-y-4">
            <OAuthButton />
          </div>

          <p className="text-center text-xs text-muted-foreground sm:text-sm px-4">
            By continuing, you agree to our{" "}
            <button className="underline underline-offset-4 hover:text-foreground transition-colors">
              terms of service
            </button>{" "}
            and{" "}
            <button className="underline underline-offset-4 hover:text-foreground transition-colors">
              privacy policy
            </button>
            .
          </p>
        </div>

        <div className="lg:hidden absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-primary/5 to-transparent rounded-full blur-3xl" />
        </div>
      </section>
    </main>
  );
};

export default AuthPage;
