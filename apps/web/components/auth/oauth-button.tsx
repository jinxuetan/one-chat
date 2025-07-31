"use client";

import { signIn } from "@/lib/auth/client";
import { Button } from "@workspace/ui/components/button";
import { toast } from "@workspace/ui/components/sonner";
import { Loader } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const OAuthButton = () => {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    try {
      setIsPending(true);
      const response = await signIn.social({
        provider: "google",
      });
      if (response.error) {
        setIsPending(false);
        toast.error("Something went wrong here.");
      }
    } catch (_error) {
      setIsPending(false);
      toast.error("Something went wrong here.");
    }
    router.push("/");
  };

  return (
    <Button
      className="border w-full border-border bg-background py-6 text-foreground text-lg transition-all duration-200 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:border-border/60 dark:bg-card dark:hover:bg-accent/80"
      onClick={handleClick}
      disabled={isPending}
      variant="outline"
      aria-label="Continue with Google"
    >
      {isPending ? (
        <Loader className="mr-1 size-4.5 animate-spin text-muted-foreground" />
      ) : (
        <Image
          src="/assets/google-logo.svg"
          alt="Google"
          priority
          width={16}
          height={16}
          className="mr-1"
        />
      )}
      Continue with Google
    </Button>
  );
};
