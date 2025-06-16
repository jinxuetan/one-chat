import { buttonVariants } from "@workspace/ui/components/button";
import {
  Sidebar,
  SidebarFooter,
  SidebarHeader,
} from "@workspace/ui/components/sidebar";
import Image from "next/image";
import Link from "next/link";
import { UserButton } from "../auth/user-button";
import { BYOKModel } from "../byok/model";
import { SidebarContent } from "./sidebar-content";
import { SidebarActions } from "./sidebar-header";

export const AppSidebar = () => {
  return (
    <Sidebar variant="sidebar">
      <SidebarHeader className="relative m-1 mb-0 flex flex-col gap-2 space-y-1 py-1">
        <SidebarActions />
        <div className="flex shrink-0 items-center justify-center py-3 text-lg text-muted-foreground transition-opacity delay-75 duration-75">
          <Image
            src="/assets/one-chat-logo.svg"
            alt="OneChat"
            width={100}
            height={20}
            className="transition-all duration-200 dark:invert"
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
        <BYOKModel />
        <UserButton />
      </SidebarFooter>
    </Sidebar>
  );
};
