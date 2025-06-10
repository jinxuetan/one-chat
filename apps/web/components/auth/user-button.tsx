"use client";

import { signOut, useSession } from "@/lib/auth/client";
import { Button } from "@workspace/ui/components/button";
import { toast } from "@workspace/ui/components/sonner";
import { Loader, LogOut, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const UserButton = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const user = session?.user;

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const response = await signOut();
      if (response.error) toast.error("Failed to sign out");
      router.push("/auth");
    } catch (_error) {
      toast.error("Failed to sign out");
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-2 p-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? "User avatar"}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <div className="flex size-8 items-center justify-center rounded-full border bg-muted">
            <User className="size-4" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {user.name && (
            <p className="truncate font-medium text-sm">{user.name}</p>
          )}
          {user.email && (
            <p className="truncate text-muted-foreground text-xs">
              {user.email}
            </p>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleSignOut}
        aria-label="Log out"
      >
        {isLoading ? (
          <Loader className="size-4 animate-spin" />
        ) : (
          <LogOut className="size-4" />
        )}
      </Button>
    </div>
  );
};
