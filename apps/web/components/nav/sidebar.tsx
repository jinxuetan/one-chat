import { Button, buttonVariants } from "@workspace/ui/components/button";
import {
  Sidebar,
  SidebarFooter,
  SidebarHeader,
} from "@workspace/ui/components/sidebar";
import { PanelLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { UserButton } from "../auth/user-button";
import { SidebarContent } from "./sidebar-content";

export const AppSidebar = () => {
  return (
    <Sidebar variant="floating">
      <SidebarHeader className="relative m-1 mb-0 flex flex-col gap-2 space-y-1 py-1">
        <div className="pointer-events-auto fixed top-safe-offset-2 left-4 z-50 flex flex-row gap-0.5 p-1">
          <Button variant="ghost" size="icon">
            <PanelLeft className="size-4" />
          </Button>
        </div>
        <div className="flex shrink-0 items-center justify-center py-3 text-lg text-muted-foreground transition-opacity delay-75 duration-75">
          <Image
            src="/assets/one-chat-logo.svg"
            alt="OneChat"
            width={100}
            height={20}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Link href="/" className={buttonVariants()}>
            New Chat
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent />
      <SidebarFooter>
        <UserButton />
      </SidebarFooter>
    </Sidebar>
  );
};
