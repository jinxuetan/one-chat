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
      className="border w-full border-border bg-background py-5 sm:py-6 text-foreground text-base sm:text-lg font-medium transition-all duration-200 hover:bg-accent hover:border-accent-foreground/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:border-border/60 dark:bg-card dark:hover:bg-accent/80 shadow-sm hover:shadow-md"
      onClick={handleClick}
      disabled={isPending}
      variant="outline"
      aria-label="Continue with Google"
    >
      {isPending ? (
        <Loader className="mr-2 size-4 sm:size-4.5 animate-spin text-muted-foreground" />
      ) : (
        <Image
          src="/assets/google-logo.svg"
          alt="Google"
          priority
          width={18}
          height={18}
          className="mr-2"
        />
      )}
      Continue with Google
    </Button>
  );
};
