import {
  Sidebar,
  SidebarFooter,
  SidebarHeader,
} from "@workspace/ui/components/sidebar";
import Image from "next/image";
import { UserButton } from "../auth/user-button";
import { BYOKModel } from "../byok/model";
import { InfoDialog } from "../settings/info-dialog";
import { NewChatButton } from "./new-chat-button";
import { SidebarContent } from "./sidebar-content";

export const AppSidebar = () => (
  <Sidebar variant="sidebar">
    <SidebarHeader className="relative m-1 mb-0 flex flex-col gap-2 space-y-1 py-1">
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
        <NewChatButton />
      </div>
    </SidebarHeader>
    <SidebarContent />
    <SidebarFooter className="flex items-center gap-2">
      <BYOKModel />
      <UserButton />
    </SidebarFooter>
  </Sidebar>
);
